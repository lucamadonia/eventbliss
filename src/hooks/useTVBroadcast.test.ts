import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock-first: der Hook laeuft als einfache Funktion, Zustand liegt in Slots.
const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  handlers: [] as (() => void)[],
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    return [harness.slots[index], (next: unknown) => { harness.slots[index] = next; }];
  },
  useCallback: (callback: unknown) => callback,
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: () => undefined,
}));
vi.mock('@/integrations/supabase/client', () => {
  const channel = (topic: string) => ({
    topic: `realtime:${topic}`,
    on: (_type: string, filter: { event: string }, handler: () => void) => {
      if (filter.event === 'tv-ready') harness.handlers.push(handler);
      return channel(topic);
    },
    subscribe: () => undefined,
    send: () => Promise.resolve('ok'),
  });
  return { supabase: { channel, removeChannel: () => undefined } };
});

import { useTVBroadcast } from './useTVBroadcast';

const render = () => { harness.index = 0; return useTVBroadcast('ABC123'); };

describe('useTVBroadcast lastTvReadyAt', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.handlers = [];
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T20:00:00Z'));
  });

  it('starts at 0 (never seen a TV)', () => {
    expect(render().lastTvReadyAt).toBe(0);
  });

  it('records the last tv-ready heartbeat and clears it on deactivate', () => {
    render().activate();
    expect(harness.handlers.length).toBeGreaterThan(0);
    harness.handlers[0]();
    expect(render().lastTvReadyAt).toBe(Date.parse('2026-10-03T20:00:00Z'));

    // Ein spaeterer Herzschlag schiebt den Zeitpunkt weiter.
    vi.advanceTimersByTime(30_000);
    harness.handlers[0]();
    expect(render().lastTvReadyAt).toBe(Date.parse('2026-10-03T20:00:30Z'));

    render().deactivate();
    expect(render().lastTvReadyAt).toBe(0);
    vi.useRealTimers();
  });
});
