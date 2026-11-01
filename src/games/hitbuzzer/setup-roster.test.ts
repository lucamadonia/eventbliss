import { describe, expect, it } from 'vitest';
import { mergeEventPlayers, teamForPlayer } from './setup-roster';

describe('Hit-Buzzer setup roster', () => {
  it('imports chosen event guests, keeps typed names, and avoids duplicates', () => {
    let nextId = 0;
    const result = mergeEventPlayers([
      { id: 'custom', name: 'Mia', avatar: '🐱' },
      { id: 'placeholder', name: 'Spieler 2' },
      { id: 'empty', name: '' },
    ], [' Mia ', 'Alex', 'Alex', 'Bo'], () => `import-${++nextId}`);
    expect(result.map(player => player.name)).toEqual(['Mia', 'Alex', 'Bo']);
    expect(result[0]).toMatchObject({ id: 'custom', avatar: '🐱' });
    expect(result.map(player => player.id)).toEqual(['custom', 'import-1', 'import-2']);
  });

  it('keeps the two-player minimum and the twenty-player limit', () => {
    let nextId = 0;
    const makeId = () => `p-${++nextId}`;
    expect(mergeEventPlayers([], [], makeId)).toHaveLength(2);
    expect(mergeEventPlayers([], Array.from({ length: 23 }, (_, index) => `Guest ${index}`), makeId)).toHaveLength(20);
  });

  it('uses the same valid team assignment in setup and at match start', () => {
    expect(teamForPlayer('mia', 2, { mia: 'C' }, 3)).toBe('C');
    expect(teamForPlayer('mia', 2, { mia: 'D' }, 3)).toBe('C');
    expect(teamForPlayer('mia', 1, { mia: 'unknown' }, 2)).toBe('B');
  });
});
