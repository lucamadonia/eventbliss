import { afterEach, describe, expect, it, vi } from 'vitest';
import * as roomIdentity from './room-identity';
import { RoomSession } from './room-session';
import { createRoomIdentity, verifyRoomSignature } from './room-identity';

type Handler = { type: string; event: string; callback: (message: { event: string; payload: unknown }) => void };
type WirePacket = { event: string; payload: { body: string } };
class Network {
  channels: Channel[] = [];
  packets: WirePacket[] = [];
  client() { return { channel: (topic: string) => { const ch = new Channel(this, topic); this.channels.push(ch); return ch; }, removeChannel: async (ch: Channel) => { ch.state = 'closed'; ch.presence = null; this.sync(ch.topic); return 'ok'; } } as never; }
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
