import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Type, ChevronRight, RotateCcw, Trophy, Zap,
  Palette, Ban, Gauge, Crown, Target, Flame,
} from 'lucide-react';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
type GameMode = 'kategorie' | 'stroop' | 'verboten' | 'speed-rush';
type Speed = 'slow' | 'medium' | 'fast';

interface PlayerState {
  name: string;
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  wrong: number;
  missed: number;
}

interface WordItem {
  text: string;
  isTarget: boolean;
  displayColor?: string; // for Stroop mode
}

// ---------------------------------------------------------------------------
// Word Lists
// ---------------------------------------------------------------------------

const ANIMALS = [
  'Hund', 'Katze', 'Elefant', 'Loewe', 'Adler', 'Delfin', 'Tiger',
  'Pinguin', 'Fuchs', 'Hase', 'Baer', 'Pferd', 'Affe', 'Wolf', 'Schlange',
  'Papagei', 'Krokodil', 'Giraffe', 'Wal', 'Frosch',
];

const FOOD = [
  'Pizza', 'Apfel', 'Kuchen', 'Sushi', 'Brot', 'Nudeln', 'Schokolade',
  'Banane', 'Kaese', 'Wurst', 'Salat', 'Eis', 'Suppe', 'Steak', 'Reis',
  'Kartoffel', 'Tomate', 'Brezel', 'Torte', 'Keks',
];

const COLORS_WORDS = ['Rot', 'Blau', 'Gruen', 'Gelb', 'Lila', 'Orange', 'Rosa', 'Weiss', 'Schwarz', 'Braun'];

const COLOR_HEX: Record<string, string> = {
  Rot: '#ef4444', Blau: '#3b82f6', Gruen: '#22c55e', Gelb: '#eab308',
  Lila: '#a855f7', Orange: '#f97316', Rosa: '#ec4899', Weiss: '#f8fafc',
  Schwarz: '#94a3b8', Braun: '#a16207',
};

const RANDOM_WORDS = [
  'Tisch', 'Lampe', 'Auto', 'Fenster', 'Stuhl', 'Buch', 'Telefon',
  'Schuh', 'Brille', 'Tasche', 'Uhr', 'Schluessel', 'Stern', 'Wolke',
  'Berg', 'Fluss', 'Mond', 'Sonne', 'Blume', 'Baum',
];

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

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SPEED_MS: Record<Speed, number> = { slow: 1500, medium: 1000, fast: 600 };

function generateWord(mode: GameMode, forbiddenWord: string, speedLevel: number): WordItem {
  switch (mode) {
    case 'kategorie': {
      const isTarget = Math.random() < 0.4;
      if (isTarget) {
        return { text: randomFrom(ANIMALS), isTarget: true };
      }
      const pool = [...FOOD, ...COLORS_WORDS, ...RANDOM_WORDS];
      return { text: randomFrom(pool), isTarget: false };
    }
    case 'stroop': {
      const word = randomFrom(COLORS_WORDS);
      const isMatch = Math.random() < 0.35;
      const displayColor = isMatch ? COLOR_HEX[word] : COLOR_HEX[randomFrom(COLORS_WORDS.filter(c => c !== word))];
      return { text: word, isTarget: isMatch, displayColor };
    }
    case 'verboten': {
      const allWords = [...ANIMALS, ...FOOD, ...RANDOM_WORDS, ...COLORS_WORDS];
      const word = randomFrom(allWords);
      return { text: word, isTarget: word !== forbiddenWord };
    }
    case 'speed-rush': {
      const isTarget = Math.random() < 0.45;
      if (isTarget) {
        return { text: randomFrom(ANIMALS), isTarget: true };
      }
      const pool = [...FOOD, ...COLORS_WORDS, ...RANDOM_WORDS];
      return { text: randomFrom(pool), isTarget: false };
    }
  }
}

// ---------------------------------------------------------------------------
// Particle Background
// ---------------------------------------------------------------------------

function ParticleBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#df8eff]/15"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

interface SetupProps {
  onStart: (players: PlayerState[], mode: GameMode, speed: Speed, rounds: number) => void;
  onlinePlayerNames?: string[];
}

function SetupScreen({ onStart, onlinePlayerNames = [] }: SetupProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<string[]>(
    onlinePlayerNames.length >= 2 ? onlinePlayerNames : [t('games.wordpress.defaultPlayer1'), t('games.wordpress.defaultPlayer2')]
  );
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [rounds, setRounds] = useState(5);

  const modes: { key: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'kategorie', label: t('gameModes.wordpress.kategorie.name'), desc: t('gameModes.wordpress.kategorie.desc'), icon: <Target className="w-5 h-5" /> },
    { key: 'stroop', label: t('gameModes.wordpress.stroop.name'), desc: t('gameModes.wordpress.stroop.desc'), icon: <Palette className="w-5 h-5" /> },
    { key: 'verboten', label: t('gameModes.wordpress.verboten.name'), desc: t('gameModes.wordpress.verboten.desc'), icon: <Ban className="w-5 h-5" /> },
    { key: 'speed-rush', label: t('gameModes.wordpress.speed-rush.name'), desc: t('gameModes.wordpress.speed-rush.desc'), icon: <Gauge className="w-5 h-5" /> },
  ];

  const canStart = players.length >= 1 && players.every(p => p.trim().length > 0);

  const isOnlineOrParty = onlinePlayerNames.length >= 2;
  const handleImportNames = (imported: string[]) => {
    setPlayers(() => {
      const merged = imported.slice(0, 8);
      while (merged.length < 1) merged.push('');
      return merged;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    const ps: PlayerState[] = players.map(name => ({
      name: name.trim(), score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, missed: 0,
    }));
    onStart(ps, mode, speed, rounds);
  };

  return (
    <motion.div className="min-h-screen bg-[#0a0e14] p-4 flex flex-col items-center relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ParticleBackground />
      <motion.div className="w-full max-w-md space-y-6 py-8 relative z-10"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>

        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
            <Type className="w-16 h-16 mx-auto text-[#df8eff]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">{t('games.wordpress.title')}</h1>
          <p className="text-[#df8eff]/60 text-sm">{t('games.wordpress.tagline')}</p>
        </div>

        {/* Players */}
        <PlayerSetup
          players={players.map((name, i) => ({ id: String(i), name }))}
          onAdd={() => setPlayers([...players, ''])}
          onRemove={(id) => setPlayers(players.filter((_, idx) => idx !== Number(id)))}
          onRename={(id, name) => { const next = [...players]; next[Number(id)] = name; setPlayers(next); }}
          onImportNames={isOnlineOrParty ? undefined : handleImportNames}
          min={1}
          max={8}
          accent="#df8eff"
          label={t('games.wordpress.playerLabel')}
        />

        {/* Mode */}
        <div className="backdrop-blur-md bg-white/5 border border-[#df8eff]/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.modeHeading')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {modes.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  mode === m.key
                    ? 'bg-[#df8eff]/20 border-[#df8eff]/50 text-white'
                    : 'bg-white/5 border-white/10 text-[#f1f3fc]/70 hover:bg-white/10'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {m.icon}
                  <span className="font-medium text-sm">{m.label}</span>
                </div>
                <div className="text-xs text-[#a8abb3]">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed & Rounds */}
        <div className="backdrop-blur-md bg-white/5 border border-[#df8eff]/20 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.settingsHeading')}</h2>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-2">{t('games.wordpress.speedLabel')}</label>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast'] as Speed[]).map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    speed === s
                      ? 'bg-[#df8eff] text-white'
                      : 'bg-white/10 text-[#a8abb3] hover:bg-white/15'
                  }`}>
                  {s === 'slow' ? t('games.wordpress.speedSlow') : s === 'medium' ? t('games.wordpress.speedMedium') : t('games.wordpress.speedFast')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-1">{t('games.wordpress.roundsLabel', { count: rounds })}</label>
            <input type="range" min={3} max={15} step={1} value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-[#20262f] accent-[#df8eff] cursor-pointer" />
          </div>
        </div>

        {/* Start */}
        <motion.button onClick={handleStart} disabled={!canStart}
          aria-label={t('games.wordpress.startAriaLabel')}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canStart
              ? 'bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white shadow-[0_0_20px_rgba(223,142,255,0.3)] hover:shadow-[0_0_30px_rgba(223,142,255,0.4)]'
              : 'bg-[#1b2028] text-[#a8abb3]/50 cursor-not-allowed'
          }`}
          whileHover={canStart ? { scale: 1.02 } : {}}
          whileTap={canStart ? { scale: 0.98 } : {}}>
          <Zap className="w-5 h-5" /> {t('games.setup.startGame')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Playing Screen
// ---------------------------------------------------------------------------

interface PlayingProps {
  players: PlayerState[];
  mode: GameMode;
  speed: Speed;
  round: number;
  totalRounds: number;
  currentPlayerIndex: number;
  onPlayerDone: (updatedPlayer: PlayerState) => void;
  /** Live snapshot hoisted to the controller for the TV broadcast. */
  onLive?: (live: { word: string; wordIndex: number; combo: number; score: number }) => void;
}

const WORDS_PER_TURN = 12;
const FORBIDDEN_WORDS = ['Hund', 'Pizza', 'Blau', 'Lampe', 'Katze', 'Apfel', 'Rot', 'Stern'];

function PlayingScreen({ players, mode, speed, round, totalRounds, currentPlayerIndex, onPlayerDone, onLive }: PlayingProps) {
  const { t } = useTranslation();
  const player = players[currentPlayerIndex];
  const [wordIndex, setWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [score, setScore] = useState(player.score);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(player.maxCombo);
  const [correct, setCorrect] = useState(player.correct);
  const [wrong, setWrong] = useState(player.wrong);
  const [missed, setMissed] = useState(player.missed);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'missed' | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flyAway, setFlyAway] = useState(false);
  const [wordPos, setWordPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tappedRef = useRef(false);
  const forbiddenWord = useRef(randomFrom(FORBIDDEN_WORDS));
  const speedMs = useRef(SPEED_MS[speed]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'kategorie': return t('games.wordpress.promptKategorie');
      case 'stroop': return t('games.wordpress.promptStroop');
      case 'verboten': return t('games.wordpress.promptVerboten', { word: forbiddenWord.current });
      case 'speed-rush': return t('games.wordpress.promptSpeedRush');
    }
  }, [mode, t]);

  const showNextWord = useCallback(() => {
    setWordIndex(prev => {
      const next = prev + 1;
      if (next > WORDS_PER_TURN) {
        return prev; // will be handled by effect
      }
      return next;
    });
  }, []);

  // Generate word when index changes
  useEffect(() => {
    if (wordIndex === 0 || wordIndex > WORDS_PER_TURN) return;

    const word = generateWord(mode, forbiddenWord.current, wordIndex);
    setCurrentWord(word);
    tappedRef.current = false;
    setFlyAway(false);
    setFeedback(null);

    // Random position offset
    const xOff = (Math.random() - 0.5) * 120;
    const yOff = (Math.random() - 0.5) * 60;
    setWordPos({ x: xOff, y: yOff });

    // Speed Rush: decrease time each word
    const currentSpeed = mode === 'speed-rush'
      ? Math.max(300, speedMs.current - wordIndex * 25)
      : speedMs.current;

    timeoutRef.current = setTimeout(() => {
      if (!tappedRef.current) {
        // Time expired without tap
        if (word.isTarget) {
          // Missed a target
          setMissed(p => p + 1);
          setScore(p => p - 3);
          setCombo(0);
          setFeedback('missed');
        }
        feedbackTimeoutRef.current = setTimeout(() => showNextWord(), 300);
      }
    }, currentSpeed);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [wordIndex, mode, showNextWord]);

  // Hoist a live snapshot to the controller so the TV view can show the current
  // word + this player's live combo/score/progress. Only the visible word leaks —
  // never which word is the target/forbidden (that stays a phone-only decision).
  useEffect(() => {
    onLive?.({
      word: wordIndex <= WORDS_PER_TURN ? (currentWord?.text ?? '') : '',
      wordIndex: Math.min(wordIndex, WORDS_PER_TURN),
      combo,
      score,
    });
  }, [currentWord, wordIndex, combo, score, onLive]);

  // Start first word
  useEffect(() => {
    const t = setTimeout(() => setWordIndex(1), 800);
    return () => clearTimeout(t);
  }, []);

  // End turn when all words done
  useEffect(() => {
    if (wordIndex > WORDS_PER_TURN) {
      const t = setTimeout(() => {
        onPlayerDone({
          ...player,
          score,
          combo: 0,
          maxCombo: Math.max(maxCombo, combo),
          correct,
          wrong,
          missed,
        });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [wordIndex, score, combo, maxCombo, correct, wrong, missed, player, onPlayerDone]);

  const handleTap = useCallback(() => {
    if (tappedRef.current || !currentWord || wordIndex > WORDS_PER_TURN) return;
    tappedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (currentWord.isTarget) {
      // Correct tap
      const newCombo = combo + 1;
      const bonus = Math.min(newCombo, 5);
      setScore(p => p + 10 + bonus);
      setCombo(newCombo);
      setMaxCombo(p => Math.max(p, newCombo));
      setCorrect(p => p + 1);
      setFeedback('correct');
      setFlyAway(true);
    } else {
      // Wrong tap
      setScore(p => p - 5);
      setCombo(0);
      setWrong(p => p + 1);
      setFeedback('wrong');
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    }

    feedbackTimeoutRef.current = setTimeout(() => showNextWord(), 350);
  }, [currentWord, combo, wordIndex, showNextWord]);

  const progress = wordIndex / WORDS_PER_TURN;

  return (
    <motion.div
      className="fixed inset-0 bg-[#0a0e14] flex flex-col select-none cursor-pointer z-50"
      onClick={handleTap}
      animate={shakeScreen ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <ParticleBackground />

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-[#1b2028] relative z-10">
        <motion.div className="h-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }} />
      </div>

      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 relative z-10">
        <div className="text-white text-sm">
          <span className="text-[#df8eff]/60">{t('games.play.round')}</span>{' '}
          <span className="font-bold">{round}/{totalRounds}</span>
        </div>
        <div className="text-[#df8eff]/80 text-xs font-medium px-3 py-1 rounded-full bg-[#df8eff]/10 border border-[#df8eff]/20">
          {modeLabel}
        </div>
        <div className="text-white text-sm font-bold">{player.name}</div>
      </div>

      {/* Word Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {currentWord && wordIndex <= WORDS_PER_TURN && (
            <motion.div
              key={`${wordIndex}-${currentWord.text}`}
              className="text-center"
              style={{ x: wordPos.x, y: wordPos.y }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={flyAway
                ? { y: -200, opacity: 0, scale: 0.5 }
                : { scale: 1, opacity: 1 }
              }
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span
                className="text-5xl sm:text-6xl font-black tracking-tight"
                style={{ color: currentWord.displayColor || '#ffffff' }}
              >
                {currentWord.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div className="absolute inset-0 bg-[#df8eff]/10 pointer-events-none"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          )}
          {feedback === 'wrong' && (
            <motion.div className="absolute inset-0 bg-red-500/15 pointer-events-none"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          )}
          {feedback === 'missed' && (
            <motion.div className="absolute inset-0 bg-yellow-500/10 pointer-events-none"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          )}
        </AnimatePresence>

        {/* Word count indicator */}
        {wordIndex > WORDS_PER_TURN && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="text-[#df8eff] text-2xl font-bold">
            {t('games.wordpress.done')}
          </motion.div>
        )}
      </div>

      {/* Bottom HUD */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="text-center">
          <div className="text-[#a8abb3] text-[10px] uppercase tracking-wider">{t('games.play.score')}</div>
          <motion.div className="text-white text-2xl font-bold"
            key={score} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.2 }}>
            {score}
          </motion.div>
        </div>

        {/* Combo */}
        {combo > 0 && (
          <motion.div className="text-center"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            key={`combo-${combo}`}>
            <div className="flex items-center gap-1">
              <Flame className="w-5 h-5 text-orange-400" />
              <motion.span
                className="text-3xl font-black text-orange-400"
                style={{ textShadow: '0 0 20px rgba(251,146,60,0.5)' }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.25 }}>
                {combo}x
              </motion.span>
            </div>
            <div className="text-orange-400/60 text-[10px] uppercase tracking-wider">{t('games.wordpress.comboLabel')}</div>
          </motion.div>
        )}

        <div className="text-center">
          <div className="text-[#a8abb3] text-[10px] uppercase tracking-wider">{t('games.wordpress.wordLabel')}</div>
          <div className="text-white text-lg font-bold">
            {Math.min(wordIndex, WORDS_PER_TURN)}/{WORDS_PER_TURN}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Round End Screen
// ---------------------------------------------------------------------------

interface RoundEndProps {
  players: PlayerState[];
  round: number;
  totalRounds: number;
  onNextRound: () => void;
}

function RoundEndScreen({ players, round, totalRounds, onNextRound }: RoundEndProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div className="min-h-screen bg-[#0a0e14] p-4 flex flex-col items-center justify-center relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ParticleBackground />
      <motion.div className="w-full max-w-md space-y-6 relative z-10"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{t('games.wordpress.roundHeading', { round, total: totalRounds })}</h2>
          <p className="text-[#df8eff]/60 text-sm mt-1">{t('games.wordpress.interimStandings')}</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-[#df8eff]/20 rounded-2xl p-5 space-y-3">
          {sorted.map((p, i) => {
            const total = p.correct + p.wrong + p.missed;
            const accuracy = total > 0 ? Math.round((p.correct / total) * 100) : 0;
            return (
              <motion.div key={p.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}>
                <span className="text-lg font-bold text-[#df8eff] w-8">{i === 0 ? <Crown className="w-5 h-5 text-[#df8eff]" /> : `#${i + 1}`}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{p.name}</div>
                  <div className="text-[#a8abb3] text-xs">
                    {t('games.wordpress.accuracyCombo', { accuracy, maxCombo: p.maxCombo })}
                  </div>
                </div>
                <span className="text-[#df8eff] font-bold text-lg">{p.score}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.button onClick={onNextRound}
          className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <ChevronRight className="w-5 h-5" />
          {round < totalRounds ? t('games.wordpress.nextRound') : t('games.wordpress.showResults')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

interface GameOverProps {
  players: PlayerState[];
  onRestart: () => void;
}

function GameOverScreen({ players, onRestart }: GameOverProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div className="min-h-screen bg-[#0a0e14] p-4 flex flex-col items-center justify-center relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ParticleBackground />

      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {Array.from({ length: 24 }, (_, i) => (
          <motion.div key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: ['#df8eff', '#d779ff', '#8ff5ff', '#ff6b98', '#00deec', '#df8eff'][i % 6],
              left: `${(i / 24) * 100 + Math.random() * 4}%`,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
              opacity: [1, 1, 0],
              rotate: 360 * (i % 2 === 0 ? 1 : -1),
              x: [0, (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 40)],
            }}
            transition={{ duration: 2.5 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'easeIn' }}
          />
        ))}
      </div>

      <motion.div className="w-full max-w-md space-y-6 relative z-10"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="text-center space-y-2">
          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}>
            <Trophy className="w-16 h-16 mx-auto text-[#df8eff]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">{t('games.wordpress.gameOver')}</h1>
          {sorted.length > 0 && (
            <p className="text-[#df8eff]">
              <Crown className="w-4 h-4 inline mr-1" />
              {t('games.wordpress.winnerAnnounce', { name: sorted[0].name, score: sorted[0].score })}
            </p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="backdrop-blur-md bg-white/5 border border-[#df8eff]/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#df8eff]" /> {t('games.results.leaderboard')}
          </h2>
          {sorted.map((p, i) => {
            const total = p.correct + p.wrong + p.missed;
            const accuracy = total > 0 ? Math.round((p.correct / total) * 100) : 0;
            const medals = ['text-[#df8eff]', 'text-[#f1f3fc]/70', 'text-[#8ff5ff]'];
            return (
              <motion.div key={p.name}
                className={`flex items-center gap-3 p-4 rounded-xl ${i === 0 ? 'bg-[#df8eff]/10 border border-[#df8eff]/30' : 'bg-white/5'}`}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.15 }}>
                <span className={`text-xl font-bold w-8 ${medals[i] || 'text-[#a8abb3]/50'}`}>#{i + 1}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{p.name}</div>
                  <div className="text-[#a8abb3] text-xs flex gap-3">
                    <span>{t('games.wordpress.accuracyPct', { accuracy })}</span>
                    <span>{t('games.wordpress.comboStat', { maxCombo: p.maxCombo })}</span>
                    <span>{t('games.wordpress.correctStat', { count: p.correct })}</span>
                  </div>
                </div>
                <span className="text-[#df8eff] font-bold text-xl">{p.score}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.button onClick={onRestart}
          className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-white flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <RotateCcw className="w-5 h-5" /> {t('games.results.playAgain')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Game Controller
// ---------------------------------------------------------------------------

export default function WordPressGame({ online }: { online?: OnlineGameProps } = {}) {
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyPlayerNames = (useInitialRoster() ?? []).map((p) => p.name);
  const resolvedPlayerNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const [phase, setPhase] = useState<GamePhase>('setup');

  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnQueue, setTurnQueue] = useState<number[]>([]);
  // Live-Snapshot aus PlayingScreen hochgereicht (currentWord/combo/score leben
  // dort als State — ein direkter Verweis hier warf "Can't find variable" und
  // crashte das Spiel). Dient nur der TV-Ansicht.
  const [live, setLive] = useState({ word: '', wordIndex: 0, combo: 0, score: 0 });
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  useTVGameBridge('wordpress', {
    phase, round, currentPlayerIndex, players, totalRounds,
    mode,
    currentWord: live.word,
    wordIndex: live.wordIndex,
    wordsPerTurn: WORDS_PER_TURN,
    liveCombo: live.combo,
    liveScore: live.score,
  }, [phase, round, currentPlayerIndex, mode, live]);

  const handleStart = useCallback((ps: PlayerState[], m: GameMode, s: Speed, r: number) => {
    setPlayers(ps);
    setMode(m);
    setSpeed(s);
    setTotalRounds(r);
    setRound(1);
    setCurrentPlayerIndex(0);
    // Build queue: all players take a turn in round 1
    setTurnQueue(ps.map((_, i) => i).slice(1));
    setPhase('playing');
  }, []);

  const handlePlayerDone = useCallback((updatedPlayer: PlayerState) => {
    setPlayers(prev => prev.map((p, i) => i === currentPlayerIndex ? updatedPlayer : p));

    if (turnQueue.length > 0) {
      // More players in this round
      const [next, ...rest] = turnQueue;
      setCurrentPlayerIndex(next);
      setTurnQueue(rest);
      // Re-enter playing phase to reset PlayingScreen
      setPhase('roundEnd');
      setTimeout(() => setPhase('playing'), 50);
    } else {
      // Round complete
      setPhase('roundEnd');
    }
  }, [currentPlayerIndex, turnQueue]);

  const handleNextRound = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound > totalRounds) {
      setPhase('gameOver');
      return;
    }
    setRound(nextRound);
    setCurrentPlayerIndex(0);
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [round, totalRounds, players]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('drueck-das-wort', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(1);
    setCurrentPlayerIndex(0);
    setTurnQueue([]);
  }, []);

  // Nochmal spielen: KEEP players AND their accumulated scores. We replicate
  // handleStart's gameplay-entry (round 1, rebuilt turn queue) and go straight
  // to 'playing' — never to 'setup'. PlayingScreen seeds its local score from
  // each player's carried-over score, so the new match continues the totals.
  const rematch = useCallback(() => {
    if (players.length === 0) { handleRestart(); return; }
    gameRecordedRef.current = false;
    setRound(1);
    setCurrentPlayerIndex(0);
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [players, handleRestart]);

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, round, totalRounds, currentPlayerIndex,
      players: players.map(p => ({ name: p.name, score: p.score })),
    });
  }, [phase, round, currentPlayerIndex, players, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as GamePhase);
      if (data.round) setRound(data.round as number);
      if (data.currentPlayerIndex !== undefined) setCurrentPlayerIndex(data.currentPlayerIndex as number);
      if (data.players) {
        const incoming = data.players as { name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  return (
    // Fragment, damit der Verlassen-Dialog NEBEN der AnimatePresence liegt und
    // deren mode="wait"-Phasenwechsel nicht als zweites Kind stört.
    <>
    <AnimatePresence mode="wait">
      {phase === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0 }}>
          <SetupScreen onStart={handleStart} onlinePlayerNames={resolvedPlayerNames} />
        </motion.div>
      )}
      {phase === 'playing' && (
        <motion.div key={`playing-${round}-${currentPlayerIndex}`} exit={{ opacity: 0 }}>
          <ActivePlayerBanner
            playerName={players[currentPlayerIndex]?.name ?? '???'}
            hidden={false}
          />
          <PlayingScreen
            players={players}
            mode={mode}
            speed={speed}
            round={round}
            totalRounds={totalRounds}
            currentPlayerIndex={currentPlayerIndex}
            onPlayerDone={handlePlayerDone}
            onLive={setLive}
          />
        </motion.div>
      )}
      {phase === 'roundEnd' && (
        <motion.div key={`roundEnd-${round}`} exit={{ opacity: 0 }}>
          <RoundEndScreen
            players={players}
            round={round}
            totalRounds={totalRounds}
            onNextRound={handleNextRound}
          />
        </motion.div>
      )}
      {phase === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <GameOverScreen players={players} onRestart={rematch} />
        </motion.div>
      )}
    </AnimatePresence>
    <ConfirmExitDialog {...exitGuard.dialogProps} accent="#df8eff" />
    </>
  );
}
