import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserSettings, DEFAULT_SETTINGS, RETAILERS_BY_COUNTRY, COUNTRY_CURRENCY_MAP, CountryCode } from "@/types/settings";

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  setCountry: (country: CountryCode) => Promise<void>;
  resetSettings: () => Promise<void>;
  clearHistory: () => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from DB
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    loadSettings();
  }, [user]);

  // Apply theme mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.themeMode]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.settings) {
        const stored = data.settings as Record<string, unknown>;
        // Ensure retailers match the stored country
        const country = (stored.country as CountryCode) || "us";
        const merged = { ...DEFAULT_SETTINGS, ...stored, country } as UserSettings;
        // If retailers don't exist or are from old format, regenerate from country
        if (!merged.retailers || !Array.isArray(merged.retailers) || merged.retailers.length === 0) {
          merged.retailers = RETAILERS_BY_COUNTRY[country];
        }
        setSettings(merged);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistSettings = useCallback(
    async (newSettings: UserSettings) => {
      if (!user) return;
      const settingsJson = JSON.parse(JSON.stringify(newSettings));
      await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, settings: settingsJson },
          { onConflict: "user_id" }
        );
    },
    [user]
  );

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      await persistSettings(next);
    },
    [settings, persistSettings]
  );

  /** Change country — also updates currency and resets retailers to that country's defaults */
  const setCountry = useCallback(
    async (country: CountryCode) => {
      const next: UserSettings = {
        ...settings,
        country,
        currency: COUNTRY_CURRENCY_MAP[country],
        retailers: RETAILERS_BY_COUNTRY[country],
      };
      setSettings(next);
      await persistSettings(next);
    },
    [settings, persistSettings]
  );

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);

    if (convos && convos.length > 0) {
      const ids = convos.map((c) => c.id);
      await supabase.from("conversation_messages").delete().in("conversation_id", ids);
      await supabase.from("conversations").delete().eq("user_id", user.id);
    }
  }, [user]);

  const exportData = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*, conversation_messages(*)")
      .eq("user_id", user.id);

    const blob = new Blob(
      [JSON.stringify({ settings, conversations: convos }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentcart-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [user, settings]);

  const deleteAccount = useCallback(async () => {
    await clearHistory();
    await supabase.from("user_settings").delete().eq("user_id", user?.id ?? "");
    await supabase.from("profiles").delete().eq("user_id", user?.id ?? "");
  }, [user, clearHistory]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        setCountry,
        resetSettings,
        clearHistory,
        exportData,
        deleteAccount,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
