import { describe, expect, it } from 'vitest';
import { roomAvailabilityContext, roomGameAvailability } from './room-availability';
import type { RoomPlayer } from './room-types';

const player = (id: string, patch: Partial<RoomPlayer> = {}): RoomPlayer =>
  ({ id, name: id, color: '#fff', avatar: id[0], isHost: id === 'host', isReady: true, isPremium: false, ...patch });

describe('room roster → central game availability', () => {
  it('counts phones without the host and guests by controlledBy', () => {
    const players = [player('host'), player('lena'), player('max', { controlledBy: 'host' })];
    expect(roomAvailabilityContext(players, 'host', { controllerParty: true, hostPremium: true }))
      .toEqual({ mode: 'controller-party', phonePlayers: 1, guestPlayers: 1, hostPlays: true, hostPremium: true });
    expect(roomAvailabilityContext(players, 'host', { controllerParty: true, hostPlays: false, hostPremium: false }).hostPlays).toBe(false);
  });
  it('lets a host alone plan a game but not start it', () => {
    const alone = roomGameAvailability('bomb', [player('host')], 'host', { controllerParty: false, hostPremium: false });
    expect(alone).toMatchObject({ plannable: true, startable: false, reason: 'too_few', missingPlayers: 1 });
    const two = roomGameAvailability('bomb', [player('host'), player('lena')], 'host', { controllerParty: false, hostPremium: false });
    expect(two).toMatchObject({ plannable: true, startable: true });
  });
  it('locks premium games in a room without premium', () => {
    const premium = roomGameAvailability('hochstapler', ['host', 'a', 'b', 'c'].map(id => player(id)), 'host', { controllerParty: false, hostPremium: false });
    expect(premium).toMatchObject({ plannable: false, startable: false, reason: 'premium' });
  });
});
