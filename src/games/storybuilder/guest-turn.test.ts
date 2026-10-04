/**
 * STORY BUILDER mit Gaesten am Host-Handy: wer schreibt, wann alle Geraete
 * gemeinsam wechseln, und dass die Uhr waehrend der Uebergabe steht.
 */
import { describe, it, expect } from 'vitest';

import { phaseOfBeat, storyBeatKey, storyTurnClosed, writerSeat, writingClockRuns, writingTimedOut, type WritingClockInput } from './guest-turn';

describe('writerSeat', () => {
  it('nur beim Schreiben', () => {
    expect(writerSeat('writing', 'max')).toBe('max');
    expect(writerSeat('passing', 'max')).toBeNull();
    expect(writerSeat('storyReveal', 'max')).toBeNull();
    expect(writerSeat('writing', null)).toBeNull();
  });
});

describe('storyBeatKey', () => {
  it('jeder Zug ist ein eigener Takt, die Phase bleibt ablesbar', () => {
    const a = storyBeatKey('writing', 1, 0, 1);
    const b = storyBeatKey('writing', 1, 1, 1);
    const c = storyBeatKey('writing', 1, 1, 2);
    const d = storyBeatKey('writing', 2, 1, 2);
    expect(new Set([a, b, c, d]).size).toBe(4);
    expect(phaseOfBeat(c)).toBe('writing');
  });
  it('Phasen ohne Zug haben einen festen Schluessel', () => {
    expect(storyBeatKey('storyReveal', 3, 4, 1)).toBe('storyReveal');
    expect(phaseOfBeat('storyReveal')).toBe('storyReveal');
    expect(phaseOfBeat(storyBeatKey('passing', 1, 2, 1))).toBe('passing');
  });
});

describe('Schreib-Uhr', () => {
  const base: WritingClockInput = { phase: 'writing', seconds: 30, authoritative: true, handoverPaused: false, connected: true };

  it('laeuft beim Schreiben auf dem fuehrenden Geraet', () => {
    expect(writingClockRuns(base)).toBe(true);
  });

  it('steht waehrend der Uebergabe an einen Gast', () => {
    expect(writingClockRuns({ ...base, handoverPaused: true })).toBe(false);
    expect(writingTimedOut({ ...base, seconds: 0, handoverPaused: true })).toBe(false);
  });

  it('steht auf Mitspieler-Handys, ohne Verbindung und ausserhalb des Schreibens', () => {
    expect(writingClockRuns({ ...base, authoritative: false })).toBe(false);
    expect(writingClockRuns({ ...base, connected: false })).toBe(false);
    expect(writingClockRuns({ ...base, phase: 'passing' })).toBe(false);
    expect(writingClockRuns({ ...base, seconds: 0 })).toBe(false);
  });

  it('Zeit abgelaufen → Zug ueberspringen', () => {
    expect(writingTimedOut({ ...base, seconds: 0 })).toBe(true);
    expect(writingTimedOut({ ...base, seconds: 1 })).toBe(false);
    expect(writingTimedOut({ ...base, seconds: 0, authoritative: false })).toBe(false);
  });
});

describe("storyTurnClosed — „zu spaet“ nur bei beendetem Schreibzug", () => {
  it("naechster Satz desselben Zugs ist nicht zu spaet", () => {
    expect(storyTurnClosed("writing:1:2:1:4", "writing:1:2:2:5")).toBe(false);
  });
  it("anderer Schreiber, Runde oder Phase ist zu spaet", () => {
    expect(storyTurnClosed("writing:1:2:2:5", "writing:1:3:1:6")).toBe(true);
    expect(storyTurnClosed("writing:1:2:2:5", "writing:2:0:1:6")).toBe(true);
    expect(storyTurnClosed("writing:1:2:2:5", "reveal:1:2:2:6")).toBe(true);
  });
});
