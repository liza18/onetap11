const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_TIMEOUT_MS = 15_000;

async function firecrawlScrape(
  url: string,
  apiKey: string,
  formats: string[],
  waitFor = 0
): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats, waitFor, onlyMainContent: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Firecrawl scrape failed (${formats.join(",")}): ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn(`Firecrawl timed out for ${url} (formats: ${formats.join(",")})`);
    } else {
      console.error("Firecrawl fetch error:", e);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractOgImage(data: any): string | null {
  return (
    data?.data?.metadata?.ogImage ||
    data?.data?.metadata?.image ||
    data?.metadata?.ogImage ||
    data?.metadata?.image ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required", imageUrl: null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured", imageUrl: null }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching thumbnail for:", url);

    // Phase 1: Fast metadata-only scrape (no rendering needed)
    const metaData = await firecrawlScrape(url, FIRECRAWL_API_KEY, ["links"]);
    const ogImage = extractOgImage(metaData);

    if (ogImage) {
      console.log("Thumbnail result: ogImage");
      return new Response(
        JSON.stringify({ imageUrl: ogImage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Phase 2: Fall back to screenshot (slower, renders the page)
    const screenshotData = await firecrawlScrape(url, FIRECRAWL_API_KEY, ["screenshot"], 1500);
    const screenshot = screenshotData?.data?.screenshot || screenshotData?.screenshot;

    if (screenshot) {
      const imageUrl =
        screenshot.startsWith("http") || screenshot.startsWith("data:")
          ? screenshot
          : `data:image/png;base64,${screenshot}`;

      console.log("Thumbnail result: screenshot");
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Thumbnail result: none");
    return new Response(
      JSON.stringify({ imageUrl: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("product-thumbnail error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", imageUrl: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
