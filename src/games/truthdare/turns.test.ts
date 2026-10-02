import { describe, expect, it } from 'vitest';
import { canActFor, formatClock, seatRoster, truthDareActiveSeat, turnRole, voteProgress, voterOrder } from './turns';
import { dropTruthDarePlayers } from './removal';

const players = ['host', 'lena', 'max', 'gerda'].map(id => ({ id, score: 0, truthCount: 0, dareCount: 0 }));

describe('wahrheit-pflicht turns with guests', () => {
  it('names the chosen player while choosing and acting', () => {
    expect(truthDareActiveSeat('choice', players, 2, 0)).toBe('max');
    expect(truthDareActiveSeat('reveal', players, 2, 0)).toBe('max');
  });
  it('names every other player in turn while voting', () => {
    expect([0, 1, 2].map(i => truthDareActiveSeat('vote', players, 2, i))).toEqual(['host', 'lena', 'gerda']);
    expect(truthDareActiveSeat('vote', players, 2, 3)).toBeNull();
  });
  it('gives the phone back to the host while spinning, setting up or at the end', () => {
    for (const phase of ['setup', 'spin', 'gameOver'] as const) expect(truthDareActiveSeat(phase, players, 2, 0)).toBeNull();
    expect(truthDareActiveSeat('choice', players, -1, 0)).toBeNull();
    expect(truthDareActiveSeat('choice', [], 0, 0)).toBeNull();
  });
  it('vote order skips the active player and keeps roster order', () => {
    expect(voterOrder(players, 0).map(p => p.id)).toEqual(['lena', 'max', 'gerda']);
  });
  it('a guest leg follows the seat after a kick of the current voter', () => {
    // max is up, lena (voterIdx 1) leaves → gerda is the next seat to hand the phone to
    const drop = dropTruthDarePlayers({ phase: 'vote', players, activeIdx: 2, spinTarget: 2, turnQueue: [], votes: { host: true }, voterIdx: 1, choiceType: 'dare' }, ['lena'])!;
    expect(truthDareActiveSeat('vote', drop.players, drop.activeIdx, drop.voterIdx)).toBe('gerda');
  });
});

describe('turn helpers', () => {
  it('maps phases to header roles', () => {
    expect(turnRole('choice', null)).toBe('choose');
    expect(turnRole('reveal', 'truth')).toBe('answer');
    expect(turnRole('reveal', 'dare')).toBe('dare');
    expect(turnRole('vote', 'dare')).toBe('vote');
    expect(turnRole('spin', null)).toBeNull();
  });
  it('lets the host device act for its own seat and its guests only', () => {
    expect(canActFor('max', null)).toBe(true); // local play
    expect(canActFor('max', ['host', 'max'])).toBe(true);
    expect(canActFor('lena', ['host', 'max'])).toBe(false);
    expect(canActFor(undefined, ['host'])).toBe(false);
  });
  it('keeps party colours online and the palette locally', () => {
    const mapped = [{ id: 'a', name: 'A', color: '#123456', avatar: 'A' }, { id: 'b', name: 'B', color: 'hsl(1,2%,3%)', avatar: 'B' }];
    expect(seatRoster(mapped, ['#ffffff', '#000000'], true).map(p => p.color)).toEqual(['#123456', '#000000']);
    expect(seatRoster(mapped, ['#ffffff', '#000000'], false).map(p => p.color)).toEqual(['#ffffff', '#000000']);
    expect(seatRoster(mapped, ['#fff000'], true)[0]).toEqual({ id: 'a', name: 'A', avatar: 'A', color: '#123456', score: 0, truthCount: 0, dareCount: 0 });
  });
  it('formats the dare clock', () => {
    expect([65, 9, 0, -3].map(formatClock)).toEqual(['1:05', '0:09', '0:00', '0:00']);
  });
  it('shows vote progress', () => {
    expect(voteProgress(3, 1)).toEqual(['done', 'now', 'open']);
  });
});
