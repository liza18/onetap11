import { X, ShoppingCart, Check, Truck, Star, ExternalLink, Sparkles, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, RETAILER_CONFIG, CATEGORY_LABELS } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import ComparisonChart from "./ComparisonChart";

interface ProductDetailModalProps {
  product: Product | null;
  similarProducts: Product[];
  onClose: () => void;
  inCart: boolean;
  onAddToCart: () => void;
}

const ProductDetailModal = ({
  product,
  similarProducts,
  onClose,
  inCart,
  onAddToCart,
}: ProductDetailModalProps) => {
  const { settings } = useSettings();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

  if (!product) return null;

  const retailer = RETAILER_CONFIG[product.retailer];
  const scoreColor =
    product.matchScore >= 90
      ? "text-success"
      : product.matchScore >= 75
      ? "text-accent"
      : "text-muted-foreground";

  const allForComparison = [product, ...similarProducts].slice(0, 5);
  const aiExplanation = generateAIExplanation(product, similarProducts, currencySymbol);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            <div className="w-[95vw] sm:w-[90vw] max-w-[800px] max-h-[90vh] bg-card rounded-3xl shadow-elevated border border-border/60 overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-xl text-[10px] font-semibold text-white"
                  style={{ backgroundColor: retailer.color }}
                >
                  {retailer.label}
                </div>
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[product.category] || product.category}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-6 pb-6 space-y-6">
                <div className="space-y-3">
                  <h2 className="font-display font-bold text-xl tracking-tight leading-snug">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/40 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Price</p>
                    <p className="font-display font-bold text-lg tracking-tight">{currencySymbol}{product.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Delivery</p>
                    <p className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {product.deliveryEstimate}
                    </p>
                  </div>
                  <div className="bg-secondary/40 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Match</p>
                    <p className={`flex items-center justify-center gap-1 text-sm font-bold ${scoreColor}`}>
                      <Star className="h-3.5 w-3.5" />
                      {product.matchScore}%
                    </p>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl gradient-hero flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="font-display font-semibold text-sm tracking-tight">AI Analysis</h3>
                  </div>
                  <p className="text-[13px] text-foreground/75 leading-relaxed">
                    {aiExplanation}
                  </p>
                </div>

                {/* Comparison chart */}
                {allForComparison.length > 1 && (
                  <div className="bg-secondary/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-sm tracking-tight">Comparison</h3>
                    </div>
                    <ComparisonChart products={allForComparison} highlightId={product.id} />
                  </div>
                )}

                {product.rankReason && (
                  <div className="bg-secondary/30 rounded-2xl p-4">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground/80">Ranking reason:</span> {product.rankReason}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="bg-card border-t border-border/40 px-6 py-4 flex items-center gap-3 shrink-0">
              <Button
                onClick={onAddToCart}
                variant={inCart ? "secondary" : "default"}
                className="flex-1 rounded-xl h-11 font-medium"
              >
                {inCart ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              {product.productUrl && (
                <Button
                  variant="ghost"
                  className="rounded-xl h-11 gap-2 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View on {retailer.label}
                  </a>
                </Button>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function generateAIExplanation(product: Product, similar: Product[], currencySymbol: string): string {
  const parts: string[] = [];

  if (product.matchScore >= 90) {
    parts.push(`This is a top-rated match for your needs with a ${product.matchScore}% relevance score.`);
  } else if (product.matchScore >= 75) {
    parts.push(`This is a strong match at ${product.matchScore}% relevance.`);
  } else {
    parts.push(`This product has a ${product.matchScore}% match score.`);
  }

  if (similar.length > 0) {
    const avgPrice = similar.reduce((sum, p) => sum + p.price, 0) / similar.length;
    if (product.price < avgPrice * 0.85) {
      parts.push(`At ${currencySymbol}${product.price.toFixed(2)}, it's significantly below the average of ${currencySymbol}${avgPrice.toFixed(2)} for similar products — excellent value.`);
    } else if (product.price < avgPrice) {
      parts.push(`Priced at ${currencySymbol}${product.price.toFixed(2)}, it's below the ${currencySymbol}${avgPrice.toFixed(2)} category average.`);
    } else if (product.price > avgPrice * 1.15) {
      parts.push(`At ${currencySymbol}${product.price.toFixed(2)}, it's above the ${currencySymbol}${avgPrice.toFixed(2)} average, but may offer premium features that justify the cost.`);
    }

    const betterOptions = similar.filter((p) => p.matchScore > product.matchScore);
    if (betterOptions.length === 0) {
      parts.push("This is the highest-rated option in its category.");
    } else if (betterOptions.length === 1) {
      parts.push("One alternative scores higher, but this option offers a strong balance of price and quality.");
    }
  }

  parts.push(`Available from ${RETAILER_CONFIG[product.retailer].label} with ${product.deliveryEstimate} delivery.`);

  return parts.join(" ");
}

export default ProductDetailModal;
