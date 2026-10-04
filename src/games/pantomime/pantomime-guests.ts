/**
 * PANTOMIME mit 🔁-Gaesten am Host-Handy (sharedDevice 'turns').
 *
 * Nur der Darsteller braucht das Handy: Er sieht den Begriff, das Team raet
 * laut. Ist der Darsteller ein Gast am Host-Handy, wandert das Handy VOR
 * seinem Zug zu ihm (verdeckt, Halten — der Begriff darf seinem Team, auch
 * dem Host, nie vor der Geste erscheinen) und nach dem Zug zugedeckt zurueck.
 *
 * Rein: der Spielbildschirm reicht Phase, Darsteller und Weitergabe-Zustand
 * herein.
 */

/** Phasen, in denen der Darsteller das Handy haelt. */
export const ACTOR_PHASES = new Set(["turnStart", "extra", "fetch", "playing"]);

/**
 * Wer das Handy JETZT haben muss — `null`, wenn kein Gast-Darsteller dran
 * ist (dann geht es an den Host zurueck bzw. bleibt dort).
 */
export function pantomimeHandoverSeat(
  phase: string,
  actorId: string | null | undefined,
  isGuest: (id: string) => boolean,
): string | null {
  return actorId && ACTOR_PHASES.has(phase) && isGuest(actorId) ? actorId : null;
}

/**
 * Darf DIESES Geraet die Darsteller-Ansicht zeigen (Begriff, Knoepfe)?
 * Offline immer; online der eigene Platz, oder ein Gast erst NACH „Ich bin …“.
 * Waehrend das Handy unterwegs ist, nie.
 */
export function showsActorView(args: {
  isOnline: boolean;
  myId: string | null;
  actorId: string | null | undefined;
  activeGuest: string | null;
  handoverPaused: boolean;
}): boolean {
  if (!args.isOnline) return true;
  if (!args.actorId || args.handoverPaused) return false;
  return args.actorId === args.myId || args.actorId === args.activeGuest;
}

/**
 * Soll die Zuguhr laufen? Nur online auf dem Host im Spiel: erst, wenn die
 * Phase sichtbar und Eingabe frei ist (gemeinsamer Start), nie waehrend einer
 * Weitergabe. `null` = nichts anfassen (lokal, andere Phasen, Uhr abgelaufen).
 */
export function turnClockShouldRun(args: {
  isOnline: boolean;
  isHost: boolean;
  phase: string;
  inputOpen: boolean;
  handoverPaused: boolean;
  timeLeft: number;
}): boolean | null {
  if (!args.isOnline || !args.isHost || args.phase !== "playing" || args.timeLeft <= 0) return null;
  return args.inputOpen && !args.handoverPaused;
}

export interface PantomimeSeat {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface PantomimeTvPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  team: 0 | 1;
}

/**
 * Volle Spieler-Identitaet fuer den Fernseher (Name, Symbol, Farbe, Team) —
 * nie der Begriff. Fehlt Symbol/Farbe im Raum, gilt Initiale und Teamfarbe.
 */
export function pantomimeTvRoster(
  teams: readonly { color: string; players: readonly { id: string; name: string }[] }[],
  seats: readonly PantomimeSeat[] = [],
): PantomimeTvPlayer[] {
  return teams.flatMap((team, t) =>
    team.players.map((p) => {
      const seat = seats.find((s) => s.id === p.id);
      return {
        id: p.id,
        name: p.name,
        avatar: seat?.avatar || p.name.slice(0, 1).toUpperCase(),
        color: seat?.color || team.color,
        team: (t === 0 ? 0 : 1) as 0 | 1,
      };
    }),
  );
}
