import { useState } from "react";
import { ArrowLeft, CreditCard, MapPin, Loader2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

interface CartCheckoutProps {
  total: number;
  retailerCount: number;
  onBack: () => void;
  onComplete: () => void;
}

const CartCheckout = ({ total, retailerCount, onBack, onComplete }: CartCheckoutProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to cart
        </button>
      </div>

      <ScrollArea className="flex-1">
        <form id="checkout-form" onSubmit={handleSubmit} className="px-6 py-2 space-y-7">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              <h4 className="text-sm font-display font-semibold tracking-tight">Shipping Address</h4>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Single address for all {retailerCount} retailers</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
                <Input id="name" placeholder="Jane Doe" defaultValue="Jane Doe" className="mt-1.5 h-10 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
              </div>
              <div>
                <Label htmlFor="address" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Street Address</Label>
                <Input id="address" placeholder="123 Main St" defaultValue="123 Main St" className="mt-1.5 h-10 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">City</Label>
                  <Input id="city" placeholder="San Francisco" defaultValue="San Francisco" className="mt-1.5 h-10 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">ZIP Code</Label>
                  <Input id="zip" placeholder="94102" defaultValue="94102" className="mt-1.5 h-10 text-sm rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
              </div>
              <h4 className="text-sm font-display font-semibold tracking-tight">Payment Details</h4>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">One payment, split across retailers automatically</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="card" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Card Number</Label>
                <Input id="card" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" className="mt-1.5 h-10 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Expiry</Label>
                  <Input id="expiry" placeholder="12/28" defaultValue="12/28" className="mt-1.5 h-10 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                </div>
                <div>
                  <Label htmlFor="cvc" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">CVC</Label>
                  <Input id="cvc" placeholder="123" defaultValue="123" className="mt-1.5 h-10 text-sm font-mono rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Savings Banner */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-success/15 via-success/10 to-success/5 border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-display font-bold text-base text-success">
                  You're saving ~{cs}{(total * 0.35).toFixed(2)}!
                </p>
                <p className="text-xs text-success/80">vs. typical retail prices</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">Order Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{cs}{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping ({retailerCount} retailers)</span>
              <span className="font-medium text-success">Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{cs}{(total * 0.08).toFixed(2)}</span>
            </div>
            <div className="h-px bg-border/40 my-1" />
            <div className="flex justify-between">
              <span className="font-display font-bold tracking-tight">Total</span>
              <span className="font-display font-bold text-lg tracking-tight">{cs}{(total * 1.08).toFixed(2)}</span>
            </div>
          </div>
        </form>
      </ScrollArea>

      <div className="px-6 py-4 shrink-0">
        <Button type="submit" form="checkout-form" className="w-full rounded-2xl gap-2 h-12 text-sm font-semibold" disabled={isProcessing}>
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
          ) : (
            <>Place Order — {cs}{(total * 1.08).toFixed(2)}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CartCheckout;
