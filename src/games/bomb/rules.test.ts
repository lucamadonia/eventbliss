import { describe, it, expect } from 'vitest';
import { speedFuseMs, publicBombState, bombRanks } from './rules';
it('retains seconds-long fuses after many speed rounds', () => {
  for (const reduction of [0,3000,6000,12000,60000]) {
    const result = speedFuseMs(5,10,reduction);
    expect(result.min).toBeGreaterThanOrEqual(5000);
    expect(result.max).toBeGreaterThanOrEqual(8000);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
  }
});

it('keeps the quiz answer key off every playing snapshot without changing the host question', () => {
  const state = { phase: 'playing', currentQuiz: { question: '2+2', answers: ['1', '2', '3', '4'], correctIndex: 3 } };
  const publicState = publicBombState(state);
  expect(publicState.currentQuiz.correctIndex).toBe(-1);
  expect(state.currentQuiz.correctIndex).toBe(3);
  expect(publicState.currentQuiz.answers).toEqual(state.currentQuiz.answers);
  expect(publicBombState({ ...state, phase: 'gameOver' }).currentQuiz.correctIndex).toBe(3);
});

describe('bombRanks', () => {
  it('numbers places plainly and shares ties', () => expect(bombRanks([0, 0, 2, 5])).toEqual([1, 1, 3, 4]));
});
