import { describe, expect, it } from 'vitest';
import { storyTurn } from '../../src/games/storybuilder/reveal-rules';
import { whoamiSnapshotFor } from '../../src/games/whoami/private-state';
import { validBallot } from '../../src/games/thisorthat/vote-rules';

describe('story progress after skipped turns', () => {
  it('counts consumed turns independently of submitted sentences', () => {
    expect(storyTurn(1, 1, 1, 3, 2)).toBe(3);
    expect(storyTurn(2, 0, 1, 3, 2)).toBe(7);
    expect(storyTurn(2, 2, 2, 3, 2)).toBe(12);
  });
});

describe('identity reveal boundary', () => {
  const state = { phase: 'guessResult', activeIdx: 0, maxQ: 5, players: [
    { id: 'me', character: 'Beyonce', questionsAsked: 2, guessedCorrectly: false, eliminated: false },
    { id: 'other', character: 'Batman', questionsAsked: 4, guessedCorrectly: false, eliminated: false },
  ] };
  it('does not reveal a wrong answer while a retry is possible', () => {
    expect(whoamiSnapshotFor(state, 'me').players[0].character).toBe('');
  });
  it('reveals the final failed guess and surrendered identity', () => {
    for (const updates of [{ questionsAsked: 4 }, { eliminated: true }]) {
      const next = { ...state, players: [{ ...state.players[0], ...updates }, state.players[1]] };
      expect(whoamiSnapshotFor(next, 'me').players[0].character).toBe('Beyonce');
    }
  });
  it('reveals success but keeps another player hidden until their own turn ends', () => {
    const next = { ...state, players: [{ ...state.players[0], guessedCorrectly: true }, state.players[1]] };
    expect(whoamiSnapshotFor(next, 'me').players[0].character).toBe('Beyonce');
    expect(whoamiSnapshotFor(next, 'other').players[1].character).toBe('');
    expect(whoamiSnapshotFor({ ...state, phase: 'gameOver' }, 'other').players[1].character).toBe('Batman');
  });
});

describe('round-bound controller ballots', () => {
  const ballot = { type: 'vote', playerId: 'alice', __senderId: 'alice', choice: 'A', turn: 'match-1:2' };
  it('accepts only a roster member voting as themselves in the current turn', () => {
    expect(validBallot(ballot, 'match-1:2', ['alice'])).toBe(true);
    expect(validBallot({ ...ballot, __senderId: 'bob' }, 'match-1:2', ['alice', 'bob'])).toBe(false);
    expect(validBallot(ballot, 'match-1:2', ['bob'])).toBe(false);
    expect(validBallot({ ...ballot, choice: 'C' }, 'match-1:2', ['alice'])).toBe(false);
  });
  it('rejects delayed round and previous-rematch votes', () => {
    expect(validBallot(ballot, 'match-1:3', ['alice'])).toBe(false);
    expect(validBallot(ballot, 'match-2:2', ['alice'])).toBe(false);
    expect(validBallot({ ...ballot, turn: undefined }, 'match-1:2', ['alice'])).toBe(false);
  });
});
