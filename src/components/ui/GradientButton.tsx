import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      disabled,
      onClick,
      type = "button",
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
      primary:
        "gradient-primary text-white shadow-neon hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]",
      secondary:
        "gradient-secondary text-white shadow-md hover:shadow-glow",
      outline:
        "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
      ghost:
        "bg-transparent text-foreground hover:bg-foreground/10",
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        disabled={disabled || loading}
        onClick={onClick}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon}
        {children}
      </motion.button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export { GradientButton };
