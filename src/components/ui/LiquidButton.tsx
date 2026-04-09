/**
 * LiquidButton — hero CTA with ripple + haptic + color pulse.
 * Extends the GradientButton pattern but with more dramatic tap feedback.
 */
import { forwardRef, ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const LiquidButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, className, onClick, disabled }, ref) => {
    const haptics = useHaptics();
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      haptics.medium();

      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipple(null), 600);

      onClick?.();
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        transition={spring.snappy}
        className={cn(
          "relative overflow-hidden rounded-2xl px-8 py-4 font-display font-bold text-lg text-white",
          "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500",
          "shadow-[0_10px_40px_-8px_rgba(139,92,246,0.5)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {/* Sheen sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />

        {/* Ripple from touch point */}
        {ripple && (
          <motion.span
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

LiquidButton.displayName = "LiquidButton";
