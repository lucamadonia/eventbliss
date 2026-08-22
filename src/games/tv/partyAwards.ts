/**
 * partyAwards — pure derivation of the end-of-night side awards.
 *
 * The finale must give more than the winner a moment, so beyond the podium we
 * hand out titles derived purely from the game history. Kept free of React and
 * i18n on purpose: the scene maps `PartyAwardKey` to a translated title/detail.
 *
 * Distinctness is a hard rule — an award is skipped rather than given to a
 * player who already holds a higher-priority one, so awards spread across the
 * party instead of piling onto the runner-up.
 */
import type { PartyGameResult } from './party-types';

export type PartyAwardKey = 'comeback' | 'mostWins' | 'consistency' | 'bestGame' | 'unlucky';

export interface PartyAward {
  key: PartyAwardKey;
  playerId: string;
  /**
   * The headline number behind the title:
   *  - comeback    → ranks gained (see also `from` / `to`)
   *  - mostWins    → games won
   *  - consistency → average per-game rank, one decimal
   *  - bestGame    → the record single-game score (see also `gameName`)
   *  - unlucky     → number of last places
   */
  value: number;
  /** comeback only: worst rank reached during the evening */
  from?: number;
  /** comeback only: final rank */
  to?: number;
  /** bestGame only: the game the record was set in */
  gameName?: string;
}

export interface PartyAwardOptions {
  /** players that must not receive a side award — normally the overall winner */
  excludeIds?: string[];
  /** hard cap on how many awards are handed out (default 4) */
  max?: number;
}

/** Per-game ranking plus how many players took part in that game. */
export interface PartyGameRanking {
  ranks: Map<string, number>;
  size: number;
}

/** Competition ranking (1, 2, 2, 4) over a single score map. */
export function rankScores(entries: { id: string; score: number }[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const out = new Map<string, number>();
  let prevScore: number | null = null;
  let prevRank = 0;
  sorted.forEach((entry, i) => {
    const rank = prevScore !== null && entry.score === prevScore ? prevRank : i + 1;
    out.set(entry.id, rank);
    prevScore = entry.score;
    prevRank = rank;
  });
  return out;
}

/** Rank inside each single game. Players absent from a game are not ranked for it. */
export function perGameRankings(history: PartyGameResult[]): PartyGameRanking[] {
  return history.map((game) => {
    const entries = Object.entries(game.scores ?? {}).map(([id, score]) => ({
      id,
      score: typeof score === 'number' ? score : 0,
    }));
    return { ranks: rankScores(entries), size: entries.length };
  });
}

/** Rank in the CUMULATIVE standings after each game — the comeback signal. */
export function cumulativeRankSeries(
  history: PartyGameResult[],
  playerIds: string[],
): Map<string, number[]> {
  const totals = new Map<string, number>(playerIds.map((id) => [id, 0]));
  const series = new Map<string, number[]>(playerIds.map((id) => [id, []]));

  for (const game of history) {
    for (const id of playerIds) {
      const earned = game.scores?.[id];
      totals.set(id, (totals.get(id) ?? 0) + (typeof earned === 'number' ? earned : 0));
    }
    const ranks = rankScores(playerIds.map((id) => ({ id, score: totals.get(id) ?? 0 })));
    for (const id of playerIds) series.get(id)?.push(ranks.get(id) ?? playerIds.length);
  }
  return series;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function variance(values: number[]): number {
  const avg = mean(values);
  return mean(values.map((v) => (v - avg) ** 2));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Priority order — the positive titles are handed out before the booby prize. */
const PRIORITY: PartyAwardKey[] = ['comeback', 'mostWins', 'consistency', 'bestGame', 'unlucky'];

interface Candidate {
  playerId: string;
  value: number;
  /** primary sort, ascending — negate for "higher is better" metrics */
  sortKey: number;
  tieBreak: number;
  from?: number;
  to?: number;
  gameName?: string;
}

export function computePartyAwards(
  history: PartyGameResult[],
  playerIds: string[],
  options: PartyAwardOptions = {},
): PartyAward[] {
  const { excludeIds = [], max = 4 } = options;
  if (!history.length || !playerIds.length) return [];

  const excluded = new Set(excludeIds);
  const eligible = playerIds.filter((id) => !excluded.has(id));
  if (!eligible.length) return [];

  const perGame = perGameRankings(history);
  const cumulative = cumulativeRankSeries(history, playerIds);

  const pools: Record<PartyAwardKey, Candidate[]> = {
    comeback: [],
    mostWins: [],
    consistency: [],
    bestGame: [],
    unlucky: [],
  };

  for (const id of eligible) {
    // ── Comeback: worst cumulative rank vs. where they finished ──
    const series = cumulative.get(id) ?? [];
    if (series.length >= 2) {
      const worst = Math.max(...series);
      const final = series[series.length - 1];
      if (worst - final >= 1) {
        pools.comeback.push({
          playerId: id,
          value: worst - final,
          sortKey: -(worst - final),
          tieBreak: final,
          from: worst,
          to: final,
        });
      }
    }

    // ── Per-game record for the remaining awards ──
    const played: { rank: number; size: number; score: number; gameName: string }[] = [];
    history.forEach((game, i) => {
      const rank = perGame[i].ranks.get(id);
      if (rank === undefined) return;
      const score = game.scores?.[id];
      played.push({
        rank,
        size: perGame[i].size,
        score: typeof score === 'number' ? score : 0,
        gameName: game.gameName,
      });
    });
    if (!played.length) continue;

    // ── Most wins (needs at least two, so the label always reads plural) ──
    const wins = history.filter((game) => game.winnerId === id).length;
    if (wins >= 2) pools.mostWins.push({ playerId: id, value: wins, sortKey: -wins, tieBreak: 0 });

    // ── Consistency: lowest spread of per-game ranks ──
    if (played.length >= 2) {
      const ranks = played.map((p) => p.rank);
      pools.consistency.push({
        playerId: id,
        value: round1(mean(ranks)),
        sortKey: variance(ranks),
        tieBreak: mean(ranks),
      });
    }

    // ── Best single game ──
    const best = played.reduce((top, p) => (p.score > top.score ? p : top), played[0]);
    if (best.score >= 2) {
      pools.bestGame.push({
        playerId: id,
        value: best.score,
        sortKey: -best.score,
        tieBreak: 0,
        gameName: best.gameName,
      });
    }

    // ── Unlucky: last place in a game that had at least two players ──
    const lastPlaces = played.filter((p) => p.size >= 2 && p.rank === p.size).length;
    if (lastPlaces >= 1) {
      pools.unlucky.push({ playerId: id, value: lastPlaces, sortKey: -lastPlaces, tieBreak: 0 });
    }
  }

  const taken = new Set<string>();
  const awards: PartyAward[] = [];

  for (const key of PRIORITY) {
    if (awards.length >= max) break;
    const pick = pools[key]
      .sort((a, b) => a.sortKey - b.sortKey || a.tieBreak - b.tieBreak)
      .find((candidate) => !taken.has(candidate.playerId));
    if (!pick) continue;
    taken.add(pick.playerId);
    awards.push({
      key,
      playerId: pick.playerId,
      value: pick.value,
      ...(pick.from !== undefined ? { from: pick.from, to: pick.to } : {}),
      ...(pick.gameName ? { gameName: pick.gameName } : {}),
    });
  }

  return awards;
}
