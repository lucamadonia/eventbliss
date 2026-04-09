/**
 * useSwipeBack — iOS-style swipe-from-left-edge to go back.
 *
 * Attaches to a container ref. When user drags from the left 20px edge
 * rightward past threshold (80px), calls navigate(-1).
 *
 * Only active on iOS native. Disabled on specific routes (games).
 *
 * Usage:
 *   const swipeRef = useSwipeBack();
 *   <div ref={swipeRef}>...</div>
 */
import { useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isIOS, isNative } from "@/lib/platform";
import { haptics } from "@/hooks/useHaptics";

const EDGE_ZONE = 24; // px from left edge
const THRESHOLD = 80; // px drag distance to trigger
const DISABLED_PREFIXES = ["/games/"]; // don't swipe back during games

export function useSwipeBack() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const isDisabled = DISABLED_PREFIXES.some((p) => location.pathname.startsWith(p));

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isDisabled) return;
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE) return; // not from edge
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      tracking.current = true;
    },
    [isDisabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = Math.abs(touch.clientY - startY.current);
      // Must be mostly horizontal and past threshold
      if (dx > THRESHOLD && dy < dx * 0.5) {
        haptics.light();
        navigate(-1);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!isNative() || !isIOS()) return;
    const el = ref.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
