/**
 * OHNE WORTE — Mitspielende verlassen die Partie mitten im Spiel (Masterplan
 * 6.6, F13/F14/F19). Rein: Der Host wendet das auf seinen Zustand an und
 * verteilt ihn wie gewohnt.
 *
 * Regeln:
 * - Entfernte fliegen aus beiden Teams; die Darsteller-Position je Team
 *   zeigt danach auf dieselbe Person bzw. — war sie es selbst — auf die
 *   naechste im Team.
 * - Faellt ein Team unter zwei (einer stellt dar, einer raet), wandert jemand
 *   aus dem groesseren Team hinueber, solange dort mehr als zwei stehen. Nie
 *   ein Darsteller, damit kein laufender Zug den Besitzer wechselt.
 * - Der aktive Darsteller geht mitten im Zug (Angebot, Holzeit, Spiel) →
 *   `restartTurn`: Der Zug beginnt fuer den Naechsten neu, angefangene Karten
 *   zaehlen nicht (wie beim Wiederherstellen nach Neustart, recovery.ts).
 * - Ist der Zug schon gespielt (`turnSummary`), bleiben die Punkte stehen; der
 *   Darsteller-Zeiger steht so, dass das Weiterreichen beim Naechsten landet.
 * - Ist das aktive Team leer, ist das andere dran.
 * Unter der Mindestzahl entscheidet die Raum-Huelle (MatchGuard).
 */

export interface RosterTeam<P extends { id: string } = { id: string }> {
  players: P[];
}

export interface PantomimeRoster<T extends RosterTeam = RosterTeam> {
  teams: [T, T];
  activeTeamIdx: 0 | 1;
  actorIdx: [number, number];
  phase: string;
}

export interface PantomimeRosterChange<T extends RosterTeam> {
  state: PantomimeRoster<T>;
  changed: boolean;
  /** Laufender Zug neu beginnen (Phase `turnStart`, Karten verwerfen, Uhr stoppen). */
  restartTurn: boolean;
  /** Ins andere Team verschobene Kennungen (fuer einen Hinweis). */
  moved: string[];
}

const MID_TURN = new Set(['extra', 'fetch', 'playing']);
const TEAM_MIN = 2;

/** Wer im Team als Naechstes darstellt: dieselbe Person oder die naechste Verbliebene. */
function nextActorId(players: { id: string }[], pos: number, removed: Set<string>): string | null {
  if (!players.length) return null;
  const start = ((pos % players.length) + players.length) % players.length;
  for (let k = 0; k < players.length; k++) {
    const p = players[(start + k) % players.length];
    if (!removed.has(p.id)) return p.id;
  }
  return null;
}

export function removeFromPantomime<P extends { id: string }, T extends RosterTeam<P>>(
  state: PantomimeRoster<T>,
  removedIds: readonly string[],
): PantomimeRosterChange<T> {
  const removed = new Set(removedIds);
  const hit = state.teams.some((tm) => tm.players.some((p) => removed.has(p.id)));
  if (!hit) return { state, changed: false, restartTurn: false, moved: [] };

  const active = state.activeTeamIdx;
  const oldActor = state.teams[active].players[state.actorIdx[active] % Math.max(1, state.teams[active].players.length)];
  const actorLeft = !!oldActor && removed.has(oldActor.id);
  const keepIds = [0, 1].map((t) => nextActorId(state.teams[t].players, state.actorIdx[t], removed)) as [string | null, string | null];

  const lists = state.teams.map((tm) => tm.players.filter((p) => !removed.has(p.id))) as [P[], P[]];

  // Ausgleich: ein Team unter zwei, das andere hat Luft.
  const moved: string[] = [];
  for (const small of [0, 1] as const) {
    const big = small === 0 ? 1 : 0;
    while (lists[small].length < TEAM_MIN && lists[big].length > TEAM_MIN) {
      let pick = -1;
      for (let i = lists[big].length - 1; i >= 0; i--) {
        if (lists[big][i].id !== keepIds[big]) { pick = i; break; }
      }
      if (pick < 0) break;
      const [p] = lists[big].splice(pick, 1);
      lists[small].push(p);
      moved.push(p.id);
    }
  }

  const actorIdx = [0, 1].map((t) => {
    const id = keepIds[t];
    const i = id ? lists[t].findIndex((p) => p.id === id) : -1;
    return i < 0 ? 0 : i;
  }) as [number, number];

  let activeTeamIdx = active;
  let phase = state.phase;
  let restartTurn = false;

  if (!lists[active].length && lists[active === 0 ? 1 : 0].length) {
    // Aktives Team leer → das andere ist dran, Zug beginnt neu.
    activeTeamIdx = active === 0 ? 1 : 0;
    if (phase !== 'gameOver' && phase !== 'setup') {
      restartTurn = phase !== 'turnStart';
      phase = 'turnStart';
    }
  } else if (actorLeft && MID_TURN.has(phase)) {
    restartTurn = true;
    phase = 'turnStart';
  } else if (actorLeft && phase === 'turnSummary' && lists[active].length) {
    // `nextTurn` reicht um eins weiter — einen Platz davor zielen.
    actorIdx[active] = (actorIdx[active] - 1 + lists[active].length) % lists[active].length;
  }

  const teams = state.teams.map((tm, t) => ({ ...tm, players: lists[t] })) as [T, T];
  return {
    state: { ...state, teams, actorIdx, activeTeamIdx, phase },
    changed: true,
    restartTurn,
    moved,
  };
}
