import { describe, expect, it } from 'vitest';
import { canBuzzForSeat } from './buzz-access';

describe('Hit-Buzzer seat takeover', () => {
  it('moves buzzer control from a host guest to that guest’s own phone', () => {
    const atHost = [{ id: 'host' }, { id: 'mia', controlledBy: 'host' }];
    expect(canBuzzForSeat(atHost, 'host', 'mia')).toBe(true);
    expect(canBuzzForSeat(atHost, 'mia', 'mia')).toBe(true);

    const onOwnPhone = [{ id: 'host' }, { id: 'mia' }];
    expect(canBuzzForSeat(onOwnPhone, 'host', 'mia')).toBe(false);
    expect(canBuzzForSeat(onOwnPhone, 'mia', 'mia')).toBe(true);
    expect(canBuzzForSeat(onOwnPhone, 'other', 'mia')).toBe(false);
    expect(canBuzzForSeat([{ id: 'host' }], 'mia', 'mia')).toBe(false);
  });
});
