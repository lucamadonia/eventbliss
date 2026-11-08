import { describe, expect, it } from 'vitest';
import { archivePartyPlayer } from './usePartySession';
import { createPartyPlayer, createPartySession } from '@/games/party/session-schema';
import { derivePartyStandings } from '@/games/party/standings';

function session() {
  const s = createPartySession('s');
  const tom = { ...createPartyPlayer('tom', 'Tom', 0), totalScore: 7, gamesPlayed: 2, gamesWon: 1 };
  s.players = [tom, createPartyPlayer('lea', 'Lea', 1), createPartyPlayer('new', 'Neu', 2)];
  return s;
}

describe('archivePartyPlayer', () => {
  it('keeps a departed player in history but removes them from current standings', () => {
    const next = archivePartyPlayer(session(), 'tom');
    expect(next.players.map(p => p.id)).toEqual(['lea', 'new']);
    expect(next.archivedPlayers?.map(p => [p.id, p.totalScore])).toEqual([['tom', 7]]);
    expect(derivePartyStandings(next.players, next.gameHistory).some(row => row.id === 'tom')).toBe(false);
  });

  it('drops a player who never played', () => {
    const next = archivePartyPlayer(session(), 'new');
    expect(next.players.map(p => p.id)).toEqual(['tom', 'lea']);
    expect(next.archivedPlayers ?? []).toEqual([]);
  });

  it('allows going below two players and ignores unknown ids', () => {
    let s = archivePartyPlayer(session(), 'tom');
    s = archivePartyPlayer(s, 'lea');
    expect(s.players).toHaveLength(1);
    expect(archivePartyPlayer(s, 'nobody')).toBe(s);
  });
});
