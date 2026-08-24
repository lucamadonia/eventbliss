import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, HelpCircle,
  Check, X, Minus, Star, Users, Sparkles, Film, PawPrint, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { getWHOAMI_CHARACTERS } from './whoami-content';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useHaptics } from "@/hooks/useHaptics";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { useInitialRoster } from '@/games/ui/useInitialRoster';

type Phase = 'setup' | 'assign' | 'asking' | 'answerVote' | 'guessing' | 'guessResult' | 'gameOver';
interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
  character: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean;
}
const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
const MAX_QUESTIONS = 20;

// Internal sentinel key for the first default player; NOT shown to users directly
const DEFAULT_PLAYER_SENTINEL = 'Du';

const MODE_TO_CATEGORY: Record<string, string> = {
  prominente: 'Prominente',
  tiere: 'Tiere',
  berufe: 'Berufe',
  filme: 'Filme',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;

export default function WhoAmIGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Confirm-before-quit for the in-game header back button (active play only).
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über dem Pfeil im Spiel und läuft nicht über dessen onClick.
  // Ohne Eintrag im Back-Guard-Stapel navigiert er mitten in der Runde weg und
  // die Partie ist futsch. Delegiert bewusst an denselben `exitGuard` wie der
  // Pfeil, damit es genau EINEN Bestätigungsdialog gibt.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('prominente');
  const [maxQ, setMaxQ] = useState(MAX_QUESTIONS);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealIdx, setRevealIdx] = useState(0);

  // Asking state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [voteResults, setVoteResults] = useState<Record<string, 'yes'|'no'|'maybe'>>({});
  const [voterIdx, setVoterIdx] = useState(0);
  const [guessAttempt, setGuessAttempt] = useState('');
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [characterRevealed, setCharacterRevealed] = useState(false);

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => {
    const category = MODE_TO_CATEGORY[selectedMode] ?? 'Prominente';
    const pool = shuffle(getWHOAMI_CHARACTERS().filter((c) => c.category === category));
    const p: Player[] = mapped.map((m, i) => ({
      ...m, color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0, character: pool[i % pool.length].name,
      questionsAsked: 0, guessedCorrectly: false, eliminated: false,
    }));
    setPlayers(p);
    setMode(selectedMode);
    setMaxQ(settings.timer);
    setTotalRounds(settings.rounds);
    setCurrentRound(1);
    setRevealIdx(0);
    setActiveIdx(0);
    setPhase('assign');
  };

  // ---------------------------------------------------------------------------
  // Assign: show each player who is who (except themselves)
  // ---------------------------------------------------------------------------

  const nextReveal = () => {
    setCharacterRevealed(false); // Hide character for next player
    if (revealIdx + 1 >= players.length) {
      setRevealIdx(0);
      setActiveIdx(0);
      setPhase('asking');
    } else {
      setRevealIdx((r) => r + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Asking
  // ---------------------------------------------------------------------------

  const activePlayer = players[activeIdx];

  const submitQuestion = () => {
    if (!currentQuestion.trim()) return;
    setVoteResults({});
    setVoterIdx(0);
    setPhase('answerVote');
  };

  const castAnswer = (answer: 'yes' | 'no' | 'maybe') => {
    const otherPlayers = players.filter((_, i) => i !== activeIdx && !players[i].eliminated);
    const voter = otherPlayers[voterIdx];
    if (!voter) return;
    const newVotes = { ...voteResults, [voter.id]: answer };
    setVoteResults(newVotes);

    if (voterIdx + 1 >= otherPlayers.length) {
      setPlayers((prev) => prev.map((p, i) =>
        i === activeIdx ? { ...p, questionsAsked: p.questionsAsked + 1 } : p,
      ));
      setCurrentQuestion('');
      setPhase('asking');
    } else {
      setVoterIdx((v) => v + 1);
    }
  };

  const voteSummary = useMemo(() => {
    const vals = Object.values(voteResults);
    return {
      yes: vals.filter((v) => v === 'yes').length,
      no: vals.filter((v) => v === 'no').length,
      maybe: vals.filter((v) => v === 'maybe').length,
    };
  }, [voteResults]);

  useTVGameBridge('whoami', {
    phase, currentRound, totalRounds, activeIdx, players,
    // What's being asked + the live aggregate answer tally (never per-voter)
    currentQuestion,
    voteTally: voteSummary,
    maxQuestions: maxQ,
    // Banner state for the guess result
    guessCorrect,
  }, [phase, currentRound, activeIdx, currentQuestion, voteSummary, guessCorrect]);

  // ---------------------------------------------------------------------------
  // Guessing
  // ---------------------------------------------------------------------------

  const tryGuess = () => {
    if (!guessAttempt.trim()) return;
    const correct = guessAttempt.trim().toLowerCase() === activePlayer?.character.toLowerCase();
    setGuessCorrect(correct);
    if (correct) {
      const qAsked = (activePlayer?.questionsAsked ?? 0) + 1;
      const bonus = Math.min(10, Math.max(1, maxQ - qAsked + 1));
      setPlayers((prev) => prev.map((p, i) =>
        i === activeIdx ? { ...p, guessedCorrectly: true, score: p.score + bonus } : p,
      ));
    }
    setPhase('guessResult');
  };

  const afterGuess = () => {
    setGuessAttempt('');
    setGuessCorrect(null);
    if (guessCorrect) {
      advancePlayer();
    } else {
      // wrong guess counts as a question
      setPlayers((prev) => prev.map((p, i) =>
        i === activeIdx ? { ...p, questionsAsked: p.questionsAsked + 1 } : p,
      ));
      if ((activePlayer?.questionsAsked ?? 0) + 1 >= maxQ) {
        setPlayers((prev) => prev.map((p, i) =>
          i === activeIdx ? { ...p, eliminated: true } : p,
        ));
        advancePlayer();
      } else {
        setPhase('asking');
      }
    }
  };

  const advancePlayer = () => {
    const remaining = players.filter((p, i) => i !== activeIdx && !p.guessedCorrectly && !p.eliminated);
    if (remaining.length === 0) {
      if (currentRound >= totalRounds) {
        setPhase('gameOver');
      } else {
        // next round: reassign
        setCurrentRound((r) => r + 1);
        const category = MODE_TO_CATEGORY[mode] ?? 'Prominente';
        const pool = shuffle(getWHOAMI_CHARACTERS().filter((c) => c.category === category));
        setPlayers((prev) => prev.map((p, i) => ({
          ...p, character: pool[i % pool.length].name,
          questionsAsked: 0, guessedCorrectly: false, eliminated: false,
        })));
        setRevealIdx(0);
        setActiveIdx(0);
        setPhase('assign');
      }
      return;
    }
    let next = (activeIdx + 1) % players.length;
    while (players[next].guessedCorrectly || players[next].eliminated) {
      next = (next + 1) % players.length;
    }
    setActiveIdx(next);
    setPhase('asking');
  };

  const skipToGuess = () => {
    setPhase('guessing');
  };

  // Simplified "heads-up" style actions for the new UI: phone-holder
  // taps SOLVED when the active player guessed correctly, or SKIP to
  // surrender this round to the next player.
  const handleSolvedDirect = () => {
    if (!activePlayer) return;
    void haptics.celebrate();
    const qAsked = activePlayer.questionsAsked + 1;
    const bonus = Math.min(10, Math.max(1, maxQ - qAsked + 1));
    setPlayers((prev) => prev.map((p, i) =>
      i === activeIdx ? { ...p, guessedCorrectly: true, score: p.score + bonus } : p,
    ));
    setGuessCorrect(true);
    setPhase('guessResult');
  };

  const handleSkipDirect = () => {
    if (!activePlayer) return;
    void haptics.warning();
    // Give up this character — count as eliminated, advance to next.
    setPlayers((prev) => prev.map((p, i) =>
      i === activeIdx ? { ...p, eliminated: true, questionsAsked: maxQ } : p,
    ));
    setGuessCorrect(false);
    setPhase('guessResult');
  };

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const best = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('wer-bin-ich', best?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  // Rematch: keep players AND their scores, but assign fresh characters
  // (a new game must reveal new secret roles). Reset per-match counts and
  // go straight into the assign/reveal phase — never back to setup.
  const playAgain = () => {
    const category = MODE_TO_CATEGORY[mode] ?? 'Prominente';
    const pool = shuffle(getWHOAMI_CHARACTERS().filter((c) => c.category === category));
    setPlayers((prev) => prev.map((p, i) => ({
      ...p,
      character: pool[i % pool.length].name,
      questionsAsked: 0, guessedCorrectly: false, eliminated: false,
    })));
    setCurrentRound(1);
    setRevealIdx(0);
    setActiveIdx(0);
    setCharacterRevealed(false);
    setCurrentQuestion('');
    setVoteResults({});
    setVoterIdx(0);
    setGuessAttempt('');
    setGuessCorrect(null);
    gameRecordedRef.current = false;
    setPhase('assign');
  };

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, totalRounds, activeIdx,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score, character: p.character, questionsAsked: p.questionsAsked })),
    });
  }, [phase, currentRound, activeIdx, players, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.activeIdx !== undefined) setActiveIdx(data.activeIdx as number);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number; character: string; questionsAsked: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score, character: incoming[i]?.character ?? p.character,
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
      <WhoAmISetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        t={t}
        haptics={haptics}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-game">
      <style>{EP_STYLE}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#44484f]/20">
        {/* In der App liegt der FloatingBackButton genau auf diesem Pfeil und
            tut über den Back-Guard dasselbe — dort nur unsichtbar schalten,
            nicht entfernen: der Platzhalter hält die Kopfzeile im Gleichgewicht
            und den Platz unter dem schwebenden Pfeil frei. */}
        <button
          onClick={() => (phase === 'gameOver' ? navigate('/games') : exitGuard.request())}
          className={`p-2 text-[#a8abb3] hover:text-white${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-white/40">
          {t('games.whoami.round', { round: currentRound, total: totalRounds })}
        </div>
        <div className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs font-bold text-[#df8eff]">
          {t(`gameModes.whoami.${mode}.name`, MODE_TO_CATEGORY[mode])}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ASSIGN: Show characters to everyone except the player */}
        {phase === 'assign' && (
          <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <Users className="w-8 h-8 text-[#df8eff]" />
            <h2 className="text-xl font-extrabold text-center">
              {t('games.whoami.assign.passPhone', { name: players[revealIdx]?.name })}
            </h2>
            <p className="text-white/40 text-sm text-center">
              {t('games.whoami.assign.dontLook', { name: players[revealIdx]?.name })}
            </p>
            {/* Tap-to-reveal card — character is HIDDEN until tapped */}
            <motion.button
              onClick={() => { if (!characterRevealed) setCharacterRevealed(true); }}
              whileTap={!characterRevealed ? { scale: 0.97 } : {}}
              className="w-full max-w-sm rounded-2xl bg-[#1b2028] border border-[#df8eff]/20 p-6 text-center relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]" />
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: players[revealIdx]?.color }}>
                  {players[revealIdx]?.avatar}
                </div>
              </div>
              <div className="text-white/40 text-sm mb-2">
                {t('games.whoami.assign.playerIs', { name: players[revealIdx]?.name })}
              </div>
              <AnimatePresence mode="wait">
                {characterRevealed ? (
                  <motion.div key="revealed" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <div className="text-3xl font-extrabold text-[#df8eff] mb-1">{players[revealIdx]?.character}</div>
                  </motion.div>
                ) : (
                  <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-5xl mb-2">❓</div>
                    <div className="text-sm text-[#8ff5ff] font-bold animate-pulse">
                      {t('games.whoami.assign.tapToReveal')}
                    </div>
                    <div className="text-xs text-white/30 mt-1">
                      {t('games.whoami.assign.ensureNotWatching', { name: players[revealIdx]?.name })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            {/* Continue button — only visible AFTER character is revealed */}
            {characterRevealed && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }} onClick={nextReveal}
                className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3.5 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
                {revealIdx + 1 >= players.length
                  ? <><Play className="w-5 h-5" /> {t('games.whoami.assign.startGame')}</>
                  : <>{t('games.whoami.assign.next')} <ArrowRight className="w-5 h-5" /></>}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ASKING PHASE — heads-up post-it gameplay */}
        {phase === 'asking' && activePlayer && (
          <motion.div
            key="asking"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-between px-6 py-8 relative"
          >
            {/* Top strip: round + character countdown */}
            <div className="w-full max-w-sm flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#a8abb3]">
                  {t('games.whoami.round', { round: currentRound, total: totalRounds })}
                </span>
                <span className="text-[#df8eff] font-black text-sm mt-0.5">
                  {t(`gameModes.whoami.${mode}.name`, MODE_TO_CATEGORY[mode])}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#a8abb3]">
                  {t('games.whoami.asking.yourTurn')}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: activePlayer.color }}>
                    {activePlayer.avatar}
                  </div>
                  <span className="text-white font-bold text-sm truncate max-w-[100px]">
                    {activePlayer.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Neon post-it card — tilt + glow */}
            <div className="relative w-full max-w-sm aspect-square" style={{ perspective: '1000px' }}>
              <motion.div
                initial={{ rotate: -6, opacity: 0, y: 20 }}
                animate={{ rotate: -2, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                className="relative h-full w-full"
              >
                <div className="absolute inset-0 bg-[#8ff5ff]/20 rounded-2xl blur-2xl" />
                <div
                  className="relative h-full w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
                  style={{
                    background: 'rgba(32, 38, 47, 0.6)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(143, 245, 255, 0.3)',
                  }}
                >
                  {/* Top-fold visual — the "tape" */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-[#8ff5ff] rounded-b-full shadow-[0_4px_14px_rgba(143,245,255,0.6)]" />
                  <span className="text-[#00deec] font-bold tracking-[0.2em] text-[11px] uppercase mb-4">
                    {t('games.whoami.asking.yourIdentity')}
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white break-words px-2">
                    {activePlayer.character}
                  </h1>
                  <div className="h-1 w-24 mt-6 rounded-full bg-gradient-to-r from-transparent via-[#8ff5ff] to-transparent opacity-60" />
                </div>
              </motion.div>
            </div>

            {/* Sub-instruction */}
            <div className="text-center space-y-1 my-2">
              <p className="text-[#a8abb3] font-medium text-sm">
                {t('games.whoami.asking.visibleToOthers')}
              </p>
              <p className="text-[#72757d] text-xs">
                {t('games.whoami.asking.holdPhone')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkipDirect}
                className="h-14 rounded-full bg-[#0f141a] border border-[#44484f]/60 flex items-center justify-center gap-2 font-black tracking-[0.15em] uppercase text-[#a8abb3] hover:bg-[#20262f] transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                {t('games.whoami.asking.skip')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSolvedDirect}
                className="h-14 rounded-full flex items-center justify-center gap-2 font-black tracking-[0.15em] uppercase text-[#003f43] shadow-[0_0_25px_rgba(143,245,255,0.4)] transition-all"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #00eefc)' }}
              >
                <Check className="w-4 h-4" />
                {t('games.whoami.asking.solved')}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ANSWER VOTE */}
        {phase === 'answerVote' && activePlayer && (
          <motion.div key="answerVote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            {(() => {
              const otherPlayers = players.filter((_, i) => i !== activeIdx && !players[i].eliminated);
              const voter = otherPlayers[voterIdx];
              if (!voter) return null;
              return (
                <>
                  <div className="text-white/40 text-sm">
                    {t('games.whoami.answerVote.asks', { name: activePlayer.name })}
                  </div>
                  <div className="w-full max-w-sm rounded-2xl bg-[#1b2028] border border-[#44484f]/20 p-5 text-center">
                    <p className="text-lg font-bold text-white">"{currentQuestion}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: voter.color }}>{voter.avatar}</div>
                    <span className="text-white/60">
                      {t('games.whoami.answerVote.answers', { name: voter.name })}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('yes')}
                      className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center justify-center gap-1">
                      <Check className="w-7 h-7 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-bold">
                        {t('games.whoami.answerVote.yes')}
                      </span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('no')}
                      className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex flex-col items-center justify-center gap-1">
                      <X className="w-7 h-7 text-red-400" />
                      <span className="text-xs text-red-400 font-bold">
                        {t('games.whoami.answerVote.no')}
                      </span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('maybe')}
                      className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex flex-col items-center justify-center gap-1">
                      <Minus className="w-7 h-7 text-amber-400" />
                      <span className="text-xs text-amber-400 font-bold">
                        {t('games.whoami.answerVote.maybe')}
                      </span>
                    </motion.button>
                  </div>
                  <div className="flex gap-1">
                    {otherPlayers.map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full",
                        i < voterIdx ? 'bg-[#df8eff]' : i === voterIdx ? 'bg-white' : 'bg-white/10')} />
                    ))}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* GUESSING */}
        {phase === 'guessing' && activePlayer && (
          <motion.div key="guessing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <Sparkles className="w-8 h-8 text-amber-400" />
            <h2 className="text-xl font-extrabold">
              {t('games.whoami.guessing.playerGuesses', { name: activePlayer.name })}
            </h2>
            <input type="text" value={guessAttempt} onChange={(e) => setGuessAttempt(e.target.value)}
              placeholder={t('games.whoami.guessing.placeholder')}
              className="w-full max-w-sm bg-[#1b2028] border border-[#df8eff]/20 rounded-2xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#df8eff]/50" />
            <motion.button whileTap={{ scale: 0.97 }} onClick={tryGuess}
              disabled={!guessAttempt.trim()}
              className={cn("w-full max-w-sm py-4 rounded-2xl h-14 font-extrabold",
                guessAttempt.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0e14] shadow-[0_0_20px_rgba(223,142,255,0.3)]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed')}>
              {t('games.whoami.guessing.guess')}
            </motion.button>
          </motion.div>
        )}

        {/* GUESS RESULT — celebration card when correct, skip toast when not */}
        {phase === 'guessResult' && activePlayer && (
          <motion.div
            key="guessResult"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full"
          >
            {guessCorrect ? (
              <div className="space-y-6">
                {/* Celebration header with floating confetti icons */}
                <div className="text-center space-y-3 relative">
                  <div className="absolute -top-8 inset-x-0 flex justify-between px-4 opacity-60 pointer-events-none">
                    <motion.div initial={{ rotate: 45, y: -5 }} animate={{ rotate: 60, y: 5 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}>
                      <Sparkles className="w-6 h-6 text-[#ff6b98]" />
                    </motion.div>
                    <motion.div initial={{ rotate: -12, y: 0 }} animate={{ rotate: 12, y: -8 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.4 }}>
                      <Star className="w-8 h-8 text-[#df8eff]" style={{ filter: 'drop-shadow(0 0 8px #df8eff)' }} />
                    </motion.div>
                    <motion.div initial={{ rotate: 180, y: 4 }} animate={{ rotate: 200, y: -4 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2 }}>
                      <Sparkles className="w-6 h-6 text-[#8ff5ff]" />
                    </motion.div>
                  </div>
                  <p className="text-[#ff6b98] font-bold tracking-[0.25em] text-[11px] uppercase">
                    {t('games.whoami.result.congrats')}
                  </p>
                  <motion.h2
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.4 }}
                    className="text-4xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-[0_0_15px_rgba(223,142,255,0.5)]"
                  >
                    {t('games.whoami.result.correct')}
                  </motion.h2>
                </div>

                {/* Character result card */}
                <div
                  className="rounded-2xl p-8 border border-[#df8eff]/15 relative overflow-hidden"
                  style={{
                    background: 'rgba(32, 38, 47, 0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-15 pointer-events-none">
                    <HelpCircle className="w-24 h-24 text-[#df8eff]" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div
                      className="w-36 h-36 rounded-full p-1 shadow-[0_0_40px_rgba(223,142,255,0.3)]"
                      style={{ background: 'linear-gradient(135deg, #df8eff, #ff6b98)' }}
                    >
                      <div className="w-full h-full rounded-full bg-[#20262f] border-4 border-[#0a0e14] flex items-center justify-center text-5xl font-black text-white">
                        {activePlayer.avatar}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black">{activePlayer.character}</h3>
                      <p className="text-[#a8abb3] font-medium text-sm mt-1">
                        {t('games.whoami.result.category', { category: t(`gameModes.whoami.${mode}.name`, MODE_TO_CATEGORY[mode]) })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f141a] rounded-2xl p-4 flex items-center gap-3 border border-[#44484f]/20">
                    <div className="w-11 h-11 rounded-lg bg-[#8ff5ff]/10 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-[#8ff5ff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8abb3]">
                        {t('games.whoami.result.questionsNeeded')}
                      </p>
                      <p className="text-2xl font-black text-white">{activePlayer.questionsAsked + 1}</p>
                    </div>
                  </div>
                  <div className="bg-[#0f141a] rounded-2xl p-4 flex items-center gap-3 border border-[#44484f]/20">
                    <div className="w-11 h-11 rounded-lg bg-[#df8eff]/10 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-[#df8eff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8abb3]">
                        {t('games.whoami.result.points')}
                      </p>
                      <p className="text-2xl font-black text-white">{activePlayer.score}</p>
                    </div>
                  </div>
                </div>

                {/* Reward card */}
                <div
                  className="rounded-2xl p-5 border border-[#df8eff]/20 flex justify-between items-center"
                  style={{ background: 'linear-gradient(90deg, rgba(187,0,88,0.15), rgba(215,121,255,0.15))' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0a0e14] flex items-center justify-center shadow-lg">
                      <Trophy className="w-6 h-6 text-[#ff6b98]" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-white">
                        {t('games.whoami.result.pointsEarned', { count: Math.min(10, Math.max(1, maxQ - (activePlayer.questionsAsked + 1) + 1)) })}
                      </p>
                      <p className="text-xs text-[#a8abb3]">
                        {t('games.whoami.result.roundReward')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={afterGuess}
                    className="w-full h-14 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 text-[#0a0e14] shadow-[0_12px_24px_-8px_rgba(223,142,255,0.4)]"
                    style={{ background: 'linear-gradient(90deg, #df8eff, #d779ff)' }}
                  >
                    <Play className="w-5 h-5" />
                    {t('games.whoami.result.nextPlayer')}
                  </motion.button>
                </div>
              </div>
            ) : (
              // Skip / wrong path — compact feedback
              <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-[60vh]">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <div className="w-24 h-24 rounded-2xl bg-[#ff6e84]/15 border border-[#ff6e84]/30 flex items-center justify-center">
                    <X className="w-12 h-12 text-[#ff6e84]" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-extrabold text-[#ff6e84]">
                  {t('games.whoami.result.skipped')}
                </h2>
                <div className="text-[#a8abb3] text-sm text-center">
                  {t('games.whoami.result.wasCharacter', { name: activePlayer.name, character: activePlayer.character })}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={afterGuess}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full h-14 font-extrabold text-[#0a0e14] shadow-[0_0_20px_rgba(223,142,255,0.3)]"
                  style={{ background: 'linear-gradient(90deg, #df8eff, #d779ff)' }}
                >
                  {t('games.whoami.assign.next')} <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
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
              {t('games.whoami.gameOver.title')}
            </h2>
            <div className="text-lg font-bold text-[#df8eff]">
              {t('games.whoami.gameOver.winner', { name: winner.name })}
            </div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className={cn("flex items-center gap-3 bg-[#1b2028] border rounded-2xl px-4 py-3",
                  p.guessedCorrectly ? 'border-emerald-500/20' : 'border-[#44484f]/20')}>
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-white/30">
                      {p.character} {p.guessedCorrectly
                        ? t('games.whoami.gameOver.guessed')
                        : t('games.whoami.gameOver.notGuessed')}
                    </div>
                  </div>
                  <span className="text-[#df8eff] font-bold">
                    {t('games.whoami.gameOver.pts', { score: p.score })}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-3 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={playAgain}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
                <RotateCcw className="w-4 h-4" /> {t('games.whoami.gameOver.playAgain')}
              </motion.button>
              {!hasShellBackButton() && (
                <button onClick={() => navigate('/games')}
                  className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
                  {t('games.whoami.gameOver.anotherGame')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#df8eff" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// WhoAmISetup — bento-style custom setup screen (player strip + category grid)
// ---------------------------------------------------------------------------

interface WhoAmISetupProps {
  onStart: (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => void;
  onlinePlayers?: { id: string; name: string; color?: string; avatar?: string }[];
  t: (key: string, options?: Record<string, unknown> | string) => string;
  haptics: ReturnType<typeof useHaptics>;
}

// SETUP_CATEGORIES uses i18n keys; labels/descs are rendered via t() in JSX below.
const SETUP_CATEGORY_IDS: Array<{
  id: string;
  icon: React.ReactNode;
  tone: 'primary' | 'secondary' | 'tertiary' | 'accent';
}> = [
  { id: 'prominente', icon: <Star className="w-6 h-6" />, tone: 'primary' },
  { id: 'filme',      icon: <Film className="w-6 h-6" />, tone: 'primary' },
  { id: 'tiere',      icon: <PawPrint className="w-6 h-6" />, tone: 'tertiary' },
  { id: 'berufe',     icon: <Briefcase className="w-6 h-6" />, tone: 'secondary' },
];

const TONE_CLASSES: Record<'primary' | 'secondary' | 'tertiary' | 'accent', { ring: string; glow: string; iconBg: string; iconFg: string; text: string }> = {
  primary:   { ring: 'border-[#df8eff]', glow: 'shadow-[0_0_24px_rgba(223,142,255,0.22)]', iconBg: 'bg-[#df8eff]', iconFg: 'text-[#0a0e14]', text: 'text-[#df8eff]' },
  secondary: { ring: 'border-[#ff6b98]', glow: 'shadow-[0_0_24px_rgba(255,107,152,0.22)]', iconBg: 'bg-[#ff6b98]', iconFg: 'text-[#0a0e14]', text: 'text-[#ff6b98]' },
  tertiary:  { ring: 'border-[#8ff5ff]', glow: 'shadow-[0_0_24px_rgba(143,245,255,0.22)]', iconBg: 'bg-[#8ff5ff]', iconFg: 'text-[#003f43]', text: 'text-[#8ff5ff]' },
  accent:    { ring: 'border-[#df8eff]', glow: 'shadow-[0_0_24px_rgba(223,142,255,0.22)]', iconBg: 'bg-[#df8eff]', iconFg: 'text-[#0a0e14]', text: 'text-[#df8eff]' },
};

function WhoAmISetup({ onStart, onlinePlayers, t, haptics }: WhoAmISetupProps) {
  const isOnline = (onlinePlayers?.length ?? 0) > 0;
  /**
   * Party-Besetzung uebernehmen. Dieser eigene Setup-Bildschirm kannte bisher
   * nur den Online-Raum — eine laufende Party begann hier mit Platzhaltern
   * statt mit ihren echten Gaesten.
   */
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });
  const [players, setPlayers] = useState<{ id: string; name: string; color: string; avatar: string }[]>(() => {
    if (isOnline && onlinePlayers) {
      return onlinePlayers.map((p, i) => ({
        id: p.id,
        name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar ?? p.name.slice(0, 1).toUpperCase(),
      }));
    }
    if (partyRoster) {
      return partyRoster.map((p, i) => ({
        id: p.id,
        name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar,
      }));
    }
    return [
      // Internal sentinel 'Du' is kept as the name; display is handled by PlayerSetup
      // which will show t('games.whoami.setup.defaultPlayerName') as the placeholder/label.
      // The sentinel is compared in handleImportNames to detect the default slot.
      { id: 'p-1', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[0], avatar: 'D' },
      { id: 'p-2', name: t('games.whoami.setup.playerN', { n: 2 }), color: PLAYER_COLORS[1], avatar: '2' },
    ];
  });
  const [categoryId, setCategoryId] = useState('prominente');
  const MIN = 2;
  const MAX = 10;

  const addPlayer = () => {
    if (players.length >= MAX) return;
    const nextIdx = players.length;
    const id = `p-${Date.now()}-${nextIdx}`;
    setPlayers((prev) => [...prev, {
      id,
      name: t('games.whoami.setup.playerN', { n: nextIdx + 1 }),
      color: PLAYER_COLORS[nextIdx % PLAYER_COLORS.length],
      avatar: String(nextIdx + 1),
    }]);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.length > MIN ? prev.filter((p) => p.id !== id) : prev);
  };

  const renamePlayer = (id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p));
  };

  // REPLACE roster with imported names, dropping all placeholders/defaults.
  // Pad to MIN with generated names if needed.
  const handleImportNames = (names: string[]) => {
    setPlayers(() => {
      const imported: { id: string; name: string; color: string; avatar: string }[] = [];
      for (const n of names) {
        if (imported.length >= MAX) break;
        imported.push({
          id: `p-${Date.now()}-${imported.length}`,
          name: n,
          color: PLAYER_COLORS[imported.length % PLAYER_COLORS.length],
          avatar: n.slice(0, 1).toUpperCase() || '?',
        });
      }
      while (imported.length < MIN) {
        const idx = imported.length;
        imported.push({
          id: `p-${Date.now()}-${idx}`,
          name: t('games.whoami.setup.playerN', { n: idx + 1 }),
          color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
          avatar: String(idx + 1),
        });
      }
      return imported;
    });
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);

  const handleStart = () => {
    if (!canStart) return;
    void haptics.celebrate();
    onStart(players, categoryId, { timer: 20, rounds: 1 });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#df8eff]/10 blur-[100px]" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-[#ff6b98]/10 blur-[100px]" />
      </div>

      <main className="pt-10 pb-40 px-6 max-w-2xl mx-auto">
        {/* Hero */}
        <div className="relative mb-10">
          <p className="text-[#ff6b98] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">
            {t('games.whoami.setup.heading')}
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight drop-shadow-[0_0_8px_rgba(223,142,255,0.35)]">
            {t('games.whoami.setup.title')}
          </h2>
          <p className="text-[#a8abb3] text-sm mt-2 max-w-md">
            {t('games.whoami.setup.subtitle')}
          </p>
        </div>

        {/* Player strip */}
        <section className="mb-10">
          <PlayerSetup
            players={players.map((p) => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, readOnly: isOnline }))}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onRename={renamePlayer}
            onImportNames={isOnline ? undefined : handleImportNames}
            min={MIN}
            max={isOnline ? players.length : MAX}
            accent="#df8eff"
            label={t('games.whoami.setup.playerLabel')}
            maxNameLength={14}
          />
        </section>

        {/* Category bento grid */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#8ff5ff]" />
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3]">
              {t('games.whoami.setup.pickTheme')}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SETUP_CATEGORY_IDS.map((cat) => {
              const active = categoryId === cat.id;
              const tone = TONE_CLASSES[cat.tone];
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { void haptics.select(); setCategoryId(cat.id); }}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.98]',
                    active
                      ? cn('bg-[#df8eff]/10 border-2', tone.ring, tone.glow)
                      : 'bg-[#0f141a] border border-[#44484f]/20 hover:border-[#df8eff]/30',
                  )}
                >
                  {/* Oversized bg icon */}
                  <div className={cn(
                    'absolute top-0 right-0 p-3 opacity-10 transition-opacity',
                    active ? 'opacity-25' : 'group-hover:opacity-20',
                    tone.text,
                  )}>
                    <span className="block scale-[3] origin-top-right">
                      {cat.icon}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <div className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center mb-3',
                      active ? tone.iconBg : 'bg-[#20262f]',
                      active ? tone.iconFg : tone.text,
                    )}>
                      {cat.icon}
                    </div>
                    <h4 className={cn(
                      'text-base font-extrabold mb-1',
                      active ? tone.text : 'text-white group-hover:' + tone.text,
                    )}>
                      {t(`games.whoami.setup.cat.${cat.id}.label`)}
                    </h4>
                    <p className="text-xs text-[#a8abb3] leading-relaxed">
                      {t(`games.whoami.setup.cat.${cat.id}.desc`)}
                    </p>
                    {active && (
                      <div className={cn('mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest', tone.text)}>
                        <Check className="w-3 h-3" /> {t('games.whoami.setup.selected')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
        <motion.button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          whileTap={canStart ? { scale: 0.97 } : {}}
          className={cn(
            'w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all',
            canStart
              ? 'text-[#0a0e14] shadow-[0_20px_40px_rgba(223,142,255,0.35)]'
              : 'bg-[#20262f] text-[#44484f] cursor-not-allowed',
          )}
          style={canStart ? { background: 'linear-gradient(90deg, #df8eff, #d779ff)' } : {}}
        >
          {canStart ? (
            <>
              {t('games.whoami.setup.startGame')}
              <Play className="w-5 h-5" />
            </>
          ) : (
            t('games.whoami.setup.minPlayers')
          )}
        </motion.button>
      </div>
      {/* Unused prop — silence lint */}
      <span className="hidden">{t('whoami.setup.hidden', '')}</span>
    </div>
  );
}
