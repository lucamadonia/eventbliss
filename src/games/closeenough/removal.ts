/**
 * NAH DRAN — Spieler mitten im Match entfernen (Kick/Verlassen, Host-seitig).
 *
 * NAH DRAN hat keine Schlüsselrolle: alle schätzen gleichzeitig. Entfernen
 * heißt also nur, den Spieler aus Kader, Tipps und Ergebnis zu streichen. Hat
 * danach jeder Verbliebene getippt, darf die Runde sofort aufgelöst werden —
 * sonst wartete die Runde bis zum Timeout auf jemanden, der weg ist.
 */
import type { CeResult } from './closeenough-scoring';

export interface CeRemovalState<P extends { id: string }> {
  players: P[];
  guesses: Record<string, number | null>;
  results: CeResult[] | null;
}

export interface CeRemovalOutcome<P extends { id: string }> extends CeRemovalState<P> {
  /** Jeder verbliebene Spieler hat abgegeben (und es gibt noch Spieler). */
  allSubmitted: boolean;
}

/** `null`, wenn keiner der IDs (mehr) im Spiel steckt — dann nichts tun. */
export function dropRemovedPlayers<P extends { id: string }>(
  state: CeRemovalState<P>,
  removedIds: readonly string[],
): CeRemovalOutcome<P> | null {
  const gone = new Set(removedIds);
  const touches =
    state.players.some((p) => gone.has(p.id)) ||
    Object.keys(state.guesses).some((id) => gone.has(id)) ||
    (state.results?.some((r) => gone.has(r.playerId)) ?? false);
  if (!touches) return null;

  const players = state.players.filter((p) => !gone.has(p.id));
  const guesses = Object.fromEntries(Object.entries(state.guesses).filter(([id]) => !gone.has(id)));
  const results = state.results ? state.results.filter((r) => !gone.has(r.playerId)) : null;
  const allSubmitted = players.length > 0 && players.every((p) => p.id in guesses);
  return { players, guesses, results, allSubmitted };
}
