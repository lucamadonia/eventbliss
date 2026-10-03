import { describe, expect, it } from 'vitest';
import { FRAME_RATIO_MAX, FRAME_RATIO_MIN, frameHeightFor } from './pixelate';

describe('frameHeightFor', () => {
  it('takes on the image aspect ratio so contain leaves no empty bars', () => {
    expect(frameHeightFor(960, 800, 600, 720)).toBe(720);
    expect(frameHeightFor(960, 1000, 1000, 720)).toBe(960);
  });
  it('clamps extreme portraits and panoramas', () => {
    expect(frameHeightFor(960, 100, 1000, 720)).toBe(Math.round(960 * FRAME_RATIO_MAX));
    expect(frameHeightFor(960, 4000, 1000, 720)).toBe(Math.round(960 * FRAME_RATIO_MIN));
  });
  it('falls back for unknown sizes', () => {
    expect(frameHeightFor(960, 0, 600, 720)).toBe(720);
    expect(frameHeightFor(0, 800, 600, 720)).toBe(720);
  });
});
