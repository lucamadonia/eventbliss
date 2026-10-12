import { describe, expect, it } from 'vitest';
import { quickDrawTeams } from './quickdraw-teams';

describe('Schnellzeichner team standings', () => {
  it('totals members without changing their individual points or names', () => {
    const players = [
      { id: 'a', name: 'Ada', score: 2 },
      { id: 'b', name: 'Ben', score: 3 },
      { id: 'c', name: 'Cem', score: 1 },
      { id: 'd', name: 'Dana', score: 0 },
    ];
    const teams = quickDrawTeams(players, { a: 0, b: 1, c: 0, d: 1 }, ['Füchse', 'Eulen']);
    expect(teams.map(({ name, score, memberNames }) => ({ name, score, memberNames }))).toEqual([
      { name: 'Füchse', score: 3, memberNames: ['Ada', 'Cem'] },
      { name: 'Eulen', score: 3, memberNames: ['Ben', 'Dana'] },
    ]);
    expect(players.map((player) => player.score)).toEqual([2, 3, 1, 0]);
  });
});
