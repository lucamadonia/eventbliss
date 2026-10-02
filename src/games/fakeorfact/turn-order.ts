/**
 * Fake or Fact with 🔁 guests (guestPolicy 'turns'): players judge the same
 * statement one after another in seat order — online every phone waits for its
 * turn, and a guest of the host phone gets the phone handed over for theirs.
 * Pure so the host flow, the phone UI and tests share one rule.
 */
export type TurnMark = 'done' | 'now' | 'open';

interface Seat { id: string }
interface Answer { playerId: string; correct?: boolean; answer?: boolean | number | null }

/** Seat that must judge right now — only while a statement is open. */
export function answeringSeat(phase: string, players: readonly Seat[], currentPlayerIdx: number): string | null {
  return phase === 'statement' ? players[currentPlayerIdx]?.id ?? null : null;
}

/**
 * May THIS device judge for `seat` now? Own seat directly; a 🔁 guest only
 * after they confirmed the handover (never during the pass, never before).
 */
export function deviceMayAnswer(seat: string | null, myPlayerId: string, activeGuest: string | null): boolean {
  return !!seat && (seat === myPlayerId || seat === activeGuest);
}

/** Progress row (✓ answered · now · still open) in seat order. Answers themselves stay hidden. */
export function turnMarks(players: readonly Seat[], answers: readonly Answer[], currentPlayerIdx: number, phase: string): { id: string; mark: TurnMark }[] {
  const answered = new Set(answers.map(a => a.playerId));
  return players.map((player, i) => ({
    id: player.id,
    mark: answered.has(player.id) ? 'done' : phase === 'statement' && i === currentPlayerIdx ? 'now' : 'open',
  }));
}

/** Add one answer for the seat whose turn it is — a second one for the same seat is ignored. */
export function recordAnswer<V extends Answer>(answers: readonly V[], vote: V): V[] {
  return answers.some(a => a.playerId === vote.playerId) ? [...answers] : [...answers, vote];
}

/**
 * Remote answers are checked against the deadline (late taps are dropped,
 * F12). Seats played on the host device itself are never "late": their clock
 * stands still while the phone is passed around.
 */
export function needsDeadlineCheck(sender: string, hostSeats: readonly string[], clocksRun: boolean): boolean {
  return clocksRun && !hostSeats.includes(sender);
}

/** Reveal on a shared phone: one line per seat this device played (own seat first). */
export function localSeatResults<P extends Seat>(seats: readonly string[], players: readonly P[], answers: readonly Answer[]):
  { player: P; answered: boolean; correct: boolean; answer: boolean | number | null }[] {
  return seats.flatMap(id => {
    const player = players.find(p => p.id === id);
    if (!player) return [];
    const vote = answers.find(a => a.playerId === id);
    return [{ player, answered: !!vote && vote.answer !== null && vote.answer !== undefined, correct: vote?.correct === true, answer: vote?.answer ?? null }];
  });
}

/** Public TV identity of everyone who already judged — never what they chose. */
export function tvAnswered<P extends Seat & { name: string; avatar?: string; color?: string }>(players: readonly P[], answers: readonly Answer[]) {
  const answered = new Set(answers.map(a => a.playerId));
  return players.filter(p => answered.has(p.id)).map(p => ({ id: p.id, name: p.name, avatar: p.avatar ?? '', color: p.color ?? '#78d9db' }));
}

/** Party colours stay the player's own light online; offline seats get the game palette. */
export function seatColor(own: string | undefined, index: number, palette: readonly string[], online: boolean): string {
  return online && own ? own : palette[index % palette.length];
}

/**
 * Pause the turn clock only while the host phone is on its way to (or back
 * from) the seat whose turn it is. A remote phone's turn keeps running even
 * if the host still has to confirm "back to Luca" from an earlier guest.
 */
export function clockHeldForTurn(handoverPaused: boolean, turnSeat: string | null, deviceSeats: readonly string[]): boolean {
  return handoverPaused && !!turnSeat && deviceSeats.includes(turnSeat);
}
