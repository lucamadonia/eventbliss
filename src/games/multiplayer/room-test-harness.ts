import { vi } from 'vitest';
import { RoomSession } from './room-session';

// WebCrypto-signed multi-session flows exceed the 5 s default when the machine is busy.
vi.setConfig({ testTimeout: 20_000 });

/** In-memory Supabase realtime double: async presence sync and broadcast fan-out. */
type Handler = { type: string; event: string; callback: (message: { event: string; payload: unknown }) => void };
export type WirePacket = { event: string; payload: { body: string } };
export class Network {
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
export class Channel {
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
export const sessions: RoomSession[] = [];
export const delay = () => new Promise(resolve => setTimeout(resolve, 10));
export async function until(test: () => boolean) {
  for (let i = 0; i < 500; i++) { if (test()) return; await delay(); }
  throw new Error('Condition not reached');
}
export function session(network: Network) { const room = new RoomSession(network.client()); sessions.push(room); return room; }
