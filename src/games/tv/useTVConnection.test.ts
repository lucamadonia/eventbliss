import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  handlers: new Map<string, ((message: { payload: unknown }) => void)[]>(),
}));

const sameDeps = (a: unknown[] | undefined, b: unknown[] | undefined) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    return [harness.slots[index], (next: unknown) => {
      harness.slots[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(harness.slots[index]) : next;
    }];
  },
  useRef: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = { current: initial };
    return harness.slots[index];
  },
  useCallback: (callback: unknown, deps: unknown[]) => {
    const index = harness.index++;
    const previous = harness.slots[index] as { deps: unknown[]; callback: unknown } | undefined;
    if (!previous || !sameDeps(previous.deps, deps)) harness.slots[index] = { deps, callback };
    return (harness.slots[index] as { callback: unknown }).callback;
  },
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
    const index = harness.index++;
    const previous = harness.slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
    if (previous && sameDeps(previous.deps, deps)) return;
    previous?.cleanup?.();
    harness.slots[index] = { deps, cleanup: effect() };
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: (name: string) => {
      const api = {
        on: (type: string, filter: { event: string }, handler: (message: { payload: unknown }) => void) => {
          if (type === 'broadcast') {
            const key = `${name}:${filter.event}`;
            harness.handlers.set(key, [...(harness.handlers.get(key) ?? []), handler]);
          }
          return api;
        },
        subscribe: (callback: (status: string) => void) => { callback('SUBSCRIBED'); return api; },
        send: () => Promise.resolve('ok'),
        presenceState: () => ({}),
      };
      return api;
    },
    removeChannel: () => Promise.resolve('ok'),
  },
}));
vi.mock('@/i18n', () => ({ default: { language: 'de', t: (key: string) => key, changeLanguage: () => Promise.resolve() } }));
vi.mock('@/games/party/party-scene', () => ({ parsePartySceneMessage: () => null, sceneGoAt: () => 0 }));
vi.mock('@/games/party/scene-clock', () => ({ serverClock: { now: () => Date.now() } }));

import { useTVConnection } from './useTVConnection';

// This harness intentionally invokes the hook with mocked React primitives.
// eslint-disable-next-line react-hooks/rules-of-hooks
const render = () => { harness.index = 0; return useTVConnection('ROOM42'); };
const send = (event: string, payload: unknown = {}) => {
  for (const handler of harness.handlers.get(`tv-room:ROOM42:${event}`) ?? []) handler({ payload });
};

describe('TV room transitions', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.handlers.clear();
    vi.stubGlobal('window', {
      setInterval: () => 1,
      clearInterval: () => {},
      cancelAnimationFrame: () => {},
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the newest lobby after a finished game and starts only on a real game picture', () => {
    render();
    send('tv-state', { game: 'bomb', phase: 'playing' });
    expect(render().gameStarted).toBe(true);
    send('tv-leaderboard', { scores: [{ name: 'Anna', score: 7 }] });
    send('game-end');
    expect(render().gameEnded).toBe(true);
    expect(render().leaderboard).toHaveLength(1);

    send('tv-state', { game: 'lobby', phase: 'idle', lobby: { code: 'ROOM42' } });
    send('game-end'); // delayed packet from the previous match
    send('tv-leaderboard', { scores: [{ name: 'Anna', score: 7 }] });
    expect(render()).toMatchObject({ gameStarted: false, gameEnded: false, leaderboard: [] });
    expect(render().gameState?.game).toBe('lobby');

    send('game-start', { scene: { scene: 'countdown' } });
    expect(render().gameState?.game).toBe('lobby');
    expect(render().gameStarted).toBe(false);
    send('tv-state', { game: 'ohrwurm', phase: 'playing' });
    expect(render().gameStarted).toBe(true);
    expect(render().gameState?.game).toBe('ohrwurm');
  });
});
