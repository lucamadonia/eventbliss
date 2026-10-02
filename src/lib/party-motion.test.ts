import { describe, expect, it, vi } from "vitest";
import {
  PARTY_TIMING_BUDGET,
  PARTY_TRANSITION_IDS,
  PARTY_TRANSITIONS,
  confettiBurst,
  contrastRatio,
  firePartyHaptic,
  partyCueDurationMs,
  partyMotion,
  partyMs,
  partyVariants,
  readableOn,
  reduceVariants,
  animationProgress,
  TV_PHASE_BEATS,
  SCENE_LEAD_MS,
  type PartyDevice,
} from "./party-motion";

const DEVICES: PartyDevice[] = ["tv", "host", "phone"];

describe("PARTY_TRANSITIONS", () => {
  it("covers T01–T19 exactly", () => {
    const expected = Array.from({ length: 19 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`);
    expect([...PARTY_TRANSITION_IDS].sort()).toEqual(expected);
    expect(Object.keys(PARTY_TRANSITIONS).sort()).toEqual(expected);
    expect(Object.keys(PARTY_TIMING_BUDGET).sort()).toEqual(expected);
  });

  it.each(PARTY_TRANSITION_IDS)("%s has a cue for tv, host and phone", (id) => {
    for (const device of DEVICES) {
      const cue = PARTY_TRANSITIONS[id][device];
      expect(cue, `${id}.${device}`).toBeDefined();
      expect(cue.durationMs).toBeGreaterThanOrEqual(0);
      if (cue.token === "none") expect(cue.durationMs).toBe(0);
    }
  });

  it.each(PARTY_TRANSITION_IDS)("%s fits the masterplan timing budget", (id) => {
    const { maxMs, minMs } = PARTY_TIMING_BUDGET[id];
    for (const device of DEVICES) {
      const { durationMs, token } = PARTY_TRANSITIONS[id][device];
      expect(durationMs, `${id}.${device}`).toBeLessThanOrEqual(maxMs);
      if (minMs !== undefined && token !== "none") expect(durationMs).toBeGreaterThanOrEqual(minMs);
    }
  });

  it("plays sound only on the TV", () => {
    for (const id of PARTY_TRANSITION_IDS) {
      expect(PARTY_TRANSITIONS[id].host.sound).toBe("none");
      expect(PARTY_TRANSITIONS[id].phone.sound).toBe("none");
    }
  });

  it("never vibrates the TV", () => {
    for (const id of PARTY_TRANSITION_IDS) expect(PARTY_TRANSITIONS[id].tv.haptic).toBe("none");
  });

  it("keeps decorative phone motion at or under 600 ms", () => {
    for (const id of PARTY_TRANSITION_IDS) {
      const cue = PARTY_TRANSITIONS[id].phone;
      if (!cue.semantic) expect(cue.durationMs, id).toBeLessThanOrEqual(600);
    }
  });

  it("matches spec specifics", () => {
    expect(PARTY_TRANSITIONS.T01.tv.durationMs).toBe(1200);
    expect(PARTY_TRANSITIONS.T11.host.durationMs).toBeGreaterThanOrEqual(6000);
    expect(PARTY_TRANSITIONS.T13.tv.delayMs).toBe(2000);
    expect(PARTY_TRANSITIONS.T13.host.delayMs).toBe(30000);
    expect(PARTY_TRANSITIONS.T14.tv.durationMs).toBe(2000);
    expect(PARTY_TRANSITIONS.T18.tv.durationMs).toBe(320);
    expect(PARTY_TRANSITIONS.T19.tv.sound).toBe("none");
    expect(PARTY_TRANSITIONS.T16.tv.durationMs).toBe(confettiBurst.afterDrumrollMs + confettiBurst.durationMs);
    // Konfetti synchron auf allen Geraeten
    expect(new Set(DEVICES.map((d) => PARTY_TRANSITIONS.T16[d].durationMs)).size).toBe(1);
  });
});

describe("reduced motion", () => {
  it("caps decorative durations but keeps semantic ones", () => {
    expect(partyCueDurationMs("T01", "tv", true)).toBe(200);
    expect(partyCueDurationMs("T01", "tv", false)).toBe(partyMs.arrival);
    expect(partyCueDurationMs("T05", "phone", true)).toBe(3000);
    expect(partyCueDurationMs("T19", "host", true)).toBe(5000);
  });

  it("strips movement from every shared variant", () => {
    for (const name of Object.keys(partyVariants) as (keyof typeof partyVariants)[]) {
      const reduced = partyMotion(name, true);
      for (const state of Object.values(reduced)) {
        const s = state as Record<string, unknown>;
        expect(s.y).toBe(0);
        expect(s.scale).toBe(1);
        expect(s.rotateY).toBe(0);
        expect(s.filter).toBe("none");
        expect(Array.isArray(s.opacity)).toBe(false);
      }
    }
    expect(partyMotion("cardEnter", false)).toBe(partyVariants.cardEnter);
  });

  it("keeps opacity of the original state", () => {
    const r = reduceVariants({ initial: { opacity: 0, y: 20 } });
    expect((r.initial as Record<string, unknown>).opacity).toBe(0);
  });
});

describe("animationProgress", () => {
  it("waits before start, fast-forwards late arrivals", () => {
    expect(animationProgress(1000, 400, 1200)).toEqual({ progress: 0, remainingMs: 1200, waitMs: 600 });
    expect(animationProgress(1000, 1600, 1200)).toEqual({ progress: 0.5, remainingMs: 600, waitMs: 0 });
    expect(animationProgress(1000, 9000, 1200).progress).toBe(1);
    expect(animationProgress(1000, 1000, 0).progress).toBe(1);
  });
});

describe("helpers", () => {
  it("fires the mapped haptic, ignores none", () => {
    const api = { success: vi.fn(), light: vi.fn() };
    firePartyHaptic(api, "success");
    firePartyHaptic(api, "none");
    expect(api.success).toHaveBeenCalledTimes(1);
    expect(api.light).not.toHaveBeenCalled();
  });

  it("readableOn picks the higher-contrast text colour", () => {
    expect(readableOn("#f9ca24")).toBe("#0b0b12");
    expect(readableOn("#6c5ce7")).toBe("#ffffff");
    for (const c of ["#df8eff", "#ff6b98", "#8ff5ff", "#f9ca24", "#00b894", "#0984e3", "#55efc4"]) {
      expect(contrastRatio(c, readableOn(c))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("TV phase beats", () => {
  it("exit, title, content and input open in order within the scene lead + 1 s", () => {
    const { exit, title, content, inputOpen } = TV_PHASE_BEATS;
    expect(exit).toBeLessThan(title);
    expect(title).toBeLessThan(content);
    expect(content).toBeLessThanOrEqual(inputOpen);
    expect(inputOpen).toBeLessThanOrEqual(SCENE_LEAD_MS + 1000);
  });
});
