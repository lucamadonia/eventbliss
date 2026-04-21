/**
 * AuroraBackground — Conic-gradient aurora field + grain overlay + optional
 * cursor-following spotlight. Composes on top of `AnimatedBackground` without
 * replacing it; use for dramatic "epic" sections (hero, final CTA).
 *
 * Respects prefers-reduced-motion via the CSS utilities (.aurora-field,
 * .grain-overlay) defined in src/index.css.
 */
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  /** Control the conic gradient intensity. */
  intensity?: "subtle" | "normal" | "intense";
  /** Enable a cursor-following spotlight (hover-capable devices only). */
  spotlight?: boolean;
  /** Add grain/noise overlay on top of the gradient. */
  grain?: boolean;
  children?: React.ReactNode;
}

const INTENSITY_OPACITY: Record<NonNullable<AuroraBackgroundProps["intensity"]>, number> = {
  subtle: 0.35,
  normal: 0.55,
  intense: 0.8,
};

export function AuroraBackground({
  className,
  intensity = "normal",
  spotlight = false,
  grain = true,
  children,
}: AuroraBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useSpring(mouseX, { stiffness: 150, damping: 20, mass: 0.5 });
  const spotlightY = useSpring(mouseY, { stiffness: 150, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (!spotlight || prefersReducedMotion) return;
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mediaQuery.matches) return;

    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [spotlight, prefersReducedMotion, mouseX, mouseY]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden isolate", className)}>
      {/* Aurora conic field */}
      <div
        className="aurora-field"
        style={{ opacity: INTENSITY_OPACITY[intensity] }}
        aria-hidden
      />

      {/* Cursor-follow spotlight */}
      {spotlight && !prefersReducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-px"
          style={{
            background: "radial-gradient(400px circle at var(--x) var(--y), hsl(var(--primary) / 0.18), transparent 70%)",
            ["--x" as string]: spotlightX,
            ["--y" as string]: spotlightY,
          }}
        />
      )}

      {/* Grain overlay */}
      {grain && <div className="grain-overlay absolute inset-0" aria-hidden />}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
