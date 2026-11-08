/**
 * NAH DRAN mit 🔁-Gaesten am Host-Handy (guestPolicy 'sequential').
 *
 * Wer ein eigenes Handy hat, schaetzt gleichzeitig mit allen anderen. Die
 * Plaetze am Host-Handy schaetzen nacheinander: erst der Host selbst, dann
 * jeder Gast nach einer verdeckten Weitergabe — mit einer vollen eigenen Uhr,
 * die steht, solange das Handy unterwegs ist. Weil die Wertung nur die
 * Abweichung zaehlt (keine Zeitpunkte), kostet die Wartezeit niemanden Punkte.
 * Keine Zahl ist vor der Aufloesung sichtbar — weder auf dem Host-Handy noch
 * auf dem TV —, sonst wuerde der naechste Gast am Vorgaenger ankern.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */
export type CeGuessBook = Readonly<Record<string, number | null>>;

interface Seat { id: string; memberIds?: readonly string[]; memberNames?: readonly string[] }
interface RoomSeat { id: string; name: string; avatar?: string; color?: string; controlledBy?: string }

const has = (done: CeGuessBook | ReadonlySet<string>, id: string) =>
  done instanceof Set ? done.has(id) : id in (done as CeGuessBook);

/** Naechster Platz dieses Geraets, der noch schaetzen muss (eigener zuerst) — null, wenn alle durch sind. */
export function nextLocalGuesser(localSeats: readonly string[], players: readonly Seat[], done: CeGuessBook | ReadonlySet<string>): string | null {
  return localSeats.find((id) => players.some((p) => (p.id === id || p.memberIds?.includes(id)) && !has(done, p.id))) ?? null;
}

/** Gaeste dieses Geraets, die noch gar nicht dran waren (alle offenen ausser dem aktuellen). */
export function queuedLocalGuessers(localSeats: readonly string[], players: readonly Seat[], done: CeGuessBook): string[] {
  const outstanding = localSeats.map((id) => players.find((p) => p.id === id || p.memberIds?.includes(id))?.id)
    .filter((id): id is string => !!id && !(id in done));
  return [...new Set(outstanding)].slice(1);
}

/**
 * Die Uhr ist abgelaufen: Wer gerade dran war oder ein eigenes Handy hat und
 * nichts abgegeben hat, bekommt „kein Tipp“. Wartende Gaeste behalten ihren
 * Zug — jeder bekommt nach der Weitergabe eine volle Uhr.
 */
export function ceExpiry(players: readonly Seat[], guesses: CeGuessBook, queued: readonly string[]): Record<string, number | null> {
  const next: Record<string, number | null> = { ...guesses };
  for (const p of players) if (!(p.id in next) && !queued.includes(p.id)) next[p.id] = null;
  return next;
}

/** Darf `sender` fuer Platz `pid` tippen? Er selbst, oder das Geraet, das diesen 🔁-Platz spielt. */
export function ceSenderMayGuess(pid: unknown, sender: unknown, room: readonly RoomSeat[], players: readonly Seat[] = []): boolean {
  if (typeof pid !== 'string' || typeof sender !== 'string') return false;
  const player = players.find((entry) => entry.id === pid);
  const members = player?.memberIds?.length ? player.memberIds : [pid];
  if (members.includes(sender)) return true;
  return room.some((seat) => members.includes(seat.id) && seat.controlledBy === sender);
}

/** Oeffentliche Spielerliste fuer TV und Kino: Symbol/Farbe aus dem Raum, Status ohne Zahl. */
export function ceTvPlayers<P extends { id: string; name: string; color: string; score: number; memberNames?: readonly string[] }>(
  players: readonly P[], room: readonly RoomSeat[], submitted: ReadonlySet<string>,
) {
  return players.map((p) => {
    const seat = room.find((r) => r.id === p.id);
    return {
      id: p.id,
      name: p.name,
      ...(p.memberNames?.length ? { members: p.memberNames } : {}),
      color: seat?.color || p.color,
      ...(seat?.avatar ? { avatar: seat.avatar } : {}),
      score: p.score,
      // Der Fernseher zeigt nur den Haken, nie die Zahl.
      status: submitted.has(p.id) ? ('done' as const) : ('thinking' as const),
    };
  });
}
