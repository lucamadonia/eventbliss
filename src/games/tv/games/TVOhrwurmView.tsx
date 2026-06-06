import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TVOhrwurmView — big-screen view for the Ohrwurm music-timeline game.
 *
 * The TV is the speaker: it plays the hidden 30s preview while a round is
 * running (the song stays a mystery — no title shown until the reveal).
 * State arrives via the host's `tv-state` broadcast (see OhrwurmGame).
 */
const OW = { primary: '#FF2E88', secondary: '#26E0C4', accent: '#FFD23F', text: '#F7F2E9', dim: '#b3a8c9', bg: '#0d0915' };

interface TVPlayer { id: string; name: string; color: string; score: number; hooks: number }

export default function TVOhrwurmView({ gameState }: { gameState: any }) {
  const phase: string = gameState?.phase || 'draw';
  const players: TVPlayer[] = gameState?.players || [];
  const activeName: string = gameState?.activeName || '';
  const timeline: { id: string; year: number }[] = gameState?.timeline || [];
  const listening: boolean = !!gameState?.listening;
  const timeLeft: number = gameState?.timeLeft ?? 0;
  const totalTime: number = gameState?.totalTime ?? 60;
  const winTarget: number = gameState?.winTarget ?? 10;
  const previewUrl: string | null = gameState?.previewUrl ?? null;
  const reveal = gameState?.reveal as { year: number; title: string; artist: string; flag?: string; genre?: string } | null;
  const winnerName: string | null = gameState?.winnerName ?? null;

  // TV is the speaker — play the hidden preview while a round runs.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (listening && previewUrl && phase !== 'reveal' && phase !== 'gameOver') {
      a.play().catch(() => { /* autoplay may be blocked until first interaction */ });
    } else {
      a.pause();
    }
  }, [listening, previewUrl, phase]);

  const progress = Math.max(0, Math.min(1, timeLeft / totalTime));

  if (phase === 'gameOver') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: OW.bg }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-[8rem]">🏆</motion.div>
        <h1 className="text-6xl font-black" style={{ color: OW.primary, textShadow: `0 0 40px ${OW.primary}66` }}>
          {winnerName} gewinnt!
        </h1>
        <Leaderboard players={players} winTarget={winTarget} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: OW.bg }}>
      <audio ref={audioRef} src={previewUrl ?? undefined} preload="none" loop className="hidden" aria-hidden />
      <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full blur-[160px]" style={{ background: 'rgba(255,46,136,0.12)' }} />
      <div className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full blur-[160px]" style={{ background: 'rgba(38,224,196,0.10)' }} />

      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="text-2xl">🎵</span>
        <span className="text-3xl font-black tracking-[0.3em]" style={{ color: OW.primary }}>OHRWURM</span>
      </div>

      <AnimatePresence mode="wait">
        {reveal ? (
          <motion.div key="reveal" initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 relative z-10">
            <span className="text-2xl font-black tracking-[0.25em] uppercase" style={{ color: OW.dim }}>Erscheinungsjahr</span>
            <span className="text-[10rem] leading-none font-black" style={{ color: OW.primary, textShadow: `0 0 60px ${OW.primary}66` }}>{reveal.year}</span>
            <h2 className="text-5xl font-black text-white text-center max-w-4xl">{reveal.title}</h2>
            <p className="text-3xl font-semibold" style={{ color: OW.dim }}>{reveal.artist} {reveal.flag || ''}</p>
            {reveal.genre && <span className="px-4 py-1.5 rounded-full text-lg font-bold" style={{ background: OW.bg, color: OW.accent, border: `1px solid ${OW.accent}55` }}>{reveal.genre}</span>}
          </motion.div>
        ) : (
          <motion.div key="play" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 relative z-10">
            <div className="px-10 py-4 rounded-3xl" style={{ background: `${OW.primary}15`, border: `2px solid ${OW.primary}55` }}>
              <span className="text-5xl font-black" style={{ color: OW.primary }}>{activeName} ist dran</span>
            </div>

            {/* Mystery equalizer */}
            <div className="flex items-end gap-3 h-40">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} className="w-6 rounded-full" style={{ background: `linear-gradient(${OW.secondary}, ${OW.primary})` }}
                  animate={listening ? { height: ['25%', '100%', '40%', '90%', '30%'] } : { height: '20%' }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
              ))}
            </div>

            <div className="text-7xl font-black tabular-nums" style={{ color: timeLeft <= 10 ? '#ff5d73' : OW.text }}>
              {listening ? `${timeLeft}s` : 'Bereit?'}
            </div>
            {/* Timer bar */}
            <div className="w-[420px] h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div className="h-full rounded-full" style={{ background: progress > 0.5 ? OW.secondary : progress > 0.16 ? OW.accent : '#ff5d73' }}
                animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            {/* Active player's timeline (years only, song stays hidden) */}
            <div className="flex items-center gap-2 flex-wrap justify-center max-w-5xl mt-2">
              {timeline.map((s) => (
                <div key={s.id} className="px-4 py-2 rounded-xl text-2xl font-black tabular-nums" style={{ background: '#241a39', color: OW.text, border: '1px solid rgba(255,255,255,0.08)' }}>{s.year}</div>
              ))}
              <div className="px-5 py-2 rounded-xl text-2xl font-black" style={{ background: `${OW.primary}22`, color: OW.primary, border: `2px dashed ${OW.primary}` }}>?</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoreboard */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Leaderboard players={players} winTarget={winTarget} compact />
      </div>
    </div>
  );
}

function Leaderboard({ players, winTarget, compact = false }: { players: TVPlayer[]; winTarget: number; compact?: boolean }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {sorted.map((p) => (
        <div key={p.id} className={`flex items-center gap-3 rounded-2xl ${compact ? 'px-4 py-2' : 'px-6 py-3'}`} style={{ background: '#1e1530', border: `1.5px solid ${p.color}55` }}>
          <div className={`rounded-full flex items-center justify-center font-black text-white ${compact ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-lg'}`} style={{ background: p.color }}>{p.name?.slice(0, 1).toUpperCase()}</div>
          <div className="leading-tight">
            <div className={`font-bold text-white ${compact ? 'text-base' : 'text-2xl'}`}>{p.name}</div>
            <div className={`font-mono ${compact ? 'text-xs' : 'text-base'}`} style={{ color: '#b3a8c9' }}>
              <span style={{ color: OW.secondary }}>{p.score}</span>/{winTarget} · {p.hooks} 🎣
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
