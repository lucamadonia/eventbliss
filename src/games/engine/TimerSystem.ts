import { useState, useEffect, useCallback, useRef } from "react";

export function useGameTimer(initialSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((seconds?: number) => {
    setTimeLeft(seconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  const percentLeft = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  return { timeLeft, isRunning, start, pause, reset, percentLeft };
}

// NOTE: BombGame has its own useBombTimer (different signature/semantics) in
// src/games/bomb/BombGame.tsx. The unused engine variant was removed so the
// two can't be confused.
