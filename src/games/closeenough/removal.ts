/**
 * NAH DRAN — Spieler mitten im Match entfernen (Kick/Verlassen, Host-seitig).
 *
 * NAH DRAN hat keine Schlüsselrolle: alle schätzen gleichzeitig. Entfernen
 * heißt also nur, den Spieler aus Kader, Tipps und Ergebnis zu streichen. Hat
 * danach jeder Verbliebene getippt, darf die Runde sofort aufgelöst werden —
 * sonst wartete die Runde bis zum Timeout auf jemanden, der weg ist.
 */
import type { CeResult } from './closeenough-scoring';

type RemovablePlayer = { id: string; memberIds?: string[]; memberNames?: string[] };

export interface CeRemovalState<P extends RemovablePlayer> {
  players: P[];
  guesses: Record<string, number | null>;
  results: CeResult[] | null;
}

export interface CeRemovalOutcome<P extends RemovablePlayer> extends CeRemovalState<P> {
  /** Jeder verbliebene Spieler hat abgegeben (und es gibt noch Spieler). */
  allSubmitted: boolean;
}

/** `null`, wenn keiner der IDs (mehr) im Spiel steckt — dann nichts tun. */
export function dropRemovedPlayers<P extends RemovablePlayer>(
  state: CeRemovalState<P>,
  removedIds: readonly string[],
): CeRemovalOutcome<P> | null {
  const gone = new Set(removedIds);
  const touches =
    state.players.some((p) => gone.has(p.id) || p.memberIds?.some((id) => gone.has(id))) ||
    Object.keys(state.guesses).some((id) => gone.has(id)) ||
    (state.results?.some((r) => gone.has(r.playerId)) ?? false);
  if (!touches) return null;

  const players = state.players.flatMap((player) => {
    if (gone.has(player.id)) return [];
    if (!player.memberIds?.some((id) => gone.has(id))) return [player];
    const members = player.memberIds.map((id, index) => ({ id, name: player.memberNames?.[index] ?? '' }))
      .filter((member) => !gone.has(member.id));
    if (!members.length) return [];
    return [{ ...player, memberIds: members.map((member) => member.id), memberNames: members.map((member) => member.name) } as P];
  });
  const active = new Set(players.map((player) => player.id));
  const guesses = Object.fromEntries(Object.entries(state.guesses).filter(([id]) => active.has(id)));
  const results = state.results ? state.results.filter((result) => active.has(result.playerId)) : null;
  const allSubmitted = players.length > 0 && players.every((p) => p.id in guesses);
  return { players, guesses, results, allSubmitted };
}
