/**
 * CLOSE ENOUGH (NAH DRAN) auf dem Fernseher.
 *
 * Der Fernseher ist die gemeinsame Fläche: Er trägt die Frage, die Uhr und die
 * Auflösung; die Handys sind reine Eingabegeräte. Deshalb steht die Frage groß
 * in der Mitte und die Namen in der Seitenschiene.
 *
 * SPOILER-SCHUTZ auf zwei Ebenen, und beide sind hier keine Höflichkeit,
 * sondern der Kern des Spiels:
 *
 *  - Während getippt wird, zeigt der Fernseher nur, WER abgegeben hat (Haken
 *    am Symbol) — nie, WAS. Stünde die Zahl auf dem Fernseher, hätten alle
 *    anderen sie abgeschrieben, bevor sie selbst tippen.
 *  - `reveal` (Wahrheit, Tipps, Beleg) kommt erst ab der Auflösungsphase
 *    überhaupt im Zustand an — und wird hier auch nur dann gelesen.
 *
 * Schaetzen und Aufloesen sind getrennte Layouts unter der Frage: dort
 * wechseln sie mit eigenem Ein-/Austritt, die Frage selbst bleibt stehen.
 *
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import { tvPanel, tvType } from '../tv-tokens';
import { lu } from '../components/tv-lobby-scale';
import type { PartyNightState } from '../party-types';
import { CE, CeGuessing, CeReveal, type CeRevealPayload } from './closeenough/CeStages';

interface Props {
  gameState: Record<string, unknown>;
}

export default function TVCloseEnoughView({ gameState }: Props) {
  const reduced = !!useReducedMotion();
  const { t } = useTranslation();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'guessing');
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const question = String(s.question ?? '');
  const unitLabel = String(s.unitLabel ?? '');
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 40);
  const revealing = phase === 'reveal';
  const reveal = revealing ? (s.reveal ?? null) as CeRevealPayload | null : null;

  const players = useMemo<TVScorePlayer[]>(() => {
    const rawList = Array.isArray(s.players) ? s.players : [];
    return rawList.map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const status = String(q.status ?? 'waiting');
      return {
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        color: String(q.color ?? CE.accent),
        score: Number(q.score ?? 0),
        ...(typeof q.avatar === 'string' && q.avatar ? { avatar: q.avatar } : {}),
        // 'done' heißt hier ausdrücklich „hat abgegeben", nicht „ist raus".
        status: phase === 'guessing' && status === 'done' ? 'done' : 'waiting',
      };
    });
  }, [s.players, phase]);

  const phaseLabel = revealing
    ? { text: t('tvCinema.closeenough.revealPill', 'Auflösung'), color: CE.truth }
    : { text: t('tvCinema.closeenough.guessingPill', 'Schätzrunde'), color: CE.accent };

  return (
    <div className="relative flex h-screen w-full flex-col gap-[2.4vh] overflow-hidden px-[5vw] pb-[5vh] pt-[5vh]" style={{ color: CE.text, background: '#060810' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 50% at 40% 40%, ${phaseLabel.color}12 0%, transparent 70%)`, transition: 'background 600ms ease' }} />

      {/* Kopfzeile: Phase links, Runde rechts — die Mitte bleibt fuer die Uebergabe frei. */}
      <div className="relative z-10 flex shrink-0 items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.div key={phaseLabel.text} className="rounded-full px-[1.4vw] py-[0.8vh]"
            style={{ background: `${phaseLabel.color}1a`, border: `1px solid ${phaseLabel.color}4d` }}
            variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate" exit="exit">
            <span className="font-bold" style={{ fontSize: lu(2.4), color: phaseLabel.color }}>{phaseLabel.text}</span>
          </motion.div>
        </AnimatePresence>
        <div className={`${tvPanel} px-[1.4vw] py-[0.8vh]`}>
          <span className="font-bold" style={{ fontSize: lu(2.4), color: CE.dim }}>
            {t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total: totalRounds })}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 gap-[2vw]">
        {/* Mittelzone: Frage bleibt stehen, darunter Schaetzen bzw. Aufloesung */}
        <div className="flex min-w-0 flex-1 flex-col gap-[2.4vh]">
          <motion.div key={question} className={`${tvPanel} shrink-0`} style={{ padding: '3vh 3vw' }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-center font-black leading-tight" style={{ fontSize: tvType.title }}>
              {question || t('games.closeenough.loading')}
            </p>
            {unitLabel && (
              <p className="mt-[1vh] text-center font-semibold" style={{ fontSize: tvType.body, color: CE.dim }}>
                {t('tvCinema.closeenough.unit', 'Antwort in: {{unit}}', { unit: unitLabel })}
              </p>
            )}
          </motion.div>

          <div className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait">
              {revealing && reveal?.marks && typeof reveal.truth === 'number' ? (
                <CeReveal key={`reveal-${round}`} reveal={reveal} players={players} />
              ) : phase === 'guessing' ? (
                <CeGuessing key={`guess-${round}`} players={players} timeLeft={timeLeft} totalTime={totalTime} />
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Seitenschiene: Punktestand (waehrend des Schaetzens mit Haken) */}
        <div className="w-[22vw] min-w-0 shrink-0 overflow-hidden">
          <TVScoreboard party={gameState?.partyNight as PartyNightState | undefined} players={players} layout="rail" />
        </div>
      </div>
    </div>
  );
}
