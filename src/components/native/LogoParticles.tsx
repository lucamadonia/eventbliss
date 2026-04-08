/**
 * LogoParticles — radial burst of 24 violet sparks behind the splash logo.
 * Pure framer-motion, no canvas, no new deps.
 */
import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  delay?: number;
  count?: number;
}

export function LogoParticles({ delay = 0, count = 24 }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 120 + Math.random() * 40;
        const size = 2 + Math.random() * 4;
        const duration = 0.6 + Math.random() * 0.3;
        const hue = Math.random() > 0.5 ? "262 83% 65%" : "330 81% 65%"; // violet or pink
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size,
          duration,
          color: `hsl(${hue})`,
        };
      }),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.3],
          }}
          transition={{
            delay,
            duration: p.duration,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.2, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}
