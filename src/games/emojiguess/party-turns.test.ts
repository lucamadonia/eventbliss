import { describe, it, expect } from 'vitest';
import { emojiActiveSeat, emojiIsHolder, emojiRevealCard, emojiStartPlayers, emojiTvPlayers, emojiTvPuzzle } from './party-turns';

const seats = [{ id: 'host' }, { id: 'guest-1' }, { id: 'phone' }];
const puzzle = { emojis: '🦁👑', category: 'Film', answer: 'König der Löwen' };

describe('emojiguess party turns', () => {
  it('hands the phone to the puzzle holder for ready, playing and his own result', () => {
    for (const phase of ['ready', 'playing', 'reveal'] as const) expect(emojiActiveSeat(phase, seats, 1)).toBe('guest-1');
    expect(emojiActiveSeat('gameOver', seats, 1)).toBeNull();
    expect(emojiActiveSeat('setup', seats, 1)).toBeNull();
    expect(emojiActiveSeat('playing', seats, 9)).toBeNull();
  });

  it('lets only the holder play: own seat, the confirmed 🔁 guest, or local play', () => {
    expect(emojiIsHolder(undefined, 'anyone', null)).toBe(true);
    expect(emojiIsHolder({ myPlayerId: 'host' }, 'host', null)).toBe(true);
    expect(emojiIsHolder({ myPlayerId: 'host' }, 'guest-1', 'guest-1')).toBe(true);
    // Guest's turn before he confirmed the handover: the host must not see his controls.
    expect(emojiIsHolder({ myPlayerId: 'host' }, 'guest-1', null)).toBe(false);
    expect(emojiIsHolder({ myPlayerId: 'phone' }, 'guest-1', null)).toBe(false);
    expect(emojiIsHolder({ myPlayerId: 'host' }, undefined, null)).toBe(false);
  });

  it('keeps party colours online, the game palette locally, and fixes teams at start', () => {
    const setup = [{ id: 'a', name: 'A', color: '#ff0000', avatar: 'x' }, { id: 'b', name: 'B', color: '#00ff00', avatar: 'y' }, { id: 'c', name: 'C', color: '', avatar: 'z' }];
    const online = emojiStartPlayers(setup, ['#111111', '#222222'], true);
    expect(online.map(p => p.color)).toEqual(['#ff0000', '#00ff00', '#111111']);
    expect(online.map(p => p.team)).toEqual([0, 1, 0]);
    expect(online.every(p => p.score === 0 && p.streak === 0)).toBe(true);
    expect(emojiStartPlayers(setup, ['#111111', '#222222'], false).map(p => p.color)).toEqual(['#111111', '#222222', '#111111']);
  });

  it('never sends the answer to the TV before the reveal', () => {
    expect(emojiTvPuzzle('ready', puzzle)).toEqual({ emojis: '', category: '', answer: '' });
    expect(emojiTvPuzzle('playing', puzzle)).toEqual({ emojis: '🦁👑', category: 'Film', answer: '' });
    expect(emojiTvPuzzle('reveal', puzzle).answer).toBe('König der Löwen');
    expect(emojiTvPuzzle('gameOver', puzzle).answer).toBe('');
    expect(emojiTvPuzzle('playing', null)).toEqual({ emojis: '', category: '', answer: '' });
  });

  it('sends the full player identity to the TV', () => {
    const tv = emojiTvPlayers([{ id: 'a', name: 'Ana', avatar: '🦊', color: '#f00', score: 40, team: 1, streak: 3 } as never]);
    expect(tv).toEqual([{ id: 'a', name: 'Ana', avatar: '🦊', color: '#f00', score: 40, team: 1 }]);
  });

  it('freezes the revealed puzzle while the next one is already drawn behind the phase gate', () => {
    const holder = { id: 'guest-1' };
    const revealed = emojiRevealCard(null, 'reveal', { round: 2, holder, puzzle, points: 80 });
    expect(revealed).toEqual({ round: 2, holder, puzzle, points: 80 });
    const next = { emojis: '🍕', category: 'Essen', answer: 'Pizza' };
    const gated = emojiRevealCard(revealed, 'ready', { round: 2, holder: { id: 'phone' }, puzzle: next, points: 0 });
    expect(gated).toBe(revealed);
    expect(gated?.puzzle.answer).toBe('König der Löwen');
    expect(emojiRevealCard(gated, 'setup', { round: 1, holder: null, puzzle: null, points: 0 })).toBeNull();
    expect(emojiRevealCard(null, 'playing', { round: 1, holder, puzzle, points: 0 })).toBeNull();
  });
});
