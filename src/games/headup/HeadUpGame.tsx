import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCcw, ChevronRight, Trophy, Timer, Check, X } from 'lucide-react';
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
  // Game state
  const [screen, setScreen] = useState<GameScreen>('setup');
  const [selectedCategory, setSelectedCategory] = useState<HeadUpCategory | null>(null);
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);

  // Word queue
  const [wordQueue, setWordQueue] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Results
  const [roundWords, setRoundWords] = useState<WordResult[]>([]);
  const [allRounds, setAllRounds] = useState<RoundScore[]>([]);

  // Flash feedback
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);

  // Countdown before playing
  const [countdown, setCountdown] = useState<number | null>(null);

  // Debounce ref to prevent double-triggers
  const cooldownRef = useRef(false);
  const orientationActiveRef = useRef(false);

  // Timer
  const handleTimerExpire = useCallback(() => {
    orientationActiveRef.current = false;
    triggerHaptic('heavy');
    setScreen('roundResult');
  }, []);

  const { timeLeft, isRunning, start: startTimer, reset: resetTimer, percentLeft } =
    useGameTimer(timerDuration, handleTimerExpire);

  // ── Setup Screen Handlers ────────────────────────────────────────────────────

  const handleStartRound = useCallback(() => {
    if (!selectedCategory) return;

    const words = shuffleArray(selectedCategory.words);
    setWordQueue(words);
    setCurrentWordIndex(0);
    setRoundWords([]);
    setScreen('ready');

    // 3-2-1 countdown
    setCountdown(3);
  }, [selectedCategory]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setScreen('playing');
      resetTimer(timerDuration);
      startTimer();
      // Small delay before activating orientation to prevent accidental triggers
      setTimeout(() => {
        orientationActiveRef.current = true;
      }, 500);
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

      // Flash feedback
      setFlash(correct ? 'green' : 'red');
      triggerHaptic(correct ? 'medium' : 'light');
      setTimeout(() => setFlash(null), 300);

      // Next word or recycle
      setCurrentWordIndex((prev) => {
        const next = prev + 1;
        if (next >= wordQueue.length) {
          // Reshuffle and restart
          setWordQueue((q) => shuffleArray(q));
          return 0;
        }
        return next;
      });

      // 300ms cooldown to prevent double triggers
      setTimeout(() => {
        cooldownRef.current = false;
      }, 300);
    },
    [currentWord, wordQueue.length]
  );

  // ── Device Orientation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'playing') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!orientationActiveRef.current) return;
      const beta = e.beta ?? 0;
      if (beta > 30) advanceWord(true);   // tilted forward = correct
      if (beta < -30) advanceWord(false);  // tilted backward = skip
    };

    // iOS 13+ requires permission
    const requestAndListen = async () => {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE.requestPermission === 'function') {
        try {
          const perm = await DOE.requestPermission();
          if (perm !== 'granted') return;
        } catch {
          // Permission denied, fallback to buttons
          return;
        }
      }
      window.addEventListener('deviceorientation', handleOrientation);
    };

    requestAndListen();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-white overflow-hidden relative">
      <AnimatePresence mode="wait">
        {/* ── SETUP SCREEN ──────────────────────────────────────────── */}
        {screen === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 pb-8 max-w-lg mx-auto"
          >
            <div className="text-center mb-6 pt-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Stirnraten
              </h1>
              <p className="text-cyan-300/70 text-sm mt-1">
                Halte das Handy an die Stirn - deine Freunde beschreiben!
              </p>
            </div>

            {/* Category Grid */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-cyan-300/80 uppercase tracking-wider mb-3">
                Kategorie wählen
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {HEADUP_CATEGORIES_DE.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative p-4 rounded-2xl border text-left transition-all duration-200
                      backdrop-blur-md bg-white/5
                      ${selectedCategory?.id === cat.id
                        ? 'border-cyan-400 bg-cyan-400/15 shadow-lg shadow-cyan-400/20 scale-[1.02]'
                        : 'border-white/10 hover:border-white/25 hover:bg-white/10'
                      }`}
                  >
                    <span className="text-2xl block mb-1">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-white/40 block">
                      {cat.words.length} Begriffe
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Selection */}
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-cyan-300/80 uppercase tracking-wider mb-3">
                Zeit pro Runde
              </h2>
              <div className="flex gap-2">
                {[30, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTimerDuration(sec)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${timerDuration === sec
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds Selection */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-cyan-300/80 uppercase tracking-wider mb-3">
                Anzahl Runden
              </h2>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${totalRounds === r
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartRound}
              disabled={!selectedCategory}
              className={`w-full py-4 rounded-2xl text-lg font-bold transition-all
                ${selectedCategory
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30 active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              Spiel starten
            </button>
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
              <div className="w-24 h-40 rounded-2xl border-2 border-cyan-400/60 bg-cyan-400/10 flex items-center justify-center backdrop-blur-md">
                <Smartphone className="w-12 h-12 text-cyan-400" />
              </div>
            </motion.div>

            <p className="text-xl font-semibold text-center mb-2">
              Halte das Handy an deine Stirn
            </p>
            <p className="text-cyan-300/60 text-center text-sm mb-8 max-w-xs">
              Deine Freunde beschreiben den Begriff - kippe vorwärts für richtig, rückwärts zum Überspringen
            </p>

            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-7xl font-black text-cyan-400"
              >
                {countdown === 0 ? 'LOS!' : countdown}
              </motion.div>
            )}

            <p className="text-sm text-white/40 mt-6">
              Runde {currentRound} von {totalRounds} &middot; {selectedCategory?.emoji} {selectedCategory?.name}
            </p>
          </motion.div>
        )}

        {/* ── PLAYING SCREEN ────────────────────────────────────────── */}
        {screen === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col min-h-[100dvh]"
          >
            {/* Flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key={flash}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 z-30 pointer-events-none ${
                    flash === 'green' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              )}
            </AnimatePresence>

            {/* Score + Round indicator */}
            <div className="flex justify-between items-center px-4 pt-3 pb-1 z-10">
              <div className="text-xs text-white/40">
                Runde {currentRound}/{totalRounds}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="text-xs text-white/40">
                <span className="text-emerald-400 font-bold">{correctCount}</span>
                {' / '}
                <span className="text-red-400/70">{skippedCount}</span>
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
                  <span className="text-[2.5rem] sm:text-5xl font-black leading-tight">
                    {currentWord}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop fallback buttons */}
            <div className="flex gap-3 px-4 pb-4 z-10">
              <button
                onClick={() => advanceWord(false)}
                className="flex-1 py-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm active:scale-95 transition-transform"
              >
                Überspringen
              </button>
              <button
                onClick={() => advanceWord(true)}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-sm active:scale-95 transition-transform"
              >
                Richtig!
              </button>
            </div>

            {/* Timer bar */}
            <div className="h-1.5 bg-white/5">
              <motion.div
                className={`h-full transition-colors ${
                  timeLeft <= 10 ? 'bg-red-500' : 'bg-cyan-400'
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
            <div className="text-center pt-6 mb-6">
              <h2 className="text-2xl font-bold mb-1">Runde {currentRound} vorbei!</h2>
              <p className="text-cyan-300/60 text-sm">
                {selectedCategory?.emoji} {selectedCategory?.name}
              </p>
            </div>

            {/* Score summary */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center backdrop-blur-md">
                <div className="text-3xl font-black text-emerald-400">{correctCount}</div>
                <div className="text-xs text-emerald-300/60 mt-1">Richtig</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-md">
                <div className="text-3xl font-black text-white/40">{skippedCount}</div>
                <div className="text-xs text-white/30 mt-1">Übersprungen</div>
              </div>
            </div>

            {/* Word list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 mb-6">
              {roundWords.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-md ${
                    w.correct
                      ? 'bg-emerald-500/10 border border-emerald-500/15'
                      : 'bg-white/5 border border-white/5'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      w.correct ? 'bg-emerald-500/20' : 'bg-white/10'
                    }`}
                  >
                    {w.correct ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-white/30" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${w.correct ? 'text-white' : 'text-white/40'}`}>
                    {w.word}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={handleNextRound}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-bold shadow-lg shadow-cyan-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
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
            </button>
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
            <div className="text-center pt-6 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3" />
              </motion.div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Spiel vorbei!
              </h2>
            </div>

            {/* Total stats */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center backdrop-blur-md">
                <div className="text-3xl font-black text-cyan-400">{totalCorrect}</div>
                <div className="text-xs text-cyan-300/60 mt-1">Gesamt richtig</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center backdrop-blur-md">
                <div className="text-3xl font-black text-amber-400">
                  {bestRound?.correct ?? 0}
                </div>
                <div className="text-xs text-amber-300/60 mt-1">Beste Runde</div>
              </div>
            </div>

            {/* Leaderboard */}
            <h3 className="text-sm font-semibold text-cyan-300/80 uppercase tracking-wider mb-3">
              Ergebnisse pro Runde
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {finalRounds.map((round, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      i === 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : i === 1
                        ? 'bg-slate-400/20 text-slate-300'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{round.playerName}</div>
                    <div className="text-xs text-white/40">
                      {round.words.length} Begriffe
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">{round.correct}</span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/30 text-sm">{round.skipped}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Restart button */}
            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-bold shadow-lg shadow-cyan-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Nochmal spielen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
