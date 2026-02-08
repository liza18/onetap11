const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COUNTRY_DOMAINS: Record<string, string[]> = {
  us: ["amazon.com", "walmart.com", "target.com", "bestbuy.com"],
  mx: ["amazon.com.mx", "mercadolibre.com.mx", "liverpool.com.mx", "coppel.com"],
  ca: ["amazon.ca", "walmart.ca", "bestbuy.ca", "canadiantire.ca"],
};

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  mx: "MXN",
  ca: "CAD",
};

const EXTRACT_SYSTEM_PROMPT = `You extract product data from scraped web pages. You MUST only use URLs that appear in the provided content — never invent or guess URLs.

For each product found, extract:
- name, description, price, retailer, category, delivery estimate, match score (0-100), rank reason
- productUrl: MUST be copied exactly from the scraped content. Only use URLs you can see in the text. If no direct product URL is visible, use the page URL provided.

Categories: snacks/badges/tech/decorations/prizes/stationery/equipment/technology/food/home/entertainment/tools/other.
Retailers: amazon/walmart/target/bestbuy/ebay/mercadolibre/liverpool/coppel/other.

CRITICAL RULES:
1. NEVER fabricate or construct URLs. Only use URLs that literally appear in the provided text.
2. If a URL in the content points to a product page, use that exact URL.
3. If no product-specific URL exists, use the source page URL as productUrl.
4. Only include products that have a visible price in the content.`;

const extractProductsTool = {
  type: "function" as const,
  function: {
    name: "extract_products",
    description: "Extract structured product data from scraped web content",
    parameters: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Product name" },
              description: { type: "string", description: "Short product description" },
              price: { type: "number", description: "Price in the user's local currency" },
              retailer: { type: "string", description: "Retailer name" },
              category: { type: "string", enum: ["snacks", "badges", "tech", "decorations", "prizes", "stationery", "equipment", "technology", "food", "home", "entertainment", "tools", "other"] },
              deliveryEstimate: { type: "string", description: "Estimated delivery time" },
              matchScore: { type: "number", description: "How well this matches user needs, 0-100" },
              rankReason: { type: "string", description: "Why this product is recommended" },
              productUrl: { type: "string", description: "URL copied exactly from the scraped content. NEVER invent URLs." },
            },
            required: ["name", "description", "price", "retailer", "category", "deliveryEstimate", "matchScore", "rankReason", "productUrl"],
            additionalProperties: false,
          },
        },
      },
      required: ["products"],
      additionalProperties: false,
    },
  },
};

/**
 * Search using Firecrawl with site-specific queries to get actual product pages.
 */
async function searchRetailerProducts(
  query: string,
  domains: string[],
  apiKey: string
): Promise<{ url: string; title: string; markdown: string }[]> {
  // Do a site-specific search for each top domain + a general search
  const searches = [
    // Site-specific searches for top 2 retailers
    ...domains.slice(0, 2).map((domain) => ({
      searchQuery: `site:${domain} ${query}`,
      limit: 3,
    })),
    // General product search
    {
      searchQuery: `${query} buy online`,
      limit: 4,
    },
  ];

  const results: { url: string; title: string; markdown: string }[] = [];

  const promises = searches.map(async ({ searchQuery, limit }) => {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          limit,
          scrapeOptions: {
            formats: ["markdown", "links"],
          },
        }),
      });

      if (!response.ok) {
        console.error(`Firecrawl search failed for "${searchQuery}":`, response.status);
        return [];
      }

      const data = await response.json();
      const items = data.data || [];
      return items.map((item: any) => ({
        url: item.url || "",
        title: item.title || "",
        markdown: item.markdown || item.description || "",
      }));
    } catch (err) {
      console.error(`Search error for "${searchQuery}":`, err);
      return [];
    }
  });

  const allResults = await Promise.all(promises);
  for (const batch of allResults) {
    results.push(...batch);
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queries, userContext, country, currency } = await req.json();

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(
        JSON.stringify({ error: "Search queries are required", products: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured", products: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured", products: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userCountry = country || "us";
    const userCurrency = currency || CURRENCY_MAP[userCountry] || "USD";
    const domains = COUNTRY_DOMAINS[userCountry] || COUNTRY_DOMAINS["us"];

    console.log(`Searching products: country=${userCountry}, currency=${userCurrency}, queries:`, queries);

    // Search across retailers for each query (limit to 3 queries)
    const limitedQueries = queries.slice(0, 3);
    const allSearchResults = await Promise.all(
      limitedQueries.map((q: string) => searchRetailerProducts(q, domains, FIRECRAWL_API_KEY))
    );

    // Build rich context with actual URLs and content for AI extraction
    let searchContext = "";
    for (let i = 0; i < limitedQueries.length; i++) {
      const query = limitedQueries[i];
      const results = allSearchResults[i];
      searchContext += `\n### Query: "${query}"\n`;

      if (results.length === 0) {
        searchContext += "No results found.\n";
        continue;
      }

      for (const result of results) {
        searchContext += `\n**Page:** ${result.title}\n`;
        searchContext += `**Source URL:** ${result.url}\n`;
        // Include up to 2000 chars of markdown to capture product links and prices
        const content = result.markdown.slice(0, 2000);
        searchContext += `**Content:**\n${content}\n`;
        searchContext += "---\n";
      }
    }

    console.log(`Search context: ${searchContext.length} chars from ${allSearchResults.flat().length} pages`);

    // Use AI to extract structured products — emphasizing to use only real URLs from content
    const aiResponse = await fetch(
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
            { role: "system", content: EXTRACT_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Shopping context: ${userContext || "General shopping"}\nCurrency: ${userCurrency}\nPreferred stores: ${domains.join(", ")}\n\n## Scraped Web Content\n${searchContext}\n\nExtract real products with prices in ${userCurrency}. For productUrl, you MUST use a URL that appears verbatim in the content above. DO NOT invent or modify URLs. If a product page URL exists in the content (e.g. containing /dp/, /ip/, /p/, or a product slug), use it. Otherwise use the Source URL of the page where you found the product.`,
            },
          ],
          tools: [extractProductsTool],
          tool_choice: { type: "function", function: { name: "extract_products" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", products: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted", products: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI extraction error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Product extraction failed", products: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let products: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        products = parsed.products || [];
      } catch {
        console.error("Failed to parse product extraction");
      }
    }

    // Validate URLs — remove products with obviously fake/constructed URLs
    const allSourceUrls = allSearchResults.flat().map((r) => r.url);
    products = products.filter((p: any) => {
      if (!p.productUrl) return false;
      try {
        const url = new URL(p.productUrl);
        // Must be http(s)
        if (!url.protocol.startsWith("http")) return false;
        // Check if URL domain matches any known retailer or source
        const domain = url.hostname.replace("www.", "");
        const isKnownDomain = domains.some((d) => domain.includes(d.replace("www.", ""))) ||
          allSourceUrls.some((src) => {
            try { return new URL(src).hostname.replace("www.", "") === domain; } catch { return false; }
          });
        return isKnownDomain;
      } catch {
        return false;
      }
    });

    console.log(`Extracted ${products.length} validated products`);

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("product-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", products: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
