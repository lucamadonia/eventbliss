import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Origin = "top-right" | "top-left" | "center" | "cursor";

interface ConfettiBurstProps {
  /** Trigger a new burst. Flip from false→true (or bump a counter via keyed remount) to fire. */
  trigger?: boolean;
  /** Where the burst originates */
  origin?: Origin;
  /** Particle colors. Defaults to the EventBliss gradient. */
  colors?: string[];
  /** Number of particles. Default 24. */
  count?: number;
  /** Burst radius in px. Default 180. */
  radius?: number;
  /** Duration of each particle animation in seconds. Default 1.2s. */
  duration?: number;
  /** Cursor coords (0-100 %) when origin="cursor" */
  cursor?: { x: number; y: number };
  /** Called when the burst finishes (one tick after duration). */
  onDone?: () => void;
}

const DEFAULT_COLORS = ["#a855f7", "#ec4899", "#f59e0b", "#22d3ee", "#10b981"];

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ConfettiBurst({
  trigger = true,
  origin = "top-right",
  colors = DEFAULT_COLORS,
  count = 24,
  radius = 180,
  duration = 1.2,
  cursor,
  onDone,
}: ConfettiBurstProps) {
  const [active, setActive] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (!trigger || reducedMotion) return;
    setActive(true);
    const t = setTimeout(() => {
      setActive(false);
      onDone?.();
    }, duration * 1000 + 200);
    return () => clearTimeout(t);
  }, [trigger, duration, onDone, reducedMotion]);

  if (reducedMotion || !active) return null;

  const originStyle: React.CSSProperties = (() => {
    switch (origin) {
      case "top-right":
        return { top: 0, right: 0 };
      case "top-left":
        return { top: 0, left: 0 };
      case "center":
        return { top: "50%", left: "50%" };
      case "cursor":
        return cursor
          ? { top: `${cursor.y}%`, left: `${cursor.x}%` }
          : { top: "50%", left: "50%" };
    }
  })();

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    // slight randomness so bursts don't look mechanical
    const jitter = 0.6 + Math.random() * 0.8;
    const r = radius * jitter;
    const dx = Math.cos(angle) * r;
    const dy = Math.sin(angle) * r;
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 6;
    const rotate = Math.random() * 360;
    const delay = Math.random() * 0.08;
    return { dx, dy, color, size, rotate, delay };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-40"
      style={originStyle}
    >
      <AnimatePresence>
        {particles.map((p, i) => (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: p.dx,
              y: p.dy,
              scale: [0, 1, 1, 0.4],
              opacity: [1, 1, 1, 0],
              rotate: p.rotate,
            }}
            transition={{
              duration,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              boxShadow: `0 0 10px ${p.color}`,
              top: 0,
              left: 0,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ConfettiBurst;
