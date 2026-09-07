import { describe, it, expect } from 'vitest';
import { publicQuizRound, settleQuizRound } from './round-state';
describe('online quiz rounds', () => {
  const state = { phase: 'statement', currentFact: { statement: 'Test', isTrue: true, explanation: 'Secret' }, currentThree: { statements: ['A', 'B', 'C'], trueIndex: 2 }, playerVote: true, playerThreeVote: 2, votes: [{playerId: 'a', correct: true, answer: true}] };
  it('does not disclose keys, explanations or another answer before everyone locks', () => {
    const snapshot = publicQuizRound(state);
    expect(snapshot.currentFact.isTrue).toBeNull();
    expect(snapshot.currentFact.explanation).toBe('');
    expect(snapshot.currentThree.trueIndex).toBe(-1);
    expect(snapshot.playerVote).toBeNull();
    expect(snapshot.votes).toEqual([{playerId: 'a'}]);
    expect(state.currentFact.isTrue).toBe(true);
  });
  it('reveals the full result only in the reveal phase', () => {
    expect(publicQuizRound({...state, phase:'reveal'}).votes[0].correct).toBe(true);
    expect(publicQuizRound({...state, phase:'reveal'}).currentThree.trueIndex).toBe(2);
  });
  it('settles each person independently, including timeout streak reset', () => {
    expect(settleQuizRound([{id:'a',score:100,streak:1},{id:'b',score:300,streak:3}], [{playerId:'a',correct:true},{playerId:'b',correct:false}])).toEqual([{id:'a',score:200,streak:2},{id:'b',score:300,streak:0}]);
  });
});
