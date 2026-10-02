import type { TFunction } from 'i18next';
import { availabilityChip, gameAvailability, type GameAvailability, type GameAvailabilityContext } from '@/lib/playable-games';
import type { RoomPlayer } from './room-types';

/**
 * Thin adapter from a room roster to the central `gameAvailability` rule:
 * 📱 = presence players other than the host, 🔁 = guests (`controlledBy`).
 * Quick rooms have no guests and every connected player plays.
 */
export function roomAvailabilityContext(players: readonly RoomPlayer[], hostId: string, options: {
  controllerParty: boolean; hostPlays?: boolean; hostPremium: boolean;
}): GameAvailabilityContext {
  return {
    mode: options.controllerParty ? 'controller-party' : 'online-room',
    phonePlayers: players.filter(player => !player.controlledBy && player.id !== hostId).length,
    guestPlayers: players.filter(player => player.controlledBy).length,
    hostPlays: players.some(player => player.id === hostId) && (options.hostPlays ?? true),
    hostPremium: options.hostPremium,
  };
}

export function roomGameAvailability(gameId: string, ...context: Parameters<typeof roomAvailabilityContext>): GameAvailability {
  return gameAvailability(gameId, roomAvailabilityContext(...context));
}

/** The shared chip text (same words on TV, host phone and online room); null when startable. */
export function availabilityLabel(t: TFunction, availability: GameAvailability): string | null {
  if (availability.startable) return null;
  const chip = availabilityChip(availability);
  return String(t(chip.key, chip.params));
}
