import { describe, expect, it } from 'vitest';
import { sharedQuizSnapshotFor } from './private-state';
import { splitQuizSnapshotFor } from '../splitquiz/private-state';

describe('recipient-specific quiz information', () => {
  it('gives A only the question, B only answers and C only the hint, never correctness', () => {
    const state = { phase: 'playerC', players: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'observer' }], roleIndices: [0, 1, 2], currentQ: { question: 'Secret question', answers: ['one', 'two', 'three', 'four'], correctIndex: 2, hint: 'Secret hint', category: 'Secret category' } };
    const a = sharedQuizSnapshotFor(state, 'a').currentQ!;
    const b = sharedQuizSnapshotFor(state, 'b').currentQ!;
    const c = sharedQuizSnapshotFor(state, 'c').currentQ!;
    expect(a.question).toBe('Secret question'); expect(a.hint).toBe(''); expect(a.answers.every(v => v === '')).toBe(true);
    expect(b.question).toBe(''); expect(b.hint).toBe(''); expect(b.answers).toEqual(state.currentQ.answers);
    expect(c.question).toBe(''); expect(c.hint).toBe('Secret hint'); expect(c.answers.every(v => v === '')).toBe(true);
    for (const id of ['a', 'b', 'c', 'observer']) expect(sharedQuizSnapshotFor(state, id).currentQ!.correctIndex).toBe(-1);
    expect(sharedQuizSnapshotFor({ ...state, phase: 'reveal' }, 'c').currentQ!.correctIndex).toBe(2);
  });
  it('cannot leak team A solution or options to B before B answers the same question', () => {
    const state = { phase: 'reveal', activeTeamIdx: 0, teamA: { players: ['A'] }, teamB: { players: ['B'] }, teamAnswered: [false, false], answerSplit: [[0,1],[0,2]], selectedAnswer: 0, currentQuestion: { question: 'Tree?', answers: ['oak', 'birch', 'ash', 'elm'], correct: 0, category: 'Nature' } };
    const beforeTurn = splitQuizSnapshotFor(state, 'B');
    expect(beforeTurn.currentQuestion!.correct).toBe(-1); expect(beforeTurn.currentQuestion!.question).toBe('');
    expect(beforeTurn.currentQuestion!.answers).toEqual(['','','','']); expect(beforeTurn.selectedAnswer).toBeNull(); expect(beforeTurn.answerSplit[0]).toEqual([]);
    const duringTurn = splitQuizSnapshotFor({ ...state, activeTeamIdx: 1, phase: 'question', teamAnswered: [true, false] }, 'B');
    expect(duringTurn.currentQuestion!.correct).toBe(-1); expect(duringTurn.currentQuestion!.answers).toEqual(['oak','','ash','']);
    expect(splitQuizSnapshotFor({ ...state, activeTeamIdx: 1, teamAnswered: [true, false] }, 'B').currentQuestion!.correct).toBe(-1);
    expect(splitQuizSnapshotFor({ ...state, activeTeamIdx: 1, teamAnswered: [true, true] }, 'B').currentQuestion!.correct).toBe(0);
  });
});
