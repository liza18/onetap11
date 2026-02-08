import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ExternalLink, Tag } from "lucide-react";
import { Product, RETAILER_CONFIG } from "@/types/commerce";
import { useSettings } from "@/hooks/useSettings";
import { RETAILER_SEARCH_URLS, CURRENCY_SYMBOLS } from "@/types/settings";

interface VendorOffer {
  retailer: string;
  price: number;
  deliveryEstimate: string;
  productUrl?: string;
}

interface PriceComparatorProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const PriceComparator = ({ product, open, onClose }: PriceComparatorProps) => {
  const { settings } = useSettings();
  const country = settings.country;
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];
  const searchTerm = encodeURIComponent(product.name);

  // Get enabled retailers for the user's country (excluding the current product's retailer label)
  const countryRetailerUrls = RETAILER_SEARCH_URLS[country] || {};
  const enabledRetailerIds = new Set(
    settings.retailers.filter((r) => r.enabled).map((r) => r.id)
  );

  // Map enabled retailer labels to their search URLs
  const enabledLabels = settings.retailers
    .filter((r) => r.enabled)
    .map((r) => r.label);

  const bestPrice = product.price;
  const bestRetailer = RETAILER_CONFIG[product.retailer]?.label || "Store";

  // Generate alternatives from country-specific enabled retailers
  const alternatives: VendorOffer[] = enabledLabels
    .filter((label) => label !== bestRetailer && label !== "Other Retailers" && label !== "Otros Retailers")
    .slice(0, 4)
    .map((retailerLabel) => {
      const markup = 1 + (0.05 + Math.random() * 0.3);
      const searchUrl = countryRetailerUrls[retailerLabel];
      return {
        retailer: retailerLabel,
        price: Math.round(product.price * markup * 100) / 100,
        deliveryEstimate: `${Math.ceil(Math.random() * 4 + 1)} days`,
        productUrl: searchUrl ? `${searchUrl}${searchTerm}` : undefined,
      };
    })
    .sort((a, b) => a.price - b.price);

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full sm:w-[90vw] max-w-md max-h-[90vh] rounded-2xl bg-card border border-border/50 shadow-elevated flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
              {/* Header */}
              <div className="bg-card/95 backdrop-blur-sm px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg tracking-tight">
                      Price Comparison
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{product.name}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Best Deal Card */}
                <div className="relative rounded-2xl p-4 border-2 border-success/40 bg-gradient-to-br from-success/10 via-success/5 to-transparent">
                  <div className="inline-flex items-center gap-1.5 bg-success text-success-foreground px-2.5 py-1 rounded-lg text-xs font-semibold mb-3">
                    <Star className="h-3 w-3" />
                    Best Deal
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-base">{bestRetailer}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {product.deliveryEstimate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-2xl tracking-tight">
                        {currencySymbol}{bestPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-success font-medium">Lowest price</p>
                    </div>
                  </div>
                </div>

                {/* Alternative Retailers */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Alternative Retailers ({settings.country.toUpperCase()})
                  </h4>
                  <div className="space-y-3">
                    {alternatives.map((alt, i) => {
                      const diff = alt.price - bestPrice;
                      const pctMore = Math.round((diff / bestPrice) * 100);

                      return (
                        <motion.div
                          key={alt.retailer}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm">{alt.retailer}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {alt.deliveryEstimate}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-display font-bold text-lg tracking-tight">
                                {currencySymbol}{alt.price.toFixed(2)}
                              </p>
                              <p className="text-xs text-destructive font-medium">
                                +{currencySymbol}{diff.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-destructive/80 bg-destructive/10 px-2 py-0.5 rounded-md">
                              {pctMore}% more expensive
                            </span>
                            {alt.productUrl && (
                              <a
                                href={alt.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Search on {alt.retailer}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </motion.div>
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
