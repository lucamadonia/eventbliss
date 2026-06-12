import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFreePlaysUsed, getFreePlaysLeft, recordFreePlay } from "./gameConfig";

const PREMIUM_GAME = "hochstapler"; // tier: premium, freeRoundsLimit: 2
const FREE_GAME = "bomb"; // tier: free

// Minimal localStorage stub — the tests run in a plain Node environment.
function makeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("premium free-play counter", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeStorage());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("increments the daily counter per recorded play", () => {
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(0);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(2);

    recordFreePlay(PREMIUM_GAME);
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(1);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(1);

    recordFreePlay(PREMIUM_GAME);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(0);
  });

  it("never goes below zero remaining plays", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(3);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(0);
  });

  it("resets at the next day (date-scoped key)", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(0);

    vi.setSystemTime(new Date("2026-06-13T00:01:00Z"));
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(0);
    expect(getFreePlaysLeft(PREMIUM_GAME)).toBe(2);
  });

  it("does not count plays for users with effective premium", () => {
    recordFreePlay(PREMIUM_GAME, true);
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(0);
  });

  it("does not count plays for free games", () => {
    recordFreePlay(FREE_GAME);
    expect(getFreePlaysUsed(FREE_GAME)).toBe(0);
  });

  it("tracks games independently", () => {
    recordFreePlay(PREMIUM_GAME);
    expect(getFreePlaysUsed(PREMIUM_GAME)).toBe(1);
    expect(getFreePlaysUsed("split-quiz")).toBe(0);
  });
});
