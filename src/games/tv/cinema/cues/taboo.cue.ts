import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/** Oeffentlicher Name des Erklaerers (online Sitz-Objekt, lokal Name). */
function explainerName(e: unknown): string {
  if (typeof e === 'string') return e;
  return e && typeof e === 'object' ? str((e as { name?: unknown }).name) : '';
}

/**
 * Tabu: Titelkarte „Team A ist dran“ zum Zugbeginn, Start und Zug-Bilanz als
 * Ton. Nie die Karte oder verbotene Woerter — nur Team- und Spielernamen.
 */
const taboo: CueFn = stableCue((phase, s) => {
  const round = num(s.currentRound ?? s.round, 1);
  const teamIdx = num(s.activeTeamIdx, 0);
  const teams = Array.isArray(s.teams) ? s.teams : [];
  const teamName = str((teams[teamIdx] as { name?: unknown } | undefined)?.name);
  switch (phase) {
    case 'turnStart': {
      const name = explainerName(s.explainer);
      return card(`taboo:${round}:${teamIdx}:turn`, ACCENT.amber, 'chime',
        teamName ? { key: 'tvCinema.taboo.teamTurn', fallback: '{{team}} ist dran', params: { team: teamName } } : { key: 'tvCinema.taboo.nextTurn', fallback: 'Nächster Zug' },
        {
          eyebrow: roundEyebrow(round, num(s.totalRounds, 0)),
          subtitle: name ? { key: 'tvCinema.taboo.explains', fallback: '{{name}} erklärt', params: { name } } : { key: 'tvCinema.taboo.turnSub', fallback: 'Erklären ohne die verbotenen Wörter' },
        });
    }
    case 'playing':
      return sound(`taboo:${round}:${teamIdx}:go`, 'reveal', ACCENT.amber);
    case 'turnSummary':
      return sound(`taboo:${round}:${teamIdx}:summary`, 'chime', ACCENT.cyan);
    default:
      return null;
  }
});

export const cues = { taboo };
