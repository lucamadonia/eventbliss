import { describe, it, expect } from 'vitest';
import { removeBombPlayers } from './removal';

const base = (currentPlayerIndex: number, explodedPlayerIndex = -1) => ({
  phase: 'playing',
  players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id.toUpperCase(), penalties: 0 })),
  currentPlayerIndex,
  explodedPlayerIndex,
  revision: 4,
});

describe('removeBombPlayers', () => {
  it('passes the bomb to the next remaining player when the holder is removed', () => {
    const next = removeBombPlayers(base(1), ['b']);
    expect(next.players.map(p => p.id)).toEqual(['a', 'c', 'd']);
    expect(next.players[next.currentPlayerIndex].id).toBe('c');
    expect(next.revision).toBe(5);
    expect(next.phase).toBe('playing');
  });

  it('wraps around when the last seat held the bomb', () => {
    const next = removeBombPlayers(base(3), ['d']);
    expect(next.players[next.currentPlayerIndex].id).toBe('a');
  });

  it('skips several removed seats in a row', () => {
    const next = removeBombPlayers(base(1), ['b', 'c']);
    expect(next.players[next.currentPlayerIndex].id).toBe('d');
  });

  it('keeps the same holder when a non-holder is removed', () => {
    const next = removeBombPlayers(base(2), ['a']);
    expect(next.players.map(p => p.id)).toEqual(['b', 'c', 'd']);
    expect(next.players[next.currentPlayerIndex].id).toBe('c');
  });

  it('remaps or clears the exploded player', () => {
    expect(removeBombPlayers(base(0, 3), ['b']).explodedPlayerIndex).toBe(2);
    expect(removeBombPlayers(base(0, 1), ['b']).explodedPlayerIndex).toBe(-1);
  });

  it('returns the same state for unknown ids and handles an empty roster', () => {
    const s = base(0);
    expect(removeBombPlayers(s, ['zz'])).toBe(s);
    const empty = removeBombPlayers(s, ['a', 'b', 'c', 'd']);
    expect(empty.players).toEqual([]);
    expect(empty.currentPlayerIndex).toBe(0);
  });
});
