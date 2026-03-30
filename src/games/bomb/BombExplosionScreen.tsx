import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bomb } from 'lucide-react';

interface ExplosionScreenProps {
  playerName: string;
  onNext: () => void;
}

function triggerExplosionVibration() {
  navigator.vibrate?.([200, 100, 200, 100, 500]);
}

export default function BombExplosionScreen({ playerName, onNext }: ExplosionScreenProps) {
  useEffect(() => {
    triggerExplosionVibration();
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative"
      style={{ background: '#0d0d15' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Full red flash overlay */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0.2, 0.6, 0.15],
          background: [
            'radial-gradient(circle at center, #fc3c00 0%, #0d0d15 100%)',
            'radial-gradient(circle at center, #ff6e84 0%, #0d0d15 100%)',
            'radial-gradient(circle at center, #fc3c00 0%, #0d0d15 100%)',
          ],
        }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Animated Bomb */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 2.2, 1.5],
          rotate: [0, 25, -15, 8, -5, 0],
        }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <motion.div
          animate={{
            x: [0, -4, 4, -3, 3, -1, 1, 0],
            y: [0, -2, 2, -1, 1, 0],
          }}
          transition={{ repeat: Infinity, duration: 0.4 }}
        >
          <Bomb className="w-28 h-28 text-[#ff7350] drop-shadow-[0_0_40px_rgba(255,115,80,0.6)]" />
        </motion.div>

        {/* Glow rings */}
        <motion.div
          className="absolute inset-[-30px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(252,60,0,0.3) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
      </motion.div>

      {/* BOOM text */}
      <motion.h1
        className="text-7xl font-black text-white mt-8 relative z-10"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textShadow: '0 0 40px rgba(255,115,80,0.6), 0 0 80px rgba(252,60,0,0.3)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 1], opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        BOOM!
      </motion.h1>

      {/* Player name */}
      <motion.p
        className="text-xl text-white/70 mt-4 text-center relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-[#ff6e84] font-bold">{playerName}</span> wurde erwischt!
      </motion.p>

      {/* Continue button */}
      <motion.div
        className="mt-10 relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={onNext}
          className="h-12 px-10 rounded-xl font-bold text-sm text-white bg-[#1f1f29] border border-white/10 hover:bg-[#262630] transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          Naechste Runde
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
