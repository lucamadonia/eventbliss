/** Gemeinsame Typen/Farben der Bomben-TV-Ansicht (TVBombView + Szenen). */
export const BB = {
  primary: '#ff7350', danger: '#ef4444', warn: '#f59e0b', spark: '#fbbf24', gold: '#FFD23F',
  cyan: '#8ff5ff', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810',
} as const;

export const BOMB_PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

export interface BombPlayer { id?: string; name: string; color?: string; avatar?: string; penalties?: number }

export const bombPid = (p: BombPlayer, i: number) => p.id || `seat-${i}`;
export const bombColor = (p: BombPlayer | undefined, i: number) => p?.color || BOMB_PALETTE[i % BOMB_PALETTE.length];


export { emojiOnly } from '../tv-emoji-only';
