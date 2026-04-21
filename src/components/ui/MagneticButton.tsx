/**
 * MagneticButton — wraps any clickable child in a magnetic-cursor-follow
 * spring wrapper. On hover the element is pulled toward the cursor by
 * `strength` (0..1), and releases with a spring. Emits sparkle particles on
 * hover for extra glow. Pointer-device only.
 */
import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** 0 = no pull, 1 = aggressive pull. Default 0.35. */
  strength?: number;
  /** Enable sparkle trail on hover. */
  sparkles?: boolean;
  onClick?: () => void;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

let sparkleId = 0;

export function MagneticButton({
  children,
  className,
  strength = 0.35,
  sparkles = true,
  onClick,
}: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  const [sparkleList, setSparkleList] = useState<Sparkle[]>([]);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);

    if (sparkles && Math.random() > 0.6 && sparkleList.length < 6) {
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const id = ++sparkleId;
      setSparkleList((prev) => [...prev, { id, x: relX, y: relY }]);
      window.setTimeout(() => {
        setSparkleList((prev) => prev.filter((s) => s.id !== id));
      }, 700);
    }
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("relative inline-block", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
      {sparkles && !prefersReducedMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
          {sparkleList.map((s) => (
            <span
              key={s.id}
              className="sparkle-particle"
              style={{ left: s.x, top: s.y }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
