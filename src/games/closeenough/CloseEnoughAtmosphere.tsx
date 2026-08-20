/**
 * CLOSE ENOUGH — die Atmosphäre hinter dem Spiel.
 *
 * Warum überhaupt eine eigene Ebene: Das Spiel ist die meiste Zeit ein
 * Ziffernblock auf dunklem Grund. Das ist funktional richtig — die Eingabe
 * darf nichts überdecken —, aber ohne eine Ebene dahinter wirkt es wie ein
 * Taschenrechner. Zwei driftende Farbschleier und eine feine Körnung geben der
 * Fläche Tiefe, ohne einen einzigen Pixel der Bedienung zu kosten.
 *
 * Drei Regeln, an die sich das hier hält:
 *
 *  1. NIEMALS über der Bedienung. Alles hier ist `pointer-events: none` und
 *     liegt unter dem Inhalt.
 *  2. Kein Layout-Flackern: animiert werden ausschließlich `transform` und
 *     `opacity`. Beides läuft im Compositor, nichts davon löst ein Re-Layout
 *     aus — auf einem alten Handy ist das der Unterschied zwischen weich und
 *     ruckelig.
 *  3. `useReducedMotion` wird respektiert. Wer Bewegung abgestellt hat, bekommt
 *     denselben Farbraum, nur still.
 */
import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** Warmer Ton (Spielerfarbe). */
  warm: string;
  /** Kalter Ton (Wahrheitsfarbe). */
  cool: string;
  /**
   * Verdichtet die Schleier und beschleunigt sie leicht — für die Auflösung,
   * in der ohnehin gerade etwas passiert.
   */
  intense?: boolean;
}

function CloseEnoughAtmosphereImpl({ warm, cool, intense = false }: Props) {
  const reduce = useReducedMotion();

  const drift = (dx: number, dy: number, scale: number) =>
    reduce
      ? {}
      : {
          x: [0, dx, 0],
          y: [0, dy, 0],
          scale: [1, scale, 1],
        };

  const duration = intense ? 14 : 22;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Warmer Schleier oben links — die Seite des Spielers. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '-22%',
          left: '-18%',
          width: '85vw',
          height: '85vw',
          background: `radial-gradient(circle at 50% 50%, ${warm}, transparent 68%)`,
          opacity: intense ? 0.3 : 0.2,
          filter: 'blur(28px)',
        }}
        animate={drift(40, 30, 1.12)}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Kalter Schleier unten rechts — die Seite der Wahrheit. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: '-28%',
          right: '-20%',
          width: '90vw',
          height: '90vw',
          background: `radial-gradient(circle at 50% 50%, ${cool}, transparent 68%)`,
          opacity: intense ? 0.26 : 0.17,
          filter: 'blur(32px)',
        }}
        animate={drift(-36, -26, 1.15)}
        transition={{ duration: duration + 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/*
        Körnung. Ohne sie bekommen zwei weichgezeichnete Farbverläufe auf
        dunklem Grund sichtbare Streifen (Banding) — besonders auf großen
        Bildschirmen. Das Rauschen bricht sie auf; es ist ein Inline-SVG, damit
        kein Bild nachgeladen wird.
      */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.045,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export const CloseEnoughAtmosphere = memo(CloseEnoughAtmosphereImpl);

/**
 * Der Goldregen beim Volltreffer.
 *
 * Bewusst sparsam: zwölf Partikel, die genau einmal laufen und danach
 * verschwinden. Ein Dauer-Konfetti würde die Auflösung überdecken, und die ist
 * der eigentliche Inhalt des Augenblicks.
 */
export const BullseyeBurst = memo(function BullseyeBurst({ color }: { color: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => {
        // Fester Winkel je Partikel: Der Ausbruch soll bei jedem Volltreffer
        // gleich aussehen, nicht zufällig mal dicht und mal löchrig.
        const angle = (i / 12) * Math.PI * 2;
        const distance = 90 + (i % 3) * 30;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: 7, height: 7, background: color }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 0.2,
            }}
            transition={{ duration: 0.9, delay: (i % 4) * 0.04, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
});

/**
 * Punktestand, der hochzählt statt zu erscheinen.
 *
 * Eine Zahl, die einfach dasteht, wird gelesen. Eine Zahl, die hochläuft, wird
 * *verfolgt* — und genau dieser eine Wimpernschlag ist der Belohnungsmoment
 * der Runde.
 *
 * Bewusst ein eigener kleiner Zähler statt einer Federanimation: Punkte sollen
 * ankommen, nicht nachwippen. Und bewusst mit `requestAnimationFrame` statt
 * `setInterval` — bei 20 Schritten in 800 ms läge ein Intervall auf einem
 * langsamen Gerät regelmäßig daneben und die Zahl zuckte.
 */
export const CountUp = memo(function CountUp({
  value,
  duration = 0.8,
  prefix = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || value === 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const ms = duration * 1000;

    const tick = (now: number) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / ms);
      // Weich auslaufend: schnell los, sanft an den Endwert heran.
      const eased = 1 - (1 - p) * (1 - p);
      setShown(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduce]);

  return (
    <motion.span
      className="tabular-nums"
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    >
      {prefix}
      {shown}
    </motion.span>
  );
});
