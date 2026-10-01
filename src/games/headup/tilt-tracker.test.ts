import { describe, expect, it } from 'vitest';
import { gravityPitch, HeadUpTiltTracker } from './tilt-tracker';

describe('HeadUp first gesture', () => {
  it('preserves ready calibration and accepts the first downward gesture on word one', () => {
    const tracker = new HeadUpTiltTracker();
    tracker.sample(5, false);
    expect(tracker.armed).toBe(true);
    const actions = [42, 42, 42, 42].map(pitch => tracker.sample(pitch, true));
    expect(actions.filter(Boolean)).toEqual(['correct']);
  });
  it('accepts the first upward gesture without a sacrificial gesture', () => {
    const tracker = new HeadUpTiltTracker();
    tracker.sample(-5, false);
    expect([-42, -42, -42, -42].map(pitch => tracker.sample(pitch, true)).filter(Boolean)).toEqual(['skip']);
  });
  it('does not score during the ready countdown and follows the neutral forehead pose', () => {
    const tracker = new HeadUpTiltTracker();
    expect([85, 45, 10, 3].map(pitch => tracker.sample(pitch, false)).filter(Boolean)).toEqual([]);
    expect(tracker.sample(3, true)).toBeNull();
    expect(tracker.armed).toBe(true);
  });
  it('requires neutral return before scoring another word and resets for the next player', () => {
    const tracker = new HeadUpTiltTracker();
    tracker.sample(0, false);
    expect(Array.from({ length: 20 }, () => tracker.sample(45, true)).filter(Boolean)).toEqual(['correct']);
    for (let i = 0; i < 10; i++) tracker.sample(0, true);
    expect(Array.from({ length: 8 }, () => tracker.sample(-45, true)).filter(Boolean)).toEqual(['skip']);
    tracker.reset();
    expect(tracker.armed).toBe(false);
    expect(tracker.sample(85, true)).toBeNull();
    expect(tracker.armed).toBe(false);
  });
  it('ignores missing, zero and nonfinite sensor data', () => {
    expect(gravityPitch({ x: null, y: 9.8, z: 0 })).toBeNull();
    expect(gravityPitch({ x: 0, y: 0, z: 0 })).toBeNull();
    expect(gravityPitch({ x: NaN, y: 9.8, z: 0 })).toBeNull();
    expect(gravityPitch({ x: 0, y: 9.8, z: 0 })).toBe(0);
  });
});

// Physical device axes, not invented signed pitch labels. The forehead's
// downward answer gesture raises the measured screen-normal acceleration.
describe('physical forehead orientation', () => {
  for (const axis of [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}]) {
    it(`scores down then skips up with neutral gravity ${JSON.stringify(axis)}`, () => {
      const tracker = new HeadUpTiltTracker();
      const pitch = (degrees: number) => gravityPitch({
        x: axis.x * 9.81 * Math.cos(degrees * Math.PI / 180),
        y: axis.y * 9.81 * Math.cos(degrees * Math.PI / 180),
        z: 9.81 * Math.sin(degrees * Math.PI / 180),
      })!;
      tracker.sample(pitch(0), false);
      expect(Array.from({length: 12}, () => tracker.sample(pitch(50), true)).filter(Boolean)).toEqual(['correct']);
      for(let i = 0; i < 12; i++) tracker.sample(pitch(0), true);
      expect(Array.from({length: 12}, () => tracker.sample(pitch(-50), true)).filter(Boolean)).toEqual(['skip']);
    });
  }
  it('does not arm while lying flat, then accepts the first nod after lifting to the forehead', () => {
    const tracker = new HeadUpTiltTracker();
    tracker.sample(gravityPitch({x: 0, y: 0, z: 9.81})!, false);
    expect(tracker.armed).toBe(false);
    tracker.sample(gravityPitch({x: 9.81, y: 0, z: 0})!, true);
    expect(Array.from({length: 8}, () => tracker.sample(50, true)).filter(Boolean)).toEqual(['correct']);
  });
});
