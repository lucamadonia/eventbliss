import { describe, expect, it } from 'vitest';
import { diffMove } from './LocalEveningRoster';

describe('diffMove (drag reorder → one move)', () => {
  it('detects moving down and up', () => {
    expect(diffMove(['a', 'b', 'c', 'd'], ['b', 'c', 'a', 'd'])).toEqual([0, 2]);
    expect(diffMove(['a', 'b', 'c', 'd'], ['c', 'a', 'b', 'd'])).toEqual([2, 0]);
    expect(diffMove(['a', 'b'], ['b', 'a'])).toEqual([0, 1]);
  });
  it('returns null when nothing moved or the lists differ', () => {
    expect(diffMove(['a', 'b'], ['a', 'b'])).toBeNull();
    expect(diffMove(['a', 'b'], ['a'])).toBeNull();
  });
});
