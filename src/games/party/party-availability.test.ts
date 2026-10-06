import { describe, expect, it } from 'vitest';
import type { ControllerMember, ControllerPartyData } from './controller-api';
import {
  availabilityStatus, availabilityText, controllerAvailabilityContext, controllerGameAvailability, joinNames, nextAvailableIndex, sitOutHint, sittingOutNames,
} from './party-availability';

const t = (_key: string, fallback: string, options: Record<string, unknown> = {}) =>
  fallback.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name]));
const seat = (over: Partial<ControllerMember>): ControllerMember => ({
  user_id: 'u', player_id: 'p', name: 'N', is_host: false, avatar: '🎉', color: '#df8eff', controlled_by: null, pending_claim: false, ...over,
});
const party = (members: ControllerMember[], over: Partial<ControllerPartyData['party']> = {}): ControllerPartyData => ({
  party: { id: 'x', code: 'ABCDEF', revision: 1, host_user_id: 'h', host_player_id: 'h', host_plays: true, premium: false,
    status: 'lobby', playlist: [], current_match_id: null, current_game_id: null, ...over },
  members, results: [],
});
// Host + Lena (📱) + Max & Gerda (🔁) → 4 active seats in released games.
const mixed = party([
  seat({ player_id: 'h', user_id: 'h', is_host: true, name: 'Luca' }),
  seat({ player_id: 'l', user_id: 'l', name: 'Lena' }),
  seat({ player_id: 'm', user_id: null, controlled_by: 'h', name: 'Max' }),
  seat({ player_id: 'g', user_id: null, controlled_by: 'h', name: 'Gerda' }),
  seat({ player_id: 'b', user_id: 'b', name: 'Banned', banned: true }),
]);

describe('controllerAvailabilityContext', () => {
  it('counts phones without the Host, guests apart, ignores banned seats', () => {
    expect(controllerAvailabilityContext(mixed)).toEqual({ mode: 'controller-party', phonePlayers: 1, guestPlayers: 2, hostPlays: true, hostPremium: false });
  });
});

describe('controllerGameAvailability', () => {
  it('counts guests for a four-player game', () => {
    const taboo = controllerGameAvailability('taboo', mixed);
    expect(taboo).toMatchObject({ plannable: true, startable: true, reason: null, activePlayers: 4, sittingOut: 0 });
    expect(availabilityText(taboo, t, sittingOutNames('taboo', mixed))).toBeNull();
    expect(availabilityStatus(taboo)).toBe('fits');
  });

  it('includes guests in a small game without a sit-out hint', () => {
    const headup = controllerGameAvailability('headup', mixed);
    expect(headup).toMatchObject({ startable: true, activePlayers: 4, sittingOut: 0 });
    expect(sitOutHint(headup, t, sittingOutNames('headup', mixed))).toBeNull();
    expect(availabilityStatus(headup)).toBe('fits');
  });

  it('blocks premium games without premium, even for planning', () => {
    const impostor = controllerGameAvailability('hochstapler', mixed);
    expect(impostor).toMatchObject({ plannable: false, startable: false, reason: 'premium' });
    expect(availabilityText(impostor, t)).toBe('Premium');
  });

  it('allows large Ohrwurm teams up to the controller-party limit', () => {
    const big = party(Array.from({ length: 9 }, (_, i) => seat({ player_id: `p${i}`, user_id: `u${i}`, is_host: i === 0 })));
    const ohrwurm = controllerGameAvailability('ohrwurm', big);
    expect(ohrwurm).toMatchObject({ plannable: true, startable: true, activePlayers: 9 });
    expect(availabilityText(ohrwurm, t)).toBeNull();
  });

  it('says how many are still missing when there are simply too few', () => {
    const two = party([seat({ player_id: 'h', is_host: true }), seat({ player_id: 'a' })]);
    const taboo = controllerGameAvailability('taboo', two);
    expect(taboo).toMatchObject({ plannable: true, startable: false });
    expect(availabilityText(taboo, t)).toBe('wartet auf 2 Spieler');
  });
});

describe('helpers', () => {
  it('joins names naturally', () => {
    expect(joinNames([], 'de')).toBe('');
    expect(joinNames(['Max'], 'de')).toBe('Max');
    expect(joinNames(['Max', 'Tom', 'Gerda'], 'de')).toBe('Max, Tom und Gerda');
    expect(joinNames(['Max', 'Gerda'], 'en')).toBe('Max and Gerda');
  });

  it('skips unavailable playlist entries', () => {
    const ok = (id: string) => id !== 'taboo';
    expect(nextAvailableIndex(['taboo', 'taboo', 'bomb'], 0, ok)).toBe(2);
    expect(nextAvailableIndex(['taboo'], 0, ok)).toBe(-1);
    expect(nextAvailableIndex(['bomb'], -3, ok)).toBe(0);
  });

  it('no sit-out hint without guests', () => {
    const solo = party([seat({ player_id: 'h', is_host: true }), seat({ player_id: 'a' })]);
    expect(sitOutHint(controllerGameAvailability('bomb', solo), t, sittingOutNames('bomb', solo))).toBeNull();
  });
});
