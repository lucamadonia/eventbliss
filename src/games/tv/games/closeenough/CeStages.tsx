import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { RevealChart, type RevealMark } from '@/games/closeenough/RevealChart';
import TVTimer from '../../components/TVTimer';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { useTVCue } from '../../cinema/tv-cue-context';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { tvPanel, tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import type { TVScorePlayer } from '../../components/TVScoreboard';

export const CE = {
  accent: '#FBBF24',
  truth: '#34D399',
  gold: '#FDE047',
  dim: '#94A3B8',
  surface: '#16233F',
  elevated: '#111C33',
  text: '#F1F5F9',
};

const CHART_THEME = { surface: CE.surface, elevated: CE.elevated, text: CE.text, dim: CE.dim, accent: CE.accent, truth: CE.truth, gold: CE.gold };

export interface CeRevealPayload {
  truth?: number;
  truthLabel?: string;
  tolerancePct?: number;
  unitKey?: string;
  source?: string;
  marks?: RevealMark[];
}

/** Schaetzen: Uhr und wer schon getippt hat — nur WER, nie WAS. */
export function CeGuessing({ players, timeLeft, totalTime }: { players: TVScorePlayer[]; timeLeft: number; totalTime: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const done = players.filter((p) => p.status === 'done').length;
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.22, ease: partyEase.exit } }} transition={{ duration: 0.5, ease: partyEase.out }}>
      <TVTimer timeLeft={timeLeft} totalTime={totalTime} />
      <span data-testid="tv-ce-progress" className="font-bold" style={{ fontSize: tvType.body, color: CE.text }}>
        {t('tvCinema.closeenough.submitted', '{{count}} von {{total}} haben getippt', { count: done, total: players.length })}
      </span>
      <motion.div className="flex flex-wrap justify-center gap-[1.2vw]" variants={staggerChildren(50)} initial="initial" animate="animate">
        {players.map((p, i) => {
          const isDone = p.status === 'done';
          return (
            <motion.div key={p.id || `${p.name}-${i}`} variants={riseIn(reduced)} data-done={String(isDone)} className="flex flex-col items-center gap-[0.6vh]">
              <motion.div className="relative" animate={{ opacity: isDone ? 1 : 0.5, scale: isDone ? 1.06 : 1 }} transition={{ duration: 0.35, ease: partyEase.out }}>
                <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(8)} active={isDone} />
                {isDone && (
                  <motion.span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full font-black"
                    style={{ width: '1.5em', height: '1.5em', fontSize: tvType.label, background: CE.truth, color: '#060810' }}
                    initial={reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>✓</motion.span>
                )}
              </motion.div>
              <span className="font-semibold" style={{ fontSize: tvType.label, color: isDone ? CE.text : CE.dim }}>{p.name}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/** Zeilenhoehe der Marken passend zur Bildhoehe — sonst liegen Name und Zahl auf der Achse. */
/**
 * Aufloesung: die Achse aus dem Spiel, darunter wer am naechsten lag. Der Ton
 * kommt, wenn die Wahrheit auf der Achse steht (Takt von RevealChart).
 */
export function CeReveal({ reveal, players }: { reveal: CeRevealPayload; players: TVScorePlayer[] }) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  const lang = (i18n.language || 'de').split('-')[0];
  const marks = useMemo(() => reveal.marks ?? [], [reveal.marks]);
  const guessed = useMemo(() => marks.filter((m) => m.value !== null), [marks]);
  const best = useMemo(() => [...guessed].sort((a, b) => a.rank - b.rank)[0] ?? null, [guessed]);
  const bonus = guessed.some((m) => m.bonus);
  // Gleicher Takt wie RevealChart (tv): je Marke 0,45 s, dann die Wahrheit.
  const truthDelay = reduced ? 0.3 : guessed.length * 0.45 + 0.25;
  const verdictDelay = truthDelay + 0.5;

  useEffect(() => {
    const id = window.setTimeout(() => cue.play(bonus ? 'fanfare' : 'correct'), verdictDelay * 1000);
    return () => window.clearTimeout(id);
  }, [reveal.truth]); // eslint-disable-line react-hooks/exhaustive-deps

  const bestPlayer = best ? players.find((p) => p.id === best.playerId) : null;
  return (
    <motion.div data-testid="tv-ce-reveal" className="absolute inset-0 flex flex-col gap-[2vh]"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.22, ease: partyEase.exit } }} transition={{ duration: 0.5, ease: partyEase.out }}>
      <div className={tvPanel} style={{ padding: '3vh 3vw' }}>
        <RevealChart
          marks={marks}
          truth={reveal.truth as number}
          tolerancePct={Number(reveal.tolerancePct ?? 10)}
          unitKey={String(reveal.unitKey ?? 'count')}
          lang={lang}
          truthLabel={String(reveal.truthLabel ?? reveal.truth)}
          theme={CHART_THEME}
          tv
        />
      </div>
      {best && (
        <motion.div className="flex items-center justify-center gap-[1vw]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: verdictDelay, duration: 0.5, ease: partyEase.out }}>
          <TVPlayerAvatar id={best.playerId} name={best.name} avatar={bestPlayer?.avatar} color={best.bonus ? CE.gold : best.color} size={lu(7)} active />
          <span className="font-black" style={{ fontSize: tvType.title, color: '#fff' }}>
            {t('tvCinema.closeenough.closest', 'Am nächsten: {{name}}', { name: best.name })}
          </span>
          {best.bonus && (
            <span className="rounded-full px-[1vw] py-[0.5vh] font-bold" style={{ fontSize: tvType.label, color: '#060810', background: CE.gold }}>
              {t('tvCinema.closeenough.bullseye', 'Volltreffer')}
            </span>
          )}
        </motion.div>
      )}
      {/* Beleg — bei einer Zahl beendet die Herkunft den Streit am Spieltisch. */}
      {reveal.source && (
        <p className="text-center" style={{ fontSize: tvType.label, color: CE.dim }}>
          {t('games.closeenough.source')}: {reveal.source}
        </p>
      )}
    </motion.div>
  );
}
