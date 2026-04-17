import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIRequestCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;          // e.g. "from-purple-600 via-pink-600 to-amber-500"
  accentColor: string;       // rgb tuple for spotlight (e.g. "236,72,153")
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  lockedLabel?: string;      // shown over desaturated card when disabled
  badge?: string;            // optional top-right pill, e.g. "NEU"
  index?: number;            // for stagger reveal
}

export function AIRequestCard({
  label,
  description,
  icon: Icon,
  gradient,
  accentColor,
  onClick,
  isLoading = false,
  disabled = false,
  lockedLabel,
  badge,
  index = 0,
}: AIRequestCardProps) {
  const [mouse, setMouse] = useState({ x: 50, y: 50, active: false });

  const handleMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y, active: true });
  }, []);

  const handleLeave = useCallback(() => {
    setMouse((m) => ({ ...m, active: false }));
  }, []);

  const locked = disabled || isLoading;

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={locked ? undefined : { y: -3 }}
      whileTap={locked ? undefined : { scale: 0.98 }}
      onClick={locked ? undefined : onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      disabled={locked}
      className={cn(
        "group relative overflow-hidden rounded-2xl text-left p-5 min-h-[168px] flex flex-col",
        "border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02]",
        "transition-all duration-300",
        !locked && "hover:border-white/25 cursor-pointer",
        locked && "cursor-not-allowed",
        isLoading && "liquid-shimmer",
      )}
      style={{
        boxShadow: mouse.active && !locked
          ? `0 20px 50px -20px rgba(${accentColor}, 0.4)`
          : "0 6px 20px -8px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Mouse-tracking radial spotlight */}
      {!locked && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: mouse.active ? 1 : 0,
            background: `radial-gradient(350px circle at ${mouse.x}% ${mouse.y}%, rgba(${accentColor}, 0.18), transparent 60%)`,
          }}
        />
      )}

      {/* Gradient sheen on hover (diagonal) */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none bg-gradient-to-br",
          gradient,
          "mix-blend-overlay",
        )}
        style={{ opacity: mouse.active && !locked ? 0.12 : 0 }}
      />

      {/* Decorative blur glow bottom-right */}
      <div
        aria-hidden
        className={cn(
          "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none bg-gradient-to-br",
          gradient,
        )}
      />

      {/* Content */}
      <div className="relative flex items-start justify-between mb-4">
        <motion.div
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
            gradient,
            disabled && "grayscale opacity-60",
          )}
          whileHover={locked ? undefined : { y: -4, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
          )}
        </motion.div>
        {badge && !disabled && (
          <span className="text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-pink-500 to-amber-500 px-2 py-0.5 rounded-full shadow-md">
            {badge}
          </span>
        )}
        {disabled && lockedLabel && (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
            <Lock className="w-2.5 h-2.5" />
            {lockedLabel}
          </span>
        )}
      </div>

      <div className="relative flex-1">
        <div className={cn(
          "font-black text-base md:text-lg leading-tight mb-1.5",
          disabled ? "text-white/50" : "text-white",
        )}>
          {label}
        </div>
        <div className={cn(
          "text-xs md:text-[13px] leading-relaxed",
          disabled ? "text-white/35" : "text-white/65",
        )}>
          {description}
        </div>
      </div>

      {/* Bottom accent line — fills in on hover */}
      <div className="relative mt-4 h-[3px] rounded-full bg-white/5 overflow-hidden">
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-0 group-hover:w-full transition-[width] duration-500 ease-out bg-gradient-to-r",
            gradient,
          )}
        />
      </div>
    </motion.button>
  );
}
