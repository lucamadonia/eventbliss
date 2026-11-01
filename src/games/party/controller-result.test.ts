import { describe, expect, it } from 'vitest';
import { controllerScores } from './controller-result';

describe('Hit-Buzzer controller party result', () => {
  it('credits every Joystick seat by ID, including team penalties', () => {
    const scores = controllerScores('hitbuzzer', {
      players: [{ id: 'A', name: 'Team A', score: 80 }, { id: 'B', name: 'Team B', score: -20 }],
      partyScoresById: { anna: 80, ben: 80, cem: -20, outsider: 900 },
    }, ['anna', 'ben', 'cem']);
    expect(scores).toEqual({ anna: 80, ben: 80, cem: -20 });
  });
});
