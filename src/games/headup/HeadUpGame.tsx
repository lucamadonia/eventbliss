import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCcw, ChevronRight, Trophy, Check, X, Play, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { getHeadUpCategories, type HeadUpCategory } from '../content/headup-words';
import { useGameTimer } from '../engine/TimerSystem';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

// ── Types ──────────────────────────────────────────────────────────────────────

type GameScreen = 'setup' | 'ready' | 'playing' | 'roundResult' | 'gameOver';
interface WordResult { word: string; correct: boolean }
interface RoundScore { playerName: string; correct: number; skipped: number; words: WordResult[] }

// ── Neon Pulse Styles ──────────────────────────────────────────────────────────

const PULSE_CSS = `
.neon-glow{text-shadow:0 0 20px rgba(223,142,255,.6),0 0 40px rgba(223,142,255,.4),0 0 80px rgba(223,142,255,.2)}
.glass-card{background:rgba(32,38,47,.4);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.pulse-bg{background:radial-gradient(circle at 50% 50%,rgba(223,142,255,.15) 0%,rgba(10,14,20,1) 70%)}
.neon-btn{background:linear-gradient(135deg,#df8eff,#d779ff);box-shadow:0 0 30px rgba(223,142,255,.4),0 0 60px rgba(223,142,255,.15)}
.neon-btn:disabled{background:#1b2028;box-shadow:none}
.tilt-text-left{writing-mode:vertical-rl;transform:rotate(180deg)}
.tilt-text-right{writing-mode:vertical-rl}
`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

function triggerHaptic(style: 'light' | 'medium' | 'heavy') {
  if (Capacitor.isNativePlatform()) { Haptics.impact({ style: style as never }).catch(() => {}); }
  else if ('vibrate' in navigator) { navigator.vibrate(style === 'light' ? 50 : style === 'medium' ? 100 : 200); }
}

// ── Timer Circle SVG ───────────────────────────────────────────────────────────

function TimerCircle({ timeLeft, percent, warn }: { timeLeft: number; percent: number; warn: boolean }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1b2028" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={warn ? '#ff6e84' : '#df8eff'} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-mono text-sm font-bold ${warn ? 'text-[#ff6e84]' : 'text-[#df8eff]'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HeadUpGame({ online }: { online?: OnlineGameProps }) {
  const [screen, setScreen] = useState<GameScreen>('setup');
  const [selectedCategory, setSelectedCategory] = useState<HeadUpCategory | null>(null);
  const [timerDuration, setTimerDuration] = useState(60);
  const [playerNames, setPlayerNames] = useState<string[]>(['Spieler 1', 'Spieler 2']);
  const [newPlayerName, setNewPlayerName] = useState('');
  const totalRounds = playerNames.length;
  const [currentRound, setCurrentRound] = useState(1);
  const [wordQueue, setWordQueue] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
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

  const handleStartRound = useCallback(() => {
    if (!selectedCategory) return;
    setWordQueue(shuffleArray(selectedCategory.words));
    setCurrentWordIndex(0);
    setRoundWords([]);
    setScreen('ready');
    setCountdown(3);
  }, [selectedCategory]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null); setScreen('playing'); resetTimer(timerDuration); startTimer();
      setTimeout(() => { orientationActiveRef.current = true; }, 500);
      if (online?.isHost) {
        online.broadcast('tv-state', {
          game: 'headup', phase: 'playing',
          word: wordQueue[0] || '',
          currentPlayer: playerNames[currentRound - 1] || `Spieler ${currentRound}`,
          correct: 0, skipped: 0, timeLeft: timerDuration,
          round: currentRound, totalRounds,
          category: selectedCategory?.name || '',
        });
      }
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, timerDuration, resetTimer, startTimer]);

  const currentWord = wordQueue[currentWordIndex] ?? '';
  const correctCount = roundWords.filter((w) => w.correct).length;
  const skippedCount = roundWords.filter((w) => !w.correct).length;

  const advanceWord = useCallback((correct: boolean) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    const newCorrect = correctCount + (correct ? 1 : 0);
    const newSkipped = skippedCount + (correct ? 0 : 1);
    setRoundWords((prev) => [...prev, { word: currentWord, correct }]);
    setFlash(correct ? 'green' : 'red');
    triggerHaptic(correct ? 'medium' : 'light');
    setTimeout(() => setFlash(null), 300);
    setCurrentWordIndex((prev) => {
      const next = prev + 1;
      const nextWord = wordQueue[next] ?? wordQueue[0] ?? '';
      if (online?.isHost) {
        online.broadcast('tv-state', {
          game: 'headup', phase: 'playing',
          word: nextWord,
          currentPlayer: playerNames[currentRound - 1] || `Spieler ${currentRound}`,
          correct: newCorrect, skipped: newSkipped,
          timeLeft, round: currentRound, totalRounds,
          category: selectedCategory?.name || '',
        });
      }
      if (next >= wordQueue.length) { setWordQueue((q) => shuffleArray(q)); return 0; }
      return next;
    });
    setTimeout(() => { cooldownRef.current = false; }, 300);
  }, [currentWord, wordQueue.length, online, correctCount, skippedCount, timeLeft, currentRound, totalRounds, playerNames, selectedCategory, wordQueue]);

  // ── Device Orientation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing') return;
    const handle = (e: DeviceOrientationEvent) => {
      if (!orientationActiveRef.current) return;
      const beta = e.beta ?? 0;
      if (beta > 30) advanceWord(true);
      if (beta < -30) advanceWord(false);
    };
    const init = async () => {
      try {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOE.requestPermission === 'function') {
          try { if ((await DOE.requestPermission()) !== 'granted') return; } catch { return; }
        }
        window.addEventListener('deviceorientation', handle);
      } catch {
        // Gyroscope unavailable — user can still use manual buttons
      }
    };
    init();
    return () => { window.removeEventListener('deviceorientation', handle); };
  }, [screen, advanceWord]);

  const handleNextRound = useCallback(() => {
    const name = playerNames[currentRound - 1] || `Spieler ${currentRound}`;
    setAllRounds((prev) => [...prev, { playerName: name, correct: correctCount, skipped: skippedCount, words: [...roundWords] }]);
    if (currentRound >= totalRounds) setScreen('gameOver');
    else { setCurrentRound((r) => r + 1); handleStartRound(); }
  }, [currentRound, totalRounds, playerNames, roundWords, correctCount, skippedCount, handleStartRound]);

  useEffect(() => {
    if (screen === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      recordEnd('headup', totalCorrect, true);
    }
    if (screen === 'setup') gameRecordedRef.current = false;
  }, [screen]);

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      screen, currentWord, currentRound, totalRounds, correctCount, skippedCount,
      timeLeft, playerName: playerNames[currentRound - 1] || `Spieler ${currentRound}`,
    });
  }, [screen, currentWord, currentRound, correctCount, skippedCount, timeLeft, online]);

  /* ---- Online: non-host syncs state (sees word to shout) ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.screen) setScreen(data.screen as GameScreen);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
    });
  }, [online]);

  const handleRestart = useCallback(() => {
    setScreen('setup'); setSelectedCategory(null); setCurrentRound(1); setAllRounds([]); setRoundWords([]);
    orientationActiveRef.current = false;
  }, []);

  const finalRounds = screen === 'gameOver'
    ? [...allRounds, { playerName: `Spieler ${currentRound}`, correct: correctCount, skipped: skippedCount, words: [...roundWords] }]
    : allRounds;
  const totalCorrect = finalRounds.reduce((s, r) => s + r.correct, 0);
  const bestRound = finalRounds.reduce((b, r) => (r.correct > b.correct ? r : b), finalRounds[0] ?? { playerName: '', correct: 0, skipped: 0, words: [] });

  const featured = getHeadUpCategories()[0];
  const gridCats = getHeadUpCategories().slice(1);

  return (
    <div className="min-h-[100dvh] bg-[#0a0e14] text-[#f1f3fc] overflow-hidden relative">
      <style>{PULSE_CSS}</style>
      <AnimatePresence mode="wait">

        {/* ── SETUP ─────────────────────────────────────────────────── */}
        {screen === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 pb-36 max-w-lg mx-auto">
            <div className="text-center mb-8 pt-6">
              <h1 className="text-4xl font-extrabold tracking-tighter text-[#f1f3fc]">Stirnraten</h1>
              <span className="inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ff6b98]/15 text-[#ff6b98] border border-[#ff6b98]/20">Party Game</span>
            </div>

            {/* Featured Category */}
            {featured && (
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setSelectedCategory(featured); handleStartRound(); }}
                className={`relative w-full rounded-2xl overflow-hidden mb-6 text-left ${selectedCategory?.id === featured.id ? 'ring-2 ring-[#df8eff]' : ''}`}>
                <div className="h-44 bg-gradient-to-br from-[#df8eff]/20 via-[#1b2028] to-[#ff6b98]/10 flex items-center justify-center">
                  <span className="text-7xl">{featured.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#df8eff]/20 text-[#df8eff]">Featured</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#8ff5ff]/15 text-[#8ff5ff]">Top Pick</span>
                  </div>
                  <h3 className="text-4xl font-black italic text-[#f1f3fc] tracking-tight">{featured.name}</h3>
                  <p className="text-[#a8abb3] text-sm mt-1">{featured.words.length} Begriffe</p>
                </div>
                <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full neon-btn flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </motion.button>
            )}

            {/* Category Grid */}
            <h2 className="text-xs font-semibold text-[#a8abb3] uppercase tracking-widest mb-3 px-1">Kategorien</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {gridCats.map((cat) => (
                <motion.button key={cat.id} whileTap={{ scale: 0.97 }} onClick={() => setSelectedCategory(cat)}
                  className={`relative bg-[#1b2028] rounded-xl p-4 h-32 text-left transition-all border ${
                    selectedCategory?.id === cat.id ? 'border-[#df8eff]/60 shadow-[0_0_20px_rgba(223,142,255,.15)]' : 'border-[#20262f] hover:border-[#df8eff]/20'
                  }`}>
                  <span className="text-3xl block mb-2">{cat.emoji}</span>
                  <span className="text-sm font-bold text-[#f1f3fc]">{cat.name}</span>
                  <span className="text-xs text-[#a8abb3] block mt-0.5">{cat.words.length} Begriffe</span>
                  {selectedCategory?.id === cat.id && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#df8eff] to-transparent rounded-t-xl" />}
                </motion.button>
              ))}
            </div>

            {/* Settings */}
            <div className="glass-card rounded-2xl p-5 border border-[#20262f] mb-6">
              <h3 className="text-xs font-semibold text-[#a8abb3] uppercase tracking-widest mb-4">Einstellungen</h3>
              <div className="mb-4">
                <label className="text-xs text-[#a8abb3] mb-2 block">Zeit: <span className="text-[#df8eff] font-bold">{timerDuration}s</span></label>
                <input type="range" min={15} max={120} step={5} value={timerDuration} onChange={(e) => setTimerDuration(+e.target.value)}
                  className="w-full h-1 rounded-full appearance-none bg-[#1b2028] accent-[#df8eff]" />
              </div>
              <div>
                <label className="text-xs text-[#a8abb3] mb-2 block">Spieler ({playerNames.length})</label>
                <div className="space-y-2 mb-3">
                  {playerNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#df8eff] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">{i + 1}</div>
                      <input type="text" value={name} maxLength={15}
                        onChange={(e) => { const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n); }}
                        className="flex-1 bg-[#151a21] border border-[#20262f] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#a8abb3]/40 focus:outline-none focus:border-[#df8eff]/40" />
                      {playerNames.length > 2 && (
                        <button onClick={() => setPlayerNames(playerNames.filter((_, j) => j !== i))}
                          className="w-7 h-7 rounded-full bg-[#ff6e84]/10 flex items-center justify-center text-[#ff6e84] text-xs">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {playerNames.length < 12 && (
                  <div className="flex items-center gap-2">
                    <input type="text" value={newPlayerName} maxLength={15} placeholder="Name hinzufuegen..."
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newPlayerName.trim()) { setPlayerNames([...playerNames, newPlayerName.trim()]); setNewPlayerName(''); } }}
                      className="flex-1 bg-[#151a21] border border-dashed border-[#df8eff]/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#a8abb3]/30 focus:outline-none focus:border-[#df8eff]/40" />
                    <button onClick={() => { if (newPlayerName.trim()) { setPlayerNames([...playerNames, newPlayerName.trim()]); setNewPlayerName(''); } }}
                      className="px-3 py-1.5 rounded-lg bg-[#df8eff]/10 text-[#df8eff] text-xs font-bold">+</button>
                  </div>
                )}
              </div>
            </div>

            {/* Start Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
              <div className="max-w-lg mx-auto text-center">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleStartRound} disabled={!selectedCategory}
                  className={`w-full py-4 rounded-full text-base font-extrabold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                    selectedCategory ? 'neon-btn text-white' : 'bg-[#1b2028] text-[#a8abb3]/40 cursor-not-allowed'
                  }`}>
                  <Play className="w-5 h-5" /> Spiel starten
                </motion.button>
                <p className="text-[10px] text-[#a8abb3] mt-2 uppercase tracking-widest">Smartphone an die Stirn halten</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── READY ─────────────────────────────────────────────────── */}
        {screen === 'ready' && (
          <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center min-h-[100dvh] p-8 pulse-bg">
            {/* Current player name */}
            <div className="mb-4 px-4 py-2 rounded-full bg-[#df8eff]/15 border border-[#df8eff]/25">
              <span className="text-sm font-bold text-[#df8eff]">{playerNames[currentRound - 1] || `Spieler ${currentRound}`}</span>
              <span className="text-xs text-[#a8abb3] ml-2">ist dran</span>
            </div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="mb-8">
              <div className="w-24 h-40 rounded-2xl border-2 border-[#df8eff]/40 bg-[#151a21]/80 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(223,142,255,.15)]">
                <Smartphone className="w-12 h-12 text-[#df8eff]" />
              </div>
            </motion.div>
            <p className="text-xl font-extrabold text-center mb-2">Halte das Handy an deine Stirn</p>
            <p className="text-[#a8abb3] text-center text-sm mb-8 max-w-xs">Kippe vorwaerts fuer richtig, rueckwaerts zum Ueberspringen</p>
            {countdown !== null && (
              <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                className="text-7xl font-black text-[#df8eff] neon-glow">{countdown === 0 ? 'LOS!' : countdown}</motion.div>
            )}
            <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-[#20262f]">
              <span className="text-xs text-[#a8abb3]">Runde {currentRound}/{totalRounds}</span>
              <span className="text-[#20262f]">|</span>
              <span className="text-xs text-[#a8abb3]">{selectedCategory?.emoji} {selectedCategory?.name}</span>
            </div>
          </motion.div>
        )}

        {/* ── PLAYING ───────────────────────────────────────────────── */}
        {screen === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col min-h-[100dvh] pulse-bg overflow-hidden">
            {/* Ambient blurs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#df8eff]/[0.07] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#ff6b98]/[0.05] rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence>
              {flash && (
                <motion.div key={flash} initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className={`absolute inset-0 z-30 pointer-events-none ${flash === 'green' ? 'bg-[#8ff5ff]/30' : 'bg-[#ff6e84]/30'}`} />
              )}
            </AnimatePresence>

            {/* Timer top-right */}
            <div className="flex justify-between items-center px-4 pt-3 pb-1 z-10">
              <div className="px-3 py-1 rounded-full glass-card border border-[#20262f] flex items-center gap-1.5">
                <span className="text-[10px] text-[#a8abb3]">Runde</span>
                <span className="text-xs font-bold text-[#df8eff]">{currentRound}/{totalRounds}</span>
              </div>
              <TimerCircle timeLeft={timeLeft} percent={percentLeft} warn={timeLeft <= 10} />
            </div>

            {/* Tilt indicators + word */}
            <div className="flex-1 flex relative">
              {/* Left tilt indicator */}
              <div className="absolute left-0 inset-y-0 w-16 flex flex-col items-center justify-center bg-gradient-to-r from-[#ff6e84]/10 to-transparent pointer-events-none">
                <ChevronUp className="w-5 h-5 text-[#ff6e84]/50 mb-2" />
                <span className="tilt-text-left text-[10px] font-bold uppercase tracking-widest text-[#ff6e84]/40">Skip</span>
              </div>
              {/* Right tilt indicator */}
              <div className="absolute right-0 inset-y-0 w-16 flex flex-col items-center justify-center bg-gradient-to-l from-[#8ff5ff]/10 to-transparent pointer-events-none">
                <ChevronDown className="w-5 h-5 text-[#8ff5ff]/50 mb-2" />
                <span className="tilt-text-right text-[10px] font-bold uppercase tracking-widest text-[#8ff5ff]/40">Richtig</span>
              </div>

              {/* Active word */}
              <div className="flex-1 flex items-center justify-center px-20">
                <AnimatePresence mode="wait">
                  <motion.div key={currentWord} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="text-center" style={{ transform: 'rotate(180deg)' }}>
                    <span className="block text-[10px] uppercase tracking-[0.3em] text-[#8ff5ff]/60 mb-2 font-semibold">Aktuelles Wort</span>
                    <span className="text-5xl md:text-8xl font-black tracking-tighter italic text-[#df8eff] neon-glow leading-none">{currentWord}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Score pill */}
            <div className="flex justify-center pb-3 z-10">
              <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full glass-card border border-[#20262f]">
                <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#8ff5ff]" /><span className="text-sm font-bold text-[#8ff5ff]">{correctCount}</span><span className="text-[10px] text-[#a8abb3]">Richtig</span></div>
                <div className="w-px h-4 bg-[#20262f]" />
                <div className="flex items-center gap-1.5"><X className="w-4 h-4 text-[#ff6e84]" /><span className="text-sm font-bold text-[#ff6e84]">{skippedCount}</span><span className="text-[10px] text-[#a8abb3]">Skip</span></div>
              </div>
            </div>

            {/* Desktop fallback */}
            <div className="flex gap-3 px-4 pb-4 z-10">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => advanceWord(false)}
                className="flex-1 py-3.5 rounded-full bg-[#1b2028] border border-[#ff6e84]/20 text-[#ff6e84] font-semibold text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Skip
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => advanceWord(true)}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#8ff5ff] to-[#00eefc] text-[#0a0e14] font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(143,245,255,.2)]">
                <Check className="w-4 h-4" /> Richtig!
              </motion.button>
            </div>

            {/* Forehead hint (mobile) */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-2 border-dashed border-[#df8eff]/10 rounded-3xl pointer-events-none h-48 md:hidden" />
          </motion.div>
        )}

        {/* ── ROUND RESULT ──────────────────────────────────────────── */}
        {screen === 'roundResult' && (
          <motion.div key="roundResult" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="p-4 pb-8 max-w-lg mx-auto min-h-[100dvh] flex flex-col">
            <div className="text-center pt-8 mb-6">
              <h2 className="text-2xl font-extrabold text-[#f1f3fc] mb-1">Runde {currentRound} vorbei!</h2>
              <p className="text-[#a8abb3] text-sm">{selectedCategory?.emoji} {selectedCategory?.name}</p>
            </div>
            <div className="flex gap-3 mb-6">
              <div className="flex-1 p-4 rounded-2xl bg-[#151a21] border-l-4 border-[#8ff5ff] text-center">
                <div className="text-3xl font-black text-[#8ff5ff] neon-glow">{correctCount}</div>
                <div className="text-xs text-[#a8abb3] mt-1">Richtig</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-[#151a21] border-l-4 border-[#ff6e84] text-center">
                <div className="text-3xl font-black text-[#ff6e84]">{skippedCount}</div>
                <div className="text-xs text-[#a8abb3] mt-1">Uebersprungen</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {roundWords.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${w.correct ? 'bg-[#8ff5ff]/[0.06] border border-[#8ff5ff]/10' : 'bg-[#151a21] border border-[#20262f]'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${w.correct ? 'bg-[#8ff5ff]/15' : 'bg-[#1b2028]'}`}>
                    {w.correct ? <Check className="w-4 h-4 text-[#8ff5ff]" /> : <X className="w-4 h-4 text-[#ff6e84]/40" />}
                  </div>
                  <span className={`text-sm font-medium ${w.correct ? 'text-[#f1f3fc]' : 'text-[#a8abb3]/50 line-through'}`}>{w.word}</span>
                </motion.div>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleNextRound}
              className="w-full py-4 rounded-full neon-btn text-white text-base font-extrabold uppercase tracking-wide flex items-center justify-center gap-2">
              {currentRound >= totalRounds ? <><Trophy className="w-5 h-5" /> Ergebnisse</> : <>Naechster Spieler <ChevronRight className="w-5 h-5" /></>}
            </motion.button>
          </motion.div>
        )}

        {/* ── GAME OVER ─────────────────────────────────────────────── */}
        {screen === 'gameOver' && (
          <motion.div key="gameOver" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="p-4 pb-8 max-w-lg mx-auto min-h-[100dvh] flex flex-col pulse-bg">
            <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
            <div className="text-center pt-8 mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#df8eff]/10 border border-[#df8eff]/30 mb-4 shadow-[0_0_40px_rgba(223,142,255,.2)]">
                  <Trophy className="w-10 h-10 text-[#df8eff]" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-extrabold neon-glow text-[#df8eff]">Spiel vorbei!</h2>
              <p className="text-6xl font-black text-[#f1f3fc] mt-2 neon-glow">{totalCorrect}</p>
              <p className="text-[#a8abb3] text-sm mt-1">Woerter erraten</p>
            </div>
            <div className="flex gap-3 mb-6">
              <div className="flex-1 p-4 rounded-2xl glass-card border border-[#20262f] text-center">
                <div className="text-2xl font-black text-[#8ff5ff]">{totalCorrect}</div>
                <div className="text-[10px] text-[#a8abb3] mt-1 uppercase tracking-wider">Gesamt</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl glass-card border border-[#20262f] text-center">
                <div className="text-2xl font-black text-[#df8eff]">{finalRounds.length}</div>
                <div className="text-[10px] text-[#a8abb3] mt-1 uppercase tracking-wider">Runden</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl glass-card border border-[#20262f] text-center">
                <div className="text-2xl font-black text-[#ff6b98]">{bestRound?.correct ?? 0}</div>
                <div className="text-[10px] text-[#a8abb3] mt-1 uppercase tracking-wider">Beste</div>
              </div>
            </div>
            <h3 className="text-xs font-semibold text-[#a8abb3] uppercase tracking-widest mb-3 px-1">Ergebnisse pro Runde</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {finalRounds.map((round, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl glass-card border ${i === 0 ? 'border-[#df8eff]/30 shadow-[0_0_15px_rgba(223,142,255,.08)]' : 'border-[#20262f]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-[#df8eff]/20 text-[#df8eff]' : i === 1 ? 'bg-[#ff6b98]/15 text-[#ff6b98]' : 'bg-[#1b2028] text-[#a8abb3]'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate text-[#f1f3fc]">{round.playerName}</div>
                    <div className="text-xs text-[#a8abb3]">{round.words.length} Begriffe</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[#8ff5ff] font-bold text-sm">{round.correct}</span>
                    <span className="text-[#20262f]">|</span>
                    <span className="text-[#ff6e84]/60 text-sm">{round.skipped}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="space-y-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleRestart}
                className="w-full py-4 rounded-full neon-btn text-white text-base font-extrabold uppercase tracking-wide flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Nochmal
              </motion.button>
              <button onClick={handleRestart}
                className="w-full py-3.5 rounded-full border border-[#df8eff]/20 text-[#df8eff]/70 text-sm font-semibold hover:bg-[#df8eff]/5 transition-colors">
                Zurueck
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
