import { describe, expect, it } from 'vitest';
import { cues } from './hitbuzzer.cue';

describe('Hit-Buzzer TV answer sounds', () => {
  it('ticks once per second, intensifies at three seconds, and sounds a timeout', () => {
    const base = { round: 2, buzzedName: 'Mia', answerDeadline: 12_000 };
    const start = cues.hitbuzzer('answering', { ...base, answerLeft: 8 });
    const next = cues.hitbuzzer('answering', { ...base, answerLeft: 7 });
    const urgent = cues.hitbuzzer('answering', { ...base, answerLeft: 3 });
    expect(start?.sound).toBe('buzzerTick');
    expect(next?.key).not.toBe(start?.key);
    expect(urgent?.sound).toBe('buzzerUrgent');
    expect(cues.hitbuzzer('answering', { ...base, answerLeft: 0 })).toBeNull();
    expect(cues.hitbuzzer('listening', { round: 2, lastAttempt: { playerId: 'a', outcome: 'timeout' } })?.sound).toBe('buzzerTimeout');
    expect(cues.hitbuzzer('reviewing', { ...base, artist: 'SECRET', title: 'SECRET' })).toBeNull();
  });
});
