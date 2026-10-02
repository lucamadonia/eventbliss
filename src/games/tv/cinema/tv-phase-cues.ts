/**
 * tv-phase-cues.ts — welche Phasenwechsel auf dem Fernseher eine Titelkarte
 * und/oder einen Ton bekommen.
 *
 * Die Zuordnung je Spiel lebt in cinema/cues/<spiel>.cue.ts (automatisch
 * eingesammelt). Hier nur der Einstieg, die Kartendauer und der Szenenuhr-Rest.
 */
import { GAME_CUES } from './cues';
import type { CueState, TVPhaseCue } from './cues/cue-kit';

export type { TVPhaseCue } from './cues/cue-kit';

export function phaseCueFor(game: string, state: CueState | null | undefined): TVPhaseCue | null {
  if (!state) return null;
  const phase = typeof state.phase === 'string' ? state.phase : '';
  if (!phase) return null;
  return GAME_CUES.get(game)?.(phase, state) ?? null;
}

/** Gesamtdauer einer Titelkarte (Eintritt + Halten + Austritt). */
export const PHASE_CARD_MS = 1700;

/**
 * Wie viel einer Karte bleibt, wenn die Phase laut Szenenuhr schon `elapsedMs`
 * laeuft. Ein spaet verbundener Fernseher holt nichts nach, was die Handys
 * schon hinter sich haben.
 */
export function remainingCardMs(elapsedMs: number | null, totalMs = PHASE_CARD_MS): number {
  if (elapsedMs === null || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return totalMs;
  return Math.max(0, totalMs - elapsedMs);
}

/** Spiele, deren Phasen-Toene aus diesen Cues kommen (nicht aus der allgemeinen Phasenlogik). */
export const CUE_GAMES: ReadonlySet<string> = new Set(GAME_CUES.keys());
