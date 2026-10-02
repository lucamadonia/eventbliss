// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { removeFromWordPress, type WordPressRosterState } from './removal';

const roster = (...ids: string[]) => ids.map(id => ({ id, name: id.toUpperCase(), score: id.charCodeAt(0) }));
const base = (over: Partial<WordPressRosterState<ReturnType<typeof roster>[number]>> = {}) => ({
  phase: 'playing' as const, players: roster('a', 'b', 'c', 'd'), currentPlayerIndex: 1, turnQueue: [2, 3], ...over,
});

describe('removeFromWordPress', () => {
  it('ignores ids that are not in the match roster', () => {
    const s = base();
    const r = removeFromWordPress(s, ['zz']);
    expect(r.changed).toBe(false);
    expect(r.state).toBe(s);
  });

  it('drops a waiting player from roster, scores and turn queue', () => {
    const r = removeFromWordPress(base(), ['c']);
    expect(r.state.players.map(p => p.id)).toEqual(['a', 'b', 'd']);
    expect(r.state.turnQueue).toEqual([2]);
    expect(r.state.currentPlayerIndex).toBe(1);
    expect(r.state.phase).toBe('playing');
    expect(r.turnEnded).toBe(false);
  });

  it('keeps the active player when someone before them leaves (index remapped)', () => {
    const r = removeFromWordPress(base({ currentPlayerIndex: 2, turnQueue: [3] }), ['a']);
    expect(r.state.players[r.state.currentPlayerIndex].id).toBe('c');
    expect(r.state.turnQueue.map(i => r.state.players[i].id)).toEqual(['d']);
    expect(r.turnEnded).toBe(false);
  });

  it('hands the turn to the next queued player when the active player is removed', () => {
    const r = removeFromWordPress(base(), ['b']);
    expect(r.turnEnded).toBe(true);
    expect(r.state.phase).toBe('playing');
    expect(r.state.players[r.state.currentPlayerIndex].id).toBe('c');
    expect(r.state.turnQueue.map(i => r.state.players[i].id)).toEqual(['d']);
  });

  it('skips several removed players at once, including queued ones', () => {
    const r = removeFromWordPress(base(), ['b', 'c']);
    expect(r.state.players[r.state.currentPlayerIndex].id).toBe('d');
    expect(r.state.turnQueue).toEqual([]);
  });

  it('closes the round when the removed active player was the last in it', () => {
    const r = removeFromWordPress(base({ currentPlayerIndex: 3, turnQueue: [] }), ['d']);
    expect(r.turnEnded).toBe(true);
    expect(r.state.phase).toBe('roundEnd');
    expect(r.state.turnQueue).toEqual([]);
    expect(r.state.players.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('moves on during the turn hand-over gap (roundEnd with a pending queue)', () => {
    const r = removeFromWordPress(base({ phase: 'roundEnd' }), ['b']);
    expect(r.state.phase).toBe('playing');
    expect(r.state.players[r.state.currentPlayerIndex].id).toBe('c');
  });

  it('only remaps on the standings and game-over screens', () => {
    for (const phase of ['roundEnd', 'gameOver'] as const) {
      const r = removeFromWordPress(base({ phase, currentPlayerIndex: 3, turnQueue: [] }), ['d']);
      expect(r.state.phase).toBe(phase);
      expect(r.turnEnded).toBe(false);
      expect(r.state.currentPlayerIndex).toBe(0);
      expect(r.state.players.map(p => p.id)).toEqual(['a', 'b', 'c']);
    }
  });
});
