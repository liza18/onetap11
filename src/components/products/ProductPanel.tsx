import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Product, SortOption, ProductCategory, CATEGORY_LABELS } from "@/types/commerce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductThumbnails } from "@/hooks/useProductThumbnails";
import ProductCard from "./ProductCard";
import ProductSkeleton from "@/components/search/ProductSkeleton";
import { rankProducts } from "@/lib/searchRanking";
import { useMemo } from "react";

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

  const filtered = useMemo(() =>
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  );

  // Use A*-inspired ranking with quicksort
  const sorted = useMemo(
    () => rankProducts(filtered, sortBy),
    [filtered, sortBy]
  );

  const hasProducts = products.length > 0;

  return (
    <div className="flex flex-col h-full bg-secondary/20">
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          {/* Search progress indicator */}
          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-primary/[0.04] border border-primary/10 flex items-center gap-2.5 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-primary">Searching retailers…</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Crawling • Extracting • Ranking with A* heuristic
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton loading state */}
          {isExtracting && !hasProducts && <ProductSkeleton count={6} />}

          {/* No products, not searching — show discovery prompt */}
          {!hasProducts && !isExtracting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 sm:py-28 gap-4 sm:gap-5 text-muted-foreground"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/60 flex items-center justify-center">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary/30" />
              </div>
              <div className="text-center space-y-2 max-w-[240px]">
                <h3 className="font-display font-semibold text-foreground text-sm sm:text-base tracking-tight">Product Discovery</h3>
                <p className="text-xs sm:text-[13px] leading-relaxed">Start chatting with the AI to discover products here.</p>
              </div>
            </motion.div>
          )}

          {/* Product grid with responsive columns */}
          {hasProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
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

              {/* Show additional skeletons when more results are loading */}
              {isExtracting && hasProducts && <ProductSkeleton count={2} />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProductPanel;
