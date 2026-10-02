import { dropFromRoster } from '../multiplayer/roster-removal';

/**
 * Host-side: a player removed mid-match (kick/leave) leaves the answer circle.
 * The current answerer stays the same person; if the answerer left, the next
 * remaining player takes over with a fresh turn timer (G7 / F14 / F19).
 */
export interface CategoryDrop<P> {
  players: P[];
  currentPlayerIndex: number;
  /** The answerer left during `playing`: the next player gets a fresh deadline. */
  restartTurn: boolean;
}

export function dropCategoryPlayers<P extends { id: string }>(players: readonly P[], currentPlayerIndex: number, phase: string, removed: readonly string[]): CategoryDrop<P> | null {
  const drop = dropFromRoster(players, currentPlayerIndex, removed);
  if (!drop) return null;
  return {
    players: drop.players,
    currentPlayerIndex: Math.max(0, drop.activeIdx),
    restartTurn: drop.activeRemoved && phase === 'playing' && drop.players.length > 0,
  };
}
