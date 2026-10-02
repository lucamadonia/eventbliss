import { describe, expect, it } from 'vitest';
import { matchGuard, partyRoomUpdate, readGuests, readIds, seatPresent, withGuests } from './party-roster';
import type { GameRoom } from './room-types';
import type { PartyRoomAccess } from './party-access';

const guests = [
  { id: 'max', name: 'Max', avatar: '🎸', color: '#ff6b98', controlledBy: 'host' },
  { id: 'gerda', name: 'Gerda', avatar: '🦄', color: '#8ff5ff', controlledBy: 'host' },
];
const room = (patch: Partial<GameRoom> = {}): GameRoom => ({ roomCode: 'ABCDEF', hostId: 'host', players: [], gameId: 'category',
  status: 'playing', sessionId: 'match-1', participantIds: ['host', 'lena', 'tom', 'max'], settings: { controllerParty: true, guests }, ...patch });
const access = (patch: Partial<PartyRoomAccess> = {}): PartyRoomAccess => ({ code: 'ABCDEF', hostId: 'host', hostPlays: true, premium: true,
  memberIds: ['host', 'lena', 'tom', 'max', 'gerda'], guests, matchId: 'match-1', matchParticipantIds: ['host', 'lena', 'tom', 'max'],
  refresh: async () => access(patch), start: async () => 'x', ...patch });

describe('party roster in the signed room', () => {
  it('sanitizes announced guests and drops malformed or duplicate seats', () => {
    expect(readGuests({ guests: [...guests, guests[0], { id: 'x' }, 'nope', { id: 'y', name: ' ', controlledBy: 'host' },
      { id: 'z', name: 'Zoe', controlledBy: 'host', color: 'red' }] }))
      .toEqual([...guests, { id: 'z', name: 'Zoe', avatar: 'Z', color: '#df8eff', controlledBy: 'host' }]);
    expect(readGuests({})).toEqual([]);
    expect(readIds({ removedPlayerIds: ['a', 3, 'b'] }, 'removedPlayerIds')).toEqual(['a', 'b']);
  });
  it('appends guests after live players as ready, non-host seats', () => {
    const live = [{ id: 'host', name: 'Luca', color: '#fff', avatar: 'L', isHost: true, isReady: true, isPremium: true }];
    const players = withGuests(live, guests);
    expect(players.map(p => p.id)).toEqual(['host', 'max', 'gerda']);
    expect(players[1]).toMatchObject({ controlledBy: 'host', isReady: true, isHost: false });
  });
  it('treats guests as connected exactly while their controlling device is', () => {
    expect(seatPresent('max', new Set(['host']), guests)).toBe(true);
    expect(seatPresent('max', new Set(['lena']), guests)).toBe(false);
    expect(seatPresent('lena', new Set(['lena']), guests)).toBe(true);
  });
});

describe('host reconciliation with server party data', () => {
  it('is a no-op when nothing changed or outside a controller party', () => {
    expect(partyRoomUpdate(room(), access())).toBeNull();
    expect(partyRoomUpdate(room({ settings: { guests } }), access({ memberIds: ['host'] }))).toBeNull();
  });
  it('mirrors added and removed guests into the room settings', () => {
    const next = partyRoomUpdate(room({ status: 'lobby' }), access({ guests: [guests[0]], memberIds: ['host', 'lena', 'tom', 'max'] }));
    expect(readGuests(next!.settings)).toEqual([guests[0]]);
  });
  it('drops participants kicked from the party or only from the match and records them', () => {
    const kicked = partyRoomUpdate(room(), access({ memberIds: ['host', 'lena', 'max', 'gerda'], matchParticipantIds: ['host', 'lena', 'max'] }));
    expect(kicked!.participantIds).toEqual(['host', 'lena', 'max']);
    expect(readIds(kicked!.settings, 'removedPlayerIds')).toEqual(['tom']);
    const matchOnly = partyRoomUpdate(kicked!, access({ matchParticipantIds: ['host', 'lena'] }));
    expect(matchOnly!.participantIds).toEqual(['host', 'lena']);
    expect(readIds(matchOnly!.settings, 'removedPlayerIds')).toEqual(['tom', 'max']);
  });
  it('ignores server match lists of another match and never shrinks a lobby', () => {
    expect(partyRoomUpdate(room(), access({ matchId: 'old-match', matchParticipantIds: ['host'] }))).toBeNull();
    expect(partyRoomUpdate(room({ status: 'lobby', participantIds: [] }), access({ memberIds: ['host', 'max', 'gerda'] }))).toBeNull();
  });
});

describe('below-minimum guard', () => {
  const base = { status: 'playing' as const, controllerParty: true, gameId: 'taboo', isHost: true };
  it('asks only the host to decide and lets everyone else wait', () => {
    expect(matchGuard({ ...base, activeCount: 4 })).toBe('ok');
    expect(matchGuard({ ...base, activeCount: 3 })).toBe('host-decide');
    expect(matchGuard({ ...base, activeCount: 3, isHost: false })).toBe('wait');
  });
  it('never accepts fewer than two players and stays out of lobbies and quick rooms', () => {
    expect(matchGuard({ ...base, gameId: 'wo-ist-was', activeCount: 1 })).toBe('host-decide');
    expect(matchGuard({ ...base, status: 'lobby', activeCount: 0 })).toBe('ok');
    expect(matchGuard({ ...base, controllerParty: false, activeCount: 0 })).toBe('ok');
  });
});
