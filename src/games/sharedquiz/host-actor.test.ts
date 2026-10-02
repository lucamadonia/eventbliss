import { describe, expect, it } from 'vitest';
import { hostActor } from './host-actor';

describe('host device acting for its own seat and its guests', () => {
  const seats = ['host', 'max', 'gerda'];
  it('acts for the host first when the host may act', () => {
    expect(hostActor(seats, () => true, () => false)).toBe('host');
  });
  it('acts for a guest whose turn it is even though the host may not', () => {
    expect(hostActor(seats, seat => seat === 'max', () => false)).toBe('max');
  });
  it('moves on to the next guest once a seat used the action this turn (e.g. votes, ready)', () => {
    const used = new Set(['host']);
    expect(hostActor(seats, () => true, seat => used.has(seat))).toBe('max');
    used.add('max');
    expect(hostActor(seats, () => true, seat => used.has(seat))).toBe('gerda');
    used.add('gerda');
    expect(hostActor(seats, () => true, seat => used.has(seat))).toBeUndefined();
  });
  it('never acts for seats that are not this device’s', () => {
    expect(hostActor(['host'], seat => seat === 'lena', () => false)).toBeUndefined();
  });
});
