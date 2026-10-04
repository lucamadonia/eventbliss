import { describe, expect, it } from 'vitest';
import { dropFromTurnOrder } from './turn-order';

const order = ['a', 'b', 'c', 'd'].map(id => ({ id }));
const ids = (r: ReturnType<typeof dropFromTurnOrder<{ id: string }>>) => r?.players.map(p => p.id);

describe('FIND IT turn order after a mid-match removal', () => {
  it('ignores ids that are not in the order', () => {
    expect(dropFromTurnOrder(order, 1, ['x'])).toBeNull();
  });
  it('keeps the active player on turn when someone else leaves', () => {
    const r = dropFromTurnOrder(order, 2, ['a']);
    expect(ids(r)).toEqual(['b', 'c', 'd']);
    expect(r).toMatchObject({ currentIdx: 1, advance: false, wrapped: false });
  });
  it('hands the turn to the next remaining player when the active one leaves', () => {
    const r = dropFromTurnOrder(order, 1, ['b', 'c']);
    expect(ids(r)).toEqual(['a', 'd']);
    expect(r).toMatchObject({ currentIdx: 1, advance: true, wrapped: false });
  });
  it('starts a new round when the removed active player was last in the order', () => {
    expect(dropFromTurnOrder(order, 3, ['d'])).toMatchObject({ currentIdx: 0, advance: true, wrapped: true });
  });
  it('re-targets a pending hand-over away from the removed next player', () => {
    expect(dropFromTurnOrder(order, 1, ['c'], true)).toMatchObject({ currentIdx: 2, advance: true, wrapped: false });
    expect(dropFromTurnOrder(order, 2, ['d'], true)).toMatchObject({ currentIdx: 0, advance: true, wrapped: true });
  });
  it('returns an empty order without a turn when everyone left', () => {
    expect(dropFromTurnOrder(order, 0, ['a', 'b', 'c', 'd'])).toMatchObject({ players: [], advance: false });
  });
});
