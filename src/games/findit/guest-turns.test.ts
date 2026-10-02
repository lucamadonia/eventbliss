import { describe, expect, it } from 'vitest';
import { fillMissingGuesses, findItActiveSeat, findItTvPlayers, nextLocalGuesser, scoreGeoRound, senderMayAct } from './guest-turns';

const players = [
  { id: 'host', name: 'Luca', color: '#111111', avatar: 'L' },
  { id: 'max', name: 'Max', color: '#222222', avatar: 'M' },
  { id: 'lena', name: 'Lena', color: '#333333', avatar: 'N' },
];
const room = [
  { id: 'host', name: 'Luca', avatar: '🦊', color: '#ff0000' },
  { id: 'max', name: 'Max', avatar: '🎸', color: '#00ff00', controlledBy: 'host' },
  { id: 'lena', name: 'Lena', avatar: '🐙', color: '#0000ff' },
];

describe('findit guest guessing', () => {
  it('lets the host guess first, then each guest on the host phone', () => {
    expect(nextLocalGuesser(['host', 'max'], players, [])).toBe('host');
    expect(nextLocalGuesser(['host', 'max'], players, [{ playerId: 'host' }])).toBe('max');
    expect(nextLocalGuesser(['host', 'max'], players, [{ playerId: 'host' }, { playerId: 'max' }])).toBeNull();
    // A removed guest is skipped.
    expect(nextLocalGuesser(['host', 'gone'], players, [{ playerId: 'host' }])).toBeNull();
  });

  it('fills missing pins at the deadline but keeps queued guests open', () => {
    const blank = (p: { id: string }) => ({ playerId: p.id, km: 20000 });
    const open = fillMissingGuesses([{ playerId: 'host', km: 5 }], players, ['max'], blank);
    expect(open.guesses.map(g => g.playerId)).toEqual(['host', 'lena']);
    expect(open.complete).toBe(false);
    const done = fillMissingGuesses([{ playerId: 'host', km: 5 }], players, [], blank);
    expect(done.complete).toBe(true);
    expect(done.guesses).toHaveLength(3);
  });

  it('names the seat on turn only in turn modes and active phases', () => {
    expect(findItActiveSeat('memory', 'study', players, 1)).toBe('max');
    expect(findItActiveSeat('speed', 'answer', players, 2)).toBe('lena');
    expect(findItActiveSeat('memory', 'roundEnd', players, 1)).toBeNull();
    expect(findItActiveSeat('karte', 'question', players, 1)).toBeNull();
  });

  it('accepts actions from the seat or the device playing it', () => {
    expect(senderMayAct('lena', 'lena', room)).toBe(true);
    expect(senderMayAct('max', 'host', room)).toBe(true);
    expect(senderMayAct('max', 'lena', room)).toBe(false);
    expect(senderMayAct(null, 'host', room)).toBe(false);
    expect(senderMayAct('lena', 42, room)).toBe(false);
  });

  it('scores a geo round with a bonus for the closest real guess', () => {
    const scored = scoreGeoRound(players.map(p => ({ ...p, score: 0, correct: 0 })),
      [{ playerId: 'host', distanceKm: 0 }, { playerId: 'max', distanceKm: 20000 }]);
    expect(scored[0]).toMatchObject({ score: 1100, correct: 1 });
    expect(scored[1]).toMatchObject({ score: 0, correct: 0 });
    expect(scored[2]).toMatchObject({ score: 0 });
  });

  it('gives the TV room avatars and colours', () => {
    const tv = findItTvPlayers(players.map(p => ({ ...p, score: 3 })), room);
    expect(tv[1]).toEqual({ id: 'max', name: 'Max', score: 3, avatar: '🎸', color: '#00ff00' });
    expect(findItTvPlayers([{ ...players[0], score: 0 }])[0]).toMatchObject({ avatar: 'L', color: '#111111' });
  });
});
