import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil } from 'lucide-react';

interface Stroke {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  size?: number;
  tool?: 'pen' | 'eraser';
}

export default function TVDrawView({ gameState, drawing }: { gameState: any; drawing?: Stroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnCount = useRef(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const drawer = gameState?.drawer || gameState?.currentPlayer || '';
  const drawerColor = gameState?.drawerColor || '#ff6b98';
  const timeLeft = gameState?.timeLeft ?? '';
  const maxTime = gameState?.maxTime ?? 60;
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const phase = gameState?.phase || 'drawing';
  const word = gameState?.word || '';
  const guessedBy = gameState?.guessedBy || '';

  // Timer ring
  const timerRadius = 32;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = timeLeft !== '' && maxTime > 0 ? Number(timeLeft) / maxTime : 1;
  const timerOffset = timerCircumference * (1 - timerProgress);
  const timerColor = timerProgress > 0.5 ? '#10b981' : timerProgress > 0.2 ? '#f59e0b' : '#ef4444';

  // Confetti on correct guess
  useEffect(() => {
    if (guessedBy) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
  }, [guessedBy]);

  // Render strokes onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const strokes = drawing || [];
    if (strokes.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawnCount.current = 0;
      return;
    }

    for (let i = drawnCount.current; i < strokes.length; i++) {
      const s = strokes[i];
      ctx.beginPath();
      ctx.moveTo(s.from.x, s.from.y);
      ctx.lineTo(s.to.x, s.to.y);
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = (s.size || 6) * 3;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color || '#000000';
        ctx.lineWidth = s.size || 6;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    drawnCount.current = strokes.length;
  }, [drawing]);

  // Initialize canvas white
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${drawerColor}08 0%, transparent 70%)` }} />

      {/* Confetti burst on correct guess */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 360;
          const rad = (angle * Math.PI) / 180;
          const dist = 100 + Math.random() * 300;
          const colors = ['#fbbf24', '#10b981', '#df8eff', '#8ff5ff', '#ff6b98'];
          return (
            <motion.div
              key={`conf-${i}`}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: colors[i % colors.length],
                left: '50%',
                top: '50%',
                boxShadow: `0 0 6px ${colors[i % colors.length]}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(rad) * dist,
                y: Math.sin(rad) * dist - 100,
                opacity: 0,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          );
        })}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
        {/* Artist badge */}
        <motion.div
          className="flex items-center gap-3 px-6 py-3 rounded-2xl"
          style={{
            background: `${drawerColor}12`,
            border: `2px solid ${drawerColor}44`,
            boxShadow: `0 0 25px ${drawerColor}15`,
          }}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <Pencil className="w-5 h-5" style={{ color: drawerColor }} />
          <span className="text-2xl font-bold" style={{ color: drawerColor }}>{drawer}</span>
          <motion.span
            className="text-lg text-[#a8abb3] ml-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            zeichnet gerade...
          </motion.span>
        </motion.div>

        {/* Timer ring */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
            <span className="text-lg font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
          </div>
          {timeLeft !== '' && (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0" width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r={timerRadius} fill="none" stroke="#1b2028" strokeWidth="4" />
                <motion.circle
                  cx="40" cy="40" r={timerRadius}
                  fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={timerCircumference}
                  animate={{ strokeDashoffset: timerOffset }}
                  transition={{ duration: 0.5 }}
                  style={{ filter: `drop-shadow(0 0 6px ${timerColor})` }}
                />
              </svg>
              <motion.span
                className="text-xl font-mono font-black relative z-10"
                style={{ color: timerColor }}
                animate={Number(timeLeft) <= 10 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                {timeLeft}
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas - large and prominent */}
      <motion.div
        className="rounded-3xl overflow-hidden relative"
        style={{
          border: '3px solid #2a2f38',
          boxShadow: `0 0 50px ${drawerColor}15, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <canvas ref={canvasRef} width={700} height={700} className="w-[700px] h-[700px] bg-white" />

        {/* Green flash overlay on correct guess */}
        <AnimatePresence>
          {guessedBy && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.2)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                className="text-6xl"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5 }}
              >
                &#10003;
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Word to guess - bottom center, shown to audience with blur/reveal */}
      {word && phase !== 'roundResult' && (
        <motion.div
          className="mt-6 px-8 py-4 rounded-2xl"
          style={{
            background: 'rgba(21,26,33,0.9)',
            border: '2px solid rgba(255,255,255,0.05)',
            boxShadow: '0 0 30px rgba(0,0,0,0.3)',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-3xl font-bold text-[#f1f3fc]"
            style={{ textShadow: '0 0 20px rgba(143,245,255,0.3)' }}>
            {word}
          </span>
        </motion.div>
      )}

      {/* Round result - word revealed */}
      {phase === 'roundResult' && word && (
        <motion.div className="mt-6 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <h2 className="text-5xl font-black italic text-[#ff6b98]"
            style={{ textShadow: '0 0 30px rgba(255,107,152,0.5)' }}>
            {word}
          </h2>
          {guessedBy && (
            <motion.p className="text-2xl text-[#10b981] mt-3 font-bold"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              Erraten von {guessedBy}!
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Hint text */}
      {phase === 'drawing' && !guessedBy && (
        <motion.p
          className="mt-4 text-xl text-[#a8abb3]"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          Schaut auf den Fernseher und ratet!
        </motion.p>
      )}
    </div>
  );
}
