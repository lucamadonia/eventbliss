import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

const PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

/**
 * TVBombView — big-screen view for the Bomb pass-the-task game.
 *
 * Broadcast layout (the TV shows more than the phone — secrets stay hidden):
 *   ┌──────────── header: mode badge · round ─────────────┐
 *   │           HERO: bomb + circular fuse timer          │
 *   │              active player · current task           │
 *   ├─────────────────────────────────────────────────────┤
 *   │  SCOREBOARD strip — every player + penalty count    │
 *   └─────────────────────────────────────────────────────┘
 *
 * Data arrives via useTVGameBridge('bomb', …): { phase, mode, players,
 * currentPlayerIndex, round, totalRounds, currentTask, explodedPlayerIndex }.
 */
const BB = { primary: '#ff7350', danger: '#ef4444', warn: '#f59e0b', spark: '#fbbf24', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface BombPlayer { name: string; color?: string; penalties?: number }

const MODE_LABEL: Record<string, string> = {
  kategorie: 'Kategorie',
  quiz: 'Quiz',
  speed: 'Speed',
  alle: 'Alles',
};

export default function TVBombView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const mode: string = gameState?.mode || '';
  const players: BombPlayer[] = gameState?.players || [];
  const currentPlayerIndex: number = gameState?.currentPlayerIndex ?? 0;
  const round: number = gameState?.round || 1;
  const total: number = gameState?.totalRounds || 5;
  const task: string = gameState?.currentTask || gameState?.task || '';
  const timeLeft: number = gameState?.timeLeft ?? -1;
  const timeTotal: number = gameState?.timeTotal ?? 30;
  const randomTimer: boolean = !!gameState?.randomTimer;
  // The host broadcasts the integer countdown (timeLeft), not raw per-frame
  // progress — derive the fuse fill from it. Random/hidden mode keeps it secret.
  const progress: number = typeof gameState?.progress === 'number'
    ? gameState.progress
    : (!randomTimer && timeLeft >= 0 && timeTotal > 0 ? Math.max(0, Math.min(1, 1 - timeLeft / timeTotal)) : 0);
  const explodedPlayerIndex: number = gameState?.explodedPlayerIndex ?? -1;

  const active = players[currentPlayerIndex];
  const player = active?.name || gameState?.currentPlayer || '';
  const playerColor = active?.color || BB.primary;
  const exploded = players[explodedPlayerIndex]?.name || '';

  // Whole-party roster for the shared scoreboard: every player, penalty count
  // as the subtitle, the exploded player marked 'out', the holder 'active'.
  const roster: TVScorePlayer[] = useMemo(
    () => players.map((p, i) => ({
      id: String(i),
      name: p.name || `P${i + 1}`,
      color: p.color || PALETTE[i % PALETTE.length],
      subtitle: t('tv.bomb.penalties', { count: p.penalties ?? 0, defaultValue: `${p.penalties ?? 0} Strafen` }),
      status: i === explodedPlayerIndex ? 'out' : i === currentPlayerIndex ? 'active' : 'waiting',
    })),
    [players, currentPlayerIndex, explodedPlayerIndex, t],
  );

  const pulseSpeed = useMemo(() => Math.max(0.15, 1.2 - progress * 1.1), [progress]);
  const bombGlow = useMemo(() => 0.2 + progress * 0.8, [progress]);

  // Circular timer ring
  const circleRadius = 130;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progress);
  const ringColor = progress > 0.7 ? BB.danger : progress > 0.4 ? BB.warn : BB.primary;

  if (phase === 'explosion') {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: BB.bg }}
        animate={{ x: [0, -20, 20, -15, 15, -8, 8, 0] }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Red flash — one-shot beat (not gated) */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3] }}
          transition={{ duration: 0.8 }}
        />

        {/* Explosion particles — one-shot, transform/opacity only */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const rad = (angle * Math.PI) / 180;
          const dist = 150 + ((i * 53) % 200);
          return (
            <motion.div
              key={i}
              className="absolute text-5xl"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0.3, rotate: (i * 47) % 360 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {['*', '✨', '⚡', '⭐'][i % 4]}
            </motion.div>
          );
        })}

        <motion.h1
          className="text-[12rem] font-black italic text-white relative z-10"
          style={{ textShadow: '0 0 40px rgba(255,68,68,0.9), 0 0 80px rgba(255,68,68,0.4)' }}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: [0, 1.4, 1], rotate: [10, -5, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          BOOM!
        </motion.h1>

        {exploded && (
          <motion.p
            className="text-5xl font-bold text-white/90 mt-4 relative z-10"
            style={{ textShadow: '0 0 20px rgba(255,68,68,0.5)' }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            {t('tv.bomb.exploded', { name: exploded, defaultValue: `${exploded} ist explodiert!` })}
          </motion.p>
        )}

        {/* Scoreboard stays visible so the penalty just dealt is legible */}
        <div className="absolute bottom-[clamp(1rem,2vh,2rem)] left-0 right-0 px-[clamp(1.25rem,2.4vw,3rem)]">
          <TVScoreboard players={roster} sort="order" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: BB.bg, color: BB.text }}>
      {/* Ambient danger wash — static fill that scales opacity with progress (no blur animation) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,115,80,0.14) 0%, transparent 70%)', opacity: 0.2 + progress * 0.8 }}
      />

      {/* Header: mode badge + round */}
      <div className="relative flex items-center justify-between px-[clamp(1.25rem,2.4vw,3rem)] pt-[clamp(1rem,2vh,2rem)]">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: tvType.label }}>💣</span>
          {mode && (
            <span className="rounded-full px-5 py-1.5 font-bold uppercase tracking-[0.18em]"
              style={{ fontSize: tvType.micro, color: BB.primary, background: `${BB.primary}1a`, border: `1px solid ${BB.primary}55` }}>
              {MODE_LABEL[mode] || mode}
            </span>
          )}
        </div>
        <span className={`${tvPanel} px-5 py-2 font-bold tabular-nums`} style={{ fontSize: tvType.micro, color: BB.dim }}>
          {t('tv.round', 'Runde')} {round}/{total}
        </span>
      </div>

      {/* HERO */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-[clamp(1rem,2vh,2rem)] min-h-0 px-[clamp(1.25rem,2.4vw,3rem)]">
        {/* Active player */}
        <motion.div
          className="rounded-2xl px-10 py-3"
          style={{ background: `${playerColor}1a`, border: `2px solid ${playerColor}55`, ...tvActiveRing(playerColor) }}
          key={player}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <span className="font-black" style={{ fontSize: tvType.title, color: playerColor }}>{player}</span>
        </motion.div>

        {/* Bomb + circular timer */}
        <div className="relative">
          <svg className="absolute inset-[-24px]" width={circleRadius * 2 + 48} height={circleRadius * 2 + 48} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={circleRadius + 24} cy={circleRadius + 24} r={circleRadius} fill="none" stroke="#1b2028" strokeWidth="6" />
            <motion.circle
              cx={circleRadius + 24} cy={circleRadius + 24} r={circleRadius}
              fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3 }}
              style={{ filter: `drop-shadow(0 0 8px ${ringColor}99)` }}
            />
          </svg>

          {/* Bomb emoji — fixed static shadow; opacity (not blur radius) carries the heat */}
          <motion.div
            className="w-[clamp(13rem,22vw,16rem)] h-[clamp(13rem,22vw,16rem)] flex items-center justify-center relative"
            animate={ambient ? { scale: [1, 1 + progress * 0.06, 1] } : { scale: 1 }}
            transition={ambient ? { repeat: Infinity, duration: pulseSpeed, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <span className="text-[clamp(6rem,12vw,8rem)] select-none" style={{ filter: `drop-shadow(0 0 38px rgba(255,115,80,${bombGlow}))` }}>💣</span>

            {/* Live countdown on the fuse (or '???' when the time is hidden) */}
            {phase === 'playing' && (
              <span
                className="absolute font-black tabular-nums"
                style={{ bottom: '4%', fontSize: tvType.display, lineHeight: 1, color: randomTimer ? BB.primary : ringColor, textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}
              >
                {randomTimer || timeLeft < 0 ? '???' : `${timeLeft}`}
              </span>
            )}

            {/* Fuse spark — opacity/scale only, gated */}
            <motion.div
              className="absolute w-4 h-4 rounded-full"
              style={{ background: BB.spark, boxShadow: '0 0 12px #fbbf24, 0 0 24px rgba(251,191,36,0.6)', top: '12%', left: '55%' }}
              animate={ambient ? { opacity: [1, 0.4, 1], scale: [1, 1.5, 1] } : { opacity: 1, scale: 1 }}
              transition={ambient ? { repeat: Infinity, duration: pulseSpeed * 0.5 } : { duration: 0.3 }}
            />
          </motion.div>

          {/* Expanding pulse rings — transform/opacity, gated */}
          {ambient && (
            <>
              <motion.div
                className="absolute inset-[-30px] rounded-full border-2"
                style={{ borderColor: `rgba(255,115,80,${0.15 + progress * 0.2})` }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: pulseSpeed }}
              />
              <motion.div
                className="absolute inset-[-55px] rounded-full border"
                style={{ borderColor: `rgba(255,115,80,${0.08 + progress * 0.12})` }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ repeat: Infinity, duration: pulseSpeed, delay: 0.1 }}
              />
            </>
          )}
        </div>

        {/* Task */}
        <AnimatePresence mode="wait">
          {task ? (
            <motion.div
              className="max-w-4xl text-center"
              key={task}
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <p className="font-bold leading-relaxed" style={{ fontSize: tvType.title, color: BB.text, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{task}</p>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              className="flex items-center gap-3"
              animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }}
              transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: BB.primary }} />
              <span style={{ fontSize: tvType.body, color: BB.dim }}>{t('tv.bomb.waiting', 'Warte auf Aufgabe...')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SCOREBOARD strip — whole party */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard players={roster} sort="order" />
      </div>
    </div>
  );
}
