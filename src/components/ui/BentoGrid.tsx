/**
 * BentoGrid + BentoCard — asymmetric slot-based grid for feature showcases.
 * Each `BentoCard` accepts a `span` hint (1..4 cols, 1..2 rows). Cursor
 * spotlight follows pointer via CSS vars. Falls back to plain card under
 * prefers-reduced-motion.
 */
import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[180px] md:auto-rows-[200px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** Column span at md+ breakpoint. */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span at md+ breakpoint. */
  rowSpan?: 1 | 2;
  /** Gradient hint for the spotlight halo. Tailwind `from-X to-Y`. */
  gradient?: string;
  /** Optional click handler. */
  onClick?: () => void;
}

const COL_SPAN: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "md:col-span-3 col-span-2",
  4: "md:col-span-4 col-span-2",
};

const ROW_SPAN: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
};

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  gradient = "from-primary/20 to-accent/20",
  onClick,
}: BentoCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "glass-card transition-all duration-300",
        "hover:border-primary/30 hover:-translate-y-0.5",
        "bg-gradient-to-br",
        gradient,
        COL_SPAN[colSpan],
        rowSpan === 2 ? `md:${ROW_SPAN[2]}` : ROW_SPAN[1],
        onClick && "cursor-pointer",
        className,
      )}
      onMouseMove={handleMove}
      onClick={onClick}
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Cursor spotlight */}
      {!prefersReducedMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--primary) / 0.25), transparent 60%)",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full p-5 md:p-6 flex flex-col">{children}</div>
    </motion.div>
  );
}
