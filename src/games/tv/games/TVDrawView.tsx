import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const drawer = gameState?.drawer || gameState?.currentPlayer || '';
  const drawerColor = gameState?.drawerColor || '#ff6b98';
  const timeLeft = gameState?.timeLeft ?? '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const phase = gameState?.phase || 'drawing';
  const word = gameState?.word || '';

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

    // Only draw new strokes incrementally
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

  if (phase === 'guessing' || phase === 'roundResult') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 gap-8" style={{ background: '#060810' }}>
        <h2 className="text-6xl font-black italic text-[#ff6b98]"
          style={{ textShadow: '0 0 30px rgba(255,107,152,0.5)' }}>
          {phase === 'roundResult' && word ? word : 'Was ist das?'}
        </h2>
        <div className="rounded-3xl border-2 border-[#44484f]/30 overflow-hidden shadow-2xl bg-white">
          <canvas ref={canvasRef} width={600} height={600} className="w-[600px] h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative" style={{ background: '#060810' }}>
      {/* Top bar */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pencil className="w-6 h-6 text-[#ff6b98]" />
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
        </div>
        {timeLeft !== '' && (
          <div className="px-5 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
            <span className={`text-3xl font-mono font-bold ${Number(timeLeft) <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#f1f3fc]'}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Drawer name */}
      <motion.div className="mb-6 px-8 py-3 rounded-full"
        style={{ background: `${drawerColor}22`, border: `2px solid ${drawerColor}66` }}>
        <span className="text-3xl font-bold" style={{ color: drawerColor }}>{drawer} zeichnet</span>
      </motion.div>

      {/* Canvas */}
      <div className="rounded-3xl border-2 border-[#44484f]/30 overflow-hidden shadow-[0_0_40px_rgba(255,107,152,0.15)] bg-white">
        <canvas ref={canvasRef} width={600} height={600} className="w-[600px] h-[600px]" />
      </div>

      {/* Hint */}
      <motion.p className="mt-6 text-xl text-[#a8abb3]"
        animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 3 }}>
        Schaut auf den Fernseher und ratet!
      </motion.p>
    </div>
  );
}
