import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Trophy, RotateCcw, ArrowRight, Plus, Minus,
  Pencil, Eraser, Trash2, Undo2, Check, X,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import { DRAW_WORDS, type DrawWord } from './quickdraw-words-de';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { getActivePartySession } from "@/hooks/usePartySession";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mode = 'classic' | 'speed' | 'blind';
type Phase =
  | 'setup'
  | 'drawerReveal'
  | 'drawing'
  | 'guessing'
  | 'roundResult'
  | 'gameOver';

interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

type PenSize = 3 | 6 | 12;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODE_TIMERS: Record<Mode, number> = { classic: 60, speed: 30, blind: 60 };
const MODES: { id: Mode; name: string; desc: string }[] = [
  { id: 'classic', name: 'Klassisch', desc: '60 Sekunden zum Zeichnen' },
  { id: 'speed', name: 'Speed', desc: 'Nur 30 Sekunden!' },
  { id: 'blind', name: 'Blind', desc: 'Zeichnung nach 5s unsichtbar' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuickDrawGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  const partyPlayerNames = getActivePartySession()?.players?.map(p => p.name) ?? [];
  const resolvedNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const initialPlayers: Player[] = resolvedNames.length >= 2
    ? resolvedNames.map((name, i) => ({ id: `p${i + 1}`, name, color: getPlayerColor(i), score: 0 }))
    : [
        { id: 'p1', name: 'Spieler 1', color: getPlayerColor(0), score: 0 },
        { id: 'p2', name: 'Spieler 2', color: getPlayerColor(1), score: 0 },
      ];
  /* ---- Setup ---- */
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [mode, setMode] = useState<Mode>('classic');
  const [totalRounds, setTotalRounds] = useState(8);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [drawerIdx, setDrawerIdx] = useState(0);
  const deck = useRef<DrawWord[]>(shuffle(DRAW_WORDS));
  const deckPos = useRef(0);
  const [currentWord, setCurrentWord] = useState<DrawWord | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canvasHidden, setCanvasHidden] = useState(false);

  /* ---- Canvas state ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const paths = useRef<ImageData[]>([]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penSize, setPenSize] = useState<PenSize>(6);
  const [drawingDataURL, setDrawingDataURL] = useState<string | null>(null);

  /* ---- Guess state ---- */
  const [guesses, setGuesses] = useState<{ playerId: string; guess: string; correct: boolean }[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [currentGuesser, setCurrentGuesser] = useState(0);

  /* ---- Player management ---- */
  const nextId = useRef(3);
  const addPlayer = () => { if (players.length >= 10) return; const i = players.length; setPlayers(p => [...p, { id: `p${nextId.current++}`, name: `Spieler ${i + 1}`, color: getPlayerColor(i), score: 0 }]); };
  const removePlayer = (id: string) => { if (players.length <= 2) return; setPlayers(p => p.filter(x => x.id !== id)); };
  const updateName = (id: string, name: string) => setPlayers(p => p.map(x => x.id === id ? { ...x, name } : x));
  const drawer = players[drawerIdx % players.length];
  const guessers = players.filter((_, i) => i !== drawerIdx % players.length);

  useTVGameBridge('quickdraw', { phase, round, drawerIdx, currentWord: currentWord?.word, players }, [phase, round, drawerIdx]);

  /* ---- Draw word ---- */
  function drawWord(): DrawWord {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(DRAW_WORDS);
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Timer ---- */
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = (seconds: number) => { stopTimer(); setTimeLeft(seconds); timerRef.current = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { stopTimer(); return 0; } return prev - 1; }); }, 1000); };

  useEffect(() => {
    if (phase === 'drawing' && timeLeft === 0) {
      saveDrawing();
      setPhase('guessing');
      setCurrentGuesser(0);
    }
  }, [timeLeft, phase]);

  /* ---- Blind mode: hide canvas after 5s ---- */
  useEffect(() => {
    if (phase === 'drawing' && mode === 'blind') {
      setCanvasHidden(false);
      const t = setTimeout(() => setCanvasHidden(true), 5000);
      return () => clearTimeout(t);
    }
    setCanvasHidden(false);
  }, [phase, mode]);

  /* ---- Canvas helpers ---- */
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true; lastPos.current = getCanvasPos(e);
    const ctx = getCtx(); if (ctx) paths.current.push(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const ctx = getCtx(); if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = penSize;
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    if (online?.isHost) {
      online.broadcast('tv-drawing', { from: lastPos.current, to: pos, size: penSize, tool, color: '#000000' });
    }
    lastPos.current = pos;
  };
  const onPointerUp = () => { isDrawing.current = false; lastPos.current = null; };
  const clearCanvas = () => { const ctx = getCtx(); if (!ctx) return; paths.current.push(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); };
  const undoCanvas = () => { const ctx = getCtx(); if (!ctx || !paths.current.length) return; ctx.putImageData(paths.current.pop()!, 0, 0); };
  const initCanvas = () => { const ctx = getCtx(); if (!ctx) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); paths.current = []; };
  const saveDrawing = () => { if (canvasRef.current) setDrawingDataURL(canvasRef.current.toDataURL()); };

  /* ---- Game flow ---- */
  function startGame() { setPlayers(players.map(p => ({ ...p, score: 0 }))); deck.current = shuffle(DRAW_WORDS); deckPos.current = 0; setRound(1); setGuesses([]); beginRound(0); }
  function beginRound(dIdx: number) { setDrawerIdx(dIdx); setCurrentWord(drawWord()); setGuesses([]); setGuessInput(''); setCurrentGuesser(0); setDrawingDataURL(null); setTool('pen'); setPenSize(6); setPhase('drawerReveal'); }
  function startDrawing() {
    setPhase('drawing'); startTimer(MODE_TIMERS[mode]); setTimeout(initCanvas, 50);
    if (online?.isHost) {
      online.broadcast('tv-state', {
        game: 'draw', phase: 'drawing', drawer: drawer.name,
        drawerColor: drawer.color, round, totalRounds, timeLeft: MODE_TIMERS[mode],
      });
      online.broadcast('tv-drawing', { type: 'clear' });
    }
  }
  function finishDrawing() {
    stopTimer(); saveDrawing(); setPhase('guessing'); setCurrentGuesser(0);
    if (online?.isHost) {
      online.broadcast('tv-state', { game: 'draw', phase: 'guessing', drawer: drawer.name, drawerColor: drawer.color, round, totalRounds });
    }
  }

  /* ---- Guessing ---- */
  function submitGuess() {
    if (!guessInput.trim() || !currentWord) return;
    const correct = guessInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    const guesser = guessers[currentGuesser];
    setGuesses(prev => [...prev, { playerId: guesser.id, guess: guessInput.trim(), correct }]);
    if (correct) {
      setPlayers(prev => prev.map(p => {
        if (p.id === guesser.id) return { ...p, score: p.score + 2 };
        if (p.id === drawer.id) return { ...p, score: p.score + 1 };
        return p;
      }));
    }
    setGuessInput('');
    if (currentGuesser + 1 >= guessers.length) {
      setPhase('roundResult');
    } else {
      setCurrentGuesser(prev => prev + 1);
    }
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('schnellzeichner', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Next round ---- */
  function nextRound() {
    if (round >= totalRounds) { setPhase('gameOver'); return; }
    setRound(r => r + 1);
    beginRound((drawerIdx + 1) % players.length);
  }

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, round, totalRounds, drawerIdx,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      currentWord: currentWord?.word ?? null,
      timeLeft,
    });
  }, [phase, round, drawerIdx, players, timeLeft, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.round) setRound(data.round as number);
      if (data.drawerIdx !== undefined) setDrawerIdx(data.drawerIdx as number);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const anyCorrect = guesses.some(g => g.correct);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-pink { text-shadow: 0 0 20px rgba(255,107,152,0.6), 0 0 40px rgba(255,107,152,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#ff6b98]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#df8eff]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ---- SETUP ---- */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col px-4 py-8 pb-32 max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1rem] bg-[#1b2028] border border-[#ff6b98]/20 mb-4">
              <Pencil className="w-8 h-8 text-[#ff6b98]" />
            </div>
            <h1 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#ff6b98] to-[#ff6b98]/60 bg-clip-text text-transparent">
              Schnellzeichner
            </h1>
            <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">Zeichne schnell — die anderen raten!</p>
          </div>

          {/* Players */}
          <section className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Spieler ({players.length})</h2>
            <AnimatePresence initial={false}>
              {players.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: p.color }}>{getPlayerInitial(p.name)}</div>
                  <input type="text" value={p.name} onChange={e => updateName(p.id, e.target.value)}
                    maxLength={20} className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b98]/50 text-sm" />
                  {players.length > 2 && (
                    <button onClick={() => removePlayer(p.id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center">
                      <Minus className="w-4 h-4 text-red-400" /></button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length < 10 && (
              <button onClick={addPlayer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-[#ff6b98]/50 hover:text-[#ff6b98] transition-colors text-sm">
                <Plus className="w-4 h-4" /> Spieler hinzufuegen</button>
            )}
          </section>

          {/* Mode */}
          <section className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Modus</h2>
            <div className="space-y-2">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={cn('w-full flex items-center gap-3 p-4 rounded-[1rem] border-2 transition-colors text-left',
                    mode === m.id ? 'border-[#ff6b98] bg-[#ff6b98]/10 text-white' : 'border-gray-700 bg-[#1b2028] text-gray-300 hover:border-gray-600')}>
                  <Pencil className={cn('w-5 h-5', mode === m.id ? 'text-[#ff6b98]' : 'text-white/30')} />
                  <div><div className="text-sm font-semibold">{m.name}</div><div className="text-xs text-white/40">{m.desc}</div></div>
                </button>
              ))}
            </div>
          </section>

          {/* Rounds */}
          <section className="mb-6">
            <div className="bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/40">Runden</span><span className="text-white font-bold">{totalRounds}</span>
              </div>
              <input type="range" min={3} max={20} step={1} value={totalRounds}
                onChange={e => setTotalRounds(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-[#ff6b98] cursor-pointer" />
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
            <div className="max-w-lg mx-auto space-y-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={startGame}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide shadow-[0_0_20px_rgba(255,107,152,0.3)] flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Spiel starten</motion.button>
              <button onClick={() => navigate('/games')} className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition">Zurueck</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- DRAWER REVEAL ---- */}
      {phase === 'drawerReveal' && currentWord && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <ActivePlayerBanner
            playerName={drawer.name}
            playerColor={drawer.color}
            subtitle="zeichnet!"
            hidden={false}
          />
          <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b98]">Runde {round} / {totalRounds}</span>
          </div>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: drawer.color }}>{getPlayerInitial(drawer.name)}</div>
          <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white">{drawer.name} zeichnet!</h2>
          <p className="text-white/40 text-sm">Alle anderen: NICHT hinschauen!</p>
          <div className="rounded-[1rem] bg-[#151a21]/80 backdrop-blur-xl border border-[#ff6b98]/30 p-6 shadow-2xl text-center">
            <div className="text-xs font-bold text-[#ff6b98] uppercase tracking-widest mb-2">Dein Wort</div>
            <div className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-white">{currentWord.word}</div>
            <div className="mt-2 text-xs text-white/30">{currentWord.category} — Schwierigkeit {'★'.repeat(currentWord.difficulty)}</div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={startDrawing}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white px-8 py-3 rounded-full font-extrabold text-lg shadow-[0_0_20px_rgba(255,107,152,0.3)]">
            <Pencil className="w-5 h-5" /> Zeichnen starten
          </motion.button>
        </motion.div>
      )}

      {/* ---- DRAWING ---- */}
      {phase === 'drawing' && (
        <div className="flex-1 flex flex-col">
          {/* Timer bar */}
          <div className="h-1 bg-white/[0.04]">
            <motion.div className={cn('h-full', timeLeft > 10 ? 'bg-gradient-to-r from-[#ff6b98] to-[#ff6b98]' : 'bg-red-500')}
              style={{ width: `${(timeLeft / MODE_TIMERS[mode]) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm font-bold text-white/60">{drawer.name} zeichnet</span>
            <div className={cn('px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-lg font-mono font-bold',
              timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/80')}>{timeLeft}s</div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className={cn('w-full max-w-sm aspect-square rounded-2xl border border-[#44484f]/20 overflow-hidden relative',
              canvasHidden ? 'bg-[#1b2028]' : 'bg-white')}>
              {canvasHidden && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-white/40 font-bold text-lg">Blind-Modus aktiv!</span>
                </div>
              )}
              <canvas ref={canvasRef} width={400} height={400}
                className={cn('w-full h-full', canvasHidden && 'opacity-0')}
                style={{ touchAction: 'none' }}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                onPointerUp={onPointerUp} onPointerLeave={onPointerUp} />
            </div>
          </div>

          {/* Tools */}
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            {([3, 6, 12] as PenSize[]).map(s => (
              <button key={s} onClick={() => { setTool('pen'); setPenSize(s); }}
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center border transition-colors',
                  tool === 'pen' && penSize === s ? 'bg-[#ff6b98]/20 border-[#ff6b98]' : 'bg-[#1b2028] border-[#44484f]/20')}>
                <div className="rounded-full bg-black" style={{ width: s + 4, height: s + 4 }} />
              </button>
            ))}
            <button onClick={() => setTool('eraser')}
              className={cn('w-10 h-10 rounded-xl flex items-center justify-center border transition-colors',
                tool === 'eraser' ? 'bg-[#ff6b98]/20 border-[#ff6b98]' : 'bg-[#1b2028] border-[#44484f]/20')}>
              <Eraser className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={undoCanvas} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1b2028] border border-[#44484f]/20">
              <Undo2 className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={clearCanvas} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1b2028] border border-[#44484f]/20">
              <Trash2 className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="px-4 pb-4">
            <motion.button whileTap={{ scale: 0.97 }} onClick={finishDrawing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white font-bold shadow-[0_0_20px_rgba(255,107,152,0.2)]">
              Fertig gezeichnet
            </motion.button>
          </div>
        </div>
      )}

      {/* ---- GUESSING ---- */}
      {phase === 'guessing' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center gap-5 px-4 py-6 max-w-lg mx-auto w-full">
          <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b98]">Raten</span>
          </div>
          {drawingDataURL && (
            <div className="w-full max-w-sm aspect-square rounded-2xl border border-[#44484f]/20 overflow-hidden bg-white">
              <img src={drawingDataURL} alt="Zeichnung" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: guessers[currentGuesser]?.color }}>{getPlayerInitial(guessers[currentGuesser]?.name ?? '')}</div>
            <span className="text-white font-bold">{guessers[currentGuesser]?.name} raet</span>
          </div>
          <div className="w-full flex gap-2">
            <input type="text" value={guessInput} onChange={e => setGuessInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitGuess()}
              placeholder="Was ist das?" className="flex-1 bg-[#1b2028] border border-[#44484f]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#ff6b98]/50" />
            <motion.button whileTap={{ scale: 0.95 }} onClick={submitGuess}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white font-bold">OK</motion.button>
          </div>
          {guesses.length > 0 && <GuessList guesses={guesses} players={players} />}
        </motion.div>
      )}

      {/* ---- ROUND RESULT ---- */}
      {phase === 'roundResult' && currentWord && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center',
              anyCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
              {anyCorrect ? <Check className="w-8 h-8 text-emerald-400" /> : <X className="w-8 h-8 text-red-400" />}
            </div>
          </motion.div>
          <div className="text-center">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Das Wort war</div>
            <div className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-white">{currentWord.word}</div>
          </div>
          {drawingDataURL && (
            <div className="w-full max-w-xs aspect-square rounded-2xl border border-[#44484f]/20 overflow-hidden bg-white">
              <img src={drawingDataURL} alt="Zeichnung" className="w-full h-full object-contain" />
            </div>
          )}
          <GuessList guesses={guesses} players={players} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={nextRound}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(255,107,152,0.3)]">
            {round >= totalRounds ? 'Ergebnis' : 'Weiter'} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" /></div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-[#ff6b98] neon-glow-pink">Spielende!</h2>
          <div className="w-full space-y-2">
            {sorted.map((p, i) => (
              <div key={p.id} className={cn('flex items-center gap-3 rounded-[1rem] px-4 py-3 border',
                i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20')}>
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  i === 0 ? 'bg-amber-500 text-[#0a0e14]' : 'bg-white/10 text-white/40')}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: p.color }}>{getPlayerInitial(p.name)}</div>
                <span className="flex-1 font-semibold text-white truncate">{p.name}</span>
                <span className={cn('font-bold text-lg', i === 0 ? 'text-amber-400' : 'text-white/60')}>{p.score}</span>
              </div>
            ))}
          </div>
          <div className="w-full space-y-3 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('setup')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff6b98] to-[#ff6b98] text-white py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(255,107,152,0.3)]">
              <RotateCcw className="w-4 h-4" /> Nochmal</motion.button>
            <button onClick={() => navigate('/games')}
              className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">Anderes Spiel</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component                                                      */
/* ------------------------------------------------------------------ */

function GuessList({ guesses, players }: { guesses: { playerId: string; guess: string; correct: boolean }[]; players: Player[] }) {
  return (
    <div className="w-full space-y-1.5">
      {guesses.map((g, i) => {
        const p = players.find(x => x.id === g.playerId);
        return (
          <div key={i} className="flex items-center gap-2 bg-[#1b2028] border border-white/[0.04] rounded-[1rem] px-4 py-2.5">
            {g.correct ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            <span className="text-white/50 text-sm">{p?.name}:</span>
            <span className={cn('font-semibold text-sm', g.correct ? 'text-emerald-300' : 'text-white/60')}>{g.guess}</span>
          </div>
        );
      })}
    </div>
  );
}
