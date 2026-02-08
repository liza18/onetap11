import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Package, CreditCard, CheckCircle2, X, Truck, TrendingDown } from "lucide-react";
import { Product, Retailer, RETAILER_CONFIG } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import CartCheckout from "./CartCheckout";
import SavingsBreakdown from "./SavingsBreakdown";

interface CartDrawerProps {
  cartItems: Product[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  cartCount: number;
}

const CartDrawer = ({ cartItems, onRemoveItem, onClearCart, cartCount }: CartDrawerProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [showSavings, setShowSavings] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];

  const groupedByRetailer = cartItems.reduce<Record<Retailer, Product[]>>(
    (acc, item) => {
      if (!acc[item.retailer]) acc[item.retailer] = [];
      acc[item.retailer].push(item);
      return acc;
    },
    {} as Record<Retailer, Product[]>
  );

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const retailerEntries = Object.entries(groupedByRetailer) as [Retailer, Product[]][];

  const handleCheckoutComplete = () => {
    const items = [...cartItems];
    onClearCart();
    setShowCheckout(false);
    setCheckoutComplete(false);
    navigate("/order-complete", { state: { cartItems: items } });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-1.5 h-9 rounded-xl text-muted-foreground hover:text-foreground">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">{cartCount}</span>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border/40">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="font-display text-lg tracking-tight flex items-center gap-2.5">
            Cart
            {cartCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-lg">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground">Ask the agent to find products for you</p>
            </div>
          </div>
        ) : checkoutComplete ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-14 w-14 text-success" />
            </motion.div>
            <h3 className="font-display font-bold text-xl tracking-tight">Order Placed! 🎉</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Your items are on their way from {retailerEntries.length} retailer{retailerEntries.length !== 1 ? "s" : ""}.
            </p>
          </div>
        ) : showCheckout ? (
          <CartCheckout
            total={totalPrice}
            retailerCount={retailerEntries.length}
            onBack={() => setShowCheckout(false)}
            onComplete={handleCheckoutComplete}
          />
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="px-6 py-4 space-y-5">
                <AnimatePresence>
                  {retailerEntries.map(([retailer, items]) => {
                    const retailerConfig = RETAILER_CONFIG[retailer];
                    const subtotal = items.reduce((sum, item) => sum + item.price, 0);

                    return (
                      <motion.div
                        key={retailer}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: retailerConfig.color }} />
                            <span className="text-sm font-semibold tracking-tight">{retailerConfig.label}</span>
                            <span className="text-[11px] text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</span>
                          </div>
                          <span className="text-sm font-bold font-display tracking-tight">{cs}{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <CartItem key={item.id} product={item} onRemove={() => onRemoveItem(item.id)} currencySymbol={cs} />
                          ))}
                        </div>

                        <div className="h-px bg-border/40" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="bg-card border-t border-border/40 px-6 py-4 space-y-4 shrink-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Shipping from {retailerEntries.length} retailer{retailerEntries.length !== 1 ? "s" : ""}</span>
                </div>
                <button
                  onClick={() => setShowSavings(true)}
                  className="flex items-center gap-1 text-success hover:text-success/80 transition-colors font-medium"
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  View Savings
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="font-display font-bold text-2xl tracking-tight">{cs}{totalPrice.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={onClearCart} className="text-xs text-muted-foreground h-9 rounded-xl">Clear</Button>
                  <Button size="sm" onClick={() => setShowCheckout(true)} className="rounded-xl px-5 gap-2 h-9">
                    <CreditCard className="h-3.5 w-3.5" />
                    Checkout
                  </Button>
                </div>
              </div>
            </div>

            <SavingsBreakdown
              items={cartItems}
              open={showSavings}
              onClose={() => setShowSavings(false)}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const CartItem = ({ product, onRemove, currencySymbol }: { product: Product; onRemove: () => void; currencySymbol: string }) => {
  const retailer = RETAILER_CONFIG[product.retailer];

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -16 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${retailer.color}10` }}>
        <Package className="h-4 w-4" style={{ color: retailer.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate leading-snug">{product.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{product.deliveryEstimate}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-display font-bold tracking-tight">{currencySymbol}{product.price.toFixed(2)}</span>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default CartDrawer;
