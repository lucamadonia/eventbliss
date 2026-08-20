/**
 * CLOSE ENOUGH auf dem Fernseher.
 *
 * Der Fernseher ist die gemeinsame Fläche: Er trägt die Frage, die Uhr und die
 * Auflösung; die Handys sind reine Eingabegeräte. Deshalb steht die Frage groß
 * in der Mitte und die Namen in der Seitenschiene.
 *
 * SPOILER-SCHUTZ auf zwei Ebenen, und beide sind hier keine Höflichkeit,
 * sondern der Kern des Spiels:
 *
 *  - Während getippt wird, zeigt die Seitenschiene über `status: 'done'` nur,
 *    WER abgegeben hat — nie, WAS. Stünde die Zahl auf dem Fernseher, hätten
 *    alle anderen sie abgeschrieben, bevor sie selbst tippen.
 *  - `reveal` (Wahrheit, Tipps, Beleg) kommt erst ab der Auflösungsphase
 *    überhaupt im Zustand an. Selbst wer den Datenstrom mitliest, findet
 *    vorher nichts.
 *
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RevealChart, type RevealMark } from '@/games/closeenough/RevealChart';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVTimer from '../components/TVTimer';
import { tvPanel, tvType } from '../tv-tokens';

interface Props {
  gameState: Record<string, unknown>;
}

const CE = {
  accent: '#FBBF24',
  truth: '#34D399',
  gold: '#FDE047',
  dim: '#94A3B8',
  surface: '#16233F',
  elevated: '#111C33',
  text: '#F1F5F9',
};

const CHART_THEME = {
  surface: CE.surface,
  elevated: CE.elevated,
  text: CE.text,
  dim: CE.dim,
  accent: CE.accent,
  truth: CE.truth,
  gold: CE.gold,
};

interface RevealPayload {
  truth?: number;
  truthLabel?: string;
  tolerancePct?: number;
  unitKey?: string;
  source?: string;
  marks?: RevealMark[];
}

export default function TVCloseEnoughView({ gameState }: Props) {
  const reduce = useReducedMotion();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'de').split('-')[0];
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'guessing');
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const question = String(s.question ?? '');
  const unitLabel = String(s.unitLabel ?? '');
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 40);
  const reveal = (s.reveal ?? null) as RevealPayload | null;

  const players = useMemo<TVScorePlayer[]>(() => {
    const rawList = Array.isArray(s.players) ? s.players : [];
    return rawList.map((p) => {
      const q = p as Record<string, unknown>;
      const status = String(q.status ?? 'waiting');
      return {
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        color: String(q.color ?? CE.accent),
        score: Number(q.score ?? 0),
        // 'done' heißt hier ausdrücklich „hat abgegeben", nicht „ist raus".
        status: phase === 'guessing' && status === 'done' ? 'done' : 'waiting',
      };
    });
  }, [s.players, phase]);

  const doneCount = players.filter((p) => p.status === 'done').length;

  return (
    <div className="w-full h-full flex flex-col" style={{ color: CE.text }}>
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
        <span style={{ fontSize: tvType.label, color: CE.dim }}>
          {t('games.closeenough.roundOf', { round, total: totalRounds })}
        </span>
        <span style={{ fontSize: tvType.label, color: CE.dim }}>
          {t('games.closeenough.waitingOthers', { done: doneCount, total: players.length })}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex gap-[2vw] px-[3vw] py-[2vh]">
        {/* Mittelzone: Frage, Uhr, Auflösung */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-[2vh]">
          <div className={tvPanel} style={{ padding: '3vh 3vw', width: '100%' }}>
            <p className="font-black text-center leading-tight" style={{ fontSize: tvType.title }}>
              {question || t('games.closeenough.loading')}
            </p>
            {unitLabel && (
              <p className="text-center mt-[1vh]" style={{ fontSize: tvType.body, color: CE.dim }}>
                {unitLabel}
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {phase === 'guessing' && (
              <motion.div
                key="clock"
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <TVTimer timeLeft={timeLeft} totalTime={totalTime} />
              </motion.div>
            )}

            {phase === 'reveal' && reveal?.marks && typeof reveal.truth === 'number' && (
              <motion.div
                key="reveal"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className={tvPanel} style={{ padding: '3vh 3vw' }}>
                  <RevealChart
                    marks={reveal.marks}
                    truth={reveal.truth}
                    tolerancePct={Number(reveal.tolerancePct ?? 10)}
                    unitKey={String(reveal.unitKey ?? 'count')}
                    lang={lang}
                    truthLabel={String(reveal.truthLabel ?? reveal.truth)}
                    theme={CHART_THEME}
                    tv
                  />
                </div>
                {/* Beleg — bei einer Zahl beendet die Herkunft den Streit am
                    Spieltisch, und der wird am Fernseher ausgetragen. */}
                {reveal.source && (
                  <p
                    className="text-center mt-[1.5vh]"
                    style={{ fontSize: tvType.micro, color: CE.dim }}
                  >
                    {t('games.closeenough.source')}: {reveal.source}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Seitenschiene: wer schon abgegeben hat, plus Punktestand */}
        <div className="w-[22vw] min-w-0">
          <TVScoreboard players={players} layout="rail" />
        </div>
      </div>
    </div>
  );
}
