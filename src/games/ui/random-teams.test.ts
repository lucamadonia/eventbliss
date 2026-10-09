import { describe, expect, it } from 'vitest';
import { randomTeamAssignments } from './random-teams';

describe('randomTeamAssignments', () => {
  it('assigns each person once and keeps two to four teams balanced', () => {
    for (const count of [2, 3, 4]) {
      for (const size of [count, count + 1, 9, 20]) {
        const ids = Array.from({ length: size }, (_, index) => `player-${index}`);
        const assignments = randomTeamAssignments(ids, count, {}, () => 0.37);
        expect(Object.keys(assignments).sort()).toEqual([...ids].sort());
        const sizes = Array.from({ length: count }, (_, team) => ids.filter((id) => assignments[id] === team).length);
        expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
        expect(Math.min(...sizes)).toBeGreaterThan(0);
      }
    }
  });

  it('changes a previous draw even if the random source repeats it', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const first = randomTeamAssignments(ids, 2, {}, () => 0);
    const second = randomTeamAssignments(ids, 2, first, () => 0);
    expect(second).not.toEqual(first);
    expect(ids.filter((id) => second[id] === 0)).toHaveLength(3);
    expect(ids.filter((id) => second[id] === 1)).toHaveLength(2);
  });
});
