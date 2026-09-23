import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { playableGames } from '@/lib/playable-games';
import { claimTabIdentity, identityId, verifyRoomSignature, type RoomIdentity, type PublicRoomIdentity } from './room-identity';
import { rememberRoom, getSavedRoom, type GameRoom, type RoomSnapshot, type RoomData, type RoomListener } from './room-types';
import type { PartyRoomAccess } from './party-access';

interface Presence extends PublicRoomIdentity {
  id: string; name: string; color: string; avatar: string; isReady: boolean;
  isPremium: boolean; isCreator: boolean; joinedAt: number;
  roomInfo?: Omit<GameRoom, 'players'>;
  signature?: string;
  proof?: string;
}
interface Packet {
  sender: string; event: string; sessionId: string; sequence: number;
  recipient?: string; data?: RoomData; cipher?: string; iv?: string;
}
const COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#f9ca24', '#00b894', '#6c5ce7', '#fd79a8', '#e17055'];
const isState = (event: string) => event === 'game-state' || /-(state|results)$/.test(event);
const serverSnapshot: RoomSnapshot = { room: null, players: [], connection: 'idle', error: null, myPlayerId: '' };
const object = (value: unknown): value is RoomData => !!value && typeof value === 'object' && !Array.isArray(value);

/** Owns transport independently of mounted React components. */
export class RoomSession {
  private snapshot: RoomSnapshot = serverSnapshot;
  private subscribers = new Set<() => void>();
  private listeners = new Map<string, Set<RoomListener>>();
  private cache = new Map<string, { event: string; data: RoomData; recipient?: string }>();
  private peers = new Map<string, Presence>();
  private sequences = new Map<string, number>();
  private identity: RoomIdentity | null = null;
  private identityPromise: Promise<RoomIdentity> | null = null;
  private channel: RealtimeChannel | null = null;
  private channelCleanup: Promise<void> = Promise.resolve();
  private own: Presence | null = null;
  private pending: Promise<void> | null = null;
  private finishJoin: (() => void) | null = null;
  private failJoin: ((error: Error) => void) | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private hostGrace: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private sequence = Date.now();
  private sendQueue: Promise<unknown> = Promise.resolve();
  private receiveQueue: Promise<unknown> = Promise.resolve();
  private trackSignature = '';
  private sentTrackSignature = '';
  private trackQueue: Promise<void> = Promise.resolve();
  private lastTrackAt = 0;
  private presenceCalls: number[] = [];
  private discoveryInfo: Omit<GameRoom, 'players'> | null = null;
  private presenceRevision = 0;
  private partyAccess: PartyRoomAccess | null = null;
  private accountId: string | null = null;

  configureParty = (access: PartyRoomAccess | null): void => { this.partyAccess = access; };
  prepareAccountIdentity = async (accountId: string): Promise<string> => {
    if (this.accountId !== accountId) {
      if (this.snapshot.room) this.leaveRoom();
      this.accountId = accountId;
      this.identity = null; this.identityPromise = null;
    }
    return (await this.getIdentity()).id;
  };
  createPartyRoom = async (code: string, name: string): Promise<void> => {
    if (!this.partyAccess || this.partyAccess.code !== code) throw new Error('Party membership required');
    await this.connect(code, name, this.partyAccess.premium, 'bomb');
    this.updatePartySettings({ controllerParty: true, hostPremium: this.partyAccess.premium });
  };
  updatePartySettings = (settings: RoomData): void => {
    if (!this.isHost() || !this.snapshot.room) return;
    this.publish({ room: { ...this.snapshot.room, settings: { ...this.snapshot.room.settings, ...settings } } });
    void this.track().catch(error => this.fail(error)); this.send('room-state', this.roomInfo());
  };
  finishPartyGame = (): void => {
    if (!this.partyAccess || !this.isHost() || !this.snapshot.room) return;
    this.cache.clear();
    this.publish({ room: { ...this.snapshot.room, status: 'lobby', players: this.snapshot.players, participantIds: [], sessionId: crypto.randomUUID() } });
    void this.track().catch(error => this.fail(error)); this.send('room-state', this.roomInfo());
  };

  constructor(private client: Pick<SupabaseClient, 'channel' | 'removeChannel'>) {
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => {
        if (this.snapshot.room) this.publish({ connection: 'reconnecting', error: 'Keine Internetverbindung. Das Spiel ist pausiert.' });
      });
      window.addEventListener('online', () => {
        const room = this.snapshot.room, own = this.own;
        if (room && own) void this.joinRoom(room.roomCode, own.name, own.isPremium).catch(error => this.fail(error));
      });
    }
  }
  getSnapshot = (): RoomSnapshot => this.snapshot;
  getServerSnapshot = (): RoomSnapshot => serverSnapshot;
  subscribe = (callback: () => void): (() => void) => { this.subscribers.add(callback); return () => { this.subscribers.delete(callback); }; };
  private publish(update: Partial<RoomSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    if (this.snapshot.room) rememberRoom(this.snapshot.room, this.snapshot.myPlayerId);
    this.subscribers.forEach(callback => callback());
  }
  private async getIdentity() {
    if (!this.identityPromise) {
      let storage: Storage | undefined;
      try {
        if (this.accountId) {
          const prefix = `eventbliss_account_${this.accountId}:`;
          storage = { getItem: key => localStorage.getItem(prefix + key), setItem: (key, value) => localStorage.setItem(prefix + key, value), removeItem: key => localStorage.removeItem(prefix + key) } as Storage;
        } else storage = sessionStorage;
      } catch { /* SSR/private browsing */ }
      this.identityPromise = claimTabIdentity(storage);
    }
    this.identity = await this.identityPromise;
    return this.identity;
  }
  private isHost() { return !!this.identity && this.snapshot.room?.hostId === this.identity.id; }
  private available(room = this.snapshot.room) {
    return (typeof navigator === 'undefined' || navigator.onLine !== false) && !!room && this.channel?.state === 'joined' && this.peers.has(room.hostId)
      && (room.status === 'lobby' || room.participantIds.every(id => this.peers.has(id)));
  }
  private roomInfo() { const { players: _players, ...info } = this.snapshot.room!; return info; }
  private async track() {
    if (!this.own || !this.channel || this.channel.state !== 'joined') return;
    const channel = this.channel, generation = this.generation;
    // Presence only advertises identity and initial host discovery. Current game
    // metadata travels in signed room-state packets (also requested on join).
    if (this.isHost() && this.discoveryInfo?.hostId !== this.identity?.id) this.discoveryInfo = this.roomInfo();
    const presence = { ...this.own, ...(this.isHost() ? { roomInfo: this.discoveryInfo! } : {}) };
    const signature = JSON.stringify(presence);
    if (signature === this.trackSignature) return;
    this.trackSignature = signature;
    const identity = this.identity!;
    const task = this.trackQueue.catch(() => {}).then(async () => {
      const current = () => generation === this.generation && signature === this.trackSignature;
      if (!current() || signature === this.sentTrackSignature) return;
      // Presence has a separate server rate limit. Collapse intermediate changes
      // and serialize updates; gameplay broadcasts remain immediate.
      const now = Date.now();
      this.presenceCalls = this.presenceCalls.filter(at => now - at < 30_100);
      // Realtime defaults to five presence calls per socket per 30 seconds.
      // Keep one slot spare and preserve the budget across channel reconnects.
      const wait = Math.max(0, this.lastTrackAt + 250 - now,
        this.presenceCalls.length >= 4 ? this.presenceCalls[0] + 30_100 - now : 0);
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      if (!current()) return;
      const proofSignature = await identity.sign(signature);
      if (!current()) return;
      this.lastTrackAt = Date.now();
      this.presenceCalls.push(this.lastTrackAt);
      const result = await channel.track({ ...presence, proof: signature, signature: proofSignature });
      if (current() && result === 'ok') this.sentTrackSignature = signature;
      if (current() && result !== 'ok') throw new Error('Verbindung zum Raum fehlgeschlagen.');
    });
    this.trackQueue = task;
    try { await task; }
    catch (error) {
      if (generation !== this.generation || signature !== this.trackSignature) return;
      this.trackSignature = '';
      throw error;
    }
  }
  private async syncPresence(channel: RealtimeChannel, generation: number) {
    const revision = ++this.presenceRevision;
    const raw = Object.values(channel.presenceState<Presence>()).flat();
    const access = this.partyAccess ? await this.partyAccess.refresh() : null;
    if (generation !== this.generation || revision !== this.presenceRevision) return;
    this.partyAccess = access;
    const valid = await Promise.all(raw.map(async p => {
      try {
        // Presence adds server fields and may reorder keys. Authenticate the
        // original serialized claim and use only its verified fields.
        if (typeof p.proof !== 'string' || p.proof.length > 20000 || typeof p.signature !== 'string') return null;
        const body = JSON.parse(p.proof) as Presence;
        return body.id && (!access || access.memberIds.includes(body.id)) && typeof body.name === 'string' && body.signingKey && body.encryptionKey
          && await identityId(body.signingKey) === body.id && await verifyRoomSignature(p.proof, p.signature, body.signingKey) ? body : null;
      } catch { return null; }
    }));
    if (generation !== this.generation || revision !== this.presenceRevision || !this.snapshot.room) return;
    this.peers = new Map(valid.filter((p): p is Presence => !!p).map(p => [p.id, p]));
    const sorted = [...this.peers.values()].sort((a, b) => a.id.localeCompare(b.id));
    let room = this.snapshot.room;
    if (this.partyAccess && room.hostId !== this.partyAccess.hostId) room = { ...room, hostId: this.partyAccess.hostId };
    if (!room.hostId) {
      const host = sorted.find(p => p.isCreator && p.roomInfo?.hostId === p.id) ?? sorted.find(p => p.roomInfo?.hostId === p.id);
      if (host?.roomInfo) room = { ...host.roomInfo, roomCode: room.roomCode, players: [] };
    }
    const players = sorted.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, isHost: p.id === room.hostId, isReady: !!p.isReady, isPremium: !!p.isPremium }));
    // Presence describes connectivity, not the participants of a running match.
    // Keep verified player metadata while a peer reconnects so turn/team indices
    // cannot shift. Late members remain visible only in the connected lobby list.
    const matchPlayers = room.settings.controllerParty && room.status === 'playing'
      ? [...new Map([...room.players, ...players.filter(p => !room.players.some(known => known.id === p.id))]
          .filter(p => p.id === room.hostId || room.participantIds.includes(p.id)).map(p => [p.id, p])).values()]
      : players;
    this.publish({ room: { ...room, players: matchPlayers }, players,
      ...(!this.pending && room.hostId ? { connection: this.available(room) ? 'connected' : 'reconnecting', error: this.available(room) ? null : 'Das Spiel wartet, bis alle Teilnehmer wieder verbunden sind.' } as const : {}) });
    if (this.peers.has(room.hostId)) {
      if (this.hostGrace) clearTimeout(this.hostGrace);
      this.hostGrace = null;
      if (this.snapshot.connection === 'reconnecting' && this.available()) this.publish({ connection: 'connected', error: null });
      if (this.isHost()) { this.finishJoin?.(); void this.track().catch(error => this.fail(error)); }
      else if (this.finishJoin) this.send('room-request', {});
    } else if (room.hostId && !this.hostGrace) {
      this.hostGrace = setTimeout(() => {
        this.hostGrace = null;
        if (generation !== this.generation || !this.snapshot.room || this.peers.has(room.hostId)) return;
        if (!this.partyAccess && this.snapshot.room.status === 'lobby' && sorted.length) {
          // No hidden game state exists in the lobby; deterministic election is safe.
          const hostId = [...this.peers.keys()].sort()[0];
          const players = this.snapshot.players.map(p => ({ ...p, isHost: p.id === hostId }));
          this.publish({ players, room: { ...this.snapshot.room, hostId, players } });
          if (this.isHost()) { this.own!.isReady = true; void this.track().catch(error => this.fail(error)); this.send('room-state', this.roomInfo()); }
        } else this.publish({ connection: 'reconnecting', error: 'Der Gastgeber ist nicht verbunden. Das Spiel wartet auf seine Rückkehr.' });
      }, 5000);
    }
  }
  private fail(error: unknown) {
    const message = error instanceof Error ? error.message : 'Verbindung zum Raum fehlgeschlagen.';
    this.publish({ connection: 'disconnected', error: message });
    this.failJoin?.(new Error(message));
  }
  private dispatch(event: string, data: RoomData) { this.listeners.get(event)?.forEach(callback => callback(data)); }
  private send(event: string, data: RoomData, recipient?: string) {
    const channel = this.channel, generation = this.generation, sessionId = this.snapshot.room?.sessionId || '';
    if (!channel || !this.identity || channel.state !== 'joined') return;
    const identity = this.identity;
    this.sendQueue = this.sendQueue.then(async () => {
      if (generation !== this.generation) return;
      const packet: Packet = { sender: identity.id, event, sessionId, sequence: ++this.sequence, ...(recipient ? { recipient } : {}) };
      if (recipient) {
        const peer = this.peers.get(recipient);
        if (!peer) return;
        Object.assign(packet, await identity.encrypt(JSON.stringify(data), peer.encryptionKey));
      } else packet.data = data;
      const body = JSON.stringify(packet);
      const signature = await identity.sign(body);
      const result = await channel.send({ type: 'broadcast', event: 'room-wire', payload: { body, signature } });
      if (generation === this.generation && result !== 'ok') this.fail(new Error('Nachricht konnte nicht gesendet werden. Bitte erneut verbinden.'));
    }).catch(error => { if (generation === this.generation) this.fail(error); });
  }
  private async receive(payload: unknown, channel: RealtimeChannel, generation: number) {
    if (!object(payload) || typeof payload.body !== 'string' || typeof payload.signature !== 'string' || payload.body.length > 1000000) return;
    const packet: Packet = JSON.parse(payload.body);
    if (!packet || typeof packet.sender !== 'string' || typeof packet.event !== 'string' || !Number.isSafeInteger(packet.sequence)) return;
    if (!this.peers.has(packet.sender)) await this.syncPresence(channel, generation);
    const peer = this.peers.get(packet.sender);
    if (!peer || generation !== this.generation || packet.sender === this.identity?.id || !await verifyRoomSignature(payload.body, payload.signature, peer.signingKey)) return;
    if (generation !== this.generation) return;
    if (packet.recipient && packet.recipient !== this.identity?.id) return;
    if (packet.sequence <= (this.sequences.get(packet.sender) || 0)) return;
    this.sequences.set(packet.sender, packet.sequence);
    let data = packet.data;
    if (packet.recipient && packet.cipher && packet.iv) data = JSON.parse(await this.identity!.decrypt(packet.cipher, packet.iv, peer.encryptionKey));
    if (generation !== this.generation) return;
    if (!object(data) || !this.snapshot.room) return;
    const fromHost = packet.sender === this.snapshot.room.hostId;
    if (packet.event === 'room-request' && this.isHost()) {
      const room = this.snapshot.room;
      if (!this.partyAccess && room.status !== 'lobby' && !room.participantIds.includes(packet.sender)) { this.send('room-rejected', { message: 'Diese Partie läuft bereits. Bitte warte auf eine neue Runde.' }, packet.sender); return; }
      if (!this.partyAccess && this.snapshot.players.length > (playableGames.find(g => g.id === room.gameId)?.maxPlayers ?? 30)) { this.send('room-rejected', { message: 'Der Raum ist voll.' }, packet.sender); return; }
      this.send('room-state', this.roomInfo(), packet.sender);
      if (this.partyAccess && room.status !== 'lobby' && !room.participantIds.includes(packet.sender)) return;
      this.cache.forEach(cached => { if (!cached.recipient || cached.recipient === packet.sender) this.send(cached.event, cached.data, packet.sender); });
      return;
    }
    if (packet.event === 'room-rejected' && fromHost) {
      const message = typeof data.message === 'string' ? data.message : 'Beitritt fehlgeschlagen.';
      this.leaveRoom(); this.publish({ connection: 'disconnected', error: message }); return;
    }
    if (packet.event === 'room-state' && fromHost) {
      if (typeof data.gameId !== 'string' || !playableGames.some(g => g.id === data.gameId) || !['lobby', 'playing', 'finished'].includes(String(data.status)) || typeof data.sessionId !== 'string') return;
      if (this.snapshot.room.sessionId !== data.sessionId) this.cache.clear();
      const room = { ...this.snapshot.room, players: this.snapshot.room.sessionId === data.sessionId && data.status === 'playing' ? this.snapshot.room.players : this.snapshot.players, gameId: data.gameId, sessionId: data.sessionId, status: data.status as GameRoom['status'], settings: object(data.settings) ? data.settings : {}, participantIds: Array.isArray(data.participantIds) ? data.participantIds.filter((p): p is string => typeof p === 'string') : [] };
      this.publish({ room, connection: this.available(room) ? 'connected' : 'reconnecting', error: this.available(room) ? null : 'Das Spiel wartet, bis alle Teilnehmer wieder verbunden sind.' }); this.finishJoin?.(); return;
    }
    if (packet.sessionId !== this.snapshot.room.sessionId) return;
    if (this.snapshot.room.status !== 'lobby' && !this.snapshot.room.participantIds.includes(packet.sender) && !fromHost) return;
    if (packet.event === 'kick-player' && fromHost && data.playerId === this.identity?.id) {
      this.leaveRoom(); this.publish({ connection: 'disconnected', error: 'Du wurdest aus dem Raum entfernt.' }); return;
    }
    if (isState(packet.event) && !fromHost) return;
    if (!isState(packet.event) && this.snapshot.room.status !== 'lobby' && !this.available()) return;
    const delivered = { ...data, __senderId: packet.sender };
    if (isState(packet.event)) this.cache.set(`received:${packet.event}`, { event: packet.event, data: delivered, recipient: packet.recipient });
    this.dispatch(packet.event, delivered);
  }

  private connect = async (code: string, name: string, premium: boolean, gameId?: string): Promise<void> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { const error = new Error('Keine Internetverbindung. Bitte versuche es erneut.'); this.fail(error); throw error; }
    if (this.snapshot.room?.roomCode === code && this.channel?.state === 'joined' && this.snapshot.connection === 'connected') return;
    if (this.snapshot.room?.roomCode === code && this.pending) return this.pending;
    const attempt = this.generation;
    const identity = await this.getIdentity();
    // Concurrent mounts may both arrive while WebCrypto initializes.
    if (this.snapshot.room?.roomCode === code && this.pending) return this.pending;
    if (this.snapshot.room?.roomCode === code && this.channel?.state === 'joined' && this.snapshot.connection === 'connected') return;
    if (attempt !== this.generation) throw new Error('Verbindung abgebrochen.');
    const previous = this.snapshot.room?.roomCode === code ? this.snapshot.room : null;
    if (!previous) this.cache.clear();
    // A reloaded host has lost private decks/timers. Recover the room as a new
    // lobby explicitly; never pretend a partial public snapshot can resume it.
    const saved = !previous ? getSavedRoom() : null;
    const recovered = saved?.roomCode === code && saved.hostId === identity.id ? saved : null;
    if (recovered) gameId = recovered.gameId;
    const own = previous ? this.own : null;
    this.disconnect();
    const generation = this.generation;
    const hostId = this.partyAccess?.hostId || (gameId ? identity.id : previous?.hostId || '');
    this.own = { id: identity.id, name: name.trim().slice(0, 40), avatar: name.trim().slice(0, 1).toUpperCase(), color: own?.color || COLORS[crypto.getRandomValues(new Uint8Array(1))[0] % COLORS.length], isReady: own?.isReady ?? !!gameId, isPremium: premium, isCreator: own?.isCreator ?? !!gameId, joinedAt: own?.joinedAt || Date.now(), signingKey: identity.signingKey, encryptionKey: identity.encryptionKey };
    const room: GameRoom = previous || { roomCode: code, hostId, players: [], gameId: gameId || '', status: 'lobby', settings: recovered ? { recoveredAfterReload: true } : {}, sessionId: gameId ? crypto.randomUUID() : '', participantIds: [] };
    this.publish({ room, players: [], myPlayerId: identity.id, connection: 'connecting', error: null });
    this.pending = new Promise<void>((resolve, reject) => {
      const clear = () => { if (this.timeout) clearTimeout(this.timeout); this.timeout = null; this.finishJoin = null; this.failJoin = null; this.pending = null; };
      this.finishJoin = () => { clear(); this.publish({ connection: this.available() ? 'connected' : 'reconnecting', error: this.available() ? null : 'Das Spiel wartet, bis alle Teilnehmer wieder verbunden sind.' }); resolve(); };
      this.failJoin = error => { clear(); reject(error); };
      const calls = this.presenceCalls.filter(at => Date.now() - at < 30_100);
      const budgetWait = calls.length >= 4 ? Math.max(0, calls[0] + 30_100 - Date.now()) : 0;
      this.timeout = setTimeout(() => { this.fail(new Error('Raum nicht erreichbar. Prüfe den Code und die Verbindung.')); }, 15000 + budgetWait);
    });
    const pending = this.pending;
    // The SDK reuses a registered same-topic channel until unsubscribe completes.
    // Reserve the join above so concurrent callers share it while cleanup runs.
    void pending.catch(() => {});
    try { await this.channelCleanup; }
    catch (error) { if (generation === this.generation) this.fail(error); return pending; }
    if (generation !== this.generation || this.pending !== pending) return pending;
    const channel = this.client.channel(`game-room:${code}`, { config: { broadcast: { ack: true }, presence: { key: identity.id } } });
    this.channel = channel;
    channel.on('presence', { event: 'sync' }, () => { void this.syncPresence(channel, generation).catch(error => { if (generation === this.generation) this.fail(error); }); });
    channel.on('broadcast', { event: 'room-wire' }, ({ payload }) => {
      this.receiveQueue = this.receiveQueue.then(() => this.receive(payload, channel, generation)).catch(() => { /* Ignore malformed/unverifiable packets. */ });
    });
    // TVs are observers, never gameplay actors. Keep their handshake compatible.
    channel.on('broadcast', { event: 'tv-ready' }, ({ payload }) => { if (generation === this.generation && object(payload)) this.dispatch('tv-ready', payload); });
    channel.subscribe(async status => {
      if (generation !== this.generation) return;
      if (status === 'SUBSCRIBED') {
        try {
          this.trackSignature = ''; this.sentTrackSignature = ''; await this.track(); await this.syncPresence(channel, generation);
          if (!this.isHost()) this.send('room-request', {});
        } catch (error) { if (generation === this.generation) this.fail(error); }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        this.publish({ connection: 'reconnecting', error: 'Verbindung unterbrochen. Das Spiel wird erneut verbunden.' });
      }
    });
    this.heartbeat = setInterval(() => {
      if (generation !== this.generation || channel.state !== 'joined') return;
      if (!this.isHost()) this.send('room-request', {});
    }, 5000);
    return pending;
  };
  createRoom = async (gameId: string, premium = false, name = 'Host'): Promise<string> => {
    if (!playableGames.some(g => g.id === gameId) || !name.trim()) throw new Error('Bitte wähle ein Spiel und einen Namen.');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => chars[n % chars.length]).join('');
    await this.connect(code, name, premium, gameId);
    this.selectGames([gameId]);
    return code;
  };
  joinRoom = async (code: string, name: string, premium = false): Promise<void> => {
    const normalized = code.toUpperCase().trim();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized) || !name.trim()) { const error = new Error('Bitte gib einen gültigen Raumcode und deinen Namen ein.'); this.fail(error); throw error; }
    await this.connect(normalized, name, premium);
  };
  private disconnect() {
    ++this.generation;
    if (this.timeout) clearTimeout(this.timeout);
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.hostGrace) clearTimeout(this.hostGrace);
    this.timeout = null; this.heartbeat = null; this.hostGrace = null;
    this.failJoin?.(new Error('Verbindung abgebrochen.'));
    const channel = this.channel; this.channel = null;
    if (channel) {
      // Unsubscribe unregisters this topic without closing the shared socket.
      // removeChannel also starts a socket close when this is the last topic;
      // a new subscription during that close cannot connect in the current SDK.
      this.channelCleanup = Promise.all([this.channelCleanup, channel.unsubscribe()]).then(() => {});
      void this.channelCleanup.catch(() => {});
    }
    this.trackSignature = ''; this.sentTrackSignature = ''; this.discoveryInfo = null; this.peers.clear(); this.sequences.clear();
  }
  leaveRoom = (): void => {
    this.disconnect(); this.cache.clear(); this.own = null;
    this.publish({ room: null, players: [], connection: 'idle', error: null });
    try { localStorage.removeItem('eventbliss_active_room'); sessionStorage.removeItem('eventbliss_active_room'); } catch { /* Optional storage. */ }
  };
  setReady = (ready: boolean): void => { if (this.own) { this.own.isReady = ready; void this.track().catch(error => this.fail(error)); } };
  selectGame = (gameId: string): void => {
    this.selectGames([gameId]);
  };
  selectGames = (gameIds: string[]): void => {
    if (!this.isHost() || this.snapshot.room?.status !== 'lobby') return;
    const ids = [...new Set(gameIds)].filter(id => playableGames.some(g => g.id === id));
    if (!ids.length) return;
    const gameId = ids[0];
    this.publish({ room: { ...this.snapshot.room, gameId, settings: { ...this.snapshot.room.settings, selectedGameIds: ids } } });
    void this.track().catch(error => this.fail(error)); this.send('room-state', this.roomInfo());
  };
  startGame = async (gameId = this.snapshot.room?.gameId): Promise<boolean> => {
    const generation = this.generation;
    const room = this.snapshot.room, game = playableGames.find(g => g.id === gameId);
    if (!room || room.status !== 'lobby' || !game || !this.isHost() || this.snapshot.connection !== 'connected') return false;
    if (this.partyAccess) this.partyAccess = await this.partyAccess.refresh();
    if (generation !== this.generation || this.snapshot.room?.sessionId !== room.sessionId) return false;
    const players = this.snapshot.players.filter(p => !this.partyAccess || this.partyAccess.hostPlays || p.id !== room.hostId);
    if (players.length < Math.max(2, game.minPlayers) || players.length > game.maxPlayers || players.some(p => !p.isReady)) return false;
    if (this.partyAccess && players.length !== this.partyAccess.memberIds.filter(id => this.partyAccess!.hostPlays || id !== room.hostId).length) return false;
    const sessionId = this.partyAccess ? await this.partyAccess.start(game.id, players.map(p => p.id)) : crypto.randomUUID();
    if (generation !== this.generation || this.snapshot.room?.sessionId !== room.sessionId) return false;
    this.cache.clear();
    const next: GameRoom = { ...room, players: this.snapshot.players, settings: { ...room.settings, controllerParty: !!this.partyAccess, hostPremium: this.partyAccess?.premium ?? false, selectedGameIds: Array.isArray(room.settings.selectedGameIds) ? room.settings.selectedGameIds : [game.id] }, gameId: game.id, status: 'playing', sessionId, participantIds: players.map(p => p.id) };
    const { players: _players, ...info } = next;
    // Announce before React mounts the game and enqueues its initial snapshot.
    this.send('room-state', info);
    this.publish({ room: next });
    await this.track();
    await this.sendQueue;
    void this.channel?.send({ type: 'broadcast', event: 'game-start', payload: { gameId: game.id } });
    return true;
  };
  broadcast = (event: string, data: RoomData): void => {
    if (!object(data)) return;
    if (isState(event)) {
      if (!this.isHost()) return;
      this.cache.set(`*:${event}`, { event, data: JSON.parse(JSON.stringify(data)) });
    }
    if (event.startsWith('tv-') && this.isHost()) { void this.channel?.send({ type: 'broadcast', event, payload: data }); return; }
    this.send(event, data);
  };
  broadcastTo = (recipient: string, event: string, data: RoomData): void => {
    if (!this.isHost() || !object(data)) return;
    if (isState(event)) this.cache.set(`${recipient}:${event}`, { event, data: JSON.parse(JSON.stringify(data)), recipient });
    if (recipient === this.identity?.id) return;
    this.send(event, data, recipient);
  };
  onBroadcast = (event: string, callback: RoomListener): (() => void) => {
    const callbacks = this.listeners.get(event) || new Set<RoomListener>();
    this.listeners.set(event, callbacks); callbacks.add(callback);
    const generation = this.generation;
    queueMicrotask(() => {
      if (generation !== this.generation || !callbacks.has(callback) || this.isHost()) return;
      this.cache.forEach(cached => { if (cached.event === event && (!cached.recipient || cached.recipient === this.identity?.id)) callback(cached.data); });
    });
    return () => { callbacks.delete(callback); };
  };
  kickPlayer = (playerId: string): void => { if (this.isHost() && playerId !== this.identity?.id) this.send('kick-player', { playerId }); };
}
