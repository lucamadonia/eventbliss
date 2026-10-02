export type Phase = 'handoff' | 'setup' | 'statement' | 'voted' | 'reveal' | 'gameOver';
export type Mode = 'classic' | 'three';

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
}

export const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
