import { useEffect, useState } from "react";
import { isNative } from "@/lib/platform";

export interface AmbientMotionEnvironment {
  native: boolean;
  reducedMotion: boolean;
  pathname: string;
}

/** TV browsers often have far less compositor headroom than phones/laptops. */
export function isTVDisplayPath(pathname: string): boolean {
  return pathname === "/tv" || pathname.startsWith("/tv/");
}

/** Pure policy so the device/path contract can be regression-tested. */
export function shouldUseAmbientMotion({
  native,
  reducedMotion,
  pathname,
}: AmbientMotionEnvironment): boolean {
  return !native && !reducedMotion && !isTVDisplayPath(pathname);
}

function readAmbientMotionEnvironment(): AmbientMotionEnvironment {
  const hasWindow = typeof window !== "undefined";
  return {
    native: isNative(),
    reducedMotion: hasWindow && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
    pathname: hasWindow ? window.location.pathname : "",
  };
}

/**
 * Returns whether *decorative ambient* motion should run — i.e. always-on
 * background loops, particle fields, glow/breathing pulses (`repeat: Infinity`).
 *
 * It is FALSE when:
 *   - running inside a native WebView (`isNative()`) — these endless compositor
 *     loops are the main source of jank on iOS/Android, and
 *   - rendering the dedicated `/tv` display, whose Smart-TV compositor has a
 *     much smaller permanent blur/animation budget, and
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
  const [enabled, setEnabled] = useState<boolean>(() =>
    shouldUseAmbientMotion(readAmbientMotionEnvironment())
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(shouldUseAmbientMotion(readAmbientMotionEnvironment()));
    sync();
    if (isNative() || !mq) return;
    const onChange = () => sync();
    mq.addEventListener?.("change", onChange);
    window.addEventListener("popstate", sync);
    return () => {
      mq.removeEventListener?.("change", onChange);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return enabled;
}
