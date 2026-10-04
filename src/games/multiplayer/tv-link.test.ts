import { describe, expect, it } from 'vitest';
import { tvLinked } from './tv-link';

describe('TV status in the connection bar', () => {
  it('is linked only while the TV heartbeat is fresh', () => {
    expect(tvLinked(0, 1_000, 30_000)).toBe(false);
    expect(tvLinked(10_000, 25_000, 30_000)).toBe(true);
    expect(tvLinked(10_000, 40_000, 30_000)).toBe(true);
    expect(tvLinked(10_000, 40_001, 30_000)).toBe(false);
  });
});
