/**
 * Mitspielende verlassen HOCHSTAPLER mitten in der Runde (Masterplan 6.6,
 * F13–F15, F19). Rein: Der Host wendet das auf seinen Zustand an und
 * verteilt ihn wie gewohnt.
 *
 * Regeln:
 * - Abfolge (`order`) und Positionen (`currentSpeaker`, `votingPlayer`)
 *   werden umgerechnet; war die entfernte Person dran, ist es die naechste.
 * - Stimmen FUER Entfernte verfallen (der Abstimmungs-Sieger muss im Spiel sein).
 * - Bereit-Liste ohne Entfernte; sind danach alle bereit → Diskussion.
 * - Hatte nur noch eine entfernte Person die Hochstapler-Rolle → `restart`:
 *   Runde mit neuen Rollen neu beginnen (Schluesselrolle, F19).
 * - Alle Verbliebenen haben abgestimmt → Aufloesung.
 */

export interface RosterPlayer {
  id: string;
  isImpostor: boolean;
  hasSpoken: boolean;
  votedFor: string | null;
}

export interface RosterState<P extends RosterPlayer = RosterPlayer> {
  players: P[];
  /** Abfolge-Position → Index in `players`; leer = Identitaet. */
  order: number[];
  phase: string;
  currentSpeaker: number;
  votingPlayer: number;
  roleReady: string[];
}

export interface RosterChange<P extends RosterPlayer> {
  state: RosterState<P>;
  /** Etwas hat sich geaendert. */
  changed: boolean;
  /** Runde mit neuen Rollen neu starten (kein Hochstapler mehr im Spiel). */
  restart: boolean;
  /** Unter 4 Mitspielenden kann HOCHSTAPLER nicht weiterlaufen. */
  tooFew: boolean;
}

export const IMPOSTOR_MIN_PLAYERS = 4;
const ROUND_PHASES = new Set(["wordReveal", "discussion", "voting", "revealCountdown"]);

export function removeFromRound<P extends RosterPlayer>(state: RosterState<P>, removedIds: readonly string[]): RosterChange<P> {
  const removed = new Set(removedIds);
  if (!state.players.some((p) => removed.has(p.id))) {
    return { state, changed: false, restart: false, tooFew: state.players.length < IMPOSTOR_MIN_PLAYERS };
  }

  const oldOrder = state.order.length === state.players.length ? state.order : state.players.map((_, i) => i);
  const newIndex = new Map<number, number>();
  state.players.forEach((p, i) => {
    if (!removed.has(p.id)) newIndex.set(i, newIndex.size);
  });

  // Position in der Abfolge: Wie viele Verbliebene standen VOR der alten Position?
  const remapPosition = (pos: number) => oldOrder.slice(0, Math.max(0, pos)).filter((i) => newIndex.has(i)).length;

  const players = state.players
    .filter((p) => !removed.has(p.id))
    .map((p) => (p.votedFor && removed.has(p.votedFor) ? { ...p, votedFor: null } : p));
  const order = state.order.length ? oldOrder.filter((i) => newIndex.has(i)).map((i) => newIndex.get(i)!) : [];
  const roleReady = state.roleReady.filter((id) => !removed.has(id));
  const last = Math.max(0, players.length - 1);

  let phase = state.phase;
  let currentSpeaker = Math.min(remapPosition(state.currentSpeaker), last);
  let votingPlayer = remapPosition(state.votingPlayer);

  const restart = ROUND_PHASES.has(state.phase) && players.length > 0 && !players.some((p) => p.isImpostor);

  if (!restart) {
    if (phase === "wordReveal" && players.length > 0 && players.every((p) => roleReady.includes(p.id))) {
      phase = "discussion";
      currentSpeaker = 0;
    }
    if (phase === "voting") {
      if (votingPlayer >= players.length) {
        phase = "revealCountdown";
        votingPlayer = last;
      }
    } else {
      votingPlayer = Math.min(votingPlayer, last);
    }
  }

  return {
    state: { ...state, players, order, roleReady, phase, currentSpeaker, votingPlayer },
    changed: true,
    restart,
    tooFew: players.length < IMPOSTOR_MIN_PLAYERS,
  };
}

/**
 * Welcher lokale Platz deckt seine Rolle als Naechstes auf? Eigener Platz
 * zuerst (er haelt das Handy schon), dann die Gaeste in Spielreihenfolge.
 */
export function pendingLocalReveals(
  players: readonly { id: string }[],
  localSeats: readonly string[],
  roleReady: readonly string[],
): string[] {
  const inGame = new Set(players.map((p) => p.id));
  return localSeats.filter((id, i) => inGame.has(id) && !roleReady.includes(id) && localSeats.indexOf(id) === i);
}
