/**
 * CLOSE ENOUGH — die Achse der Auflösung.
 *
 * Rein und ohne React, weil hier zwei Fallen liegen, die man im fertigen Bild
 * nicht sieht, sondern nur an einem leeren Bildschirm merkt.
 *
 * FALLE 1 — Jahreszahlen dürfen nicht logarithmisch sein. `log10(-3000)` ist
 * NaN, und eine einzige NaN-Position reißt die ganze Achse mit. Fragen nach
 * Baujahren gibt es 184 Stück; ohne die Sonderbehandlung wäre bei jeder
 * einzelnen die Auflösung leer.
 *
 * FALLE 2 — Ohne Zeilenverteilung liegen die Marken übereinander. Bei einem
 * Schätzspiel raten mehrere Leute ähnlich, das ist der Normalfall und nicht
 * die Ausnahme: Vier Tipps zwischen 2 und 3 Millionen ergeben vier Marken auf
 * demselben Punkt, von denen man drei nicht sieht.
 *
 * Warum überhaupt logarithmisch: Die Wahrheit ist 2 500 000, jemand tippt
 * 300 000, jemand 2 400 000. Linear klebten die beiden guten Tipps zu einem
 * Punkt zusammen und der schlechte stünde weit links — man sähe nicht, wer
 * gewonnen hat. Logarithmisch entspricht der Abstand dem, was auch gewertet
 * wird: der relativen Abweichung.
 */

export type ScaleKind = 'log' | 'linear';

/**
 * Welche Achse passt zu dieser Runde?
 *
 * Logarithmisch nur, wenn ALLE Werte echt positiv sind — sonst hätte `log10`
 * nichts zu rechnen. Jahreszahlen sind grundsätzlich linear: Zwischen 1889 und
 * 1901 liegen zwölf Jahre, und genau so soll es aussehen. Auf einer Log-Achse
 * wären beide praktisch derselbe Punkt.
 */
export function chooseScale(unitKey: string, values: number[]): ScaleKind {
  if (unitKey === 'year') return 'linear';
  if (values.length === 0) return 'linear';
  if (values.some((v) => !Number.isFinite(v) || v <= 0)) return 'linear';
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Schwelle bei Faktor vier, nicht bei einer vollen Zehnerpotenz. Der
  // typische Fall ist: Wahrheit 2 500 000, zwei gute Tipps bei 2 400 000 und
  // ein schlechter bei 300 000 — Faktor 8,3. Bei einer Schwelle von 10 bliebe
  // die Achse linear, und die beiden guten Tipps klebten als ein Punkt
  // aufeinander. Man sähe nicht, wer gewonnen hat, also genau das, was die
  // Auflösung zeigen soll. Unter Faktor vier bringt die Log-Achse dagegen
  // nichts und verzerrt nur das Bild.
  return max / min >= 4 ? 'log' : 'linear';
}

export interface Scale {
  kind: ScaleKind;
  /** Wert → Position von 0 (links) bis 1 (rechts). Immer begrenzt. */
  pos: (value: number) => number;
  min: number;
  max: number;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Achse über alle beteiligten Werte aufspannen.
 *
 * `padding` sind die Reserven links und rechts, damit weder die Wahrheit noch
 * der schlechteste Tipp genau am Rand klebt.
 */
export function makeScale(kind: ScaleKind, values: number[], padding = 0.08): Scale {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return { kind, pos: () => 0.5, min: 0, max: 1 };
  }

  let lo = Math.min(...finite);
  let hi = Math.max(...finite);

  if (kind === 'log') {
    // Nicht-positive Werte kann es hier nicht geben (chooseScale schließt sie
    // aus), aber ein Aufrufer könnte 'log' erzwingen — dann lieber eine
    // winzige positive Zahl als NaN.
    lo = Math.max(lo, Number.MIN_VALUE);
    hi = Math.max(hi, Number.MIN_VALUE);
    let a = Math.log10(lo);
    let b = Math.log10(hi);
    if (b - a < 1e-9) {
      a -= 0.5;
      b += 0.5;
    }
    const pad = (b - a) * padding;
    a -= pad;
    b += pad;
    return {
      kind,
      min: 10 ** a,
      max: 10 ** b,
      pos: (v: number) => {
        if (!Number.isFinite(v) || v <= 0) return 0;
        return clamp01((Math.log10(v) - a) / (b - a));
      },
    };
  }

  if (hi - lo < 1e-9) {
    // Alle gleich — eine willkürliche, aber symmetrische Spanne, damit die
    // Marke in der Mitte landet statt auf einer Division durch null.
    const span = Math.max(Math.abs(hi), 1) * 0.5;
    lo -= span;
    hi += span;
  }
  const pad = (hi - lo) * padding;
  lo -= pad;
  hi += pad;

  return {
    kind,
    min: lo,
    max: hi,
    pos: (v: number) => (Number.isFinite(v) ? clamp01((v - lo) / (hi - lo)) : 0),
  };
}

/**
 * Marken auf Zeilen verteilen, damit sich nichts überdeckt.
 *
 * Gierig und in Positionsreihenfolge: Jede Marke kommt in die oberste Zeile,
 * in der sie genügend Abstand zur letzten Marke dieser Zeile hat. Das Ergebnis
 * ist stabil — dieselben Eingaben ergeben dieselbe Verteilung, was wichtig
 * ist, weil das Bild animiert aufgebaut wird und dabei nicht springen darf.
 *
 * @param positions Positionen von 0 bis 1, in beliebiger Reihenfolge.
 * @param minGap    Mindestabstand in Positionseinheiten (0,09 ≈ 9 % Breite).
 * @returns Zeilennummer je Eingabe, in der REIHENFOLGE DER EINGABE.
 */
export function packLanes(positions: number[], minGap = 0.09): number[] {
  const order = positions.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);

  const laneLast: number[] = [];
  const lanes = new Array<number>(positions.length).fill(0);

  for (const { p, i } of order) {
    let lane = 0;
    while (lane < laneLast.length && p - laneLast[lane] < minGap) lane++;
    laneLast[lane] = p;
    lanes[i] = lane;
  }
  return lanes;
}

/**
 * Das Toleranzband um die Wahrheit als Positionsspanne.
 *
 * Auf einer Log-Achse ist das Band ASYMMETRISCH — nach rechts breiter als nach
 * links. Das ist kein Darstellungsfehler, sondern genau die Aussage: Bei
 * großen Zahlen darf man absolut weiter danebenliegen.
 */
export function toleranceBand(
  truth: number,
  tolerancePct: number,
  scale: Scale,
): { from: number; to: number } {
  const delta = Math.abs(truth) * (tolerancePct / 100);
  const from = scale.pos(truth - delta);
  const to = scale.pos(truth + delta);
  return from <= to ? { from, to } : { from: to, to: from };
}
