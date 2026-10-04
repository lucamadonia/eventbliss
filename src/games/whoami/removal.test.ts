import { describe, it, expect } from 'vitest';
import { applyWhoAmIRemoval, firstOpenSeat } from './removal';

const p = (id: string, extra: Partial<{ questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean; score: number }> = {}) =>
  ({ id, score: 0, questionsAsked: 0, guessedCorrectly: false, eliminated: false, ...extra });
const state = (over: Record<string, unknown> = {}) => ({
  phase: 'asking', players: [p('a'), p('b'), p('c'), p('d')], activeIdx: 1, voterIdx: 0,
  voteResults: {} as Record<string, 'yes' | 'no' | 'maybe'>, currentQuestion: '', guessCorrect: null as boolean | null, ...over,
});

describe('whoami removal', () => {
  it('ignores ids outside the roster and phases without a live round', () => {
    expect(applyWhoAmIRemoval(state(), ['x'], 20)).toBeNull();
    expect(applyWhoAmIRemoval(state({ phase: 'gameOver' }), ['a'], 20)).toBeNull();
    expect(applyWhoAmIRemoval(state({ phase: 'setup' }), ['a'], 20)).toBeNull();
  });

  it('keeps the active guesser and the scores of everyone else', () => {
    const r = applyWhoAmIRemoval(state({ players: [p('a', { score: 4 }), p('b'), p('c', { score: 7 })] }), ['a'], 20)!;
    expect(r.players.map(x => x.id)).toEqual(['b', 'c']);
    expect(r.activeIdx).toBe(0);
    expect(r.players[1].score).toBe(7);
    expect(r.phase).toBe('asking');
    expect(r.roundOver).toBe(false);
  });

  it('skips the turn of a removed guesser to the next player still guessing (F14/F19)', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'answerVote', currentQuestion: 'Bin ich echt?', voterIdx: 1, voteResults: { a: 'yes' },
      players: [p('a'), p('b'), p('c', { guessedCorrectly: true }), p('d')] }), ['b'], 20)!;
    expect(r.players.map(x => x.id)).toEqual(['a', 'c', 'd']);
    expect(r.players[r.activeIdx].id).toBe('d');
    expect(r).toMatchObject({ phase: 'asking', voterIdx: 0, voteResults: {}, currentQuestion: '', guessCorrect: null, roundOver: false });
  });

  it('ends the round when nobody unsolved is left after the guesser leaves', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'guessResult', guessCorrect: false,
      players: [p('a', { eliminated: true }), p('b'), p('c', { guessedCorrectly: true })] }), ['b'], 20)!;
    expect(r.roundOver).toBe(true);
    expect(r.players.map(x => x.id)).toEqual(['a', 'c']);
  });

  it('closes a pending answer round when the removed voter was the last one missing', () => {
    // b asks; voters in order a, c, d. a and c answered, d (the one being waited for) leaves.
    const r = applyWhoAmIRemoval(state({ phase: 'answerVote', voterIdx: 2, currentQuestion: 'Q', voteResults: { a: 'yes', c: 'no' },
      players: [p('a'), p('b', { questionsAsked: 3 }), p('c'), p('d')] }), ['d'], 20)!;
    expect(r.phase).toBe('asking');
    expect(r.currentQuestion).toBe('');
    expect(r.players.find(x => x.id === 'b')!.questionsAsked).toBe(4);
    expect(r.voteResults).toEqual({ a: 'yes', c: 'no' });
  });

  it('moves to guessing when the closed question was the last allowed one', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'answerVote', voterIdx: 2, voteResults: { a: 'yes', c: 'no' },
      players: [p('a'), p('b', { questionsAsked: 19 }), p('c'), p('d')] }), ['d'], 20)!;
    expect(r.phase).toBe('guessing');
  });

  it('re-points the waiting voter when an earlier voter leaves', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'answerVote', voterIdx: 1, voteResults: { a: 'maybe' }, currentQuestion: 'Q' }), ['a'], 20)!;
    // b asks, remaining voters c, d; nobody of them answered yet.
    expect(r.voterIdx).toBe(0);
    expect(r.voteResults).toEqual({});
    expect(r.phase).toBe('answerVote');
    expect(r.currentQuestion).toBe('Q');
  });

  it('waits for the same voter when a voter who already answered leaves', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'answerVote', voterIdx: 2, voteResults: { a: 'yes', c: 'no' } }), ['c'], 20)!;
    // Remaining voters a, d: a answered, d is next.
    expect(r.voterIdx).toBe(1);
    expect(r.phase).toBe('answerVote');
  });

  it('keeps the distribution screen when the first guesser leaves before the start', () => {
    const r = applyWhoAmIRemoval(state({ phase: 'assign', activeIdx: 0 }), ['a'], 20)!;
    expect(r.phase).toBe('assign');
    expect(r.players[r.activeIdx].id).toBe('b');
  });

  it('finds the next open seat with wrap-around', () => {
    expect(firstOpenSeat([p('a'), p('b', { eliminated: true }), p('c', { guessedCorrectly: true })], 1)).toBe(0);
    expect(firstOpenSeat([p('a', { eliminated: true })], 0)).toBe(-1);
  });
});
