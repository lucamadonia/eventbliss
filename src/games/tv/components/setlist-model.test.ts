import { describe, expect, it } from 'vitest';
import { buildSetlist, setlistFit } from './setlist-model';

const item = (gameId: string, done = false) => ({ gameId, name: gameId, done });
const RANGES: Record<string, { min: number; max: number }> = {
  bomb: { min: 2, max: 12 }, taboo: { min: 4, max: 12 }, ohrwurm: { min: 2, max: 4 }, quiz: { min: 2, max: 10 },
};
const range = (id: string) => RANGES[id] ?? null;

describe('setlistFit', () => {
  it('judges the group size against the game range', () => {
    expect(setlistFit(2, 12, 5)).toBe('ok');
    expect(setlistFit(4, 12, 3)).toBe('tooFew');
    expect(setlistFit(2, 4, 5)).toBe('tooMany');
    expect(setlistFit(0, 0, 5)).toBe('unknown');
  });
});

describe('buildSetlist', () => {
  it('marks the first open game as next and gives fit hints for the rest (pre-start)', () => {
    const s = buildSetlist([item('bomb'), item('taboo'), item('ohrwurm')], 3, range);
    expect(s.rows.map((r) => [r.gameId, r.state, r.fit])).toEqual([
      ['bomb', 'next', 'ok'], ['taboo', 'later', 'tooFew'], ['ohrwurm', 'later', 'ok'],
    ]);
    expect(s).toMatchObject({ done: 0, total: 3, hiddenLater: 0 });
  });

  it('keeps only the last played game as context and caps the list', () => {
    const playlist = ['quiz', 'bomb', 'taboo', 'ohrwurm', 'quiz', 'bomb', 'taboo', 'ohrwurm', 'quiz']
      .map((id, i) => item(id, i < 3));
    const s = buildSetlist(playlist, 5, range, 6);
    expect(s.rows[0]).toMatchObject({ position: 3, state: 'done' });
    expect(s.rows[1]).toMatchObject({ position: 4, state: 'next', fit: 'tooMany' });
    expect(s.rows).toHaveLength(6);
    expect(s.hiddenLater).toBe(1);
  });

  it('shows the tail when everything is played', () => {
    const s = buildSetlist([item('bomb', true), item('quiz', true)], 4, range);
    expect(s.rows.every((r) => r.state === 'done')).toBe(true);
    expect(s.done).toBe(2);
  });
});
