// OHRWURM — Design-Tokens (Spec §6) und gemeinsame Konstanten fuer Spiel,
// Setup und Teilansichten — an einer Stelle gepflegt.
import type { PlaybackMode } from './playback';

export const ROUND_SECONDS = 60;      // Zeit zum Einordnen (Speed-Regel)
export const SPEED_BONUS_MS = 10_000; // innerhalb 10s → Speed-Bonus (+2 🎣)

export const OW = {
  primary: '#FF2E88',   // Aktion / Hervorhebung
  secondary: '#26E0C4', // Konter / Erfolg
  accent: '#FFD23F',    // Highlight / Slots
  bg: '#16101f',
  elevated: '#1e1530',
  surface: '#241a39',
  text: '#F7F2E9',
  dim: '#b3a8c9',
} as const;

export const PLAYER_COLORS = ['#FF2E88', '#26E0C4', '#FFD23F', '#8b5cf6'];
export const MAX_HOOKS = 5;        // Hausregel-Cap (Spec §2.4)

export const OW_STYLE = `
.ow-glow-pink { text-shadow: 0 0 18px rgba(255,46,136,.55), 0 0 40px rgba(255,46,136,.3); }
.ow-glow-teal { text-shadow: 0 0 18px rgba(38,224,196,.55), 0 0 40px rgba(38,224,196,.3); }
.ow-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
@keyframes ow-eq { 0%,100% { height: 20%; } 50% { height: 100%; } }
.ow-chip:focus-visible { outline: 2px solid #FF2E8899; outline-offset: 2px; }
`;

export interface OhrwurmConfig {
  mode: 'solo' | 'group';
  winTarget: number;
  genre: string | null;
  playback: PlaybackMode;
}

export interface SetupPlayer { id: string; name: string; color: string; avatar: string; }
