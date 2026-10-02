import { describe, expect, it } from 'vitest';
import { buildPartyRecap } from './party-recap';
import type { GameHistoryEntry } from './session-schema';
import type { PartyStanding } from '@/games/tv/party-types';

const row = (id: string, rank: number, points: number): PartyStanding =>
  ({ id, name: id.toUpperCase(), color: '#df8eff', avatar: '🦊', points, rank, prevRank: null, gamesWon: 0 } as PartyStanding);
const game = (gameId: string, scores: Record<string, number>, playedAt: number, scored = true): GameHistoryEntry =>
  ({ gameId, gameName: gameId, winnerId: '', winnerName: '', scores, points: {}, scored, playedAt });

const standings = [row('lena', 1, 10), row('tom', 2, 7), row('max', 3, 4), row('ute', 4, 1)];

describe('buildPartyRecap', () => {
  it('finds winners per game, the closest win and the podium', () => {
    const recap = buildPartyRecap(standings, [
      game('bomb', { lena: 9, tom: 3, max: 1 }, 2000),
      game('taboo', { tom: 5, lena: 4, max: 4 }, 1000),
      game('brew', { lena: 7, max: 2 }, 3000),
    ], 0);
    expect(recap.gamesPlayed).toBe(3);
    expect(recap.dateMs).toBe(1000);
    expect(recap.games.map(g => [g.gameId, g.winners.map(w => w.id), g.margin])).toEqual([
      ['bomb', ['lena'], 6], ['taboo', ['tom'], 1], ['brew', ['lena'], 5],
    ]);
    expect(recap.closestWin).toMatchObject({ gameId: 'taboo', margin: 1, winners: [{ id: 'tom' }], runnerUp: { id: 'lena' } });
    expect(recap.mostWins).toMatchObject({ id: 'lena', wins: 2 });
    expect(recap.podium.map(p => [p.id, p.rank])).toEqual([['lena', 1], ['tom', 2], ['max', 3]]);
  });

  it('shares a tied win, has no margin for it and skips pause games', () => {
    const recap = buildPartyRecap(standings, [game('bomb', { lena: 5, tom: 5 }, 10), game('headup', {}, 20, false)], 99);
    expect(recap.games[0]).toMatchObject({ winners: [{ id: 'lena' }, { id: 'tom' }], margin: null });
    expect(recap.games[1].winners).toEqual([]);
    expect(recap.closestWin).toBeNull();
    expect(recap.mostWins).toBeNull();
  });

  it('ignores seats that are not in the standings and falls back to the party date', () => {
    const recap = buildPartyRecap(standings, [game('bomb', { ghost: 99, max: 2, ute: 1 }, 0)], 4242);
    expect(recap.games[0].winners.map(w => w.id)).toEqual(['max']);
    expect(recap.dateMs).toBe(4242);
  });

  it('names no "most wins" when the top is tied', () => {
    const recap = buildPartyRecap(standings, [
      game('a', { lena: 2, tom: 1 }, 1), game('b', { tom: 2, lena: 1 }, 2), game('c', { lena: 2, tom: 1 }, 3), game('d', { tom: 2, lena: 1 }, 4),
    ], 0);
    expect(recap.mostWins).toBeNull();
  });
});
