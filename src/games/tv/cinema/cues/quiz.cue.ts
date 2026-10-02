import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Quiz-Familie (quiz · splitquiz · fakeorfact · sharedquiz). Karten tragen nur
 * Runde und Phasenname — nie Frage, Antworten oder die richtige Loesung.
 * Die Aufloesung selbst ist der Moment in der Szene → nur Ton.
 */
const roundOf = (s: Record<string, unknown>) => num(s.round, num(s.currentRound, 1));

const quiz: CueFn = (phase, s) => {
  const round = roundOf(s);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'question':
    case 'playing':
      return card(`quiz:${round}:question`, ACCENT.purple, 'chime', { key: 'tvCinema.quiz.newQuestion', fallback: 'Neue Frage' }, { eyebrow });
    case 'reveal':
      return sound(`quiz:${round}:reveal`, 'reveal', ACCENT.green);
    case 'gameOver':
      return sound('quiz:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

const splitquiz: CueFn = (phase, s) => {
  const round = roundOf(s);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'question':
      return card(`splitquiz:${round}:question`, ACCENT.purple, 'chime', { key: 'tvCinema.quiz.newQuestion', fallback: 'Neue Frage' },
        { eyebrow, subtitle: { key: 'tvCinema.quiz.teamsSub', fallback: 'Team gegen Team' } });
    case 'betting':
      return card(`splitquiz:${round}:betting`, ACCENT.amber, 'chime', { key: 'tvCinema.quiz.betting', fallback: 'Einsätze setzen' },
        { eyebrow, subtitle: { key: 'tvCinema.quiz.bettingSub', fallback: 'Wie sicher seid ihr euch?' } });
    case 'handoff':
      return sound(`splitquiz:${round}:handoff`, 'chime', ACCENT.amber);
    case 'reveal':
      return sound(`splitquiz:${round}:reveal`, 'reveal', ACCENT.green);
    case 'gameOver':
      return sound('splitquiz:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

const fakeorfact: CueFn = (phase, s) => {
  const round = roundOf(s);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'statement':
      return card(`fof:${round}:statement`, ACCENT.purple, 'chime', { key: 'tvCinema.quiz.factOrFake', fallback: 'Fakt oder Fake?' },
        { eyebrow, subtitle: str(s.mode) === 'three'
          ? { key: 'tvCinema.quiz.whichIsTrue', fallback: 'Welche Aussage stimmt?' }
          : { key: 'tvCinema.quiz.trueOrFalseSub', fallback: 'Wahr oder erfunden?' } });
    case 'voted':
      return sound(`fof:${round}:voted`, 'tick', ACCENT.cyan);
    case 'reveal':
      return sound(`fof:${round}:reveal`, 'reveal', ACCENT.green);
    case 'gameOver':
      return sound('fof:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

const sharedquiz: CueFn = (phase, s) => {
  const round = roundOf(s);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'roundIntro':
      return card(`shared:${round}:intro`, ACCENT.purple, 'chime', { key: 'tvCinema.quiz.teamwork', fallback: 'Teamarbeit' },
        { eyebrow, subtitle: { key: 'tvCinema.quiz.teamworkSub', fallback: 'Drei Rollen, eine Antwort' } });
    case 'playerA':
    case 'playerB':
      return sound(`shared:${round}:${phase}`, 'chime', ACCENT.cyan);
    case 'playerC':
      return card(`shared:${round}:guess`, ACCENT.amber, 'chime', { key: 'tvCinema.quiz.guessing', fallback: 'Jetzt wird geraten' }, { eyebrow });
    case 'reveal':
      return sound(`shared:${round}:reveal`, 'reveal', ACCENT.green);
    case 'gameOver':
      return sound('shared:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { quiz, splitquiz, fakeorfact, sharedquiz };
