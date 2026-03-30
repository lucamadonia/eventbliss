import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCcw, ChevronRight, Trophy, Timer, Check, X, Play, ArrowLeft } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { HEADUP_CATEGORIES_DE, type HeadUpCategory } from '../content/headup-words-de';
import { useGameTimer } from '../engine/TimerSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

type GameScreen = 'setup' | 'ready' | 'playing' | 'roundResult' | 'gameOver';

interface WordResult {
  word: string;
  correct: boolean;
}

interface RoundScore {
  playerName: string;
  correct: number;
  skipped: number;
  words: WordResult[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function triggerHaptic(style: 'light' | 'medium' | 'heavy') {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: style as never }).catch(() => {});
  } else if ('vibrate' in navigator) {
    const ms = style === 'light' ? 50 : style === 'medium' ? 100 : 200;
    navigator.vibrate(ms);
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HeadUpGame() {
  const [screen, setScreen] = useState<GameScreen>('setup');
  const [selectedCategory, setSelectedCategory] = useState<HeadUpCategory | null>(null);
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordQueue, setWordQueue] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [roundWords, setRoundWords] = useState<WordResult[]>([]);
  const [allRounds, setAllRounds] = useState<RoundScore[]>([]);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const cooldownRef = useRef(false);
  const orientationActiveRef = useRef(false);

  const handleTimerExpire = useCallback(() => {
    orientationActiveRef.current = false;
    triggerHaptic('heavy');
    setScreen('roundResult');
  }, []);

  const { timeLeft, start: startTimer, reset: resetTimer, percentLeft } =
    useGameTimer(timerDuration, handleTimerExpire);

  // ── Setup Screen Handlers ────────────────────────────────────────────────────

  const handleStartRound = useCallback(() => {
    if (!selectedCategory) return;
    const words = shuffleArray(selectedCategory.words);
    setWordQueue(words);
    setCurrentWordIndex(0);
    setRoundWords([]);
    setScreen('ready');
    setCountdown(3);
  }, [selectedCategory]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setScreen('playing');
      resetTimer(timerDuration);
      startTimer();
      setTimeout(() => { orientationActiveRef.current = true; }, 500);
      return;
    }
    const timeout = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timeout);
  }, [countdown, timerDuration, resetTimer, startTimer]);

  // ── Word Navigation ──────────────────────────────────────────────────────────

  const currentWord = wordQueue[currentWordIndex] ?? '';

  const advanceWord = useCallback(
    (correct: boolean) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      const result: WordResult = { word: currentWord, correct };
      setRoundWords((prev) => [...prev, result]);
      setFlash(correct ? 'green' : 'red');
      triggerHaptic(correct ? 'medium' : 'light');
      setTimeout(() => setFlash(null), 300);
      setCurrentWordIndex((prev) => {
        const next = prev + 1;
        if (next >= wordQueue.length) {
          setWordQueue((q) => shuffleArray(q));
          return 0;
        }
        return next;
      });
      setTimeout(() => { cooldownRef.current = false; }, 300);
    },
    [currentWord, wordQueue.length]
  );

  // ── Device Orientation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'playing') return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!orientationActiveRef.current) return;
      const beta = e.beta ?? 0;
      if (beta > 30) advanceWord(true);
      if (beta < -30) advanceWord(false);
    };
    const requestAndListen = async () => {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE.requestPermission === 'function') {
        try {
          const perm = await DOE.requestPermission();
          if (perm !== 'granted') return;
        } catch { return; }
      }
      window.addEventListener('deviceorientation', handleOrientation);
    };
    requestAndListen();
    return () => { window.removeEventListener('deviceorientation', handleOrientation); };
  }, [screen, advanceWord]);

  // ── Round End Logic ──────────────────────────────────────────────────────────

  const correctCount = roundWords.filter((w) => w.correct).length;
  const skippedCount = roundWords.filter((w) => !w.correct).length;

  const handleNextRound = useCallback(() => {
    const roundScore: RoundScore = {
      playerName: `Spieler ${currentRound}`,
      correct: roundWords.filter((w) => w.correct).length,
      skipped: roundWords.filter((w) => !w.correct).length,
      words: [...roundWords],
    };
    setAllRounds((prev) => [...prev, roundScore]);
    if (currentRound >= totalRounds) {
      setScreen('gameOver');
    } else {
      setCurrentRound((r) => r + 1);
      handleStartRound();
    }
  }, [currentRound, totalRounds, roundWords, handleStartRound]);

  const handleRestart = useCallback(() => {
    setScreen('setup');
    setSelectedCategory(null);
    setCurrentRound(1);
    setAllRounds([]);
    setRoundWords([]);
    orientationActiveRef.current = false;
  }, []);

  // ── Final stats ──────────────────────────────────────────────────────────────

  const finalRounds = screen === 'gameOver'
    ? [...allRounds, {
        playerName: `Spieler ${currentRound}`,
        correct: correctCount,
        skipped: skippedCount,
        words: [...roundWords],
      }]
    : allRounds;

  const totalCorrect = finalRounds.reduce((s, r) => s + r.correct, 0);
  const bestRound = finalRounds.reduce(
    (best, r) => (r.correct > best.correct ? r : best),
    finalRounds[0] ?? { playerName: '', correct: 0, skipped: 0, words: [] }
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-[#0d0d15] text-white overflow-hidden relative">
      <AnimatePresence mode="wait">
        {/* ── SETUP SCREEN ──────────────────────────────────────────── */}
        {screen === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 pb-32 max-w-lg mx-auto"
          >
            {/* Hero Header */}
            <div className="text-center mb-8 pt-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1rem] bg-[#1f1f29] border border-[#00e3fd]/20 mb-4">
                <Smartphone className="w-8 h-8 text-[#00e3fd]" />
              </div>
              <h1 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#00e3fd] to-[#00e3fd]/60 bg-clip-text text-transparent">
                Stirnraten
              </h1>
              <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
                Halte das Handy an die Stirn - deine Freunde beschreiben!
              </p>
            </div>

            {/* Category Bento Grid */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 px-1">
                Kategorie wählen
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {HEADUP_CATEGORIES_DE.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative p-4 rounded-[1rem] text-left transition-all duration-200
                      bg-[#1f1f29] border
                      ${selectedCategory?.id === cat.id
                        ? 'border-[#00e3fd]/60 shadow-[0_0_20px_rgba(0,227,253,0.15)] scale-[1.02]'
                        : 'border-white/[0.06] hover:border-white/10'
                      }`}
                  >
                    {selectedCategory?.id === cat.id && (
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e3fd] to-transparent rounded-t-[1rem]" />
                    )}
                    <span className="text-2xl block mb-2">{cat.emoji}</span>
                    <span className="text-sm font-semibold text-white/90">{cat.name}</span>
                    <span className="text-xs text-white/30 block mt-0.5">
                      {cat.words.length} Begriffe
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Bento Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Timer Card */}
              <div className="bg-[#1f1f29] border border-white/[0.06] rounded-[1rem] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-[#00e3fd]/70" />
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Zeit</span>
                </div>
                <div className="flex gap-1.5">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setTimerDuration(sec)}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all
                        ${timerDuration === sec
                          ? 'bg-[#00e3fd] text-[#0d0d15] shadow-[0_0_12px_rgba(0,227,253,0.3)]'
                          : 'bg-white/[0.06] text-white/40 hover:bg-white/10'
                        }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds Card */}
              <div className="bg-[#1f1f29] border border-white/[0.06] rounded-[1rem] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="w-4 h-4 text-[#00e3fd]/70" />
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Runden</span>
                </div>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTotalRounds(r)}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all
                        ${totalRounds === r
                          ? 'bg-[#00e3fd] text-[#0d0d15] shadow-[0_0_12px_rgba(0,227,253,0.3)]'
                          : 'bg-white/[0.06] text-white/40 hover:bg-white/10'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Start Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d15] via-[#0d0d15] to-transparent z-20">
              <div className="max-w-lg mx-auto">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartRound}
                  disabled={!selectedCategory}
                  className={`w-full py-4 rounded-full text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide transition-all flex items-center justify-center gap-2
                    ${selectedCategory
                      ? 'bg-gradient-to-r from-[#00e3fd] to-[#00b4d8] text-[#0d0d15] shadow-[0_0_30px_rgba(0,227,253,0.25)]'
                      : 'bg-white/[0.06] text-white/20 cursor-not-allowed'
                    }`}
                >
                  <Play className="w-5 h-5" />
                  Spiel starten
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── READY SCREEN ──────────────────────────────────────────── */}
        {screen === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center min-h-[100dvh] p-8"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="mb-8"
            >
              <div className="w-24 h-40 rounded-[1rem] border-2 border-[#00e3fd]/40 bg-[#13131b]/80 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,227,253,0.1)]">
                <Smartphone className="w-12 h-12 text-[#00e3fd]" />
              </div>
            </motion.div>

            <p className="text-xl font-extrabold font-[Plus_Jakarta_Sans] text-center mb-2">
              Halte das Handy an deine Stirn
            </p>
            <p className="text-white/40 text-center text-sm mb-8 max-w-xs">
              Kippe vorwärts für richtig, rückwärts zum Überspringen
            </p>

            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-7xl font-black text-[#00e3fd] drop-shadow-[0_0_20px_rgba(0,227,253,0.5)]"
              >
                {countdown === 0 ? 'LOS!' : countdown}
              </motion.div>
            )}

            <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f1f29] border border-white/[0.06]">
              <span className="text-xs text-white/40">Runde {currentRound}/{totalRounds}</span>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/40">{selectedCategory?.emoji} {selectedCategory?.name}</span>
            </div>
          </motion.div>
        )}

        {/* ── PLAYING SCREEN ────────────────────────────────────────── */}
        {screen === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col min-h-[100dvh] bg-[#0d0d15]"
          >
            {/* Flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key={flash}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 z-30 pointer-events-none ${
                    flash === 'green' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              )}
            </AnimatePresence>

            {/* Top status bar */}
            <div className="flex justify-between items-center px-4 pt-3 pb-2 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                <span className="text-xs font-medium text-white/50">Spieler {currentRound}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] flex items-center gap-1.5">
                <span className="text-[10px] text-white/30">Runde</span>
                <span className="text-xs font-bold text-[#00e3fd]">{currentRound}/{totalRounds}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-[#00e3fd]" />
                <span className={`font-mono text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-[#00e3fd]'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Word Display - rotated 180deg for forehead */}
            <div className="flex-1 flex items-center justify-center px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWord}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                  style={{ transform: 'rotate(180deg)' }}
                >
                  <span className="text-[3rem] sm:text-6xl font-black leading-tight text-white drop-shadow-[0_0_30px_rgba(0,227,253,0.15)]">
                    {currentWord}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Score indicator */}
            <div className="flex justify-center gap-6 pb-2 z-10">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">{correctCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X className="w-4 h-4 text-white/30" />
                <span className="text-sm font-bold text-white/30">{skippedCount}</span>
              </div>
            </div>

            {/* Desktop fallback buttons */}
            <div className="flex gap-3 px-4 pb-4 z-10">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => advanceWord(false)}
                className="flex-1 py-3.5 rounded-full bg-[#1f1f29] border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Überspringen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => advanceWord(true)}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Check className="w-4 h-4" />
                Richtig!
              </motion.button>
            </div>

            {/* Timer bar */}
            <div className="h-1 bg-white/[0.04]">
              <motion.div
                className={`h-full transition-colors ${
                  timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-[#00e3fd] to-[#00b4d8]'
                }`}
                style={{ width: `${percentLeft}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* ── ROUND RESULT SCREEN ───────────────────────────────────── */}
        {screen === 'roundResult' && (
          <motion.div
            key="roundResult"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="p-4 pb-8 max-w-lg mx-auto min-h-[100dvh] flex flex-col"
          >
            <div className="text-center pt-8 mb-6">
              <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white mb-1">
                Runde {currentRound} vorbei!
              </h2>
              <p className="text-white/40 text-sm">
                {selectedCategory?.emoji} {selectedCategory?.name}
              </p>
            </div>

            {/* Stats cards with colored borders */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#00e3fd] text-center">
                <div className="text-3xl font-black text-[#00e3fd]">{correctCount}</div>
                <div className="text-xs text-white/40 mt-1">Richtig</div>
              </div>
              <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#ff7350] text-center">
                <div className="text-3xl font-black text-[#ff7350]">{skippedCount}</div>
                <div className="text-xs text-white/40 mt-1">Übersprungen</div>
              </div>
            </div>

            {/* Word list */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {roundWords.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-[1rem] ${
                    w.correct
                      ? 'bg-emerald-500/[0.08] border border-emerald-500/10'
                      : 'bg-white/[0.03] border border-white/[0.04]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      w.correct ? 'bg-emerald-500/15' : 'bg-white/[0.06]'
                    }`}
                  >
                    {w.correct ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-white/20" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${w.correct ? 'text-white/90' : 'text-white/30'}`}>
                    {w.word}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Next button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNextRound}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#00e3fd] to-[#00b4d8] text-[#0d0d15] text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide shadow-[0_0_30px_rgba(0,227,253,0.2)] flex items-center justify-center gap-2"
            >
              {currentRound >= totalRounds ? (
                <>
                  <Trophy className="w-5 h-5" />
                  Ergebnisse
                </>
              ) : (
                <>
                  Nächster Spieler
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* ── GAME OVER SCREEN ──────────────────────────────────────── */}
        {screen === 'gameOver' && (
          <motion.div
            key="gameOver"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="p-4 pb-8 max-w-lg mx-auto min-h-[100dvh] flex flex-col"
          >
            {/* Celebration header */}
            <div className="text-center pt-8 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Spiel vorbei!
              </h2>
            </div>

            {/* Stats cards */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#00e3fd] text-center">
                <div className="text-3xl font-black text-[#00e3fd]">{totalCorrect}</div>
                <div className="text-xs text-white/40 mt-1">Gesamt richtig</div>
              </div>
              <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#cf96ff] text-center">
                <div className="text-3xl font-black text-[#cf96ff]">{finalRounds.length}</div>
                <div className="text-xs text-white/40 mt-1">Runden</div>
              </div>
              <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#ff7350] text-center">
                <div className="text-3xl font-black text-[#ff7350]">
                  {bestRound?.correct ?? 0}
                </div>
                <div className="text-xs text-white/40 mt-1">Beste Runde</div>
              </div>
            </div>

            {/* Leaderboard */}
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 px-1">
              Ergebnisse pro Runde
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {finalRounds.map((round, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-3 p-3.5 rounded-[1rem] bg-[#1f1f29] border ${
                    i === 0 ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]' : 'border-white/[0.06]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      i === 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : i === 1
                        ? 'bg-white/[0.08] text-white/50'
                        : 'bg-white/[0.04] text-white/30'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate text-white/90">{round.playerName}</div>
                    <div className="text-xs text-white/30">
                      {round.words.length} Begriffe
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">{round.correct}</span>
                    <span className="text-white/10">|</span>
                    <span className="text-white/25 text-sm">{round.skipped}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRestart}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#00e3fd] to-[#00b4d8] text-[#0d0d15] text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide shadow-[0_0_30px_rgba(0,227,253,0.2)] flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Nochmal
              </motion.button>
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
              >
                Anderes Spiel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
