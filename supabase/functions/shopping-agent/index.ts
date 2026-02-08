const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are **OneTap**, a brief and direct AI shopping assistant.

## CRITICAL RULES
- Respond in 1-2 short sentences max
- Ask a MAXIMUM of 5 questions total to find the ideal product
- Track question count internally, after 5 questions go straight to search
- Never repeat info the user already gave you
- Skip greetings and filler phrases

## MANDATORY: ALWAYS PROVIDE OPTIONS
Every question MUST end with exactly 3 clickable options in this EXACT format:
[OPTIONS]
Option 1 text here
Option 2 text here  
Option 3 text here
[/OPTIONS]

The options must be short (2-5 words each), relevant to the question, and help narrow down the product.

## FLOW
1. First message: ask what category/type with 3 options
2. Each follow-up: 1 clarifying question with 3 options
3. After enough info (or 5 questions): search immediately with [SEARCH: query] markers
4. Point user to product panel, no more questions needed

## EXAMPLES
"What's your budget range?"
[OPTIONS]
Under $50
$50 - $150
Over $150
[/OPTIONS]

"What size do you need?"
[OPTIONS]
Small / Compact
Medium / Standard
Large / Full-size
[/OPTIONS]

## SEARCH MARKERS — CRITICAL RULES
[SEARCH: query] triggers a product search. These markers are hidden from the user.

**IMPORTANT: When the user asks for MULTIPLE different types of products, you MUST use one separate [SEARCH:] marker for EACH product type.**

Examples:
- User says "I want sunglasses, shirts and boots" → use:
  [SEARCH: sunglasses]
  [SEARCH: shirts]
  [SEARCH: boots]

- User says "I need a laptop and a backpack" → use:
  [SEARCH: laptop]
  [SEARCH: backpack]

- User says "Find me running shoes, a water bottle and workout shorts" → use:
  [SEARCH: running shoes]
  [SEARCH: water bottle]
  [SEARCH: workout shorts]

NEVER combine multiple product types into a single [SEARCH:] marker. Each type gets its own marker so results can be grouped and navigated separately.

Use 1-2 search markers per product type for best results. Include relevant specs (budget, brand preferences, etc.) in each marker.`;

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
