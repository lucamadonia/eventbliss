import { describe, it, expect } from 'vitest';
import {
  normalisePlayerName,
  buildPartyIndex,
  findPartyStanding,
  withPartyContext,
} from './withPartyContext';
import type { PartyNightState, PartyStanding } from './party-types';

/**
 * What a per-game roster row looks like on the way IN: the party fields are
 * optional and only get filled by the merge. Without this annotation TS infers
 * the narrow literal type from each fixture and the merged fields are not
 * visible on the result.
 */
type GameRosterPlayer = {
  id: string;
  name: string;
  score?: number;
  partyRank?: number;
  partyPoints?: number;
};

function standing(over: Partial<PartyStanding> & { id: string; name: string }): PartyStanding {
  return {
    color: '#df8eff',
    points: 0,
    rank: 1,
    prevRank: null,
    gamesWon: 0,
    streak: 0,
    ...over,
  };
}

const PARTY: PartyNightState = {
  active: true,
  playlist: [],
  index: 0,
  finishedThrough: 0,
  history: [],
  phase: 'ingame',
  standings: [
    standing({ id: 'p1', name: 'Sören', points: 40, rank: 1 }),
    standing({ id: 'p2', name: 'Lisa', points: 25, rank: 2 }),
  ],
};

describe('normalisePlayerName', () => {
  it('trims, lowercases and collapses inner whitespace', () => {
    expect(normalisePlayerName('  Max   Mustermann ')).toBe('max mustermann');
  });

  it('strips diacritics so Sören matches Soren', () => {
    expect(normalisePlayerName('Sören')).toBe('soren');
    expect(normalisePlayerName('José')).toBe('jose');
    expect(normalisePlayerName('Sören')).toBe(normalisePlayerName('SOREN'));
  });
});

describe('buildPartyIndex / findPartyStanding', () => {
  it('matches on id first', () => {
    const index = buildPartyIndex(PARTY.standings);
    expect(findPartyStanding({ id: 'p2', name: 'irrelevant' }, index)?.name).toBe('Lisa');
  });

  it('falls back to a normalised name when the id does not match', () => {
    const index = buildPartyIndex(PARTY.standings);
    expect(findPartyStanding({ id: '0', name: 'soren' }, index)?.id).toBe('p1');
  });

  it('refuses to match a name two party players share', () => {
    const index = buildPartyIndex([
      standing({ id: 'a', name: 'Chris', points: 10 }),
      standing({ id: 'b', name: 'chris', points: 99 }),
    ]);
    expect(findPartyStanding({ name: 'Chris' }, index)).toBeUndefined();
    // ids still resolve — only the ambiguous NAME is poisoned
    expect(findPartyStanding({ id: 'b', name: 'Chris' }, index)?.points).toBe(99);
  });

  it('returns undefined for an unknown player', () => {
    expect(findPartyStanding({ id: 'zzz', name: 'Gast' }, buildPartyIndex(PARTY.standings))).toBeUndefined();
  });
});

describe('withPartyContext', () => {
  it('merges rank and points onto matching players', () => {
    const roster: GameRosterPlayer[] = [{ id: 'p1', name: 'Sören', score: 3 }, { id: 'p2', name: 'Lisa', score: 1 }];
    const merged = withPartyContext(roster, PARTY);
    expect(merged[0]).toMatchObject({ score: 3, partyRank: 1, partyPoints: 40 });
    expect(merged[1]).toMatchObject({ score: 1, partyRank: 2, partyPoints: 25 });
  });

  it('matches by name when the game roster keys players by turn index', () => {
    const roster: GameRosterPlayer[] = [{ id: '0', name: 'Lisa' }, { id: '1', name: 'Sören' }];
    const merged = withPartyContext(roster, PARTY);
    expect(merged[0].partyRank).toBe(2);
    expect(merged[1].partyRank).toBe(1);
  });

  it('leaves an unmatched guest without party fields', () => {
    const roster: GameRosterPlayer[] = [{ id: 'p1', name: 'Sören' }, { id: 'gast', name: 'Gast' }];
    const merged = withPartyContext(roster, PARTY);
    expect(merged[0].partyRank).toBe(1);
    expect(merged[1]).not.toHaveProperty('partyRank');
  });

  it('never overwrites an explicitly supplied partyRank', () => {
    const roster: GameRosterPlayer[] = [{ id: 'p1', name: 'Sören', partyRank: 9, partyPoints: 999 }];
    const merged = withPartyContext(roster, PARTY);
    expect(merged[0].partyRank).toBe(9);
    expect(merged[0].partyPoints).toBe(999);
  });

  // The regression bar: absent party context must change nothing at all.
  it('returns the SAME array reference when there is no party context', () => {
    const roster = [{ id: 'p1', name: 'Sören' }];
    expect(withPartyContext(roster, undefined)).toBe(roster);
    expect(withPartyContext(roster, null)).toBe(roster);
    expect(withPartyContext(roster, { ...PARTY, active: false })).toBe(roster);
    expect(withPartyContext(roster, { ...PARTY, standings: [] })).toBe(roster);
  });

  it('returns the SAME array reference when nothing matched', () => {
    const roster = [{ id: 'x', name: 'Niemand' }];
    expect(withPartyContext(roster, PARTY)).toBe(roster);
  });

  it('survives standings with missing names', () => {
    const ragged = { ...PARTY, standings: [standing({ id: 'p1', name: '' })] };
    expect(() => withPartyContext([{ id: 'p1', name: 'A' }], ragged)).not.toThrow();
  });
});
