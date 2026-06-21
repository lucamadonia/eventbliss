import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard from '../components/TVScoreboard';

/**
 * TVOhrwurmView — big-screen view for the Ohrwurm music-timeline game.
 *
 * Broadcast layout (the TV is the richer shared canvas — more than the phone):
 *   ┌─────────────┬───────────────────────┬─────────────┐
 *   │ NOW PLAYING │  HERO: countdown /    │  TIMELINE   │
 *   │ active +    │  reveal (year/title)  │  (active    │
 *   │ equalizer   │                       │  player)    │
 *   ├─────────────┴───────────────────────┴─────────────┤
 *   │ SCOREBOARD strip — every player, target progress  │
 *   └───────────────────────────────────────────────────┘
 *
 * The TV is the speaker: it plays the hidden 30s preview while a round runs
 * (the song stays a mystery — no title until the reveal). Data arrives via the
 * host's `tv-state` broadcast (see OhrwurmGame).
 */
const OW = { primary: '#FF2E88', secondary: '#26E0C4', accent: '#FFD23F', text: '#F7F2E9', dim: '#b3a8c9', bg: '#0d0915' };

interface TVPlayer { id: string; name: string; color: string; score: number; hooks: number }

export default function TVOhrwurmView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const phase: string = gameState?.phase || 'draw';
  const players: TVPlayer[] = gameState?.players || [];
  const activeName: string = gameState?.activeName || '';
  const activeId: string | null = gameState?.activeId ?? null;
  const timeline: { id: string; year: number }[] = gameState?.timeline || [];
  const listening: boolean = !!gameState?.listening;
  const timeLeft: number = gameState?.timeLeft ?? 0;
  const totalTime: number = gameState?.totalTime ?? 60;
  const winTarget: number = gameState?.winTarget ?? 10;
  const previewUrl: string | null = gameState?.previewUrl ?? null;
  const reveal = gameState?.reveal as { year: number; title: string; artist: string; flag?: string; genre?: string } | null;
  const winnerName: string | null = gameState?.winnerName ?? null;

  const active = players.find((p) => p.id === activeId);
  const activeColor = active?.color || OW.primary;

  // TV is the speaker — play the hidden preview while a round runs.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlay = listening && !!previewUrl && phase !== 'reveal' && phase !== 'gameOver';
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (shouldPlay) a.play().catch(() => {});
    else a.pause();
  }, [shouldPlay, previewUrl]);

  useEffect(() => {
    const unlock = () => { if (shouldPlay) audioRef.current?.play().catch(() => {}); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [shouldPlay]);

  const progress = Math.max(0, Math.min(1, timeLeft / totalTime));

  if (phase === 'gameOver') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-10" style={{ background: OW.bg }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45 }} className="text-center">
          <div style={{ fontSize: tvType.display }}>🏆</div>
          <div className="font-black" style={{ fontSize: tvType.title, color: activeColor }}>{winnerName} {t('tv.wins', 'gewinnt!')}</div>
        </motion.div>
        <TVScoreboard players={players.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score, subtitle: `${p.hooks}🎣` }))} target={winTarget} activeId={null} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: OW.bg, color: OW.text }}>
      <audio ref={audioRef} src={previewUrl ?? undefined} preload="none" loop className="hidden" aria-hidden />
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(255,46,136,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(38,224,196,0.09)' }} />

      {/* Wordmark */}
      <div className="relative flex items-center justify-center gap-3 pt-[clamp(1rem,2vh,2rem)]">
        <span style={{ fontSize: tvType.label }}>🎵</span>
        <span className="font-black tracking-[0.35em]" style={{ fontSize: tvType.label, color: OW.primary }}>OHRWURM</span>
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(280px,1fr)_2fr_minmax(280px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
        {/* LEFT — NOW PLAYING */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-6 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: OW.dim }}>
            {t('tv.nowPlaying', 'Jetzt dran')}
          </span>
          <div className="rounded-full flex items-center justify-center font-black text-white"
            style={{ width: 'clamp(5rem,8vw,9rem)', height: 'clamp(5rem,8vw,9rem)', fontSize: tvType.title, background: activeColor, ...tvActiveRing(activeColor) }}>
            {activeName?.slice(0, 1).toUpperCase()}
          </div>
          <div className="font-black leading-tight" style={{ fontSize: tvType.title, color: OW.text }}>{activeName}</div>
          <span style={{ fontSize: tvType.micro, color: OW.dim }}>{t('tv.ohrwurm.playingMystery', 'spielt den Mystery-Track')}</span>
          {/* Equalizer — scaleY (compositor), gated on ambient */}
          <div className="flex items-end gap-2.5" style={{ height: 'clamp(3rem,7vh,6rem)' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="w-3 rounded-full origin-bottom" style={{ height: '100%', background: `linear-gradient(${OW.secondary}, ${OW.primary})` }}
                animate={listening && ambient ? { scaleY: [0.25, 1, 0.4, 0.9, 0.3] } : { scaleY: listening ? 0.6 : 0.2 }}
                transition={listening && ambient ? { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' } : { duration: 0.3 }} />
            ))}
          </div>
        </div>

        {/* CENTER — HERO */}
        <div className="flex flex-col items-center justify-center min-h-0">
          <AnimatePresence mode="wait">
            {reveal ? (
              <motion.div key="reveal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center">
                <span className="uppercase tracking-[0.25em] font-black" style={{ fontSize: tvType.label, color: OW.dim }}>{t('tv.ohrwurm.releaseYear', 'Erscheinungsjahr')}</span>
                <span className="leading-none font-black" style={{ fontSize: tvType.hero, color: OW.primary, textShadow: `0 0 60px ${OW.primary}66` }}>{reveal.year}</span>
                <h2 className="font-black text-white max-w-[20ch]" style={{ fontSize: tvType.title }}>{reveal.title}</h2>
                <p className="font-semibold" style={{ fontSize: tvType.body, color: OW.dim }}>{reveal.artist} {reveal.flag || ''}</p>
                {reveal.genre && <span className="px-4 py-1.5 rounded-full font-bold" style={{ fontSize: tvType.micro, color: OW.accent, border: `1px solid ${OW.accent}55` }}>{reveal.genre}</span>}
              </motion.div>
            ) : (
              <motion.div key="play" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 text-center">
                <span className="uppercase tracking-[0.3em] font-bold" style={{ fontSize: tvType.label, color: OW.dim }}>
                  {listening ? t('tv.ohrwurm.mysteryRunning', 'Mystery-Song läuft') : t('tv.ready', 'Bereit')}
                </span>
                <div className="font-black tabular-nums leading-none" style={{ fontSize: tvType.hero, color: timeLeft <= 10 ? '#ff5d73' : OW.text }}>
                  {listening ? `${timeLeft}` : '🎧'}
                </div>
                {/* Timer bar — scaleX (compositor) */}
                <div className="h-3 rounded-full overflow-hidden" style={{ width: 'min(46vw,560px)', background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full w-full rounded-full origin-left"
                    style={{ background: progress > 0.5 ? OW.secondary : progress > 0.16 ? OW.accent : '#ff5d73' }}
                    animate={{ scaleX: progress }} transition={{ duration: 0.3 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — TIMELINE (active player) */}
        <div className={`${tvPanel} flex flex-col p-[clamp(1rem,1.8vw,2rem)] min-h-0`}>
          <span className="uppercase tracking-[0.25em] font-bold mb-4" style={{ fontSize: tvType.micro, color: OW.dim }}>
            {t('tv.ohrwurm.timeline', 'Timeline')} · {activeName}
          </span>
          <div className="flex flex-col gap-2.5 overflow-hidden">
            <div className="rounded-2xl px-4 py-3 font-black tabular-nums text-center" style={{ fontSize: tvType.body, color: OW.primary, background: `${OW.primary}1a`, border: `2px dashed ${OW.primary}` }}>?</div>
            {[...timeline].sort((a, b) => b.year - a.year).map((s) => (
              <div key={s.id} className="rounded-2xl px-4 py-3 font-black tabular-nums text-center" style={{ fontSize: tvType.body, color: OW.text, background: '#1b1430', border: '1px solid rgba(255,255,255,0.08)' }}>{s.year}</div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM — scoreboard strip (shared roster: every player, ranked) */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard players={players.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score, subtitle: `${p.hooks}🎣` }))} target={winTarget} activeId={activeId} />
      </div>
    </div>
  );
}

