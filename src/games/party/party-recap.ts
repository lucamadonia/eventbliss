/**
 * party-recap.ts — "Abend-Rückblick" (masterplan §11): the evening on one card.
 *
 * Derived only from what the whole group already saw: standings (names,
 * avatars, colours, points) and the game history. Pure, no React.
 */
import type { GameHistoryEntry } from './session-schema';
import type { PartyStanding } from '@/games/tv/party-types';

export interface RecapPlayer { id: string; name: string; avatar: string; color: string }
export interface RecapGame {
  gameId: string;
  /** Winners of this game (ties share it); empty for pause games. */
  winners: RecapPlayer[];
  /** Raw-score lead of the winner over the runner-up; null when not comparable. */
  margin: number | null;
}
export interface PartyRecap {
  dateMs: number;
  gamesPlayed: number;
  podium: (RecapPlayer & { rank: number; points: number })[];
  games: RecapGame[];
  /** The tightest decided game of the night. */
  closestWin: (RecapGame & { runnerUp: RecapPlayer }) | null;
  /** Most single-game wins (only when somebody won at least two). */
  mostWins: (RecapPlayer & { wins: number }) | null;
}

const asPlayer = (row: PartyStanding): RecapPlayer => ({ id: row.id, name: row.name, avatar: row.avatar ?? '🎉', color: row.color });

export function buildPartyRecap(standings: readonly PartyStanding[], history: readonly GameHistoryEntry[], fallbackDateMs: number): PartyRecap {
  const byId = new Map(standings.map(row => [row.id, asPlayer(row)]));
  const games: RecapGame[] = [];
  let closestWin: PartyRecap['closestWin'] = null;
  const wins = new Map<string, number>();

  for (const entry of history) {
    if (!entry.scored) { games.push({ gameId: entry.gameId, winners: [], margin: null }); continue; }
    const ranked = Object.entries(entry.scores).filter(([id]) => byId.has(id)).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) { games.push({ gameId: entry.gameId, winners: [], margin: null }); continue; }
    const best = ranked[0][1];
    const winners = ranked.filter(([, score]) => score === best).map(([id]) => byId.get(id)!);
    winners.forEach(w => wins.set(w.id, (wins.get(w.id) ?? 0) + 1));
    const runner = ranked.find(([, score]) => score < best);
    const margin = winners.length === 1 && runner ? best - runner[1] : null;
    const game: RecapGame = { gameId: entry.gameId, winners, margin };
    games.push(game);
    if (margin !== null && runner && (!closestWin || margin < (closestWin.margin ?? Infinity))) {
      closestWin = { ...game, runnerUp: byId.get(runner[0])! };
    }
  }

  const top = [...wins.entries()].sort((a, b) => b[1] - a[1]);
  const mostWins = top.length && top[0][1] >= 2 && (top.length === 1 || top[1][1] < top[0][1])
    ? { ...byId.get(top[0][0])!, wins: top[0][1] } : null;
  const played = history.map(entry => entry.playedAt).filter(ms => Number.isFinite(ms) && ms > 0);

  return {
    dateMs: played.length ? Math.min(...played) : fallbackDateMs,
    gamesPlayed: history.length,
    podium: standings.filter(row => row.rank <= 3).slice(0, 3).map(row => ({ ...asPlayer(row), rank: row.rank, points: row.points })),
    games,
    closestWin,
    mostWins,
  };
}
