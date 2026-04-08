/**
 * useLaunchFlow — state machine for app cold start on native platforms.
 *
 * Stages:
 *   splash       → animated React splash is playing
 *   onboarding   → first-launch tutorial slides
 *   ready        → handed off to the NativeShell, main app visible
 *
 * Persistence: "hasOnboarded" flag in localStorage (works cross-platform
 * under Capacitor since WKWebView persists it across sessions).
 */
import { useCallback, useState } from "react";

export type LaunchStage = "splash" | "onboarding" | "ready";

const ONBOARDED_KEY = "eventbliss.hasOnboarded";

const getHasOnboarded = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "true";
  } catch {
    return false;
  }
};

const setHasOnboarded = (): void => {
  try {
    localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {
    /* ignore */
  }
};

export function useLaunchFlow() {
  const [stage, setStage] = useState<LaunchStage>("splash");

  const completeSplash = useCallback(() => {
    setStage(getHasOnboarded() ? "ready" : "onboarding");
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasOnboarded();
    setStage("ready");
  }, []);

  /** Dev helper: reset onboarding (call from a debug menu) */
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDED_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { stage, completeSplash, completeOnboarding, resetOnboarding };
}
