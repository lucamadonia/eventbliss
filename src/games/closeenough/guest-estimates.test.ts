import { describe, expect, it } from 'vitest';
import { ceExpiry, ceSenderMayGuess, ceTvPlayers, nextLocalGuesser, queuedLocalGuessers } from './guest-estimates';

const players = [{ id: 'host' }, { id: 'max' }, { id: 'gerda' }, { id: 'lena' }];
const local = ['host', 'max', 'gerda'];
const room = [
  { id: 'host', name: 'Luca', avatar: '🦊', color: '#ff0000' },
  { id: 'max', name: 'Max', avatar: '🎸', color: '#00ff00', controlledBy: 'host' },
  { id: 'lena', name: 'Lena', color: '#0000ff' },
];

describe('closeenough guest estimates', () => {
  it('lets the host seat estimate first, then each guest in order', () => {
    expect(nextLocalGuesser(local, players, {})).toBe('host');
    expect(nextLocalGuesser(local, players, { host: 5 })).toBe('max');
    expect(nextLocalGuesser(local, players, { host: 5, max: null })).toBe('gerda');
    expect(nextLocalGuesser(local, players, new Set(['host', 'max', 'gerda']))).toBeNull();
  });

  it('skips seats that are no longer in the game (non-playing host, removed guest)', () => {
    expect(nextLocalGuesser(['mod', 'max'], players, {})).toBe('max');
    expect(nextLocalGuesser(local, [{ id: 'host' }, { id: 'gerda' }], { host: 1 })).toBe('gerda');
  });

  it('queues every open local seat except the one holding the phone', () => {
    expect(queuedLocalGuessers(local, players, {})).toEqual(['max', 'gerda']);
    expect(queuedLocalGuessers(local, players, { host: 1 })).toEqual(['gerda']);
    expect(queuedLocalGuessers(local, players, { host: 1, max: 2 })).toEqual([]);
  });

  it('on timeout marks own phones and the current seat as no guess, but keeps queued guests open', () => {
    const next = ceExpiry(players, { lena: 7 }, ['max', 'gerda']);
    expect(next).toEqual({ lena: 7, host: null });
    expect(ceExpiry(players, next, [])).toEqual({ lena: 7, host: null, max: null, gerda: null });
  });

  it('accepts an estimate from the seat itself or the device playing that guest', () => {
    expect(ceSenderMayGuess('lena', 'lena', room)).toBe(true);
    expect(ceSenderMayGuess('max', 'host', room)).toBe(true);
    expect(ceSenderMayGuess('max', 'lena', room)).toBe(false);
    expect(ceSenderMayGuess('lena', 'host', room)).toBe(false);
    expect(ceSenderMayGuess(undefined, 'host', room)).toBe(false);
  });

  it('gives the TV avatars and a done/thinking status, never the number', () => {
    const tv = ceTvPlayers([{ id: 'max', name: 'Max', color: '#111111', score: 3 }, { id: 'zoe', name: 'Zoe', color: '#222222', score: 0 }], room, new Set(['max']));
    expect(tv[0]).toEqual({ id: 'max', name: 'Max', color: '#00ff00', avatar: '🎸', score: 3, status: 'done' });
    expect(tv[1]).toEqual({ id: 'zoe', name: 'Zoe', color: '#222222', score: 0, status: 'thinking' });
  });
});

describe('closeenough public snapshot', () => {
  it('never sends estimates, results or the answer before the reveal', async () => {
    const { publicCeSnapshot } = await import('./useCeOnlineSync');
    const question = { id: 'q', answer: 42, tolerancePct: 5, sourceUrl: 'u', sourceLabel: 'l' } as never;
    const base = { phaseStartsAt: 1, players: [], round: 0, roundToken: 't', totalRounds: 3, question, mode: 'klassisch' as const,
      categories: [], submittedIds: ['host'], guesses: { host: 41 }, results: [{ playerId: 'host' }] as never };
    const guessing = publicCeSnapshot({ ...base, phase: 'guessing' });
    expect(guessing.guesses).toEqual({});
    expect(guessing.results).toBeNull();
    expect(guessing.question).not.toHaveProperty('answer');
    expect(guessing.submittedIds).toEqual(['host']);
    const reveal = publicCeSnapshot({ ...base, phase: 'reveal' });
    expect(reveal.guesses).toEqual({ host: 41 });
    expect(reveal.question).toHaveProperty('answer', 42);
  }, 30_000);
});
