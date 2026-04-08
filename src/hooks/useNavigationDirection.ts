/**
 * useNavigationDirection — determines whether the current navigation is
 * forward (push), back (pop), a tab switch, or a modal present.
 *
 * Strategy: track window.history.state.idx between location changes.
 * If idx increased → push. If decreased → pop. If same or no idx → tab/replace.
 *
 * Tab routes (passed in as `tabPaths`) always use 'tab' regardless of history.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export type NavDirection = "push" | "pop" | "tab" | "modal" | "initial";

interface Options {
  tabPaths?: string[];
  modalPaths?: string[];
}

export function useNavigationDirection({ tabPaths = [], modalPaths = [] }: Options = {}): NavDirection {
  const location = useLocation();
  const prevIdxRef = useRef<number | null>(null);
  const prevPathRef = useRef<string | null>(null);
  const directionRef = useRef<NavDirection>("initial");

  useEffect(() => {
    const state = (window.history.state ?? {}) as { idx?: number };
    const currentIdx = typeof state.idx === "number" ? state.idx : 0;
    const prevIdx = prevIdxRef.current;
    const prevPath = prevPathRef.current;

    if (prevIdx === null || prevPath === null) {
      directionRef.current = "initial";
    } else if (tabPaths.includes(location.pathname) && tabPaths.includes(prevPath)) {
      directionRef.current = "tab";
    } else if (modalPaths.some((p) => location.pathname.startsWith(p))) {
      directionRef.current = "modal";
    } else if (currentIdx > prevIdx) {
      directionRef.current = "push";
    } else if (currentIdx < prevIdx) {
      directionRef.current = "pop";
    } else {
      directionRef.current = "tab";
    }

    prevIdxRef.current = currentIdx;
    prevPathRef.current = location.pathname;
  }, [location.pathname, tabPaths, modalPaths]);

  return directionRef.current;
}
