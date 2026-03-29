import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownOverlayProps {
  onComplete: () => void;
  startFrom?: number;
}

function playTick(isGo: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isGo ? 880 : 440;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + (isGo ? 0.2 : 0.1));
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Web Audio may not be available
  }
}

export function CountdownOverlay({ onComplete, startFrom = 3 }: CountdownOverlayProps) {
  const [count, setCount] = useState(startFrom);
  const completeCalled = useRef(false);

  const handleComplete = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    playTick(false);
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev - 1;
        if (next > 0) {
          playTick(false);
        } else if (next === 0) {
          playTick(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (count < 0) {
      handleComplete();
    }
  }, [count, handleComplete]);

  const display = count > 0 ? String(count) : count === 0 ? "GO!" : null;

  return (
    <AnimatePresence onExitComplete={count < 0 ? handleComplete : undefined}>
      {display !== null && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={display}
              className={
                count === 0
                  ? "text-9xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(236,72,153,0.7)]"
                  : "text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              }
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {display}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
