import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AffiliateStatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  gradient: string;
  delay?: number;
}

export function AffiliateStatsCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  gradient,
  delay = 0,
}: AffiliateStatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val: number) => {
    if (suffix === "%") {
      return val.toFixed(1);
    }
    if (prefix === "€" || prefix === "$") {
      return val.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(val).toLocaleString("de-DE");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-6 relative overflow-hidden group"
    >
      {/* Gradient Glow Background */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`}
      />
      
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Title */}
      <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>

      {/* Value with Animation */}
      <motion.div 
        className="flex items-baseline gap-1"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
      >
        <span className="text-3xl font-bold tracking-tight">
          {prefix}{formatValue(displayValue)}{suffix}
        </span>
      </motion.div>

      {/* Trend Indicator */}
      {trend !== undefined && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.4 }}
          className={`mt-2 text-sm font-medium flex items-center gap-1 ${
            trend >= 0 ? "text-success" : "text-destructive"
          }`}
        >
          <span>{trend >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(trend)}% vs. letzten Monat</span>
        </motion.div>
      )}
    </motion.div>
  );
}
