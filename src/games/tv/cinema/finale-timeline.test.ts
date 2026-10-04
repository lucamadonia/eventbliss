import { describe, expect, it } from 'vitest';
import { confettiBurst } from '@/lib/party-motion';
import { FINALE_AT, finaleBeat, finaleSchedule } from './finale-timeline';

describe('finale timeline', () => {
  it('reveals the podium exactly when the phones fire their confetti', () => {
    expect(FINALE_AT[1]).toBe(confettiBurst.afterDrumrollMs);
    expect(finaleBeat(confettiBurst.afterDrumrollMs - 1)).toBe(0);
    expect(finaleBeat(confettiBurst.afterDrumrollMs)).toBe(1);
  });

  it('waits through the drumroll when the scene starts in the future', () => {
    const s = finaleSchedule(-500);
    expect(s).toMatchObject({ beat: 0, live: true });
    expect(s.next[0]).toEqual({ beat: 1, inMs: FINALE_AT[1] + 500 });
  });

  it('shows the finished picture at once for a late TV — no replayed fanfare', () => {
    const s = finaleSchedule(60_000);
    expect(s).toEqual({ beat: 3, live: false, next: [] });
  });

  it('joins mid-ceremony with only the remaining beats', () => {
    const s = finaleSchedule(FINALE_AT[1] + 200);
    expect(s.beat).toBe(1);
    expect(s.live).toBe(false);
    expect(s.next.map((n) => n.beat)).toEqual([2, 3]);
    expect(s.next[0].inMs).toBe(FINALE_AT[2] - FINALE_AT[1] - 200);
  });
});
