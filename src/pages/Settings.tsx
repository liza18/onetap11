import { useState } from "react";
import { ArrowLeft, Store, Brain, Palette, Shield, Bell, RotateCcw, Globe, ChevronDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import SettingsSection from "@/components/settings/SettingsSection";
import SegmentedControl from "@/components/settings/SegmentedControl";
import {
  COUNTRY_OPTIONS,
  COUNTRY_CURRENCY_MAP,
  CURRENCY_SYMBOLS,
  CountryCode,
} from "@/types/settings";
import type {
  DeliveryPriority,
  BudgetStrictness,
  TransparencyLevel,
  ProductBias,
  ThemeMode,
  AccentIntensity,
  AnimationLevel,
  ChartDetail,
} from "@/types/settings";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setCountry, resetSettings, clearHistory, exportData, deleteAccount } = useSettings();
  const { signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const toggleRetailer = (id: string) => {
    const next = settings.retailers.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    updateSettings({ retailers: next });
  };

  const handleCountryChange = async (code: CountryCode) => {
    await setCountry(code);
    setShowCountryDropdown(false);
    toast({ title: "Country updated", description: `Switched to ${COUNTRY_OPTIONS.find(c => c.code === code)?.label}. Retailers and currency updated.` });
  };

  const handleClearHistory = async () => {
    await clearHistory();
    toast({ title: "History cleared", description: "All conversations have been deleted." });
  };

  const handleExport = async () => {
    await exportData();
    toast({ title: "Data exported", description: "Your data has been downloaded." });
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteAccount();
    await signOut();
    toast({ title: "Account data deleted", description: "Your data has been removed." });
  };

  const handleReset = async () => {
    await resetSettings();
    toast({ title: "Settings reset", description: "All settings restored to defaults." });
  };

  const selectedCountryOption = COUNTRY_OPTIONS.find((c) => c.code === settings.country)!;
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="glass-heavy flex items-center justify-between px-4 sm:px-6 h-14 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-bold text-base tracking-tight">Settings</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs gap-1.5 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All
        </Button>
      </header>

      <ScrollArea className="flex-1 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20"
        >
          {/* Country & Currency */}
          <SettingsSection icon={Globe} title="Country & Currency" description="Your country determines available retailers and currency.">
            <div className="px-4 space-y-4">
              {/* Country Dropdown */}
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Country
                </label>
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full h-12 rounded-xl bg-secondary/50 border border-border/50 px-4 flex items-center justify-between text-sm font-medium hover:bg-secondary/70 transition-colors"
                >
                  <span className="text-base">{selectedCountryOption?.label}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showCountryDropdown ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showCountryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border/60 rounded-xl shadow-elevated overflow-hidden"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleCountryChange(c.code)}
                          className={`w-full px-4 py-3.5 flex items-center justify-between text-sm hover:bg-secondary/50 transition-colors ${
                            settings.country === c.code ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-base">{c.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {COUNTRY_CURRENCY_MAP[c.code]} {CURRENCY_SYMBOLS[COUNTRY_CURRENCY_MAP[c.code]]}
                            </span>
                          </div>
                          {settings.country === c.code && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency display */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">Currency</span>
                <span className="text-sm font-semibold">{settings.currency} {currencySymbol}</span>
              </div>
            </div>
          </SettingsSection>

          {/* Retailer Sources */}
          <SettingsSection icon={Store} title="Retailer Sources" description={`Retailers available in ${selectedCountryOption?.label}.`}>
            <div className="space-y-1">
              {settings.retailers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary/40 transition-colors"
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={() => toggleRetailer(r.id)}
                  />
                </div>
              ))}
            </div>
          </SettingsSection>

          {/* AI Behavior */}
          <SettingsSection icon={Brain} title="AI Behavior" description="Configure how the shopping agent makes decisions.">
            <div className="space-y-5 px-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Delivery Priority
                </label>
                <SegmentedControl
                  options={[
                    { value: "fastest", label: "Fastest" },
                    { value: "lowest-cost", label: "Cheapest" },
                    { value: "best-value", label: "Best Value" },
                    { value: "balanced", label: "Balanced" },
                  ]}
                  value={settings.deliveryPriority}
                  onChange={(v) => updateSettings({ deliveryPriority: v as DeliveryPriority })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Budget Strictness
                </label>
                <SegmentedControl
                  options={[
                    { value: "strict", label: "Strict" },
                    { value: "optimized", label: "Optimized" },
                    { value: "flexible", label: "Flexible" },
                  ]}
                  value={settings.budgetStrictness}
                  onChange={(v) => updateSettings({ budgetStrictness: v as BudgetStrictness })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Explanation Detail
                </label>
                <SegmentedControl
                  options={[
                    { value: "basic", label: "Basic" },
                    { value: "detailed", label: "Detailed" },
                    { value: "full-trace", label: "Full Trace" },
                  ]}
                  value={settings.transparencyLevel}
                  onChange={(v) => updateSettings({ transparencyLevel: v as TransparencyLevel })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Product Preference
                </label>
                <SegmentedControl
                  options={[
                    { value: "premium", label: "Premium" },
                    { value: "balanced", label: "Balanced" },
                    { value: "budget", label: "Budget" },
                  ]}
                  value={settings.productBias}
                  onChange={(v) => updateSettings({ productBias: v as ProductBias })}
                />
              </div>
            </div>
          </SettingsSection>

          {/* Interface */}
          <SettingsSection icon={Palette} title="Interface" description="Customize the look and feel.">
            <div className="space-y-5 px-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Theme
                </label>
                <SegmentedControl
                  options={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                  value={settings.themeMode}
                  onChange={(v) => updateSettings({ themeMode: v as ThemeMode })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Accent Intensity
                </label>
                <SegmentedControl
                  options={[
                    { value: "subtle", label: "Subtle" },
                    { value: "balanced", label: "Balanced" },
                    { value: "strong", label: "Strong" },
                  ]}
                  value={settings.accentIntensity}
                  onChange={(v) => updateSettings({ accentIntensity: v as AccentIntensity })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Animations
                </label>
                <SegmentedControl
                  options={[
                    { value: "minimal", label: "Minimal" },
                    { value: "normal", label: "Normal" },
                    { value: "enhanced", label: "Enhanced" },
                  ]}
                  value={settings.animationLevel}
                  onChange={(v) => updateSettings({ animationLevel: v as AnimationLevel })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Chart Detail
                </label>
                <SegmentedControl
                  options={[
                    { value: "simple", label: "Simple" },
                    { value: "detailed", label: "Detailed" },
                  ]}
                  value={settings.chartDetail}
                  onChange={(v) => updateSettings({ chartDetail: v as ChartDetail })}
                />
              </div>
            </div>
          </SettingsSection>

          {/* Privacy & Data */}
          <SettingsSection icon={Shield} title="Privacy & Data" description="Manage your data and privacy preferences.">
            <div className="space-y-1">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary/40 transition-colors">
                <div>
                  <span className="text-sm font-medium">History Tracking</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Save conversation history</p>
                </div>
                <Switch
                  checked={settings.historyEnabled}
                  onCheckedChange={(v) => updateSettings({ historyEnabled: v })}
                />
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2 px-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm rounded-xl h-10"
                onClick={handleClearHistory}
              >
                Clear Conversation History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm rounded-xl h-10"
                onClick={handleExport}
              >
                Export My Data
              </Button>
              <Button
                variant={confirmDelete ? "destructive" : "outline"}
                size="sm"
                className="w-full justify-start text-sm rounded-xl h-10"
                onClick={handleDeleteAccount}
              >
                {confirmDelete ? "Confirm: Delete All Data" : "Delete Account Data"}
              </Button>
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={Bell} title="Notifications" description="Control which updates you receive.">
            <div className="space-y-1">
              {[
                { key: "notifyDeliveryUpdates" as const, label: "Delivery Updates", desc: "Get notified about delivery status changes" },
                { key: "notifyPriceDrops" as const, label: "Price Drops", desc: "Alerts when items in your cart drop in price" },
                { key: "notifyAlternatives" as const, label: "Better Alternatives", desc: "Suggestions for better options" },
                { key: "notifyCartOptimization" as const, label: "Cart Optimization", desc: "Tips to optimize your cart" },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary/40 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(v) => updateSettings({ [key]: v })}
                  />
                </div>
              ))}
            </div>
          </SettingsSection>
        </motion.div>
      </ScrollArea>
    </div>
  );
};

export default Settings;
