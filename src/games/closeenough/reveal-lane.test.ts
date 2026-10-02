import { describe, expect, it } from 'vitest';
import { revealLaneHeight } from './reveal-lane';

describe('revealLaneHeight', () => {
  it('keeps the phone lane fixed', () => {
    expect(revealLaneHeight({ tv: false, lanes: 6, viewportH: 844 })).toBe(40);
  });

  it('scales with the TV height for 3 m legibility', () => {
    expect(revealLaneHeight({ tv: true, lanes: 1, viewportH: 1080 })).toBe(97);
    expect(revealLaneHeight({ tv: true, lanes: 1, viewportH: 2160 })).toBe(194);
    expect(revealLaneHeight({ tv: true, lanes: 1, viewportH: 600 })).toBe(62);
  });

  it('shrinks when many guesses stack so the axis stays on screen', () => {
    const h = revealLaneHeight({ tv: true, lanes: 6, viewportH: 1080 });
    expect(h * 6).toBeLessThanOrEqual(1080 * 0.42);
    expect(revealLaneHeight({ tv: true, lanes: 20, viewportH: 1080 })).toBe(48);
  });
});
