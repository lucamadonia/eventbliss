import { describe, expect, it } from 'vitest';
import { ballotComplete, dropVoters, hideSidesWhileVoting, nextLocalVoter, speedExpiry } from './guest-ballot';

const players = ['host', 'lena', 'max', 'gerda'].map(id => ({ id }));

describe('this-or-that ballots with guests on the host phone', () => {
  it('lets the own seat vote first, then each guest in order', () => {
    const local = ['host', 'max', 'gerda'];
    expect(nextLocalVoter(local, players, {})).toBe('host');
    expect(nextLocalVoter(local, players, { host: 'A', lena: 'B' })).toBe('max');
    expect(nextLocalVoter(local, players, { host: 'A', max: 'B' })).toBe('gerda');
    expect(nextLocalVoter(local, players, { host: 'A', max: 'B', gerda: 'A' })).toBeNull();
  });
  it('skips a moderating host who is not a player', () => {
    expect(nextLocalVoter(['host', 'max'], players.filter(p => p.id !== 'host'), {})).toBe('max');
  });
  it('a phone player only ever votes for themself', () => {
    expect(nextLocalVoter(['lena'], players, {})).toBe('lena');
    expect(nextLocalVoter(['lena'], players, { lena: 'A' })).toBeNull();
  });
  it('drops removed voters and their ballots, so the round can complete without them', () => {
    const drop = dropVoters(players, { host: 'A', lena: 'B', max: 'A' }, ['gerda', 'lena'])!;
    expect(drop.players.map(p => p.id)).toEqual(['host', 'max']);
    expect(drop.votes).toEqual({ host: 'A', max: 'A' });
    expect(ballotComplete(drop.players, drop.votes)).toBe(true);
    expect(dropVoters(players, {}, ['nobody'])).toBeNull();
  });
  it('hides who chose which side only while shared-phone seats are voting', () => {
    expect(hideSidesWhileVoting('voting', [{}, { controlledBy: 'host' }])).toBe(true);
    expect(hideSidesWhileVoting('reveal', [{ controlledBy: 'host' }])).toBe(false);
    expect(hideSidesWhileVoting('voting', [{}, {}])).toBe(false);
  });
});

describe('speed mode expiry with guests queued on the host phone', () => {
  const pick = () => 'B' as const;
  it('auto-picks for everyone whose time ran out but keeps queued guests open', () => {
    // Host's own timer ran out: host + slow phone player get a pick, Max and Gerda still get their own turn.
    const result = speedExpiry(players, { lena: 'A' }, ['max', 'gerda'], pick);
    expect(result.votes).toEqual({ lena: 'A', host: 'B' });
    expect(result.done).toBe(false);
  });
  it('only the current guest is auto-picked when their own timer expires', () => {
    const result = speedExpiry(players, { host: 'A', lena: 'A' }, ['gerda'], pick);
    expect(result.votes).toEqual({ host: 'A', lena: 'A', max: 'B' });
    expect(result.done).toBe(false);
  });
  it('closes the round when nobody is queued any more', () => {
    expect(speedExpiry(players, { host: 'A', lena: 'A', max: 'B' }, [], pick)).toEqual({ votes: { host: 'A', lena: 'A', max: 'B', gerda: 'B' }, done: true });
  });
  it('never overrides a ballot already cast', () => {
    expect(speedExpiry(players, { host: 'A', lena: 'A', max: 'A', gerda: 'A' }, [], pick).votes).toEqual({ host: 'A', lena: 'A', max: 'A', gerda: 'A' });
  });
});
