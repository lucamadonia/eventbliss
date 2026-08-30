import { describe, expect, it } from "vitest";
import {
  TV_MESSAGE_ID_KEY,
  createTVPacketGate,
  getTVMessageId,
  stripTVMessageId,
  withTVMessageId,
} from "./tv-wire";

describe("TV wire packet deduplication", () => {
  it("accepts one logical packet only once across mirrored channels", () => {
    const gate = createTVPacketGate();
    const payload = withTVMessageId({ game: "brew", phase: "playing" }, "host:42");

    expect(gate(payload)).toBe(true);
    expect(gate(payload)).toBe(false);
  });

  it("keeps compatibility with packets from older hosts", () => {
    const gate = createTVPacketGate();
    expect(gate({ game: "brew" })).toBe(true);
    expect(gate({ game: "brew" })).toBe(true);
  });

  it("removes transport metadata before state reaches a game view", () => {
    const wire = withTVMessageId({ game: "brew", score: 3 }, "host:7");
    expect(getTVMessageId(wire)).toBe("host:7");
    expect(stripTVMessageId(wire)).toEqual({ game: "brew", score: 3 });
    expect(stripTVMessageId(wire)).not.toHaveProperty(TV_MESSAGE_ID_KEY);
  });

  it("bounds its memory and eventually accepts an evicted id again", () => {
    const gate = createTVPacketGate(2);
    expect(gate(withTVMessageId({}, "a"))).toBe(true);
    expect(gate(withTVMessageId({}, "b"))).toBe(true);
    expect(gate(withTVMessageId({}, "c"))).toBe(true);
    expect(gate(withTVMessageId({}, "a"))).toBe(true);
  });
});
