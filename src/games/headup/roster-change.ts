/**
 * Mitspielende verlassen HEADUP mitten im Spiel (Masterplan 6.6, F13/F14).
 * Rein: Der Host wendet das auf seinen Zustand an und verteilt ihn wie gewohnt.
 *
 * Jede Runde gehoert genau einer Person: Runde N = `order[N - 1]`. Frueher
 * hing der Zug an `online.players[N - 1]` — schrumpfte die Liste, rutschte der
 * Zug still auf jemand anderen, und eine Person kam doppelt oder gar nicht dran.
 *
 * Regeln:
 * - Wer schon gespielt hat und geht: Runde samt Ergebnis faellt weg, die
 *   aktuelle Runde bleibt bei derselben Person (`currentRound` rutscht mit).
 * - Wer gerade dran ist: Die laufende Runde verfaellt, die naechste Person
 *   startet frisch (`roundRestarted`); war es die letzte → Spielende.
 * - Wer noch nicht dran war: faellt einfach aus der Reihenfolge.
 * - Vor dem Start und nach dem Spielende aendert sich nichts.
 */

export type HeadUpScreen = "setup" | "ready" | "playing" | "roundResult" | "gameOver";

export interface HeadUpRoster<R> {
  /** Spieler-Kennungen in Rundenreihenfolge. */
  order: string[];
  /** Anzeigenamen, deckungsgleich mit `order`. */
  names: string[];
  /** 1-basiert, Runde N = order[N - 1]. */
  currentRound: number;
  screen: HeadUpScreen;
  /** Abgeschlossene Runden, deckungsgleich mit order[0..]. */
  allRounds: R[];
}

export interface HeadUpRosterChange<R> {
  state: HeadUpRoster<R>;
  changed: boolean;
  /** Die laufende Runde ist verfallen und beginnt fuer die naechste Person neu. */
  roundRestarted: boolean;
}

export function removeFromHeadUp<R>(state: HeadUpRoster<R>, removedIds: readonly string[]): HeadUpRosterChange<R> {
  if (state.screen === "setup" || state.screen === "gameOver" || !removedIds.some((id) => state.order.includes(id))) {
    return { state, changed: false, roundRestarted: false };
  }
  const order = [...state.order];
  const names = [...state.names];
  const allRounds = [...state.allRounds];
  let currentRound = state.currentRound;
  let screen: HeadUpScreen = state.screen;
  let roundRestarted = false;

  for (const id of removedIds) {
    const k = order.indexOf(id);
    if (k < 0) continue;
    const c = currentRound - 1;
    order.splice(k, 1);
    names.splice(k, 1);
    if (k < c) {
      if (k < allRounds.length) allRounds.splice(k, 1);
      currentRound -= 1;
    } else if (k === c) {
      roundRestarted = true;
    }
  }

  if (roundRestarted) {
    if (currentRound > order.length) {
      screen = "gameOver";
      roundRestarted = false;
      currentRound = Math.max(1, order.length);
    } else {
      screen = "ready";
    }
  }

  return { state: { order, names, currentRound: Math.max(1, currentRound), screen, allRounds }, changed: true, roundRestarted };
}
