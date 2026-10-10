/** NAH DRAN — Farbwelt, Modi und Grundtypen (gemeinsam fuer Spiel, Einrichtung und Panels). */
/**
 * Farbwelt warm/kalt: Amber ist der Spieler, Mint die Wahrheit, Gold der
 * Volltreffer. Die Trennung ist der Grund, warum man in der Auflösung ohne
 * Legende versteht, welcher Strich was bedeutet.
 */
export const CE = {
  bg: '#0B1120',
  elevated: '#111C33',
  surface: '#16233F',
  text: '#F1F5F9',
  dim: '#94A3B8',
  accent: '#FBBF24',
  truth: '#34D399',
  gold: '#FDE047',
  bad: '#FB7185',
} as const;

export const CHART_THEME = {
  surface: CE.surface,
  elevated: CE.elevated,
  text: CE.text,
  dim: CE.dim,
  accent: CE.accent,
  truth: CE.truth,
  gold: CE.gold,
};

export const ENTRY_THEME = {
  bg: CE.bg,
  surface: CE.surface,
  elevated: CE.elevated,
  text: CE.text,
  dim: CE.dim,
  accent: CE.accent,
};

export type Phase = 'setup' | 'guessing' | 'reveal' | 'gameOver';
export type ModeId = 'entspannt' | 'klassisch' | 'blitz';

export interface ModeDef {
  id: ModeId;
  duration: number;
}
export const MODES: ModeDef[] = [
  { id: 'entspannt', duration: 60 },
  { id: 'klassisch', duration: 40 },
  { id: 'blitz', duration: 20 },
];

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  /** In group mode one estimate and one score belong to all these room seats. */
  memberIds?: string[];
  memberNames?: string[];
}

export function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
