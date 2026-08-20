/**
 * CLOSE ENOUGH — die Auflösung als Bild.
 *
 * Eine Zahlenliste („Anna 2.400.000, Ben 300.000, Wahrheit 2.500.000") sagt
 * dasselbe aus, aber sie sagt es nacheinander. Auf einer Achse sieht man in
 * einem Blick, wer nah dran war — und das ist der Moment, für den das Spiel
 * gespielt wird.
 *
 * Dramaturgie: Die Tipps fliegen von oben ein, der SCHLECHTESTE ZUERST und der
 * Sieger zuletzt. Danach erst fährt die Wahrheit als Strahl hoch. Andersherum
 * wäre die Spannung nach der ersten halben Sekunde vorbei.
 *
 * Die Achse selbst steckt in `reveal-scale.ts` und ist dort getestet — hier
 * steht nur, wie sie aussieht.
 */
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatNumber, formatYear } from './number-format';
import { chooseScale, makeScale, packLanes, toleranceBand } from './reveal-scale';

export interface RevealMark {
  playerId: string;
  name: string;
  color: string;
  /** `null` = kein Tipp abgegeben. Erscheint nicht auf der Achse. */
  value: number | null;
  /** Innerhalb der Toleranz? Bekommt dann die Goldfarbe. */
  bonus: boolean;
  rank: number;
}

interface Props {
  marks: RevealMark[];
  truth: number;
  tolerancePct: number;
  unitKey: string;
  lang: string;
  /** Beschriftung der Wahrheit, fertig mit Einheit. */
  truthLabel: string;
  /** Höhe einer Marken-Zeile in Pixeln. */
  laneHeight?: number;
  theme: {
    surface: string;
    elevated: string;
    text: string;
    dim: string;
    accent: string;
    truth: string;
    gold: string;
  };
  /** Auf dem Fernseher ist alles größer und die Animation langsamer. */
  tv?: boolean;
}

export function RevealChart({
  marks,
  truth,
  tolerancePct,
  unitKey,
  lang,
  truthLabel,
  laneHeight,
  theme,
  tv = false,
}: Props) {
  const reduce = useReducedMotion();

  const guessed = useMemo(
    () => marks.filter((m) => m.value !== null) as (RevealMark & { value: number })[],
    [marks],
  );

  const layout = useMemo(() => {
    const values = guessed.map((m) => m.value);
    // Die Wahrheit gehört mit in die Spanne — sonst läge sie außerhalb des
    // Bildes, wenn alle in dieselbe falsche Richtung geraten haben.
    const core = [...values, truth];
    const kind = chooseScale(unitKey, core);

    /*
     * Das Toleranzband gehört ebenfalls in die Spanne.
     *
     * Ohne das ragt es bei nah beieinanderliegenden Tipps über den Rand hinaus
     * und färbt fast die ganze Achse ein — es sähe aus, als wäre praktisch
     * jeder Tipp ein Volltreffer, obwohl nur einer im Band liegt. Das Band ist
     * die Aussage der Auflösung, es darf nicht angeschnitten sein.
     */
    const delta = Math.abs(truth) * (tolerancePct / 100);
    const edges = [truth - delta, truth + delta];
    const all = [
      ...core,
      // Auf einer Log-Achse hat eine nicht-positive Bandgrenze nichts zu
      // suchen — dort bleibt es bei der Kernspanne.
      ...edges.filter((e) => kind === 'linear' || e > 0),
    ];
    const scale = makeScale(kind, all);
    const positions = guessed.map((m) => scale.pos(m.value));
    const lanes = packLanes(positions, tv ? 0.07 : 0.11);
    const band = toleranceBand(truth, tolerancePct, scale);
    return { scale, positions, lanes, band, laneCount: Math.max(1, Math.max(0, ...lanes) + 1) };
  }, [guessed, truth, tolerancePct, unitKey, tv]);

  /** Reihenfolge des Einfliegens: schlechtester Tipp zuerst. */
  const order = useMemo(() => {
    const idx = guessed.map((_, i) => i);
    idx.sort((a, b) => guessed[b].rank - guessed[a].rank);
    const delay: number[] = new Array(guessed.length).fill(0);
    idx.forEach((i, position) => {
      delay[i] = position * (tv ? 0.45 : 0.3);
    });
    return delay;
  }, [guessed, tv]);

  const truthPos = layout.scale.pos(truth);
  const rowHeight = laneHeight ?? (tv ? 62 : 40);
  const marksHeight = layout.laneCount * rowHeight;
  // Die Wahrheit fährt erst hoch, wenn alle Tipps stehen.
  const truthDelay = guessed.length * (tv ? 0.45 : 0.3) + 0.25;

  return (
    <div className="w-full" style={{ direction: 'ltr' }}>
      {/* Markenfläche */}
      <div className="relative w-full" style={{ height: marksHeight }}>
        {guessed.map((m, i) => {
          const left = layout.positions[i] * 100;
          const lane = layout.lanes[i];
          const colour = m.bonus ? theme.gold : m.color;
          return (
            <motion.div
              key={m.playerId}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${left}%`, top: lane * rowHeight }}
              initial={reduce ? false : { opacity: 0, y: -24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: order[i], type: 'spring', stiffness: 320, damping: 24 }}
            >
              <span
                className="font-black whitespace-nowrap px-2 py-0.5 rounded-full"
                style={{
                  fontSize: tv ? '1.5vw' : '0.7rem',
                  background: colour,
                  color: '#0B1120',
                }}
              >
                {m.name}
              </span>
              <span
                className="font-bold tabular-nums whitespace-nowrap"
                style={{ fontSize: tv ? '1.2vw' : '0.65rem', color: theme.dim }}
              >
                {unitKey === 'year' ? formatYear(m.value, lang) : formatNumber(m.value, lang, 2)}
              </span>
              {/* Verbindungsstrich zur Achse — ohne ihn schwebt die Marke. */}
              <div
                className="w-[2px]"
                style={{
                  background: colour,
                  opacity: 0.5,
                  height: (layout.laneCount - lane - 1) * rowHeight + 6,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Achse mit Toleranzband und Wahrheitsstrahl */}
      <div
        className="relative w-full rounded-full"
        style={{ height: tv ? 10 : 6, background: theme.elevated }}
      >
        {/* Das Band ist auf einer Log-Achse absichtlich unsymmetrisch. */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${layout.band.from * 100}%`,
            width: `${Math.max(0.8, (layout.band.to - layout.band.from) * 100)}%`,
            background: theme.truth,
            opacity: 0.28,
          }}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: truthDelay, duration: 0.4 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            left: `${truthPos * 100}%`,
            width: tv ? 6 : 4,
            top: tv ? -14 : -8,
            bottom: tv ? -14 : -8,
            marginLeft: tv ? -3 : -2,
            background: theme.truth,
          }}
          initial={reduce ? false : { scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: truthDelay, type: 'spring', stiffness: 260, damping: 18 }}
        />
      </div>

      {/* Beschriftung der Wahrheit */}
      <motion.div
        className="relative w-full"
        style={{ height: tv ? 58 : 40 }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: truthDelay + 0.15 }}
      >
        <span
          className="absolute -translate-x-1/2 mt-2 font-black whitespace-nowrap tabular-nums px-2 py-1 rounded-lg"
          style={{
            left: `${Math.min(92, Math.max(8, truthPos * 100))}%`,
            fontSize: tv ? '2vw' : '0.95rem',
            background: theme.truth,
            color: '#0B1120',
          }}
        >
          {truthLabel}
        </span>
      </motion.div>
    </div>
  );
}
