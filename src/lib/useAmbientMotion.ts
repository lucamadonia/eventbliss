import { useEffect, useState } from "react";
import { isNative } from "@/lib/platform";

/**
 * Returns whether *decorative ambient* motion should run — i.e. always-on
 * background loops, particle fields, glow/breathing pulses (`repeat: Infinity`).
 *
 * It is FALSE when:
 *   - running inside a native WebView (`isNative()`) — these endless compositor
 *     loops are the main source of jank on iOS/Android, and
 *   - the user has `prefers-reduced-motion: reduce` set.
 *
 * Purposeful UI motion (button presses, page/tab transitions, mount reveals,
 * one-shot game beats) must NOT gate on this — only gate decoration that would
 * otherwise run forever. Usage:
 *
 *   const ambient = useAmbientMotion();
 *   {ambient && <motion.div animate={{ y: [0,-8,0] }} transition={{ repeat: Infinity, duration: duration.ambient }} />}
 */
export function useAmbientMotion(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (isNative()) return false;
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (isNative() || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setEnabled(!mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return enabled;
}
