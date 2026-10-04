import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock-first: der Hook laeuft als einfache Funktion, Zustand liegt in Slots,
// Effekte laufen synchron, sobald sich ihre Abhaengigkeiten aendern.
const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  effectDeps: [] as (unknown[] | undefined)[],
  index: 0,
  effectIndex: 0,
  handlers: [] as { topic: string; fn: () => void }[],
  channels: [] as { topic: string; sent: { event: string }[]; removed: boolean }[],
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    return [harness.slots[index], (next: unknown) => { harness.slots[index] = next; }];
  },
  useCallback: (callback: unknown) => callback,
  useRef: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = { current: initial };
    return harness.slots[index];
  },
  useEffect: (fn: () => void | (() => void), deps?: unknown[]) => {
    const index = harness.effectIndex++;
    const prev = harness.effectDeps[index];
    const changed = !deps || !prev || deps.some((d, i) => !Object.is(d, prev[i]));
    harness.effectDeps[index] = deps;
    if (changed) fn();
  },
}));
vi.mock('@/integrations/supabase/client', () => {
  const channel = (name: string) => {
    const topic = `realtime:${name}`;
    const existing = harness.channels.find((c) => c.topic === topic && !c.removed);
    const record = existing ?? { topic, sent: [], removed: false };
    if (!existing) harness.channels.push(record);
    const api = {
      topic,
      on: (_type: string, filter: { event: string }, fn: () => void) => {
        if (filter.event === 'tv-ready') harness.handlers.push({ topic, fn });
        return api;
      },
      subscribe: () => api,
      send: (msg: { event: string }) => { record.sent.push(msg); return Promise.resolve('ok'); },
      record,
    };
    return api;
  };
  return {
    supabase: {
      channel,
      getChannels: () => harness.channels.filter((c) => !c.removed),
      removeChannel: (ch: { record: { removed: boolean } }) => { ch.record.removed = true; },
    },
  };
});

import { useTVBroadcast } from './useTVBroadcast';

const render = (code?: string) => { harness.index = 0; harness.effectIndex = 0; return useTVBroadcast(code); };
const sentOn = (topic: string) => harness.channels.filter((c) => c.topic === `realtime:${topic}`).flatMap((c) => c.sent.map((m) => m.event));

describe('useTVBroadcast', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.effectDeps = [];
    harness.handlers = [];
    harness.channels = [];
    try { sessionStorage.clear(); } catch { /* node */ }
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T20:00:00Z'));
  });

  it('starts with lastTvReadyAt 0 (never seen a TV)', () => {
    expect(render().lastTvReadyAt).toBe(0);
  });

  it('records the last tv-ready heartbeat and clears it on deactivate', () => {
    render().activate();
    expect(harness.handlers.length).toBeGreaterThan(0);
    harness.handlers[0].fn();
    expect(render().lastTvReadyAt).toBe(Date.parse('2026-10-03T20:00:00Z'));
    vi.advanceTimersByTime(30_000);
    harness.handlers[0].fn();
    expect(render().lastTvReadyAt).toBe(Date.parse('2026-10-03T20:00:30Z'));
    render().deactivate();
    expect(render().lastTvReadyAt).toBe(0);
    vi.useRealTimers();
  });

  /**
   * Echtgeraete-Bug „Warte auf den Host …“ mitten im Spiel: Der Provider haengt
   * an der App-Wurzel und wird VOR der Party montiert. Der Code fror beim ersten
   * Render ein (Zufallscode), die Party wirbt aber mit ihrem eigenen Code — der
   * Fernseher auf /tv/<Partycode> bekam nie ein Paket.
   */
  it('follows the party TV code that appears after mount', () => {
    render().activate();
    const tv = render('PARTY1');
    expect(tv.tvCode).toBe('PARTY1');
    tv.broadcastTV('tv-state', { game: 'impostor', phase: 'discussion' });
    expect(sentOn('tv-room:PARTY1')).toContain('tv-state');
  });

  it('never tears down a room channel it does not own (controller party: party code = room code)', () => {
    // room-session already holds game-room:PARTY1
    harness.channels.push({ topic: 'realtime:game-room:PARTY1', sent: [], removed: false });
    render().activate();
    render('PARTY1');
    render('PARTY1').deactivate();
    expect(harness.channels.find((c) => c.topic === 'realtime:game-room:PARTY1')?.removed).toBe(false);
  });

  it('an online room (GamesHub setOnlineRoom) never opens or removes the game-room channel — room-session owns it', () => {
    // GamesHub mounts BEFORE room-session opened its channel (the dedupe trap).
    const hub = render();
    hub.setOnlineRoom('ROOM42');
    expect(harness.channels.some((c) => c.topic === 'realtime:game-room:ROOM42')).toBe(false);
    // room-session now owns the room channel.
    harness.channels.push({ topic: 'realtime:game-room:ROOM42', sent: [], removed: false });
    hub.broadcastTV('tv-state', { game: 'bomb' });
    expect(sentOn('tv-room:ROOM42')).toContain('tv-state');
    // Leaving GamesHub (setOnlineRoom(null)) must leave room-session's channel alive.
    render().setOnlineRoom(null);
    expect(harness.channels.find((c) => c.topic === 'realtime:game-room:ROOM42')?.removed).toBe(false);
  });
});
