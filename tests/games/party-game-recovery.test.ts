import { describe, expect, it } from 'vitest';
import { recoverPantomimeTurn } from '../../src/games/pantomime/recovery';
import { scoreTurn } from '../../src/games/pantomime/pantomime-extras';
import { recoverPixelRound, importPixelPlayers, validPixelAnswerAction } from '../../src/games/pixeljagd/recovery';
import { canNavigateBack, validTimelineSlot } from '../../src/games/ohrwurm/navigation';
import { sharedQuizTVQuestion } from '../../src/games/sharedquiz/private-state';
import { impostorTVPlayers } from '../../src/games/impostor/private-state';

describe('completed Pantomime turns survive an offline reload', () => {
  const turnResults = [{ word: 'Cat', result: 'correct' }, { word: 'Dog', result: 'skipped' }, { word: 'Bird', result: 'correct' }];
  it('retains unlimited skips and the unbooked completed turn including its extra multiplier', () => {
    const recovered = recoverPantomimeTurn({ phase: 'turnSummary', turnResults, skipLimit: null, extraAccepted: true });
    expect(recovered.phase).toBe('turnSummary');
    expect(recovered.skipLimit).toBeNull();
    expect(recovered.turnResults).toEqual(turnResults);
    expect(scoreTurn(recovered.turnResults.filter(result => result.result === 'correct').length, recovered.extraAccepted)).toBe(scoreTurn(2, true));
  });
  it('restarts an unfinished turn without carrying already-seen words or unearned points', () => {
    const recovered = recoverPantomimeTurn({ phase: 'playing', turnResults, skipLimit: 0, extraAccepted: true });
    expect(recovered).toEqual({ phase: 'turnStart', turnResults: [], skipLimit: 0, extraAccepted: false });
  });
  it('supports old snapshots with no completed-turn data or skip setting', () => {
    expect(recoverPantomimeTurn({ phase: 'turnSummary' })).toEqual({ phase: 'turnStart', turnResults: [], skipLimit: 3, extraAccepted: false });
  });
});

describe('Pixeljagd checkpoint and input recovery', () => {
  it('preserves the buzzer claim, frozen score, revealed solution and exact clock', () => {
    const checkpoint = { timeLeft: 7, buzzedBy: 'first', frozenPoints: 48, winnerId: null, solutionShown: true };
    expect(recoverPixelRound(checkpoint, 15)).toEqual(checkpoint);
  });
  it('preserves a completed winner and a zero clock without starting a new round', () => {
    expect(recoverPixelRound({ winnerId: 'winner', timeLeft: 0 }, 45)).toEqual({ timeLeft: 0, winnerId: 'winner', buzzedBy: null, frozenPoints: null, solutionShown: false });
  });
  it.each([15, 30, 45])('uses the selected %i-second mode for legacy checkpoints', duration => {
    expect(recoverPixelRound({}, duration).timeLeft).toBe(duration);
    expect(recoverPixelRound({ timeLeft: Infinity }, duration).timeLeft).toBe(duration);
    expect(recoverPixelRound({ timeLeft: 999 }, duration).timeLeft).toBe(duration);
  });
  it('fills a full eight-row empty roster instead of discarding the imported names', () => {
    const roster = Array.from({ length: 8 }, (_, index) => ({ id: `p${index}`, name: '' }));
    const result = importPixelPlayers(roster, ['Ada', 'Lin', 'Ada'], index => `new${index}`);
    expect(result).toHaveLength(8);
    expect(result.slice(0, 3).map(player => player.name)).toEqual(['Ada', 'Lin', 'Ada']);
    expect(result.map(player => player.id)).toEqual(roster.map(player => player.id));
    expect(roster.every(player => player.name === '')).toBe(true);
  });
  it('preserves named and read-only seats, fills placeholders, then appends within the limit', () => {
    const roster = [{ id: 'locked', name: '', readOnly: true }, { id: 'existing', name: 'Ada' }, { id: 'empty', name: '' }];
    const result = importPixelPlayers(roster, ['  Lin  ', '', 'Max', 'Sam', 'Jo', 'Eve', 'Ali', 'Overflow'], index => `new${index}`);
    expect(result).toHaveLength(8);
    expect(result[0]).toEqual(roster[0]);
    expect(result[1]).toEqual(roster[1]);
    expect(result[2]).toEqual({ id: 'empty', name: 'Lin' });
    expect(result.some(player => player.name === 'Overflow')).toBe(false);
  });
  it.each([undefined, null, 123, {}, '', '   ', 'x'.repeat(201)])('rejects malformed guesses %s', text => {
    expect(validPixelAnswerAction({ type: 'text', text }, 'text')).toBe(false);
  });
  it('rejects actions from the other answer mode', () => {
    expect(validPixelAnswerAction({ type: 'text', text: 'Cat' }, 'buzzer')).toBe(false);
    expect(validPixelAnswerAction({ type: 'buzz' }, 'text')).toBe(false);
    expect(validPixelAnswerAction({ type: 'text', text: 'Cat' }, 'text')).toBe(true);
    expect(validPixelAnswerAction({ type: 'buzz' }, 'buzzer')).toBe(true);
  });
});

describe('Ohrwurm back navigation ownership', () => {
  it.each([-1, 0.5, 4, NaN, Infinity, '1', undefined])('rejects an invalid placement slot %s', slot => {
    expect(validTimelineSlot(slot, 3)).toBe(false);
  });
  it('allows both chronological boundaries, including the only slot of an empty timeline', () => {
    expect(validTimelineSlot(0, 0)).toBe(true);
    expect(validTimelineSlot(0, 3)).toBe(true);
    expect(validTimelineSlot(3, 3)).toBe(true);
  });
  it('lets the active player revise placement and the counter player revise only their counter', () => {
    expect(canNavigateBack('place', 'draw', 'active', 'active', 'counter')).toBe(true);
    expect(canNavigateBack('counter', 'place', 'active', 'active', 'counter')).toBe(true);
    expect(canNavigateBack('counterPlace', 'counter', 'counter', 'active', 'counter')).toBe(true);
    expect(canNavigateBack('counterPlace', 'counter', 'active', 'active', 'counter')).toBe(false);
    expect(canNavigateBack('counter', 'place', 'counter', 'active', 'counter')).toBe(false);
  });
  it('rejects spectators, forged jumps and undo after scoring', () => {
    expect(canNavigateBack('place', 'draw', 'observer', 'active', null)).toBe(false);
    expect(canNavigateBack('place', 'counter', 'active', 'active', 'counter')).toBe(false);
    expect(canNavigateBack('reveal', 'place', 'active', 'active', 'counter')).toBe(false);
  });
});

describe('party TV never exposes private roles or quiz material', () => {
  const question = { question: 'Secret question', answers: ['A', 'B', 'C', 'D'], hint: 'Secret hint', correctIndex: 2, category: 'Secret category' };
  it.each(['roundIntro', 'playerA', 'handoffAB', 'playerB', 'handoffBC', 'playerC'])('hides all quiz information during %s, including one-phone games', phase => {
    expect(sharedQuizTVQuestion(phase, question)).toEqual({ question: '', answers: [], correctAnswer: -1 });
  });
  it('reveals the quiz only after the answer is final', () => {
    expect(sharedQuizTVQuestion('reveal', question)).toEqual({ question: question.question, answers: question.answers, correctAnswer: 2 });
  });
  it('hides Hochstapler roles and ballots on local TV until the reveal', () => {
    const players = [{ id: 'a', isImpostor: true, votedFor: 'b', score: 5 }, { id: 'b', isImpostor: false, votedFor: 'a', score: 2 }];
    expect(impostorTVPlayers('voting', players)).toEqual(players.map(player => ({ ...player, isImpostor: false, votedFor: null })));
    expect(impostorTVPlayers('reveal', players)).toEqual(players);
    expect(players[0].isImpostor).toBe(true);
  });
});
