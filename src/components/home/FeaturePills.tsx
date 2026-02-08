import { motion } from "framer-motion";
import { Search, DollarSign, Zap } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description: "AI-powered product recommendations",
    gradient: "from-pink-500/10 to-rose-500/10",
  },
  {
    icon: DollarSign,
    title: "Best Prices",
    description: "Compare across multiple retailers",
    gradient: "from-amber-500/10 to-yellow-500/10",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Get it when you need it",
    gradient: "from-orange-500/10 to-red-500/10",
  },
];

const FeaturePills = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10 mt-6 sm:mt-8">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3 + index * 0.12,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-default"
        >
          <motion.div
            whileHover={{ scale: 1.08, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
          >
            <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/70" />
          </motion.div>
          <div className="text-center">
            <p className="text-[11px] sm:text-xs font-semibold tracking-tight text-foreground">
              {feature.title}
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[100px] sm:max-w-[120px]">
              {feature.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FeaturePills;
