export type Retailer = "amazon" | "walmart" | "target" | "bestbuy" | "ebay" | "mercadolibre" | "other";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  retailer: Retailer;
  category: ProductCategory;
  deliveryEstimate: string;
  matchScore: number; // 0-100
  imageUrl?: string;
  rankReason?: string;
  productUrl?: string;
  searchGroup?: string; // The search query that produced this product
}

export type ProductCategory =
  | "technology"
  | "food"
  | "home"
  | "entertainment"
  | "tools"
  | "snacks"
  | "badges"
  | "tech"
  | "decorations"
  | "prizes"
  | "stationery"
  | "equipment"
  | "other";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export type SortOption = "best-match" | "price-low" | "price-high" | "delivery";

export const RETAILER_CONFIG: Record<
  Retailer,
  { label: string; color: string }
> = {
  amazon: { label: "Amazon", color: "hsl(35, 100%, 50%)" },
  walmart: { label: "Walmart", color: "hsl(210, 100%, 40%)" },
  target: { label: "Target", color: "hsl(0, 80%, 50%)" },
  bestbuy: { label: "Best Buy", color: "hsl(210, 100%, 50%)" },
  ebay: { label: "eBay", color: "hsl(0, 100%, 45%)" },
  mercadolibre: { label: "Mercado Libre", color: "hsl(50, 100%, 45%)" },
  other: { label: "Store", color: "hsl(160, 60%, 40%)" },
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  technology: "💻 Technology",
  food: "🍔 Food",
  home: "🏠 Home",
  entertainment: "🎮 Entertainment",
  tools: "🔧 Tools",
  snacks: "🍿 Snacks & Drinks",
  badges: "🏷️ Badges & Lanyards",
  tech: "🔌 Tech Accessories",
  decorations: "🎨 Decorations",
  prizes: "🏆 Prizes",
  stationery: "📝 Stationery",
  equipment: "📽️ Equipment",
  other: "📦 Other",
};
