/**
 * phase-gate — Phasenwechsel auf allen Geraeten im selben Moment (Masterplan
 * 4.1, Design §9: Abgang 280 ms → Titelband → Inhalt → Eingabe ab 1200 ms).
 *
 * Der Host plant den Wechsel mit `planPhaseStart()` (jetzt + Vorlauf, in
 * Serverzeit) und schickt die Zeit mit. Jedes Geraet — Host, Handys, TV —
 * zeigt bis dahin die ALTE Phase (gesperrt) und wechselt erst zu `startsAt`.
 * Eingaben in der neuen Phase sind erst nach dem Einblend-Takt frei. Wer zu
 * spaet ankommt, zeigt sofort die neue Phase (vorgespult).
 *
 * Rein: Zeiten kommen herein, der Hook (usePhaseGate.ts) sorgt fuers
 * Neuzeichnen.
 */
import { SCENE_LEAD_MS } from "@/lib/party-motion";

import { serverClock } from "./scene-clock";
import type { SceneClock } from "./scene-schedule";

/** Ab hier darf in der neuen Phase getippt werden (Design §9). */
export const PHASE_INPUT_DELAY_MS = 1200;

/** Host: Startzeit des naechsten Phasenwechsels (Serverzeit). */
export function planPhaseStart(clock: SceneClock = serverClock, leadMs = SCENE_LEAD_MS): number {
  return clock.now() + Math.max(0, leadMs);
}

export interface PhaseGateInput<P> {
  /** Zuletzt angezeigte Phase (vor dem Wechsel). */
  previous: P;
  /** Phase laut Spielzustand. */
  next: P;
  /** Geplanter Wechsel in Serverzeit; ohne → sofort, ohne Sperre. */
  startsAt?: number | null;
  /** Aktuelle Serverzeit. */
  now: number;
  inputDelayMs?: number;
}

export interface PhaseGate<P> {
  /** Was jetzt gezeigt wird. */
  shown: P;
  /** Wechsel steht noch aus (alte Phase, gesperrt). */
  pending: boolean;
  /** Eingaben erlaubt. */
  inputOpen: boolean;
  /** Seit dem Wechsel vergangen (0 vor dem Wechsel) — zum Vorspulen. */
  elapsedMs: number;
  /** Bis zum naechsten Zustandswechsel (Wechsel oder Eingabefreigabe); 0 = nichts mehr. */
  msUntilChange: number;
}

export function phaseGate<P>({ previous, next, startsAt, now, inputDelayMs = PHASE_INPUT_DELAY_MS }: PhaseGateInput<P>): PhaseGate<P> {
  if (startsAt == null || !Number.isFinite(startsAt)) {
    return { shown: next, pending: false, inputOpen: true, elapsedMs: 0, msUntilChange: 0 };
  }
  const delay = Math.max(0, inputDelayMs);
  if (now < startsAt) {
    return { shown: previous, pending: true, inputOpen: false, elapsedMs: 0, msUntilChange: startsAt - now };
  }
  const elapsedMs = now - startsAt;
  const inputOpen = elapsedMs >= delay;
  return { shown: next, pending: false, inputOpen, elapsedMs, msUntilChange: inputOpen ? 0 : delay - elapsedMs };
}
