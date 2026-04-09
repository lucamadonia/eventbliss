/**
 * usePullToRefresh — elastic rubber-band pull gesture with haptic threshold.
 *
 * Returns:
 *   - containerProps: spread on the scroll container
 *   - indicatorY: motion value for the pull indicator position
 *   - isRefreshing: true while the onRefresh callback is pending
 *   - PullIndicator: ready-to-render component
 *
 * Usage:
 *   const { containerRef, isRefreshing, PullIndicator } = usePullToRefresh({
 *     onRefresh: async () => { await refetch(); }
 *   });
 *   <div ref={containerRef} className="native-scroll">
 *     <PullIndicator />
 *     ...content
 *   </div>
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useHaptics } from "./useHaptics";
import { isNative } from "@/lib/platform";

interface Options {
  onRefresh: () => Promise<void>;
  threshold?: number; // px to trigger, default 80
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const haptics = useHaptics();
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const triggered = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop > 5) return; // only at top
    touchStartY.current = e.touches[0].clientY;
    pulling.current = true;
    triggered.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy < 0) { pullY.set(0); return; }
      // Rubber band: diminishing returns past threshold
      const resistance = dy > threshold ? threshold + (dy - threshold) * 0.3 : dy;
      pullY.set(resistance);

      if (dy >= threshold && !triggered.current) {
        triggered.current = true;
        haptics.medium();
      }
    },
    [isRefreshing, pullY, threshold, haptics]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (triggered.current && !isRefreshing) {
      setIsRefreshing(true);
      animate(pullY, 60, { type: "spring", stiffness: 200, damping: 20 });
      try {
        await onRefresh();
      } catch {
        /* ignore */
      }
      setIsRefreshing(false);
      haptics.success();
    }
    animate(pullY, 0, { type: "spring", stiffness: 300, damping: 25 });
    triggered.current = false;
  }, [isRefreshing, onRefresh, pullY, haptics]);

  useEffect(() => {
    if (!isNative()) return;
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const opacity = useTransform(pullY, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const rotate = useTransform(pullY, [0, threshold], [0, 360]);

  const PullIndicator = useCallback(
    () => (
      <motion.div
        style={{ height: pullY, opacity }}
        className="flex items-center justify-center overflow-hidden"
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <motion.div style={{ rotate }}>
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent" />
          </motion.div>
        )}
      </motion.div>
    ),
    [pullY, opacity, rotate, isRefreshing]
  );

  return { containerRef, isRefreshing, PullIndicator };
}
