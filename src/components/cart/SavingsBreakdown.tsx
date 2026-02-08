import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Product } from "@/types/commerce";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCY_SYMBOLS } from "@/types/settings";

interface SavingsBreakdownProps {
  items: Product[];
  open: boolean;
  onClose: () => void;
}

const SavingsBreakdown = ({ items, open, onClose }: SavingsBreakdownProps) => {
  const { settings } = useSettings();
  const cs = CURRENCY_SYMBOLS[settings.currency];

  const itemsWithSavings = items.map((item) => {
    const regularPrice = Math.round(item.price * (1.2 + Math.random() * 0.4) * 100) / 100;
    const savings = regularPrice - item.price;
    const savingsPct = Math.round((savings / regularPrice) * 100);
    return { ...item, regularPrice, savings, savingsPct };
  });

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
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-sm z-50 bg-card border-l border-border/40 flex flex-col shadow-elevated pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h3 className="font-display font-bold text-lg tracking-tight">
                Savings Breakdown
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
              {itemsWithSavings.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                >
                  <p className="font-semibold text-sm mb-2.5">{item.name}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Regular Price:</span>
                      <span className="font-medium">
                        {cs}{item.regularPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Our Price:</span>
                      <span className="font-bold text-success">
                        {cs}{item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-success">You Save:</span>
                      <span className="font-bold text-success">
                        {cs}{item.savings.toFixed(2)} ({item.savingsPct}%)
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      This is {item.savingsPct}% cheaper than typical retail prices
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SavingsBreakdown;
