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

export function useBombTimer(
  minSeconds: number,
  maxSeconds: number,
  onExplode: () => void
) {
  const [hiddenDuration] = useState(
    () => Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
  );
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const onExplodeRef = useRef(onExplode);
  onExplodeRef.current = onExplode;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= hiddenDuration) {
          setIsRunning(false);
          onExplodeRef.current();
          return hiddenDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, hiddenDuration]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
  }, []);

  return { elapsed, isRunning, start, pause, reset, isTicking: isRunning };
}
