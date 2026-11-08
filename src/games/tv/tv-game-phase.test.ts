import { describe, expect, it } from 'vitest';
import { showsGenericLeaderboard } from './tv-game-phase';

describe('TV game phase routing', () => {
  it('keeps Pixeljagd on its own reveal scene at round end', () => {
    expect(showsGenericLeaderboard('pixeljagd', 'roundEnd')).toBe(false);
  });

  it('still uses the shared scoreboard for regular leaderboard phases', () => {
    expect(showsGenericLeaderboard('pixeljagd', 'leaderboard')).toBe(true);
    expect(showsGenericLeaderboard('quiz', 'roundEnd')).toBe(true);
  });
});
