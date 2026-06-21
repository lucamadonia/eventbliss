import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvPanelRaised, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVBottleView — big-screen view for the Bottle-Spin (Flaschendrehen) game.
 *
 * The TV is the stage: the spinning bottle + the ring of players is the HERO.
 * A phase badge (SPINNING / CARD / VOTE) tells the room where they are; in
 * 'fragen' mode a scoreboard strip rides along the bottom; the task card only
 * appears once the bottle has stopped and the card phase begins (hidden until
 * then). Data arrives via the host's `bottlespin` bridge (see BottleSpinGame).
 */
const BTL = { primary: '#df8eff', secondary: '#8ff5ff', yes: '#10b981', no: '#ef4444', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player { id?: string; name: string; color?: string; score?: number }

export default function TVBottleView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const players: Player[] = gameState?.players || [];
  const rotation = gameState?.rotation || 0;
  const phase: string = gameState?.phase || 'spinning';
  const selectedIdx: number = gameState?.selectedIdx ?? -1;
  const selectedName: string = gameState?.selectedName || (selectedIdx >= 0 ? players[selectedIdx]?.name ?? '' : '');
  const task: string = gameState?.task || '';
  const taskType: string = gameState?.taskType || '';
  const mode: string = gameState?.mode || 'fragen';
  const round = gameState?.currentRound || gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const voteYes: number = gameState?.voteYes ?? 0;
  const voteNo: number = gameState?.voteNo ?? 0;

  const count = players.length || 6;
  const radius = 280;
  const containerSize = radius * 2 + 160;
  const isResult = selectedIdx >= 0 && (phase === 'card' || phase === 'vote');

  const phaseBadge =
    phase === 'spinning' ? { label: t('tv.bottle.spinning', 'DREHT'), color: BTL.secondary }
    : phase === 'card' ? { label: t('tv.bottle.card', 'KARTE'), color: BTL.primary }
    : phase === 'vote' ? { label: t('tv.bottle.vote', 'ABSTIMMUNG'), color: BTL.no }
    : null;

  const totalVotes = voteYes + voteNo;
  const yesPct = totalVotes > 0 ? voteYes / totalVotes : 0;

  // Whole party on the bottom strip. Scores only matter in 'fragen' mode; the
  // just-selected player gets the active ring after the bottle stops.
  const showScores = mode === 'fragen';
  const roster: TVScorePlayer[] = players.map((p, i) => ({
    id: p.id || p.name,
    name: p.name,
    color: p.color || `hsl(${(i / count) * 360}, 70%, 60%)`,
    score: showScores ? (p.score ?? 0) : undefined,
  }));
  const selectedId = selectedIdx >= 0 ? (players[selectedIdx]?.id || players[selectedIdx]?.name || null) : null;

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: BTL.bg, color: BTL.text }}>
      {/* Ambient circular glow (static) */}
      <div className="absolute pointer-events-none" style={{
        width: containerSize + 200, height: containerSize + 200, left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(223,142,255,0.05) 0%, transparent 60%)',
      }} />

      {/* Top bar — phase badge + round counter */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
        {phaseBadge ? (
          <div className="px-5 py-2 rounded-full" style={{ background: `${phaseBadge.color}1f`, border: `1px solid ${phaseBadge.color}55` }}>
            <span className="font-bold uppercase tracking-[0.18em]" style={{ fontSize: tvType.micro, color: phaseBadge.color }}>{phaseBadge.label}</span>
          </div>
        ) : <span />}
        <div className={`${tvPanel} px-5 py-2`}>
          <span className="font-bold uppercase tracking-[0.2em]" style={{ fontSize: tvType.micro, color: BTL.dim }}>
            {t('tv.round', 'Runde')} {round}/{total}
          </span>
        </div>
      </div>

      {/* Player circle + bottle HERO */}
      <div className="relative" style={{ width: containerSize, height: containerSize }}>
        {/* Outer decorative rings (static) */}
        <div className="absolute inset-4 rounded-full" style={{ border: '1px solid rgba(223,142,255,0.10)' }} />
        <div className="absolute inset-8 rounded-full" style={{ border: '1px solid rgba(143,245,255,0.06)' }} />

        {/* Player avatars around circle */}
        {players.map((p: Player, i: number) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + containerSize / 2;
          const y = Math.sin(angle) * radius + containerSize / 2;
          const isSelected = i === selectedIdx;
          const color = p.color || `hsl(${(i / count) * 360}, 70%, 60%)`;
          const isWinner = isSelected && isResult;
          return (
            <motion.div
              key={p.id || i}
              className="absolute flex flex-col items-center"
              style={{ left: x - 36, top: y - 36 }}
              animate={
                isWinner ? { scale: 1.25 }
                : isResult && !isSelected ? { opacity: 0.4, scale: 0.85 }
                : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div
                className="rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  width: 72, height: 72, fontSize: tvType.body, backgroundColor: color,
                  border: `3px solid ${isWinner ? '#fff' : `${color}66`}`,
                  ...(isWinner ? tvActiveRing(color) : {}),
                }}
              >
                {(p.name || '?').charAt(0).toUpperCase()}
              </div>
              <span
                className="mt-2 font-bold truncate max-w-[110px] text-center"
                style={{ fontSize: tvType.micro, color: isWinner ? '#fff' : BTL.dim }}
              >
                {p.name}
              </span>
            </motion.div>
          );
        })}

        {/* Bottle - center */}
        <motion.div
          className="absolute"
          style={{ left: containerSize / 2 - 24, top: containerSize / 2 - 80, transformOrigin: '24px 80px' }}
          animate={{ rotate: rotation }}
          transition={phase === 'spinning' ? { duration: 3.5, ease: [0.12, 0.8, 0.2, 1] } : { duration: 0 }}
        >
          <svg width="48" height="160" viewBox="0 0 48 160">
            <defs>
              <linearGradient id="bottle-grad-tv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#df8eff" />
                <stop offset="50%" stopColor="#c77aff" />
                <stop offset="100%" stopColor="#8ff5ff" />
              </linearGradient>
              <filter id="bottle-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <polygon points="24,0 16,18 32,18" fill="#df8eff" filter="url(#bottle-glow)" />
            <rect x="19" y="16" width="10" height="35" rx="5" fill="url(#bottle-grad-tv)" />
            <ellipse cx="24" cy="90" rx="22" ry="55" fill="url(#bottle-grad-tv)" opacity="0.9" />
            <ellipse cx="18" cy="80" rx="6" ry="30" fill="rgba(255,255,255,0.15)" />
          </svg>
        </motion.div>

        {/* Center glow dot — pulse gated on ambient, transform/opacity only */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: containerSize / 2 - 20, top: containerSize / 2 - 20, width: 40, height: 40,
            background: 'radial-gradient(circle, rgba(223,142,255,0.4) 0%, transparent 70%)',
          }}
          animate={ambient ? { scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.7 }}
          transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
        />
      </div>

      {/* Selected player + task card — only after the bottle stops */}
      <AnimatePresence>
        {isResult && selectedName && (
          <motion.div
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 text-center z-10"
            initial={{ y: 40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.25, type: 'spring', damping: 14 }}
          >
            <h2 className="font-black italic mb-4" style={{ fontSize: tvType.title, color: '#fff', textShadow: `0 0 60px ${BTL.primary}66` }}>
              {selectedName}
            </h2>
            {task && (
              <motion.div
                className={`${tvPanelRaised} px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1.25rem,2.5vw,2.5rem)]`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {taskType && (
                  <span className="uppercase tracking-[0.2em] font-bold block mb-3" style={{ fontSize: tvType.micro, color: BTL.primary }}>
                    {taskType === 'frage' ? t('tv.bottle.question', 'Frage') : taskType === 'aufgabe' ? t('tv.bottle.task', 'Aufgabe') : taskType}
                  </span>
                )}
                <p className="font-bold leading-tight" style={{ fontSize: tvType.body, color: BTL.text }}>{task}</p>
              </motion.div>
            )}

            {/* Vote distribution bar */}
            {phase === 'vote' && totalVotes > 0 && (
              <motion.div className="mt-6 mx-auto" style={{ width: 'min(40vw,480px)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-[0.15em]" style={{ fontSize: tvType.micro, color: BTL.yes }}>👍 {voteYes}</span>
                  <span className="font-bold uppercase tracking-[0.15em]" style={{ fontSize: tvType.micro, color: BTL.no }}>{voteNo} 👎</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full origin-left" style={{ background: BTL.yes }} animate={{ scaleX: yesPct }} transition={{ duration: 0.4 }} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinning hint */}
      {phase === 'spinning' && (
        <motion.div className="absolute bottom-16 z-10"
          animate={ambient ? { opacity: [0.3, 0.8, 0.3] } : { opacity: 0.6 }}
          transition={ambient ? { repeat: Infinity, duration: 1 } : { duration: 0.3 }}>
          <span className="font-bold tracking-wide" style={{ fontSize: tvType.body, color: BTL.dim }}>{t('tv.bottle.spinningHint', 'Flasche dreht sich...')}</span>
        </motion.div>
      )}

      {/* Full-party scoreboard strip — every player on screen */}
      {players.length > 0 && (
        <div className="absolute bottom-4 left-0 right-0 px-[clamp(1.25rem,2.4vw,3rem)] z-10">
          <TVScoreboard players={roster} activeId={selectedId} sort={showScores ? 'score' : 'order'} />
        </div>
      )}
    </div>
  );
}
