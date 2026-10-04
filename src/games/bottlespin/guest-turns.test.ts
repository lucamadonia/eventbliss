import { describe, expect, it } from 'vitest';
import { bottleActiveSeat, dropBottlePlayers } from './guest-turns';

const players = ['host', 'lena', 'max', 'gerda'].map(id => ({ id }));

describe('flaschendrehen turns with guests', () => {
  it('names the chosen player on the card and each other player in turn while voting', () => {
    expect(bottleActiveSeat('card', players, 2, 0)).toBe('max');
    expect(['host', 'lena', 'gerda'].map((_, i) => bottleActiveSeat('vote', players, 2, i))).toEqual(['host', 'lena', 'gerda']);
    expect(bottleActiveSeat('spinning', players, 2, 0)).toBeNull();
    expect(bottleActiveSeat('card', players, -1, 0)).toBeNull();
  });
  it('is a no-op when nobody in the circle was removed', () => {
    expect(dropBottlePlayers(players, 1, 0, ['someone-else'])).toBeNull();
  });
  it('skips the turn when the chosen player leaves', () => {
    expect(dropBottlePlayers(players, 2, 1, ['max'])).toMatchObject({ players: [{ id: 'host' }, { id: 'lena' }, { id: 'gerda' }], selectedIdx: -1, skipTurn: true });
  });
  it('keeps the chosen player and moves the vote on when the current voter leaves', () => {
    // chosen max (idx 2), voters host, lena, gerda; lena (voterIdx 1) is kicked → gerda votes next
    const drop = dropBottlePlayers(players, 2, 1, ['lena'])!;
    expect(drop.selectedIdx).toBe(1);
    expect(bottleActiveSeat('vote', drop.players, drop.selectedIdx, drop.voterIdx)).toBe('gerda');
    expect(drop.votingDone).toBe(false);
  });
  it('closes the vote when the last pending voter leaves', () => {
    expect(dropBottlePlayers(players, 2, 2, ['gerda'])).toMatchObject({ votingDone: true, skipTurn: false });
  });
  it('keeps an already voted voter out of the way when someone earlier leaves', () => {
    const drop = dropBottlePlayers(players, 2, 2, ['host'])!;
    expect(bottleActiveSeat('vote', drop.players, drop.selectedIdx, drop.voterIdx)).toBe('gerda');
  });
});
