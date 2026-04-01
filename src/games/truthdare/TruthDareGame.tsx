import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown,
  Timer, Flame, Heart, Shield, Sparkles, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { useGameTimer } from '../engine/TimerSystem';
import { TRUTH_QUESTIONS, DARE_CHALLENGES, type TruthQuestion, type DareChallenge } from './truthdare-content-de';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'spin' | 'choice' | 'reveal' | 'vote' | 'gameOver';

interface Player {
  id: string; name: string; color: string; avatar: string;
  score: number; truthCount: number; dareCount: number;
}

const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Classic', desc: 'Alle Kategorien gemischt', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'eskalation', name: 'Eskalation', desc: 'Wird jede Runde wilder', icon: <Flame className="w-6 h-6" /> },
  { id: 'nur-wahrheit', name: 'Nur Wahrheit', desc: 'Nur Fragen, keine Pflicht', icon: <Heart className="w-6 h-6" /> },
  { id: 'nur-pflicht', name: 'Nur Pflicht', desc: 'Nur Aufgaben, keine Fragen', icon: <Shield className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 10, max: 120, default: 60, step: 5, label: 'Pflicht-Timer (Sek.)' },
  rounds: { min: 5, max: 30, default: 15, step: 1, label: 'Runden' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getIntensityForRound(mode: string, round: number, total: number): (1|2|3)[] {
  if (mode !== 'eskalation') return [1, 2, 3];
  const pct = round / total;
  if (pct < 0.33) return [1];
  if (pct < 0.66) return [1, 2];
  return [2, 3];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-secondary { text-shadow: 0 0 15px rgba(255,107,152,0.6); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;

export default function TruthDareGame() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [timerSec, setTimerSec] = useState(60);
  const [totalRounds, setTotalRounds] = useState(15);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  const [spinAngle, setSpinAngle] = useState(0);
  const [spinTarget, setSpinTarget] = useState(0);
  const [choiceType, setChoiceType] = useState<'truth' | 'dare' | null>(null);
  const [currentItem, setCurrentItem] = useState<TruthQuestion | DareChallenge | null>(null);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [voterIdx, setVoterIdx] = useState(0);

  const truthDeck = useMemo(() => shuffle(TRUTH_QUESTIONS), []);
  const dareDeck = useMemo(() => shuffle(DARE_CHALLENGES), []);
  const truthPos = useMemo(() => ({ current: 0 }), []);
  const darePos = useMemo(() => ({ current: 0 }), []);

  const handleTimerExpire = useCallback(() => {
    if (choiceType === 'dare') setPhase('vote');
  }, [choiceType]);

  const timer = useGameTimer(timerSec, handleTimerExpire);

  const activePlayer = players[activeIdx];

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => {
    setPlayers(mapped.map((p, i) => ({
      ...p, color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0, truthCount: 0, dareCount: 0,
    })));
    setMode(selectedMode);
    setTimerSec(settings.timer);
    setTotalRounds(settings.rounds);
    setCurrentRound(1);
    setActiveIdx(0);
    setPhase('spin');
  };

  // ---------------------------------------------------------------------------
  // Spin
  // ---------------------------------------------------------------------------

  const doSpin = () => {
    const target = Math.floor(Math.random() * players.length);
    setSpinTarget(target);
    const extraSpins = 3 + Math.floor(Math.random() * 3);
    const sliceAngle = 360 / players.length;
    const angle = extraSpins * 360 + target * sliceAngle + sliceAngle / 2;
    setSpinAngle((prev) => prev + angle);
    setTimeout(() => {
      setActiveIdx(target);
      setPhase('choice');
    }, 2800);
  };

  // ---------------------------------------------------------------------------
  // Draw card
  // ---------------------------------------------------------------------------

  const drawTruth = () => {
    const intensities = getIntensityForRound(mode, currentRound, totalRounds);
    const pool = truthDeck.filter((q) => intensities.includes(q.intensity));
    if (truthPos.current >= pool.length) truthPos.current = 0;
    const item = pool[truthPos.current++ % pool.length];
    setCurrentItem(item);
    setChoiceType('truth');
    setPhase('reveal');
  };

  const drawDare = () => {
    const intensities = getIntensityForRound(mode, currentRound, totalRounds);
    const pool = dareDeck.filter((q) => intensities.includes(q.intensity));
    if (darePos.current >= pool.length) darePos.current = 0;
    const item = pool[darePos.current++ % pool.length];
    setCurrentItem(item);
    setChoiceType('dare');
    timer.reset(timerSec);
    timer.start();
    setPhase('reveal');
  };

  const handleChoice = (type: 'truth' | 'dare') => {
    if (mode === 'nur-wahrheit') return drawTruth();
    if (mode === 'nur-pflicht') return drawDare();
    if (type === 'truth') drawTruth();
    else drawDare();
  };

  // ---------------------------------------------------------------------------
  // Vote
  // ---------------------------------------------------------------------------

  const startVote = () => {
    setVotes({});
    setVoterIdx(0);
    setPhase('vote');
    timer.pause();
  };

  const castVote = (yes: boolean) => {
    const otherPlayers = players.filter((_, i) => i !== activeIdx);
    const voter = otherPlayers[voterIdx];
    if (!voter) return;
    setVotes((prev) => ({ ...prev, [voter.id]: yes }));
    if (voterIdx + 1 >= otherPlayers.length) {
      // tally
      const allVotes = { ...votes, [voter.id]: yes };
      const yesCount = Object.values(allVotes).filter(Boolean).length;
      const passed = yesCount > otherPlayers.length / 2;
      setPlayers((prev) => prev.map((p, i) =>
        i === activeIdx ? {
          ...p,
          score: p.score + (passed ? (choiceType === 'dare' ? 2 : 1) : 0),
          truthCount: p.truthCount + (choiceType === 'truth' ? 1 : 0),
          dareCount: p.dareCount + (choiceType === 'dare' ? 1 : 0),
        } : p,
      ));
      nextRound();
    } else {
      setVoterIdx((v) => v + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Next round
  // ---------------------------------------------------------------------------

  const nextRound = () => {
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1);
    setChoiceType(null);
    setCurrentItem(null);
    setPhase('spin');
  };

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('wahrheit-pflicht', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
    timer.reset(timerSec);
    truthPos.current = 0;
    darePos.current = 0;
  };

  const winner = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score)[0], [players]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Wahrheit oder Pflicht 2.0"
        minPlayers={2}
        maxPlayers={20}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-['Plus_Jakarta_Sans']">
      <style>{EP_STYLE}</style>
      {/* Ambient glow orbs */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#ff6b98]/8 rounded-full blur-[120px] pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#44484f]/20">
        <button onClick={() => navigate('/games')} className="p-2 text-[#a8abb3] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-[#a8abb3]">
          Runde {currentRound}/{totalRounds}
        </div>
        <div className="px-3 py-1 rounded-full glass-card border border-[#44484f]/30 text-sm font-bold text-[#df8eff]">
          {mode === 'eskalation' ? <Flame className="w-4 h-4 inline" /> : null} {mode}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SPIN PHASE */}
        {phase === 'spin' && (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <h2 className="text-2xl font-extrabold text-white neon-glow">Wer ist dran?</h2>
            {/* Wheel */}
            <div className="relative w-52 h-52">
              <motion.div
                className="w-full h-full rounded-full border-4 border-[#df8eff]/30 relative"
                animate={{ rotate: spinAngle }}
                transition={{ duration: 2.5, ease: [0.2, 0.8, 0.3, 1] }}
              >
                {players.map((p, i) => {
                  const angle = (360 / players.length) * i;
                  return (
                    <div key={p.id} className="absolute" style={{
                      top: '50%', left: '50%',
                      transform: `rotate(${angle}deg) translateY(-80px) rotate(-${angle}deg) translate(-50%, -50%)`,
                    }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: p.color }}>
                        {p.avatar}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-[#df8eff] rotate-45 shadow-[0_0_12px_rgba(223,142,255,0.5)]" />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={doSpin}
              className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3.5 rounded-2xl h-14 font-extrabold text-base shadow-[0_0_20px_rgba(223,142,255,0.3)]">
              <Zap className="w-5 h-5" /> Drehen!
            </motion.button>
          </motion.div>
        )}

        {/* CHOICE PHASE */}
        {phase === 'choice' && activePlayer && (
          <motion.div key="choice" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: activePlayer.color }}>
              {activePlayer.avatar}
            </div>
            <h2 className="text-2xl font-extrabold">{activePlayer.name} ist dran!</h2>
            <p className="text-white/40 text-sm">Waehle Wahrheit oder Pflicht</p>
            <div className="flex gap-4 w-full max-w-sm">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleChoice('truth')}
                disabled={mode === 'nur-pflicht'}
                className={cn("flex-1 py-5 rounded-2xl font-extrabold text-lg transition-all",
                  mode === 'nur-pflicht' ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                  'bg-gradient-to-br from-[#df8eff] to-[#d779ff] text-white shadow-[0_0_20px_rgba(223,142,255,0.3)]')}>
                <Heart className="w-6 h-6 mx-auto mb-1" /> Wahrheit
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleChoice('dare')}
                disabled={mode === 'nur-wahrheit'}
                className={cn("flex-1 py-5 rounded-2xl font-extrabold text-lg transition-all",
                  mode === 'nur-wahrheit' ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                  'bg-gradient-to-br from-[#ff6b98] to-[#ff6b98]/80 text-white shadow-[0_0_20px_rgba(255,107,152,0.3)]')}>
                <Flame className="w-6 h-6 mx-auto mb-1" /> Pflicht
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* REVEAL PHASE */}
        {phase === 'reveal' && currentItem && (
          <motion.div key="reveal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            {/* Timer for dares */}
            {choiceType === 'dare' && (
              <div className="flex items-center gap-2">
                <Timer className={cn("w-5 h-5", timer.timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-[#ff6b98]')} />
                <span className={cn("text-2xl font-mono font-bold", timer.timeLeft <= 10 ? 'text-red-400' : 'text-white/80')}>
                  {timer.timeLeft}s
                </span>
              </div>
            )}
            {/* Card */}
            <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.4 }}
              className={cn("w-full max-w-sm rounded-2xl p-6 border shadow-2xl relative overflow-hidden",
                choiceType === 'truth'
                  ? 'bg-[#1b2028] border-[#df8eff]/20'
                  : 'bg-[#1b2028] border-[#ff6b98]/20')}>
              <div className={cn("absolute inset-x-0 top-0 h-[2px]",
                choiceType === 'truth' ? 'bg-gradient-to-r from-[#df8eff] to-[#d779ff]' : 'bg-gradient-to-r from-[#ff6b98] to-[#ff6b98]/80')} />
              <div className="flex items-center gap-2 mb-4">
                {choiceType === 'truth' ? <Heart className="w-5 h-5 text-[#df8eff]" /> : <Flame className="w-5 h-5 text-[#ff6b98]" />}
                <span className={cn("text-xs font-bold uppercase tracking-widest",
                  choiceType === 'truth' ? 'text-[#df8eff]' : 'text-[#ff6b98]')}>
                  {choiceType === 'truth' ? 'Wahrheit' : 'Pflicht'}
                </span>
                <span className="ml-auto text-xs text-white/20">{currentItem.category}</span>
              </div>
              <p className="text-xl font-bold text-white leading-relaxed">{currentItem.text}</p>
              <div className="flex gap-1 mt-4">
                {[1,2,3].map((i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full",
                    i <= currentItem.intensity ? (choiceType === 'truth' ? 'bg-[#df8eff]' : 'bg-[#ff6b98]') : 'bg-white/10')} />
                ))}
              </div>
            </motion.div>
            {/* Action */}
            <div className="flex gap-3 w-full max-w-sm">
              {choiceType === 'dare' ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={startVote}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#0ea5e9] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(143,245,255,0.25)]">
                  <ThumbsUp className="w-5 h-5" /> Abstimmen
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={nextRound}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(207,150,255,0.25)]">
                  Weiter <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* VOTE PHASE */}
        {phase === 'vote' && activePlayer && (
          <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            {(() => {
              const otherPlayers = players.filter((_, i) => i !== activeIdx);
              const voter = otherPlayers[voterIdx];
              if (!voter) return null;
              return (
                <>
                  <h2 className="text-xl font-extrabold">Hat {activePlayer.name} es geschafft?</h2>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: voter.color }}>
                    {voter.avatar}
                  </div>
                  <p className="text-white/60">{voter.name} stimmt ab</p>
                  <div className="flex gap-4">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castVote(true)}
                      className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <ThumbsUp className="w-8 h-8 text-emerald-400" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castVote(false)}
                      className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <ThumbsDown className="w-8 h-8 text-red-400" />
                    </motion.button>
                  </div>
                  <div className="flex gap-1">
                    {otherPlayers.map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", i < voterIdx ? 'bg-[#df8eff]' : i === voterIdx ? 'bg-white' : 'bg-white/10')} />
                    ))}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* GAME OVER */}
        {phase === 'gameOver' && winner && (
          <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
            <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-extrabold text-[#df8eff] neon-glow">
              Spielende!
            </h2>
            <div className="text-lg font-bold text-[#df8eff]">{winner.name} gewinnt!</div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-2xl px-4 py-3">
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
                  <span className="text-[#df8eff] font-bold">{p.score} Pkt.</span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-3 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
                <RotateCcw className="w-4 h-4" /> Nochmal
              </motion.button>
              <button onClick={() => navigate('/games')}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
                Anderes Spiel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
