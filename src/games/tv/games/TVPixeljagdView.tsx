/**
 * PIXELJAGD auf dem Fernseher.
 *
 * Der TV ist die gemeinsame Bildfläche: Er zeigt das Motiv groß und in der
 * aktuellen Enthüllungsstufe, die Handys sind nur noch Buzzer. Deshalb bekommt
 * das Bild die Mittelzone und so viel Platz wie möglich.
 *
 * Spoiler-Schutz: `reveal` (Antwort und Bildnachweis) kommt erst ab der
 * Auflösungsphase im Zustand an — vorher gibt es hier nichts anzuzeigen, selbst
 * wenn jemand den Datenstrom mitliest.
 *
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PixelCanvas } from '@/games/pixeljagd/PixelCanvas';
import TVScoreboard from '../components/TVScoreboard';
import TVTimer from '../components/TVTimer';
import { tvPanel, tvType } from '../tv-tokens';

interface Props {
  gameState: Record<string, unknown>;
}

const PJ = { primary: '#38BDF8', accent: '#FDE047', dim: '#94A3B8' };

export default function TVPixeljagdView({ gameState }: Props) {
  const reduce = useReducedMotion();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'playing');
  const image = String(s.image ?? '');
  const step = Number(s.step ?? 8);
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 30);
  const points = Number(s.points ?? 100);
  const buzzedName = s.buzzedName ? String(s.buzzedName) : null;
  const reveal = (s.reveal ?? null) as { answer?: string; credit?: string; winner?: string | null } | null;

  const players = useMemo(() => {
    const raw = Array.isArray(s.players) ? s.players : [];
    return raw.map((p) => {
      const q = p as Record<string, unknown>;
      return {
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        color: String(q.color ?? PJ.primary),
        score: Number(q.score ?? 0),
      };
    });
  }, [s.players]);

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#F1F5F9' }}>
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
        <span style={{ fontSize: tvType.label, color: PJ.dim }}>
          Runde {round} / {totalRounds}
        </span>
        <span style={{ fontSize: tvType.title, color: PJ.accent, fontWeight: 900 }}>
          {points} Punkte
        </span>
      </div>

      <div className="flex-1 min-h-0 flex gap-[2vw] px-[3vw] py-[2vh]">
        {/* Bildfläche — bekommt bewusst den meisten Platz */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
          {image ? (
            <div className={tvPanel} style={{ padding: '1vh', overflow: 'hidden', maxHeight: '68vh' }}>
              <PixelCanvas
                src={image}
                // In der Auflösung scharf zeigen.
                step={phase === 'roundEnd' ? 320 : step}
                width={1280}
                height={960}
                className="w-full h-auto block rounded-[1vh]"
              />
            </div>
          ) : (
            <p style={{ fontSize: tvType.body, color: PJ.dim }}>Warten auf das nächste Motiv …</p>
          )}

          <AnimatePresence mode="wait">
            {buzzedName && phase === 'playing' && (
              <motion.p
                key="buzz"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-[2vh] font-black"
                style={{ fontSize: tvType.display, color: PJ.primary }}
              >
                {buzzedName} hat gebuzzert!
              </motion.p>
            )}
            {phase === 'roundEnd' && reveal?.answer && (
              <motion.div
                key="reveal"
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-[2vh] text-center"
              >
                <p className="font-black" style={{ fontSize: tvType.display }}>{reveal.answer}</p>
                <p style={{ fontSize: tvType.body, color: reveal.winner ? PJ.primary : PJ.dim }}>
                  {reveal.winner ? `${reveal.winner} hat es erraten` : 'Niemand hat es erraten'}
                </p>
                {/* Bildnachweis — im Spiel Pflicht, also auch hier. */}
                {reveal.credit && (
                  <p className="mt-[1vh]" style={{ fontSize: tvType.micro, color: PJ.dim }}>
                    Bildnachweis: {reveal.credit}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Seitenschiene: Uhr und Punktestand */}
        <div className="w-[18vw] shrink-0 flex flex-col gap-[2vh]">
          <TVTimer timeLeft={timeLeft} totalTime={totalTime} />
          <TVScoreboard players={players} layout="rail" sort="score" />
        </div>
      </div>
    </div>
  );
}
