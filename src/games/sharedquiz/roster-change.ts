/**
 * Mitspielende verlassen GETEILT GEQUIZZT mitten im Spiel (Masterplan 6.6,
 * F13–F15, F19). Rein: Der Host wendet das auf seinen Zustand an und
 * verteilt ihn wie gewohnt per privatem Schnappschuss.
 *
 * Regeln:
 * - `roleIndices` zeigen auf `players` — sie werden auf die neuen Positionen
 *   umgerechnet.
 * - Hatte eine entfernte Person eine Rolle (Frage, Antworten, Tipp bzw. eine
 *   Antwortposition), uebernimmt sie die naechste Person ohne Rolle
 *   (Schluesselrolle, F19). Nur sie bekommt die Teil-Info der Rolle — niemand
 *   sieht dadurch mehr als vorher, und nichts davon geht an den Fernseher.
 * - Ketten-/Alles-oder-nichts-Modus: Faellt eine Antwortposition weg, beginnt
 *   die laufende Frage mit leerer Antwortliste neu — sonst bekaeme die
 *   Ersatzperson Punkte fuer eine fremde Antwort.
 * - Zu wenige Leute fuer drei Rollen: Rollen duerfen doppelt liegen; die
 *   Untergrenze entscheidet die Spielhuelle (MatchGuard), hier darf nur
 *   nichts abstuerzen.
 */

export interface SharedRosterPlayer {
  id: string;
}

export interface SharedRosterState<P extends SharedRosterPlayer = SharedRosterPlayer> {
  players: P[];
  roleIndices: [number, number, number];
  phase: string;
  mode: string;
  teamAnswers: number[];
}

export interface SharedRosterChange<P extends SharedRosterPlayer> {
  state: SharedRosterState<P>;
  changed: boolean;
  /** Mindestens eine Rolle hat die Person gewechselt. */
  roleReassigned: boolean;
}

export function removeFromSharedQuiz<P extends SharedRosterPlayer>(state: SharedRosterState<P>, removedIds: readonly string[]): SharedRosterChange<P> {
  const removed = new Set(removedIds);
  if (!state.players.some((p) => removed.has(p.id))) return { state, changed: false, roleReassigned: false };

  const newIndex = new Map<number, number>();
  state.players.forEach((p, i) => {
    if (!removed.has(p.id)) newIndex.set(i, newIndex.size);
  });
  const players = state.players.filter((p) => !removed.has(p.id));
  const count = players.length;

  // Erst die Verbliebenen auf ihre neuen Plaetze, dann die Luecken fuellen.
  const kept = state.roleIndices.map((i) => newIndex.get(i % Math.max(1, state.players.length)));
  const taken = new Set(kept.filter((i): i is number => i !== undefined));
  let roleReassigned = false;
  const roleIndices = kept.map((index, role) => {
    if (index !== undefined) return index;
    roleReassigned = true;
    if (count === 0) return 0;
    // Ab der alten Position weitersuchen: wer nach der entfernten Person sass.
    const oldPos = state.roleIndices[role] % Math.max(1, state.players.length);
    const start = [...newIndex.keys()].filter((i) => i < oldPos).length % count;
    for (let step = 0; step < count; step++) {
      const candidate = (start + step) % count;
      if (!taken.has(candidate)) {
        taken.add(candidate);
        return candidate;
      }
    }
    return start; // weniger als drei Leute: Rolle doppelt belegen
  }) as [number, number, number];

  const restartAnswers = roleReassigned && state.mode !== "trio" && state.phase === "playerC";
  return {
    state: { ...state, players, roleIndices, teamAnswers: restartAnswers ? [] : state.teamAnswers },
    changed: true,
    roleReassigned,
  };
}
