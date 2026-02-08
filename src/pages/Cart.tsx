import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { Product, Retailer, RETAILER_CONFIG } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

interface CartPageState {
  cartItems: Product[];
}

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];

  const state = location.state as CartPageState | null;
  const cartItems: Product[] = state?.cartItems || [];

  const grouped = cartItems.reduce<Record<Retailer, Product[]>>((acc, item) => {
    if (!acc[item.retailer]) acc[item.retailer] = [];
    acc[item.retailer].push(item);
    return acc;
  }, {} as Record<Retailer, Product[]>);
  const retailerEntries = Object.entries(grouped) as [Retailer, Product[]][];

  const subtotal = cartItems.reduce((s, i) => s + i.price, 0);
  const regularTotal = cartItems.reduce(
    (s, i) => s + Math.round(i.price * (1.2 + Math.random() * 0.4) * 100) / 100,
    0
  );
  const savings = regularTotal - subtotal;

  const handleCheckout = () => {
    navigate("/checkout", { state: { cartItems } });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/60 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground/30" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Ask the agent to find products for you</p>
        </div>
        <Button onClick={() => navigate("/")} className="rounded-2xl px-6 h-10 text-sm font-semibold gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10vw] -right-[10vw] w-[min(500px,60vw)] h-[min(500px,60vw)] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-[5vw] w-[min(400px,50vw)] h-[min(400px,50vw)] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 relative z-10">
          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </button>

          <h1 className="font-display font-bold tracking-tight mb-6 sm:mb-8">Shopping Cart</h1>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left: Items grouped by retailer */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
              <AnimatePresence>
                {retailerEntries.map(([retailer, items]) => {
                  const config = RETAILER_CONFIG[retailer];
                  return (
                    <motion.div
                      key={retailer}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="glass-card rounded-2xl overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-display font-semibold text-sm sm:text-base tracking-tight">
                          From {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({items.length} {items.length === 1 ? "item" : "items"})
                        </span>
                      </div>

                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2 sm:space-y-3">
                        {items.map((item) => (
                          <CartItemRow key={item.id} product={item} currencySymbol={cs} retailerColor={config.color} />
                        ))}
                      </div>

                      <div className="border-t border-border/30 px-4 sm:px-5 py-2 sm:py-3 bg-secondary/10">
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          Estimated delivery: {items[0]?.deliveryEstimate}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right: Order Summary */}
            <div className="w-full lg:w-[clamp(280px,30%,360px)] shrink-0">
              <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 lg:sticky lg:top-6">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">Order Summary</h2>

                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({cartItems.length})</span>
                    <span className="font-medium">{cs}{regularTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-success font-medium">Savings</span>
                    <span className="font-bold text-success">-{cs}{savings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-bold text-success">FREE</span>
                  </div>
                  <div className="h-px bg-border/40" />
                  <div className="flex justify-between">
                    <span className="font-display font-bold text-base sm:text-lg">Total</span>
                    <span className="font-display font-bold text-lg sm:text-xl text-primary">{cs}{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full rounded-2xl h-11 sm:h-12 text-sm font-semibold"
                >
                  Proceed to Checkout
                </Button>

                {/* Savings pill */}
                <div className="rounded-2xl p-3 sm:p-3.5 bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2.5">
                    <div className="text-lg">🎉</div>
                    <p className="text-xs sm:text-sm font-medium text-success">
                      You're saving {cs}{savings.toFixed(2)} on this order!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const CartItemRow = ({
  product,
  currencySymbol,
  retailerColor,
}: {
  product: Product;
  currencySymbol: string;
  retailerColor: string;
}) => {
  const regularPrice = Math.round(product.price * (1.2 + Math.random() * 0.4) * 100) / 100;

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
      <div
        className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${retailerColor}10` }}
      >
        <Package className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: retailerColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold truncate">{product.name}</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">🚚 {product.deliveryEstimate} delivery</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display font-bold text-sm sm:text-base text-success">{currencySymbol}{product.price.toFixed(2)}</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground line-through">{currencySymbol}{regularPrice.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Cart;
