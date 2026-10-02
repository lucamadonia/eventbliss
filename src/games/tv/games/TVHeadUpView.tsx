import type { PartyNightState } from '../party-types';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { partyEase, partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import HeadUpPlaying from './headup/HeadUpPlaying';
import { HeadUpGameOver, HeadUpRoundResult } from './headup/HeadUpResults';
import { HU, headUpSeats, seatKey, type HeadUpRoundScore, type HeadUpSeat } from './headup/headup-tv';

interface ViewState {
  partyNight?: PartyNightState;
  players?: (string | HeadUpSeat)[];
  playerSeats?: HeadUpSeat[];
  roundScores?: HeadUpRoundScore[];
  category?: string;
  currentPlayer?: string;
  currentWord?: string;
  phase?: string;
  playerName?: string;
  word?: string;
  correct?: number;
  correctCount?: number;
  currentRound?: number;
  round?: number;
  skipped?: number;
  skippedCount?: number;
  timeLeft?: number;
  total?: number;
  totalRounds?: number;
}

/**
 * TVHeadUpView — Fernseher fuer HeadUp (Begriff an der Stirn).
 *
 * Szenen je Phase (TVPhaseStage): „Wer ist dran“ (ready), laufende Runde
 * (eine durchgehende Szene mit Begriff, Zeit-Ring, Zaehlern), Zug-Ergebnis,
 * Spielende. Titelkarten/Phasen-Toene: cinema/cues/headup.cue.ts.
 *
 * Der Begriff erscheint nur, wenn die Bruecke ihn schickt (lokales Spiel —
 * dort liest das Publikum ihn vor). Online bleibt er auf dem Handy.
 */
const EMPTY: never[] = [];

/** Zeit-Ring: die volle Zeit ist der hoechste Wert dieser Runde (die Bruecke sendet keine Gesamtzeit). */
function TimerRing({ timeLeft }: { timeLeft: number }) {
  const ambient = useAmbientMotion();
  const maxRef = useRef(timeLeft);
  if (timeLeft > maxRef.current) maxRef.current = timeLeft;
  const warn = timeLeft <= 10;
  const color = warn ? HU.skip : HU.cyan;
  const R = 42;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, timeLeft / Math.max(maxRef.current, 1)));
  return (
    <motion.div className="relative grid place-items-center rounded-full" style={{ width: lu(10), height: lu(10), boxShadow: `0 0 28px -6px ${color}` }}
      animate={ambient && timeLeft <= 5 && timeLeft > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={ambient && timeLeft <= 5 ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={R} fill="#0d0915" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - frac) }} transition={{ duration: 0.5, ease: partyEase.out }} />
      </svg>
      <span className="relative font-black tabular-nums" style={{ fontSize: tvType.title, color: '#fff' }}>{timeLeft}</span>
    </motion.div>
  );
}

export default function TVHeadUpView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const word: string = gameState?.word || gameState?.currentWord || '';
  const correct: number = gameState?.correct ?? gameState?.correctCount ?? 0;
  const skipped: number = gameState?.skipped ?? gameState?.skippedCount ?? 0;
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : null;
  const round: number = gameState?.round || gameState?.currentRound || 1;
  const total = gameState?.total || gameState?.totalRounds || 0;
  const category: string = gameState?.category || '';

  const seats = useMemo(() => headUpSeats(gameState?.players ?? EMPTY, gameState?.playerSeats ?? EMPTY), [gameState?.players, gameState?.playerSeats]);
  const named = gameState?.currentPlayer || gameState?.playerName || '';
  const guesserIdx = Math.max(0, named ? seats.findIndex((s) => s.name === named) : round - 1);
  const guesser: HeadUpSeat | undefined = seats[guesserIdx] ?? (named ? { name: named } : undefined);

  const roster: TVScorePlayer[] = useMemo(() => seats.map((p, i) => {
    const active = i === guesserIdx && (phase === 'playing' || phase === 'ready');
    return {
      id: seatKey(p, i), name: p.name, color: p.color || HU.purple, avatar: p.avatar,
      status: phase === 'gameOver' ? 'waiting' : active ? 'active' : i < guesserIdx ? 'done' : 'waiting',
      subtitle: active && phase === 'playing' ? t('tv.headup.correctShort', { count: correct, defaultValue: `${correct} richtig` }) : undefined,
    };
  }), [seats, guesserIdx, phase, correct, t]);

  const topBar = (label: string, color: string, extra?: ReactNode, showRound = true) => (
    <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-10 flex items-center justify-between">
      <motion.div className="flex items-center gap-3 rounded-full px-6 py-2" style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
        variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
        <span className="font-bold" style={{ fontSize: lu(2.4), color: '#fff' }}>{label}</span>
      </motion.div>
      <div className="flex items-center" style={{ gap: lu(2) }}>
        {showRound && (
          <div className={`${tvPanel} px-5 py-2`}>
            <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: HU.dim }}>
              {total ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total }) : t('tvCinema.round', 'Runde {{round}}', { round })}
            </span>
          </div>
        )}
        {extra}
      </div>
    </div>
  );
  const strip = () => (roster.length > 0 ? (
    <div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10">
      <TVScoreboard party={gameState?.partyNight} players={roster} sort="order" />
    </div>
  ) : null);
  const categoryLabel = category ? t('tvCinema.headup.category', 'Kategorie: {{name}}', { name: category }) : t('tvCinema.headup.title', 'HeadUp');

  let content: ReactNode;
  if (phase === 'ready') {
    const color = guesser?.color || HU.purple;
    content = (
      <>
        {topBar(categoryLabel, HU.purple)}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 55% 50% at 50% 48%, ${color}2e 0%, transparent 70%)` }} />
        <motion.div className="relative flex flex-col items-center text-center" style={{ gap: lu(2.4) }} variants={staggerChildren(130)} initial="initial" animate="animate">
          <motion.div variants={partyMotion('spotlight', reduced)}>
            <TVPlayerAvatar id={guesser?.id} name={guesser?.name || '?'} avatar={guesser?.avatar} color={color} size={lu(22)} active />
          </motion.div>
          <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff' }}>
            {t('tvCinema.headup.yourTurn', '{{name}} ist dran', { name: guesser?.name || '' })}
          </motion.h1>
          <motion.div variants={riseIn(reduced)} className="flex items-center gap-3 font-semibold" style={{ fontSize: tvType.body, color: HU.text }}>
            <motion.span className="grid place-items-center" animate={ambient ? { rotate: [0, -90, -90, 0] } : { rotate: 0 }}
              transition={ambient ? { repeat: Infinity, duration: 3, ease: partyEase.inOut } : { duration: 0.2 }}>
              <Smartphone style={{ width: '1.3em', height: '1.3em', color: HU.cyan }} />
            </motion.span>
            {t('tvCinema.headup.holdUp', 'Handy an die Stirn – gleich geht’s los')}
          </motion.div>
        </motion.div>
        {strip()}
      </>
    );
  } else if (phase === 'playing') {
    content = (
      <>
        {topBar(categoryLabel, HU.purple, timeLeft !== null ? <TimerRing timeLeft={timeLeft} /> : null)}
        <div className="absolute inset-x-0 bottom-[14vh] top-[17vh] flex items-center justify-center">
          <HeadUpPlaying guesser={guesser} word={word} correct={correct} skipped={skipped} />
        </div>
        {strip()}
      </>
    );
  } else if (phase === 'roundResult') {
    content = (
      <>
        {topBar(t('tvCinema.headup.roundOver', 'Zug vorbei'), HU.cyan)}
        <HeadUpRoundResult guesser={guesser} correct={correct} skipped={skipped} />
        {strip()}
      </>
    );
  } else if (phase === 'gameOver') {
    content = (
      <>
        {topBar(t('tvCinema.headup.gameOver', 'Spielende'), HU.gold, null, false)}
        <HeadUpGameOver seats={seats} scores={gameState?.roundScores ?? EMPTY} />
      </>
    );
  } else {
    content = (
      <motion.div className="flex items-center gap-4" animate={ambient ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.8 }}
        transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        <Smartphone style={{ width: '2em', height: '2em', color: HU.cyan }} />
        <span className="font-semibold" style={{ fontSize: tvType.body, color: HU.dim }}>{t('tv.headup.getReady', 'Bereit machen...')}</span>
      </motion.div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: HU.bg, color: HU.text }}>
      <TVPhaseStage phase={phase} className="flex flex-col items-center justify-center">
        {content}
      </TVPhaseStage>
    </div>
  );
}
