import { afterEach, describe, expect, it, vi } from 'vitest';
import * as roomIdentity from './room-identity';
import { RoomSession } from './room-session';
import { createRoomIdentity, verifyRoomSignature } from './room-identity';

type Handler = { type: string; event: string; callback: (message: { event: string; payload: unknown }) => void };
type WirePacket = { event: string; payload: { body: string } };
class Network {
  channels: Channel[] = [];
  packets: WirePacket[] = [];
  removalGate?: Promise<void>;
  client() {
    const registered: Channel[] = [];
    return {
      channel: (topic: string) => {
        const existing = registered.find(channel => channel.topic === topic);
        if (existing) return existing;
        const channel = new Channel(this, topic);
        channel.unsubscribe = async () => {
          channel.state = 'leaving'; channel.presence = null; this.sync(channel.topic);
          await this.removalGate;
          channel.state = 'closed'; registered.splice(registered.indexOf(channel), 1);
          this.sync(channel.topic); return 'ok';
        };
        registered.push(channel); this.channels.push(channel); return channel;
      },
      removeChannel: async (channel: Channel) => {
        channel.state = 'leaving'; channel.presence = null; this.sync(channel.topic);
        await this.removalGate;
        channel.state = 'closed'; registered.splice(registered.indexOf(channel), 1);
        this.sync(channel.topic); return 'ok';
      },
    } as never;
  }
  sync(topic: string) { this.channels.filter(ch => ch.topic === topic && ch.state === 'joined').forEach(ch => queueMicrotask(() => ch.emit('presence', 'sync', {}))); }
}
class Channel {
  state = 'joining';
  presence: { id: string; [key: string]: unknown } | null = null;
  handlers: Handler[] = [];
  status?: (status: string) => void;
  constructor(public network: Network, public topic: string) {}
  on(type: string, filter: { event: string }, callback: Handler['callback']) { this.handlers.push({ type, event: filter.event, callback }); return this; }
  emit(type: string, event: string, payload: unknown) { this.handlers.filter(h => h.type === type && (h.event === event || h.event === '*')).forEach(h => h.callback({ event, payload })); }
  subscribe(callback: (status: string) => void) { this.status = callback; queueMicrotask(() => { this.state = 'joined'; callback('SUBSCRIBED'); }); return this; }
  async track(presence: unknown) { this.presence = JSON.parse(JSON.stringify(presence)); this.network.sync(this.topic); return 'ok'; }
  async untrack() { this.presence = null; this.network.sync(this.topic); return 'ok'; }
  async unsubscribe() { this.state = 'closed'; this.presence = null; this.network.sync(this.topic); return 'ok'; }
  presenceState() { return Object.fromEntries(this.network.channels.filter(ch => ch.topic === this.topic && ch.state === 'joined' && ch.presence).flatMap(ch => ch.presence ? [[ch.presence.id, [{ ...ch.presence, presence_ref: 'server-added-reference' }]]] : [])); }
  async send(message: { event: string; payload: unknown }) {
    this.network.packets.push(message as WirePacket);
    this.network.channels.filter(ch => ch !== this && ch.topic === this.topic && ch.state === 'joined').forEach(ch => queueMicrotask(() => ch.emit('broadcast', message.event, message.payload)));
    return 'ok';
  }
}
const sessions: RoomSession[] = [];
const delay = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(test: () => boolean) {
  for (let i = 0; i < 200; i++) { if (test()) return; await delay(); }
  throw new Error('Condition not reached');
}
function session(network: Network) { const room = new RoomSession(network.client()); sessions.push(room); return room; }
afterEach(() => { sessions.splice(0).forEach(room => room.leaveRoom()); vi.restoreAllMocks(); });

describe('online room lifecycle using signed asynchronous peer transport', () => {
  it('coalesces rapid presence changes and respects the server update rate', async () => {
    const network = new Network(), host = session(network);
    await host.createRoom('bomb', false, 'Host');
    const channel = network.channels[0], original = channel.track.bind(channel);
    const sentAt: number[] = [];
    const track = vi.spyOn(channel, 'track').mockImplementation(async claim => { sentAt.push(Date.now()); return original(claim); });
    host.setReady(false); host.setReady(true); host.setReady(false);
    await until(() => host.getSnapshot().players[0]?.isReady === false);
    expect(track).toHaveBeenCalledTimes(1);
    host.setReady(true);
    await until(() => host.getSnapshot().players[0]?.isReady === true);
    expect(track).toHaveBeenCalledTimes(2);
    expect(sentAt[1] - sentAt[0]).toBeGreaterThanOrEqual(240);
  });
  it('holds the fifth presence update until the rolling window opens and sends the latest readiness', async () => {
    const network = new Network(), host = session(network);
    await host.createRoom('bomb', false, 'Host');
    const channel = network.channels[0];
    const track = vi.spyOn(channel, 'track');
    // Initial discovery consumes one slot; these three acknowledged updates use the rest.
    for (const ready of [false, true, false]) {
      host.setReady(ready);
      await until(() => host.getSnapshot().players[0]?.isReady === ready);
    }
    expect(track).toHaveBeenCalledTimes(3);
    const now = Date.now.bind(Date);
    let elapsed = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => now() + elapsed);
    const schedule = globalThis.setTimeout.bind(globalThis);
    let resume: (() => void) | undefined;
    let budgetTimer: ReturnType<typeof setTimeout> | undefined;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback, ms, ...args) => {
      if (Number(ms) > 20_000) {
        budgetTimer = schedule(() => {}, 60_000);
        resume = () => {
          clearTimeout(budgetTimer);
          elapsed += Number(ms);
          callback(...args);
        };
        return budgetTimer;
      }
      return schedule(callback, ms, ...args);
    }) as typeof setTimeout);
    try {
      host.setReady(true);
      await until(() => !!resume);
      host.setReady(false);
      expect(track).toHaveBeenCalledTimes(3);
      expect(host.getSnapshot().players[0]?.isReady).toBe(false);
      resume!();
      await delay(); await delay();
      // The now-stale queued true must never leak when the budget releases.
      expect(track.mock.calls.slice(3).every(([claim]) => (claim as {isReady:boolean}).isReady === false)).toBe(true);
      expect(track).toHaveBeenCalledTimes(3);
      host.setReady(true);
      await until(() => track.mock.calls.length === 4);
      expect((track.mock.calls[3][0] as {isReady:boolean}).isReady).toBe(true);
    } finally {
      if (budgetTimer) clearTimeout(budgetTimer);
    }
  });

  it('waits for asynchronous same-topic removal and shares concurrent rejoin requests', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const code = await host.createRoom('bomb', false, 'Host');
    await guest.joinRoom(code, 'Guest');
    let release!: () => void;
    network.removalGate = new Promise<void>(resolve => { release = resolve; });
    guest.leaveRoom();
    const first = guest.joinRoom(code, 'Guest');
    const second = guest.joinRoom(code, 'Guest');
    await until(() => guest.getSnapshot().connection === 'connecting');
    expect(network.channels).toHaveLength(2);
    release();
    await Promise.all([first, second]);
    expect(network.channels).toHaveLength(3);
    expect(guest.getSnapshot().connection).toBe('connected');
    await until(() => host.getSnapshot().players.length === 2);
  });
  it('shares concurrent same-room joins while the identity is initializing', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const code = await host.createRoom('bomb', false, 'Host');
    const originalClaim = roomIdentity.claimTabIdentity;
    let release!: () => void;
    const initialized = new Promise<void>(resolve => { release = resolve; });
    const claim = vi.spyOn(roomIdentity, 'claimTabIdentity').mockImplementationOnce(async storage => {
      await initialized;
      return originalClaim(storage);
    });
    const first = guest.joinRoom(code, 'Guest');
    const second = guest.joinRoom(code, 'Guest');
    expect(claim).toHaveBeenCalledTimes(1);
    expect(network.channels).toHaveLength(1);
    release();
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
    expect(network.channels).toHaveLength(2);
    expect(guest.getSnapshot().connection).toBe('connected');
    expect(host.getSnapshot().players).toHaveLength(2);
  });

  it('does not create a ghost channel when leaving before identity initialization completes', async () => {
    const network = new Network(), guest = session(network);
    const originalClaim = roomIdentity.claimTabIdentity;
    let release!: () => void;
    const initialized = new Promise<void>(resolve => { release = resolve; });
    vi.spyOn(roomIdentity, 'claimTabIdentity').mockImplementationOnce(async storage => {
      await initialized;
      return originalClaim(storage);
    });
    const joining = guest.joinRoom('ABCDEF', 'Guest');
    const rejected = expect(joining).rejects.toThrow('Verbindung abgebrochen');
    guest.leaveRoom();
    release();
    await rejected;
    expect(network.channels).toHaveLength(0);
    expect(guest.getSnapshot().room).toBeNull();
    expect(guest.getSnapshot().connection).toBe('idle');
  });

  it('clears public and private cached game state when moving to a different room', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const previousCode = await host.createRoom('bomb', false, 'Host');
    await guest.joinRoom(previousCode, 'Guest');
    const previousStates: Record<string, unknown>[] = [];
    const previousRoles: Record<string, unknown>[] = [];
    const unsubscribeState = guest.onBroadcast('game-state', data => previousStates.push(data));
    const unsubscribeRole = guest.onBroadcast('role-state', data => previousRoles.push(data));
    host.broadcast('game-state', { previousRoomScore: 42 });
    host.broadcastTo(guest.getSnapshot().myPlayerId, 'role-state', { previousRoomSecret: 'old-role' });
    await until(() => previousStates.length === 1 && previousRoles.length === 1);
    unsubscribeState(); unsubscribeRole();

    const nextCode = await host.createRoom('pixeljagd', false, 'Host');
    expect(nextCode).not.toBe(previousCode);
    await guest.joinRoom(nextCode, 'Guest');
    const nextStates: Record<string, unknown>[] = [], nextRoles: Record<string, unknown>[] = [];
    guest.onBroadcast('game-state', data => nextStates.push(data));
    guest.onBroadcast('role-state', data => nextRoles.push(data));
    // The wire queue fence proves initial replay has finished; no timing guess.
    let replayFinished = false;
    guest.onBroadcast('cache-check', () => { replayFinished = true; });
    host.broadcast('cache-check', {});
    await until(() => replayFinished);
    expect(nextStates).toEqual([]);
    expect(nextRoles).toEqual([]);
    expect(guest.getSnapshot().room?.gameId).toBe('pixeljagd');
  });

  it('publishes one shared snapshot, waits for subscription and survives view unsubscribe', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const changes: string[] = [];
    const unmountLobby = host.subscribe(() => changes.push(host.getSnapshot().connection));
    const creating = host.createRoom('bomb', true, 'Host');
    expect(host.getSnapshot().connection).not.toBe('connected');
    const code = await creating;
    expect(host.getSnapshot().players).toHaveLength(1);
    unmountLobby();
    let gameUpdates = 0;
    host.subscribe(() => gameUpdates++);
    await guest.joinRoom(code, 'Guest');
    await until(() => host.getSnapshot().players.length === 2);
    expect(gameUpdates).toBeGreaterThan(0);
    expect(guest.getSnapshot().room?.hostId).toBe(host.getSnapshot().myPlayerId);
    guest.setReady(true);
    await until(() => host.getSnapshot().players.every(p => p.isReady));
    await host.startGame();
    await until(() => guest.getSnapshot().room?.status === 'playing');
    expect(guest.getSnapshot().room?.sessionId).toBe(host.getSnapshot().room?.sessionId);
    guest.leaveRoom();
    await until(() => host.getSnapshot().players.length === 1);
    expect(changes).toContain('connected');
  });

  it('replays late snapshots, encrypts private state and rejects forged packets', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const code = await host.createRoom('bomb', false, 'Host');
    await guest.joinRoom(code, 'Guest');
    host.broadcast('game-state', { phase: 'playing', players: [{ id: 'example', score: 9 }] });
    const secret = 'PRIVATE-ROLE-DO-NOT-BROADCAST';
    host.broadcastTo(guest.getSnapshot().myPlayerId, 'role-state', { word: secret });
    await delay(); await delay();
    const publicStates: Record<string, unknown>[] = [], privateStates: Record<string, unknown>[] = [];
    guest.onBroadcast('game-state', data => publicStates.push(data));
    guest.onBroadcast('role-state', data => privateStates.push(data));
    await until(() => privateStates.length === 1 && publicStates.length === 1);
    expect(privateStates[0].word).toBe(secret);
    expect(privateStates[0].__senderId).toBe(host.getSnapshot().myPlayerId);
    expect(JSON.stringify(network.packets)).not.toContain(secret);
    const packet = network.packets.find(p => p.event === 'room-wire' && JSON.parse(p.payload.body).event === 'game-state');
    if (!packet) throw new Error('Expected a signed game-state packet');
    const forged = JSON.parse(JSON.stringify(packet)) as WirePacket;
    forged.payload.body = forged.payload.body.replace('"score":9', '"score":999');
    network.channels[1].emit('broadcast', 'room-wire', forged.payload);
    network.channels[1].emit('broadcast', 'room-wire', packet.payload);
    await delay(); await delay();
    expect(publicStates).toHaveLength(1);
    expect(publicStates[0].players).toEqual([{ id: 'example', score: 9 }]);
  });

  it('enforces selected game limits and rejects late new participants', async () => {
    const network = new Network(), host = session(network), guest = session(network), late = session(network);
    const code = await host.createRoom('hochstapler', true, 'Host');
    await guest.joinRoom(code, 'Guest'); guest.setReady(true);
    await until(() => host.getSnapshot().players.every(p => p.isReady));
    await host.startGame();
    expect(host.getSnapshot().room?.status).toBe('lobby');
    host.selectGame('bomb');
    await until(() => guest.getSnapshot().room?.gameId === 'bomb');
    await host.startGame();
    await until(() => guest.getSnapshot().room?.status === 'playing');
    await expect(late.joinRoom(code, 'Too late')).rejects.toThrow();
    expect(late.getSnapshot().room).toBeNull();
  });

  it('preserves player identity and replays state after transport reconnection', async () => {
    const network = new Network(), host = session(network), guest = session(network);
    const code = await host.createRoom('bomb', true, 'Host');
    await guest.joinRoom(code, 'Guest');
    const identity = guest.getSnapshot().myPlayerId;
    guest.setReady(true);
    await until(() => host.getSnapshot().players.every(p => p.isReady));
    await host.startGame();
    await until(() => guest.getSnapshot().room?.status === 'playing');
    network.channels[1].state = 'closed'; network.channels[1].status?.('CLOSED');
    host.broadcast('game-state', { round: 7 });
    await guest.joinRoom(code, 'Guest');
    const states: Record<string, unknown>[] = [];
    guest.onBroadcast('game-state', value => states.push(value));
    await until(() => states.some(value => value.round === 7));
    expect(guest.getSnapshot().myPlayerId).toBe(identity);
    expect(guest.getSnapshot().room?.status).toBe('playing');
  });
});

describe('room cryptographic identity', () => {
  it('verifies actor signatures and only the intended peer can decrypt', async () => {
    const host = await createRoomIdentity(), guest = await createRoomIdentity(), other = await createRoomIdentity();
    const signature = await host.sign('action');
    expect(await verifyRoomSignature('action', signature, host.signingKey)).toBe(true);
    expect(await verifyRoomSignature('forged', signature, host.signingKey)).toBe(false);
    const encrypted = await host.encrypt('your role', guest.encryptionKey);
    expect(await guest.decrypt(encrypted.cipher, encrypted.iv, host.encryptionKey)).toBe('your role');
    await expect(other.decrypt(encrypted.cipher, encrypted.iv, host.encryptionKey)).rejects.toThrow();
  });
});


describe('account-verified controller parties', () => {
  async function controllers(count = 2, hostPlays = true) {
    const network = new Network();
    const rooms = Array.from({ length: count }, () => session(network));
    const ids = await Promise.all(rooms.map((room, index) => room.prepareAccountIdentity(`account-${index}`)));
    const memberIds = [...ids];
    const start = vi.fn(async (_gameId: string, _participantIds: string[]) => crypto.randomUUID());
    const access = (): import('./party-access').PartyRoomAccess => ({
      code: 'ABCDEF', hostId: ids[0], hostPlays, premium: true, memberIds: [...memberIds],
      refresh: async () => access(), start,
    });
    rooms.forEach(room => room.configureParty(access()));
    await rooms[0].createPartyRoom('ABCDEF', 'Host');
    for (let i = 1; i < rooms.length; i++) {
      await rooms[i].joinRoom('ABCDEF', `Player ${i}`); rooms[i].setReady(true);
    }
    await until(() => rooms[0].getSnapshot().players.length === count && rooms[0].getSnapshot().players.every(p => p.isReady));
    return { network, rooms, ids, memberIds, start, access };
  }

  it('rejects correctly signed presence and actions from accounts absent from verified membership', async () => {
    const { network, rooms: [host, guest], ids } = await controllers();
    const outsider = await createRoomIdentity();
    const channel = new Channel(network, 'game-room:ABCDEF');
    channel.state = 'joined'; network.channels.push(channel);
    const claim = { id: outsider.id, name: 'Impersonator', isReady: true, isPremium: true,
      signingKey: outsider.signingKey, encryptionKey: outsider.encryptionKey };
    const proof = JSON.stringify(claim);
    await channel.track({ ...claim, proof, signature: await outsider.sign(proof) });
    const actions: Record<string, unknown>[] = [];
    host.onBroadcast('move', value => actions.push(value));
    const body = JSON.stringify({ sender: outsider.id, event: 'move', sessionId: host.getSnapshot().room?.sessionId,
      sequence: Date.now() + 1000, data: { spoof: true } });
    await channel.send({ event: 'room-wire', payload: { body, signature: await outsider.sign(body) } });
    guest.broadcast('move', { legitimate: true });
    await until(() => actions.some(value => value.legitimate === true));
    expect(actions).toHaveLength(1);
    expect(host.getSnapshot().players.map(p => p.id).sort()).toEqual([...ids].sort());
  });

  it('keeps one room and stable identities through three matches with fresh sessions and caches', async () => {
    const { network, rooms: [host, guest], ids, start } = await controllers();
    const tracks = network.channels.map(channel => vi.spyOn(channel, 'track'));
    const matches = new Set<string>();
    for (const game of ['bomb', 'category', 'this-or-that']) {
      await expect(host.startGame(game)).resolves.toBe(true);
      await until(() => guest.getSnapshot().room?.gameId === game && guest.getSnapshot().room?.status === 'playing');
      const match = host.getSnapshot().room!.sessionId; matches.add(match);
      expect(guest.getSnapshot().room!.sessionId).toBe(match);
      expect(host.getSnapshot().room!.participantIds.sort()).toEqual([...ids].sort());
      const states: Record<string, unknown>[] = [];
      const unsubscribe = guest.onBroadcast('game-state', value => states.push(value));
      host.broadcast('game-state', { game });
      await until(() => states.length > 0);
      expect(states.map(value => value.game)).toEqual([game]);
      unsubscribe();
      host.finishPartyGame();
      await until(() => guest.getSnapshot().room?.status === 'lobby');
    }
    expect(matches.size).toBe(3); expect(start).toHaveBeenCalledTimes(3);
    tracks.forEach(track => expect(track).not.toHaveBeenCalled());
    expect(network.channels).toHaveLength(2);
    expect(host.getSnapshot().myPlayerId).toBe(ids[0]); expect(guest.getSnapshot().myPlayerId).toBe(ids[1]);
  });

  it('admits a late account to the waiting room without making it an active player or accepting its moves', async () => {
    const { network, rooms: [host, guest], ids, memberIds, access } = await controllers();
    await host.startGame('bomb'); await until(() => guest.getSnapshot().room?.status === 'playing');
    host.broadcast('game-state', { cached: 'current-match' });
    const late = session(network); const lateId = await late.prepareAccountIdentity('late-account');
    memberIds.push(lateId); late.configureParty(access());
    await late.joinRoom('ABCDEF','Late');
    expect(late.getSnapshot().room?.status).toBe('playing');
    expect(late.getSnapshot().room?.participantIds.sort()).toEqual([...ids].sort());
    const replay: Record<string, unknown>[] = [], actions: Record<string, unknown>[] = [];
    late.onBroadcast('game-state', value => replay.push(value)); host.onBroadcast('move', value => actions.push(value));
    late.broadcast('move', { waiting: true }); guest.broadcast('move', { active: true });
    await until(() => actions.some(value => value.active === true));
    expect(actions).toHaveLength(1); expect(replay).toEqual([]);
    late.leaveRoom(); await until(() => host.getSnapshot().players.length === 2);
    expect(host.getSnapshot().connection).toBe('connected');
  });

  it('ignores an older presence refresh that completes after a newer ready state', async () => {
    const { network, rooms: [host], ids, access } = await controllers();
    let release;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const refresh = vi.fn().mockImplementationOnce(async () => { await gate; return access(); })
      .mockImplementation(async () => access());
    host.configureParty({ ...access(), refresh });
    network.channels[0].emit('presence', 'sync', {});
    await until(() => refresh.mock.calls.length === 1);
    host.setReady(false);
    await until(() => host.getSnapshot().players.find(player => player.id === ids[0])?.isReady === false);
    release();
    await delay(); await delay();
    expect(host.getSnapshot().players.find(player => player.id === ids[0])?.isReady).toBe(false);
  });

  it('does not disconnect a new room when an old membership refresh rejects', async () => {
    const { network, rooms: [host], access } = await controllers();
    let reject!: (error: Error) => void;
    const delayed = new Promise<never>((_, fail) => { reject = fail; });
    const refresh = vi.fn().mockReturnValue(delayed);
    host.configureParty({ ...access(), refresh });
    network.channels[0].emit('presence', 'sync', {});
    await until(() => refresh.mock.calls.length > 0);
    host.leaveRoom(); host.configureParty(null);
    const code = await host.createRoom('bomb', false, 'Host');
    reject(new Error('Old membership is no longer available'));
    await delay(); await delay();
    expect(host.getSnapshot().room?.roomCode).toBe(code);
    expect(host.getSnapshot().connection).toBe('connected');
    expect(host.getSnapshot().error).toBeNull();
  });

  it('freezes active identities while presence drops and restores them on reconnect', async () => {
    const { network, rooms: [host, guest, other], ids } = await controllers(3, false);
    await host.startGame('bomb');
    await until(() => guest.getSnapshot().room?.status === 'playing' && other.getSnapshot().room?.status === 'playing');
    const roster = host.getSnapshot().room!.players;
    const participants = [...host.getSnapshot().room!.participantIds];
    const channel = network.channels[1];
    channel.state = 'closed'; network.sync(channel.topic);
    await until(() => host.getSnapshot().connection === 'reconnecting' && host.getSnapshot().players.length === 2);
    expect(host.getSnapshot().room!.players).toEqual(roster);
    expect(other.getSnapshot().room!.players).toEqual(roster);
    expect(host.getSnapshot().room!.participantIds).toEqual(participants);
    expect(guest.getSnapshot().myPlayerId).toBe(ids[1]);
    expect(host.getSnapshot().room!.participantIds).not.toContain(ids[0]);
    // Reconnecting the transport momentarily empties live presence locally.
    const connectingRosters: unknown[] = [];
    const stop = guest.subscribe(() => {
      if (guest.getSnapshot().connection === 'connecting') connectingRosters.push(guest.getSnapshot().room?.players);
    });
    await guest.joinRoom('ABCDEF', 'Player 1');
    stop();
    expect(connectingRosters.length).toBeGreaterThan(0);
    connectingRosters.forEach(players => expect(players).toEqual(roster));
    await until(() => host.getSnapshot().connection === 'connected');
    expect(guest.getSnapshot().myPlayerId).toBe(ids[1]);
    expect(guest.getSnapshot().room!.players).toEqual(roster);
    expect(guest.getSnapshot().room!.participantIds).toEqual(participants);
  });

  it('keeps a moderator authoritative while excluding them from the participant roster', async () => {
    const { rooms: [host, first, second], ids, start } = await controllers(3, false);
    await expect(host.startGame('bomb')).resolves.toBe(true);
    await until(() => first.getSnapshot().room?.status === 'playing' && second.getSnapshot().room?.status === 'playing');
    expect(host.getSnapshot().room?.hostId).toBe(ids[0]);
    expect(host.getSnapshot().room?.participantIds.sort()).toEqual(ids.slice(1).sort());
    expect(start.mock.calls[0][1].sort()).toEqual(ids.slice(1).sort());
    const states: Record<string, unknown>[] = [];
    first.onBroadcast('game-state', value => states.push(value)); host.broadcast('game-state', { fromModerator: true });
    await until(() => states.length === 1);
    expect(states[0].__senderId).toBe(ids[0]);
  });

  it('fails closed without publishing a match when server authorization fails', async () => {
    const { network, rooms: [host, guest], start } = await controllers();
    const sessionBefore = host.getSnapshot().room?.sessionId;
    start.mockRejectedValueOnce(new Error('Host premium subscription required'));
    await expect(host.startGame('story-builder')).rejects.toThrow('Host premium');
    expect(host.getSnapshot().room?.status).toBe('lobby'); expect(guest.getSnapshot().room?.status).toBe('lobby');
    expect(host.getSnapshot().room?.sessionId).toBe(sessionBefore);
    expect(network.packets.filter(packet => packet.event === 'game-start')).toHaveLength(0);
  });

  it('rejects a delayed signed action from the previous match', async () => {
    const { network, rooms: [host, guest] } = await controllers();
    await host.startGame('bomb'); await until(() => guest.getSnapshot().room?.status === 'playing');
    const guestChannel = network.channels[1]; const send = guestChannel.send.bind(guestChannel);
    let delayed: Parameters<Channel['send']>[0] | undefined;
    vi.spyOn(guestChannel, 'send').mockImplementationOnce(async packet => { delayed = packet; return 'ok'; });
    guest.broadcast('move', { stale: true }); await until(() => !!delayed);
    host.finishPartyGame(); await until(() => guest.getSnapshot().room?.status === 'lobby');
    await host.startGame('category'); await until(() => guest.getSnapshot().room?.gameId === 'category');
    const actions: Record<string, unknown>[] = []; host.onBroadcast('move', value => actions.push(value));
    await send(delayed!); guest.broadcast('move', { current: true });
    await until(() => actions.some(value => value.current === true));
    expect(actions).toHaveLength(1);
  });
});
