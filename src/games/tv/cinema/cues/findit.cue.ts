import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Wo ist was?: Karte zum Rundenstart (Einpraegen bzw. erste Frage / Ortsfrage).
 * Nie Frage, Optionen, Zielfelder oder den gesuchten Ort auf der Karte.
 */
const findit: CueFn = (phase, s) => {
  const round = num(s.round, 1);
  const q = num(s.questionIdx, 0);
  const mode = str(s.mode);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'study':
      return card(`findit:${round}:study`, '#22d3ee', 'chime', { key: 'tvCinema.findIt.memorize', fallback: 'Einprägen' },
        { eyebrow, subtitle: { key: 'tvCinema.findIt.memorizeSub', fallback: 'Merkt euch, was wo liegt' } });
    case 'streetviewPlay':
      return card(`findit:${round}:geo`, ACCENT.amber, 'chime', { key: 'tvCinema.findIt.whichCity', fallback: 'Welche Stadt ist das?' }, { eyebrow });
    case 'question':
      if (mode === 'karte' || mode === 'streetview') {
        return card(`findit:${round}:geo`, ACCENT.amber, 'chime', { key: 'tvCinema.findIt.whereIsIt', fallback: 'Wo liegt das?' }, { eyebrow });
      }
      if (mode === 'unterschiede') {
        return card(`findit:${round}:diff`, ACCENT.purple, 'chime', { key: 'tvCinema.findIt.spotDiffs', fallback: 'Findet die Unterschiede' }, { eyebrow });
      }
      // Speed beginnt direkt mit der ersten Frage → Karte; danach (und bei Memory) nur ein Ton.
      return mode === 'speed' && q === 0
        ? card(`findit:${round}:q0`, ACCENT.purple, 'chime', { key: 'tvCinema.findIt.guessAlong', fallback: 'Mitraten' }, { eyebrow })
        : sound(`findit:${round}:q${q}`, 'tick', ACCENT.purple);
    case 'answer':
      return sound(`findit:${round}:a${q}`, 'reveal', ACCENT.green);
    case 'roundEnd':
      return sound(`findit:${round}:end`, 'reveal', ACCENT.amber);
    case 'gameOver':
      return sound('findit:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { findit };
