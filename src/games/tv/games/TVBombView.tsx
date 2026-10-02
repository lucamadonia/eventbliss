import type { PartyNightState } from '../party-types';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { partyEase, partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import BombFuseScene from './bomb/BombFuseScene';
import { BombGameOver, BombStandingsList, rankBombPlayers } from './bomb/BombStandings';
import { BB, bombColor, bombPid, emojiOnly, type BombPlayer } from './bomb/bomb-tv';

interface ViewState {
  partyNight?: PartyNightState;
  players?: BombPlayer[];
  currentPlayer?: string;
  currentTask?: string;
  mode?: string;
  phase?: string;
  task?: string;
  currentPlayerIndex?: number;
  explodedPlayerIndex?: number;
  progress?: number;
  round?: number;
  timeLeft?: number;
  timeTotal?: number;
  totalRounds?: number;
  randomTimer?: boolean;
}

/**
 * TVBombView — Fernseher fuer die tickende Bombe.
 *
 * Szenen je Phase (TVPhaseStage): laufende Bombe (eine durchgehende Szene,
 * Halterwechsel animieren darin), Explosion, Zwischenstand, Siegerehrung.
 * Titelkarten und Phasen-Toene kommen aus cinema/cues/bomb.cue.ts.
 *
 * Oeffentlich: Aufgabe, Halter, Strafen. Der Zufallstimer bleibt geheim —
 * dann zeigt der Ring keine Restzeit, nur „?“.
 * Daten: useTVGameBridge('bomb', …) in BombGame.
 */
const EMPTY_PLAYERS: BombPlayer[] = [];

export default function TVBombView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();

  const phase: string = gameState?.phase || 'playing';
  const mode: string = gameState?.mode || '';
  const players: BombPlayer[] = gameState?.players || EMPTY_PLAYERS;
  const holderIdx: number = gameState?.currentPlayerIndex ?? 0;
  const round: number = gameState?.round || 1;
  const total: number = gameState?.totalRounds || 5;
  const task: string = gameState?.currentTask || gameState?.task || '';
  const timeLeft: number = gameState?.timeLeft ?? -1;
  const timeTotal: number = gameState?.timeTotal ?? 30;
  const randomTimer = !!gameState?.randomTimer;
  // Der Host sendet die ganze Sekunde (timeLeft), nicht den Fortschritt pro Bild.
  const progress: number = typeof gameState?.progress === 'number'
    ? gameState.progress
    : (!randomTimer && timeLeft >= 0 && timeTotal > 0 ? Math.max(0, Math.min(1, 1 - timeLeft / timeTotal)) : 0);
  const explodedIdx: number = gameState?.explodedPlayerIndex ?? -1;

  const holder = players[holderIdx] ?? (gameState?.currentPlayer ? { name: gameState.currentPlayer } : undefined);
  const holderColor = bombColor(holder, holderIdx);
  const exploded = players[explodedIdx];

  const roster: TVScorePlayer[] = useMemo(() => players.map((p, i) => ({
    id: bombPid(p, i),
    name: p.name || `P${i + 1}`,
    color: bombColor(p, i),
    avatar: emojiOnly(p.avatar),
    subtitle: t('tv.bomb.penalties', { count: p.penalties ?? 0, defaultValue: `${p.penalties ?? 0} Strafen` }),
    status: i === explodedIdx && phase === 'explosion' ? 'out' : i === holderIdx && phase === 'playing' ? 'active' : 'waiting',
  })), [players, holderIdx, explodedIdx, phase, t]);

  const modeLabel = mode === 'kategorie' ? t('games.bomb.modes.category', 'Kategorie-Bombe')
    : mode === 'quiz' ? t('games.bomb.modes.quiz', 'Quiz-Bombe')
      : mode === 'speed' ? t('games.bomb.modes.speed', 'Speed-Bombe')
        : mode === 'alle' ? t('tvCinema.bomb.modeMix', 'Bunter Mix') : '';

  const topBar = (label: string, color: string, showRound = true) => (
    <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-10 flex items-center justify-between">
      <motion.div className="flex items-center gap-3 rounded-full px-6 py-2" style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
        variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
        <span aria-hidden style={{ fontSize: lu(2.4) }}>💣</span>
        <span className="font-bold" style={{ fontSize: lu(2.4), color: '#fff' }}>{label}</span>
      </motion.div>
      {showRound && (
        <div className={`${tvPanel} px-5 py-2`}>
          <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: BB.dim }}>{t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total })}</span>
        </div>
      )}
    </div>
  );
  const strip = () => (players.length > 0 ? (
    <div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10">
      <TVScoreboard party={gameState?.partyNight} players={roster} sort="order" />
    </div>
  ) : null);

  let content: ReactNode;
  if (phase === 'playing') {
    content = (
      <>
        <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse 60% 55% at 50% 50%, ${BB.primary}2e 0%, transparent 70%)`, opacity: 0.3 + progress * 0.7 }} />
        {topBar(modeLabel || t('tvCinema.bomb.live', 'Bombe läuft'), BB.primary)}
        <div className="absolute inset-x-0 bottom-[14vh] top-[15vh] flex items-center justify-center">
          <BombFuseScene holder={holder} holderId={holder ? bombPid(holder, holderIdx) : 'none'} holderColor={holderColor}
            task={task} progress={progress} timeLeft={timeLeft} randomTimer={randomTimer} />
        </div>
        {strip()}
      </>
    );
  } else if (phase === 'explosion') {
    content = (
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
        animate={reduced ? undefined : { x: [0, -22, 22, -16, 16, -8, 8, 0] }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
        <motion.div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 45%, ${BB.danger}99 0%, ${BB.danger}33 40%, transparent 70%)` }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.35] }} transition={{ duration: 0.9 }} />
        {/* Splitter fliegen aussen herum — die Mitte bleibt fuer Name und Urteil frei */}
        {!reduced && Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const d = 32 + ((i * 53) % 14);
          return (
            <motion.span key={i} aria-hidden className="absolute left-1/2 top-1/2 rounded-full"
              style={{ width: lu(1.4), height: lu(1.4), background: [BB.spark, BB.primary, BB.danger][i % 3] }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: `${Math.cos(a) * d}vw`, y: `${Math.sin(a) * d * 0.9}vh`, opacity: 0, scale: 0.4 }}
              transition={{ duration: 1.3, ease: partyEase.out }} />
          );
        })}
        <motion.div className="relative z-10 flex flex-col items-center rounded-[50%] px-[8vw] py-[5vh]" style={{ gap: lu(2.4), background: 'radial-gradient(ellipse closest-side, #060810 55%, rgba(6,8,16,0.8) 78%, transparent 100%)' }}>
          <motion.h1 className="font-black italic leading-none" style={{ fontSize: tvType.hero, color: '#fff', textShadow: `0 0 50px ${BB.danger}, 0 0 100px ${BB.danger}66` }}
            initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -10 }} animate={reduced ? { opacity: 1 } : { scale: [0, 1.35, 1], rotate: [10, -4, 0] }}
            transition={{ duration: 0.6, ease: partyEase.out }}>
            {t('games.bomb.boom', 'BUMM!')}
          </motion.h1>
          {exploded && (
            <motion.div className="flex items-center" style={{ gap: lu(2.4) }}
              initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45, duration: 0.5, ease: partyEase.out }}>
              <TVPlayerAvatar id={exploded.id} name={exploded.name} avatar={emojiOnly(exploded.avatar)} color={bombColor(exploded, explodedIdx)} size={lu(11)} active />
              <div className="flex flex-col items-start">
                <span className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff' }}>{exploded.name}</span>
                <span className="mt-2 rounded-full px-4 py-1 font-bold" style={{ fontSize: tvType.body, color: '#fff', background: `${BB.danger}40`, border: `1px solid ${BB.danger}88` }}>
                  {t('tvCinema.bomb.plusOne', '+1 Strafe')}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
        {strip()}
      </motion.div>
    );
  } else if (phase === 'roundEnd') {
    const ranked = rankBombPlayers(players);
    content = (
      <>
        {topBar(t('games.bomb.interimStandings', 'Zwischenstand'), BB.cyan)}
        <motion.div className="flex w-full max-w-[min(64vw,1100px)] flex-col items-center" style={{ gap: lu(3) }} variants={staggerChildren(120)} initial="initial" animate="animate">
          <motion.h1 variants={riseIn(reduced)} className="text-center font-black leading-tight" style={{ fontSize: tvType.display, color: BB.text }}>
            {t('tvCinema.bomb.roundDone', 'Runde {{round}} überstanden', { round })}
          </motion.h1>
          <BombStandingsList ranked={ranked} highlightIdx={explodedIdx} compact={players.length > 5} />
        </motion.div>
      </>
    );
  } else if (phase === 'gameOver') {
    content = (
      <>
        {topBar(t('tvCinema.bomb.gameOver', 'Spielende'), BB.gold, false)}
        <BombGameOver players={players} />
      </>
    );
  } else {
    content = (
      <motion.div className="flex items-center gap-4"
        animate={ambient ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        <span aria-hidden style={{ fontSize: tvType.title }}>💣</span>
        <span className="font-semibold" style={{ fontSize: tvType.body, color: BB.dim }}>{t('tvCinema.bomb.preparing', 'Die Bombe wird scharf gemacht …')}</span>
      </motion.div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: BB.bg, color: BB.text }}>
      <TVPhaseStage phase={phase} className="flex flex-col items-center justify-center">
        {content}
      </TVPhaseStage>
    </div>
  );
}
