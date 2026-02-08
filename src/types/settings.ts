export type CountryCode = "us" | "mx" | "ca";

export interface RetailerSetting {
  id: string;
  label: string;
  enabled: boolean;
}

export interface CountrySetting {
  code: CountryCode;
  label: string;
}

export type DeliveryPriority = "fastest" | "lowest-cost" | "best-value" | "balanced";
export type BudgetStrictness = "strict" | "flexible" | "optimized";
export type TransparencyLevel = "basic" | "detailed" | "full-trace";
export type ProductBias = "premium" | "budget" | "balanced";
export type AccentIntensity = "subtle" | "balanced" | "strong";
export type AnimationLevel = "minimal" | "normal" | "enhanced";
export type ChartDetail = "simple" | "detailed";
export type ThemeMode = "light" | "dark";
export type CurrencyCode = "USD" | "MXN" | "CAD";

export const COUNTRY_OPTIONS: CountrySetting[] = [
  { code: "us", label: "🇺🇸 United States" },
  { code: "mx", label: "🇲🇽 Mexico" },
  { code: "ca", label: "🇨🇦 Canada" },
];

export const COUNTRY_CURRENCY_MAP: Record<CountryCode, CurrencyCode> = {
  us: "USD",
  mx: "MXN",
  ca: "CAD",
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  MXN: "MX$",
  CAD: "CA$",
};

/** Retailers available per country */
export const RETAILERS_BY_COUNTRY: Record<CountryCode, RetailerSetting[]> = {
  us: [
    { id: "amazon_us", label: "Amazon US", enabled: true },
    { id: "walmart", label: "Walmart", enabled: true },
    { id: "target", label: "Target", enabled: true },
    { id: "bestbuy_us", label: "Best Buy", enabled: true },
    { id: "costco_us", label: "Costco", enabled: true },
    { id: "ebay_us", label: "eBay US", enabled: true },
    { id: "homedepot", label: "Home Depot", enabled: true },
    { id: "macys", label: "Macy's", enabled: true },
    { id: "nordstrom", label: "Nordstrom", enabled: true },
    { id: "other", label: "Other Retailers", enabled: true },
  ],
  mx: [
    { id: "amazon_mx", label: "Amazon México", enabled: true },
    { id: "mercadolibre", label: "Mercado Libre", enabled: true },
    { id: "liverpool", label: "Liverpool", enabled: true },
    { id: "coppel", label: "Coppel", enabled: true },
    { id: "elektra", label: "Elektra", enabled: true },
    { id: "soriana", label: "Soriana", enabled: true },
    { id: "costco_mx", label: "Costco México", enabled: true },
    { id: "sams_mx", label: "Sam's Club México", enabled: true },
    { id: "palacio", label: "Palacio de Hierro", enabled: true },
    { id: "other", label: "Otros Retailers", enabled: true },
  ],
  ca: [
    { id: "amazon_ca", label: "Amazon Canada", enabled: true },
    { id: "walmart_ca", label: "Walmart Canada", enabled: true },
    { id: "canadiantire", label: "Canadian Tire", enabled: true },
    { id: "bestbuy_ca", label: "Best Buy Canada", enabled: true },
    { id: "costco_ca", label: "Costco Canada", enabled: true },
    { id: "thebay", label: "Hudson's Bay", enabled: true },
    { id: "shoppers", label: "Shoppers Drug Mart", enabled: true },
    { id: "loblaws", label: "Loblaws", enabled: true },
    { id: "staples_ca", label: "Staples Canada", enabled: true },
    { id: "other", label: "Other Retailers", enabled: true },
  ],
};

/** Retailer search domains for price comparison links */
export const RETAILER_SEARCH_URLS: Record<CountryCode, Record<string, string>> = {
  us: {
    "Amazon US": "https://www.amazon.com/s?k=",
    "Walmart": "https://www.walmart.com/search?q=",
    "Target": "https://www.target.com/s?searchTerm=",
    "Best Buy": "https://www.bestbuy.com/site/searchpage.jsp?st=",
    "Costco": "https://www.costco.com/CatalogSearch?keyword=",
    "eBay US": "https://www.ebay.com/sch/i.html?_nkw=",
    "Home Depot": "https://www.homedepot.com/s/",
    "Macy's": "https://www.macys.com/shop/featured/",
    "Nordstrom": "https://www.nordstrom.com/sr?keyword=",
  },
  mx: {
    "Amazon México": "https://www.amazon.com.mx/s?k=",
    "Mercado Libre": "https://listado.mercadolibre.com.mx/",
    "Liverpool": "https://www.liverpool.com.mx/tienda?s=",
    "Coppel": "https://www.coppel.com/busqueda?text=",
    "Elektra": "https://www.elektra.com.mx/busqueda?text=",
    "Soriana": "https://www.soriana.com/buscar?q=",
    "Costco México": "https://www.costco.com.mx/search?text=",
    "Sam's Club México": "https://www.sams.com.mx/buscar?q=",
    "Palacio de Hierro": "https://www.elpalaciodehierro.com/buscar?q=",
  },
  ca: {
    "Amazon Canada": "https://www.amazon.ca/s?k=",
    "Walmart Canada": "https://www.walmart.ca/search?q=",
    "Canadian Tire": "https://www.canadiantire.ca/en/search.html?q=",
    "Best Buy Canada": "https://www.bestbuy.ca/en-ca/search?search=",
    "Costco Canada": "https://www.costco.ca/CatalogSearch?keyword=",
    "Hudson's Bay": "https://www.thebay.com/search?q=",
    "Shoppers Drug Mart": "https://shop.shoppersdrugmart.ca/search?q=",
    "Loblaws": "https://www.loblaws.ca/search?search-bar=",
    "Staples Canada": "https://www.staples.ca/search?query=",
  },
};

export interface UserSettings {
  // Country (primary)
  country: CountryCode;

  // Retailer sources (derived from country)
  retailers: RetailerSetting[];

  // AI behavior
  deliveryPriority: DeliveryPriority;
  budgetStrictness: BudgetStrictness;
  transparencyLevel: TransparencyLevel;
  productBias: ProductBias;

  // Interface
  themeMode: ThemeMode;
  accentIntensity: AccentIntensity;
  animationLevel: AnimationLevel;
  chartDetail: ChartDetail;

  // Currency (derived from country)
  currency: CurrencyCode;

  // Privacy
  historyEnabled: boolean;

  // Notifications
  notifyDeliveryUpdates: boolean;
  notifyPriceDrops: boolean;
  notifyAlternatives: boolean;
  notifyCartOptimization: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  country: "us",
  retailers: RETAILERS_BY_COUNTRY["us"],
  deliveryPriority: "best-value",
  budgetStrictness: "optimized",
  transparencyLevel: "detailed",
  productBias: "balanced",
  themeMode: "light",
  accentIntensity: "balanced",
  animationLevel: "normal",
  chartDetail: "detailed",
  currency: "USD",
  historyEnabled: true,
  notifyDeliveryUpdates: true,
  notifyPriceDrops: true,
  notifyAlternatives: true,
  notifyCartOptimization: true,
};
