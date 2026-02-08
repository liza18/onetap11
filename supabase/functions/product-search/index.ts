const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COUNTRY_DOMAINS: Record<string, string> = {
  us: "US stores (amazon.com, walmart.com, target.com, bestbuy.com, costco.com, etc.)",
  mx: "Mexican stores (amazon.com.mx, mercadolibre.com.mx, liverpool.com.mx, coppel.com, elektra.com.mx, etc.)",
  ca: "Canadian stores (amazon.ca, walmart.ca, canadiantire.ca, bestbuy.ca, costco.ca, etc.)",
};

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  mx: "MXN",
  ca: "CAD",
};

const EXTRACT_SYSTEM_PROMPT = `Extract products from search results. For each: name, description, price, retailer, category, delivery estimate, match score (0-100), rank reason, URL.
Rules: Only real products with price. Use actual URLs. Categories: snacks/badges/tech/decorations/prizes/stationery/equipment/technology/food/home/entertainment/tools/other. Retailers: amazon/walmart/target/bestbuy/ebay/mercadolibre/other.`;

const extractProductsTool = {
  type: "function" as const,
  function: {
    name: "extract_products",
    description: "Extract structured product data from web search results",
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
              retailer: { type: "string", description: "Retailer name (amazon, walmart, target, bestbuy, ebay, mercadolibre, or other)" },
              category: { type: "string", enum: ["snacks", "badges", "tech", "decorations", "prizes", "stationery", "equipment", "technology", "food", "home", "entertainment", "tools", "other"], description: "Product category" },
              deliveryEstimate: { type: "string", description: "Estimated delivery time" },
              matchScore: { type: "number", description: "How well this matches user needs, 0-100" },
              rankReason: { type: "string", description: "Why this product is recommended" },
              productUrl: { type: "string", description: "URL to the product page" },
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
    const countryStores = COUNTRY_DOMAINS[userCountry] || COUNTRY_DOMAINS["us"];

    console.log(`Searching for products: country=${userCountry}, currency=${userCurrency}, queries:`, queries);

    // Search for products using Firecrawl (parallel searches)
    const searchPromises = queries.map(async (query: string) => {
      try {
        // Add country-specific search context
        const countrySearchSuffix = userCountry === "mx" ? " Mexico comprar precio" :
                                     userCountry === "ca" ? " Canada buy price CAD" :
                                     " buy price USD";
        
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `buy ${query}${countrySearchSuffix}`,
            limit: 5,
          }),
        });

        if (!response.ok) {
          console.error(`Firecrawl search failed for "${query}":`, response.status);
          return { query, results: [] };
        }

        const data = await response.json();
        return { query, results: data.data || [] };
      } catch (err) {
        console.error(`Search error for "${query}":`, err);
        return { query, results: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Compile search results into a text block for AI extraction
    let searchContext = "## Web Search Results for Product Research\n\n";
    for (const { query, results } of searchResults) {
      searchContext += `### Search: "${query}"\n`;
      if (results.length === 0) {
        searchContext += "No results found.\n\n";
        continue;
      }
      for (const result of results) {
        searchContext += `- **${result.title || "Untitled"}**\n`;
        searchContext += `  URL: ${result.url || "N/A"}\n`;
        searchContext += `  ${result.description || ""}\n`;
        if (result.markdown) {
          searchContext += `  Content: ${result.markdown.slice(0, 500)}\n`;
        }
        searchContext += "\n";
      }
    }

    console.log("Search context compiled, extracting products with AI...");

    // Use AI to extract structured product data from search results
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
              content: `User is shopping from: ${countryStores}\nCurrency: ${userCurrency}\nUser context: ${userContext || "Shopping"}\n\n${searchContext}\n\nExtract all real products with their actual URLs, prices in ${userCurrency}, and details. Prefer products from ${countryStores}. Only include products you can verify from the search results.`,
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

    console.log(`Extracted ${products.length} real products`);

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
