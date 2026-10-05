import { describe, expect, it } from 'vitest';
import { tvLeaderboardScores } from './tv-leaderboard-scores';

describe('tvLeaderboardScores', () => {
  it('uses the room score for Bombe players that only carry penalties', () => {
    expect(tvLeaderboardScores(
      [{ id: 'a', name: 'Anna', penalties: 2 }, { id: 'b', name: 'Ben', penalties: 0, color: '#123456' }],
      { a: 0, b: 2 },
    )).toEqual([
      { name: 'Ben', score: 2, color: '#123456' },
      { name: 'Anna', score: 0, color: '#df8eff' },
    ]);
  });

  it('rejects incomplete and non-finite scoreboards before the TV renders them', () => {
    expect(tvLeaderboardScores([{ name: 'Anna', score: undefined }])).toEqual([]);
    expect(tvLeaderboardScores([{ name: 'Anna', score: 1 }, { name: 'Ben' }])).toEqual([]);
    expect(tvLeaderboardScores([{ name: 'Anna', score: Number.NaN }])).toEqual([]);
  });
});
