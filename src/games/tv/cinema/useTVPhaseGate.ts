import { useEffect, useRef, useState } from 'react';
import { serverClock } from '@/games/party/scene-clock';
import type { TVState } from '../useTVConnection';

/** Weiter in der Zukunft geplante Wechsel gelten als Uhrfehler — nicht ewig festhalten. */
const MAX_HOLD_MS = 3000;

function plannedStart(state: TVState | null): number | null {
  const v = state?.phaseStartsAt;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Phasenwechsel auf dem Fernseher zur GEPLANTEN gemeinsamen Zeit
 * (`phaseStartsAt` = Serverzeit + Vorlauf, siehe party/phase-gate.ts):
 * Kommt ein neuer Spielzustand mit einer neuen Phase frueher an, zeigt der TV
 * die alte Phase weiter und wechselt erst zum geplanten Moment — zusammen mit
 * Host und Handys. Kommt er spaeter, wechselt er sofort (die Karte spult vor).
 *
 * Zustaende innerhalb derselben Phase gehen sofort durch (Uhr, Punkte).
 */
export function useTVPhaseGate(state: TVState | null): TVState | null {
  const [shown, setShown] = useState<TVState | null>(state);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const current = shownRef.current;
    const samePhase = !!current && !!state && current.game === state.game && current.phase === state.phase;
    const startsAt = plannedStart(state);
    if (!state || samePhase || startsAt === null) { setShown(state); return; }
    const wait = serverClock.toLocal(startsAt) - Date.now();
    if (wait <= 0 || wait > MAX_HOLD_MS) { setShown(state); return; }
    const id = window.setTimeout(() => setShown(state), wait);
    return () => window.clearTimeout(id);
  }, [state]);

  return shown;
}
