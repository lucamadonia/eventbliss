import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  duration?: number;
  currency?: string;
  locale?: string;
  className?: string;
}

/**
 * Smooth number count-up for money. Animates from the previous displayed
 * value to the new one using a gentle easeOut, ~0.9s default.
 */
export function CountUp({
  value,
  decimals = 2,
  duration = 0.9,
  currency = "EUR",
  locale = "de-DE",
  className,
}: CountUpProps) {
  const mv = useMotionValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      if (ref.current) {
        ref.current.textContent = new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
      }
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest);
        }
      },
    });
    return () => controls.stop();
  }, [value, mv, duration, locale, currency, decimals, reduced]);

  return (
    <span ref={ref} className={className + " tabular-nums"}>
      {new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)}
    </span>
  );
}
