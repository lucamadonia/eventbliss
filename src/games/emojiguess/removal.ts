import { dropFromRoster } from '../multiplayer/roster-removal';

/**
 * Host-side: a player was removed mid-match (kick/leave, G7). The rotation keeps
 * its order and every remaining score; if the removed player held the current
 * puzzle, the turn goes to the next player as if it had been skipped.
 */
export interface EmojiRemovalState<P extends { id: string }> {
  phase: string;
  players: P[];
  currentPlayerIdx: number;
  currentRound: number;
  totalRounds: number;
}
export interface EmojiRemovalResult<P extends { id: string }> {
  players: P[];
  currentPlayerIdx: number;
  currentRound: number;
  /** The puzzle holder left: start the next player's turn with a fresh puzzle. */
  restartTurn: boolean;
  /** The puzzle holder was the last turn of the last round: the match is over. */
  finished: boolean;
}

const LIVE_PHASES = ['ready', 'playing', 'reveal'];

export function applyEmojiRemoval<P extends { id: string }>(state: EmojiRemovalState<P>, removed: readonly string[]): EmojiRemovalResult<P> | null {
  if (!LIVE_PHASES.includes(state.phase)) return null;
  const drop = dropFromRoster(state.players, state.currentPlayerIdx, removed);
  if (!drop || !drop.players.length) return null;
  if (!drop.activeRemoved) {
    return { players: drop.players, currentPlayerIdx: drop.activeIdx, currentRound: state.currentRound, restartTurn: false, finished: false };
  }
  // Rounds count up when the rotation wraps to seat 0 (nextEmojiTurn). The seat
  // that takes over wrapped when nobody after the removed player is left.
  const gone = new Set(removed);
  const wrapped = !state.players.slice(state.currentPlayerIdx + 1).some(p => !gone.has(p.id));
  const finished = wrapped && state.currentRound >= state.totalRounds;
  return {
    players: drop.players,
    currentPlayerIdx: wrapped ? 0 : drop.activeIdx,
    currentRound: wrapped && !finished ? state.currentRound + 1 : state.currentRound,
    restartTurn: !finished,
    finished,
  };
}
