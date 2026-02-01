import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface StatsCounterProps {
  value: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export const StatsCounter = ({ 
  value, 
  label, 
  suffix = "+",
  icon,
  delay = 0 
}: StatsCounterProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    mass: 1
  });
  
  const display = useTransform(spring, (current) => 
    Math.floor(current)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      spring.set(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, spring, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20,
        scale: isVisible ? 1 : 0.9
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <GlassCard className="p-6 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-300">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-2 text-primary">
            {icon}
          </div>
        )}
        
        {/* Counter value */}
        <div className="relative">
          <motion.span className="font-display text-4xl md:text-5xl font-bold text-gradient-primary tabular-nums">
            {display}
          </motion.span>
          <span className="text-2xl md:text-3xl font-bold text-primary/70">
            {suffix}
          </span>
        </div>
        
        {/* Label */}
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          {label}
        </p>
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </GlassCard>
    </motion.div>
  );
};
