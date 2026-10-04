export interface TurnAfterRemoval<T> {
  players: T[];
  /** Index into the new `players` of whoever is (or is next) on turn. */
  currentIdx: number;
  /** A new turn must start now (the active player left, or a pending hand-over was due). */
  advance: boolean;
  /** The next turn passed the end of the order, i.e. a new round begins. */
  wrapped: boolean;
}

/**
 * Host, turn-based FIND IT modes: remove kicked/left players from the turn order (G7).
 * When the active player is gone - or `pendingAdvance` (a hand-over to the next player
 * was already scheduled) - the turn moves to the next remaining player in the old order.
 * Returns null when none of the ids is in the order.
 */
export function dropFromTurnOrder<T extends { id: string }>(players: T[], currentIdx: number, removedIds: readonly string[], pendingAdvance = false): TurnAfterRemoval<T> | null {
  const removed = new Set(removedIds);
  const kept = players.filter(p => !removed.has(p.id));
  if (kept.length === players.length) return null;
  if (!kept.length) return { players: kept, currentIdx: 0, advance: false, wrapped: false };
  const current = players[currentIdx];
  const currentGone = !!current && removed.has(current.id);
  if (!currentGone && !pendingAdvance) {
    return { players: kept, currentIdx: Math.max(0, current ? kept.indexOf(current) : Math.min(currentIdx, kept.length - 1)), advance: false, wrapped: false };
  }
  const start = currentGone ? currentIdx : currentIdx + 1;
  for (let i = start; i < start + players.length; i++) {
    const candidate = players[i % players.length];
    if (!removed.has(candidate.id)) return { players: kept, currentIdx: kept.indexOf(candidate), advance: true, wrapped: i >= players.length };
  }
  return { players: kept, currentIdx: 0, advance: true, wrapped: true };
}
