import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "primary" | "secondary" | "accent";
  className?: string;
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient = "primary",
  className,
  delay = 0,
}: FeatureCardProps) {
  const gradientClasses = {
    primary: "from-primary/20 to-primary/5",
    secondary: "from-accent/20 to-accent/5",
    accent: "from-neon-pink/20 to-neon-pink/5",
  };

  const iconGradients = {
    primary: "gradient-primary",
    secondary: "gradient-secondary",
    accent: "bg-gradient-to-br from-neon-pink to-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassCard
        variant="hover"
        className={cn(
          "group relative overflow-hidden h-full",
          className
        )}
      >
        {/* Gradient background on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            gradientClasses[gradient]
          )}
        />

        <div className="relative z-10">
          {/* Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
              iconGradients[gradient]
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
