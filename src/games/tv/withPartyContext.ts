/**
 * withPartyContext — match a per-game roster against the Party Night standings
 * so every TV view can show "wo stehe ich heute Abend?" inline.
 *
 * The per-game rosters and the party roster are NOT guaranteed to share ids
 * (some games key players by turn index, others by uuid), so matching prefers
 * `id` and falls back to a normalised name.
 *
 * Misattributing someone else's points is worse than showing no chip, so:
 *   - a name that two party players share is treated as unmatchable,
 *   - a roster player with no match simply gets no party fields,
 *   - an explicit partyRank already on the player always wins.
 *
 * Pure and free of React — TVScoreboard calls it inside its own useMemo.
 */
import type { PartyNightState, PartyStanding } from './party-types';

export interface PartyRosterEntry {
  id?: string;
  name?: string;
  partyRank?: number;
  partyPoints?: number;
}

/** trim → strip diacritics → lowercase → collapse inner whitespace */
export function normalisePlayerName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export interface PartyIndex {
  byId: Map<string, PartyStanding>;
  /** a `null` value marks an ambiguous name that must NOT be matched */
  byName: Map<string, PartyStanding | null>;
}

export function buildPartyIndex(standings: PartyStanding[]): PartyIndex {
  const byId = new Map<string, PartyStanding>();
  const byName = new Map<string, PartyStanding | null>();

  for (const standing of standings) {
    if (standing.id) byId.set(standing.id, standing);
    if (!standing.name) continue;
    const key = normalisePlayerName(standing.name);
    if (!key) continue;
    // Second sighting of a name => ambiguous, poison the entry.
    byName.set(key, byName.has(key) ? null : standing);
  }

  return { byId, byName };
}

export function findPartyStanding(
  player: { id?: string; name?: string },
  index: PartyIndex,
): PartyStanding | undefined {
  if (player.id) {
    const byId = index.byId.get(player.id);
    if (byId) return byId;
  }
  if (player.name) {
    const byName = index.byName.get(normalisePlayerName(player.name));
    if (byName) return byName;
  }
  return undefined;
}

/**
 * Returns a copy of `players` with `partyRank` / `partyPoints` merged in.
 *
 * Returns the ORIGINAL array reference whenever nothing would change (no party
 * night, empty standings, or not a single match). That keeps `TVScoreboard`'s
 * memo intact and guarantees every view is pixel-identical without a party.
 */
export function withPartyContext<T extends PartyRosterEntry>(
  players: T[],
  party?: PartyNightState | null,
): T[] {
  if (!party?.active) return players;
  const standings = party.standings;
  if (!Array.isArray(standings) || !standings.length || !players.length) return players;

  const index = buildPartyIndex(standings);
  let matched = false;

  const merged = players.map((player) => {
    // An explicitly supplied value always wins over the derived one.
    if (typeof player.partyRank === 'number') return player;
    const standing = findPartyStanding(player, index);
    if (!standing) return player;
    matched = true;
    return { ...player, partyRank: standing.rank, partyPoints: standing.points };
  });

  return matched ? merged : players;
}

export default withPartyContext;
