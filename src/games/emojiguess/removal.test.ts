import { describe, it, expect } from 'vitest';
import { applyEmojiRemoval } from './removal';

const roster = (...ids: string[]) => ids.map((id, i) => ({ id, score: i * 10 }));
const state = (over: Record<string, unknown> = {}) => ({
  phase: 'playing', players: roster('a', 'b', 'c', 'd'), currentPlayerIdx: 1, currentRound: 2, totalRounds: 3, ...over,
});

describe('emojiguess removal', () => {
  it('ignores unknown ids and phases without a running turn', () => {
    expect(applyEmojiRemoval(state(), ['x'])).toBeNull();
    expect(applyEmojiRemoval(state({ phase: 'gameOver' }), ['a'])).toBeNull();
    expect(applyEmojiRemoval(state({ phase: 'setup' }), ['a'])).toBeNull();
  });

  it('keeps the current puzzle holder and all remaining scores', () => {
    const r = applyEmojiRemoval(state(), ['a'])!;
    expect(r.players.map(p => p.id)).toEqual(['b', 'c', 'd']);
    expect(r.players[r.currentPlayerIdx].id).toBe('b');
    expect(r.players.map(p => p.score)).toEqual([10, 20, 30]);
    expect(r).toMatchObject({ restartTurn: false, finished: false, currentRound: 2 });
  });

  it('hands the turn of a removed puzzle holder to the next player (F13b/F14)', () => {
    for (const phase of ['ready', 'playing', 'reveal']) {
      const r = applyEmojiRemoval(state({ phase }), ['b'])!;
      expect(r.players[r.currentPlayerIdx].id).toBe('c');
      expect(r).toMatchObject({ restartTurn: true, finished: false, currentRound: 2 });
    }
  });

  it('starts the next round when the last player of the rotation leaves on his turn', () => {
    const r = applyEmojiRemoval(state({ currentPlayerIdx: 3 }), ['d'])!;
    expect(r).toMatchObject({ currentPlayerIdx: 0, currentRound: 3, restartTurn: true, finished: false });
  });

  it('does not count a new round when the first seat leaves on his turn', () => {
    const r = applyEmojiRemoval(state({ currentPlayerIdx: 0 }), ['a'])!;
    expect(r.players[r.currentPlayerIdx].id).toBe('b');
    expect(r.currentRound).toBe(2);
  });

  it('ends the match when the final turn of the final round is removed', () => {
    const r = applyEmojiRemoval(state({ currentPlayerIdx: 3, currentRound: 3 }), ['d'])!;
    expect(r).toMatchObject({ finished: true, restartTurn: false });
  });

  it('skips several removed players at once', () => {
    const r = applyEmojiRemoval(state(), ['b', 'c'])!;
    expect(r.players[r.currentPlayerIdx].id).toBe('d');
    expect(r.currentRound).toBe(2);
  });
});
