/**
 * party-availability.ts — which games a party may plan or start right now.
 *
 * No rule of its own: the context is built from the server members and handed
 * to the ONE rule `gameAvailability` (src/lib/playable-games.ts); its
 * `availabilityChip` is translated here. Adds only the names for the E03 hint
 * „Max & Gerda setzen aus“. Pure, no React.
 */
import {
  availabilityChip, gameAvailability, guestPolicy, joinNames, type AvailabilityChip, type GameAvailability, type GameAvailabilityContext,
} from '@/lib/playable-games';
import type { ControllerPartyData } from './controller-api';

export type Translate = (key: string, fallback: string, options?: Record<string, unknown>) => string;

export function controllerAvailabilityContext(data: ControllerPartyData): GameAvailabilityContext {
  const active = data.members.filter(m => !m.banned);
  return {
    mode: 'controller-party',
    phonePlayers: active.filter(m => !m.is_host && m.controlled_by == null).length,
    guestPlayers: active.filter(m => m.controlled_by != null).length,
    hostPlays: data.party.host_plays,
    hostPremium: data.party.premium,
  };
}

export const controllerGameAvailability = (gameId: string, data: ControllerPartyData): GameAvailability =>
  gameAvailability(gameId, controllerAvailabilityContext(data));

/** Names of the 🔁 guests who sit this game out (guest policy `sitout`). */
export function sittingOutNames(gameId: string, data: ControllerPartyData): string[] {
  if (guestPolicy(gameId) !== 'sitout') return [];
  return data.members.filter(m => !m.banned && m.controlled_by != null).map(m => m.name);
}

/** Locale-aware name list (Intl.ListFormat): „Max und Gerda“, „Max and Gerda“. */
export { joinNames };

const CHIP_DEFAULTS: Record<string, string> = {
  'partyPlay.availability.ready': 'passt',
  'partyPlay.availability.sitout': '{{names}} setzen aus',
  'partyPlay.availability.sitoutCount': '{{count}} setzen aus',
  'partyPlay.availability.waiting': 'wartet auf {{count}} Spieler',
  'partyPlay.availability.guestsSitOut': '{{sittingOut}} setzen aus – wartet auf {{count}} Spieler',
  'partyPlay.availability.guestsSitOutNames': '{{names}} setzen aus – wartet auf {{count}} Spieler',
  'partyPlay.availability.tooMany': 'max. {{max}} Spieler',
  'partyPlay.availability.premium': 'Premium',
  'partyPlay.availability.unknown': 'nicht verfügbar',
};

/** The shared chip (`availabilityChip`) for a game, with the names of guests who sit out. */
export const chipFor = (availability: GameAvailability, sitOut: readonly string[] = [], locale?: string): AvailabilityChip =>
  availabilityChip(availability, { sittingOutNames: sitOut, locale });

/** The chip in words. */
export function chipText(chip: AvailabilityChip, t: Translate): string {
  return t(chip.key, CHIP_DEFAULTS[chip.key] ?? chip.key, chip.params);
}

/** Chip text for a game that cannot start now; null when it can. */
export function availabilityText(availability: GameAvailability, t: Translate, sitOut: readonly string[] = [], locale?: string): string | null {
  return availability.startable ? null : chipText(chipFor(availability, sitOut, locale), t);
}

/** E03: a startable game in which guests sit out — said before it starts. */
export function sitOutHint(availability: GameAvailability, t: Translate, sitOut: readonly string[], locale?: string): string | null {
  if (!availability.startable || availability.sittingOut <= 0) return null;
  return chipText(chipFor(availability, sitOut, locale), t);
}

/** First playlist entry from `from` that can START now, -1 if none. */
export function nextAvailableIndex(playlist: readonly string[], from: number, startable: (gameId: string) => boolean): number {
  for (let i = Math.max(0, from); i < playlist.length; i++) if (startable(playlist[i])) return i;
  return -1;
}

/** QA status of a planned entry, read from the shared chip (no rule of its own). */
export function availabilityStatus(availability: GameAvailability): 'fits' | 'sitout' | 'too-many' | 'too-few' | 'premium' {
  const variant = availabilityChip(availability).variant;
  if (variant === 'fits' || variant === 'sitout') return variant;
  if (variant === 'waiting') return 'too-few';
  return variant === 'too_many' ? 'too-many' : 'premium';
}
