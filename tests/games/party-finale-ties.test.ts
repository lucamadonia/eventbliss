import { describe, expect, it } from 'vitest';
import { partyChampions } from '@/games/party/standings';
import type { PartyStanding } from '@/games/tv/party-types';
const player = (id: string, points: number): PartyStanding => ({ id, name: id, points, rank: 1, prevRank: null, gamesWon: 0, streak: 0, color: '#fff' });
describe('party finale joint champions', () => {
  it('keeps all equal leaders instead of crowning only the first sorted name', () => {
    expect(partyChampions([player('second', 10), player('Anna', 20), player('Ben', 20)]).map(p => p.id)).toEqual(['Anna', 'Ben']);
  });
  it('includes every tied participant even beyond the three podium places', () => {
    expect(partyChampions(Array.from({length: 12}, (_, i) => player(String(i), 0)))).toHaveLength(12);
    expect(partyChampions([])).toEqual([]);
    expect(partyChampions([player('invalid', NaN)])).toEqual([]);
  });
});
