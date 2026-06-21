import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVStoryView — big-screen view for the Story-Builder game.
 *
 * The TV is the page: finished sentences scroll movie-credits style as the HERO,
 * with a mode/round badge, a sentence counter and the current author highlighted.
 * The in-progress typed input is NEVER broadcast — the TV only ever shows
 * sentences once they're locked in. Data arrives via the host's `storybuilder`
 * bridge (see StoryBuilderGame).
 */
const STY = { gold: '#fbbf24', accent: '#df8eff', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player { id?: string; name: string; color?: string; avatar?: string }
interface Sentence { text: string; player?: string; playerColor?: string }

export default function TVStoryView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const sentences: Sentence[] = gameState?.sentences || [];
  const players: Player[] = gameState?.players || [];
  const currentPlayerIdx: number = gameState?.currentPlayerIdx ?? 0;
  const currentPlayer = players[currentPlayerIdx] || null;
  const round = gameState?.currentRound || gameState?.round || 1;
  const total = gameState?.totalRounds || gameState?.total || '?';
  const phase: string = gameState?.phase || 'writing';
  const mode: string = gameState?.mode || 'classic';
  const prompt: string = gameState?.prompt || '';
  const title = gameState?.title || '';

  const modeLabel =
    mode === 'vorgabe' ? t('tv.story.modeVorgabe', 'Vorgabe')
    : mode === 'reimzeit' ? t('tv.story.modeReim', 'Reimzeit')
    : t('tv.story.modeClassic', 'Klassisch');
  const isWriting = phase === 'writing';
  const isComplete = phase === 'complete' || phase === 'storyReveal' || phase === 'gameOver';

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [sentences.length, phase]);

  // Every author on screen — current writer highlighted, subtitle = how many
  // sentences they've contributed so far (derived from the broadcast sentences).
  const contributions: Record<string, number> = {};
  sentences.forEach((s) => { if (s.player) contributions[s.player] = (contributions[s.player] || 0) + 1; });
  const roster: TVScorePlayer[] = players.map((p) => {
    const n = contributions[p.name] || 0;
    return {
      id: p.id || p.name,
      name: p.name,
      color: p.color || STY.accent,
      avatar: p.avatar,
      subtitle: `${n} ${n === 1 ? t('tv.story.sentence', 'Satz') : t('tv.story.sentences', 'Sätze')}`,
    };
  });
  const activeAuthorId = isWriting && currentPlayer ? (currentPlayer.id || currentPlayer.name) : null;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: STY.bg, color: STY.text }}>
      {/* Warm reading-lamp glow (static) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 70% at 100% 0%, rgba(251,191,36,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 70% at 0% 100%, rgba(223,142,255,0.04) 0%, transparent 70%)' }} />

      {/* Top bar — book + title · mode badge · round counter */}
      <div className="flex items-center justify-between px-10 pt-8 pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <motion.div
            animate={ambient ? { rotate: [0, -5, 5, 0] } : { rotate: 0 }}
            transition={ambient ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <BookOpen style={{ width: 'clamp(1.75rem,2.4vw,2.5rem)', height: 'clamp(1.75rem,2.4vw,2.5rem)', color: STY.gold, filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }} />
          </motion.div>
          {title ? (
            <h2 className="font-bold" style={{ fontSize: tvType.title, color: STY.gold, textShadow: '0 0 20px rgba(251,191,36,0.3)' }}>{title}</h2>
          ) : (
            <span className="font-bold uppercase tracking-[0.15em]" style={{ fontSize: tvType.label, color: STY.gold }}>{modeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full" style={{ background: `${STY.accent}1a`, border: `1px solid ${STY.accent}44` }}>
            <span className="font-bold uppercase tracking-[0.12em]" style={{ fontSize: tvType.micro, color: STY.accent }}>{modeLabel}</span>
          </div>
          <div className={`${tvPanel} px-5 py-2`}>
            <span className="font-bold uppercase tracking-[0.2em]" style={{ fontSize: tvType.micro, color: STY.dim }}>
              {t('tv.round', 'Runde')} {round}/{total} · {sentences.length} {t('tv.story.sentences', 'Sätze')}
            </span>
          </div>
        </div>
      </div>

      {/* Prompt / constraint line */}
      <AnimatePresence>
        {isWriting && prompt && (
          <motion.div
            className="mx-10 mb-2 relative z-10"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: '#0d0915', border: `1px solid ${STY.gold}33` }}>
              <span style={{ fontSize: tvType.micro }}>✨</span>
              <span className="font-semibold" style={{ fontSize: tvType.body, color: STY.gold }}>{prompt}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative line */}
      <div className="mx-10 h-[1px] mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.2), transparent)' }} />

      {/* Story content — movie-credits scroll HERO */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 pb-8 relative z-10 scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 90%, transparent)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full space-y-8 py-8">
          {sentences.map((s, i) => {
            const isLast = i === sentences.length - 1;
            return (
              <motion.div
                key={i}
                className="flex flex-col gap-2"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: 'spring', damping: 20 }}
              >
                {s.player && (
                  <span className="font-bold tracking-wide uppercase" style={{ fontSize: tvType.micro, color: s.playerColor || STY.dim, opacity: 0.75 }}>
                    {s.player}
                  </span>
                )}
                <span className="font-semibold leading-relaxed"
                  style={{ fontSize: tvType.title, color: isLast ? 'rgba(241,243,252,0.95)' : 'rgba(241,243,252,0.5)' }}>
                  {s.text}
                </span>
              </motion.div>
            );
          })}

          {/* Current author writing — name only, never the typed text */}
          <AnimatePresence>
            {isWriting && currentPlayer && (
              <motion.div
                className="flex items-center gap-3 mt-4"
                initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="rounded-full flex items-center justify-center text-white font-bold"
                  style={{ width: 'clamp(2rem,2.6vw,2.75rem)', height: 'clamp(2rem,2.6vw,2.75rem)', fontSize: tvType.micro, backgroundColor: currentPlayer.color || STY.accent }}>
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold tracking-wide uppercase" style={{ fontSize: tvType.body, color: currentPlayer.color || STY.accent }}>
                  {currentPlayer.name}
                </span>
                <motion.span className="italic" style={{ fontSize: tvType.body, color: 'rgba(168,171,179,0.5)' }}
                  animate={ambient ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.45 }}
                  transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
                  {t('tv.story.writing', 'schreibt...')}
                </motion.span>
                <motion.span className="inline-block rounded-full" style={{ width: 3, height: '1.2em', backgroundColor: currentPlayer.color || STY.accent }}
                  animate={ambient ? { opacity: [1, 0, 1] } : { opacity: 1 }}
                  transition={ambient ? { repeat: Infinity, duration: 0.8 } : { duration: 0.3 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed story */}
          {isComplete && (
            <motion.div className="text-center pt-12 pb-4"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.3 }}>
              <span className="font-black italic" style={{ fontSize: sentences.length === 0 ? tvType.hero : tvType.title, color: STY.gold, textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
                {sentences.length === 0 ? t('tv.story.theEnd', 'Ende') : `- ${t('tv.story.theEnd', 'Ende')} -`}
              </span>
              {sentences.length === 0 && (
                <p className="mt-4" style={{ fontSize: tvType.body, color: STY.dim }}>{t('tv.story.storyDone', 'Geschichte beendet!')}</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Author roster — every player on screen, current writer highlighted */}
      {players.length > 0 && (
        <div className="relative z-10 px-10 pb-6 pt-2">
          <TVScoreboard players={roster} activeId={activeAuthorId} sort="order" />
        </div>
      )}

      {/* Bottom ambient gradient (static) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to top, rgba(251,191,36,0.03), transparent)' }} />
    </div>
  );
}
