/**
 * ConfettiBurst — 30-particle celebration burst.
 * Pure framer-motion, theme colors (violet/pink/gold/cyan).
 *
 * Usage:
 *   const { fire, ConfettiComponent } = useConfetti();
 *   <button onClick={fire}>Celebrate!</button>
 *   <ConfettiComponent />
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  duration: number;
  delay: number;
  shape: "rect" | "circle";
}

const COLORS = [
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F59E0B", // amber/gold
  "#06B6D4", // cyan
  "#10B981", // emerald
  "#F43F5E", // rose
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() - 0.5) * Math.PI; // -90° to +90° upward
    const speed = 200 + Math.random() * 300;
    return {
      id: i,
      x: Math.sin(angle) * speed,
      y: -Math.cos(angle) * speed + Math.random() * 200, // gravity falloff
      rotation: (Math.random() - 0.5) * 720,
      scale: 0.5 + Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 0.8 + Math.random() * 0.6,
      delay: Math.random() * 0.15,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    };
  });
}

interface ConfettiBurstProps {
  active: boolean;
  count?: number;
  onComplete?: () => void;
}

export function ConfettiBurst({ active, count = 30, onComplete }: ConfettiBurstProps) {
  const particles = useMemo(() => generateParticles(count), [count, active]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {active && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                width: p.shape === "rect" ? 8 * p.scale : 6 * p.scale,
                height: p.shape === "rect" ? 4 * p.scale : 6 * p.scale,
                backgroundColor: p.color,
                borderRadius: p.shape === "circle" ? "50%" : "1px",
              }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
                rotate: p.rotation,
                scale: [0, p.scale, p.scale * 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.6, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/** Hook for imperative confetti firing */
export function useConfetti() {
  const [active, setActive] = useState(false);

  const fire = useCallback(() => {
    setActive(true);
    setTimeout(() => setActive(false), 1500);
  }, []);

  const ConfettiComponent = useCallback(
    () => <ConfettiBurst active={active} />,
    [active]
  );

  return { fire, active, ConfettiComponent };
}
