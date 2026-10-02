/**
 * WO IST WAS mit 🔁-Gaesten am Host-Handy (guestPolicy 'sequential').
 *
 * - Karte / Street View: Alle mit eigenem Handy setzen ihren Pin gleichzeitig.
 *   Am Host-Handy setzt zuerst der Host, dann jeder Gast nach einer verdeckten
 *   Weitergabe — jeder mit voller eigener Zeit, die Uhr steht, solange das
 *   Handy wandert. Pins bleiben bis zur Aufloesung verborgen (Handy und TV),
 *   und die Frist des Hosts fuellt nie einen Gast auf, der noch dran kommt.
 * - Memory / Speed / Unterschiede sind ohnehin Zugspiele (einer nach dem
 *   anderen): Ist ein Gast dran, geht das Handy vor seinem Zug an ihn, die
 *   Uhr startet erst nach „Ich bin Max“.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */

export interface GuessLike { playerId: string }
export interface SeatLike { id: string; name: string; color: string; avatar?: string }
export interface RoomSeat { id: string; name?: string; avatar?: string; color?: string; controlledBy?: string }

/** Naechster Platz dieses Geraets, der noch keinen Pin gesetzt hat (eigener zuerst), sonst null. */
export function nextLocalGuesser(localSeats: readonly string[], players: readonly { id: string }[], guesses: readonly GuessLike[]): string | null {
  return localSeats.find(id => players.some(p => p.id === id) && !guesses.some(g => g.playerId === id)) ?? null;
}

/**
 * Frist abgelaufen: Wer noch keinen Pin hat, bekommt „kein Tipp“ (20000 km) —
 * ausser Plaetzen, die am Host-Handy noch dran kommen (`keepOpen`): Die haben
 * nach ihrer Weitergabe eine eigene volle Zeit.
 */
export function fillMissingGuesses<G extends GuessLike>(
  guesses: readonly G[], players: readonly SeatLike[], keepOpen: readonly string[],
  blank: (player: SeatLike) => G,
): { guesses: G[]; complete: boolean } {
  const missing = players.filter(p => !guesses.some(g => g.playerId === p.id) && !keepOpen.includes(p.id));
  const filled = [...guesses, ...missing.map(blank)];
  return { guesses: filled, complete: players.length > 0 && players.every(p => filled.some(g => g.playerId === p.id)) };
}

/** Zugspiele: wer ist gerade am Zug (nur waehrend Lernen/Frage/Aufloesung). */
export function findItActiveSeat(mode: string, phase: string, players: readonly { id: string }[], currentIdx: number): string | null {
  if (mode === 'karte' || mode === 'streetview') return null;
  if (phase !== 'study' && phase !== 'question' && phase !== 'answer') return null;
  return players[currentIdx]?.id ?? null;
}

/** Darf `sender` fuer den Platz am Zug handeln? Er selbst oder das Geraet, das seinen 🔁-Platz spielt. */
export function senderMayAct(seat: string | null | undefined, sender: unknown, room: readonly RoomSeat[]): boolean {
  if (!seat || typeof sender !== 'string') return false;
  return sender === seat || room.some(r => r.id === seat && r.controlledBy === sender);
}

/** Punkte einer Karten-/Street-View-Runde (gleiche Regel fuer beide). */
export function scoreGeoRound<P extends { id: string; score: number; correct: number }>(players: readonly P[], results: readonly { playerId: string; distanceKm: number }[]): P[] {
  const best = Math.min(...results.map(r => r.distanceKm));
  return players.map(p => {
    const res = results.find(r => r.playerId === p.id);
    if (!res) return p;
    const pts = Math.max(0, Math.round(1000 * Math.exp(-res.distanceKm / 2000)));
    const isWinner = res.distanceKm < 20000 && res.distanceKm === best;
    return { ...p, score: p.score + pts + (isWinner ? 100 : 0), correct: p.correct + (isWinner ? 1 : 0) };
  });
}

/** TV-Spielerliste: alle Spielwerte (Punkte, Serie) aus dem Spiel, Symbol/Farbe bevorzugt aus dem Raum (TVAvatar). */
export function findItTvPlayers<P extends SeatLike & { score: number }>(players: readonly P[], room: readonly RoomSeat[] = []) {
  return players.map(p => {
    const seat = room.find(r => r.id === p.id);
    return { ...p, avatar: seat?.avatar || p.avatar || p.name.slice(0, 1).toUpperCase(), color: seat?.color || p.color };
  });
}
