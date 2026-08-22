import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvPanelRaised, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVCategoryView — big-screen view for the Category (Stadt-Land-Fluss) game.
 *
 * The TV is the richer shared canvas: it shows the live category + letter, the
 * active player as a HERO, the words already named this round (which the phones
 * can't all see at once) and, on roundEnd, the loser in red. Data arrives via
 * the host's `category` bridge (see CategoryGame).
 */
const CAT = { primary: '#df8eff', secondary: '#8ff5ff', loser: '#ff6b98', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player {
  id?: string;
  name: string;
  color?: string;
  avatar?: string;
  score?: number;
  losses?: number;
}

export default function TVCategoryView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const currentRound = gameState?.currentRound || gameState?.round || 1;
  const currentPlayerIndex = gameState?.currentPlayerIndex ?? 0;
  const currentCategory = gameState?.currentCategory || gameState?.category || '';
  const currentLetter: string | undefined = gameState?.currentLetter || undefined;
  const players: Player[] = gameState?.players || [];
  const roundWords: { word: string; playerId: string }[] = gameState?.roundWords || [];
  const loserId: string | null = gameState?.loserId ?? null;
  const isRoundEnd = phase === 'roundEnd';

  const currentPlayer = players[currentPlayerIndex] || null;
  const activeColor = currentPlayer?.color || CAT.primary;

  // Whole party on screen — leader crown + score, losses as subtitle, and the
  // timed-out player marked 'out' (skull) on roundEnd.
  const roster: TVScorePlayer[] = players.map((p) => ({
    id: p.id || p.name,
    name: p.name,
    color: p.color || CAT.primary,
    score: p.score ?? 0,
    subtitle: (p.losses ?? 0) > 0 ? `${p.losses} ✗` : undefined,
    status: isRoundEnd && p.id != null && p.id === loserId ? 'out' : undefined,
  }));
  const activeId = currentPlayer?.id || currentPlayer?.name || null;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: CAT.bg, color: CAT.text }}>
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.08)' }} />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-[clamp(1.25rem,2.4vw,3rem)] pt-[clamp(1rem,2vh,2rem)]">
        <span className="font-black italic tracking-[0.18em]" style={{ fontSize: tvType.label, color: CAT.primary }}>
          {t('games.category.title', 'KATEGORIE').toUpperCase()}
        </span>
        <motion.div
          key={currentRound}
          className={`${tvPanel} px-5 py-2`}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <span className="font-bold uppercase tracking-[0.2em]" style={{ fontSize: tvType.micro, color: CAT.dim }}>
            {t('tv.round', 'Runde')} {currentRound}
          </span>
        </motion.div>
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(260px,1fr)_2fr_minmax(260px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
        {/* LEFT — active player HERO */}
        <div className={`${tvPanelRaised} flex flex-col items-center justify-center gap-6 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: CAT.dim }}>
            {t('tv.nowPlaying', 'Jetzt dran')}
          </span>
          <AnimatePresence mode="wait">
            {currentPlayer && (
              <motion.div
                key={currentPlayerIndex}
                className="flex flex-col items-center gap-4"
                initial={{ y: 24, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -16, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              >
                <div className="relative flex items-center justify-center" style={{ width: 'clamp(6rem,9.5vw,11rem)', height: 'clamp(6rem,9.5vw,11rem)' }}>
                  {/* halo pulse — scale/opacity only, gated */}
                  {ambient && !isRoundEnd && (
                    <motion.span
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ border: `2px solid ${activeColor}` }}
                      animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                    />
                  )}
                  <motion.div
                    className="rounded-full flex items-center justify-center font-black text-white"
                    style={{
                      width: 'clamp(5rem,8vw,9rem)', height: 'clamp(5rem,8vw,9rem)', fontSize: tvType.title,
                      background: activeColor, ...tvActiveRing(activeColor),
                    }}
                    animate={ambient && !isRoundEnd ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={ambient && !isRoundEnd ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : { duration: 0.3 }}
                  >
                    {currentPlayer.avatar || currentPlayer.name?.charAt(0)?.toUpperCase() || '?'}
                  </motion.div>
                </div>
                <div className="font-black leading-tight text-center" style={{ fontSize: tvType.title, color: activeColor, textShadow: `0 0 32px ${activeColor}55` }}>
                  {currentPlayer.name}
                </div>
                <span className="uppercase tracking-[0.25em] font-medium px-4 py-1.5 rounded-full"
                  style={{ fontSize: tvType.micro, color: activeColor, background: `${activeColor}1a`, border: `1px solid ${activeColor}44` }}>
                  {t('tv.category.isUp', 'ist dran')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CENTER — category HERO + letter badge */}
        <div className="flex flex-col items-center justify-center gap-8 min-h-0">
          {currentLetter && (
            <motion.div
              key={currentLetter}
              className="rounded-3xl flex items-center justify-center font-black"
              style={{
                width: 'clamp(4.5rem,7vw,7.5rem)', height: 'clamp(4.5rem,7vw,7.5rem)', fontSize: tvType.title,
                color: CAT.secondary, background: `${CAT.secondary}1a`, border: `2px solid ${CAT.secondary}66`,
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              {currentLetter.toUpperCase()}
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {currentCategory ? (
              <motion.div
                key={currentCategory}
                className={`${tvPanel} px-[clamp(2rem,4vw,4rem)] py-[clamp(1.5rem,3vw,3rem)] text-center`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.06, 1], opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="uppercase tracking-[0.25em] font-bold block mb-4" style={{ fontSize: tvType.micro, color: CAT.dim }}>
                  {t('tv.category.category', 'Kategorie')}
                </span>
                <h2 className="font-black text-white max-w-[16ch] leading-none" style={{ fontSize: tvType.display }}>
                  {currentCategory}
                </h2>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                className="flex items-center gap-3"
                animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }}
                transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: CAT.primary }} />
                <span style={{ fontSize: tvType.body, color: CAT.dim }}>{t('tv.category.waiting', 'Warte auf Kategorie...')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — words named this round */}
        <div className={`${tvPanel} flex flex-col p-[clamp(1rem,1.8vw,2rem)] min-h-0`}>
          <span className="uppercase tracking-[0.25em] font-bold mb-4" style={{ fontSize: tvType.micro, color: CAT.dim }}>
            {t('tv.category.named', 'Genannt')} · {roundWords.length}
          </span>
          <div className="flex flex-col gap-2.5 overflow-hidden">
            <AnimatePresence initial={false}>
              {[...roundWords].slice(-9).reverse().map((w, i) => {
                const owner = players.find((p) => p.id === w.playerId);
                const c = owner?.color || CAT.primary;
                return (
                  <motion.div
                    key={`${w.word}-${roundWords.length - i}`}
                    className="rounded-2xl px-4 py-2.5 font-bold flex items-center gap-3"
                    style={{ fontSize: tvType.body, color: CAT.text, background: '#0d0915', border: '1px solid rgba(255,255,255,0.08)' }}
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  >
                    <span className="rounded-full" style={{ width: 'clamp(0.6rem,0.8vw,0.9rem)', height: 'clamp(0.6rem,0.8vw,0.9rem)', background: c }} />
                    <span className="truncate">{w.word}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {roundWords.length === 0 && (
              <span style={{ fontSize: tvType.micro, color: CAT.dim }}>{t('tv.category.noWordsYet', 'Noch keine Wörter')}</span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM — full-party scoreboard (loser marked 'out' on roundEnd) */}
      {players.length > 0 && (
        <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={isRoundEnd ? null : activeId} sort="score" />
        </div>
      )}
    </div>
  );
}
