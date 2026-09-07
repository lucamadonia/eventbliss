import { describe, expect, it } from 'vitest';
import { completeDrawingRounds, normalizeGuess, sealedGuesses } from './guess-rules';
import { advanceReveal } from '../storybuilder/reveal-rules';
import { validReaction, REACTION_TRANSPORT_GRACE_MS } from '../wordpress/reaction-window';

describe('private guessing and fair full rounds', () => {
  const submitted = [{ playerId: 'first', guess: 'Elefant', correct: true }];
  it('does not expose earlier answers or correctness to later guessers', () => {
    expect(sealedGuesses('guessing', submitted)).toEqual([]);
    expect(sealedGuesses('drawing', submitted)).toEqual([]);
    expect(sealedGuesses('roundResult', submitted)).toEqual(submitted);
    expect(submitted[0].guess).toBe('Elefant');
  });
  it('gives every drawer the same number of turns even for partial requested rounds', () => {
    expect(completeDrawingRounds(3, 4)).toBe(4);
    expect(completeDrawingRounds(8, 3)).toBe(9);
    expect(completeDrawingRounds(12, 4)).toBe(12);
  });
  it('accepts harmless articles, accents, punctuation and casing without matching different answers', () => {
    expect(normalizeGuess(' Der BÄR! ')).toBe(normalizeGuess('Bär'));
    expect(normalizeGuess('the CAT.')).toBe(normalizeGuess('Cat'));
    expect(normalizeGuess('cat')).not.toBe(normalizeGuess('car'));
  });
});
describe('story completion', () => {
  it('keeps all cards visible when queued reveal callbacks fire after Show All', () => {
    let visible = 8;
    for (let queued = 1; queued <= 8; queued++) visible = advanceReveal(visible, queued);
    expect(visible).toBe(8);
  });
});
describe('local reaction time with bounded transport tolerance', () => {
  it('accepts a fast visible reaction independently of packet arrival delay', () => {
    expect(validReaction(240, 300)).toBe(true);
    expect(REACTION_TRANSPORT_GRACE_MS).toBeLessThanOrEqual(5000);
  });
  it.each([-1, NaN, Infinity, '200', 351, undefined])('rejects invalid or late reaction %s', elapsed => {
    expect(validReaction(elapsed, 300)).toBe(false);
  });
});
