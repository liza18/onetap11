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
  settings?: UserSettings,
  searchGroup?: string
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
      searchGroup: searchGroup || undefined,
    }))
    .filter((p) => !disabledRetailers.has(p.retailer));
}

/**
 * Progressive search: calls onPartialResults as cached results become available,
 * then fetches remaining queries from the network.
 * Each query tags its products with a searchGroup for grouped navigation.
 */
export async function searchProductsProgressive(
  queries: string[],
  userContext?: string,
  settings?: UserSettings,
  onPartialResults?: (products: Product[], fromCache: boolean) => void
): Promise<Product[]> {
  if (queries.length === 0) return [];

  const limitedQueries = queries.slice(0, 6);

  // Track search history
  for (const q of limitedQueries) {
    searchHistory.add(q);
  }

  // 1. Check individual query caches for partial results
  const cachedProducts: Product[] = [];
  const uncachedQueries: string[] = [];

  for (const q of limitedQueries) {
    const qCached = productSearchCache.get(q);
    if (qCached) {
      cachedProducts.push(...normalizeProducts(qCached, settings, q));
    } else {
      uncachedQueries.push(q);
    }
  }

  // Emit partial cached results immediately
  if (cachedProducts.length > 0) {
    onPartialResults?.(cachedProducts, true);
  }

  // 2. If everything cached, return early
  if (uncachedQueries.length === 0) {
    return cachedProducts;
  }

  // 3. Fetch uncached queries from network — fetch each query separately to tag groups
  try {
    console.log("Searching (progressive):", uncachedQueries);

    const fetchPromises = uncachedQueries.map(async (query) => {
      try {
        const resp = await fetch(SEARCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            queries: [query],
            userContext: userContext || "Shopping",
            country: settings?.country || "us",
            currency: settings?.currency || "USD",
          }),
        });

        if (!resp.ok) {
          console.warn(`Product search failed for "${query}":`, resp.status);
          return [];
        }

        const data = await resp.json();
        const rawProducts: RawSearchProduct[] = data.products || [];

        // Cache per-query
        productSearchCache.set(query, rawProducts);

        // Tag with searchGroup
        const products = normalizeProducts(rawProducts, settings, query);

        // Emit incrementally
        if (products.length > 0) {
          onPartialResults?.(products, false);
        }

        return products;
      } catch (err) {
        console.error(`Search error for "${query}":`, err);
        return [];
      }
    });

    const allNetworkResults = await Promise.all(fetchPromises);
    const networkProducts = allNetworkResults.flat();

    return [...cachedProducts, ...networkProducts];
  } catch (err) {
    console.error("Product search error:", err);
    return cachedProducts;
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
