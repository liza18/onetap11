const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are **AgentCart**, a brief and direct AI shopping assistant.

## CRITICAL: KEEP IT SHORT
- Respond in 2-4 short sentences max
- Ask only 1 question at a time
- No bullet lists longer than 5 items
- Never repeat info the user already gave you
- Skip greetings and filler phrases

## FLOW
1. Ask what they need (1 sentence)
2. Specific item → ask 1 key clarifier, then search immediately
3. Event → numbered emoji category list, let them pick
4. Search: use 2-3 [SEARCH: query] markers per item
5. Point user to product panel. Move on.
6. After all → brief total summary

## SEARCH MARKERS
[SEARCH: query] triggers search. Hidden from user. 2-3 per item.`;

const COUNTRY_LABELS: Record<string, string> = {
  us: "United States",
  mx: "Mexico",
  ca: "Canada",
};

const COUNTRY_STORES: Record<string, string> = {
  us: "Amazon US, Walmart, Target, Best Buy, Costco, eBay, Home Depot, Macy's, Nordstrom",
  mx: "Amazon México, Mercado Libre, Liverpool, Coppel, Elektra, Soriana, Costco México, Sam's Club México, Palacio de Hierro",
  ca: "Amazon Canada, Walmart Canada, Canadian Tire, Best Buy Canada, Costco Canada, Hudson's Bay, Shoppers Drug Mart, Loblaws, Staples Canada",
};

function buildSettingsContext(settings: any): string {
  if (!settings) return "";

  const parts: string[] = [];

  // Country & currency
  const country = settings.country || "us";
  const currency = settings.currency || "USD";
  const countryLabel = COUNTRY_LABELS[country] || "United States";
  const countryStores = COUNTRY_STORES[country] || COUNTRY_STORES["us"];
  
  parts.push(`**User's country**: ${countryLabel}. **Currency**: ${currency}. Always show prices in ${currency}.`);
  parts.push(`**Available stores in ${countryLabel}**: ${countryStores}. Only recommend products from these stores or similar regional retailers.`);

  // Retailer preferences
  if (settings.retailers) {
    const enabled = settings.retailers.filter((r: any) => r.enabled).map((r: any) => r.label);
    const disabled = settings.retailers.filter((r: any) => !r.enabled).map((r: any) => r.label);
    if (disabled.length > 0) {
      parts.push(`**Retailer restrictions**: Only search from: ${enabled.join(", ")}. Do NOT recommend products from: ${disabled.join(", ")}.`);
    }
  }

  // Delivery priority
  if (settings.deliveryPriority) {
    const map: Record<string, string> = {
      "fastest": "Prioritize fastest delivery times above all else.",
      "lowest-cost": "Prioritize lowest shipping costs.",
      "best-value": "Balance delivery speed with cost for best overall value.",
      "balanced": "Consider all delivery factors equally."
    };
    parts.push(map[settings.deliveryPriority] || "");
  }

  // Budget strictness
  if (settings.budgetStrictness) {
    const map: Record<string, string> = {
      "strict": "NEVER exceed the user's stated budget, even if better options exist slightly above it.",
      "flexible": "You may suggest options slightly above budget if quality is significantly better.",
      "optimized": "Stay close to budget but prioritize value over strict limits."
    };
    parts.push(map[settings.budgetStrictness] || "");
  }

  // Transparency level
  if (settings.transparencyLevel) {
    const map: Record<string, string> = {
      "basic": "Keep explanations brief — just state the recommendation.",
      "detailed": "Provide clear reasoning for each recommendation with key comparison points.",
      "full-trace": "Give full decision trace: scoring logic, weight factors, and detailed trade-off analysis for every recommendation."
    };
    parts.push(map[settings.transparencyLevel] || "");
  }

  // Product bias
  if (settings.productBias) {
    const map: Record<string, string> = {
      "premium": "Lean toward premium, high-quality products even if more expensive.",
      "budget": "Lean toward budget-friendly options and deals.",
      "balanced": "Balance quality and price equally."
    };
    parts.push(map[settings.productBias] || "");
  }

  if (parts.length === 0) return "";
  return "\n\n## USER PREFERENCES (apply these to all recommendations)\n" + parts.filter(Boolean).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, settings } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build dynamic system prompt based on user settings
    const settingsContext = buildSettingsContext(settings);
    const systemPrompt = BASE_SYSTEM_PROMPT + settingsContext;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("shopping-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
