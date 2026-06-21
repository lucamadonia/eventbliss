import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVHeadUpView — big-screen view for HeadUp (charades-by-tilt).
 *
 * The giant rotated word IS the mechanic: the audience reads it and acts it
 * out while the holder guesses, so the TV deliberately shows it. Around that
 * hero we rail the round/category/timer, live correct/skip pills, and the
 * whole-party roster (every player on screen, current guesser ringed).
 *
 * Data via useTVGameBridge('headup', …): { phase, currentRound, totalRounds,
 * currentWord, players, correctCount, skippedCount, timeLeft, category }.
 */
const HU = { purple: '#df8eff', cyan: '#8ff5ff', pink: '#ff6b98', green: '#10b981', skip: '#ff6e84', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

const PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

export default function TVHeadUpView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const word: string = gameState?.word || gameState?.currentWord || '';
  const player: string = gameState?.currentPlayer || gameState?.playerName || '';
  const playerColor: string = gameState?.playerColor || HU.purple;
  const correct: number = gameState?.correct ?? gameState?.correctCount ?? 0;
  const skipped: number = gameState?.skipped ?? gameState?.skippedCount ?? 0;
  const timeLeft = gameState?.timeLeft ?? '';
  const phase: string = gameState?.phase || 'playing';
  const round: number = gameState?.round || gameState?.currentRound || 1;
  const total = gameState?.total || gameState?.totalRounds || '?';
  const category: string = gameState?.category || '';
  const lastAction: string = gameState?.lastAction || ''; // 'correct' | 'skip' | ''
  const playerList: any[] = gameState?.players || [];

  // Whole-party roster (turn order). The guesser for this round is the active
  // chip; the bridge gives no per-player history, so we surface the running
  // correct count on whoever is currently up.
  const activeId = String(Math.max(0, (Number(round) || 1) - 1));
  const roster: TVScorePlayer[] = useMemo(
    () => playerList
      .map((p, i) => ({ raw: p, name: typeof p === 'string' ? p : (p?.name ?? ''), i }))
      .filter((p) => p.name.trim() !== '')
      .map(({ raw, name, i }) => {
        const isActive = String(i) === activeId;
        return {
          id: String(i),
          name,
          color: (typeof raw === 'object' && raw?.color) || PALETTE[i % PALETTE.length],
          status: (isActive ? 'active' : 'waiting') as TVScorePlayer['status'],
          subtitle: isActive ? t('tv.headup.correctShort', { count: correct, defaultValue: `${correct} richtig` }) : undefined,
        };
      }),
    [playerList, activeId, correct, t],
  );

  if (phase === 'roundResult' || phase === 'gameOver') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: HU.bg }}>
        {/* Static brand wash (low blur, no animation) */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />

        <motion.h2
          className="font-black italic mb-10"
          style={{ fontSize: tvType.display, color: HU.purple, textShadow: `0 0 36px ${HU.purple}88` }}
          initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          {phase === 'gameOver' ? t('tv.headup.gameOver', 'SPIELENDE!') : t('tv.headup.roundOver', 'RUNDE VORBEI!')}
        </motion.h2>

        <div className="flex gap-16">
          <ResultStat value={correct} label={t('tv.headup.correct', 'Richtig')} color={HU.green} delay={0.3} />
          <ResultStat value={skipped} label={t('tv.headup.skipped', 'Übersprungen')} color={HU.skip} delay={0.4} />
        </div>

        {roster.length > 0 && (
          <div className="absolute bottom-[clamp(1rem,2vh,2rem)] left-0 right-0 px-[clamp(1.25rem,2.4vw,3rem)]">
            <TVScoreboard players={roster.map((p) => ({ ...p, status: 'waiting' as const, subtitle: undefined }))} sort="order" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: HU.bg, color: HU.text }}>
      {/* Background — gated ambient drift via transform; static wash otherwise */}
      <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.07)' }} />
      <div className="absolute -bottom-24 -right-24 w-[36rem] h-[36rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.06)' }} />
      {ambient && (
        <motion.div
          className="absolute top-1/3 left-1/3 w-[30rem] h-[30rem] rounded-full blur-[90px] pointer-events-none"
          style={{ background: 'rgba(255,107,152,0.05)' }}
          animate={{ x: ['-10%', '20%', '-10%'], y: ['0%', '15%', '0%'] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        />
      )}

      {/* Top rail: category · round (left), timer (right) */}
      <div className="relative flex items-center justify-between px-[clamp(1.25rem,2.4vw,3rem)] pt-[clamp(1rem,2vh,2rem)] z-10">
        <div className="flex items-center gap-3">
          {category && (
            <span className="rounded-full px-5 py-1.5 font-bold uppercase tracking-[0.14em]"
              style={{ fontSize: tvType.micro, color: HU.purple, background: `${HU.purple}14`, border: `1px solid ${HU.purple}55` }}>
              {category}
            </span>
          )}
          <span className={`${tvPanel} px-5 py-1.5 font-bold tabular-nums`} style={{ fontSize: tvType.micro, color: HU.dim }}>
            {t('tv.round', 'Runde')} {round}/{total}
          </span>
        </div>
        {timeLeft !== '' && (
          <motion.div
            className={`${tvPanel} px-6 py-2 font-mono font-black tabular-nums`}
            style={{ fontSize: tvType.title, color: Number(timeLeft) <= 10 ? HU.skip : HU.text }}
            animate={ambient && Number(timeLeft) <= 5 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={ambient && Number(timeLeft) <= 5 ? { repeat: Infinity, duration: 0.4 } : { duration: 0.2 }}
          >
            {timeLeft}s
          </motion.div>
        )}
      </div>

      {/* Player badge + prompt */}
      <div className="relative flex flex-col items-center gap-3 pt-[clamp(0.5rem,1.5vh,1.5rem)] z-10">
        <motion.div
          className="px-8 py-2.5 rounded-full flex items-center gap-3"
          style={{ background: `${playerColor}15`, border: `2px solid ${playerColor}55` }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Smartphone style={{ width: '1.4em', height: '1.4em', color: playerColor }} />
          <span className="font-bold" style={{ fontSize: tvType.body, color: playerColor }}>{player}</span>
        </motion.div>
        <p style={{ fontSize: tvType.body, color: HU.dim }} className="tracking-wide">{t('tv.headup.describe', 'Beschreibe es!')}</p>
      </div>

      {/* THE WORD — the mechanic, deliberately on screen */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 z-10 px-8">
        <AnimatePresence mode="wait">
          {word ? (
            <motion.h1
              key={word}
              className="font-black italic text-center leading-none max-w-[18ch]"
              style={{
                fontSize: tvType.hero,
                background: `linear-gradient(135deg, ${HU.purple} 0%, ${HU.cyan} 50%, ${HU.pink} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 40px ${HU.purple}66)`,
              }}
              initial={
                lastAction === 'skip' ? { x: 200, opacity: 0, scale: 0.9 }
                  : lastAction === 'correct' ? { y: -60, opacity: 0, scale: 1.1 }
                    : { scale: 0.5, opacity: 0 }
              }
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={
                lastAction === 'skip' ? { x: -300, opacity: 0 }
                  : lastAction === 'correct' ? { y: -80, opacity: 0, scale: 1.1 }
                    : { opacity: 0, scale: 0.9 }
              }
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
              {word}
            </motion.h1>
          ) : (
            <motion.div
              key="waiting"
              className="flex items-center gap-3"
              animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }}
              transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: HU.cyan }} />
              <span style={{ fontSize: tvType.body, color: HU.dim }}>{t('tv.headup.getReady', 'Bereit machen...')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Green flash on correct — one-shot */}
        <AnimatePresence>
          {lastAction === 'correct' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Correct / skip pills */}
      <div className="relative flex gap-6 justify-center pb-4 z-10">
        <CountPill value={correct} label={t('tv.headup.correct', 'Richtig')} color={HU.green} />
        <CountPill value={skipped} label={t('tv.headup.skip', 'Skip')} color={HU.skip} />
      </div>

      {/* Whole-party roster — every player on screen, current guesser ringed */}
      {roster.length > 0 && (
        <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)] z-10">
          <TVScoreboard players={roster} sort="order" />
        </div>
      )}
    </div>
  );
}

function CountPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-8 py-3 rounded-2xl" style={{ background: `${color}14`, border: `2px solid ${color}33` }}>
      <motion.span key={value} className="font-black tabular-nums" style={{ fontSize: tvType.title, color }} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        {value}
      </motion.span>
      <span className="font-bold" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>{label}</span>
    </div>
  );
}

function ResultStat({ value, label, color, delay }: { value: number; label: string; color: string; delay: number }) {
  return (
    <motion.div
      className="text-center px-10 py-8 rounded-3xl"
      style={{ background: `${color}14`, border: `2px solid ${color}33` }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring' }}
    >
      <motion.div className="font-black tabular-nums" style={{ fontSize: tvType.display, color, textShadow: `0 0 30px ${color}88` }}
        initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: delay + 0.2, duration: 0.5 }}>
        {value}
      </motion.div>
      <div className="mt-3 font-bold" style={{ fontSize: tvType.body, color: '#a8abb3' }}>{label}</div>
    </motion.div>
  );
}
