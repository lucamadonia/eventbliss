import { describe, it, expect } from 'vitest';
import {
  rankScores,
  perGameRankings,
  cumulativeRankSeries,
  computePartyAwards,
} from './partyAwards';
import type { PartyGameResult } from './party-types';

/** Four players, four games — c climbs, b is metronomic, a peaks early, d runs away with it. */
const EVENING: PartyGameResult[] = [
  { gameId: 'bomb', gameName: 'Bombe', winnerId: 'a', scores: { a: 10, b: 8, c: 6, d: 0 } },
  { gameId: 'quiz', gameName: 'Quiz', winnerId: 'c', scores: { a: 2, b: 2, c: 12, d: 0 } },
  { gameId: 'draw', gameName: 'Zeichnen', winnerId: 'd', scores: { a: 1, b: 1, c: 1, d: 20 } },
  { gameId: 'taboo', gameName: 'Tabu', winnerId: 'd', scores: { a: 1, b: 1, c: 1, d: 15 } },
];
const IDS = ['a', 'b', 'c', 'd'];

describe('rankScores', () => {
  it('ranks descending by score', () => {
    const ranks = rankScores([{ id: 'a', score: 3 }, { id: 'b', score: 9 }, { id: 'c', score: 5 }]);
    expect([ranks.get('b'), ranks.get('c'), ranks.get('a')]).toEqual([1, 2, 3]);
  });

  it('uses competition ranking so ties share a rank and the next rank is skipped', () => {
    const ranks = rankScores([{ id: 'a', score: 10 }, { id: 'b', score: 10 }, { id: 'c', score: 5 }]);
    expect(ranks.get('a')).toBe(1);
    expect(ranks.get('b')).toBe(1);
    expect(ranks.get('c')).toBe(3);
  });

  it('returns an empty map for no entries', () => {
    expect(rankScores([]).size).toBe(0);
  });
});

describe('perGameRankings', () => {
  it('ranks inside each single game and reports the field size', () => {
    const perGame = perGameRankings(EVENING);
    expect(perGame).toHaveLength(4);
    expect(perGame[0].size).toBe(4);
    expect(perGame[0].ranks.get('a')).toBe(1);
    expect(perGame[0].ranks.get('d')).toBe(4);
    // game 2: c runs away, a and b tie on 2 points
    expect(perGame[1].ranks.get('c')).toBe(1);
    expect(perGame[1].ranks.get('a')).toBe(2);
    expect(perGame[1].ranks.get('b')).toBe(2);
  });

  it('does not rank a player who sat a game out', () => {
    const [only] = perGameRankings([
      { gameId: 'x', gameName: 'X', winnerId: 'a', scores: { a: 5, b: 1 } },
    ]);
    expect(only.size).toBe(2);
    expect(only.ranks.has('c')).toBe(false);
  });
});

describe('cumulativeRankSeries', () => {
  it('tracks the standing after every game', () => {
    const series = cumulativeRankSeries(EVENING, IDS);
    expect(series.get('a')).toEqual([1, 2, 3, 3]);
    expect(series.get('c')).toEqual([3, 1, 2, 2]);
    expect(series.get('d')).toEqual([4, 4, 1, 1]);
  });

  it('counts a missing score as zero rather than dropping the player', () => {
    const series = cumulativeRankSeries(
      [{ gameId: 'x', gameName: 'X', winnerId: 'a', scores: { a: 5 } }],
      ['a', 'b'],
    );
    expect(series.get('b')).toEqual([2]);
  });
});

describe('computePartyAwards', () => {
  it('returns nothing without history or players', () => {
    expect(computePartyAwards([], IDS)).toEqual([]);
    expect(computePartyAwards(EVENING, [])).toEqual([]);
  });

  it('returns nothing when every player is excluded', () => {
    expect(computePartyAwards(EVENING, IDS, { excludeIds: IDS })).toEqual([]);
  });

  it('gives the comeback to the biggest climber and records where they came from', () => {
    const awards = computePartyAwards(EVENING, IDS, { excludeIds: ['d'] });
    const comeback = awards.find((a) => a.key === 'comeback');
    expect(comeback).toMatchObject({ playerId: 'c', value: 1, from: 3, to: 2 });
  });

  it('gives consistency to the flattest rank curve and the record to the best single game', () => {
    const awards = computePartyAwards(EVENING, IDS, { excludeIds: ['d'] });
    expect(awards.find((a) => a.key === 'consistency')).toMatchObject({ playerId: 'b', value: 2 });
    expect(awards.find((a) => a.key === 'bestGame')).toMatchObject({
      playerId: 'a',
      value: 10,
      gameName: 'Bombe',
    });
  });

  it('never gives a side award to an excluded player', () => {
    const awards = computePartyAwards(EVENING, IDS, { excludeIds: ['d'] });
    expect(awards.some((a) => a.playerId === 'd')).toBe(false);
  });

  it('spreads awards so no player collects two', () => {
    const dominant: PartyGameResult[] = [
      { gameId: 'g1', gameName: 'Eins', winnerId: 'x', scores: { x: 10, y: 5, z: 0 } },
      { gameId: 'g2', gameName: 'Zwei', winnerId: 'x', scores: { x: 10, y: 5, z: 0 } },
    ];
    const awards = computePartyAwards(dominant, ['x', 'y', 'z']);
    const owners = awards.map((a) => a.playerId);
    expect(new Set(owners).size).toBe(owners.length);
    expect(awards.find((a) => a.key === 'mostWins')).toMatchObject({ playerId: 'x', value: 2 });
    expect(awards.find((a) => a.key === 'consistency')).toMatchObject({ playerId: 'y' });
    // z has nothing to celebrate, so the booby prize is theirs
    expect(awards.find((a) => a.key === 'unlucky')).toMatchObject({ playerId: 'z', value: 2 });
  });

  it('only calls someone a serial winner from two wins upward', () => {
    const single: PartyGameResult[] = [
      { gameId: 'g1', gameName: 'Eins', winnerId: 'x', scores: { x: 10, y: 5 } },
    ];
    expect(computePartyAwards(single, ['x', 'y']).some((a) => a.key === 'mostWins')).toBe(false);
  });

  it('honours the max cap', () => {
    const awards = computePartyAwards(EVENING, IDS, { excludeIds: ['d'], max: 2 });
    expect(awards).toHaveLength(2);
  });

  it('survives a history entry with an empty score map', () => {
    const ragged: PartyGameResult[] = [
      { gameId: 'g1', gameName: 'Eins', winnerId: '', scores: {} },
      { gameId: 'g2', gameName: 'Zwei', winnerId: 'x', scores: { x: 4, y: 2 } },
    ];
    expect(() => computePartyAwards(ragged, ['x', 'y'])).not.toThrow();
  });
});
