import type { TFunction } from 'i18next';
import type { PartyNightState } from '../../party-types';
import type { HudPhase } from '../broadcast/TVRoundHud';

/** Oeffentlicher TV-Zustand der Quiz-Familie (quiz · splitquiz · fakeorfact · sharedquiz). */
export interface QuizPlayer { id: string; name: string; color?: string; avatar?: string; score?: number; streak?: number; team?: number }
export interface TeamState { name: string; color: string; players: string[]; score: number; correctCount: number }

export interface QuizViewState {
  partyNight?: PartyNightState;
  game?: string;
  phase?: string;
  /** Spieler-Objekte — bei splitquiz nur Namen (dort steht die Identitaet in `playerInfo`). */
  players?: (QuizPlayer | string)[];
  playerInfo?: QuizPlayer[];
  category?: string;
  currentPlayer?: string;
  currentTask?: string;
  explanation?: string;
  playerColor?: string;
  question?: string;
  statement?: string;
  statements?: string[];
  answers?: string[];
  /** Erst in der Aufloesung >= 0 — vorher setzt die Bruecke -1. */
  correctAnswer?: number;
  correctPct?: number;
  correctPlayers?: QuizPlayer[];
  currentPlayerIdx?: number;
  currentRound?: number;
  round?: number;
  totalRounds?: number;
  maxTime?: number;
  timeLeft?: number;
  points?: number;
  votesCount?: number;
  /** Wer schon getippt hat (fakeorfact) — nur WER, nie WAS. */
  voters?: QuizPlayer[];
  roleIndices?: number[];
  mode?: string;
  teamA?: TeamState;
  teamB?: TeamState;
}

export const QZ = { purple: '#df8eff', cyan: '#8ff5ff', amber: '#fbbf24', green: '#10b981', red: '#ff6b98', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

/** Phasen, in denen das Handy wandert oder eine Runde angesagt wird — eigene Zwischenszene. */
export const INTERLUDE_PHASES = new Set(['handoff', 'roundIntro', 'handoffAB', 'handoffBC']);

/** Szenen-Schluessel: eine Szene je Frage, eigene Szenen fuer Zwischenphasen und Endstand. */
export function quizScene(phase: string, round: number): string {
  if (phase === 'gameOver') return 'gameOver';
  if (phase === 'setup') return 'setup';
  if (INTERLUDE_PHASES.has(phase)) return `interlude-${phase}-${round}`;
  return `question-${round}`;
}

/** sharedquiz: welche Rolle ist gerade dran (0 liest Frage · 1 liest Optionen · 2 raet). */
export function activeRole(phase: string): number {
  if (phase === 'playerA') return 0;
  if (phase === 'playerB' || phase === 'handoffAB') return 1;
  if (phase === 'playerC' || phase === 'handoffBC') return 2;
  return -1;
}

export function quizPhaseLabel(game: string, phase: string, t: TFunction): HudPhase | null {
  if (phase === 'reveal') return { text: t('tvCinema.quiz.reveal', 'Auflösung'), color: QZ.green };
  if (phase === 'gameOver' || phase === 'setup') return null;
  if (phase === 'roundIntro') return { text: t('tvCinema.quiz.roundIntro', 'Neue Runde'), color: QZ.purple };
  if (INTERLUDE_PHASES.has(phase)) return { text: t('tvCinema.quiz.passPhone', 'Handy weitergeben'), color: QZ.amber };
  if (game === 'fakeorfact') {
    return phase === 'voted'
      ? { text: t('tvCinema.quiz.allVoted', 'Alle haben getippt'), color: QZ.cyan }
      : { text: t('tvCinema.quiz.factOrFake', 'Fakt oder Fake?'), color: QZ.purple };
  }
  if (game === 'sharedquiz') {
    const role = activeRole(phase);
    if (role === 0) return { text: t('tvCinema.quiz.readingQuestion', 'Frage wird vorgelesen'), color: QZ.purple };
    if (role === 1) return { text: t('tvCinema.quiz.readingOptions', 'Optionen werden vorgelesen'), color: QZ.cyan };
    if (role === 2) return { text: t('tvCinema.quiz.guessing', 'Jetzt wird geraten'), color: QZ.amber };
  }
  if (game === 'splitquiz' && phase === 'betting') return { text: t('tvCinema.quiz.betting', 'Einsätze setzen'), color: QZ.amber };
  return { text: t('tvCinema.quiz.answering', 'Antwortzeit läuft'), color: QZ.purple };
}

/** Spieler-Objekte aus dem Zustand (splitquiz liefert Namen + `playerInfo`). */
export function quizPlayers(state: QuizViewState): QuizPlayer[] {
  if (Array.isArray(state.playerInfo) && state.playerInfo.length) return state.playerInfo;
  return (state.players ?? []).filter((p): p is QuizPlayer => !!p && typeof p === 'object');
}
