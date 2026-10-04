import { describe, expect, it } from 'vitest';
import {
  VERBAL, categoryActiveSeat, chargeLoss, creditAnswer, isValidWordPayload, judgeWord, nextAnswerer, pickFrom,
  resumeDeadline, roundStarter, seatPlayers, secondsLeft, showsValidationFor, turnExpired,
} from './category-rules';

describe('category: word judging', () => {
  const said = [{ word: 'Berlin', playerId: 'a' }, { word: VERBAL, playerId: 'b' }];
  it('rejects a word already said this round, case and spaces ignored', () => {
    expect(judgeWord('  berlin ', said, 'classic')).toBe('duplicate');
  });
  it('accepts new words and spoken answers', () => {
    expect(judgeWord('Bern', said, 'classic')).toBe('ok');
    expect(judgeWord(VERBAL, said, 'classic')).toBe('ok');
  });
  it('letter mode demands the letter', () => {
    expect(judgeWord('Hamburg', [], 'letter', 'B')).toBe('wrong_letter');
    expect(judgeWord('bonn', [], 'letter', 'B')).toBe('ok');
  });
  it('spoken markers never block a typed word', () => {
    expect(judgeWord('__verbal__x', said, 'classic')).toBe('ok');
  });
  it('validates untrusted word payloads', () => {
    expect(isValidWordPayload('Rom')).toBe(true);
    expect(isValidWordPayload('   ')).toBe(false);
    expect(isValidWordPayload(42)).toBe(false);
    expect(isValidWordPayload('x'.repeat(201))).toBe(false);
  });
});

describe('category: turns and guests', () => {
  const players = seatPlayers([], [
    { id: 'host', name: 'Luca', avatar: '🎸', color: '#df8eff' },
    { id: 'max', name: 'Max', avatar: '🦊', color: '#4ECDC4' },
  ]);
  it('only the answerer is the active seat, and only while playing', () => {
    expect(categoryActiveSeat('playing', players, 1)).toBe('max');
    expect(categoryActiveSeat('categoryReveal', players, 1)).toBeNull();
    expect(categoryActiveSeat('roundEnd', players, 0)).toBeNull();
    expect(categoryActiveSeat('playing', players, 9)).toBeNull();
  });
  it('keeps each seat identity (guest included) for TV and scoring', () => {
    expect(players[1]).toEqual({ id: 'max', name: 'Max', score: 0, losses: 0, avatar: '🦊', color: '#4ECDC4' });
  });
  it('credits an answer to the guest seat, not to the device that typed', () => {
    const after = creditAnswer(players, 'max');
    expect(after.find(p => p.id === 'max')!.score).toBe(1);
    expect(after.find(p => p.id === 'host')!.score).toBe(0);
    expect(chargeLoss(after, 'max').find(p => p.id === 'max')!.losses).toBe(1);
  });
  it('local play gets ids, initials and colours from typed names', () => {
    const local = seatPlayers([{ name: 'anna' }, { name: 'Ben' }]);
    expect(local.map(p => [p.id, p.avatar])).toEqual([['p0', 'A'], ['p1', 'B']]);
    expect(local[0].color).not.toBe(local[1].color);
  });
  it('rotates answerer and round starter', () => {
    expect(nextAnswerer(2, 3)).toBe(0);
    expect(roundStarter(4, 3)).toBe(0);
    expect(roundStarter(2, 3)).toBe(1);
    expect(nextAnswerer(0, 0)).toBe(0);
  });
  it('shows validation on the typing device (own seat or the guest it plays)', () => {
    expect(showsValidationFor('max', 'host', ['host', 'max'], null)).toBe(true);
    expect(showsValidationFor('max', 'host', ['host'], 'max')).toBe(true);
    expect(showsValidationFor('lena', 'host', ['host', 'max'], null)).toBe(false);
  });
});

describe('category: clock during handover', () => {
  it('shifts the deadline by the time the phone was passed', () => {
    expect(resumeDeadline(10_000, 4_000, 9_000)).toBe(15_000);
    expect(resumeDeadline(10_000, null, 9_000)).toBe(10_000);
    expect(resumeDeadline(0, 4_000, 9_000)).toBe(0);
  });
  it('ignores stale expiries before the real deadline', () => {
    expect(turnExpired(20_000, 5_000)).toBe(false);
    expect(turnExpired(20_000, 19_200)).toBe(true);
    expect(turnExpired(20_000, 25_000)).toBe(true);
    expect(turnExpired(0, 1)).toBe(true);
  });
  it('rounds the remaining time up to whole seconds', () => {
    expect(secondsLeft(10_000, 8_100)).toBe(2);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
  });
});

describe('category: picking categories', () => {
  it('prefers unused ones and falls back to the full pool', () => {
    expect(pickFrom(['A', 'B'], new Set(['A']), () => 0)).toBe('B');
    expect(pickFrom(['A', 'B'], new Set(['A', 'B']), () => 0.99)).toBe('B');
  });
});
