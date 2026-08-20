/**
 * CLOSE ENOUGH — eine Runde werten.
 *
 * Bewusst rein und ohne React: Die Wertung ist die Stelle, an der ein Fehler
 * niemandem auffällt. Ein falsch gerechneter Punktestand stürzt nicht ab, er
 * ärgert nur — und zwar erst dann, wenn jemand nachrechnet.
 *
 * Gewertet wird über die RELATIVE Abweichung. Die Fragen reichen von „8 Beine"
 * bis „2 500 000 Liter"; absolut gerechnet wäre bei großen Zahlen jeder gleich
 * weit daneben und die Rangfolge damit zufällig.
 */
import { relativeError } from './number-format';

export interface CeGuess {
  playerId: string;
  /** `null` = nichts abgegeben (Zeit abgelaufen oder Feld leer). */
  value: number | null;
}

export interface CeResult {
  playerId: string;
  value: number | null;
  /** Relative Abweichung; `Infinity`, wenn kein Tipp abgegeben wurde. */
  relErr: number;
  /** 1-basiert. Gleich gute Tipps teilen sich den Rang. */
  rank: number;
  points: number;
  /** Lag der Tipp innerhalb der Toleranz der Frage? */
  bonus: boolean;
}

/** Rangpunkte: der Nächste 10, dann 6, dann 3, alle weiteren 1. */
export const RANK_POINTS = [10, 6, 3] as const;
const TRAILING_POINTS = 1;

/** Zusatzpunkte, wer innerhalb der Toleranz der Frage liegt. */
export const NEAR_BONUS = 5;

/**
 * Eine Runde auswerten. Das Ergebnis ist nach Rang sortiert, der beste zuerst.
 *
 * Gleichstand bekommt denselben Rang UND dieselben Punkte — zwei gleich gute
 * Schätzungen unterschiedlich zu bewerten wäre willkürlich. Die Ränge springen
 * danach entsprechend weiter (1, 1, 3), wie im Sport üblich.
 *
 * Wer nichts abgegeben hat, bekommt null Punkte und landet hinter allen
 * anderen — auch hinter jemandem, der wild danebengeraten hat. Mitraten soll
 * sich immer lohnen.
 */
export function scoreRound(
  guesses: CeGuess[],
  truth: number,
  tolerancePct: number,
): CeResult[] {
  const withErr = guesses.map((g) => ({
    playerId: g.playerId,
    value: g.value,
    relErr: g.value === null ? Number.POSITIVE_INFINITY : relativeError(g.value, truth),
  }));

  const sorted = [...withErr].sort((a, b) => a.relErr - b.relErr);

  const out: CeResult[] = [];
  let rankIndex = 0;
  let lastErr = Number.NaN;

  sorted.forEach((g, i) => {
    // Neuer Rang nur bei echter Abweichung vom Vorgänger. `Number.NaN` als
    // Startwert ist Absicht: NaN !== NaN, der erste Eintrag setzt also immer.
    if (g.relErr !== lastErr) {
      rankIndex = i;
      lastErr = g.relErr;
    }

    const noGuess = g.value === null;
    const bonus = !noGuess && g.relErr <= tolerancePct / 100;
    const base = noGuess ? 0 : (RANK_POINTS[rankIndex] ?? TRAILING_POINTS);

    out.push({
      playerId: g.playerId,
      value: g.value,
      relErr: g.relErr,
      rank: rankIndex + 1,
      points: base + (bonus ? NEAR_BONUS : 0),
      bonus,
    });
  });

  return out;
}

/**
 * Wer hat die Runde gewonnen? Bei Gleichstand alle Beteiligten.
 * Leer, wenn niemand einen Tipp abgegeben hat.
 */
export function roundWinners(results: CeResult[]): string[] {
  return results.filter((r) => r.value !== null && r.rank === 1).map((r) => r.playerId);
}
