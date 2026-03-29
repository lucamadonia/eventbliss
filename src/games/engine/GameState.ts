export type GamePhase = 'setup' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type AgeGroup = 'family' | 'party' | 'corporate';

export interface GameConfig {
  maxRounds: number;
  timerSeconds: number;
  difficulty: Difficulty;
  mode: string;
  ageGroup: AgeGroup;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isActive: boolean;
  isEliminated: boolean;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  players: Player[];
  currentPlayerIndex: number;
  config: GameConfig;
  startedAt: number;
}

export function createGameState(
  players: Player[],
  config: GameConfig
): GameState {
  return {
    phase: 'setup',
    currentRound: 1,
    maxRounds: config.maxRounds,
    players: players.map((p) => ({ ...p, score: 0, isActive: true, isEliminated: false })),
    currentPlayerIndex: 0,
    config,
    startedAt: Date.now(),
  };
}

export function nextPlayer(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => p.isActive && !p.isEliminated);
  if (activePlayers.length === 0) return { ...state, phase: 'gameOver' };

  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  while (state.players[nextIndex].isEliminated || !state.players[nextIndex].isActive) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }

  return { ...state, currentPlayerIndex: nextIndex };
}

export function nextRound(state: GameState): GameState {
  const newRound = state.currentRound + 1;
  if (newRound > state.maxRounds) {
    return { ...state, phase: 'gameOver' };
  }
  return {
    ...state,
    currentRound: newRound,
    currentPlayerIndex: 0,
    phase: 'playing',
  };
}

export function addScore(state: GameState, playerId: string, points: number): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, score: p.score + points } : p
    ),
  };
}

export function eliminatePlayer(state: GameState, playerId: string): GameState {
  const updated = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, isEliminated: true, isActive: false } : p
    ),
  };
  const remaining = updated.players.filter((p) => !p.isEliminated);
  if (remaining.length <= 1) {
    return { ...updated, phase: 'gameOver' };
  }
  return updated;
}

export function isGameOver(state: GameState): boolean {
  if (state.phase === 'gameOver') return true;
  if (state.currentRound > state.maxRounds) return true;
  const activePlayers = state.players.filter((p) => !p.isEliminated);
  return activePlayers.length <= 1;
}
