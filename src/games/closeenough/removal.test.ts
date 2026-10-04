import { describe, expect, it } from 'vitest';
import { dropRemovedPlayers } from './removal';
import type { CeResult } from './closeenough-scoring';

const players = [
  { id: 'a', score: 5 },
  { id: 'b', score: 3 },
  { id: 'c', score: 0 },
];

const result = (playerId: string, rank: number): CeResult => ({
  playerId, value: 1, relErr: 0, rank, points: 1, bonus: false,
});

describe('dropRemovedPlayers', () => {
  it('returns null when none of the ids is in the game', () => {
    expect(dropRemovedPlayers({ players, guesses: { a: 1 }, results: null }, ['x'])).toBeNull();
  });

  it('drops the player from roster and guesses, keeping the others scores', () => {
    const out = dropRemovedPlayers({ players, guesses: { a: 1, c: 7 }, results: null }, ['c']);
    expect(out?.players).toEqual([{ id: 'a', score: 5 }, { id: 'b', score: 3 }]);
    expect(out?.guesses).toEqual({ a: 1 });
    expect(out?.allSubmitted).toBe(false);
  });

  it('reports allSubmitted when the only missing guess was the removed player', () => {
    const out = dropRemovedPlayers({ players, guesses: { a: 1, b: null }, results: null }, ['c']);
    expect(out?.allSubmitted).toBe(true);
  });

  it('never reports allSubmitted for an empty roster', () => {
    const out = dropRemovedPlayers({ players: [{ id: 'a' }], guesses: {}, results: null }, ['a']);
    expect(out?.players).toEqual([]);
    expect(out?.allSubmitted).toBe(false);
  });

  it('removes the player from a shown reveal result', () => {
    const out = dropRemovedPlayers(
      { players, guesses: { a: 1, b: 2, c: 3 }, results: [result('c', 1), result('a', 2), result('b', 3)] },
      ['c'],
    );
    expect(out?.results?.map((r) => r.playerId)).toEqual(['a', 'b']);
  });

  it('handles several removals at once', () => {
    const out = dropRemovedPlayers({ players, guesses: { a: 4 }, results: null }, ['b', 'c']);
    expect(out?.players.map((p) => p.id)).toEqual(['a']);
    expect(out?.allSubmitted).toBe(true);
  });
});
