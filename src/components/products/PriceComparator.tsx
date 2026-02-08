import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ExternalLink, Tag, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Product, RETAILER_CONFIG } from "@/types/commerce";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";

interface Alternative {
  name: string;
  retailer: string;
  price: number;
  deliveryEstimate: string;
  productUrl: string;
  matchScore: number;
}

interface PriceComparatorProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const PriceComparator = ({ product, open, onClose }: PriceComparatorProps) => {
  const { settings } = useSettings();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bestPrice = product.price;
  const bestRetailer = RETAILER_CONFIG[product.retailer]?.label || "Store";

  useEffect(() => {
    if (open && alternatives.length === 0 && !loading) {
      fetchAlternatives();
    }
  }, [open]);

  const fetchAlternatives = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("product-search", {
        body: {
          queries: [product.name],
          userContext: `Find this exact product or very similar alternatives at different retailers. The original is from ${bestRetailer} at ${currencySymbol}${bestPrice.toFixed(2)}.`,
          country: settings.country,
          currency: settings.currency,
        },
      });

      if (fnError) {
        setError("Could not fetch alternatives. Try again later.");
        return;
      }

      const results: Alternative[] = (data?.products || [])
        .filter((p: any) => p.productUrl && p.price > 0)
        .map((p: any) => ({
          name: p.name,
          retailer: p.retailer || "Store",
          price: p.price,
          deliveryEstimate: p.deliveryEstimate || "Varies",
          productUrl: p.productUrl,
          matchScore: p.matchScore || 0,
        }))
        .sort((a: Alternative, b: Alternative) => a.price - b.price);

      setAlternatives(results);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="w-full sm:w-[90vw] sm:max-w-md max-h-[90dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-card border border-border/50 shadow-elevated flex flex-col overflow-hidden safe-bottom">
              {/* Header */}
              <div className="bg-card/95 backdrop-blur-sm px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 border-b border-border/30 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base sm:text-lg tracking-tight">
                      Price Comparison
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{product.name}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground ml-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
                {/* Current Product Card */}
                <div className="relative rounded-2xl p-3 sm:p-4 border-2 border-success/40 bg-gradient-to-br from-success/10 via-success/5 to-transparent">
                  <div className="inline-flex items-center gap-1.5 bg-success text-success-foreground px-2.5 py-1 rounded-lg text-xs font-semibold mb-2 sm:mb-3">
                    <Star className="h-3 w-3" />
                    Current Selection
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{bestRetailer}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] sm:text-xs text-muted-foreground">
                          {product.deliveryEstimate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-xl sm:text-2xl tracking-tight">
                        {currencySymbol}{bestPrice.toFixed(2)}
                      </p>
                      {product.productUrl && (
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alternatives */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                    Real Alternatives ({settings.country.toUpperCase()})
                  </h4>

                  {loading && (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Searching retailers…</p>
                    </div>
                  )}

                  {error && (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-3">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">{error}</p>
                      <button
                        onClick={fetchAlternatives}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  )}

                  {!loading && !error && alternatives.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">No alternatives found.</p>
                      <button
                        onClick={fetchAlternatives}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" /> Search again
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-3">
                    {alternatives.map((alt, i) => {
                      const diff = alt.price - bestPrice;
                      const isLower = diff < 0;
                      const pctDiff = Math.abs(Math.round((diff / bestPrice) * 100));

                      return (
                        <motion.a
                          key={`${alt.retailer}-${i}`}
                          href={alt.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="block rounded-xl border border-border/50 bg-secondary/20 p-3 sm:p-4 hover:bg-secondary/40 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 mr-3">
                              <p className="font-semibold text-xs sm:text-sm truncate">{alt.name}</p>
                              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 capitalize">{alt.retailer}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[11px] sm:text-xs text-muted-foreground">
                                  {alt.deliveryEstimate}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-display font-bold text-base sm:text-lg tracking-tight">
                                {currencySymbol}{alt.price.toFixed(2)}
                              </p>
                              {diff !== 0 && (
                                <p className={`text-[11px] sm:text-xs font-medium ${isLower ? "text-success" : "text-destructive"}`}>
                                  {isLower ? "−" : "+"}{currencySymbol}{Math.abs(diff).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            {diff !== 0 ? (
                              <span className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                isLower
                                  ? "text-success bg-success/10"
                                  : "text-destructive/80 bg-destructive/10"
                              }`}>
                                {isLower ? `${pctDiff}% cheaper` : `${pctDiff}% more expensive`}
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                                Same price
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                              View <ExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PriceComparator;
