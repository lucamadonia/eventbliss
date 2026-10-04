/**
 * usePhaseGate — haelt eine neue Spielphase bis zu ihrem geplanten Start
 * zurueck und gibt Eingaben erst nach dem Einblend-Takt frei (phase-gate.ts).
 *
 *   // Host: phaseStartsAt = planPhaseStart() bei jedem Phasenwechsel,
 *   //       an Handys (Snapshot) und TV (Bridge) mitschicken.
 *   const gate = usePhaseGate(phase, online ? phaseStartsAt : null);
 *   // Rendern mit gate.shown statt phase; solange !gate.inputOpen nichts annehmen.
 *
 * Ohne `startsAt` (lokales Spiel) aendert sich nichts: sofort, ohne Sperre.
 */
import { useEffect, useReducer, useRef } from "react";

import { serverClock } from "./scene-clock";
import type { SceneClock } from "./scene-schedule";
import { phaseGate, PHASE_INPUT_DELAY_MS, type PhaseGate } from "./phase-gate";

export function usePhaseGate<P>(
  phase: P,
  startsAt: number | null | undefined,
  opts: { clock?: SceneClock; inputDelayMs?: number } = {},
): PhaseGate<P> {
  const clock = opts.clock ?? serverClock;
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  // Zuletzt WIRKLICH gezeigte Phase — sie bleibt sichtbar, bis der neue Start erreicht ist.
  const shownRef = useRef(phase);
  const gate = phaseGate({
    previous: shownRef.current,
    next: phase,
    startsAt,
    now: clock.now(),
    inputDelayMs: opts.inputDelayMs ?? PHASE_INPUT_DELAY_MS,
  });
  shownRef.current = gate.shown;

  useEffect(() => {
    if (gate.msUntilChange <= 0) return;
    const id = setTimeout(rerender, gate.msUntilChange + 5);
    return () => clearTimeout(id);
  });

  return gate;
}
