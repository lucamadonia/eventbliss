import { describe, expect, it } from 'vitest';
import { guestSeats, localPlayerIdsFor, matchParticipants, resolveGuestPolicy, type GuestPolicy, type SeatMember } from './participants';

const members: SeatMember[] = [
  { player_id: 'host', name: 'Luca', is_host: true, user_id: 'u-host', controlled_by: null },
  { player_id: 'lena', name: 'Lena', user_id: 'u-lena', controlled_by: null },
  { player_id: 'max', name: '  Max  ', user_id: null, controlled_by: 'host', avatar: '🎸', color: '#ff0000' },
  { player_id: 'gerda', name: 'Oma Gerda', user_id: null, controlled_by: 'host' },
];
const policy = (value: GuestPolicy) => () => value;
const POLICIES = ['turns', 'sequential', 'secret', 'team', 'sitout'];

describe('matchParticipants', () => {
  it('lets guests sit out games that do not support shared devices', () => {
    expect(matchParticipants(members, 'bomb', true, policy('sitout'))).toEqual({ participantIds: ['host', 'lena'], sittingOut: ['max', 'gerda'] });
  });
  it.each<GuestPolicy>(['turns', 'sequential', 'secret', 'team'])('includes guests for %s games in server member order', value => {
    expect(matchParticipants(members, 'x', true, policy(value))).toEqual({ participantIds: ['host', 'lena', 'max', 'gerda'], sittingOut: [] });
  });
  it('keeps a moderating host out while its guests still play', () => {
    expect(matchParticipants(members, 'x', false, policy('turns'))).toEqual({ participantIds: ['lena', 'max', 'gerda'], sittingOut: [] });
    expect(matchParticipants(members, 'x', false, policy('sitout'))).toEqual({ participantIds: ['lena'], sittingOut: ['max', 'gerda'] });
  });
  it('never seats banned members', () => {
    const withBanned: SeatMember[] = [...members, { player_id: 'tom', user_id: 'u-tom', banned: true }, { player_id: 'ghost', controlled_by: 'host', banned: true }];
    expect(matchParticipants(withBanned, 'x', true, policy('turns')).participantIds).toEqual(['host', 'lena', 'max', 'gerda']);
    expect(matchParticipants(withBanned, 'x', true, policy('sitout')).sittingOut).toEqual(['max', 'gerda']);
  });
  it('resolves a valid policy for every game (sitout until playable-games declares one)', () => {
    expect(POLICIES).toContain(resolveGuestPolicy('bomb'));
    expect(POLICIES).toContain(resolveGuestPolicy('category'));
  });
});

describe('guest seats and local seats', () => {
  it('maps server guests to announced seats with profile defaults', () => {
    expect(guestSeats(members)).toEqual([
      { id: 'max', name: 'Max', avatar: '🎸', color: '#ff0000', controlledBy: 'host' },
      { id: 'gerda', name: 'Oma Gerda', avatar: 'O', color: expect.stringMatching(/^#[0-9a-f]{6}$/), controlledBy: 'host' },
    ]);
  });
  it('lists the own seat first, then the guests this device controls', () => {
    const players = [{ id: 'lena' }, { id: 'host' }, { id: 'max', controlledBy: 'host' }, { id: 'gerda', controlledBy: 'host' }];
    expect(localPlayerIdsFor(players, 'host')).toEqual(['host', 'max', 'gerda']);
    expect(localPlayerIdsFor(players, 'lena')).toEqual(['lena']);
    expect(localPlayerIdsFor(players, '')).toEqual([]);
  });
});
