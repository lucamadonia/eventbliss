/**
 * Host-side roster repair when the room removes players mid-match (kick/leave).
 * The bomb's turn index is matched against `online.players` by position, so the
 * game roster must drop exactly the same ids. If the removed player held the
 * bomb, it passes to the next remaining player in seat order; the fuse keeps
 * running. Revision is bumped so any pending answer for the old turn is stale.
 */
export interface BombRosterState {
  players: { id?: string }[];
  currentPlayerIndex: number;
  explodedPlayerIndex: number;
  revision?: number;
}

export function removeBombPlayers<T extends BombRosterState>(state: T, removedIds: readonly string[]): T {
  const removed = new Set(removedIds);
  const isGone = (p: { id?: string }) => !!p.id && removed.has(p.id);
  if (!state.players.some(isGone)) return state;

  const players = state.players.filter(p => !isGone(p)) as T['players'];
  // First surviving seat at or after the old holder (wrapping) takes the bomb.
  let currentPlayerIndex = 0;
  const n = state.players.length;
  for (let step = 0; step < n; step++) {
    const seat = state.players[(state.currentPlayerIndex + step) % n];
    if (seat && !isGone(seat)) { currentPlayerIndex = players.indexOf(seat); break; }
  }
  const exploded = state.players[state.explodedPlayerIndex];
  const explodedPlayerIndex = exploded && !isGone(exploded) ? players.indexOf(exploded) : -1;

  return {
    ...state,
    players,
    currentPlayerIndex: Math.max(0, currentPlayerIndex),
    explodedPlayerIndex,
    revision: (state.revision ?? 0) + 1,
  };
}
