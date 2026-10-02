/**
 * GEBRÄU mit 🔁-Gaesten am Host-Handy (guestPolicy 'turns').
 *
 * Es ist immer genau EINE Person dran (`activeIdx`); ziehen, Theke und
 * Eingiessen sind Entscheidungen ohne Zeitdruck — es gibt keine Zuguhr und
 * kein Geschicklichkeitsfenster. Der Guss ist reine Choreografie NACH der
 * Entscheidung und darf nie angehalten werden; die Weitergabe beginnt erst,
 * wenn der Zug wirklich gewechselt hat (nach dem Guss bzw. nach der Strafe).
 * Darum: Weitergabe VOR dem Zug, ohne „Uhr angehalten“. Geheim ist nur der
 * Ziehstapel, und der verlaesst den Gastgeber nie — der Abdeck-Schritt
 * (`secret`) waere also nur Reibung.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */
export interface BrewRoomSeat { id: string; name: string; avatar?: string; color?: string; controlledBy?: string }

/**
 * Platz, der jetzt am Zug ist — waehrend der ganzen Partie, auch im Schlussbild
 * des Siegers (der Gast sieht seinen letzten Guss noch selbst). Danach keiner.
 */
export function brewActiveSeat(phase: string, players: readonly { id: string }[], activeIdx: number): string | null {
  if (phase !== 'playing') return null;
  return players[activeIdx]?.id ?? null;
}

/** Darf `sender` fuer den aktiven Platz handeln? Er selbst, oder das Geraet, das seinen 🔁-Platz spielt. */
export function brewSenderOwnsTurn(activeId: string | null | undefined, sender: unknown, room: readonly BrewRoomSeat[]): boolean {
  if (!activeId || typeof sender !== 'string') return false;
  if (sender === activeId) return true;
  return room.some((seat) => seat.id === activeId && seat.controlledBy === sender);
}

/**
 * Wessen Sicht dieses Handy zeigt („Dein Rezept“, „Du bist dran“): der Gast,
 * der das Host-Handy gerade bestaetigt in der Hand haelt, sonst der eigene Platz.
 */
export function brewViewerId(myId: string | null, activeGuest: string | null): string | null {
  return activeGuest ?? myId;
}

/** Ist dieses Handy jetzt am Zug? Offline immer; online fuer den eigenen Platz oder den bestaetigten Gast. */
export function brewIsMyTurn(online: boolean, activeId: string | null | undefined, myId: string | null, activeGuest: string | null): boolean {
  if (!online) return true;
  if (!activeId) return false;
  return activeId === myId || activeId === activeGuest;
}

/** TV-Spielerliste: Spielstand aus der Partie, Symbol/Farbe aus dem Raum bzw. der Party (TVAvatar, Kino). */
export function brewTvPlayers<P extends { id: string; name: string; color: string }>(players: readonly P[], room: readonly BrewRoomSeat[]) {
  return players.map((p) => {
    const seat = room.find((r) => r.id === p.id) ?? room.find((r) => r.name === p.name);
    return { ...p, avatar: seat?.avatar || p.name.slice(0, 1).toUpperCase(), color: seat?.color || p.color };
  });
}
