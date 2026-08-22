import { useEffect, useRef, useState } from 'react';

/**
 * Animated score tick used by every cinematic TV reveal (game over, party
 * standings, party finale). Deliberately transform-free — it only changes a
 * number, so it costs nothing on a WebView compositor.
 *
 * @param target   final value
 * @param duration seconds the count-up takes
 * @param start    gate — while false the value stays at 0
 */
export function useCountUp(target: number, duration: number, start: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

export default useCountUp;
