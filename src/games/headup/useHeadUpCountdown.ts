/**
 * useHeadUpCountdown — zeigt die Countdown-Ziffer aus der gemeinsamen
 * Szenenuhr und zeichnet genau zum naechsten Ziffernwechsel neu (party-play.ts).
 */
import { useEffect, useReducer } from "react";

import { serverClock } from "../party/scene-clock";
import { headUpCountdown } from "./party-play";

export function useHeadUpCountdown(startsAt: number | null): number | null {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const { value, msUntilNext } = headUpCountdown(startsAt, serverClock);
  useEffect(() => {
    if (value === null || msUntilNext <= 0) return;
    const id = setTimeout(rerender, msUntilNext + 5);
    return () => clearTimeout(id);
  });
  return value;
}

/** Startzeit eines neuen Countdowns (Serverzeit, erste Ziffer sofort). */
export const countdownStartNow = (): number => serverClock.now();

export { headUpTurnClosed } from "./party-play";
