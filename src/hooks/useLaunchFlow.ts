/**
 * useLaunchFlow — state machine for app cold start on native platforms.
 *
 * Stages:
 *   splash       → animated React splash is playing
 *   onboarding   → first-launch tutorial slides
 *   ready        → handed off to the NativeShell, main app visible
 *
 * Persistence: eine VERSIONSNUMMER in localStorage (haelt unter Capacitor,
 * weil WKWebView sie ueber Sitzungen hinweg behaelt).
 */
import { useCallback, useState } from "react";

export type LaunchStage = "splash" | "onboarding" | "ready";

/**
 * Erhoehen, wenn das Intro so viel Neues zeigt, dass auch Bestandsnutzer es
 * einmal sehen sollen.
 *
 * WARUM EINE NUMMER STATT JA/NEIN: Frueher stand hier ein blosses
 * `hasOnboarded: true`. Wer die App einmal gestartet hatte, war damit fuer
 * IMMER ausgesperrt. Als das Intro von vier Symbol-Folien auf sieben Szenen
 * mit Party-Modus, TV-Buehne und Siegerehrung umgebaut wurde, hiess das:
 * ausgerechnet die Leute, die diese Funktionen noch nie gesehen hatten,
 * bekamen sie nie zu sehen — nur brandneue Installationen.
 *
 * Version 2 = die sieben Szenen (1.4.x).
 * Version 3 = Premium-Nutzenstory, Direktnachrichten und neue Keyvisuals.
 */
const ONBOARDING_VERSION = 3;

const VERSION_KEY = "eventbliss.onboardingVersion";
/** Der alte Ja/Nein-Merker. Bleibt nur fuer die Uebernahme bestehen. */
const LEGACY_KEY = "eventbliss.hasOnboarded";

/**
 * Welche Intro-Version hat dieses Geraet schon gesehen?
 *
 * `0` heisst: noch gar keins. Ein Geraet mit dem alten Merker zaehlt als
 * Version 1 — sonst wuerde die Uebernahme es wie eine Neuinstallation
 * behandeln und das Intro spaeter ein zweites Mal zeigen.
 */
const getSeenVersion = (): number => {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (raw !== null) {
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) ? n : 0;
    }
    return localStorage.getItem(LEGACY_KEY) === "true" ? 1 : 0;
  } catch {
    // Privater Modus o. Ae.: lieber einmal zu viel zeigen als nie.
    return 0;
  }
};

const markSeen = (): void => {
  try {
    localStorage.setItem(VERSION_KEY, String(ONBOARDING_VERSION));
    // Aufraeumen, damit nicht zwei Merker nebeneinander leben und spaeter
    // niemand raten muss, welcher gilt.
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
};

export function useLaunchFlow() {
  const [stage, setStage] = useState<LaunchStage>("splash");

  const completeSplash = useCallback(() => {
    setStage(getSeenVersion() >= ONBOARDING_VERSION ? "ready" : "onboarding");
  }, []);

  const completeOnboarding = useCallback(() => {
    markSeen();
    setStage("ready");
  }, []);

  /** Dev helper: reset onboarding (call from a debug menu) */
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { stage, completeSplash, completeOnboarding, resetOnboarding };
}
