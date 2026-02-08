import { motion } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

const SegmentedControl = ({ options, value, onChange }: SegmentedControlProps) => {
  const selectedIndex = options.findIndex((o) => o.value === value);

  return (
    <div className="relative flex bg-secondary/60 rounded-xl p-1">
      {/* Animated indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-card shadow-card"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 text-center text-xs font-medium py-2 px-2 rounded-lg transition-colors ${
            value === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
