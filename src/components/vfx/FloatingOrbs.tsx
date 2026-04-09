/**
 * FloatingOrbs — ambient drifting blur circles for home/splash backgrounds.
 * Smooth 15-30s loops, mix-blend-mode screen, very subtle.
 */
import { motion } from "framer-motion";

const orbs = [
  { size: 280, x1: "10%", x2: "60%", y1: "5%", y2: "25%", dur: 25, color: "rgba(139, 92, 246, 0.15)", blur: "80px" },
  { size: 240, x1: "70%", x2: "30%", y1: "15%", y2: "45%", dur: 30, color: "rgba(236, 72, 153, 0.12)", blur: "70px" },
  { size: 200, x1: "40%", x2: "80%", y1: "60%", y2: "30%", dur: 22, color: "rgba(6, 182, 212, 0.1)", blur: "60px" },
  { size: 160, x1: "20%", x2: "50%", y1: "70%", y2: "50%", dur: 28, color: "rgba(245, 158, 11, 0.08)", blur: "50px" },
];

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            backgroundColor: orb.color,
            filter: `blur(${orb.blur})`,
            mixBlendMode: "screen",
          }}
          animate={{
            left: [orb.x1, orb.x2, orb.x1],
            top: [orb.y1, orb.y2, orb.y1],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
