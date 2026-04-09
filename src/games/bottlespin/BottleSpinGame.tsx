import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RotateCcw, Trophy, ThumbsUp, ThumbsDown,
  Timer, Sparkles, Zap, MessageCircle, Wine, Heart,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { haptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { useGameTimer } from '../engine/TimerSystem';
import {
  BOTTLE_CARDS, CATEGORY_META, type BottleCard, type BottleCategory,
} from './bottlespin-content-de';

type Phase = 'setup' | 'spinning' | 'card' | 'vote' | 'gameOver';
interface Player { id: string; name: string; color: string; avatar: string; score: number; }

const PLAYER_COLORS = ['#df8eff','#ff6b98','#8ff5ff','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
const GAME_MODES: GameMode[] = [
  { id: 'fragen', name: 'Mit Fragen', desc: 'Flasche + Fragen & Aufgaben', icon: <MessageCircle className="w-6 h-6" /> },
  { id: 'nur-flasche', name: 'Nur Flasche', desc: 'Reines Flaschendrehen', icon: <Wine className="w-6 h-6" /> },
];
const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 15, max: 60, default: 30, step: 5, label: 'Aufgaben-Timer (Sek.)' },
  rounds: { min: 5, max: 50, default: 15, step: 1, label: 'Runden' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function playStopSound() {
  try {
    const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch { /* audio unavailable */ }
}

const RADIUS = 130;

const neonStyles = `
  .neon-text { text-shadow: 0 0 15px rgba(255,107,152,0.6), 0 0 40px rgba(223,142,255,0.2); }
  .neon-text-cyan { text-shadow: 0 0 15px rgba(143,245,255,0.6), 0 0 40px rgba(0,238,252,0.2); }
  .neon-text-purple { text-shadow: 0 0 15px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.2); }
  .glass-panel { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(223,142,255,0.1); background: rgba(21,26,33,0.8); }
  .glass-panel-elevated { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(223,142,255,0.08); background: rgba(27,32,40,0.85); }
  .card-glow { box-shadow: 0 0 40px -10px rgba(255,107,152,0.4), 0 0 80px -20px rgba(223,142,255,0.2); }
  .btn-glow { box-shadow: 0 0 30px -5px rgba(223,142,255,0.4), 0 0 60px -10px rgba(255,107,152,0.2); }
  .trophy-glow { box-shadow: 0 0 30px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.1); }
  @keyframes pulse-ring { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
  .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
  @keyframes float-aura { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(5px,-5px) scale(1.05); } }
  .float-aura { animation: float-aura 6s ease-in-out infinite; }
`;

export default function BottleSpinGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [mode, setMode] = useState('fragen');
  const [timerSec, setTimerSec] = useState(30);
  const [totalRounds, setTotalRounds] = useState(15);
  const [currentRound, setCurrentRound] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<BottleCategory[]>(['spass', 'party', 'eisbrecher']);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const lastSelectedRef = useRef(-1);
  const [currentCard, setCurrentCard] = useState<BottleCard | null>(null);
  const [declined, setDeclined] = useState(false);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [voterIdx, setVoterIdx] = useState(0);

  const deck = useMemo(() => {
    const filtered = BOTTLE_CARDS.filter((c) => selectedCategories.includes(c.category));
    return shuffle(filtered.length > 0 ? filtered : BOTTLE_CARDS);
  }, [selectedCategories]);
  const deckPos = useRef(0);

  const handleTimerExpire = useCallback(() => { if (phase === 'card') startVote(); }, [phase]);
  const timer = useGameTimer(timerSec, handleTimerExpire);

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string, settings: { timer: number; rounds: number },
  ) => {
    setPlayers(mapped.map((p, i) => ({ ...p, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 })));
    setMode(selectedMode); setTimerSec(settings.timer); setTotalRounds(settings.rounds);
    setCurrentRound(1); setSelectedIdx(-1); lastSelectedRef.current = -1; deckPos.current = 0;
    setPhase('spinning');
  };

  const doSpin = () => {
    if (isSpinning || players.length < 2) return;
    setIsSpinning(true); setSelectedIdx(-1);
    const available = players.map((_, i) => i).filter((i) => i !== lastSelectedRef.current);
    const targetIdx = available[Math.floor(Math.random() * available.length)];
    const sliceAngle = 360 / players.length;
    const targetAngle = targetIdx * sliceAngle;
    const extraSpins = (Math.floor(Math.random() * 4) + 3) * 360;
    // Point the bottle neck (top = 0°) directly at the target player.
    // Players are laid out starting at -π/2 (top), so player 0 = 0°, player 1 = sliceAngle°, etc.
    // We need the final rotation to land with the neck pointing at targetAngle.
    const currentNormalized = rotation % 360;
    const finalAngle = rotation - currentNormalized + extraSpins + targetAngle;
    setRotation(finalAngle);
    setTimeout(() => {
      setIsSpinning(false); setSelectedIdx(targetIdx); lastSelectedRef.current = targetIdx;
      playStopSound();
      haptics.success();
      try { navigator.vibrate?.([80, 40, 80]); } catch { /* */ }
      if (mode !== 'nur-flasche') setTimeout(() => showCard(), 600);
    }, 3200);
  };

  const showCard = () => {
    if (deckPos.current >= deck.length) deckPos.current = 0;
    const card = deck[deckPos.current++];
    setCurrentCard(card); setDeclined(false);
    if (card.type === 'aufgabe') { timer.reset(timerSec); timer.start(); }
    setPhase('card');
  };

  const awardPoints = (pts: number) => {
    if (selectedIdx < 0) return;
    setPlayers((prev) => prev.map((p, i) => i === selectedIdx ? { ...p, score: p.score + pts } : p));
  };

  const nextRound = () => {
    timer.pause();
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1); setCurrentCard(null); setSelectedIdx(-1); setPhase('spinning');
  };

  const handleAccept = () => {
    if (currentCard?.type === 'aufgabe') { startVote(); } else { awardPoints(1); nextRound(); }
  };
  const handleDecline = () => { setDeclined(true); awardPoints(-1); timer.pause(); setTimeout(nextRound, 800); };

  function startVote() { setVotes({}); setVoterIdx(0); timer.pause(); setPhase('vote'); }

  const castVote = (yes: boolean) => {
    const otherPlayers = players.filter((_, i) => i !== selectedIdx);
    const voter = otherPlayers[voterIdx];
    if (!voter) return;
    const newVotes = { ...votes, [voter.id]: yes }; setVotes(newVotes);
    if (voterIdx + 1 >= otherPlayers.length) {
      const yesCount = Object.values(newVotes).filter(Boolean).length;
      awardPoints(yesCount > otherPlayers.length / 2 ? 2 : 0); nextRound();
    } else { setVoterIdx((v) => v + 1); }
  };

  const nextRoundBottleOnly = () => {
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1); setSelectedIdx(-1); setPhase('spinning');
  };

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('flaschendrehen', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const resetGame = () => {
    setPhase('setup'); setPlayers([]); setCurrentRound(1); setSelectedIdx(-1);
    lastSelectedRef.current = -1; timer.reset(timerSec);
  };

  const winner = useMemo(() => [...players].sort((a, b) => b.score - a.score)[0], [players]);
  const selectedPlayer = selectedIdx >= 0 ? players[selectedIdx] : null;

  const toggleCategory = (cat: BottleCategory) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  if (phase === 'setup') {
    return (
      <GameSetup modes={GAME_MODES} settings={SETUP_SETTINGS} onStart={handleStart}
        title="Flaschendrehen" minPlayers={2} maxPlayers={12} />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-['Plus_Jakarta_Sans'] overflow-hidden">
      <style>{neonStyles}</style>

      {/* Background aura blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="float-aura absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#df8eff]/[0.06] blur-[120px]" />
        <div className="float-aura absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-[#ff6b98]/[0.05] blur-[140px]" style={{ animationDelay: '2s' }} />
        <div className="float-aura absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#8ff5ff]/[0.04] blur-[100px]" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#df8eff]/[0.06]">
        <button onClick={() => navigate('/games')} className="p-2 text-white/40 hover:text-[#df8eff] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#8ff5ff]/60">
          Runde {currentRound}/{totalRounds}
        </div>
        <div className="px-3 py-1 rounded-full glass-panel text-sm font-bold text-[#df8eff]">
          {mode === 'fragen' ? 'Fragen' : 'Flasche'}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SPINNING PHASE */}
        {phase === 'spinning' && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <h2 className="text-xl font-extrabold">
              {selectedPlayer ? (
                <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="neon-text-purple text-[#df8eff]">
                  {selectedPlayer.name}!
                </motion.span>
              ) : <span className="text-white/60">Wer wird es sein?</span>}
            </h2>

            {/* Player circle + bottle */}
            <div className="relative" style={{ width: RADIUS * 2 + 60, height: RADIUS * 2 + 60 }}>
              {players.map((p, i) => {
                const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
                const x = Math.cos(angle) * RADIUS, y = Math.sin(angle) * RADIUS;
                const isSel = selectedIdx === i;
                return (
                  <motion.div key={p.id} className="absolute flex flex-col items-center gap-1"
                    style={{ left: `calc(50% + ${x}px - 22px)`, top: `calc(50% + ${y}px - 22px)` }}
                    animate={isSel ? { scale: 1.4 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}>
                    <div className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300',
                        isSel ? 'ring-2' : 'ring-2 ring-white/[0.08]'
                      )}
                      style={{
                        backgroundColor: p.color,
                        ...(isSel ? { ringColor: p.color, boxShadow: `0 0 18px ${p.color}88, 0 0 40px ${p.color}33` } : {}),
                      }}>
                      {p.avatar}
                    </div>
                    <span className={cn('text-[10px] font-semibold truncate max-w-[54px] text-center transition-colors',
                      isSel ? 'text-white' : 'text-white/40')}>{p.name}</span>
                    {mode === 'fragen' && (
                      <span className="text-[9px] font-bold text-[#df8eff]/70">{p.score}</span>
                    )}
                  </motion.div>
                );
              })}

              {/* Center table surface — visual anchor for the bottle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Outer ring */}
                <div className="w-[160px] h-[160px] rounded-full border border-white/[0.06] bg-white/[0.02]"
                  style={{ boxShadow: 'inset 0 0 40px rgba(139,92,246,0.08)' }} />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-[80px] h-[80px] rounded-full border border-white/[0.04] bg-white/[0.01]" />
              </div>

              {/* Bottle — centered, spinning, lying flat (top-down view) */}
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                animate={{ rotate: rotation }}
                transition={{ type: 'tween', duration: 3, ease: [0.15, 0.85, 0.25, 1] }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="btlGlass" x1="0.3" y1="0" x2="0.7" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.95" />
                      <stop offset="40%" stopColor="#22c55e" stopOpacity="0.9" />
                      <stop offset="75%" stopColor="#15803d" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#14532d" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="btlHighlight" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="white" stopOpacity="0" />
                      <stop offset="35%" stopColor="white" stopOpacity="0.4" />
                      <stop offset="55%" stopColor="white" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <filter id="btlGlowEP">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="btlShadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Bottle drawn centered at (80,80), neck pointing UP.
                      Body extends from center downward, neck extends upward.
                      Rotation pivot = SVG center = bottle center of mass. */}

                  <g filter="url(#btlShadow)">
                    {/* Body — round bottom half */}
                    <ellipse cx="80" cy="100" rx="16" ry="20" fill="url(#btlGlass)" />
                    {/* Shoulder — tapers from body to neck */}
                    <path d="M64 96 Q64 82 72 76 L72 76 L88 76 Q96 82 96 96 Z" fill="url(#btlGlass)" />
                    {/* Neck — long and thin */}
                    <rect x="74" y="35" width="12" height="43" rx="4" fill="url(#btlGlass)" />
                    {/* Lip ring at top of neck */}
                    <rect x="72" y="30" width="16" height="7" rx="4" fill="url(#btlGlass)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
                    {/* Pointer arrow tip — makes it clear where it points */}
                    <polygon points="80,16 74,30 86,30" fill="#4ade80" opacity="0.95" />
                  </g>

                  {/* Glass highlights */}
                  <rect x="76" y="32" width="4" height="65" rx="2" fill="url(#btlHighlight)" opacity="0.8" />
                  <ellipse cx="76" cy="100" rx="4" ry="12" fill="url(#btlHighlight)" opacity="0.4" />

                  {/* Center rotation dot */}
                  <circle cx="80" cy="80" r="4" fill="white" opacity="0.12" />
                  <circle cx="80" cy="80" r="2" fill="white" opacity="0.25" />
                </svg>
              </motion.div>
            </div>

            {/* Category pills */}
            {mode === 'fragen' && !isSpinning && selectedIdx < 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 justify-center max-w-xs">
                {(Object.keys(CATEGORY_META) as BottleCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat], active = selectedCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)}
                      className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
                        active ? 'text-white glass-panel' : 'text-white/25 border border-white/[0.06] hover:border-white/10')}
                      style={active ? { borderColor: `${meta.color}44`, boxShadow: `0 0 15px -5px ${meta.color}33` } : {}}>
                      {meta.emoji} {meta.name}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Action button */}
            {selectedIdx >= 0 && !isSpinning ? (
              mode === 'nur-flasche' ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={nextRoundBottleOnly}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white px-8 py-3.5 rounded-2xl h-14 font-extrabold text-base btn-glow">
                  <Sparkles className="w-5 h-5" /> Naechste Runde
                </motion.button>
              ) : null
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={doSpin} disabled={isSpinning}
                className={cn('flex items-center gap-2 px-8 py-3.5 rounded-2xl h-14 font-extrabold text-base transition-all',
                  isSpinning ? 'glass-panel text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white btn-glow')}>
                <Zap className="w-5 h-5" /> {isSpinning ? 'Dreht...' : 'Drehen!'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* CARD PHASE */}
        {phase === 'card' && currentCard && selectedPlayer && (
          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6">

            {/* Timer */}
            {currentCard.type === 'aufgabe' && !declined && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2">
                <Timer className={cn('w-5 h-5', timer.timeLeft <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#8ff5ff]')} />
                <span className={cn('text-2xl font-mono font-bold', timer.timeLeft <= 10 ? 'text-[#ff6e84]' : 'neon-text-cyan text-[#8ff5ff]')}>
                  {timer.timeLeft}s
                </span>
              </motion.div>
            )}

            {/* Player pill */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2"
                style={{ backgroundColor: selectedPlayer.color, boxShadow: `0 0 12px ${selectedPlayer.color}44` }}>
                {selectedPlayer.avatar}
              </div>
              <span className="text-sm font-bold text-white/80">{selectedPlayer.name}s Aufgabe</span>
            </motion.div>

            {/* Glowing card */}
            <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full max-w-sm relative">
              {/* Gradient glow backlight */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b98] via-[#df8eff] to-[#8ff5ff] rounded-2xl blur opacity-20" />
              {/* Card surface */}
              <div className="relative rounded-2xl overflow-hidden bg-[#20262f]/80 backdrop-blur-[24px] border border-[#df8eff]/10 card-glow">
                {/* Gradient top stripe */}
                <div className="h-2 w-full bg-gradient-to-r from-[#ff6b98] to-[#df8eff]" />
                <div className="p-6 flex flex-col items-center gap-4">
                  {/* Category label */}
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] italic"
                    style={{ color: CATEGORY_META[currentCard.category].color }}>
                    {CATEGORY_META[currentCard.category].name}
                  </span>
                  {/* Type label */}
                  <h3 className={cn('text-5xl font-black tracking-tight',
                    currentCard.type === 'frage' ? 'text-[#8ff5ff] neon-text-cyan' : 'text-[#ff6b98] neon-text')}>
                    {currentCard.type === 'frage' ? 'FRAGE' : 'AUFGABE'}
                  </h3>
                  {/* Divider */}
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#44484f] to-transparent" />
                  {/* Card text */}
                  <p className="text-2xl font-bold text-white leading-tight text-center">{currentCard.text}</p>
                  {/* Decorative icon */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-lg">{CATEGORY_META[currentCard.category].emoji}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            {!declined ? (
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAccept}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white py-4 rounded-2xl h-14 font-extrabold btn-glow">
                  <ThumbsUp className="w-5 h-5" /> {currentCard.type === 'aufgabe' ? 'Erledigt' : 'Annehmen'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDecline}
                  className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#ff6e84]/30 text-[#ff6e84]/70 px-6 py-3.5 rounded-2xl font-bold hover:border-[#ff6e84]/50 hover:text-[#ff6e84] transition-all">
                  Ablehnen
                </motion.button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-[#ff6e84] font-bold text-sm neon-text">-1 Punkt</motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-white/20 uppercase tracking-widest">Runde {currentRound}/{totalRounds}</span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalRounds, 12) }).map((_, i) => (
                  <div key={i} className={cn('w-1.5 h-1.5 rounded-full',
                    i < currentRound ? 'bg-[#df8eff]' : 'bg-white/[0.08]')} />
                ))}
              </div>
              <span className="text-[10px] text-[#df8eff]/30 font-bold tracking-widest">EventBliss</span>
            </div>
          </motion.div>
        )}

        {/* VOTE PHASE */}
        {phase === 'vote' && selectedPlayer && (() => {
          const otherPlayers = players.filter((_, i) => i !== selectedIdx);
          const voter = otherPlayers[voterIdx];
          if (!voter) return null;
          return (
            <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4">
              <h2 className="text-xl font-extrabold neon-text-purple text-[#df8eff]">
                Hat {selectedPlayer.name} es geschafft?
              </h2>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#df8eff]/20 to-[#ff6b98]/20 blur-lg" />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-2 ring-[#df8eff]/30"
                  style={{ backgroundColor: voter.color, boxShadow: `0 0 20px ${voter.color}44` }}>
                  {voter.avatar}
                </div>
              </motion.div>
              <p className="text-white/50 font-semibold">{voter.name} stimmt ab</p>
              <div className="flex gap-5">
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => castVote(true)}
                  className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ThumbsUp className="w-8 h-8 text-emerald-400" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => castVote(false)}
                  className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border-[#ff6e84]/20 hover:border-[#ff6e84]/40 transition-all hover:shadow-[0_0_20px_rgba(255,110,132,0.2)]">
                  <ThumbsDown className="w-8 h-8 text-[#ff6e84]" />
                </motion.button>
              </div>
              <div className="flex gap-1.5">
                {otherPlayers.map((_, i) => (
                  <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-all duration-300',
                    i < voterIdx ? 'bg-[#df8eff]' : i === voterIdx ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/[0.08]')} />
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* GAME OVER */}
        {phase === 'gameOver' && (
          <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
            <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-amber-500/10 blur-xl" />
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 trophy-glow">
                  <Trophy className="w-10 h-10 text-amber-400" />
                </div>
              </div>
            </motion.div>
            <h2 className="text-3xl font-black neon-text bg-gradient-to-r from-amber-400 via-[#ff6b98] to-[#df8eff] bg-clip-text text-transparent">
              Spielende!
            </h2>
            {mode === 'fragen' && winner && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-[#df8eff] neon-text-purple">{winner.name} gewinnt!</motion.div>
            )}
            {mode === 'fragen' && (
              <div className="w-full space-y-2.5 max-h-64 overflow-y-auto">
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 glass-panel-elevated',
                      i === 0 && 'border-amber-500/20 card-glow')}>
                    <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/[0.08]"
                      style={{ backgroundColor: p.color }}>{p.avatar}</div>
                    <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
                    <span className="text-[#df8eff] font-bold">{p.score} Pkt.</span>
                  </motion.div>
                ))}
              </div>
            )}
            {mode === 'nur-flasche' && (
              <p className="text-white/30 text-center text-sm">{totalRounds} Runden gespielt. Das war lustig!</p>
            )}
            <div className="w-full space-y-3 mt-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white py-4 rounded-2xl h-14 font-extrabold btn-glow">
                <RotateCcw className="w-4 h-4" /> Nochmal
              </motion.button>
              <button onClick={() => navigate('/games')}
                className="w-full py-3.5 rounded-2xl border border-[#df8eff]/10 text-white/40 text-sm font-semibold hover:bg-white/[0.02] hover:border-[#df8eff]/20 transition-all">
                Anderes Spiel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
