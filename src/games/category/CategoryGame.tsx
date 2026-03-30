import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Timer,
  Users,
  Trophy,
  RotateCcw,
  Check,
  AlertTriangle,
  Zap,
  Clock,
  Crown,
  Type,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useGameTimer } from "@/games/engine/TimerSystem";
import { CATEGORIES_DE, generateCategoryPrompt } from "@/games/content/categories-de";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameMode = "classic" | "rapid" | "letter";
type Phase = "setup" | "categoryReveal" | "playing" | "roundEnd" | "gameOver";

interface CategoryPlayer {
  id: string;
  name: string;
  score: number;
  losses: number;
}

interface RoundResult {
  category: string;
  letter?: string;
  words: { word: string; playerId: string }[];
  loserId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_INFO: Record<GameMode, { label: string; desc: string; icon: React.ElementType; timer: number }> = {
  classic: { label: "Klassisch", desc: "30s pro Spieler, gleiche Kategorie", icon: Clock, timer: 30 },
  rapid: { label: "Rapid Fire", desc: "10s pro Spieler, neue Kategorie", icon: Zap, timer: 10 },
  letter: { label: "Buchstaben-Lock", desc: "Nur Worte mit bestimmtem Buchstaben", icon: Type, timer: 20 },
};

const AVATARS = ["🎉", "🎈", "🎊", "🎶", "🎵", "🎸", "🎤", "🎭", "🎬", "🌟", "💫", "🔥", "⚡", "🎯", "🏆"];

// ---------------------------------------------------------------------------
// Timer Circle SVG
// ---------------------------------------------------------------------------

function TimerCircle({ percent, timeLeft }: { percent: number; timeLeft: number; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const isLow = timeLeft <= 5;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={isLow ? "#ef4444" : "url(#timerGradAmber)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        <defs>
          <linearGradient id="timerGradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
      </svg>
      <motion.span
        className={`absolute text-4xl font-black ${isLow ? "text-red-400" : "text-white"}`}
        animate={isLow ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.6 }}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Word Chip (glass pill)
// ---------------------------------------------------------------------------

function WordChip({ word, isNew }: { word: string; isNew: boolean }) {
  return (
    <motion.span
      initial={isNew ? { opacity: 0, scale: 0.6, y: 10 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="inline-block rounded-full border border-white/[0.08] bg-[#13131b]/80 backdrop-blur-xl px-3.5 py-1.5 text-sm font-medium text-white/70"
    >
      {word}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

function SetupScreen({
  onStart,
}: {
  onStart: (players: CategoryPlayer[], mode: GameMode, rounds: number, timer: number) => void;
}) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const [mode, setMode] = useState<GameMode>("classic");
  const [rounds, setRounds] = useState(5);
  const [timerVal, setTimerVal] = useState(MODE_INFO.classic.timer);

  const handleModeChange = (m: GameMode) => {
    setMode(m);
    setTimerVal(MODE_INFO[m].timer);
  };

  const addPlayer = () => setNames((prev) => [...prev, ""]);
  const removePlayer = (i: number) => setNames((prev) => prev.filter((_, idx) => idx !== i));
  const updateName = (i: number, v: string) => setNames((prev) => prev.map((n, idx) => (idx === i ? v : n)));

  const canStart = names.filter((n) => n.trim()).length >= 2;

  const handleStart = () => {
    const players: CategoryPlayer[] = names
      .filter((n) => n.trim())
      .map((name, i) => ({ id: `p${i}`, name: name.trim(), score: 0, losses: 0 }));
    onStart(players, mode, rounds, timerVal);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-28">
      {/* Players Card */}
      <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-extrabold font-[Plus_Jakarta_Sans] text-white">Spieler</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{AVATARS[i % AVATARS.length]}</span>
              </div>
              <input
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Spieler ${i + 1}`}
                className="flex-1 min-w-0 rounded-[0.75rem] border border-white/[0.06] bg-[#13131b] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/30 transition-colors"
              />
              {names.length > 2 && (
                <button onClick={() => removePlayer(i)} className="text-white/20 hover:text-red-400 transition-colors text-lg px-0.5 flex-shrink-0">
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        {names.length < 15 && (
          <button onClick={addPlayer} className="w-full rounded-[0.75rem] border border-dashed border-white/[0.08] py-2 text-sm text-white/30 hover:text-white/50 hover:border-white/15 transition-colors">
            + Spieler hinzufugen
          </button>
        )}
      </div>

      {/* Mode Selection Cards */}
      <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-5 space-y-4">
        <h2 className="text-base font-extrabold font-[Plus_Jakarta_Sans] text-white">Spielmodus</h2>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(MODE_INFO) as GameMode[]).map((m) => {
            const info = MODE_INFO[m];
            const Icon = info.icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex items-center gap-3 rounded-[1rem] border p-4 text-left transition-all relative overflow-hidden ${
                  active
                    ? "border-amber-500/40 bg-amber-500/[0.08] shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                    : "border-white/[0.06] bg-[#13131b] hover:border-white/10"
                }`}
              >
                {active && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-[0.75rem] ${active ? "bg-amber-500/15" : "bg-white/[0.04]"}`}>
                  <Icon className={`h-5 w-5 ${active ? "text-amber-400" : "text-white/30"}`} />
                </div>
                <div>
                  <span className={`font-semibold ${active ? "text-amber-300" : "text-white/70"}`}>{info.label}</span>
                  <p className="text-xs text-white/30">{info.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Timer</span>
            <span className="text-sm font-bold text-amber-400">{timerVal}s</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={timerVal}
            onChange={(e) => setTimerVal(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5"
          />
        </div>
        <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Runden</span>
            <span className="text-sm font-bold text-amber-400">{rounds}</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5"
          />
        </div>
      </div>

      {/* Fixed Bottom Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d15] via-[#0d0d15] to-transparent z-20">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={!canStart}
            onClick={handleStart}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-base font-extrabold font-[Plus_Jakarta_Sans] text-[#0d0d15] uppercase tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Spiel starten
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Reveal Screen
// ---------------------------------------------------------------------------

function CategoryRevealScreen({
  category,
  letter,
  mode,
  onReady,
}: {
  category: string;
  letter?: string;
  mode: GameMode;
  onReady: () => void;
}) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onReady();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onReady]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="flex flex-col items-center justify-center gap-6 py-20"
    >
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/60">
        Kategorie
      </span>

      {/* Glass card for category */}
      <div className="relative rounded-[1rem] bg-[#13131b]/80 backdrop-blur-xl border border-white/[0.06] px-8 py-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-t-[1rem]" />
        <motion.h1
          className="text-center text-4xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {category}
        </motion.h1>
      </div>

      {mode === "letter" && letter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-5 py-2"
        >
          <Type className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">Nur mit "{letter}"</span>
        </motion.div>
      )}

      <motion.span
        key={count}
        initial={{ opacity: 0, scale: 2 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="mt-8 text-7xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
      >
        {count > 0 ? count : "Los!"}
      </motion.span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Playing Screen
// ---------------------------------------------------------------------------

function PlayingScreen({
  category,
  letter,
  mode,
  players,
  currentPlayerIndex,
  timerSeconds,
  words,
  onWordSaid,
  onTimerExpire,
}: {
  category: string;
  letter?: string;
  mode: GameMode;
  players: CategoryPlayer[];
  currentPlayerIndex: number;
  timerSeconds: number;
  words: { word: string; playerId: string }[];
  onWordSaid: (word: string) => "ok" | "duplicate" | "wrong_letter";
  onTimerExpire: () => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [flash, setFlash] = useState<"duplicate" | "wrong_letter" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const timer = useGameTimer(timerSeconds, onTimerExpire);

  useEffect(() => {
    timer.reset(timerSeconds);
    timer.start();
    setInputVal("");
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIndex, timerSeconds]);

  const handleSubmit = () => {
    const word = inputVal.trim();
    if (!word) return;
    const result = onWordSaid(word);
    if (result === "ok") {
      setInputVal("");
      inputRef.current?.focus();
    } else {
      setFlash(result);
      setTimeout(() => setFlash(null), 600);
    }
  };

  const handleGesagt = () => {
    onWordSaid("__verbal__");
    setInputVal("");
  };

  const currentPlayer = players[currentPlayerIndex];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Top status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <span className="text-sm font-semibold text-white/70">{currentPlayer.name}</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06]">
          <span className="text-xs text-white/30">Runde </span>
          <span className="text-xs font-bold text-amber-400">{words.length + 1}</span>
        </div>
      </div>

      {/* Category Glass Card */}
      <div className="relative rounded-[1rem] bg-[#13131b]/80 backdrop-blur-xl border border-white/[0.06] px-6 py-5 text-center">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-t-[1rem]" />
        <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
          {category}
        </h2>
        {mode === "letter" && letter && (
          <span className="text-sm font-bold text-amber-400/60 mt-1 block">Buchstabe: {letter}</span>
        )}
      </div>

      {/* Player Dots */}
      <div className="flex items-center justify-center gap-2">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            animate={i === currentPlayerIndex ? { scale: [1, 1.2, 1], borderColor: "#f59e0b" } : { scale: 1, borderColor: "rgba(255,255,255,0.06)" }}
            transition={i === currentPlayerIndex ? { repeat: Infinity, duration: 1.5 } : {}}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
              i === currentPlayerIndex ? "bg-amber-500/15 text-amber-300" : "bg-[#1f1f29] text-white/30"
            }`}
          >
            {p.name.charAt(0).toUpperCase()}
          </motion.div>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="flex justify-center">
        <TimerCircle percent={timer.percentLeft} timeLeft={timer.timeLeft} total={timerSeconds} />
      </div>

      {/* Input */}
      <motion.div
        animate={flash ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Wort eingeben..."
            className={`flex-1 rounded-[1rem] border px-4 py-3 text-white placeholder:text-white/20 outline-none transition-colors bg-[#13131b] ${
              flash === "duplicate" ? "border-red-500 bg-red-500/[0.08]" : flash === "wrong_letter" ? "border-orange-500 bg-orange-500/[0.08]" : "border-white/[0.06] focus:border-amber-500/30"
            }`}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSubmit}
            className="rounded-[1rem] bg-amber-500/15 border border-amber-500/20 px-4 text-amber-300 font-semibold hover:bg-amber-500/25 transition-colors"
          >
            <Check className="h-5 w-5" />
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGesagt}
          className="w-full rounded-full border border-amber-500/15 bg-amber-500/[0.06] py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/10 transition-colors"
        >
          Gesagt! (verbal)
        </motion.button>
        <AnimatePresence>
          {flash === "duplicate" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-sm text-red-400 font-medium">
              <AlertTriangle className="h-4 w-4" /> Duplikat! Schon gesagt.
            </motion.p>
          )}
          {flash === "wrong_letter" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-sm text-orange-400 font-medium">
              <AlertTriangle className="h-4 w-4" /> Muss mit "{letter}" anfangen!
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Said Words as glass pills */}
      {words.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-white/25 uppercase tracking-widest">Gesagte Worter ({words.length})</span>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {words.map((w, i) => (
              <WordChip key={`${w.word}-${i}`} word={w.word === "__verbal__" ? `[${players.find(p => p.id === w.playerId)?.name}]` : w.word} isNew={i === words.length - 1} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Round End Screen
// ---------------------------------------------------------------------------

function RoundEndScreen({
  result,
  players,
  round,
  maxRounds,
  onNext,
}: {
  result: RoundResult;
  players: CategoryPlayer[];
  round: number;
  maxRounds: number;
  onNext: () => void;
}) {
  const loser = players.find((p) => p.id === result.loserId);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <div className="px-4 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] inline-block mb-3">
          <span className="text-xs text-white/30 uppercase tracking-widest">Runde {round} / {maxRounds}</span>
        </div>
        <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white">{result.category}</h2>
      </div>

      {loser && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-[1rem] border-l-4 border-[#ff7350] bg-[#1f1f29] p-4 text-center"
        >
          <Timer className="mx-auto h-8 w-8 text-[#ff7350] mb-2" />
          <p className="text-lg font-bold text-[#ff7350]">{loser.name}</p>
          <p className="text-sm text-white/30">Zeit abgelaufen!</p>
        </motion.div>
      )}

      {/* Words as pills */}
      <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-5 space-y-3">
        <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">Genannte Worter ({result.words.length})</span>
        <div className="flex flex-wrap gap-2">
          {result.words.map((w, i) => (
            <span key={i} className="inline-block rounded-full border border-white/[0.06] bg-[#13131b]/80 backdrop-blur-xl px-3.5 py-1.5 text-sm text-white/60">
              {w.word === "__verbal__" ? `[${players.find(p => p.id === w.playerId)?.name}]` : w.word}
            </span>
          ))}
          {result.words.length === 0 && <span className="text-sm text-white/20">Keine Worter genannt</span>}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-[1rem] bg-[#1f1f29] border border-white/[0.06] p-5 space-y-2">
        <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">Punktestand</span>
        {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
          <div key={p.id} className={`flex items-center justify-between rounded-[0.75rem] px-3 py-2.5 ${
            p.id === result.loserId ? "bg-[#ff7350]/[0.06] border border-[#ff7350]/10" : i === 0 ? "bg-amber-500/[0.06] border border-amber-500/10" : ""
          }`}>
            <div className="flex items-center gap-2">
              {i === 0 && <Crown className="h-4 w-4 text-amber-400" />}
              <span className={`font-medium ${p.id === result.loserId ? "text-[#ff7350]" : "text-white/70"}`}>{p.name}</span>
            </div>
            <span className="font-bold text-amber-400">{p.score} Pkt</span>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-base font-extrabold font-[Plus_Jakarta_Sans] text-[#0d0d15] uppercase tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
      >
        {round < maxRounds ? "Nachste Runde" : "Ergebnisse"}
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

function GameOverScreen({ players, onRestart }: { players: CategoryPlayer[]; onRestart: () => void }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Celebration header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
          Endergebnis
        </h2>
      </div>

      {/* Leaderboard with winner highlight */}
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between rounded-[1rem] border p-4 ${
              i === 0
                ? "border-amber-500/30 bg-amber-500/[0.08] shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                : "border-white/[0.06] bg-[#1f1f29]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                i === 0 ? "bg-amber-500/20 text-amber-300" : i === 1 ? "bg-white/[0.06] text-white/50" : "bg-white/[0.03] text-white/30"
              }`}>
                {i + 1}
              </span>
              <div>
                <span className={`font-bold ${i === 0 ? "text-amber-300" : "text-white/70"}`}>
                  {p.name}
                </span>
                <p className="text-xs text-white/30">{p.losses} Runde{p.losses !== 1 ? "n" : ""} verloren</p>
              </div>
            </div>
            <span className={`text-xl font-black ${i === 0 ? "text-amber-400" : "text-white/50"}`}>
              {p.score}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-base font-extrabold font-[Plus_Jakarta_Sans] text-[#0d0d15] uppercase tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-5 w-5" /> Nochmal
        </motion.button>
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
        >
          Anderes Spiel
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function CategoryGame() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<CategoryPlayer[]>([]);
  const [mode, setMode] = useState<GameMode>("classic");
  const [maxRounds, setMaxRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [roundWords, setRoundWords] = useState<{ word: string; playerId: string }[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const saidWordsRef = useRef<Set<string>>(new Set());

  const [usedCategories, setUsedCategories] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentLetter, setCurrentLetter] = useState<string | undefined>();

  const pickCategory = useCallback(() => {
    const available = CATEGORIES_DE.filter((c) => !usedCategories.has(c));
    const pool = available.length > 0 ? available : CATEGORIES_DE;
    const cat = pool[Math.floor(Math.random() * pool.length)];
    setUsedCategories((prev) => new Set(prev).add(cat));
    setCurrentCategory(cat);
    if (mode === "letter") {
      const prompt = generateCategoryPrompt();
      setCurrentLetter(prompt.letter);
    } else {
      setCurrentLetter(undefined);
    }
  }, [usedCategories, mode]);

  const handleStart = useCallback(
    (p: CategoryPlayer[], m: GameMode, rounds: number, timer: number) => {
      setPlayers(p);
      setMode(m);
      setMaxRounds(rounds);
      setTimerSeconds(timer);
      setCurrentRound(1);
      setCurrentPlayerIndex(0);
      setRoundWords([]);
      setRoundResults([]);
      saidWordsRef.current.clear();
      setUsedCategories(new Set());
      const available = CATEGORIES_DE;
      const cat = available[Math.floor(Math.random() * available.length)];
      setCurrentCategory(cat);
      setUsedCategories(new Set([cat]));
      if (m === "letter") {
        const prompt = generateCategoryPrompt();
        setCurrentLetter(prompt.letter);
      }
      setPhase("categoryReveal");
    },
    []
  );

  const handleRevealReady = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleWordSaid = useCallback(
    (word: string): "ok" | "duplicate" | "wrong_letter" => {
      if (word !== "__verbal__") {
        const normalized = word.toLowerCase().trim();
        if (saidWordsRef.current.has(normalized)) return "duplicate";
        if (mode === "letter" && currentLetter && !normalized.startsWith(currentLetter.toLowerCase())) {
          return "wrong_letter";
        }
        saidWordsRef.current.add(normalized);
      }
      const playerId = players[currentPlayerIndex].id;
      setRoundWords((prev) => [...prev, { word, playerId }]);
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, score: p.score + 1 } : p))
      );
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
      return "ok";
    },
    [currentPlayerIndex, players, mode, currentLetter]
  );

  const handleTimerExpire = useCallback(() => {
    const loserId = players[currentPlayerIndex]?.id ?? null;
    setPlayers((prev) =>
      prev.map((p) => (p.id === loserId ? { ...p, losses: p.losses + 1 } : p))
    );
    const result: RoundResult = {
      category: currentCategory,
      letter: currentLetter,
      words: roundWords,
      loserId,
    };
    setRoundResults((prev) => [...prev, result]);
    setPhase("roundEnd");
  }, [currentPlayerIndex, players, currentCategory, currentLetter, roundWords]);

  const handleNextRound = useCallback(() => {
    if (currentRound >= maxRounds) {
      setPhase("gameOver");
      return;
    }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setCurrentPlayerIndex(0);
    setRoundWords([]);
    saidWordsRef.current.clear();
    pickCategory();
    setPhase("categoryReveal");
  }, [currentRound, maxRounds, pickCategory]);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setPlayers([]);
    setRoundResults([]);
    setUsedCategories(new Set());
  }, []);

  const latestResult = roundResults[roundResults.length - 1];

  return (
    <AnimatedBackground>
      <div className="min-h-screen bg-[#0d0d15]/90">
        <div className="mx-auto max-w-lg px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => (phase === "setup" ? navigate("/games") : handleRestart())}
              className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{phase === "setup" ? "Zuruck" : "Beenden"}</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[0.5rem] bg-[#1f1f29] border border-amber-500/20 flex items-center justify-center">
                <Timer className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-lg font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Zeit-Kategorie
              </span>
            </div>
          </div>

          {/* Phase Content */}
          <AnimatePresence mode="wait">
            {phase === "setup" && <SetupScreen key="setup" onStart={handleStart} />}
            {phase === "categoryReveal" && (
              <CategoryRevealScreen
                key={`reveal-${currentRound}`}
                category={currentCategory}
                letter={currentLetter}
                mode={mode}
                onReady={handleRevealReady}
              />
            )}
            {phase === "playing" && (
              <PlayingScreen
                key={`playing-${currentRound}`}
                category={currentCategory}
                letter={currentLetter}
                mode={mode}
                players={players}
                currentPlayerIndex={currentPlayerIndex}
                timerSeconds={timerSeconds}
                words={roundWords}
                onWordSaid={handleWordSaid}
                onTimerExpire={handleTimerExpire}
              />
            )}
            {phase === "roundEnd" && latestResult && (
              <RoundEndScreen
                key={`roundEnd-${currentRound}`}
                result={latestResult}
                players={players}
                round={currentRound}
                maxRounds={maxRounds}
                onNext={handleNextRound}
              />
            )}
            {phase === "gameOver" && (
              <GameOverScreen key="gameOver" players={players} onRestart={handleRestart} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedBackground>
  );
}
