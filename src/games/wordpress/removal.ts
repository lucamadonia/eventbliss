/**
 * DRÜCK DAS WORT — host-side handling of players removed mid-match (kick/leave).
 * The roster is index-based (currentPlayerIndex, turnQueue), so removing a player
 * must remap every index. Removing the active player ends their turn at once:
 * the next queued player takes over, or the round closes when nobody is left.
 */
export type WordPressPhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';

export interface WordPressRosterState<P extends { id?: string }> {
  phase: WordPressPhase;
  players: P[];
  currentPlayerIndex: number;
  turnQueue: number[];
}

export interface WordPressRemoval<P extends { id?: string }> {
  changed: boolean;
  state: WordPressRosterState<P>;
  /** The active turn belonged to a removed player and was handed on / closed. */
  turnEnded: boolean;
}

export function removeFromWordPress<P extends { id?: string }>(
  state: WordPressRosterState<P>, removedIds: readonly string[],
): WordPressRemoval<P> {
  const removed = new Set(removedIds);
  const isRemoved = (p: P | undefined) => !!p?.id && removed.has(p.id);
  if (!state.players.some(isRemoved)) return { changed: false, state, turnEnded: false };

  const newIndex = new Map<number, number>();
  const players: P[] = [];
  state.players.forEach((p, i) => { if (!isRemoved(p)) { newIndex.set(i, players.length); players.push(p); } });
  let turnQueue = state.turnQueue.filter(i => newIndex.has(i)).map(i => newIndex.get(i)!);
  const current = newIndex.get(state.currentPlayerIndex);

  // Setup/gameOver have no running turn; roundEnd without a queue is the
  // standings screen. Only remap there.
  const turnPending = state.phase === 'playing' || (state.phase === 'roundEnd' && state.turnQueue.length > 0);
  if (current !== undefined || !turnPending) {
    return { changed: true, turnEnded: false, state: { ...state, players, turnQueue, currentPlayerIndex: current ?? 0 } };
  }

  // The active (or about-to-start) player is gone: next queued player, else close the round.
  if (turnQueue.length > 0) {
    const [next, ...rest] = turnQueue;
    turnQueue = rest;
    return { changed: true, turnEnded: true, state: { ...state, phase: 'playing', players, turnQueue, currentPlayerIndex: next } };
  }
  return { changed: true, turnEnded: true, state: { ...state, phase: 'roundEnd', players, turnQueue: [], currentPlayerIndex: 0 } };
}
