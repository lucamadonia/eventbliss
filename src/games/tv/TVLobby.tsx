import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Wifi, Gamepad2 } from 'lucide-react';
import { getBaseUrl } from '@/lib/platform';
import type { TVPlayer } from './useTVConnection';

const springBouncy = { type: 'spring' as const, stiffness: 400, damping: 15 };
const spring = { type: 'spring' as const, stiffness: 300, damping: 20 };

/* ─── Floating gradient orbs ─── */
function FloatingOrbs() {
  const orbs = [
    { x: '15%', y: '20%', size: 300, color: '#df8eff', delay: 0, duration: 8 },
    { x: '75%', y: '60%', size: 350, color: '#ff6b98', delay: 1.5, duration: 10 },
    { x: '50%', y: '80%', size: 250, color: '#8ff5ff', delay: 3, duration: 9 },
    { x: '85%', y: '15%', size: 200, color: '#fbbf24', delay: 2, duration: 7 },
    { x: '25%', y: '70%', size: 280, color: '#df8eff', delay: 4, duration: 11 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}18 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated dots for waiting text ─── */
function WaitingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {[0, 0.3, 0.6].map((delay, i) => (
        <motion.span
          key={i}
          className="text-xl text-[#a8abb3]"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, delay, repeat: Infinity }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

export default function TVLobby({ roomCode, players, isConnected, error }: { roomCode: string; players: TVPlayer[]; isConnected: boolean; error?: string | null }) {
  const joinUrl = `${getBaseUrl().replace(/^https?:\/\//, '')}/tv/${roomCode}`;

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ backgroundColor: '#060810' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <FloatingOrbs />

      {/* Connection indicator */}
      <div className="absolute top-6 left-8 flex items-center gap-2 z-10">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#8ff5ff] shadow-[0_0_12px_#8ff5ff]' : 'bg-[#ff6e84]'} animate-pulse`} />
        <span className="text-sm font-bold text-[#a8abb3] tracking-wider">{isConnected ? 'VERBUNDEN' : error ? 'FEHLER' : 'VERBINDE...'}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-14 left-8 z-10 max-w-md">
          <span className="text-sm font-bold text-[#ff6e84]">{error}</span>
        </div>
      )}

      {/* Fullscreen button */}
      <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
        className="absolute top-6 right-8 p-3 rounded-xl bg-[#151a21]/60 border border-white/5 text-[#a8abb3] hover:text-white transition-colors z-10">
        <Maximize className="w-5 h-5" />
      </button>

      {/* ROOM CODE — massive with shimmer */}
      <motion.div className="text-center mb-12 relative z-10" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.2 }}>
        <p className="text-lg font-bold text-[#a8abb3] uppercase tracking-[0.3em] mb-4">Room Code</p>
        <div className="relative inline-block">
          <h1 className="text-[10rem] md:text-[14rem] font-black italic leading-none tracking-[0.2em] relative"
            style={{
              background: 'linear-gradient(135deg, #df8eff 0%, #ff6b98 40%, #8ff5ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(223,142,255,0.4)) drop-shadow(0 0 80px rgba(223,142,255,0.2))',
            }}>
            {roomCode}
          </h1>
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          />
        </div>
      </motion.div>

      {/* Join URL */}
      <motion.div className="mb-16 text-center relative z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <p className="text-[#a8abb3] text-xl tracking-wide">Gehe zu</p>
        <p className="text-2xl font-bold text-[#8ff5ff] mt-1 tracking-wide" style={{ textShadow: '0 0 20px rgba(143,245,255,0.4)' }}>{joinUrl}</p>
      </motion.div>

      {/* Player avatars */}
      <div className="flex items-end gap-6 mb-16 min-h-[120px] relative z-10">
        <AnimatePresence>
          {players.map((p, i) => (
            <motion.div key={p.id} className="flex flex-col items-center gap-3"
              initial={{ scale: 0, y: 80 }}
              animate={{ scale: [0, 1.2, 1], y: 0 }}
              exit={{ scale: 0, y: -30, opacity: 0 }}
              transition={{ ...springBouncy, delay: i * 0.1 }}>
              <div className="relative">
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: p.color, boxShadow: `0 0 30px ${p.color}66` }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {p.avatar}
                </motion.div>
                {p.isReady && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springBouncy}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#8ff5ff] flex items-center justify-center shadow-[0_0_12px_#8ff5ff]">
                    <span className="text-[#060810] text-sm font-bold">✓</span>
                  </motion.div>
                )}
              </div>
              <span className="text-lg font-bold text-white">{p.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center gap-3 opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#a8abb3]/30 flex items-center justify-center">
              <span className="text-2xl text-[#a8abb3]/30">+</span>
            </div>
            <span className="text-lg text-[#a8abb3]/30">...</span>
          </div>
        ))}
      </div>

      {/* Waiting indicator with animated dots */}
      <motion.div
        className="flex items-center gap-3 relative z-10"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Wifi className="w-5 h-5 text-[#df8eff]" />
        <span className="text-xl text-[#a8abb3] font-medium tracking-wider">
          Warte auf Spieler<WaitingDots />
        </span>
      </motion.div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#151a21]/40 backdrop-blur-xl border border-white/5">
          <Gamepad2 className="w-5 h-5 text-[#df8eff]" />
          <span className="text-sm font-bold text-[#a8abb3] tracking-wider">EVENTBLISS GAMES</span>
          <span className="text-sm text-[#df8eff] font-black italic">ELECTRIC PULSE</span>
        </div>
      </div>
    </motion.div>
  );
}
