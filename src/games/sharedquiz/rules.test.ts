import { it, expect } from 'vitest';
import { sharedRoundPoints } from './rules';
import { sharedQuizSnapshotFor } from './private-state';
it('scores only complete trios, with distinct chain and all-or-nothing rules', () => {
  expect(sharedRoundPoints('chain',[1,1],1)).toBe(0);
  expect(sharedRoundPoints('chain',[1,0,1],1)).toBe(2);
  expect(sharedRoundPoints('allornothing',[1,0,1],1)).toBe(0);
  expect(sharedRoundPoints('allornothing',[1,1,1],1)).toBe(3);
});
it('conceals earlier submissions and correctness during the chain', () => {
  const result = sharedQuizSnapshotFor({phase:'playerC', mode:'chain', players:[{id:'a'}],roleIndices:[0],teamAnswers:[2],currentQ:{question:'Q',answers:['a','b','c','d'],correctIndex:2,hint:'hint',category:'test'}},'a');
  expect(result.teamAnswers).toEqual([-1]);
  expect(result.currentQ?.correctIndex).toBe(-1);
});
