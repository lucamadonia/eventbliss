import { ACCENT, card, num, roundEyebrow, sound, type CueFn } from './cue-kit';

/**
 * Kategorie: Karte zum Rundenstart; die Kategorie selbst knallt danach in der
 * Szene (sie ist oeffentlich, steht aber bewusst NICHT auf der Karte, damit der
 * grosse Auftritt in der Szene der Moment bleibt).
 */
const category: CueFn = (phase, s) => {
  const round = num(s.currentRound, num(s.round, 1));
  const eyebrow = roundEyebrow(round);
  switch (phase) {
    case 'categoryReveal':
      return card(`category:${round}:reveal`, ACCENT.cyan, 'reveal', { key: 'tvCinema.category.newCategory', fallback: 'Neue Kategorie' },
        { eyebrow, subtitle: { key: 'tvCinema.category.newCategorySub', fallback: 'Reihum nennen – wer zögert, verliert' } });
    case 'playing':
      return sound(`category:${round}:playing`, 'chime', ACCENT.purple);
    case 'roundEnd':
      return sound(`category:${round}:end`, 'wrong', ACCENT.red);
    case 'gameOver':
      return sound('category:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { category };
