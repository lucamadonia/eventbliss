/** Gemeinsame Typen/Helfer der Tabu-TV-Ansicht. Nie die Karte — nur Teams, Namen, Zaehler. */
import { emojiOnly } from '../tv-emoji-only';

export const TB = {
  purple: '#df8eff', cyan: '#8ff5ff', gold: '#FFD23F', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810',
  correct: '#10b981', taboo: '#ff6e84', skip: '#a8abb3',
} as const;

export interface TabooTeam { name?: string; color?: string; score?: number; players?: (string | { name: string })[]; ids?: string[] }
export interface TabooSeatLike { id?: string; name?: string; avatar?: string; color?: string; team?: number }
export interface TabooMember { id?: string; name: string; avatar?: string; color: string }

const FALLBACK = ['#ff8572', '#e6ce81'];

/** Teamfarben kommen als Tailwind-Klasse („bg-[#ff8572]“) — Hex herausziehen. */
export function teamHex(team: TabooTeam | undefined, idx: number): string {
  const raw = team?.color || '';
  const m = raw.match(/#([0-9a-fA-F]{6})/);
  return m ? `#${m[1]}` : FALLBACK[idx % 2];
}

/** Mitglieder eines Teams mit Symbol/Farbe aus dem Roster (online) bzw. nur Namen (lokal). */
export function teamMembers(team: TabooTeam | undefined, idx: number, roster: TabooSeatLike[]): TabooMember[] {
  const names = (team?.players ?? []).map((p) => (typeof p === 'string' ? p : p?.name || '')).filter((n) => n.trim() !== '');
  const tint = teamHex(team, idx);
  return names.map((name, i) => {
    const id = team?.ids?.[i];
    const seat = roster.find((r) => (id && r.id === id) || (r.name === name && (r.team === undefined || r.team === idx)));
    return { id: id ?? seat?.id, name, avatar: emojiOnly(seat?.avatar), color: seat?.color || tint };
  });
}

/** Erklaerer: online ein Sitz-Objekt, lokal nur der Name. */
export function explainerOf(explainer: unknown): TabooSeatLike {
  if (typeof explainer === 'string') return { name: explainer };
  if (explainer && typeof explainer === 'object') {
    const e = explainer as TabooSeatLike;
    return { id: e.id, name: e.name || '', avatar: emojiOnly(e.avatar), color: e.color };
  }
  return { name: '' };
}

export const memberKey = (m: TabooMember, i: number) => m.id || `${i}:${m.name}`;
