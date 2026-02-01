import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterPillsProps<T extends string> {
  options: { id: T; label: string; emoji?: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterPills<T extends string>({ 
  options, 
  value, 
  onChange,
  className 
}: FilterPillsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = value === option.id;
        
        return (
          <motion.button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              "border backdrop-blur-sm",
              isSelected
                ? "border-primary/50 bg-primary/20 text-primary shadow-lg shadow-primary/20"
                : "border-border bg-card/50 text-muted-foreground hover:bg-card hover:border-primary/30 hover:text-foreground"
            )}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {/* Selected indicator background */}
            {isSelected && (
              <motion.div
                layoutId="pill-indicator"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <span className="relative flex items-center gap-1.5">
              {option.emoji && (
                <span className="text-base">{option.emoji}</span>
              )}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-xs",
                  isSelected 
                    ? "bg-primary/30 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {option.count}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
