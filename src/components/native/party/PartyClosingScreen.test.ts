import { describe, expect, it } from 'vitest';
import { podiumOrder } from './PartyClosingScreen';

describe('podiumOrder', () => {
  it('puts the winner in the middle: 2 · 1 · 3', () => {
    expect(podiumOrder(['gold', 'silver', 'bronze'])).toEqual(['silver', 'gold', 'bronze']);
  });
  it('handles fewer than three finishers', () => {
    expect(podiumOrder(['gold', 'silver'])).toEqual(['silver', 'gold']);
    expect(podiumOrder(['gold'])).toEqual(['gold']);
    expect(podiumOrder([])).toEqual([]);
  });
});
