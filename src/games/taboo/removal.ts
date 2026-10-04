import { dropFromRoster } from '../multiplayer/roster-removal';

/** The roster part of a taboo team. `ids` (room player ids, parallel to `players`) exist in online matches only. */
export interface TeamRoster { players: string[]; ids?: string[] }

export interface TabooDrop<T extends TeamRoster> {
  teams: [T, T];
  explainerIdx: [number, number];
  /** Unchanged, `turnSummary` (explainer left mid-turn) or `gameOver` (fewer than 4 players left). */
  phase: string;
  /** Names moved to the other team so every team keeps at least 2 (someone always guesses). */
  moved: string[];
}

/** Taboo needs an explainer and a guesser per team. */
export const TABOO_MIN_TEAM = 2;
export const TABOO_MIN_PLAYERS = 4;

/**
 * Like pantomime: a team below 2 players gets one from the larger team — never the
 * larger team's next explainer, so the turn order stays predictable. Mutates the given copies.
 */
function rebalance<T extends TeamRoster>(teams: [T, T], explainerIdx: [number, number]): string[] {
  const moved: string[] = [];
  for (let small = teams.findIndex(team => team.players.length < TABOO_MIN_TEAM); small >= 0; small = teams.findIndex(team => team.players.length < TABOO_MIN_TEAM)) {
    const big = 1 - small, donor = teams[big];
    if (donor.players.length <= TABOO_MIN_TEAM) break;
    const pointer = explainerIdx[big] % donor.players.length;
    const from = pointer === donor.players.length - 1 ? donor.players.length - 2 : donor.players.length - 1;
    const take = <V>(list: V[] | undefined) => list ? [list.filter((_, i) => i !== from), list[from]] as const : [undefined, undefined] as const;
    const [restNames, name] = take(donor.players), [restIds, id] = take(donor.ids);
    teams[big] = { ...donor, players: restNames!, ...(restIds ? { ids: restIds } : {}) };
    teams[small] = { ...teams[small], players: [...teams[small].players, name!], ...(teams[small].ids && id ? { ids: [...teams[small].ids!, id] } : {}) };
    if (from < pointer) explainerIdx[big] = pointer - 1;
    moved.push(name!);
  }
  return moved;
}

/**
 * Host-side: drop players removed mid-match (kick/leave) from their team (G7).
 * - Each team's next explainer stays the same person; if they left, the next teammate takes the seat.
 * - Explainer left while explaining (or before the summary was confirmed): the turn ends as a timeout
 *   would, and the seat pointer is set one back so `endTurn`'s +1 lands on the teammate who took over.
 * - A team without players ends the match (a one-team game cannot continue) — never a turn for nobody.
 */
export function dropTabooPlayers<T extends TeamRoster>(teams: readonly [T, T], activeTeamIdx: number, explainerIdx: readonly [number, number], phase: string, removed: readonly string[]): TabooDrop<T> | null {
  let changed = false;
  let explainerLeft = false;
  const nextTeams = [...teams] as [T, T];
  const nextIdx = explainerIdx.map((idx, teamIdx) => {
    const team = teams[teamIdx];
    if (!team.ids?.length) return idx;
    const roster = team.ids.map((id, i) => ({ id, name: team.players[i] }));
    const drop = dropFromRoster(roster, idx % roster.length, removed);
    if (!drop) return idx;
    changed = true;
    nextTeams[teamIdx] = { ...team, players: drop.players.map(p => p.name), ids: drop.players.map(p => p.id) };
    if (teamIdx === activeTeamIdx && drop.activeRemoved) explainerLeft = true;
    return Math.max(0, drop.activeIdx);
  }) as [number, number];
  if (!changed) return null;
  let nextPhase = phase, moved: string[] = [];
  const total = nextTeams[0].players.length + nextTeams[1].players.length;
  // Below 4 players taboo cannot be played fairly: end cleanly (the room wrapper asks the host how to go on).
  if (phase !== 'setup' && phase !== 'gameOver' && total < TABOO_MIN_PLAYERS) nextPhase = 'gameOver';
  else {
    if (explainerLeft && (phase === 'playing' || phase === 'turnSummary')) {
      const size = nextTeams[activeTeamIdx].players.length;
      if (size) nextIdx[activeTeamIdx] = (nextIdx[activeTeamIdx] - 1 + size) % size;
      nextPhase = 'turnSummary';
    }
    moved = rebalance(nextTeams, nextIdx);
  }
  return { teams: nextTeams, explainerIdx: nextIdx, phase: nextPhase, moved };
}

/** Which team a room player is on: by id once teams carry ids, else the original half split of the room. */
export function teamIndexOf(teams: readonly TeamRoster[], id: string, rosterIdx: number, rosterSize: number): 0 | 1 {
  const byId = teams.findIndex(team => team.ids?.includes(id));
  if (byId === 0 || byId === 1) return byId;
  return rosterIdx < Math.ceil(rosterSize / 2) ? 0 : 1;
}
