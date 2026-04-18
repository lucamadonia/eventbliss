import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ConfettiProps {
  fire?: boolean;
  particles?: number;
  onDone?: () => void;
}

const COLORS = [
  "#7C5CFF", "#00E3FD", "#FF7350", "#FFD700",
  "#F0ABFC", "#84CC16", "#FACC15", "#22D3EE",
  "#36E0A0", "#FF6B8A",
];

/**
 * Lightweight confetti burst for celebration moments (debt settled, expense
 * saved). No canvas — pure absolute-positioned divs so it works with SSR
 * and reduced-motion gracefully.
 */
export function Confetti({ fire = false, particles = 80, onDone }: ConfettiProps) {
  const reduced = useReducedMotion();
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (!fire || reduced) return;
    setPieces(Array.from({ length: particles }, (_, i) => i));
    const t = setTimeout(() => {
      setPieces([]);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [fire, particles, reduced, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <AnimatePresence>
        {pieces.map((i) => {
          const angle = (Math.random() - 0.5) * 140; // spread in deg
          const distance = 40 + Math.random() * 50; // vh
          const rotate = (Math.random() - 0.5) * 720;
          const size = 6 + Math.random() * 8;
          const color = COLORS[i % COLORS.length];
          const delay = Math.random() * 0.1;
          const dur = 1.2 + Math.random() * 0.6;
          const shape = Math.random() > 0.5 ? "50%" : "2px";
          return (
            <motion.div
              key={i}
              initial={{ x: "50vw", y: "40vh", scale: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: `calc(50vw + ${Math.sin((angle * Math.PI) / 180) * distance}vh)`,
                y: `calc(40vh + ${-Math.cos((angle * Math.PI) / 180) * distance}vh)`,
                scale: 1,
                rotate,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur, delay, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "absolute",
                width: size,
                height: size * (Math.random() > 0.5 ? 1 : 1.6),
                background: color,
                borderRadius: shape,
                boxShadow: `0 0 10px ${color}40`,
                transformOrigin: "center",
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
