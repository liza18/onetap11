import { ShoppingCart, Check, Truck, Star, ExternalLink, BarChart3 } from "lucide-react";
import { Product, RETAILER_CONFIG } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import PriceComparator from "./PriceComparator";

interface ProductCardProps {
  product: Product;
  inCart: boolean;
  onAddToCart: () => void;
  thumbnailUrl?: string;
  onSelect?: () => void;
}

const ProductCard = ({ product, inCart, onAddToCart, thumbnailUrl, onSelect }: ProductCardProps) => {
  const retailer = RETAILER_CONFIG[product.retailer];
  const { settings } = useSettings();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const scoreColor =
    product.matchScore >= 90
      ? "text-success"
      : product.matchScore >= 75
      ? "text-accent"
      : "text-muted-foreground";

  const showImage = thumbnailUrl && !imgError;

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden group hover:shadow-elevated transition-all duration-300 cursor-pointer border border-border/50 shadow-card"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a")) return;
        onSelect?.();
      }}
    >
      {/* Image */}
      <div className="h-36 bg-secondary/30 flex items-center justify-center relative overflow-hidden">
        {showImage ? (
          <>
            {!imgLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
            <img
              src={thumbnailUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </>
        ) : thumbnailUrl === undefined ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <ShoppingCart className="h-7 w-7 text-muted-foreground/20" />
        )}

        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-white tracking-wide z-10"
          style={{ backgroundColor: retailer.color }}
        >
          {retailer.label}
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1 z-10 border border-border/30">
          <Star className={`h-3 w-3 ${scoreColor}`} />
          <span className={`text-[11px] font-semibold ${scoreColor}`}>{product.matchScore}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-sm leading-snug tracking-tight">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{product.description}</p>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${product.matchScore}%`,
                background:
                  product.matchScore >= 90
                    ? "hsl(var(--success))"
                    : product.matchScore >= 75
                    ? "hsl(var(--accent))"
                    : "hsl(var(--muted-foreground))",
              }}
            />
          </div>
          {product.rankReason && (
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{product.rankReason}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-display font-bold text-lg tracking-tight">{currencySymbol}{product.price.toFixed(2)}</span>
            <span className="text-[10px] text-success font-medium ml-1.5">Cheapest</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Truck className="h-3 w-3" />
            {product.deliveryEstimate}
          </span>
        </div>

        <div className="flex gap-2 pt-0.5">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            variant={inCart ? "secondary" : "default"}
            className="flex-1 text-xs h-9 rounded-xl font-medium"
          >
            {inCart ? (
              <><Check className="h-3.5 w-3.5 mr-1.5" />Added</>
            ) : (
              <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Add to Cart</>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-9 rounded-xl gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setShowComparator(true); }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Compare
          </Button>
        </div>
      </div>

      <PriceComparator
        product={product}
        open={showComparator}
        onClose={() => setShowComparator(false)}
      />
    </div>
  );
};

export default ProductCard;
