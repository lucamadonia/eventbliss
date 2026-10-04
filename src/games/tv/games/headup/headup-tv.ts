/** Gemeinsame Typen/Helfer der HeadUp-TV-Ansicht. */
import { emojiOnly } from '../tv-emoji-only';

export const HU = {
  purple: '#df8eff', cyan: '#8ff5ff', pink: '#ff6b98', green: '#10b981', skip: '#ff6e84', gold: '#FFD23F',
  text: '#f1f3fc', dim: '#a8abb3', bg: '#060810',
} as const;

export const HU_PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

export interface HeadUpSeat { id?: string; name: string; avatar?: string; color?: string }
/** Optionaler Endstand je Spieler (noch nicht von der Bruecke gesendet). */
export interface HeadUpRoundScore { playerName: string; correct: number; skipped?: number }

/**
 * Spieler in Rundenfolge: `playerSeats` (online, mit Symbol/Farbe) oder die
 * Namensliste (lokal). Initial-Rueckfaelle der Bruecke werden verworfen.
 */
export function headUpSeats(players: unknown, seats: unknown): HeadUpSeat[] {
  const list = Array.isArray(players) ? players : [];
  const seatList = (Array.isArray(seats) ? seats : []) as HeadUpSeat[];
  const names: HeadUpSeat[] = list
    .map((p) => (typeof p === 'string' ? { name: p } : (p && typeof p === 'object' ? (p as HeadUpSeat) : { name: '' })))
    .filter((p) => (p.name || '').trim() !== '');
  const base = seatList.length > 0 ? seatList : names;
  return base.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: emojiOnly(p.avatar),
    color: p.color || names.find((n) => n.name === p.name)?.color || HU_PALETTE[i % HU_PALETTE.length],
  }));
}

export const seatKey = (p: HeadUpSeat, i: number) => p.id || `${i}:${p.name}`;
