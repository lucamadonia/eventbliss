/**
 * PIXELJAGD mit 🔁-Gaesten am Host-Handy (guestPolicy 'team').
 *
 * Warum 'team' und nicht 'sequential': Das Bild wird jede Sekunde schaerfer.
 * Nacheinander raten hiesse, dass jeder spaetere Gast ein klareres Bild sieht —
 * unfair. Aussetzen waere fair, aber langweilig fuer genau die Leute, die kein
 * eigenes Handy haben. Also ist das Host-Handy EIN Buzzer fuer seine Runde:
 * Wer davor sitzt, ruft rein, einer drueckt bzw. tippt.
 *
 * Fair gegenueber Spielern mit eigenem Handy, weil:
 * - Punkte gehen an GENAU einen Platz — wer gebuzzert hat bzw. wer als
 *   „Wer tippt?“ gewaehlt ist (vor dem Raten, damit die Aufloesung ohne
 *   Zusatzschritt fuer alle Geraete gleichzeitig kommt).
 * - Eine falsche Antwort sperrt das ganze Handy fuer die Runde: ein Handy,
 *   ein Versuch — wie bei allen anderen. Den Punktabzug traegt nur, wer geraten hat.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen. Ohne Raum (ein
 * Handy lokal) ist jeder Platz sein eigenes Team — nichts aendert sich.
 */
export interface RoomSeat { id: string; controlledBy?: string }

/** Geraet, das diesen Platz spielt: der Platz selbst, bei 🔁-Gaesten das Host-Handy. */
export function deviceOf(seatId: string, room: readonly RoomSeat[]): string {
  return room.find(seat => seat.id === seatId)?.controlledBy ?? seatId;
}

/** Alle Plaetze am selben Handy wie `seatId` (inkl. ihm selbst). */
export function teamOf(seatId: string, room: readonly RoomSeat[]): string[] {
  const device = deviceOf(seatId, room);
  const team = room.filter(seat => seat.id === device || seat.controlledBy === device).map(seat => seat.id);
  return team.includes(seatId) ? team : [...team, seatId];
}

/** Darf `sender` fuer `seatId` buzzern/raten? Er selbst, oder das Geraet, das den 🔁-Platz spielt. */
export function mayActFor(seatId: unknown, sender: unknown, room: readonly RoomSeat[]): boolean {
  if (typeof seatId !== 'string' || typeof sender !== 'string') return false;
  return seatId === sender || room.some(seat => seat.id === seatId && seat.controlledBy === sender);
}

/**
 * Falsche Antwort: das ganze Handy-Team ist fuer die Runde raus, Abzug nur fuer
 * `seatId`. `othersLeft` = es kann noch jemand anderes raten.
 */
export function penalizeTeam<P extends { id: string; score: number; locked: boolean }>(
  players: readonly P[], seatId: string, penalty: number, room: readonly RoomSeat[],
): { players: P[]; othersLeft: boolean } {
  const team = new Set(teamOf(seatId, room));
  const next = players.map(p => ({ ...p, score: p.id === seatId ? p.score - penalty : p.score, locked: p.locked || team.has(p.id) }));
  return { players: next, othersLeft: next.some(p => !p.locked) };
}

/** Wer an diesem Handy tippt: die Wahl, falls noch im Spiel und frei, sonst der erste freie lokale Platz. */
export function typistFor(choice: string | null, localSeats: readonly string[], players: readonly { id: string; locked: boolean }[]): string | null {
  const free = localSeats.filter(id => players.some(p => p.id === id && !p.locked));
  return choice && free.includes(choice) ? choice : free[0] ?? null;
}

/** Oeffentlicher TV-Hinweis: wer sich ein Handy teilt (nur Kennungen, nie Antworten). Leer ohne Gaeste. */
export function sharedPhoneTeams(room: readonly RoomSeat[]): string[][] {
  const byDevice = new Map<string, string[]>();
  for (const seat of room) if (seat.controlledBy) byDevice.set(seat.controlledBy, [...(byDevice.get(seat.controlledBy) ?? []), seat.id]);
  return [...byDevice.entries()].map(([device, guests]) => [device, ...guests]);
}
