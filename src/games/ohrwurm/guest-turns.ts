/**
 * OHRWURM mit 🔁-Gaesten am Host-Handy (guestPolicy 'turns').
 *
 * Ein Zug gehoert genau einer Person (ziehen → hoeren → einordnen → Auflösung).
 * Ist sie ein Gast am Host-Handy, wird das Handy vor dem Zug verdeckt
 * weitergegeben (useSeatHandover); die 60-s-Uhr laeuft ohnehin erst mit
 * „Abspielen“, und die Karte bleibt bis zur Auflösung ein Mystery — es gibt
 * also nichts, was beim Weitergeben verraten werden koennte.
 *
 * Konter (fair fuer alle): Jedes Geraet kontert fuer die Plaetze, die es
 * spielt — das Host-Handy also fuer den Host UND seine Gaeste (wer zuerst
 * tippt, kontert, genau wie bei eigenen Handys). Kontert ein Gast, bekommt er
 * das Handy fuer seinen Konter-Platz und gibt es danach zurueck.
 *
 * Rein, damit Host-Ablauf und Tests dieselbe Regel teilen.
 */
import type { Phase } from './ohrwurm-engine';
import { canNavigateBack } from './navigation';

export interface OhrwurmRoomSeat { id: string; controlledBy?: string }

/** Darf `sender` fuer `seat` handeln? Er selbst, oder das Geraet, das diesen 🔁-Platz spielt. */
export function mayActFor(seat: string | null | undefined, sender: unknown, room: readonly OhrwurmRoomSeat[]): boolean {
  if (!seat || typeof sender !== 'string') return false;
  return sender === seat || room.some((r) => r.id === seat && r.controlledBy === sender);
}

/**
 * Wer das Handy in dieser Phase halten soll (fuer die Weitergabe): die aktive
 * Person waehrend ihres ganzen Zugs, beim Konter-Platzieren die konternde.
 */
export function ohrwurmActingSeat(phase: Phase, activeId: string | null | undefined, counteringId: string | null): string | null {
  if (phase === 'counterPlace') return counteringId;
  if (phase === 'draw' || phase === 'place' || phase === 'counter' || phase === 'reveal') return activeId ?? null;
  return null;
}

export interface OhrwurmActionContext {
  phase: Phase;
  activeId: string | null | undefined;
  counteringId: string | null;
  participantIds: readonly string[];
  /** Group IDs resolve to the member whose turn it currently is. */
  seatByParticipant?: Readonly<Record<string, string>>;
  room: readonly OhrwurmRoomSeat[];
}

const EXPECTED: Record<string, readonly Phase[]> = {
  toPlace: ['draw'], toggleBonus: ['draw', 'place'], listen: ['draw'], swap: ['draw'], place: ['place'],
  chooseCounter: ['counter'], commitCounter: ['counterPlace'], noCounter: ['counter'], bonus: ['reveal'],
  continue: ['reveal'], back: ['place', 'counter', 'counterPlace'], again: ['gameOver'],
};

/** Host: darf diese Aktion von `sender` jetzt angewendet werden? */
export function authorizeOhrwurmAction(data: Record<string, unknown>, sender: unknown, ctx: OhrwurmActionContext): boolean {
  const { phase, activeId, counteringId, participantIds, room } = ctx;
  if (typeof sender !== 'string') return false;
  const seatOf = (id: string | null | undefined) => id ? ctx.seatByParticipant?.[id] ?? id : null;
  // Nur Mitspielende — oder das Geraet, das einen Mitspieler-Platz spielt.
  if (!participantIds.some((id) => mayActFor(seatOf(id), sender, room))) {
    if (data.type !== 'again' || !room.some((r) => r.id === sender || r.controlledBy === sender)) return false;
  }
  const type = String(data.type);
  if (!EXPECTED[type]?.includes(phase)) return false;
  if (type === 'again') return true;
  if (type === 'back') {
    const seat = phase === 'counterPlace' ? counteringId : activeId;
    return canNavigateBack(phase, data.to, mayActFor(seatOf(seat), sender, room) ? seat : sender, activeId ?? undefined, counteringId);
  }
  if (type === 'chooseCounter') {
    const pid = data.pid;
    return typeof pid === 'string' && pid !== activeId && participantIds.includes(pid) && mayActFor(seatOf(pid), sender, room);
  }
  if (type === 'commitCounter') return mayActFor(seatOf(counteringId), sender, room);
  return mayActFor(seatOf(activeId), sender, room);
}

/** Welche Konter-Zeilen dieses Geraet antippen darf (offline: alle). */
export function canCounterAs(seatId: string, activeId: string | null | undefined, localSeats: readonly string[] | null): boolean {
  if (seatId === activeId) return false;
  return !localSeats || localSeats.includes(seatId);
}

/** Wo der Ton laeuft: offline hier; online am TV, sonst am Geraet, das den aktiven Platz spielt. */
export function ohrwurmAudioHere(isOnline: boolean, tvConnected: boolean, activeId: string | null | undefined, localSeats: readonly string[]): boolean {
  if (!isOnline) return true;
  return !tvConnected && !!activeId && localSeats.includes(activeId);
}

/**
 * Phasen-Takt: Einordnen gehoert zum selben Zug wie Hoeren — dort kein neuer
 * Takt (die 60-s-Uhr laeuft weiter, eine Eingabesperre wuerde Zeit kosten).
 */
export function ohrwurmBeatPhase(phase: Phase): Phase {
  return phase === 'place' ? 'draw' : phase;
}

/** TV-Spielerliste (oeffentlich): Name, Symbol, Farbe, Treffer, Haken. */
export function ohrwurmTvPlayers(participants: readonly { id: string; name: string; color: string; avatar: string; timeline: readonly unknown[]; hooks: number }[]) {
  return participants.map((p) => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, score: p.timeline.length, hooks: p.hooks }));
}
