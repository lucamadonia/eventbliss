import { ACCENT, card, num, roundEyebrow, sound, type CueFn } from './cue-kit';

/**
 * Geschichten-Erzaehler: eine Karte zum Start jeder Runde (nicht vor jedem
 * Satz — die Seite ist die Szene), leiser Ton beim Weitergeben, Fanfare zur
 * fertigen Geschichte. Nie Saetze oder Vorgaben auf der Karte.
 */
const story: CueFn = (phase, s) => {
  const round = num(s.currentRound ?? s.round, 1);
  switch (phase) {
    case 'writing':
      return card(`story:${round}:start`, ACCENT.amber, 'chime', { key: 'tvCinema.story.cueStart', fallback: 'Es war einmal …' }, {
        eyebrow: roundEyebrow(round, num(s.totalRounds, 0)),
        subtitle: { key: 'tvCinema.story.cueStartSub', fallback: 'Ein Satz nach dem anderen' },
      });
    case 'passing':
      return sound(`story:${round}:${num(s.currentPlayerIdx, 0)}:pass`, 'tick', ACCENT.cyan);
    case 'storyReveal':
    case 'gameOver':
      return card(`story:${round}:reveal`, ACCENT.gold, 'fanfare', { key: 'tvCinema.story.cueReveal', fallback: 'Die ganze Geschichte' }, {
        subtitle: { key: 'tvCinema.story.cueRevealSub', fallback: 'Lest mit!' },
      });
    default:
      return null;
  }
};

export const cues = { 'story-builder': story, storybuilder: story };
