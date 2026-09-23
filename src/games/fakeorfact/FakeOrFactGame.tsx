import { GameStage, StageHeader, StagePanel, StageAction } from '../ui/GameStage';
import './design.css';
import { publicQuizRound, settleQuizRound } from './round-state';
import { useGameTimer } from '../engine/TimerSystem';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, RotateCcw, ArrowRight, Check, X, Shield, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFACTS, getTHREE_STATEMENTS, type Fact, type ThreeStatements } from './fakeorfact-content';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'handoff' | 'setup' | 'statement' | 'voted' | 'reveal' | 'gameOver';
type Mode = 'classic' | 'three';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
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

// ---------------------------------------------------------------------------
// Setup config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: 'Wahr oder Falsch', icon: <Shield className="w-6 h-6" /> },
  { id: 'three', name: 'Zwei Luegen', desc: 'Finde die Wahrheit', icon: <HelpCircle className="w-6 h-6" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FakeOrFactGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));

  const SETUP_SETTINGS: SettingsConfig = {
    timer: { min: 5, max: 30, default: 15, step: 5, label: t('games.fakeorfact.timerLabel') },
    rounds: { min: 5, max: 25, default: 10, step: 1, label: t('games.fakeorfact.roundsLabel') },
  };

  // Setup
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg — die Partie ist
  // dann futsch. Setup und Endstand haben nichts zu verlieren und reichen
  // weiter an den Routen-Handler.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<Mode>('classic');
  const [totalRounds, setTotalRounds] = useState(10);
  const [timerSec, setTimerSec] = useState(15);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // Classic mode
  const [factDeck, setFactDeck] = useState<Fact[]>([]);
  const [factIdx, setFactIdx] = useState(0);
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [playerVote, setPlayerVote] = useState<boolean | null>(null);

  // Three-statement mode
  const [threeDeck, setThreeDeck] = useState<ThreeStatements[]>([]);
  const [threeIdx, setThreeIdx] = useState(0);
  const [currentThree, setCurrentThree] = useState<ThreeStatements | null>(null);
  const [playerThreeVote, setPlayerThreeVote] = useState<number | null>(null);

  // Vote tracking for percentage bar
  const [votes, setVotes] = useState<{ playerId: string; correct: boolean; answer: boolean | number | null }[]>([]);

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    (
      setupPlayers: { id: string; name: string; color: string; avatar: string }[],
      selectedMode: string,
      settings: { timer: number; rounds: number },
    ) => {
      if (online && (!online.isHost || online.isConnected === false)) return;
      const mapped: Player[] = setupPlayers.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        score: 0,
        streak: 0,
      }));
      setPlayers(mapped);
      setMode(selectedMode as Mode);
      setTotalRounds(settings.rounds);
      setTimerSec(settings.timer);
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      setVotes([]);

      if (selectedMode === 'three') {
        const shuffled = shuffle(getTHREE_STATEMENTS());
        setThreeDeck(shuffled);
        setThreeIdx(0);
        setCurrentThree(shuffled[0]);
        setPlayerThreeVote(null);
      } else {
        const shuffled = shuffle(getFACTS());
        setFactDeck(shuffled);
        setFactIdx(0);
        setCurrentFact(shuffled[0]);
        setPlayerVote(null);
      }
      setPhase(online ? 'statement' : 'handoff');
    },
    [online],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  // Share of votes that were correct so far this reveal (for the TV bar).
  const fofCorrectPct = useMemo(() => {
    if (votes.length === 0) return 0;
    return Math.round((votes.filter(v => v.correct).length / votes.length) * 100);
  }, [votes]);

  useTVGameBridge('fakeorfact', {
    phase, currentRound, currentPlayerIdx, players, mode, totalRounds,
    statement: phase === 'handoff' ? '' : currentFact?.statement || '',
    statements: phase === 'handoff' ? [] : currentThree?.statements || [],
    category: currentFact?.category || currentThree?.category || '',
    // The truth is hidden until reveal: classic → 0=True / 1=False, three → trueIndex.
    correctAnswer: phase === 'reveal'
      ? (mode === 'three'
          ? (currentThree?.trueIndex ?? -1)
          : (currentFact ? (currentFact.isTrue ? 0 : 1) : -1))
      : -1,
    explanation: phase === 'reveal' ? (currentFact?.explanation || '') : '',
    correctPct: phase === 'reveal' ? fofCorrectPct : -1,
    votesCount: votes.length,
  }, [phase, currentRound, currentPlayerIdx], !online || online.isHost);

  const currentPlayer = players[currentPlayerIdx] ?? null;

  const route = useOnlineAuthority(online, 'fakeorfact', `${phase}:${currentRound}:${currentPlayerIdx}`, {
    handleClassicVote: { allow: (sender, args) => phase === "statement" && mode !== "three" && typeof args[0] === "boolean" && sender === players[currentPlayerIdx]?.id, run: (...args) => handleClassicVote(args[0]) },
    handleThreeVote: { allow: (sender, args) => phase === "statement" && mode === "three" && Number.isInteger(args[0]) && args[0] >= 0 && args[0] < 3 && sender === players[currentPlayerIdx]?.id, run: (...args) => handleThreeVote(args[0]) },
    advanceRound: { allow: (sender, args) => phase === "reveal" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => advanceRound() },
    playAgain: { allow: (sender, args) => phase === "gameOver" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => playAgain() },
  });

  function scoreAndAdvance(correct: boolean, answer: boolean | number | null = null) {
    timer.pause();
    const nextVotes = [...votes, { playerId: currentPlayer?.id ?? '', correct, answer }];
    setVotes(nextVotes);
    if (currentPlayerIdx + 1 >= players.length) {
      setPlayers(prev => settleQuizRound(prev, nextVotes));
      setPhase('reveal');
    } else {
      setCurrentPlayerIdx(i => i + 1);
      if (!online) setPhase('handoff');
      setPlayerVote(null); setPlayerThreeVote(null);
    }
  }
  const expire = useCallback(() => {
    if (phase === 'statement' && (!online || online.isHost)) scoreAndAdvance(false);
  }, [phase, currentPlayerIdx, votes, online?.isHost]);
  const timer = useGameTimer(timerSec, expire, online?.isConnected !== false);
  useEffect(() => {
    if (online && !online.isHost) return;
    if (phase === 'statement') { timer.reset(timerSec); timer.start(); }
    else timer.pause();
  }, [phase, currentRound, currentPlayerIdx, timerSec, online?.isHost]);

  function handleClassicVote(isTrue: boolean) {
    if (route("handleClassicVote", [isTrue])) return;
    setPlayerVote(isTrue);
    scoreAndAdvance(currentFact ? isTrue === currentFact.isTrue : false, isTrue);
  }

  function handleThreeVote(idx: number) {
    if (route("handleThreeVote", [idx])) return;
    setPlayerThreeVote(idx);
    scoreAndAdvance(currentThree ? idx === currentThree.trueIndex : false, idx);
  }

  function advanceRound() {
    if (route("advanceRound", [])) return;
    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }
    setCurrentRound(r => r + 1);
    setCurrentPlayerIdx(0);
    setPlayerVote(null);
    setPlayerThreeVote(null);
    setVotes([]);

    if (mode === 'three') {
      const next = threeIdx + 1;
      setThreeIdx(next);
      setCurrentThree(threeDeck[next % threeDeck.length]);
    } else {
      const next = factIdx + 1;
      setFactIdx(next);
      setCurrentFact(factDeck[next % factDeck.length]);
    }
    setPhase(online ? 'statement' : 'handoff');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('fake-or-fact', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  function resetGame() {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
  }

  // Rematch: restart gameplay directly, keeping the SAME players and their
  // settings. Reshuffles a fresh deck and resets scoring for the current mode,
  // resets per-match counters/votes, then jumps straight to the first statement.
  function playAgain() {
    if (route("playAgain", [])) return;
    gameRecordedRef.current = false;
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0 })));
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
    setVotes([]);
    setPlayerVote(null);
    setPlayerThreeVote(null);

    if (mode === 'three') {
      const shuffled = shuffle(getTHREE_STATEMENTS());
      setThreeDeck(shuffled);
      setThreeIdx(0);
      setCurrentThree(shuffled[0]);
    } else {
      const shuffled = shuffle(getFACTS());
      setFactDeck(shuffled);
      setFactIdx(0);
      setCurrentFact(shuffled[0]);
    }
    setPhase(online ? 'statement' : 'handoff');
  }

  // Percentage correct
  const correctPct = useMemo(() => {
    if (votes.length === 0) return 0;
    return Math.round((votes.filter(v => v.correct).length / votes.length) * 100);
  }, [votes]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  useOnlineSnapshot(online, 'game-state', publicQuizRound({ phase, currentRound, totalRounds, currentPlayerIdx, currentFact, currentThree, players, mode, playerVote, playerThreeVote, votes, timerSec, timeLeft: timer.timeLeft }), data => {
    setTimerSec(data.timerSec); timer.reset(data.timeLeft);
    setPhase(data.phase);
    setCurrentRound(data.currentRound);
    setTotalRounds(data.totalRounds);
    setCurrentPlayerIdx(data.currentPlayerIdx);
    setCurrentFact(data.currentFact);
    setCurrentThree(data.currentThree);
    setPlayers(data.players);
    setMode(data.mode);
    const mine = data.votes.find((v: { playerId: string }) => v.playerId === online?.myPlayerId);
    setPlayerVote(online ? (typeof mine?.answer === 'boolean' ? mine.answer : null) : data.playerVote);
    setPlayerThreeVote(online ? (typeof mine?.answer === 'number' ? mine.answer : null) : data.playerThreeVote);
    setVotes(data.votes);
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  const mine = online ? votes.find(v => v.playerId === online.myPlayerId) : null;
  const displayVote = online ? (typeof mine?.answer === 'boolean' ? mine.answer : null) : playerVote;
  const displayThreeVote = online ? (typeof mine?.answer === 'number' ? mine.answer : null) : playerThreeVote;
  const canAnswer = !online || online.myPlayerId === currentPlayer?.id;
  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="fakeorfact"
        modes={getTranslatedModes('fakeorfact', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title={t('games.fakeorfact.title')}
        onlinePlayers={online?.players}
      />
    );
  }

  return (
    <div data-phase={phase} className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(150,160,165,0.6), 0 0 40px rgba(150,160,165,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#78d9db]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#ede9dc]/8 rounded-full blur-[120px] pointer-events-none" />

      {phase === 'handoff' && <div className="m-auto w-full max-w-lg space-y-6 p-6">
        <StageHeader title={currentPlayer?.name} eyebrow={t('games.findit.mapHandoffTo')} />
        <StagePanel><p>{t('games.fakeorfact.title')}</p></StagePanel>
        <StageAction className="w-full" onClick={() => setPhase('statement')}>{t('games.findit.mapReadyBtn')}</StageAction>
      </div>}
      {/* ---- STATEMENT (Classic) ---- */}
      {phase === 'statement' && <StageHeader eyebrow={t('games.fakeorfact.title')} title={currentPlayer?.name}
        subtitle={t('games.fakeorfact.round', { current: currentRound, total: totalRounds })}
        trailing={<span className="newsroom-clock" role="timer">{Math.ceil(timer.timeLeft)}<small>s</small></span>} />}
      {phase === 'statement' && mode === 'classic' && currentFact && (
        <motion.div
          key={`classic-${currentRound}-${currentPlayerIdx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Statement card */}
          <div className="flex-1 flex items-center justify-center px-4">
            <motion.div
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="fact-sheet"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#78d9db] via-[#ede9dc] to-[#ff6b98]" />
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#1b2028] text-[10px] font-bold text-[#78d9db] mb-4">
                {currentFact.category}
              </span>
              <p className="fact-headline">
                {currentFact.statement}
              </p>
            </motion.div>
          </div>

          {/* Vote buttons */}
          <div className="fact-ballot flex items-center gap-3 px-4 pb-6 pt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!canAnswer} onClick={() => handleClassicVote(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Check className="w-5 h-5" /> {t('games.fakeorfact.btnTrue')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!canAnswer} onClick={() => handleClassicVote(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <X className="w-5 h-5" /> {t('games.fakeorfact.btnFalse')}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ---- STATEMENT (Three) ---- */}
      {phase === 'statement' && mode === 'three' && currentThree && (
        <motion.div
          key={`three-${currentRound}-${currentPlayerIdx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="text-center px-4 mb-2">
            <span className="text-xs font-bold text-[#ff6b98] uppercase tracking-widest">
              {t('games.fakeorfact.whichIsTrue')}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
            {currentThree.statements.map((stmt, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.97 }}
                disabled={!canAnswer} onClick={() => handleThreeVote(idx)}
                className="fact-option"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#1b2028] border border-[#44484f]/20 flex items-center justify-center text-xs font-bold text-[#78d9db] shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{stmt}</p>
                </div>
              </motion.button>
            ))}
          </div>
          <div className="h-6" />
        </motion.div>
      )}

      {/* ---- REVEAL ---- */}
      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fact-reveal flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
        >
          {mode === 'classic' && currentFact && (() => {
            const wasCorrect = online ? votes.find(v => v.playerId === online.myPlayerId)?.correct === true : displayVote === currentFact.isTrue;
            return (
              <>
                {/* Player result — clear feedback */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                  className={cn('w-20 h-20 rounded-full flex items-center justify-center', wasCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
                  {wasCorrect ? <Check className="w-10 h-10 text-emerald-400" /> : <X className="w-10 h-10 text-red-400" />}
                </motion.div>
                <h2 className={cn('text-3xl font-extrabold', wasCorrect ? 'text-emerald-400' : 'text-red-400')}>
                  {wasCorrect ? t('games.fakeorfact.correct') : t('games.fakeorfact.wrong')}
                </h2>

                {/* What you said vs what it is */}
                <div className="w-full flex gap-3">
                  <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#a8abb3] mb-1">{t('games.fakeorfact.yourAnswer')}</p>
                    <p className={cn('text-lg font-bold', displayVote ? 'text-emerald-400' : 'text-red-400')}>
                      {displayVote === null ? t('games.fakeorfact.noAnswer') : displayVote ? t('games.fakeorfact.btnTrue') : t('games.fakeorfact.btnFalse')}
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#a8abb3] mb-1">{t('games.fakeorfact.actualAnswer')}</p>
                    <p className={cn('text-lg font-bold', currentFact.isTrue ? 'text-emerald-400' : 'text-red-400')}>
                      {currentFact.isTrue ? t('games.fakeorfact.btnTrue') : t('games.fakeorfact.btnFalse')}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="w-full rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-5">
                  <p className="text-sm text-white/70 leading-relaxed">{currentFact.explanation}</p>
                </div>
              </>
            );
          })()}

          {mode === 'three' && currentThree && (
            <>
              <h2 className="text-2xl font-extrabold font-sans text-[#ede9dc]">
                {t('games.fakeorfact.theTruthIs')}
              </h2>
              <div className="w-full space-y-2">
                {currentThree.statements.map((stmt, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'w-full rounded-[1rem] border p-4 flex items-start gap-3',
                      idx === currentThree.trueIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-[#1b2028] border-[#44484f]/20 opacity-60',
                    )}
                  >
                    {idx === currentThree.trueIndex
                      ? <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      : <X className="w-5 h-5 text-red-400/50 shrink-0 mt-0.5" />
                    }
                    <p className="text-sm text-white/80 leading-relaxed">{stmt}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {online && mode === 'three' && <p role="status">{displayThreeVote === null ? t('games.fakeorfact.noAnswer') : mine?.correct ? t('games.fakeorfact.correct') : t('games.fakeorfact.wrong')}</p>}
          {/* Vote results bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>{t('games.fakeorfact.correctPct', { pct: correctPct })}</span>
              <span>{t('games.fakeorfact.incorrectPct', { pct: 100 - correctPct })}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#1b2028] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#ede9dc] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${correctPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!!online && !online.isHost} onClick={advanceRound}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#78d9db] to-[#d779ff] text-[#0a0e14] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]"
          >
            {t('games.fakeorfact.continue')} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-sans text-[#78d9db] neon-glow">
            {t('games.results.gameOver')}
          </h2>

          <div className="w-full space-y-2">
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-[1rem] border',
                  i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20',
                )}
              >
                <span className="text-sm font-bold text-white/40 w-6 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.color }}>
                  {p.avatar}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">{p.name}</span>
                <span className="text-sm font-bold text-white/70">{p.score}</span>
              </motion.div>
            ))}
          </div>

          <div className="w-full space-y-3 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!!online && !online.isHost} onClick={playAgain}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#78d9db] to-[#d779ff] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]"
            >
              <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
            </motion.button>
            {/* Nur im Web. In der App macht das der FloatingBackButton. */}
            {!hasShellBackButton() && (
              <button
                onClick={() => navigate('/games')}
                className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
              >
                {t('games.results.otherGame')}
              </button>
            )}
          </div>
        </motion.div>
      )}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#78d9db" />
    </div>
  );
}

export default function FakeOrFactGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="fake-or-fact" className="newsroom-game"><FakeOrFactGameContent online={online} /></GameStage>;
}
