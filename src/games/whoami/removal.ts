import { dropFromRoster, withoutIds } from '../multiplayer/roster-removal';
import { phaseAfterQuestion } from './question-rules';

/**
 * Host-side: a player was removed mid-match (kick/leave, G7). Keeps every
 * remaining player's score and character; nobody waits for the removed player.
 */
export interface WhoAmIRemovalPlayer { id: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean }
export interface WhoAmIRemovalState<P extends WhoAmIRemovalPlayer> {
  phase: string;
  players: P[];
  activeIdx: number;
  voterIdx: number;
  voteResults: Record<string, 'yes' | 'no' | 'maybe'>;
  currentQuestion: string;
  guessCorrect: boolean | null;
}
export interface WhoAmIRemovalResult<P extends WhoAmIRemovalPlayer> extends WhoAmIRemovalState<P> {
  /** Nobody unsolved is left in this round: end it like advancePlayer does (next round or game over). */
  roundOver: boolean;
}

const LIVE_PHASES = ['assign', 'asking', 'answerVote', 'guessing', 'guessResult'];

/** First player from `start` (inclusive, wrapping) who still has to guess; -1 when none. */
export function firstOpenSeat(players: readonly WhoAmIRemovalPlayer[], start: number): number {
  for (let k = 0; k < players.length; k++) {
    const i = (start + k) % players.length;
    if (!players[i].guessedCorrectly && !players[i].eliminated) return i;
  }
  return -1;
}

export function applyWhoAmIRemoval<P extends WhoAmIRemovalPlayer>(state: WhoAmIRemovalState<P>, removed: readonly string[], maxQ: number): WhoAmIRemovalResult<P> | null {
  if (!LIVE_PHASES.includes(state.phase)) return null;
  const drop = dropFromRoster(state.players, state.activeIdx, removed);
  if (!drop || !drop.players.length) return null;
  const base: WhoAmIRemovalResult<P> = { ...state, players: drop.players, activeIdx: drop.activeIdx, voteResults: withoutIds(state.voteResults, removed), roundOver: false };

  if (drop.activeRemoved && state.phase !== 'assign') {
    // The guesser left: their turn ends, the next player still guessing takes over.
    const next = firstOpenSeat(drop.players, drop.activeIdx);
    const cleared = { ...base, voterIdx: 0, voteResults: {}, currentQuestion: '', guessCorrect: null };
    return next < 0 ? { ...cleared, activeIdx: 0, roundOver: true } : { ...cleared, activeIdx: next, phase: 'asking' };
  }

  if (state.phase === 'answerVote') {
    // Answers come in seat order, so the ones already given are a prefix of the remaining voters.
    const voters = drop.players.filter((_, i) => i !== drop.activeIdx);
    const voterIdx = voters.filter(p => p.id in base.voteResults).length;
    if (voterIdx >= voters.length) {
      // Everyone still here has answered: close the question exactly like the last castAnswer.
      const active = drop.players[drop.activeIdx];
      return {
        ...base, voterIdx,
        players: drop.players.map((p, i) => i === drop.activeIdx ? { ...p, questionsAsked: p.questionsAsked + 1 } : p),
        currentQuestion: '',
        phase: phaseAfterQuestion(active.questionsAsked, maxQ),
      };
    }
    return { ...base, voterIdx };
  }
  return base;
}
