import { describe, expect, it } from 'vitest';
import { dropPixelPlayers } from './removal';

const p = (id: string, locked = false) => ({ id, locked, score: 10 });

describe('dropPixelPlayers', () => {
  it('returns null when no removed id is in the roster', () => {
    expect(dropPixelPlayers({ phase: 'playing', players: [p('a'), p('b')], buzzedBy: null }, ['x'])).toBeNull();
  });

  it('drops removed players and their scores, keeping the rest in order', () => {
    const r = dropPixelPlayers({ phase: 'playing', players: [p('a'), p('b'), p('c')], buzzedBy: null }, ['b']);
    expect(r?.players.map(x => x.id)).toEqual(['a', 'c']);
    expect(r?.clearBuzz).toBe(false);
    expect(r?.endRound).toBe(false);
  });

  it('releases the buzz when the buzzing player is removed', () => {
    const r = dropPixelPlayers({ phase: 'playing', players: [p('a'), p('b'), p('c')], buzzedBy: 'b' }, ['b']);
    expect(r?.clearBuzz).toBe(true);
    expect(r?.endRound).toBe(false);
  });

  it('keeps another player\'s buzz', () => {
    const r = dropPixelPlayers({ phase: 'playing', players: [p('a'), p('b'), p('c')], buzzedBy: 'a' }, ['c']);
    expect(r?.clearBuzz).toBe(false);
  });

  it('ends the round when every remaining player has already answered (locked)', () => {
    const r = dropPixelPlayers({ phase: 'playing', players: [p('a', true), p('b', true), p('c')], buzzedBy: 'c' }, ['c']);
    expect(r?.clearBuzz).toBe(true);
    expect(r?.endRound).toBe(true);
  });

  it('only changes the roster outside a running round', () => {
    const r = dropPixelPlayers({ phase: 'roundEnd', players: [p('a', true), p('b')], buzzedBy: 'b' }, ['b']);
    expect(r).toEqual({ players: [p('a', true)], clearBuzz: false, endRound: false });
  });

  it('leaves an empty roster to the wrapper minimum guard', () => {
    const r = dropPixelPlayers({ phase: 'playing', players: [p('a')], buzzedBy: null }, ['a']);
    expect(r).toEqual({ players: [], clearBuzz: false, endRound: false });
  });
});
