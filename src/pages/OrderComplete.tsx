import { motion } from "framer-motion";
import { CheckCircle2, TrendingDown, Package, ArrowLeft } from "lucide-react";
import { Product, Retailer, RETAILER_CONFIG } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

interface OrderItem extends Product {
  regularPrice: number;
}

const OrderComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];

  const passedItems: Product[] = location.state?.cartItems || [];

  const orderItems: OrderItem[] =
    passedItems.length > 0
      ? passedItems.map((p) => ({
          ...p,
          regularPrice: Math.round(p.price * (1.2 + Math.random() * 0.4) * 100) / 100,
        }))
      : [
          {
            id: "demo1",
            name: "Party Balloon Set (100pcs)",
            price: 24.99,
            regularPrice: 39.99,
            retailer: "target" as Retailer,
            category: "decorations",
            deliveryEstimate: "2 days",
            matchScore: 95,
            description: "",
          },
          {
            id: "demo2",
            name: "Premium Snack Platter",
            price: 45.99,
            regularPrice: 89.99,
            retailer: "walmart" as Retailer,
            category: "food",
            deliveryEstimate: "1 day",
            matchScore: 92,
            description: "",
          },
          {
            id: "demo3",
            name: "Mixed Beverage Pack",
            price: 32.99,
            regularPrice: 42.99,
            retailer: "amazon" as Retailer,
            category: "food",
            deliveryEstimate: "2 days",
            matchScore: 88,
            description: "",
          },
          {
            id: "demo4",
            name: "Bluetooth Party Speaker",
            price: 79.99,
            regularPrice: 129.99,
            retailer: "bestbuy" as Retailer,
            category: "technology",
            deliveryEstimate: "3 days",
            matchScore: 90,
            description: "",
          },
        ];

  const totalOurPrice = orderItems.reduce((s, i) => s + i.price, 0);
  const totalRegularPrice = orderItems.reduce((s, i) => s + i.regularPrice, 0);
  const totalSavings = totalRegularPrice - totalOurPrice;
  const savingsPct = Math.round((totalSavings / totalRegularPrice) * 100);

  const orderNumber = `AC-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const grouped = orderItems.reduce<Record<Retailer, OrderItem[]>>((acc, item) => {
    if (!acc[item.retailer]) acc[item.retailer] = [];
    acc[item.retailer].push(item);
    return acc;
  }, {} as Record<Retailer, OrderItem[]>);
  const retailerEntries = Object.entries(grouped) as [Retailer, OrderItem[]][];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-success/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/chat")}
            className="mb-6 text-xs gap-1.5 text-muted-foreground rounded-xl"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to chat
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="h-10 w-10 text-success" />
            </motion.div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Purchase Completed! ✅
            </h1>
            <p className="text-muted-foreground text-sm">
              Thank you for your order. Your items are on their way!
            </p>
            <p className="text-sm mt-1">
              Order Number:{" "}
              <span className="font-semibold text-primary">{orderNumber}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 mb-8 bg-gradient-to-r from-success/15 via-success/10 to-success/5 border border-success/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center shrink-0">
                <TrendingDown className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-display font-bold text-xl tracking-tight text-success">
                  You saved {cs}{totalSavings.toFixed(2)}!
                </p>
                <p className="text-sm text-success/80">
                  That's {savingsPct}% off regular prices
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="px-6 pt-5 pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Order Summary
              </h2>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {retailerEntries.map(([retailer, items], groupIdx) => {
                const config = RETAILER_CONFIG[retailer];
                return (
                  <div key={retailer}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        From {config.label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-2">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${config.color}10` }}
                          >
                            <Package className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Delivery: {item.deliveryEstimate}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-primary">
                              {cs}{item.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground line-through">
                              {cs}{item.regularPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {groupIdx < retailerEntries.length - 1 && (
                      <div className="h-px bg-border/40 mt-4" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/40 px-6 py-4 space-y-2 bg-secondary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{cs}{totalOurPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{cs}{(totalOurPrice * 0.08).toFixed(2)}</span>
              </div>
              <div className="h-px bg-border/40 my-1" />
              <div className="flex justify-between">
                <span className="font-display font-bold">Total</span>
                <span className="font-display font-bold text-lg">{cs}{(totalOurPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={() => navigate("/chat")}
              className="rounded-2xl px-8 h-12 text-sm font-semibold"
            >
              Start New Shopping Session
            </Button>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default OrderComplete;
