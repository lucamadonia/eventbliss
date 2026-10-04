import { describe, expect, it } from 'vitest';
import { dropFromRoster, nextActiveId, withoutIds } from './roster-removal';

const players = ['a', 'b', 'c', 'd'].map(id => ({ id }));

describe('roster removal keeps turns on the same people', () => {
  it('is a no-op when nobody of the roster left', () => {
    expect(dropFromRoster(players, 1, ['x'])).toBeNull();
  });
  it('keeps the active player when someone else leaves', () => {
    expect(dropFromRoster(players, 2, ['a'])).toMatchObject({ players: [{ id: 'b' }, { id: 'c' }, { id: 'd' }], activeIdx: 1, activeRemoved: false });
  });
  it('hands the seat to the next remaining player when the active one leaves', () => {
    expect(dropFromRoster(players, 1, ['b'])).toMatchObject({ activeIdx: 1, activeRemoved: true }); // c
    expect(dropFromRoster(players, 3, ['d'])).toMatchObject({ activeIdx: 0, activeRemoved: true }); // wraps to a
    expect(dropFromRoster(players, 1, ['b', 'c'])!.players[dropFromRoster(players, 1, ['b', 'c'])!.activeIdx].id).toBe('d');
  });
  it('reports an empty roster', () => {
    expect(dropFromRoster(players, 0, ['a', 'b', 'c', 'd'])).toMatchObject({ players: [], activeIdx: -1 });
  });
  it('moves an id-based turn pointer on', () => {
    expect(nextActiveId(['a', 'b', 'c'], 'b', ['b'])).toBe('c');
    expect(nextActiveId(['a', 'b', 'c'], 'c', ['c', 'a'])).toBe('b');
    expect(nextActiveId(['a', 'b'], 'a', ['b'])).toBe('a');
    expect(nextActiveId(['a'], 'a', ['a'])).toBeNull();
  });
  it('drops removed answers', () => {
    expect(withoutIds({ a: 1, b: 2 }, ['b'])).toEqual({ a: 1 });
  });
});
