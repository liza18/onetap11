import { Product, Retailer, ProductCategory } from "@/types/commerce";
import type { UserSettings } from "@/types/settings";
import { productSearchCache, searchHistory } from "./searchCache";

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`;

interface RawSearchProduct {
  name: string;
  description: string;
  price: number;
  retailer: string;
  category: string;
  deliveryEstimate: string;
  matchScore: number;
  rankReason: string;
  productUrl: string;
}

const VALID_CATEGORIES: ProductCategory[] = [
  "technology", "food", "home", "entertainment", "tools",
  "snacks", "badges", "tech", "decorations", "prizes", "stationery", "equipment", "other",
];

function normalizeRetailer(raw: string): Retailer {
  const lower = raw.toLowerCase();
  if (lower.includes("amazon")) return "amazon";
  if (lower.includes("walmart")) return "walmart";
  if (lower.includes("target")) return "target";
  if (lower.includes("best buy") || lower.includes("bestbuy")) return "bestbuy";
  if (lower.includes("ebay")) return "ebay";
  if (lower.includes("mercado") || lower.includes("mercadolibre")) return "mercadolibre";
  return "other";
}

function normalizeCategory(raw: string): ProductCategory {
  const lower = raw.toLowerCase();
  if (lower.includes("tech") || lower.includes("electronic") || lower.includes("computer") || lower.includes("phone")) return "technology";
  if (lower.includes("food") || lower.includes("snack") || lower.includes("drink") || lower.includes("beverage") || lower.includes("catering")) return "food";
  if (lower.includes("home") || lower.includes("furniture") || lower.includes("kitchen") || lower.includes("decor")) return "home";
  if (lower.includes("entertainment") || lower.includes("game") || lower.includes("music") || lower.includes("media")) return "entertainment";
  if (lower.includes("tool") || lower.includes("hardware") || lower.includes("equip")) return "tools";
  if (lower.includes("badge") || lower.includes("lanyard") || lower.includes("tag") || lower.includes("wristband")) return "badges";
  if (lower.includes("prize") || lower.includes("award") || lower.includes("gift") || lower.includes("trophy")) return "prizes";
  if (lower.includes("station") || lower.includes("pen") || lower.includes("paper") || lower.includes("notebook")) return "stationery";
  if (lower.includes("projector") || lower.includes("screen") || lower.includes("speaker") || lower.includes("microphone")) return "equipment";
  if (lower.includes("banner") || lower.includes("led") || lower.includes("balloon") || lower.includes("light") || lower.includes("flower")) return "decorations";
  if (VALID_CATEGORIES.includes(raw as ProductCategory)) return raw as ProductCategory;
  return "other";
}

export function extractSearchMarkers(text: string): string[] {
  const regex = /\[SEARCH:\s*(.+?)\]/g;
  const queries: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    queries.push(match[1].trim());
  }
  return queries;
}

export function stripSearchMarkers(text: string): string {
  return text.replace(/\[SEARCH:\s*.+?\]\n?/g, "").trim();
}

function normalizeProducts(
  rawProducts: RawSearchProduct[],
  settings?: UserSettings
): Product[] {
  const disabledRetailers = new Set(
    settings?.retailers
      ?.filter((r) => !r.enabled)
      .map((r) => r.id) ?? []
  );

  return rawProducts
    .map((raw, index) => ({
      id: `web-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      name: raw.name,
      description: raw.description || "",
      price: typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price)) || 0,
      retailer: normalizeRetailer(raw.retailer),
      category: normalizeCategory(raw.category),
      deliveryEstimate: raw.deliveryEstimate || "2-3 days",
      matchScore: Math.min(100, Math.max(0, raw.matchScore || 80)),
      rankReason: raw.rankReason || "",
      productUrl: raw.productUrl || undefined,
    }))
    .filter((p) => !disabledRetailers.has(p.retailer));
}

/**
 * Progressive search: calls onPartialResults as cached results become available,
 * then fetches remaining queries from the network.
 */
export async function searchProductsProgressive(
  queries: string[],
  userContext?: string,
  settings?: UserSettings,
  onPartialResults?: (products: Product[], fromCache: boolean) => void
): Promise<Product[]> {
  if (queries.length === 0) return [];

  const limitedQueries = queries.slice(0, 4);
  const cacheKey = limitedQueries.sort().join("|");

  // Track search history
  for (const q of limitedQueries) {
    searchHistory.add(q);
  }

  // 1. Check cache first — instant response
  const cached = productSearchCache.get(cacheKey);
  if (cached) {
    const products = normalizeProducts(cached, settings);
    onPartialResults?.(products, true);
    return products;
  }

  // 2. Check individual query caches for partial results
  const cachedResults: RawSearchProduct[] = [];
  const uncachedQueries: string[] = [];

  for (const q of limitedQueries) {
    const qCached = productSearchCache.get(q);
    if (qCached) {
      cachedResults.push(...qCached);
    } else {
      uncachedQueries.push(q);
    }
  }

  // Emit partial cached results immediately
  if (cachedResults.length > 0) {
    onPartialResults?.(normalizeProducts(cachedResults, settings), true);
  }

  // 3. Fetch uncached queries from network
  if (uncachedQueries.length === 0) {
    const products = normalizeProducts(cachedResults, settings);
    productSearchCache.set(cacheKey, cachedResults);
    return products;
  }

  try {
    console.log("Searching (progressive):", uncachedQueries);

    const resp = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        queries: uncachedQueries,
        userContext: userContext || "Shopping",
        country: settings?.country || "us",
        currency: settings?.currency || "USD",
      }),
    });

    if (!resp.ok) {
      console.warn("Product search failed:", resp.status);
      return normalizeProducts(cachedResults, settings);
    }

    const data = await resp.json();
    const rawProducts: RawSearchProduct[] = data.products || [];

    // Cache individual queries and combined result
    productSearchCache.set(cacheKey, [...cachedResults, ...rawProducts]);
    for (const q of uncachedQueries) {
      // Cache per-query results (approximate: store all for each)
      productSearchCache.set(q, rawProducts);
    }

    const allProducts = normalizeProducts([...cachedResults, ...rawProducts], settings);
    onPartialResults?.(allProducts, false);

    return allProducts;
  } catch (err) {
    console.error("Product search error:", err);
    return normalizeProducts(cachedResults, settings);
  }
}

/** Legacy synchronous search (kept for backward compatibility) */
export async function searchProducts(
  queries: string[],
  userContext?: string,
  settings?: UserSettings
): Promise<Product[]> {
  return searchProductsProgressive(queries, userContext, settings);
}
