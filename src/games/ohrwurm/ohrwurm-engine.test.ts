import { describe, it, expect } from 'vitest';
import {
  isPlacementCorrect,
  slotBounds,
  insertSorted,
  correctSlotIndex,
  resolveRound,
  hasWon,
  buildDeck,
  shuffle,
  createFreshMatch,
  START_HOOKS,
  type Song,
  type Participant,
} from './ohrwurm-engine';

// Minimal Song factory — only the fields the engine touches.
const song = (id: string, year: number, genre = 'Pop'): Song => ({
  id,
  year,
  title: `T-${id}`,
  artist: `A-${id}`,
  genre,
  flag: '🏳️',
  qrPayload: `https://x/${id}`,
  spotifyUri: null,
} as unknown as Song);

const timeline = (...years: number[]): Song[] =>
  years.map((y, i) => song(`s${i}-${y}`, y));

describe('fresh match initialization', () => {
  it('resets a completed match to one start card and three hooks for every identity', () => {
    const old: Participant[] = [
      { id: 'host', name: 'Host', type: 'player', color: '#123', avatar: 'a', timeline: timeline(1970, 1980, 1990, 2000, 2010), hooks: 5 },
      { id: 'guest', name: 'Guest', type: 'group', color: '#456', avatar: 'b', timeline: timeline(1980, 1990), hooks: 0 },
    ];
    const before = structuredClone(old);
    const cards = Array.from({ length: 10 }, (_, i) => song(`new-${i}`, 1980 + i));
    const fresh = createFreshMatch(old, cards);
    expect(fresh.participants.map(p => p.timeline.length)).toEqual([1, 1]);
    expect(fresh.participants.map(p => p.hooks)).toEqual([START_HOOKS, START_HOOKS]);
    expect(START_HOOKS).toBe(3);
    expect(fresh.participants.map(({ timeline, hooks, ...identity }) => identity))
      .toEqual(old.map(({ timeline, hooks, ...identity }) => identity));
    expect(fresh.participants.some(p => hasWon(p, 5))).toBe(false);
    expect(old).toEqual(before);
    expect(cards).toHaveLength(10);
    const dealt = fresh.participants.flatMap(p => p.timeline.map(s => s.id));
    expect(new Set(dealt).size).toBe(2);
    expect(fresh.deck).toHaveLength(8);
    expect(fresh.deck.every(s => !dealt.includes(s.id))).toBe(true);
    expect(JSON.parse(JSON.stringify(fresh.participants))).toEqual(fresh.participants);
  });

  it('uses the identical deal for first start and replay, without score carryover', () => {
    const roster = [{ id: '1', name: 'Player', type: 'player' as const, color: '#fff', avatar: '' }];
    const cards = [song('a', 1980), song('b', 1990), song('c', 2000)];
    const first = createFreshMatch(roster, cards);
    first.participants[0].timeline.push(song('won', 2020));
    first.participants[0].hooks = 0;
    expect(createFreshMatch(first.participants, cards)).toEqual(createFreshMatch(roster, cards));
  });

  it('requires a separate draw card after the initial deal', () => {
    const roster = [{ id: '1', name: 'Player', type: 'player' as const, color: '#fff', avatar: '' }];
    expect(() => createFreshMatch(roster, [song('a', 1980)])).toThrow(/draw card/);
  });
});

describe('slotBounds', () => {
  it('open left edge and right edge are ±Infinity', () => {
    const tl = timeline(1980, 1990, 2000);
    expect(slotBounds(tl, 0)).toEqual({ left: -Infinity, right: 1980 });
    expect(slotBounds(tl, 3)).toEqual({ left: 2000, right: Infinity });
    expect(slotBounds(tl, 1)).toEqual({ left: 1980, right: 1990 });
  });
});

describe('isPlacementCorrect', () => {
  const tl = timeline(1980, 1990, 2000);
  it('accepts a year inside the chosen gap', () => {
    expect(isPlacementCorrect(tl, 1, song('x', 1985))).toBe(true); // between 1980 and 1990
    expect(isPlacementCorrect(tl, 0, song('x', 1970))).toBe(true); // before all
    expect(isPlacementCorrect(tl, 3, song('x', 2010))).toBe(true); // after all
  });
  it('rejects a year outside the chosen gap', () => {
    expect(isPlacementCorrect(tl, 0, song('x', 1985))).toBe(false);
    expect(isPlacementCorrect(tl, 1, song('x', 1995))).toBe(false);
  });
  it('treats equal years on a boundary as correct (Spec §2.6)', () => {
    // year == left bound or right bound counts as in-range
    expect(isPlacementCorrect(tl, 1, song('x', 1980))).toBe(true);
    expect(isPlacementCorrect(tl, 1, song('x', 1990))).toBe(true);
  });
  it('empty timeline: slot 0 is always correct', () => {
    expect(isPlacementCorrect([], 0, song('x', 1999))).toBe(true);
  });
});

describe('insertSorted', () => {
  it('keeps the timeline chronologically sorted', () => {
    const tl = timeline(1980, 2000);
    const out = insertSorted(tl, song('m', 1990));
    expect(out.map((s) => s.year)).toEqual([1980, 1990, 2000]);
  });
  it('is immutable', () => {
    const tl = timeline(1980);
    const out = insertSorted(tl, song('m', 1990));
    expect(tl).toHaveLength(1);
    expect(out).toHaveLength(2);
  });
});

describe('correctSlotIndex', () => {
  it('finds the first valid slot', () => {
    const tl = timeline(1980, 1990, 2000);
    expect(correctSlotIndex(tl, song('x', 1985))).toBe(1);
    expect(correctSlotIndex(tl, song('x', 1960))).toBe(0);
    expect(correctSlotIndex(tl, song('x', 2020))).toBe(3);
  });
});

describe('resolveRound — the 5 rule rows (Spec §2.3)', () => {
  const A = 'A';
  const B = 'B';
  const tl = timeline(1980, 2000); // slots: 0 (<1980) 1 (1980-2000) 2 (>2000)
  const card = song('c', 1990); // correct slot = 1

  it('active correct, no counter → active keeps + bonus eligible', () => {
    const r = resolveRound(A, tl, { slotIndex: 1 }, null, card);
    expect(r.activeCorrect).toBe(true);
    expect(r.winnerId).toBe(A);
    expect(r.bonusEligible).toBe(true);
  });

  it('active wrong, no counter → back to deck', () => {
    const r = resolveRound(A, tl, { slotIndex: 0 }, null, card);
    expect(r.activeCorrect).toBe(false);
    expect(r.winnerId).toBeNull();
    expect(r.bonusEligible).toBe(false);
  });

  it('active correct, counter present → active keeps, counter fizzles', () => {
    const r = resolveRound(A, tl, { slotIndex: 1 }, { participantId: B, slotIndex: 0 }, card);
    expect(r.winnerId).toBe(A);
    expect(r.bonusEligible).toBe(true);
  });

  it('active wrong, counter correct → counter steals, no bonus', () => {
    const r = resolveRound(A, tl, { slotIndex: 0 }, { participantId: B, slotIndex: 1 }, card);
    expect(r.activeCorrect).toBe(false);
    expect(r.counterCorrect).toBe(true);
    expect(r.winnerId).toBe(B);
    expect(r.bonusEligible).toBe(false);
  });

  it('active wrong, counter wrong → back to deck', () => {
    const r = resolveRound(A, tl, { slotIndex: 0 }, { participantId: B, slotIndex: 2 }, card);
    expect(r.winnerId).toBeNull();
  });
});

describe('hasWon', () => {
  const p = (n: number): Participant => ({
    id: 'p', name: 'P', type: 'player', color: '#fff', avatar: 'P',
    timeline: timeline(...Array.from({ length: n }, (_, i) => 1950 + i)),
    hooks: 3,
  });
  it('true at or above target', () => {
    expect(hasWon(p(10), 10)).toBe(true);
    expect(hasWon(p(11), 10)).toBe(true);
  });
  it('false below target', () => {
    expect(hasWon(p(9), 10)).toBe(false);
  });
});

describe('buildDeck', () => {
  it('returns a non-empty deck', () => {
    expect(buildDeck().length).toBeGreaterThan(50);
  });
  it('genre filter only keeps that genre', () => {
    const all = buildDeck();
    const genres = [...new Set(all.map((s) => s.genre))];
    const g = genres[0];
    const filtered = buildDeck(g);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((s) => s.genre === g)).toBe(true);
  });
});

describe('shuffle', () => {
  it('preserves length and elements', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });
});
