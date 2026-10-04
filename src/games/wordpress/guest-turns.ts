/**
 * DRÜCK DAS WORT mit 🔁-Gaesten am Host-Handy (guestPolicy 'turns').
 *
 * Immer genau EIN Spieler reagiert auf seine 12 Woerter; die Wortuhr laeuft
 * erst, wenn er „Bereit“ tippt. Ist ein Gast dran, geht das Host-Handy per
 * HandoverScreen an ihn — bis „Ich bin Max“ laeuft also keine Uhr, und es gibt
 * keinen Reaktionswettlauf, der Gaeste benachteiligen koennte. Der Gast tippt
 * direkt am Host-Handy: keine Funkstrecke, also auch keine Uebertragungs-
 * Toleranz (die gilt nur fuer Spieler mit eigenem Handy).
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */
export interface WordPressSeat { id: string; name: string; avatar?: string; color?: string; controlledBy?: string; isHost?: boolean }

/** Platz, der gerade spielt (Kennung aus dem Spiel, sonst aus dem Raum an derselben Stelle). */
export function wordPressActiveId(players: readonly { id?: string }[], index: number, room: readonly { id: string }[] = []): string | null {
  return players[index]?.id ?? room[index]?.id ?? null;
}

/** Wer wartet aufs Handy: nur in einem laufenden Zug. */
export function wordPressActiveSeat(phase: string, activeId: string | null): string | null {
  return phase === 'playing' ? activeId : null;
}

/** Geraet, auf dem dieser Platz gespielt wird (der eigene, oder das Host-Handy fuer einen 🔁-Gast). */
export function deviceOf(seatId: string | null, room: readonly WordPressSeat[]): string | null {
  if (!seatId) return null;
  return room.find(seat => seat.id === seatId)?.controlledBy ?? seatId;
}

/** Spielt dieses Handy den aktiven Platz (selbst oder als Gast-Platz)? */
export function playsOnThisDevice(seatId: string | null, localSeats: readonly string[]): boolean {
  return !!seatId && localSeats.includes(seatId);
}

/** Reagiert der aktive Platz ueber das Netz? Dann braucht der Host die Uebertragungs-Toleranz. */
export function actorIsRemote(seatId: string | null, room: readonly WordPressSeat[], hostId: string | null | undefined): boolean {
  const device = deviceOf(seatId, room);
  return !!device && device !== hostId;
}

/** TV-Spielerliste: Punkte aus dem Spiel, Symbol/Farbe aus dem Raum (TVAvatar, Kino). */
export function wordPressTvPlayers<P extends { id?: string; name: string; score: number }>(players: readonly P[], room: readonly WordPressSeat[]) {
  return players.map((player, index) => {
    const seat = (player.id ? room.find(r => r.id === player.id) : undefined) ?? room.find(r => r.name === player.name);
    return { ...player, id: player.id ?? seat?.id ?? `seat-${index}`,
      ...(seat?.avatar ? { avatar: seat.avatar } : {}), ...(seat?.color ? { color: seat.color } : {}) };
  });
}
