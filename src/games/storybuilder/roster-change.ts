/**
 * Mitspielende verlassen STORYBUILDER mitten in der Geschichte (Masterplan
 * 6.6, F13/F14). Rein: Der Host wendet das auf seinen Zustand an und verteilt
 * ihn wie gewohnt.
 *
 * Regeln:
 * - Wer vor der schreibenden Person sitzt und geht: Index rutscht mit, es
 *   schreibt weiter dieselbe Person.
 * - Wer gerade schreibt: Der angefangene Zug verfaellt, die naechste Person
 *   beginnt mit Satz 1 (`turnRestarted` → Schreibuhr neu). War es die letzte
 *   der Runde → naechste Runde; war es die letzte Runde → Auflösung.
 * - Bereits geschriebene Saetze bleiben in der Geschichte.
 * - Vor dem Start und in der Auflösung aendert sich nichts.
 */

export interface StoryRoster<P extends { id: string }> {
  players: P[];
  phase: string;
  currentRound: number;
  totalRounds: number;
  currentPlayerIdx: number;
  currentSentenceNum: number;
}

export interface StoryRosterChange<P extends { id: string }> {
  state: StoryRoster<P>;
  changed: boolean;
  /** Der Zug der schreibenden Person ist verfallen; Schreibuhr neu starten. */
  turnRestarted: boolean;
}

const PLAYING = new Set(["writing", "passing"]);

export function removeFromStory<P extends { id: string }>(state: StoryRoster<P>, removedIds: readonly string[]): StoryRosterChange<P> {
  if (!PLAYING.has(state.phase) || !state.players.some((p) => removedIds.includes(p.id))) {
    return { state, changed: false, turnRestarted: false };
  }
  const players = [...state.players];
  let { currentPlayerIdx, currentSentenceNum, currentRound, phase } = state;
  let turnRestarted = false;

  for (const id of removedIds) {
    const k = players.findIndex((p) => p.id === id);
    if (k < 0) continue;
    players.splice(k, 1);
    if (k < currentPlayerIdx) currentPlayerIdx -= 1;
    else if (k === currentPlayerIdx) {
      turnRestarted = true;
      currentSentenceNum = 1;
    }
  }

  if (players.length === 0) {
    return { state: { ...state, players, phase: "storyReveal", currentPlayerIdx: 0, currentSentenceNum: 1 }, changed: true, turnRestarted: false };
  }
  if (currentPlayerIdx >= players.length) {
    currentPlayerIdx = 0;
    currentSentenceNum = 1;
    currentRound += 1;
    if (currentRound > state.totalRounds) {
      return { state: { ...state, players, phase: "storyReveal", currentRound: state.totalRounds, currentPlayerIdx: 0, currentSentenceNum: 1 }, changed: true, turnRestarted: false };
    }
  }
  // Ohne die schreibende Person gibt es niemanden zum Weiterreichen.
  if (turnRestarted && phase === "passing") phase = "writing";

  return { state: { ...state, players, phase, currentRound, currentPlayerIdx, currentSentenceNum }, changed: true, turnRestarted };
}
