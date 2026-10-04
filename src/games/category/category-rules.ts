/**
 * Kategorie (Stadt-Land-Fluss-Kette) — pure rules shared by the host flow,
 * the phone screens and the tests. Party-Play mode: `turns` (one answerer at a
 * time under a clock), so a 🔁 guest gets the host phone before their turn.
 */
export type GameMode = 'classic' | 'rapid' | 'letter';
export type Phase = 'setup' | 'categoryReveal' | 'playing' | 'roundEnd' | 'gameOver';
export type WordVerdict = 'ok' | 'duplicate' | 'wrong_letter';

export interface CategoryPlayer {
  id: string;
  name: string;
  score: number;
  losses: number;
  /** Profile symbol (party) or initial (local). Same identity the TV shows. */
  avatar?: string;
  color?: string;
}

export interface SaidWord { word: string; playerId: string }

export interface RoundResult {
  category: string;
  letter?: string;
  words: SaidWord[];
  loserId: string | null;
}

/** Spoken aloud instead of typed — counts, but never blocks a typed word. */
export const VERBAL = '__verbal__';
export const MODE_TIMERS: Record<GameMode, number> = { classic: 30, rapid: 10, letter: 20 };
export const CATEGORY_ACCENT = '#f2bc66';
export const LOCAL_COLORS = ['#f2bc66', '#4ECDC4', '#df8eff', '#FF6B6B', '#45B7D1', '#00B894', '#FD79A8', '#6C5CE7', '#E17055', '#0984E3'] as const;

export const normalizeWord = (word: string) => word.trim().toLowerCase();

/** Typed words must be new this round and (letter mode) start with the letter. */
export function judgeWord(word: string, said: readonly SaidWord[], mode: GameMode, letter?: string): WordVerdict {
  if (word === VERBAL) return 'ok';
  const normalized = normalizeWord(word);
  if (said.some(entry => entry.word !== VERBAL && normalizeWord(entry.word) === normalized)) return 'duplicate';
  if (mode === 'letter' && letter && !normalized.startsWith(letter.toLowerCase())) return 'wrong_letter';
  return 'ok';
}

/** Host-side payload check for the `word` action (untrusted input from phones). */
export const isValidWordPayload = (word: unknown): word is string =>
  typeof word === 'string' && word.trim().length > 0 && word.length <= 200;

/** Seat that must answer now — the only seat that can need a handover. */
export function categoryActiveSeat(phase: Phase, players: readonly { id: string }[], currentPlayerIndex: number): string | null {
  return phase === 'playing' ? players[currentPlayerIndex]?.id ?? null : null;
}

export const nextAnswerer = (index: number, count: number) => (count > 0 ? (index + 1) % count : 0);
/** Every round starts one seat later, so nobody always opens. */
export const roundStarter = (round: number, count: number) => (count > 0 ? (round - 1) % count : 0);

/** A stopped clock (handover, lost connection) shifts the deadline by the stopped time. */
export function resumeDeadline(deadline: number, stoppedAt: number | null, now: number): number {
  if (stoppedAt === null || deadline <= 0) return deadline;
  return deadline + Math.max(0, now - stoppedAt);
}

/**
 * Host guard against stale timer expiries (e.g. a screen that remounts with
 * the old deadline right before it is extended): only a really passed
 * deadline ends the round. `graceMs` absorbs the whole-second display clock.
 */
export function turnExpired(deadline: number, now: number, graceMs = 1000): boolean {
  return deadline <= 0 || now >= deadline - graceMs;
}

export function secondsLeft(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

interface SeatLike { id: string; name: string; avatar?: string; color?: string }

/**
 * Match roster. Party/online: every seat (incl. 🔁 guests) with its own
 * identity, so answers are credited to the guest id. Local: typed names.
 */
export function seatPlayers(local: readonly { name: string }[], seats?: readonly SeatLike[]): CategoryPlayer[] {
  const source: SeatLike[] = seats?.length ? [...seats] : local.map((player, index) => ({ id: `p${index}`, name: player.name }));
  return source.map((seat, index) => ({
    id: seat.id,
    name: seat.name,
    score: 0,
    losses: 0,
    avatar: seat.avatar || seat.name.trim().charAt(0).toUpperCase() || '?',
    color: seat.color || LOCAL_COLORS[index % LOCAL_COLORS.length],
  }));
}

/** Credit an accepted answer to the seat that gave it (a guest keeps their own points). */
export function creditAnswer(players: readonly CategoryPlayer[], playerId: string): CategoryPlayer[] {
  return players.map(player => (player.id === playerId ? { ...player, score: player.score + 1 } : player));
}

export function chargeLoss(players: readonly CategoryPlayer[], loserId: string | null): CategoryPlayer[] {
  return players.map(player => (player.id === loserId ? { ...player, losses: player.losses + 1 } : player));
}

/** Validation feedback belongs to the device that typed (own seat or a guest it plays). */
export function showsValidationFor(playerId: string, myPlayerId: string, localSeatIds: readonly string[], activeGuest: string | null): boolean {
  return playerId === myPlayerId || playerId === activeGuest || localSeatIds.includes(playerId);
}

/** Pick an unused category (falls back to the full pool once all were played). */
export function pickFrom(pool: readonly string[], used: ReadonlySet<string>, random = Math.random): string {
  const available = pool.filter(category => !used.has(category));
  const from = available.length ? available : pool;
  return from[Math.floor(random() * from.length)] ?? '';
}
