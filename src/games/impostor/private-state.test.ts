import { expect, it } from 'vitest';
import { impostorSnapshotFor } from './private-state';
import { whoamiSnapshotFor } from '../whoami/private-state';

it('does not send another player role or vote before the reveal', () => {
  const snapshot = { phase: 'discussion', hideCategory: false, players: [
    { id: 'a', isImpostor: false, votedFor: 'b' }, { id: 'b', isImpostor: true, votedFor: 'a' },
  ], currentWordSet: { category: 'Nature', word: 'Oak' } };
  const citizen = impostorSnapshotFor(snapshot, 'a');
  expect(citizen.players[1].isImpostor).toBe(false);
  expect(citizen.players.every(p => p.votedFor === null)).toBe(true);
  expect(citizen.currentWordSet?.word).toBe('Oak');
  for (const phase of ['wordReveal', 'discussion', 'reveal', 'bonusGuess']) {
    expect(impostorSnapshotFor({ ...snapshot, phase }, 'b').currentWordSet?.word).toBe('');
  }
  expect(impostorSnapshotFor({ ...snapshot, phase: 'results' }, 'b').currentWordSet?.word).toBe('Oak');
  expect(snapshot.players[1].isImpostor).toBe(true);
});

it('WhoAmI never sends the recipients identity before game over', () => {
  const state = { phase: 'asking', players: [{ id: 'a', character: 'Einstein' }, { id: 'b', character: 'Cleopatra' }] };
  expect(JSON.stringify(whoamiSnapshotFor(state, 'a'))).not.toContain('Einstein');
  expect(JSON.stringify(whoamiSnapshotFor(state, 'a'))).toContain('Cleopatra');
  expect(whoamiSnapshotFor({ ...state, phase: 'gameOver' }, 'a').players[0].character).toBe('Einstein');
});
