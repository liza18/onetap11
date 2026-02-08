import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Product, SortOption, ProductCategory, CATEGORY_LABELS } from "@/types/commerce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductThumbnails } from "@/hooks/useProductThumbnails";
import ProductCard from "./ProductCard";

interface ProductPanelProps {
  products: Product[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeCategory: ProductCategory | "all";
  onCategoryChange: (cat: ProductCategory | "all") => void;
  cart: Set<string>;
  onAddToCart: (id: string) => void;
  isExtracting?: boolean;
  onSelectProduct?: (product: Product) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best-match", label: "Best Match" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "delivery", label: "Fastest Delivery" },
];

const ProductPanel = ({
  products,
  sortBy,
  onSortChange,
  activeCategory,
  onCategoryChange,
  cart,
  onAddToCart,
  isExtracting = false,
  onSelectProduct,
}: ProductPanelProps) => {
  const thumbnails = useProductThumbnails(products);

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "delivery": return a.deliveryEstimate.localeCompare(b.deliveryEstimate);
      default: return b.matchScore - a.matchScore;
    }
  });

  const availableCategories = new Set(products.map((p) => p.category));
  const categories: (ProductCategory | "all")[] = ["all", ...Array.from(availableCategories).sort()];

  const hasProducts = products.length > 0;

  return (
    <div className="flex flex-col h-full bg-secondary/20">
      {hasProducts && (
        <div className="bg-card/80 backdrop-blur-sm px-5 sm:px-6 py-3.5 space-y-3 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {cat === "all" ? `All (${products.length})` : CATEGORY_LABELS[cat as ProductCategory] || cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{sorted.length}</span> products found
            </p>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="text-[11px] font-medium bg-transparent border-none focus:outline-none text-muted-foreground hover:text-foreground cursor-pointer appearance-none pr-4"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-5 sm:p-6 space-y-5">
          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-primary/[0.04] border border-primary/10 flex items-center gap-2.5 rounded-2xl px-4 py-3"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-primary">Searching the web for products…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!hasProducts && !isExtracting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 gap-5 text-muted-foreground"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary/30" />
              </div>
              <div className="text-center space-y-2 max-w-[240px]">
                <h3 className="font-display font-semibold text-foreground text-base tracking-tight">Product Discovery</h3>
                <p className="text-[13px] leading-relaxed">Start chatting with the AI to discover products here.</p>
              </div>
            </motion.div>
          )}

          {hasProducts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {sorted.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                    layout
                  >
                    <ProductCard
                      product={product}
                      inCart={cart.has(product.id)}
                      onAddToCart={() => onAddToCart(product.id)}
                      thumbnailUrl={thumbnails[product.id]}
                      onSelect={() => onSelectProduct?.(product)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProductPanel;
