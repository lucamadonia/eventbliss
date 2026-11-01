/** Host-authoritative rules. The song and preview URL never enter this public state. */
export type HitPhase = 'loading' | 'listening' | 'paused' | 'answering' | 'reviewing' | 'result' | 'finished';

export interface HitPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  teamId: string;
  /** Display name of a formed team; absent in solo mode. */
  teamName?: string;
  score: number;
  locked: boolean;
}

export interface HitConfig {
  rounds: number;
  targetScore: number | null;
  answerSeconds: number;
  penalty: number;
  constantPoints: boolean;
  genre: string | null;
}

export interface HitState {
  matchId: string;
  roundId: string;
  revision: number;
  phase: HitPhase;
  round: number;
  config: HitConfig;
  players: HitPlayer[];
  elapsedMs: number;
  claim: { playerId: string; points: number; expiresAt: number } | null;
  reveal: { artist: string; title: string; winnerId: string | null; delta: number } | null;
}

export const DEFAULT_CONFIG: HitConfig = {
  rounds: 15, targetScore: null, answerSeconds: 8, penalty: 20,
  constantPoints: false, genre: null,
};

export function pointsAt(elapsedMs: number, constant = false): number {
  return constant ? 100 : Math.max(40, 100 - 2 * Math.floor(Math.max(0, elapsedMs) / 1000));
}

export function createMatch(players: Omit<HitPlayer, 'score' | 'locked'>[], config: HitConfig, matchId: string, roundId: string): HitState {
  if (players.length < 2 || new Set(players.map(p => p.id)).size !== players.length) throw new Error('At least two unique players are required');
  return {
    matchId, roundId, revision: 1, phase: 'loading', round: 1, config,
    players: players.map(p => ({ ...p, score: 0, locked: false })),
    elapsedMs: 0, claim: null, reveal: null,
  };
}

export function startListening(state: HitState): HitState {
  if (state.phase !== 'loading') return state;
  return { ...state, phase: 'listening', revision: state.revision + 1, elapsedMs: 0, claim: null, reveal: null,
    players: state.players.map(p => ({ ...p, locked: false })) };
}

export function updateElapsed(state: HitState, ms: number): HitState {
  if (state.phase !== 'listening' || !Number.isFinite(ms)) return state;
  const elapsedMs = Math.min(30_000, Math.max(state.elapsedMs, Math.floor(ms)));
  return elapsedMs === state.elapsedMs ? state : { ...state, elapsedMs };
}

export function pauseListening(state: HitState): HitState {
  return state.phase === 'listening' ? { ...state, phase: 'paused', revision: state.revision + 1 } : state;
}

export function resumeListening(state: HitState): HitState {
  return state.phase === 'paused' ? { ...state, phase: 'listening', revision: state.revision + 1 } : state;
}

export function acceptBuzz(state: HitState, playerId: string, roundId: string, now: number): HitState {
  if (state.phase !== 'listening' || state.roundId !== roundId || !Number.isFinite(now)) return state;
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.locked) return state;
  return { ...state, phase: 'answering', revision: state.revision + 1,
    claim: { playerId, points: pointsAt(state.elapsedMs, state.config.constantPoints), expiresAt: now + state.config.answerSeconds * 1000 } };
}

export function voidBuzz(state: HitState): HitState {
  if (state.phase !== 'answering' && state.phase !== 'reviewing') return state;
  return { ...state, phase: 'listening', claim: null, revision: state.revision + 1 };
}

/** The spoken answer has been given; stop the answer clock while the host checks the private song card. */
export function reviewBuzz(state: HitState): HitState {
  return state.phase === 'answering' && state.claim
    ? { ...state, phase: 'reviewing', revision: state.revision + 1 }
    : state;
}

/** Preserve the full answer window after a temporary room disconnection. */
export function extendAnswerDeadline(state: HitState, pausedMs: number): HitState {
  if (state.phase !== 'answering' || !state.claim || !Number.isFinite(pausedMs) || pausedMs <= 0) return state;
  return { ...state, revision: state.revision + 1,
    claim: { ...state.claim, expiresAt: state.claim.expiresAt + Math.floor(pausedMs) } };
}

export function revealRound(state: HitState, artist: string, title: string, winnerId: string | null = null, delta = 0): HitState {
  if (state.phase !== 'listening' && state.phase !== 'answering') return state;
  return { ...state, phase: 'result', claim: null, revision: state.revision + 1,
    reveal: { artist, title, winnerId, delta } };
}

export function judgeBuzz(state: HitState, correct: boolean, artist: string, title: string): HitState {
  if ((state.phase !== 'answering' && state.phase !== 'reviewing') || !state.claim) return state;
  const claim = state.claim;
  const teamId = state.players.find(p => p.id === claim.playerId)?.teamId;
  if (!teamId) return state;
  const delta = correct ? claim.points : -state.config.penalty;
  const players = state.players.map(p => p.teamId === teamId
    ? { ...p, score: p.score + delta, locked: p.locked || !correct }
    : p);
  if (correct || players.every(p => p.locked)) {
    return { ...state, players, phase: 'result', claim: null, revision: state.revision + 1,
      reveal: { artist, title, winnerId: correct ? claim.playerId : null, delta: correct ? delta : 0 } };
  }
  return { ...state, players, phase: 'listening', claim: null, revision: state.revision + 1 };
}

export function advanceRound(state: HitState, roundId: string): HitState {
  if (state.phase !== 'result') return state;
  const targetReached = state.config.targetScore !== null && state.players.some(p => p.score >= state.config.targetScore!);
  if (state.round >= state.config.rounds || targetReached) return { ...state, phase: 'finished', revision: state.revision + 1 };
  return { ...state, phase: 'loading', round: state.round + 1, roundId, revision: state.revision + 1,
    elapsedMs: 0, claim: null, reveal: null, players: state.players.map(p => ({ ...p, locked: false })) };
}

/** Reopen the last judged claim with a fresh answer window. */
export function undoJudgement(current: HitState, before: HitState, now: number): HitState {
  if (current.matchId !== before.matchId || current.roundId !== before.roundId || (before.phase !== 'answering' && before.phase !== 'reviewing')
    || !before.claim || !Number.isFinite(now) || (current.phase !== 'result' && current.phase !== 'listening')) return current;
  return { ...before, revision: current.revision + 1,
    claim: { ...before.claim, expiresAt: now + before.config.answerSeconds * 1000 } };
}

/** Discard a broken clip without consuming its round or retaining wrong-answer penalties. */
export function replaceBrokenClip(current: HitState, roundStart: HitState, roundId: string): HitState {
  if (current.matchId !== roundStart.matchId || current.roundId !== roundStart.roundId
    || roundStart.phase !== 'listening' || !['listening', 'answering', 'reviewing', 'paused'].includes(current.phase)) return current;
  return { ...current, phase: 'loading', roundId, revision: current.revision + 1,
    elapsedMs: 0, claim: null, reveal: null,
    players: current.players.map(p => ({ ...p,
      score: roundStart.players.find(startPlayer => startPlayer.id === p.id)?.score ?? p.score,
      locked: false,
    })) };
}

export function removePlayer(state: HitState, id: string): HitState {
  if (!state.players.some(p => p.id === id)) return state;
  const players = state.players.filter(p => p.id !== id);
  if (players.length < 2) return { ...state, players, phase: 'finished', claim: null, revision: state.revision + 1 };
  if (state.claim?.playerId === id) return { ...state, players, phase: 'listening', claim: null, revision: state.revision + 1 };
  return { ...state, players, revision: state.revision + 1 };
}
