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
    case 'answering':
      return sound(`hitbuzzer:${round}:buzz:${str(state.buzzedName)}:${num(state.answerDeadline, 0)}:${num(state.answerLeft, 0)}`, 'tick', '#8ff5ff');
    case 'reveal':
      return sound(`hitbuzzer:${round}:reveal`, 'reveal', '#ff2e88');
    default:
      return null;
  }
});

export const cues = { hitbuzzer };
