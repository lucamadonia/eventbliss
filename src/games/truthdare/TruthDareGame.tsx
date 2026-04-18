import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown,
  Timer, Flame, Heart, Shield, Sparkles, Zap, Check, RefreshCw, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { useGameTimer } from '../engine/TimerSystem';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { haptics } from '@/hooks/useHaptics';
import { TRUTH_QUESTIONS, DARE_CHALLENGES, type TruthQuestion, type DareChallenge } from './truthdare-content-de';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";

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

export default function TruthDareGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);

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

  useTVGameBridge('truthdare', {
    phase, currentRound, activeIdx, players,
    choiceType,
    task: currentItem ? ('question' in currentItem ? currentItem.question : currentItem.challenge) : '',
  }, [phase, currentRound, activeIdx, choiceType]);

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

  // Re-draw the same type without advancing the round. Used by the
  // "Neue Aufgabe"-Button on the reveal card.
  const rerollCurrent = () => {
    haptics.light();
    if (choiceType === 'truth') drawTruth();
    else if (choiceType === 'dare') drawDare();
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

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, totalRounds, activeIdx,
      choiceType, currentItem: currentItem ? { text: (currentItem as TruthQuestion).question ?? (currentItem as DareChallenge).challenge } : null,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  }, [phase, currentRound, activeIdx, choiceType, currentItem, players, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.activeIdx !== undefined) setActiveIdx(data.activeIdx as number);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  const winner = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score)[0], [players]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="truthdare"
        modes={getTranslatedModes('truthdare', GAME_MODES, t)}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Wahrheit oder Pflicht 2.0"
        minPlayers={2}
        maxPlayers={20}
        onlinePlayers={online?.players}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-game">
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
            <ActivePlayerBanner
              playerName={activePlayer.name}
              playerColor={activePlayer.color}
              playerAvatar={activePlayer.avatar}
              hidden={false}
            />
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: activePlayer.color }}>
              {activePlayer.avatar}
            </div>
            <h2 className="text-2xl font-extrabold">{activePlayer.name} ist dran!</h2>
            <p className="text-white/40 text-sm">
              {isDrinkingMode ? 'Waehle — oder trink!' : 'Waehle Wahrheit oder Pflicht'}
            </p>
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
            {isDrinkingMode && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const d = drinkingMode.recordDrink();
                  if (d) {
                    haptics.warning();
                    setDisclaimer(d);
                    setTimeout(() => setDisclaimer(null), 5000);
                    setTimeout(() => nextRound(), 2000);
                  } else {
                    nextRound();
                  }
                }}
                className="w-full max-w-sm py-4 rounded-2xl font-extrabold text-lg bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              >
                {"\uD83C\uDF7A"} Dann trinkst du!
              </motion.button>
            )}

            {/* Disclaimer banner — appears when drink threshold is hit */}
            <AnimatePresence>
              {disclaimer && (
                <motion.div
                  className="relative z-10 mt-4 mx-6 px-5 py-3 rounded-2xl bg-amber-900/40 border border-amber-500/30 backdrop-blur text-center"
                  initial={{ y: 30, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                >
                  <span className="text-2xl">{disclaimer.emoji}</span>
                  <p className="text-sm text-amber-200 font-semibold mt-1">{disclaimer.message}</p>
                  <p className="text-[10px] text-amber-300/50 mt-1">
                    Drink #{drinkingMode.drinkCount} · Bitte trinkt verantwortungsvoll
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* REVEAL PHASE */}
        {phase === 'reveal' && currentItem && (() => {
          const isTruth = choiceType === 'truth';
          // Tone tokens — full color palette per type
          const tone = isTruth
            ? { main: '#df8eff', dim: '#d779ff', onChip: '#3d0055', glow: 'rgba(223,142,255,0.3)' }
            : { main: '#ff6b98', dim: '#e4006c', onChip: '#47001d', glow: 'rgba(255,107,152,0.3)' };
          const others = players.filter((_, i) => i !== activeIdx);
          const urgent = isTruth ? false : timer.timeLeft <= 10;
          const timeStr = timer.timeLeft >= 60
            ? `${Math.floor(timer.timeLeft / 60)}:${String(timer.timeLeft % 60).padStart(2, '0')}`
            : `0:${String(timer.timeLeft).padStart(2, '0')}`;

          return (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center px-5 py-6 max-w-xl mx-auto w-full"
            >
              {/* Timer chip — only for dares */}
              {!isTruth && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex flex-col items-center"
                >
                  <motion.div
                    animate={urgent ? { scale: [1, 1.04, 1] } : {}}
                    transition={urgent ? { duration: 0.6, repeat: Infinity } : {}}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 py-2 rounded-full border',
                      urgent
                        ? 'bg-[#ff6e84]/15 border-[#ff6e84]/40 shadow-[0_0_20px_rgba(255,110,132,0.35)]'
                        : 'bg-[#20262f] border-[#ff6b98]/30 shadow-[0_0_20px_rgba(255,107,152,0.25)]',
                    )}
                  >
                    <Timer className={cn('w-5 h-5', urgent ? 'text-[#ff6e84]' : 'text-[#ff6b98]')} />
                    <span className={cn('font-black text-2xl tracking-tighter tabular-nums', urgent ? 'text-[#ff6e84]' : 'text-white')}>
                      {timeStr}
                    </span>
                  </motion.div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-[0.25em] mt-2', urgent ? 'text-[#ff6e84]' : 'text-[#ff6b98]')}>
                    {urgent ? 'Letzte Sekunden!' : 'Beeil dich!'}
                  </span>
                </motion.div>
              )}

              {/* Task card with outer gradient glow */}
              <div className="relative w-full group">
                {/* Gradient glow halo */}
                <motion.div
                  className="absolute -inset-1 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-1000"
                  style={{
                    background: 'linear-gradient(45deg, #ff6b98, #df8eff, #8ff5ff)',
                  }}
                  animate={{ opacity: [0.25, 0.45, 0.25] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                  initial={{ rotateY: 80, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center border border-white/5 overflow-hidden"
                  style={{
                    background: 'rgba(27, 32, 40, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  {/* Corner-folded type badge */}
                  <div className="absolute top-0 right-0">
                    <div
                      className="font-black px-5 py-1.5 rounded-bl-2xl uppercase tracking-widest text-[11px] shadow-lg"
                      style={{ background: tone.main, color: tone.onChip }}
                    >
                      {isTruth ? 'Wahrheit' : 'Pflicht'}
                    </div>
                  </div>

                  {/* Active player avatar */}
                  {activePlayer && (
                    <div className="absolute top-5 left-5 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                        style={{ backgroundColor: activePlayer.color, borderColor: tone.main }}
                      >
                        {activePlayer.avatar}
                      </div>
                    </div>
                  )}

                  {/* Big type icon + label */}
                  <div className="mt-10 mb-5">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], y: [0, -3, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex justify-center mb-3"
                    >
                      {isTruth
                        ? <Heart className="w-14 h-14" style={{ color: tone.main, filter: `drop-shadow(0 0 16px ${tone.glow})` }} />
                        : <Flame className="w-14 h-14" style={{ color: tone.main, filter: `drop-shadow(0 0 16px ${tone.glow})` }} />
                      }
                    </motion.div>
                    <span className="text-[#8ff5ff] text-[10px] font-black uppercase tracking-[0.3em]">
                      Deine Aufgabe
                    </span>
                  </div>

                  {/* Task text */}
                  <p className="font-black text-2xl sm:text-3xl leading-tight text-white tracking-tight px-2 mb-5">
                    {currentItem.text}
                  </p>

                  {/* Intensity pips */}
                  <div className="flex items-center gap-1.5 mb-6">
                    <span className="text-[9px] text-[#a8abb3] font-bold uppercase tracking-widest mr-1">Level</span>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-5 h-1.5 rounded-full"
                        style={{
                          background: i <= currentItem.intensity ? tone.main : 'rgba(255,255,255,0.1)',
                          boxShadow: i <= currentItem.intensity ? `0 0 6px ${tone.glow}` : 'none',
                        }}
                      />
                    ))}
                    <span className="ml-auto text-[9px] text-[#a8abb3]/60 uppercase tracking-widest pl-2">
                      {currentItem.category}
                    </span>
                  </div>

                  {/* Social proof: who's waiting */}
                  {others.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#000000]/40 rounded-full mb-6 border border-[#44484f]/30">
                      <div className="flex -space-x-2">
                        {others.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="w-6 h-6 rounded-full border-2 border-[#1b2028] flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatar}
                          </div>
                        ))}
                      </div>
                      <span className="text-[#a8abb3] text-[11px] font-medium">
                        {others.length > 3
                          ? `+${others.length - 3} warten auf dich`
                          : 'warten auf dich'}
                      </span>
                    </div>
                  )}

                  {/* Action stack */}
                  <div className="w-full flex flex-col gap-3">
                    {!isTruth ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { haptics.celebrate(); startVote(); }}
                        className="w-full h-14 rounded-full font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 text-white"
                        style={{
                          background: `linear-gradient(90deg, ${tone.main}, ${tone.dim})`,
                          boxShadow: `0 0 24px ${tone.glow}, inset 0 0 12px rgba(255,255,255,0.15)`,
                        }}
                      >
                        <Check className="w-5 h-5" />
                        Erledigt
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { haptics.celebrate(); nextRound(); }}
                        className="w-full h-14 rounded-full font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2"
                        style={{
                          background: `linear-gradient(90deg, ${tone.main}, ${tone.dim})`,
                          color: tone.onChip,
                          boxShadow: `0 0 24px ${tone.glow}, inset 0 0 12px rgba(255,255,255,0.15)`,
                        }}
                      >
                        <Check className="w-5 h-5" />
                        Erledigt
                      </motion.button>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={rerollCurrent}
                      className="w-full h-12 rounded-full flex items-center justify-center gap-2 bg-[#20262f]/50 border border-[#44484f]/30 text-[#a8abb3] font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-[#262c36] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Neue Aufgabe
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Discrete rules link */}
              <button
                type="button"
                className="mt-8 opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 text-[#a8abb3] cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Regeln anzeigen</span>
              </button>
            </motion.div>
          );
        })()}

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
                  <h2 className="text-xl font-extrabold">
                    {isDrinkingMode
                      ? `Hat ${activePlayer.name} es geschafft? Sonst: \uD83C\uDF7A`
                      : `Hat ${activePlayer.name} es geschafft?`}
                  </h2>
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
