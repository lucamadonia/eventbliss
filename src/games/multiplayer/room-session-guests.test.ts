import { afterEach, describe, expect, it, vi } from 'vitest';
import { Network, session, sessions, until } from './room-test-harness';
import { readIds } from './party-roster';
import type { PartyGuestSeat, PartyRoomAccess } from './party-access';

// bomb: real-time without team support → guests sit out; category: answered one after another.
vi.mock('@/lib/playable-games', async original => ({
  ...await original<typeof import('@/lib/playable-games')>(),
  guestPolicy: (gameId: string) => gameId === 'category' ? 'sequential' : 'sitout',
}));

afterEach(() => { sessions.splice(0).forEach(room => room.leaveRoom()); vi.restoreAllMocks(); });

async function partyWithGuests() {
  const network = new Network();
  const rooms = [session(network), session(network), session(network)];
  const ids = await Promise.all(rooms.map((room, index) => room.prepareAccountIdentity(`account-${index}`)));
  const guests: PartyGuestSeat[] = [
    { id: 'guest-max', name: 'Max', avatar: '🎸', color: '#ff6b98', controlledBy: ids[0] },
    { id: 'guest-gerda', name: 'Gerda', avatar: '🦄', color: '#8ff5ff', controlledBy: ids[0] },
  ];
  const server = { memberIds: [...ids, ...guests.map(g => g.id)], guests, matchId: null as string | null, matchParticipantIds: null as string[] | null };
  const start = vi.fn(async (_gameId: string, participantIds: string[]) => {
    server.matchId = crypto.randomUUID(); server.matchParticipantIds = [...participantIds]; return server.matchId;
  });
  const access = (): PartyRoomAccess => ({ code: 'ABCDEF', hostId: ids[0], hostPlays: true, premium: true,
    memberIds: [...server.memberIds], guests: server.guests.filter(g => server.memberIds.includes(g.id)),
    matchId: server.matchId, matchParticipantIds: server.matchParticipantIds && [...server.matchParticipantIds],
    refresh: async () => access(), start });
  rooms.forEach(room => room.configureParty(access()));
  await rooms[0].createPartyRoom('ABCDEF', 'Host');
  for (let i = 1; i < rooms.length; i++) { await rooms[i].joinRoom('ABCDEF', `Player ${i}`); rooms[i].setReady(true); }
  await until(() => rooms.every(room => room.getSnapshot().players.length === 5) && rooms[0].getSnapshot().players.every(p => p.isReady));
  return { network, rooms, ids, guests, server, start, access };
}

describe('host-announced guests in a controller party room', () => {
  it('shows the same guests with controlledBy on every device', async () => {
    const { rooms, ids } = await partyWithGuests();
    const rosters = rooms.map(room => room.getSnapshot().players.map(p => `${p.id}:${p.controlledBy ?? ''}`));
    expect(rosters[1]).toEqual(rosters[0]); expect(rosters[2]).toEqual(rosters[0]);
    expect(rosters[0].slice(-2)).toEqual([`guest-max:${ids[0]}`, `guest-gerda:${ids[0]}`]);
    rooms.forEach(room => expect(room.getSnapshot().connection).toBe('connected'));
  });

  it('never sends a private snapshot to a 🔁 guest seat (no device; secrets must stay on the host phone)', async () => {
    const { network, rooms: [host] } = await partyWithGuests();
    const before = network.packets.length;
    host.broadcastTo('guest-max', 'quickdraw-state', { word: 'Giraffe' });
    await new Promise(resolve => setTimeout(resolve, 50));
    const sent = network.packets.slice(before).map(packet => JSON.parse(packet.payload.body) as { recipient?: string });
    expect(sent.some(packet => packet.recipient === 'guest-max')).toBe(false);
  });

  it('shows every phone player with the avatar and colour of their party profile (same as the lobby), never initials', async () => {
    const network = new Network();
    const rooms = [session(network), session(network)];
    const ids = await Promise.all(rooms.map((room, index) => room.prepareAccountIdentity(`look-${index}`)));
    const looks = { [ids[0]]: { avatar: '🦄', color: '#ff6b98' }, [ids[1]]: { avatar: '🎸', color: '#8ff5ff' } };
    const access = (): PartyRoomAccess => ({ code: 'ABCDEF', hostId: ids[0], hostPlays: true, premium: true, memberIds: [...ids], looks,
      refresh: async () => access(), start: async () => crypto.randomUUID() });
    rooms.forEach(room => room.configureParty(access()));
    await rooms[0].createPartyRoom('ABCDEF', 'Host');
    await rooms[1].joinRoom('ABCDEF', 'Lena');
    await until(() => rooms.every(room => room.getSnapshot().players.length === 2));
    for (const room of rooms) {
      for (const player of room.getSnapshot().players) expect({ avatar: player.avatar, color: player.color }).toEqual(looks[player.id]);
    }
  });

  it('seats guests per game policy and keeps sit-out guests out of the match', async () => {
    const { rooms, ids, start } = await partyWithGuests();
    const [host, , other] = rooms;
    await expect(host.startGame('bomb')).resolves.toBe(true);
    await until(() => other.getSnapshot().room?.status === 'playing');
    expect(start.mock.calls[0][1]).toEqual(ids);
    expect(other.getSnapshot().room!.participantIds).toEqual(ids);
    expect(readIds(other.getSnapshot().room!.settings, 'sittingOut')).toEqual(['guest-max', 'guest-gerda']);
    host.finishPartyGame(); await until(() => other.getSnapshot().room?.status === 'lobby');

    await expect(host.startGame('category')).resolves.toBe(true);
    await until(() => other.getSnapshot().room?.gameId === 'category' && other.getSnapshot().room?.status === 'playing');
    expect(other.getSnapshot().room!.participantIds).toEqual([...ids, 'guest-max', 'guest-gerda']);
    expect(other.getSnapshot().room!.players.map(p => p.id)).toEqual(expect.arrayContaining(['guest-max', 'guest-gerda']));
    // Guests have no presence of their own; the connected host covers them.
    expect(other.getSnapshot().connection).toBe('connected');
  });

  it('recovers a running match when the host transport vanished silently and the host retries (F06)', async () => {
    const { network, rooms: [host, lena], ids } = await partyWithGuests();
    await host.startGame('bomb');
    await until(() => lena.getSnapshot().room?.status === 'playing');
    // Broker drops the host channel without telling the host app: it still looks joined/connected.
    const hostChannel = network.channels.find(channel => channel.presence?.id === ids[0])!;
    network.channels.splice(network.channels.indexOf(hostChannel), 1);
    network.sync(hostChannel.topic);
    await until(() => lena.getSnapshot().connection === 'reconnecting');
    expect(host.getSnapshot().connection).toBe('connected');
    await host.createPartyRoom('ABCDEF', 'Host'); // retryControllerConnection path
    await until(() => lena.getSnapshot().connection === 'connected');
    expect(lena.getSnapshot().players.map(p => p.id)).toContain(ids[0]);
    expect(host.getSnapshot().room?.status).toBe('playing');
    const moves: Record<string, unknown>[] = [];
    host.onBroadcast('move', value => moves.push(value));
    lena.broadcast('move', { after: 'recovery' });
    await until(() => moves.length === 1);
  });

  it('continues without an unreachable player once the host drops them after the kick (F05)', async () => {
    const { network, rooms: [host, lena, tom], ids } = await partyWithGuests();
    await host.startGame('bomb');
    await until(() => lena.getSnapshot().room?.status === 'playing' && tom.getSnapshot().room?.status === 'playing');
    const tomChannel = network.channels.find(channel => channel.presence?.id === ids[2])!;
    tomChannel.state = 'closed'; network.sync(tomChannel.topic);
    await until(() => host.getSnapshot().connection === 'reconnecting');
    host.dropParticipant(ids[2]);
    expect(host.getSnapshot().connection).toBe('connected');
    await until(() => lena.getSnapshot().room?.participantIds.length === 2 && lena.getSnapshot().connection === 'connected');
    expect(readIds(lena.getSnapshot().room!.settings, 'removedPlayerIds')).toEqual([ids[2]]);
  });

  it('resumes when the server already dropped the unreachable player before the local fallback (F05 via refresh)', async () => {
    const { network, rooms: [host, lena, tom], ids, server, access } = await partyWithGuests();
    await host.startGame('bomb');
    await until(() => lena.getSnapshot().room?.status === 'playing' && tom.getSnapshot().room?.status === 'playing');
    const tomChannel = network.channels.find(channel => channel.presence?.id === ids[2])!;
    tomChannel.state = 'closed'; network.sync(tomChannel.topic);
    await until(() => host.getSnapshot().connection === 'reconnecting');
    server.matchParticipantIds = server.matchParticipantIds!.filter(id => id !== ids[2]);
    host.configureParty(access()); // kick RPC response arrives first
    host.dropParticipant(ids[2]);   // then the local fallback is a no-op
    expect(host.getSnapshot().room!.participantIds).not.toContain(ids[2]);
    expect(host.getSnapshot().connection).toBe('connected');
    await until(() => lena.getSnapshot().connection === 'connected' && lena.getSnapshot().room?.participantIds.length === 2);
  });

  it('shrinks the running match on kick and sends the kicked device out without rejoining', async () => {
    const { rooms, ids, server, access } = await partyWithGuests();
    const [host, stays, kicked] = rooms;
    await host.startGame('category');
    await until(() => stays.getSnapshot().room?.status === 'playing' && kicked.getSnapshot().room?.status === 'playing');
    // Server: Tom leaves the party, guest Gerda is taken out of this match only.
    server.memberIds = server.memberIds.filter(id => id !== ids[2]);
    server.matchParticipantIds = server.matchParticipantIds!.filter(id => id !== ids[2] && id !== 'guest-gerda');
    host.configureParty(access());
    const expected = [ids[0], ids[1], 'guest-max'];
    expect(host.getSnapshot().room!.participantIds).toEqual(expected);
    await until(() => stays.getSnapshot().room?.participantIds.length === 3);
    expect(stays.getSnapshot().room!.participantIds).toEqual(expected);
    expect(readIds(stays.getSnapshot().room!.settings, 'removedPlayerIds')).toEqual([ids[2], 'guest-gerda']);

    kicked.configureParty(access());
    expect(kicked.getSnapshot()).toMatchObject({ room: null, connection: 'disconnected', removed: true });
    await expect(kicked.joinRoom('ABCDEF', 'Player 2')).rejects.toThrow('nicht mehr in dieser Party');
    expect(kicked.getSnapshot().removed).toBe(true);
    await until(() => host.getSnapshot().players.every(p => p.id !== ids[2]));
    expect(host.getSnapshot().connection).toBe('connected');
  });
});

describe('shared same-topic channel removed by another owner (TV hook)', () => {
  it('rebuilds the room channel when it is closed from outside', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const code = await host.createRoom('bomb', false, 'Host');
    await guest.joinRoom(code, 'Guest');
    const shared = network.channels.find(channel => channel.presence?.id === guest.getSnapshot().myPlayerId)!;
    // Another owner (useTVBroadcast) removes the deduped channel instance.
    shared.state = 'closed'; shared.presence = null; network.sync(shared.topic); shared.status?.('CLOSED');
    await until(() => guest.getSnapshot().connection === 'connected' && network.channels.filter(ch => ch.topic === shared.topic && ch.state === 'joined').length === 2);
    await until(() => host.getSnapshot().players.length === 2);
  });
});
