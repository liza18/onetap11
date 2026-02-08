/**
 * A*-inspired heuristic ranking + efficient sorting for search results.
 * 
 * Uses a composite heuristic score h(n) to prioritize results:
 *   f(n) = g(n) + h(n)
 *   g(n) = actual match score from search
 *   h(n) = heuristic estimate based on price competitiveness, delivery speed, retailer trust
 * 
 * Results with higher f(n) are surfaced first — minimizing user effort to find best products.
 */

import { Product, SortOption } from "@/types/commerce";

interface RankingWeights {
  matchScore: number;
  priceCompetitiveness: number;
  deliverySpeed: number;
  retailerTrust: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  matchScore: 0.4,
  priceCompetitiveness: 0.25,
  deliverySpeed: 0.2,
  retailerTrust: 0.15,
};

/** Retailer trust scores (0-100) based on brand recognition */
const RETAILER_TRUST: Record<string, number> = {
  amazon: 92,
  walmart: 85,
  target: 82,
  bestbuy: 88,
  ebay: 70,
  mercadolibre: 80,
  other: 50,
};

/** Parse delivery estimate into days (lower = better) */
function parseDeliveryDays(estimate: string): number {
  const match = estimate.match(/(\d+)/);
  if (!match) return 7; // default to 7 days if unparseable
  return parseInt(match[1], 10);
}

/**
 * Compute A* heuristic score for a product.
 * Higher score = better product for user.
 */
export function computeHeuristicScore(
  product: Product,
  allProducts: Product[],
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  // g(n): actual match score (0-100)
  const g = product.matchScore;

  // Price competitiveness: how this product's price compares to the range
  const prices = allProducts.map((p) => p.price).filter((p) => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const priceScore = 100 * (1 - (product.price - minPrice) / priceRange);

  // Delivery speed: faster is better (normalize to 0-100)
  const days = parseDeliveryDays(product.deliveryEstimate);
  const deliveryScore = Math.max(0, 100 - days * 15);

  // Retailer trust
  const trustScore = RETAILER_TRUST[product.retailer] || 50;

  // h(n): weighted heuristic
  const h =
    weights.priceCompetitiveness * priceScore +
    weights.deliverySpeed * deliveryScore +
    weights.retailerTrust * trustScore;

  // f(n) = g(n) * weight + h(n)
  const f = weights.matchScore * g + h * (1 - weights.matchScore);

  return Math.round(f * 100) / 100;
}

/**
 * Quicksort partition using Hoare's scheme.
 * Average O(n log n), in-place.
 */
function quickSortPartition(
  arr: { product: Product; score: number }[],
  low: number,
  high: number,
  compareFn: (a: number, b: number) => number
): number {
  const pivotScore = arr[Math.floor((low + high) / 2)].score;
  let i = low - 1;
  let j = high + 1;

  while (true) {
    do { i++; } while (compareFn(arr[i].score, pivotScore) < 0);
    do { j--; } while (compareFn(arr[j].score, pivotScore) > 0);

    if (i >= j) return j;

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function quickSortRecursive(
  arr: { product: Product; score: number }[],
  low: number,
  high: number,
  compareFn: (a: number, b: number) => number
): void {
  if (low < high) {
    const pivot = quickSortPartition(arr, low, high, compareFn);
    quickSortRecursive(arr, low, pivot, compareFn);
    quickSortRecursive(arr, pivot + 1, high, compareFn);
  }
}

/**
 * Sort products using quicksort with A* heuristic scores.
 * Returns a new sorted array without mutating the input.
 */
export function rankProducts(
  products: Product[],
  sortBy: SortOption = "best-match",
  weights?: RankingWeights
): Product[] {
  if (products.length <= 1) return [...products];

  // For non-heuristic sorts, use standard comparison
  if (sortBy !== "best-match") {
    const sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "delivery":
        return sorted.sort(
          (a, b) => parseDeliveryDays(a.deliveryEstimate) - parseDeliveryDays(b.deliveryEstimate)
        );
    }
    return sorted;
  }

  // A*-inspired ranking with quicksort
  const scored = products.map((product) => ({
    product,
    score: computeHeuristicScore(product, products, weights),
  }));

  // Quicksort descending (higher score first)
  quickSortRecursive(scored, 0, scored.length - 1, (a, b) => b - a);

  return scored.map((s) => s.product);
}

/**
 * Incrementally insert a product into an already-sorted array.
 * Uses binary search for O(log n) insertion — ideal for progressive loading.
 */
export function insertSorted(
  sortedProducts: Product[],
  newProduct: Product,
  allProducts: Product[],
  sortBy: SortOption = "best-match"
): Product[] {
  const result = [...sortedProducts];
  const newScore =
    sortBy === "best-match"
      ? computeHeuristicScore(newProduct, [...allProducts, newProduct])
      : sortBy === "price-low"
      ? -newProduct.price
      : sortBy === "price-high"
      ? newProduct.price
      : -parseDeliveryDays(newProduct.deliveryEstimate);

  // Binary search for insertion position
  let low = 0;
  let high = result.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const midScore =
      sortBy === "best-match"
        ? computeHeuristicScore(result[mid], allProducts)
        : sortBy === "price-low"
        ? -result[mid].price
        : sortBy === "price-high"
        ? result[mid].price
        : -parseDeliveryDays(result[mid].deliveryEstimate);

    if (midScore >= newScore) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  result.splice(low, 0, newProduct);
  return result;
}
