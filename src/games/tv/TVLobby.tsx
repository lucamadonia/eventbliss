import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Wifi, Gamepad2 } from 'lucide-react';
import type { TVPlayer } from './useTVConnection';

const spring = { type: 'spring' as const, stiffness: 300, damping: 20 };

export default function TVLobby({ roomCode, players, isConnected }: { roomCode: string; players: TVPlayer[]; isConnected: boolean }) {
  const joinUrl = `eventbliss.vercel.app/games?room=${roomCode}`;

  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center p-8 relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Connection indicator */}
      <div className="absolute top-6 left-8 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#8ff5ff] shadow-[0_0_12px_#8ff5ff]' : 'bg-[#ff6e84]'} animate-pulse`} />
        <span className="text-sm font-bold text-[#a8abb3] tracking-wider">{isConnected ? 'VERBUNDEN' : 'VERBINDE...'}</span>
      </div>

      {/* Fullscreen button */}
      <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
        className="absolute top-6 right-8 p-3 rounded-xl bg-[#151a21]/60 border border-white/5 text-[#a8abb3] hover:text-white transition-colors">
        <Maximize className="w-5 h-5" />
      </button>

      {/* ROOM CODE — massive */}
      <motion.div className="text-center mb-12" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.2 }}>
        <p className="text-lg font-bold text-[#a8abb3] uppercase tracking-[0.3em] mb-4">Room Code</p>
        <h1 className="text-[10rem] md:text-[14rem] font-black italic leading-none tracking-[0.2em]"
          style={{ background: 'linear-gradient(135deg, #df8eff 0%, #ff6b98 40%, #8ff5ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 40px rgba(223,142,255,0.4)) drop-shadow(0 0 80px rgba(223,142,255,0.2))' }}>
          {roomCode}
        </h1>
      </motion.div>

      {/* Join URL */}
      <motion.div className="mb-16 text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <p className="text-[#a8abb3] text-xl tracking-wide">Gehe zu</p>
        <p className="text-2xl font-bold text-[#8ff5ff] mt-1 tracking-wide" style={{ textShadow: '0 0 20px rgba(143,245,255,0.4)' }}>{joinUrl}</p>
      </motion.div>

      {/* Player avatars */}
      <div className="flex items-end gap-6 mb-16 min-h-[120px]">
        <AnimatePresence>
          {players.map((p, i) => (
            <motion.div key={p.id} className="flex flex-col items-center gap-3"
              initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: -30 }}
              transition={{ ...spring, delay: i * 0.1 }}>
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: p.color, boxShadow: `0 0 30px ${p.color}66` }}>
                  {p.avatar}
                </div>
                {p.isReady && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#8ff5ff] flex items-center justify-center shadow-[0_0_12px_#8ff5ff]">
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

      {/* Waiting indicator */}
      <motion.div className="flex items-center gap-3" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
        <Wifi className="w-5 h-5 text-[#df8eff]" />
        <span className="text-xl text-[#a8abb3] font-medium tracking-wider">Warte auf Host...</span>
      </motion.div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#151a21]/40 backdrop-blur-xl border border-white/5">
          <Gamepad2 className="w-5 h-5 text-[#df8eff]" />
          <span className="text-sm font-bold text-[#a8abb3] tracking-wider">EVENTBLISS GAMES</span>
          <span className="text-sm text-[#df8eff] font-black italic">ELECTRIC PULSE</span>
        </div>
      </div>
    </motion.div>
  );
}
