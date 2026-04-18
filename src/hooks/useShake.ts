import { useEffect, useRef } from "react";

interface UseShakeOptions {
  /** Minimum instantaneous acceleration (m/s²) that counts as a shake. Default 18. */
  threshold?: number;
  /** Minimum gap between triggers in ms so one shake doesn't fire twice. Default 800. */
  cooldownMs?: number;
  /** Set to false to pause the listener without unmounting. Default true. */
  enabled?: boolean;
}

/**
 * useShake — fires `onShake` when the device is shaken sharply.
 *
 * iOS 13+ requires an *explicit user gesture* to grant the DeviceMotion
 * permission. We call `requestPermission` on first touch/click. On
 * Android + desktop the listener binds immediately.
 *
 * Safe to use without Capacitor — works in any browser / WebView that
 * implements DeviceMotionEvent.
 */
export function useShake(onShake: () => void, opts: UseShakeOptions = {}): void {
  const { threshold = 18, cooldownMs = 800, enabled = true } = opts;
  const lastTriggerRef = useRef(0);
  const handlerRef = useRef(onShake);
  handlerRef.current = onShake;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") return;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      // Subtract gravity baseline (9.81 m/s²) so mag represents *delta*.
      if (Math.abs(mag - 9.81) < threshold) return;
      const now = Date.now();
      if (now - lastTriggerRef.current < cooldownMs) return;
      lastTriggerRef.current = now;
      handlerRef.current();
    };

    let attached = false;
    const attach = () => {
      if (attached) return;
      window.addEventListener("devicemotion", onMotion);
      attached = true;
    };

    const maybeRequest = (
      DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      }
    ).requestPermission;

    if (typeof maybeRequest === "function") {
      // iOS 13+: must call from a user gesture. Attach a one-shot
      // listener for the first tap — if permission is already granted
      // the call resolves immediately with "granted".
      const prime = async () => {
        try {
          const result = await maybeRequest();
          if (result === "granted") attach();
        } catch {
          // user denied — stay silent, don't pester
        }
        window.removeEventListener("touchstart", prime);
        window.removeEventListener("click", prime);
      };
      window.addEventListener("touchstart", prime, { once: true, passive: true });
      window.addEventListener("click", prime, { once: true });
      return () => {
        window.removeEventListener("touchstart", prime);
        window.removeEventListener("click", prime);
        if (attached) window.removeEventListener("devicemotion", onMotion);
      };
    }

    attach();
    return () => {
      if (attached) window.removeEventListener("devicemotion", onMotion);
    };
  }, [threshold, cooldownMs, enabled]);
}
