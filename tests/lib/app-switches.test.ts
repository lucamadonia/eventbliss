import { describe, expect, it } from 'vitest';
import { APP_SWITCHES, appSwitchFor, hiddenEventTabs, isSwitchedOff } from '../../src/lib/app-switches';

describe('app area switches', () => {
  it('keeps an area visible without a row, with a disabled row or with a partial rollout', () => {
    expect(isSwitchedOff(undefined)).toBe(false);
    expect(isSwitchedOff(null)).toBe(false);
    expect(isSwitchedOff({ is_enabled: false, rollout_percentage: 100 })).toBe(false);
    expect(isSwitchedOff({ is_enabled: true, rollout_percentage: 50 })).toBe(false);
  });
  it('hides an area only for an enabled row at full rollout', () => {
    expect(isSwitchedOff({ is_enabled: true, rollout_percentage: 100 })).toBe(true);
    expect(isSwitchedOff({ is_enabled: true, rollout_percentage: null })).toBe(true); // column default
  });
  it('maps each area to its event page tab', () => {
    expect(hiddenEventTabs({ marketplaceOff: false, servicesOff: false })).toEqual([]);
    expect(hiddenEventTabs({ marketplaceOff: true, servicesOff: false })).toEqual(['marketplace']);
    expect(hiddenEventTabs({ marketplaceOff: false, servicesOff: true })).toEqual(['dienstleister']);
    expect(hiddenEventTabs({ marketplaceOff: true, servicesOff: true })).toEqual(['marketplace', 'dienstleister']);
  });
  it('uses distinct snake_case keys that read as kill switches', () => {
    const keys = APP_SWITCHES.map(entry => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^app_[a-z_]+_off$/);
    expect(appSwitchFor('marketplace').key).toBe('app_marketplace_off');
    expect(appSwitchFor('services').key).toBe('app_services_off');
  });
});
