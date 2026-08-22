import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVEmojiGuessView — big-screen view for the EmojiGuess game.
 *
 * Broadcast layout (TV is the richer shared canvas — more than the phone):
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ round/progress · category pill · active-player badge     │  (rails)
 *   ├─────────────────────────────────────────────────────────┤
 *   │            HERO: giant emoji puzzle (gentle pulse)        │
 *   │            on reveal → answer text (cyan spring glow)     │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ SCOREBOARD strip — every player, streak 🔥, active ring   │
 *   └─────────────────────────────────────────────────────────┘
 *
 * The answer stays hidden during `playing` — it is only present on the bridge
 * once the host reveals it (see EmojiGuessGame's useTVGameBridge).
 */
const EG = { primary: '#df8eff', cyan: '#8ff5ff', accent: '#fbbf24', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface TVPlayer { id: string; name: string; color: string; score: number; streak: number; avatar?: string }

export default function TVEmojiGuessView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const players: TVPlayer[] = gameState?.players || [];
  const currentRound: number = gameState?.currentRound ?? 1;
  const totalRounds: number = gameState?.totalRounds ?? 1;
  const currentPlayerIdx: number = gameState?.currentPlayerIdx ?? 0;
  const emojis: string = gameState?.emojis || '';
  const category: string = gameState?.category || '';
  const answer: string = gameState?.answer || '';
  const timeLeft: number | undefined = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : undefined;
  const maxTime: number = gameState?.maxTime ?? 30;

  const activePlayer = players[currentPlayerIdx] ?? null;
  const activeColor = activePlayer?.color || EG.primary;
  const revealed = phase === 'reveal' && !!answer;

  // Whole-party roster — every player on the shared canvas (streak as subtitle).
  const roster: TVScorePlayer[] = useMemo(
    () => players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score,
      avatar: p.avatar,
      subtitle: p.streak > 1 ? `🔥${p.streak}` : undefined,
    })),
    [players],
  );

  const roundProgress = useMemo(() => {
    if (!totalRounds || totalRounds <= 0) return 0;
    return Math.max(0, Math.min(1, currentRound / totalRounds));
  }, [currentRound, totalRounds]);

  const timeProgress = useMemo(() => {
    if (timeLeft === undefined || maxTime <= 0) return null;
    return Math.max(0, Math.min(1, timeLeft / maxTime));
  }, [timeLeft, maxTime]);

  const timerColor = timeProgress === null ? EG.cyan
    : timeProgress > 0.5 ? EG.cyan
    : timeProgress > 0.2 ? EG.accent
    : '#ff5d73';

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: EG.bg, color: EG.text }}>
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.09)' }} />

      {/* Timer bar (only if the bridge carries a timer) */}
      {timeProgress !== null && (
        <div className="relative w-full h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full w-full origin-left"
            style={{ background: timerColor }}
            animate={{ scaleX: timeProgress }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* TOP rails */}
      <div className="relative flex items-start justify-between px-[clamp(1.25rem,2.4vw,3rem)] pt-[clamp(1rem,2vh,2rem)] gap-4">
        {/* round + progress */}
        <div className={`${tvPanel} flex flex-col gap-2 px-[clamp(1rem,1.6vw,1.75rem)] py-[clamp(0.6rem,1.2vh,1rem)]`}>
          <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: EG.dim }}>
            {t('tv.round', 'Runde')}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-black tabular-nums" style={{ fontSize: tvType.title }}>
              {currentRound}<span style={{ color: EG.dim }}>/{totalRounds}</span>
            </span>
            <div className="h-2 rounded-full overflow-hidden" style={{ width: 'clamp(5rem,8vw,9rem)', background: 'rgba(255,255,255,0.1)' }}>
              <motion.div className="h-full w-full rounded-full origin-left"
                style={{ background: `linear-gradient(90deg, ${EG.primary}, ${EG.cyan})` }}
                animate={{ scaleX: roundProgress }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>

        {/* category pill */}
        {category && (
          <div className="flex-1 flex justify-center pt-2">
            <span className="px-[clamp(1rem,1.8vw,2rem)] py-[clamp(0.4rem,0.9vh,0.75rem)] rounded-full font-bold"
              style={{ fontSize: tvType.label, color: EG.primary, background: 'rgba(223,142,255,0.08)', border: `1px solid ${EG.primary}44` }}>
              {category}
            </span>
          </div>
        )}

        {/* active player badge — the one unmistakable "live" element */}
        {activePlayer && (
          <motion.div
            key={activePlayer.id}
            className={`${tvPanel} flex items-center gap-3 px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.5rem,1vh,0.85rem)]`}
            style={{ ...tvActiveRing(activeColor) }}
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 220 }}
          >
            <motion.div
              className="rounded-full flex items-center justify-center font-black text-white shrink-0"
              style={{ width: 'clamp(2rem,2.6vw,2.75rem)', height: 'clamp(2rem,2.6vw,2.75rem)', fontSize: tvType.micro, background: activeColor }}
              animate={ambient && !revealed ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={ambient && !revealed ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            >
              {activePlayer.avatar || activePlayer.name?.slice(0, 1).toUpperCase()}
            </motion.div>
            <div className="leading-tight">
              <div className="uppercase tracking-[0.2em] font-bold" style={{ fontSize: tvType.micro, color: EG.dim }}>
                {t('tv.nowGuessing', 'Raet jetzt')}
              </div>
              <div className="font-black" style={{ fontSize: tvType.label, color: EG.text }}>{activePlayer.name}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* HERO — emoji puzzle / reveal */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-12 min-h-0 gap-[clamp(1rem,2.5vh,2.5rem)]">
        {/* halo behind the puzzle — keyed to the active player, brightens on reveal */}
        <motion.div
          className="absolute rounded-full blur-[100px] pointer-events-none"
          style={{ width: '40vw', height: '40vw', background: revealed ? EG.cyan : activeColor }}
          animate={{ opacity: revealed ? 0.22 : ambient ? [0.08, 0.16, 0.08] : 0.1 }}
          transition={revealed ? { duration: 0.6 } : ambient ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />

        <motion.div
          key={emojis}
          className="relative leading-none text-center select-none"
          style={{ fontSize: tvType.hero }}
          initial={{ scale: 0.82, opacity: 0, filter: 'blur(8px)' }}
          animate={ambient && !revealed
            ? { scale: [1, 1.035, 1], opacity: 1, filter: 'blur(0px)' }
            : { scale: revealed ? 0.82 : 1, opacity: 1, filter: 'blur(0px)' }}
          transition={ambient && !revealed
            ? { scale: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.45 }, filter: { duration: 0.45 } }
            : { type: 'spring', damping: 18, stiffness: 170 }}
        >
          {emojis || '❓'}
        </motion.div>

        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div
              key="answer"
              className="relative flex flex-col items-center gap-3 text-center"
              initial={{ opacity: 0, scale: 0.55, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
            >
              <span className="uppercase tracking-[0.4em] font-bold" style={{ fontSize: tvType.label, color: EG.dim }}>
                {t('tv.answer', 'Loesung')}
              </span>
              <span className="font-black leading-tight" style={{ fontSize: tvType.display, color: EG.cyan, textShadow: `0 0 60px ${EG.cyan}77, 0 0 18px ${EG.cyan}44` }}>
                {answer}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="guessing"
              className="relative flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="font-bold uppercase tracking-[0.35em]"
                style={{ fontSize: tvType.label, color: EG.dim }}
                animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }}
                transition={ambient ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
              >
                {t('tv.emojiguess.whatIsIt', 'Was bedeutet es?')}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM — whole-party roster (shared component) */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard party={gameState?.partyNight} players={roster} activeId={activePlayer?.id ?? null} sort="score" />
      </div>
    </div>
  );
}
