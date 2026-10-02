import { dropFromRoster, withoutIds } from '../multiplayer/roster-removal';

type TDPlayer = { id: string; score: number; truthCount: number; dareCount: number };
type Choice = 'truth' | 'dare' | null;

/** Close a vote on the active player's task: majority of the other players passes it (dare 2, truth 1). */
export function scoreVote<P extends TDPlayer>(players: P[], activeIdx: number, votes: Record<string, boolean>, choiceType: Choice): P[] {
  const voters = players.filter((_, i) => i !== activeIdx).length;
  const passed = Object.values(votes).filter(Boolean).length > voters / 2;
  return players.map((p, i) => i === activeIdx ? {
    ...p,
    score: p.score + (passed ? (choiceType === 'dare' ? 2 : 1) : 0),
    truthCount: p.truthCount + (choiceType === 'truth' ? 1 : 0),
    dareCount: p.dareCount + (choiceType === 'dare' ? 1 : 0),
  } : p);
}

export interface TruthDareState<P> {
  phase: string; players: P[]; activeIdx: number; spinTarget: number;
  turnQueue: number[]; votes: Record<string, boolean>; voterIdx: number; choiceType: Choice;
}

export interface TruthDareRemoval<P> {
  players: P[]; activeIdx: number; spinTarget: number; turnQueue: number[];
  votes: Record<string, boolean>; voterIdx: number;
  /** The turn is over (active player gone, or the vote closed without the removed voter): advance like a skip. */
  endTurn: boolean;
}

/**
 * Host-side kick/leave mid-match (G7). Index pointers (active player, wheel
 * target, shuffled turn queue, current voter) stay on the same people; the
 * removed player's turn ends without points; a vote waiting on them closes.
 */
export function dropTruthDarePlayers<P extends TDPlayer>(state: TruthDareState<P>, removed: readonly string[]): TruthDareRemoval<P> | null {
  const { players } = state;
  const drop = dropFromRoster(players, state.activeIdx, removed);
  if (!drop) return null;
  const gone = new Set(drop.removedIds);
  const remap = (i: number) => (players[i] && !gone.has(players[i].id) ? drop.players.indexOf(players[i]) : -1);
  const base: TruthDareRemoval<P> = {
    players: drop.players,
    activeIdx: Math.max(0, drop.activeIdx),
    spinTarget: Math.max(0, dropFromRoster(players, state.spinTarget, drop.removedIds)?.activeIdx ?? 0),
    turnQueue: state.turnQueue.map(remap).filter(i => i >= 0),
    votes: withoutIds(state.votes, drop.removedIds),
    voterIdx: state.voterIdx,
    endTurn: false,
  };
  const inTurn = state.phase === 'choice' || state.phase === 'reveal' || state.phase === 'vote';
  if (inTurn && drop.activeRemoved) return { ...base, votes: {}, voterIdx: 0, endTurn: true };
  if (state.phase !== 'vote') return base;
  // Voters go in order through everyone but the active player; those before voterIdx already voted.
  const active = players[state.activeIdx];
  const voterIdx = players.filter(p => p !== active).slice(0, state.voterIdx).filter(p => !gone.has(p.id)).length;
  if (voterIdx < drop.players.length - 1) return { ...base, voterIdx };
  return { ...base, voterIdx, players: scoreVote(drop.players, base.activeIdx, base.votes, state.choiceType), endTurn: true };
}
