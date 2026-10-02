import { dropFromRoster } from '../multiplayer/roster-removal';
import { settleQuizRound } from './round-state';

type QuizPlayer = { id: string; score: number; streak: number };
type QuizVote = { playerId: string; correct: boolean };

export interface QuizRemoval<P, V> {
  players: P[];
  currentPlayerIdx: number;
  votes: V[];
  /** The removed player was answering and someone after them still has to: restart the clock for them. */
  restartTurn: boolean;
  /** Nobody left in this round's queue: the round is settled (scores applied) and goes to reveal. */
  reveal: boolean;
}

/**
 * Host-side kick/leave mid-match (G7, QA F13b/F14). Players answer one after
 * another (index order) in 'statement'; everyone before `currentPlayerIdx`
 * already answered. Removed players leave the roster and the round's votes;
 * the turn moves on as a timeout would, so nobody waits on a name that is gone.
 */
export function dropQuizPlayers<P extends QuizPlayer, V extends QuizVote>(
  state: { phase: string; players: P[]; currentPlayerIdx: number; votes: V[] },
  removed: readonly string[],
): QuizRemoval<P, V> | null {
  const drop = dropFromRoster(state.players, state.currentPlayerIdx, removed);
  if (!drop) return null;
  const gone = new Set(drop.removedIds);
  const votes = state.votes.filter(vote => !gone.has(vote.playerId));
  const base = { players: drop.players, currentPlayerIdx: Math.max(0, drop.activeIdx), votes, restartTurn: false, reveal: false };
  const answering = state.phase === 'statement' || state.phase === 'handoff';
  if (!answering || !drop.activeRemoved || !drop.players.length) return base;
  // Seat of the next one in line: everyone remaining who sat before the removed player already answered.
  const next = state.players.slice(0, state.currentPlayerIdx).filter(player => !gone.has(player.id)).length;
  if (next >= drop.players.length) {
    return { ...base, players: settleQuizRound(drop.players, votes), currentPlayerIdx: drop.players.length - 1, reveal: true };
  }
  return { ...base, currentPlayerIdx: next, restartTurn: true };
}
