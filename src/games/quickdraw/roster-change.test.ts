/**
 * SCHNELLZEICHNER mit wechselnder Runde (F13/F14/F19): Niemand darf auf einen
 * Zeichner oder Ratenden warten, der die Partie verlassen hat.
 */
import { describe, it, expect } from 'vitest';

import { removeFromQuickDraw, type QuickDrawRoster } from './roster-change';

const players = ['a', 'b', 'c', 'd'].map((id) => ({ id, score: 0 }));
const base = (over: Partial<QuickDrawRoster<{ id: string; score: number }>> = {}): QuickDrawRoster<{ id: string; score: number }> => ({
  players,
  drawerIdx: 1, // b zeichnet → Ratende a, c, d
  currentGuesser: 0,
  phase: 'guessing',
  guesses: [],
  ...over,
});

describe('removeFromQuickDraw', () => {
  it('niemand betroffen → unveraendert', () => {
    const s = base();
    expect(removeFromQuickDraw(s, ['x'])).toEqual({ state: s, changed: false, restartTurn: false });
  });

  it('Zeichner geht vor der Aufloesung → Naechster zeichnet neu (F19)', () => {
    for (const phase of ['drawerReveal', 'drawing', 'guessing']) {
      const r = removeFromQuickDraw(base({ phase, guesses: [{ playerId: 'a' }] }), ['b']);
      expect(r.restartTurn, phase).toBe(true);
      expect(r.state.phase).toBe('drawerReveal');
      expect(r.state.players[r.state.drawerIdx].id).toBe('c');
      expect(r.state.guesses).toEqual([]);
    }
  });

  it('letzter Zeichner geht → wieder vorn', () => {
    const r = removeFromQuickDraw(base({ drawerIdx: 3, phase: 'drawing' }), ['d']);
    expect(r.state.players[r.state.drawerIdx].id).toBe('a');
  });

  it('Zeichner geht nach der Aufloesung → nextRound (+1) landet beim Naechsten', () => {
    const r = removeFromQuickDraw(base({ phase: 'roundResult' }), ['b']);
    expect(r.restartTurn).toBe(false);
    expect(r.state.phase).toBe('roundResult');
    expect(r.state.players[(r.state.drawerIdx + 1) % r.state.players.length].id).toBe('c');
  });

  it('jemand vor dem Zeichner geht → Zeichner bleibt derselbe', () => {
    const r = removeFromQuickDraw(base({ phase: 'drawing' }), ['a']);
    expect(r.state.players[r.state.drawerIdx].id).toBe('b');
    expect(r.restartTurn).toBe(false);
  });

  it('aktiver Ratender geht → der Naechste ist dran, seine Raten fallen weg', () => {
    // currentGuesser 1 = c
    const r = removeFromQuickDraw(base({ currentGuesser: 1, guesses: [{ playerId: 'a' }, { playerId: 'c' }] }), ['c']);
    expect(r.state.phase).toBe('guessing');
    const guessers = r.state.players.filter((_, i) => i !== r.state.drawerIdx);
    expect(guessers[r.state.currentGuesser].id).toBe('d');
    expect(r.state.guesses).toEqual([{ playerId: 'a' }]);
  });

  it('Ratender vor dem aktiven geht → Position rutscht mit', () => {
    const r = removeFromQuickDraw(base({ currentGuesser: 2 }), ['a']); // d ist dran
    const guessers = r.state.players.filter((_, i) => i !== r.state.drawerIdx);
    expect(guessers[r.state.currentGuesser].id).toBe('d');
  });

  it('letzter offener Ratender geht → Aufloesung statt Warten', () => {
    const r = removeFromQuickDraw(base({ currentGuesser: 2 }), ['d']);
    expect(r.state.phase).toBe('roundResult');
  });

  it('alle weg / nur einer uebrig → konsistent', () => {
    const r = removeFromQuickDraw(base(), ['a', 'b', 'c', 'd']);
    expect(r.state.players).toEqual([]);
    expect(r.state.drawerIdx).toBe(0);
    const one = removeFromQuickDraw(base({ phase: 'guessing' }), ['a', 'c', 'd']);
    expect(one.state.players.map((p) => p.id)).toEqual(['b']);
    expect(one.state.phase).toBe('roundResult');
  });
});
