/**
 * CountdownPulse — 3-2-1-GO game countdown with massive pulsing numbers.
 *
 * Usage:
 *   <CountdownPulse seconds={3} onComplete={() => startGame()} />
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";

interface Props {
  seconds?: number;
  onComplete: () => void;
}

export function CountdownPulse({ seconds = 3, onComplete }: Props) {
  const [count, setCount] = useState(seconds);
  const haptics = useHaptics();

  useEffect(() => {
    if (count < 0) return;
    if (count === 0) {
      haptics.success();
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
    haptics.heavy();
    const timer = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(timer);
  }, [count, onComplete, haptics]);

  const isGo = count === 0;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          className="text-center"
          initial={{ scale: 2, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          exit={{ scale: 0.6, opacity: 0, filter: "blur(8px)" }}
          transition={spring.game}
        >
          <span
            className={`font-display font-black ${
              isGo
                ? "text-8xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]"
                : "text-9xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            }`}
          >
            {isGo ? "GO!" : count}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Pulsing ring on each tick */}
      <AnimatePresence>
        {!isGo && (
          <motion.div
            key={`ring-${count}`}
            className="absolute w-48 h-48 rounded-full border-2 border-primary"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
