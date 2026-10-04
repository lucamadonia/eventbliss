/** PIXELJAGD — Farbwelt, Modi und gemeinsame Typen (Spiel, Setup, Panels). */
// Design-Tokens — eigene Farbwelt, gleiche Struktur wie OW in OhrwurmGame.
export const PJ = {
  primary: '#38BDF8',
  secondary: '#A78BFA',
  accent: '#FDE047',
  bg: '#0B1120',
  elevated: '#111C33',
  surface: '#16233F',
  text: '#F1F5F9',
  dim: '#94A3B8',
  bad: '#FB7185',
} as const;

export type Phase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
export type AnswerMode = 'buzzer' | 'text';
export type ModeId = 'klassisch' | 'blitz' | 'profi';

export interface ModeDef { id: ModeId; duration: number; startPx: number; penalty: number; }
export const MODES: ModeDef[] = [
  { id: 'klassisch', duration: 30, startPx: 8,  penalty: 25 },
  { id: 'blitz',     duration: 15, startPx: 10, penalty: 15 },
  { id: 'profi',     duration: 45, startPx: 6,  penalty: 40 },
];

/** A seat in the match. `avatar` comes from the party room (online). */
export interface Player { id: string; name: string; color: string; score: number; locked: boolean; avatar?: string; }
