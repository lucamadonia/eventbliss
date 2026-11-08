import { card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/** The cue never includes the private song or preview URL. */
const hitbuzzer: CueFn = stableCue((phase, state) => {
  const round = num(state.round, 1);
  switch (phase) {
    case 'loading':
      return card(`hitbuzzer:${round}:loading`, '#df8eff', 'chime',
        { key: 'gameRules.hitbuzzer.title', fallback: 'Hit-Buzzer' },
        { eyebrow: roundEyebrow(round, num(state.totalRounds, 0)),
          subtitle: { key: 'gameRules.hitbuzzer.tagline', fallback: 'Erkenne den Song schneller als die anderen.' } });
    case 'answering': {
      const left = num(state.answerLeft, 0);
      return left > 0 ? sound(`hitbuzzer:${round}:buzz:${str(state.buzzedName)}:${num(state.answerDeadline, 0)}:${left}`,
        left <= 3 ? 'buzzerUrgent' : 'buzzerTick', left <= 3 ? '#ff6b98' : '#8ff5ff') : null;
    }
    case 'listening': {
      const attempt = state.lastAttempt && typeof state.lastAttempt === 'object' && !Array.isArray(state.lastAttempt)
        ? state.lastAttempt as { outcome?: string; playerId?: string } : null;
      return attempt?.outcome === 'timeout' ? sound(`hitbuzzer:${round}:timeout:${str(attempt.playerId)}`, 'buzzerTimeout', '#ff6b98') : null;
    }
    case 'reveal':
      return sound(`hitbuzzer:${round}:reveal`, 'reveal', '#ff2e88');
    default:
      return null;
  }
});

export const cues = { hitbuzzer };
