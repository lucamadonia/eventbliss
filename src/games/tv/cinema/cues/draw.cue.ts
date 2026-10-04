import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Schnellzeichner: Karte „Zeichnen“ und „Raten“ je Runde, Aufloesung als Ton
 * (das Bild mit dem Begriff ist selbst der Moment). Der Begriff steht NIE auf
 * einer Karte — nur Runde, Phase und der oeffentliche Name des Zeichners.
 */
const draw: CueFn = (phase, s) => {
  const round = num(s.round, 1);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  const drawer = str(s.drawer);
  switch (phase) {
    case 'drawerReveal':
      return card(`draw:${round}:${drawer}:reveal`, ACCENT.purple, 'chime', { key: 'tvCinema.draw.cueDrawer', fallback: 'Neue Zeichnung' }, {
        eyebrow,
        subtitle: drawer
          ? { key: 'tvCinema.draw.cueDrawerSub', fallback: '{{name}} zeichnet', params: { name: drawer } }
          : { key: 'tvCinema.draw.cueDrawerSubAnon', fallback: 'Wer zeichnet, schaut aufs Handy' },
      });
    case 'drawing':
      return sound(`draw:${round}:${drawer}:drawing`, 'tick', ACCENT.red);
    case 'guessing':
      return card(`draw:${round}:${drawer}:guessing`, ACCENT.cyan, 'chime', { key: 'tvCinema.draw.cueGuess', fallback: 'Was ist das?' }, {
        eyebrow, subtitle: { key: 'tvCinema.draw.cueGuessSub', fallback: 'Ratet der Reihe nach am Handy' },
      });
    case 'roundResult':
      return sound(`draw:${round}:${drawer}:result`, 'reveal', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { quickdraw: draw, draw };
