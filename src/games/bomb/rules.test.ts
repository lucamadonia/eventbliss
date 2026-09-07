import { it, expect } from 'vitest';
import { speedFuseMs } from './rules';
it('retains seconds-long fuses after many speed rounds', () => {
  for (const reduction of [0,3000,6000,12000,60000]) {
    const result = speedFuseMs(5,10,reduction);
    expect(result.min).toBeGreaterThanOrEqual(5000);
    expect(result.max).toBeGreaterThanOrEqual(8000);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
  }
});
