/**
 * Wahrheit oder Pflicht with 🔁 guests (sharedDevice 'turns') — pure rules so the
 * host flow, the phone UI and the tests share one definition.
 *
 *   spin    → host device spins (nobody else acts)
 *   choice  → the chosen player picks truth or dare
 *   reveal  → the same player answers / performs, then taps done
 *   vote    → every other player judges, one after another
 */
import type { Phase } from './game-model';

type Seat = { id: string };

/** Everyone except the active player, in roster order — the vote order. */
export function voterOrder<P extends Seat>(players: readonly P[], activeIdx: number): P[] {
  return players.filter((_, i) => i !== activeIdx);
}

/** Seat that must act now (null = only the host device, or nobody). */
export function truthDareActiveSeat(phase: Phase, players: readonly Seat[], activeIdx: number, voterIdx: number): string | null {
  if (activeIdx < 0 || !players[activeIdx]) return null;
  if (phase === 'choice' || phase === 'reveal') return players[activeIdx].id;
  if (phase === 'vote') return voterOrder(players, activeIdx)[voterIdx]?.id ?? null;
  return null;
}

/** What the acting seat is doing right now — drives the "who is acting" header. */
export type TurnRole = 'choose' | 'answer' | 'dare' | 'vote';
export function turnRole(phase: Phase, choiceType: 'truth' | 'dare' | null): TurnRole | null {
  if (phase === 'choice') return 'choose';
  if (phase === 'reveal') return choiceType === 'dare' ? 'dare' : 'answer';
  if (phase === 'vote') return 'vote';
  return null;
}

/** Can this device act for `seatId`? Local play: always. Online: own seat or one of its 🔁 guests. */
export function canActFor(seatId: string | null | undefined, seats: readonly string[] | null): boolean {
  if (!seats) return true;
  return !!seatId && seats.includes(seatId);
}

/**
 * Roster at match start. Online/party players keep their own colour (same glow as on
 * the TV and in the lobby); local pass-and-play keeps the game's palette.
 */
export function seatRoster<S extends { id: string; name: string; color: string; avatar: string }>(
  mapped: readonly S[], palette: readonly string[], keepOwnColour: boolean,
) {
  return mapped.map((p, i) => ({
    id: p.id, name: p.name, avatar: p.avatar,
    color: keepOwnColour && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : palette[i % palette.length],
    score: 0, truthCount: 0, dareCount: 0,
  }));
}

/** m:ss for the dare clock. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Vote progress dots: done before the current voter, current, open after. */
export function voteProgress(total: number, voterIdx: number): ('done' | 'now' | 'open')[] {
  return Array.from({ length: total }, (_, i) => (i < voterIdx ? 'done' : i === voterIdx ? 'now' : 'open'));
}
