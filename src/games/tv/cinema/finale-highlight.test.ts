import { describe, expect, it } from 'vitest';
import { finaleHighlight } from './finale-highlight';
import type { PartyStanding } from '../party-types';

const row = (id: string, name: string, rank: number, points: number): PartyStanding =>
  ({ id, name, color: '#fff', rank, points, prevRank: null, gamesWon: 0, streak: 0 });
const standings = [row('a', 'Lena', 1, 42), row('b', 'Tom', 2, 31), row('c', 'Sara', 3, 27)];

describe('finaleHighlight', () => {
  it('names the tightest decided game of the night (same as the phone recap)', () => {
    const h = finaleHighlight(standings, [
      { gameId: 'quiz', gameName: 'Quiz', winnerId: 'b', scores: { a: 8, b: 12, c: 6 } },
      { gameId: 'thisorthat', gameName: 'This or That', winnerId: 'a', scores: { a: 9, b: 5, c: 2 } },
      { gameId: 'bomb', gameName: 'Bombe', winnerId: 'a', scores: { a: 12, b: 11, c: 3 } },
    ]);
    expect(h).toEqual({ kind: 'closest', names: ['Lena'], gameId: 'bomb', gameName: 'Bombe', margin: 1 });
  });

  it('shared wins give neither a closest win nor a most-wins title', () => {
    const tie = { a: 5, b: 5, c: 1 };
    const h = finaleHighlight(standings, [
      { gameId: 'quiz', gameName: 'Quiz', winnerId: 'a', scores: tie },
      { gameId: 'bomb', gameName: 'Bombe', winnerId: 'a', scores: tie },
    ]);
    expect(h.kind).toBe('phones');
  });

  it('points to the phones when the evening has nothing to highlight', () => {
    expect(finaleHighlight(standings, [])).toEqual({ kind: 'phones' });
  });

  it('skips pause games', () => {
    const h = finaleHighlight(standings, [
      { gameId: 'bottlespin', gameName: 'Flasche', winnerId: '', scores: {}, scored: false } as never,
    ]);
    expect(h).toEqual({ kind: 'phones' });
  });
});
