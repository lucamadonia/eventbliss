export type Phase = 'setup' | 'spin' | 'choice' | 'reveal' | 'vote' | 'gameOver';

export interface Player {
  id: string; name: string; color: string; avatar: string;
  score: number; truthCount: number; dareCount: number;
}

export const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getIntensityForRound(mode: string, round: number, total: number): (1|2|3)[] {
  if (mode !== 'eskalation') return [1, 2, 3];
  const pct = round / total;
  if (pct < 0.33) return [1];
  if (pct < 0.66) return [1, 2];
  return [2, 3];
}
