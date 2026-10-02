/** DRÜCK DAS WORT — shared types and constants for the screens. */
export type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
export type GameMode = 'kategorie' | 'stroop' | 'verboten' | 'speed-rush';
export type Speed = 'slow' | 'medium' | 'fast';

export interface PlayerState {
  /** Room player id (online only) — roster indices shift when someone is removed. */
  id?: string;
  name: string;
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  wrong: number;
  missed: number;
}

export interface WordItem {
  text: string;
  isTarget: boolean;
  displayColor?: string; // for Stroop mode
}

export const SPEED_MS: Record<Speed, number> = { slow: 1500, medium: 1000, fast: 600 };
export const WORDS_PER_TURN = 12;

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
