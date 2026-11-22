import { describe, expect, it } from 'vitest';
import {
  APP_SWITCHES, FEATURE_SWITCHES, appSwitchFor, gameFlagKey, gameIdFromFlagKey, hiddenEventTabs,
  hiddenGameIds, isManagedFlagKey, isSwitchedOff, visibleGames,
} from '../../src/lib/app-switches';
import { playableGames } from '../../src/lib/playable-games';

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

describe('game visibility', () => {
  const off = { is_enabled: true, rollout_percentage: 100 };

  it('names the row game_<id>_off for every playable game and maps it back', () => {
    for (const game of playableGames) {
      const key = gameFlagKey(game.id);
      expect(key).toBe(`game_${game.id}_off`);
      expect(gameIdFromFlagKey(key)).toBe(game.id);
    }
    expect(new Set(playableGames.map(game => gameFlagKey(game.id))).size).toBe(playableGames.length);
  });
  it('hides a game only for an enabled row at full rollout', () => {
    const hidden = hiddenGameIds([
      { key: 'game_bomb_off', ...off },
      { key: 'game_headup_off', is_enabled: false, rollout_percentage: 100 },
      { key: 'game_taboo_off', is_enabled: true, rollout_percentage: 50 },
      { key: 'game_brew_off', is_enabled: true, rollout_percentage: null },
    ]);
    expect([...hidden].sort()).toEqual(['bomb', 'brew']);
  });
  it('ignores rows that are not game switches', () => {
    const hidden = hiddenGameIds([
      { key: 'app_marketplace_off', ...off },
      { key: 'expenses_v2_off', ...off },
      { key: 'game__off', ...off },
      { key: 'game_bomb', ...off },
    ]);
    expect(hidden.size).toBe(0);
  });
  it('fails open: no rows (loading or error) hide nothing', () => {
    expect(hiddenGameIds([]).size).toBe(0);
    expect(hiddenGameIds(undefined).size).toBe(0);
    expect(hiddenGameIds(null).size).toBe(0);
    expect(visibleGames(playableGames, hiddenGameIds([]))).toHaveLength(playableGames.length);
  });
  it('keeps unknown ids harmless and filters only the hidden games', () => {
    const hidden = hiddenGameIds([{ key: 'game_does-not-exist_off', ...off }, { key: 'game_bomb_off', ...off }]);
    const visible = visibleGames(playableGames, hidden);
    expect(visible).toHaveLength(playableGames.length - 1);
    expect(visible.some(game => game.id === 'bomb')).toBe(false);
  });
  it('hides every playable game through its own key and none through a foreign one', () => {
    const rows = playableGames.map(game => ({ key: gameFlagKey(game.id), ...off }));
    expect(visibleGames(playableGames, hiddenGameIds(rows))).toHaveLength(0);
    expect(hiddenGameIds(rows.map(row => ({ ...row, is_enabled: false }))).size).toBe(0);
  });
  it('returns the very same list when nothing is hidden', () => {
    expect(visibleGames(playableGames, new Set())).toBe(playableGames);
  });
});

describe('managed flag keys', () => {
  it('claims area, game and feature kill switches but not other flags', () => {
    for (const entry of APP_SWITCHES) expect(isManagedFlagKey(entry.key)).toBe(true);
    for (const entry of FEATURE_SWITCHES) expect(isManagedFlagKey(entry.key)).toBe(true);
    expect(isManagedFlagKey('game_bomb_off')).toBe(true);
    expect(isManagedFlagKey('new_onboarding_flow')).toBe(false);
    expect(isManagedFlagKey('tv_mode_beta')).toBe(false);
  });
});
