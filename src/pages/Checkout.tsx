import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, CreditCard, Loader2 } from "lucide-react";
import { Product } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

type PaymentMethod = "credit-card" | "paypal" | "apple-pay";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "credit-card", label: "Credit Card", icon: "💳" },
  { value: "paypal", label: "PayPal", icon: "🅿️" },
  { value: "apple-pay", label: "Apple Pay", icon: "🍎" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("credit-card");

  const cartItems: Product[] = (location.state as any)?.cartItems || [];
  const subtotal = cartItems.reduce((s, i) => s + i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCompletePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/order-complete", { state: { cartItems } });
    }, 2000);
  };

  if (cartItems.length === 0) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10vw] -right-[10vw] w-[min(500px,60vw)] h-[min(500px,60vw)] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-[5vw] w-[min(400px,50vw)] h-[min(400px,50vw)] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <ScrollArea className="flex-1">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 relative z-10">
          {/* Back */}
          <button
            onClick={() => navigate("/cart", { state: { cartItems } })}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>

          <h1 className="font-display font-bold tracking-tight mb-6 sm:mb-8">Checkout</h1>

          <form onSubmit={handleCompletePurchase} className="space-y-6 sm:space-y-8">
            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-base sm:text-lg tracking-tight">Delivery Address</h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Full Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter your delivery address"
                    className="mt-1.5 h-10 sm:h-11 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <Label htmlFor="city" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City</Label>
                    <Input id="city" placeholder="City" className="mt-1.5 h-10 sm:h-11 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" required />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ZIP Code</Label>
                    <Input id="zip" placeholder="ZIP" className="mt-1.5 h-10 sm:h-11 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" required />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-base sm:text-lg tracking-tight">Payment Method</h2>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedPayment(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all text-left ${
                      selectedPayment === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <span className="text-lg sm:text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                    {selectedPayment === opt.value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedPayment === "credit-card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <Label htmlFor="cardNumber" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card Number</Label>
                    <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="mt-1.5 h-10 sm:h-11 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <Label htmlFor="expiry" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry</Label>
                      <Input id="expiry" placeholder="MM/YY" className="mt-1.5 h-10 sm:h-11 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CVC</Label>
                      <Input id="cvc" placeholder="123" className="mt-1.5 h-10 sm:h-11 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4"
            >
              <h2 className="font-display font-semibold text-base sm:text-lg tracking-tight">Order Summary</h2>
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">{cs}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-bold text-success">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{cs}{tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border/40" />
                <div className="flex justify-between">
                  <span className="font-display font-bold text-base sm:text-lg">Total</span>
                  <span className="font-display font-bold text-lg sm:text-xl text-primary">{cs}{total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>

            {/* Complete Purchase button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-semibold bg-success hover:bg-success/90 text-success-foreground"
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Processing…</>
                ) : (
                  <>Complete Purchase</>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Checkout;
