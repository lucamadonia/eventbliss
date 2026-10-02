/** Gemeinsame Typen/Helfer der „Drück das Wort“-TV-Ansicht. */
export { emojiOnly } from '../tv-emoji-only';

export const WP = {
  primary: '#df8eff', secondary: '#8ff5ff', accent: '#ffb84d', gold: '#FFD23F',
  text: '#f4eefb', dim: '#a99cc4', bg: '#0a0e14',
} as const;

export const WP_PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

export interface WPPlayer {
  id?: string; name: string; avatar?: string; color?: string;
  score: number; combo: number; maxCombo: number; correct: number; wrong: number; missed: number;
}

export const wpPid = (p: WPPlayer | undefined, i: number) => p?.id || `seat-${i}`;
export const wpColor = (p: WPPlayer | undefined, i: number) => p?.color || WP_PALETTE[i % WP_PALETTE.length];

export function accuracyOf(p: WPPlayer | undefined): number | null {
  if (!p) return null;
  const total = (p.correct ?? 0) + (p.wrong ?? 0) + (p.missed ?? 0);
  return total > 0 ? Math.round(((p.correct ?? 0) / total) * 100) : null;
}
