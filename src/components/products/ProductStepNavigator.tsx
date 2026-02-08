import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductStepNavigatorProps {
  groups: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onGoToCheckout: () => void;
  cartCountPerGroup: Record<string, number>;
}

const ProductStepNavigator = ({
  groups,
  currentStep,
  onStepChange,
  onGoToCheckout,
  cartCountPerGroup,
}: ProductStepNavigatorProps) => {
  if (groups.length <= 1) return null;

  const isLastStep = currentStep === groups.length - 1;
  const hasItemsInCart = Object.values(cartCountPerGroup).some((c) => c > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/95 backdrop-blur-md border-t border-border/40 px-3 sm:px-5 py-3 sm:py-4 safe-bottom"
    >
      {/* Step indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {groups.map((group, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const cartCount = cartCountPerGroup[group] || 0;
          // Capitalize first letter of each word for display
          const label = group
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          return (
            <button
              key={group}
              onClick={() => onStepChange(i)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isCompleted
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">
                  {i + 1}
                </span>
              )}
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{label}</span>
              {cartCount > 0 && (
                <span className="ml-0.5 bg-primary-foreground/20 text-current px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        {currentStep > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepChange(currentStep - 1)}
            className="rounded-xl text-xs h-9 px-4"
          >
            Back
          </Button>
        )}

        <div className="flex-1" />

        <AnimatePresence mode="wait">
          {isLastStep ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                size="sm"
                onClick={onGoToCheckout}
                disabled={!hasItemsInCart}
                className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6 font-semibold gap-2 shadow-sm"
              >
                <ShoppingCart className="h-4 w-4" />
                Go to Checkout
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="next"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                size="sm"
                onClick={() => onStepChange(currentStep + 1)}
                className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6 font-semibold gap-2 shadow-sm"
              >
                Next: {groups[currentStep + 1]
                  ?.split(" ")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProductStepNavigator;
