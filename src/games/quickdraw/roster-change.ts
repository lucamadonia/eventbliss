/**
 * SCHNELLZEICHNER — Mitspielende verlassen die Partie mitten im Spiel
 * (Masterplan 6.6, F13/F14/F19). Rein: Der Host wendet das auf seinen
 * Zustand an und verteilt ihn wie gewohnt.
 *
 * `drawerIdx` zeigt in `players` (modulo Laenge), `currentGuesser` in die
 * Ratenden = alle ausser dem Zeichner, in Spielerreihenfolge.
 *
 * Regeln:
 * - Zeichner geht vor der Aufloesung → `restartTurn`: Der Naechste in der
 *   Reihe zeichnet ein neues Wort (Schluesselrolle, F19).
 * - Zeichner geht nach der Aufloesung → Zeiger so setzen, dass `nextRound`
 *   (+1) beim Naechsten landet.
 * - Ratender geht → seine Raten fallen weg; war er dran, ist der Naechste dran;
 *   hat danach jeder Verbliebene geraten → Aufloesung (`roundResult`).
 * Unter der Mindestzahl entscheidet die Raum-Huelle (MatchGuard).
 */

export interface QuickDrawRoster<P extends { id: string } = { id: string }, G extends { playerId: string } = { playerId: string }> {
  players: P[];
  drawerIdx: number;
  currentGuesser: number;
  phase: string;
  guesses: G[];
}

export interface QuickDrawRosterChange<P extends { id: string }, G extends { playerId: string }> {
  state: QuickDrawRoster<P, G>;
  changed: boolean;
  /** Neuer Zeichner, neues Wort: `beginRound(state.drawerIdx)` und Uhr stoppen. */
  restartTurn: boolean;
}

const BEFORE_RESULT = new Set(['drawerReveal', 'drawing', 'guessing']);

export function removeFromQuickDraw<P extends { id: string }, G extends { playerId: string }>(
  state: QuickDrawRoster<P, G>,
  removedIds: readonly string[],
): QuickDrawRosterChange<P, G> {
  const removed = new Set(removedIds);
  if (!state.players.some((p) => removed.has(p.id))) return { state, changed: false, restartTurn: false };

  const oldLen = state.players.length;
  const oldDrawer = oldLen ? ((state.drawerIdx % oldLen) + oldLen) % oldLen : 0;
  const drawer = state.players[oldDrawer];
  const drawerLeft = !!drawer && removed.has(drawer.id);

  const players = state.players.filter((p) => !removed.has(p.id));
  const guesses = state.guesses.filter((g) => !removed.has(g.playerId));
  const len = players.length;
  // Wie viele Verbliebene standen VOR der alten Zeichner-Position?
  const before = state.players.slice(0, oldDrawer).filter((p) => !removed.has(p.id)).length;

  if (!len) {
    return { state: { ...state, players, guesses, drawerIdx: 0, currentGuesser: 0 }, changed: true, restartTurn: false };
  }

  if (drawerLeft) {
    const next = before % len; // die Person direkt nach dem Gegangenen
    if (BEFORE_RESULT.has(state.phase)) {
      return {
        state: { ...state, players, guesses: [] as G[], drawerIdx: next, currentGuesser: 0, phase: 'drawerReveal' },
        changed: true,
        restartTurn: true,
      };
    }
    // Aufloesung/Ende: `nextRound` rechnet +1.
    return { state: { ...state, players, guesses, drawerIdx: (next - 1 + len) % len, currentGuesser: 0 }, changed: true, restartTurn: false };
  }

  const drawerIdx = before;
  let currentGuesser = state.currentGuesser;
  let phase = state.phase;
  if (state.phase === 'guessing') {
    const oldGuessers = state.players.filter((_, i) => i !== oldDrawer);
    currentGuesser = oldGuessers.slice(0, Math.max(0, state.currentGuesser)).filter((p) => !removed.has(p.id)).length;
    if (currentGuesser >= len - 1) {
      phase = 'roundResult';
      currentGuesser = Math.max(0, len - 2);
    }
  }
  return { state: { ...state, players, guesses, drawerIdx, currentGuesser, phase }, changed: true, restartTurn: false };
}
