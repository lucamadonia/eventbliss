/**
 * Pure helpers for games that keep their own roster from match start (6.6):
 * drop removed players and keep turn pointers on the same people.
 */
export interface RosterDrop<P> {
  players: P[];
  /** Index of the same active player in the new roster, or the player who now stands in that seat when the active one left. -1 when nobody is left. */
  activeIdx: number;
  /** The active player was removed: skip the rest of their turn (T06/T07). */
  activeRemoved: boolean;
  removedIds: string[];
}

/** Null when nobody of the roster was removed. Turn order stays the same for everyone else. */
export function dropFromRoster<P extends { id: string }>(players: readonly P[], activeIdx: number, removed: readonly string[]): RosterDrop<P> | null {
  const gone = new Set(removed);
  const removedIds = players.filter(player => gone.has(player.id)).map(player => player.id);
  if (!removedIds.length) return null;
  const next = players.filter(player => !gone.has(player.id));
  const active = players[activeIdx];
  const activeRemoved = !!active && gone.has(active.id);
  let idx = -1;
  if (next.length) {
    if (active && !activeRemoved) idx = next.indexOf(active);
    else {
      // The next remaining player after the removed one takes over the seat (wraps around).
      const after = players.slice(activeIdx + 1).concat(players.slice(0, Math.max(0, activeIdx))).find(player => !gone.has(player.id));
      idx = after ? next.indexOf(after) : 0;
    }
  }
  return { players: next, activeIdx: idx, activeRemoved, removedIds };
}

/** Same as dropFromRoster for id-based turn pointers. */
export function nextActiveId(order: readonly string[], activeId: string | null, removed: readonly string[]): string | null {
  const gone = new Set(removed);
  if (!activeId || !gone.has(activeId)) return activeId;
  const at = order.indexOf(activeId);
  const rotated = at < 0 ? order : order.slice(at + 1).concat(order.slice(0, at));
  return rotated.find(id => !gone.has(id)) ?? null;
}

/** Drop removed voters/answers from a per-player record. */
export function withoutIds<V>(record: Readonly<Record<string, V>>, removed: readonly string[]): Record<string, V> {
  return Object.fromEntries(Object.entries(record).filter(([id]) => !removed.includes(id)));
}
