import { it, expect } from 'vitest';
import { phaseAfterQuestion, identityMatches } from './question-rules';
it('allows the final guess when the question budget is exhausted', () => {
  expect(phaseAfterQuestion(3,5)).toBe('asking');
  expect(phaseAfterQuestion(4,5)).toBe('guessing');
  expect(phaseAfterQuestion(5,5)).toBe('guessing');
});
it('normalizes identities without accepting blanks or partial guesses', () => {
  expect(identityMatches('Beyonce', 'Beyoncé')).toBe(true);
  expect(identityMatches('Bey', 'Beyoncé')).toBe(false);
  expect(identityMatches('','')).toBe(false);
});
