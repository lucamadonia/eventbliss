/**
 * Bombe mit 🔁-Gaesten am Host-Handy (guestPolicy 'turns').
 *
 * Warum ohne verdeckte Weitergabe und ohne Uhr-Pause: Die Bombe wird auch
 * ohne App von Hand zu Hand gereicht — genau das ist das Spiel. Haelt ein Gast
 * die Bombe, reicht der Host ihm einfach das Handy, die Zuendschnur laeuft
 * weiter. Eine Pause wuerde Gaeste zum sicheren Hafen machen (wer zu einem
 * Gast weitergibt, kauft Zeit) und die versteckte Restzeit verraten. Es gibt
 * nichts Geheimes, also auch keinen Abdeck-Bildschirm.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */
import { planPhaseStart } from '../party/phase-gate';

export interface BombSeatSource { id?: string; name: string }
export interface BombRoomSeat { id: string; name: string; avatar?: string; color?: string; controlledBy?: string }

/** Platz, der gerade die Bombe haelt (Kennung aus dem Spiel, sonst aus dem Raum an derselben Stelle). */
export function bombHolderId(players: readonly BombSeatSource[], index: number, room: readonly { id: string }[] = []): string | null {
  return players[index]?.id ?? room[index]?.id ?? null;
}

/** Wie dieses Handy den Halter sieht: selbst dran, Gast an diesem Handy, oder jemand anderes. */
export function bombHolderKind(holderId: string | null, myId: string | undefined, localSeats: readonly string[]): 'me' | 'pass' | 'other' {
  if (!holderId) return 'other';
  if (holderId === myId) return 'me';
  return localSeats.includes(holderId) ? 'pass' : 'other';
}

/** Darf `sender` fuer den Halter antworten? Er selbst, oder das Geraet, das seinen 🔁-Platz spielt. */
export function bombSenderMayAct(holderId: string | null, sender: unknown, room: readonly BombRoomSeat[]): boolean {
  if (!holderId || typeof sender !== 'string') return false;
  if (sender === holderId) return true;
  return room.some(seat => seat.id === holderId && seat.controlledBy === sender);
}

/**
 * Phasenwechsel mit Startzeit fuer alle Geraete (Design §9): Der Host stempelt
 * jede neue Phase mit `phaseStartsAt`; Handys und TV wechseln zur selben Zeit.
 * Gleiche Phase → unveraendert (kein neuer Takt mitten im Zug).
 */
export function enterBombPhase<T extends { phase: string; phaseStartsAt?: number }>(state: T, phase: T['phase'], startsAt: () => number = planPhaseStart): T {
  if (state.phase === phase) return state;
  return { ...state, phase, phaseStartsAt: startsAt() };
}

/** TV-Spielerliste: Name/Strafen aus dem Spiel, Symbol/Farbe aus dem Raum (TVAvatar, Kino). */
export function bombTvPlayers<P extends BombSeatSource & { penalties: number }>(players: readonly P[], room: readonly BombRoomSeat[]) {
  return players.map((player, index) => {
    const seat = (player.id ? room.find(r => r.id === player.id) : undefined) ?? room.find(r => r.name === player.name);
    return { id: player.id ?? seat?.id ?? `seat-${index}`, name: player.name, penalties: player.penalties,
      ...(seat?.avatar ? { avatar: seat.avatar } : {}), ...(seat?.color ? { color: seat.color } : {}) };
  });
}

/** Oeffentlicher TV-Hinweis „Max spielt am Host-Handy“, solange ein Gast die Bombe haelt — sonst null. */
export function bombTvHandover(holderId: string | null, room: readonly BombRoomSeat[]) {
  const seat = room.find(r => r.id === holderId);
  if (!seat?.controlledBy) return null;
  return { playerId: seat.id, name: seat.name, avatar: seat.avatar || seat.name.slice(0, 1).toUpperCase(), color: seat.color || '#df8eff' };
}
