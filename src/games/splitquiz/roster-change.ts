/**
 * Mitspielende verlassen SPLIT-QUIZ mitten im Spiel (Masterplan 6.6,
 * F13–F15, F19). Rein: Der Host wendet das auf seinen Zustand an.
 *
 * Regeln:
 * - Entfernte fallen aus `rosterIds`/`playerNames` (gleich lang, gleiche
 *   Reihenfolge) und aus ihrem Team. Antworten gibt jedes Team gemeinsam ab —
 *   solange ein Team noch jemanden hat, laeuft alles weiter.
 * - Wird ein Team leer, wechselt eine Person aus dem groesseren Team hinueber
 *   (nur wenn dort mindestens zwei sind). Mitten in einer Frage hat sie dann
 *   schon die Antwort-Haelfte ihres alten Teams gesehen — darum beginnt die
 *   laufende Frage mit einer NEUEN Frage und neuer Aufteilung (`restartQuestion`).
 *   In der Aufloesung ist alles offen, dort genuegt der Wechsel.
 * - Geht das nicht (zu wenige Leute), ist das leere Team, wenn es dran ist,
 *   ohne Antwort fertig (`skipActive`) — die Untergrenze entscheidet die
 *   Spielhuelle (MatchGuard), hier darf nur nichts haengen.
 */

export interface SplitRosterTeam {
  players: string[];
}

export interface SplitRosterState<T extends SplitRosterTeam = SplitRosterTeam> {
  phase: string;
  rosterIds: string[];
  playerNames: string[];
  teamA: T;
  teamB: T;
  activeTeamIdx: number;
  teamAnswered: [boolean, boolean];
}

export interface SplitRosterChange<T extends SplitRosterTeam> {
  state: SplitRosterState<T>;
  changed: boolean;
  /** Eine Person hat das Team gewechselt. */
  rebalanced: boolean;
  /** Laufende Frage mit neuer Frage + Aufteilung neu beginnen. */
  restartQuestion: boolean;
  /** Das aktive Team ist leer und kann nicht antworten → ohne Antwort abschliessen. */
  skipActive: boolean;
}

const QUESTION_PHASES = new Set(["handoff", "betting", "question"]);

export function removeFromSplitQuiz<T extends SplitRosterTeam>(state: SplitRosterState<T>, removedIds: readonly string[]): SplitRosterChange<T> {
  const removed = new Set(removedIds);
  const touched = state.rosterIds.some((id) => removed.has(id))
    || state.teamA.players.some((id) => removed.has(id)) || state.teamB.players.some((id) => removed.has(id));
  if (!touched) return { state, changed: false, rebalanced: false, restartQuestion: false, skipActive: false };

  const keep = state.rosterIds.map((id) => !removed.has(id));
  const rosterIds = state.rosterIds.filter((_, i) => keep[i]);
  const playerNames = state.playerNames.filter((_, i) => keep[i] ?? true);
  const teams = [state.teamA, state.teamB].map((team) => team.players.filter((id) => !removed.has(id)));

  let rebalanced = false;
  const empty = teams.findIndex((team) => team.length === 0);
  const other = empty === 0 ? 1 : 0;
  if (empty >= 0 && teams[other].length >= 2) {
    teams[empty] = [teams[other][teams[other].length - 1]];
    teams[other] = teams[other].slice(0, -1);
    rebalanced = true;
  }

  const inQuestion = QUESTION_PHASES.has(state.phase);
  const restartQuestion = rebalanced && inQuestion;
  const stillEmpty = teams.findIndex((team) => team.length === 0);
  const skipActive = !restartQuestion && inQuestion && stillEmpty === state.activeTeamIdx && !state.teamAnswered[state.activeTeamIdx];

  return {
    state: {
      ...state,
      rosterIds,
      playerNames,
      teamA: { ...state.teamA, players: teams[0] },
      teamB: { ...state.teamB, players: teams[1] },
      ...(restartQuestion ? { activeTeamIdx: 0, teamAnswered: [false, false] as [boolean, boolean], phase: "handoff" } : {}),
    },
    changed: true,
    rebalanced,
    restartQuestion,
    skipActive,
  };
}
