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
import { WHOAMI_CHARACTERS } from './whoami-content-de';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useHaptics } from "@/hooks/useHaptics";

type Phase = 'setup' | 'assign' | 'asking' | 'answerVote' | 'guessing' | 'guessResult' | 'gameOver';
interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
  character: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean;
}
const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
const MAX_QUESTIONS = 20;

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
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('prominente');
  const [maxQ, setMaxQ] = useState(MAX_QUESTIONS);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealIdx, setRevealIdx] = useState(0);

  useTVGameBridge('whoami', { phase, currentRound, activeIdx, players }, [phase, currentRound, activeIdx]);

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
    const pool = shuffle(WHOAMI_CHARACTERS.filter((c) => c.category === category));
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
        const pool = shuffle(WHOAMI_CHARACTERS.filter((c) => c.category === category));
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

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
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
        <button onClick={() => navigate('/games')} className="p-2 text-[#a8abb3] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-white/40">
          Runde {currentRound}/{totalRounds}
        </div>
        <div className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs font-bold text-[#df8eff]">
          {MODE_TO_CATEGORY[mode]}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ASSIGN: Show characters to everyone except the player */}
        {phase === 'assign' && (
          <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <Users className="w-8 h-8 text-[#df8eff]" />
            <h2 className="text-xl font-extrabold text-center">
              Gebt das Handy an alle AUSSER {players[revealIdx]?.name}!
            </h2>
            <p className="text-white/40 text-sm text-center">
              {players[revealIdx]?.name} darf NICHT hinschauen!
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
              <div className="text-white/40 text-sm mb-2">{players[revealIdx]?.name} ist:</div>
              <AnimatePresence mode="wait">
                {characterRevealed ? (
                  <motion.div key="revealed" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <div className="text-3xl font-extrabold text-[#df8eff] mb-1">{players[revealIdx]?.character}</div>
                  </motion.div>
                ) : (
                  <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-5xl mb-2">❓</div>
                    <div className="text-sm text-[#8ff5ff] font-bold animate-pulse">Tippe um aufzudecken</div>
                    <div className="text-xs text-white/30 mt-1">Stelle sicher, dass {players[revealIdx]?.name} NICHT auf das Handy schaut!</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            {/* Continue button — only visible AFTER character is revealed */}
            {characterRevealed && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }} onClick={nextReveal}
                className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3.5 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
                {revealIdx + 1 >= players.length ? <><Play className="w-5 h-5" /> Spiel starten</> : <>Weiter <ArrowRight className="w-5 h-5" /></>}
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
                  Runde {currentRound}/{totalRounds}
                </span>
                <span className="text-[#df8eff] font-black text-sm mt-0.5">
                  {MODE_TO_CATEGORY[mode]}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#a8abb3]">
                  Am Zug
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
                    Deine Identität
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
                Nur für die Mitspieler sichtbar
              </p>
              <p className="text-[#72757d] text-xs">
                Halte das Handy vor deine Stirn — die anderen geben dir Tipps.
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
                Skip
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSolvedDirect}
                className="h-14 rounded-full flex items-center justify-center gap-2 font-black tracking-[0.15em] uppercase text-[#003f43] shadow-[0_0_25px_rgba(143,245,255,0.4)] transition-all"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #00eefc)' }}
              >
                <Check className="w-4 h-4" />
                Gelöst
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
                  <div className="text-white/40 text-sm">{activePlayer.name} fragt:</div>
                  <div className="w-full max-w-sm rounded-2xl bg-[#1b2028] border border-[#44484f]/20 p-5 text-center">
                    <p className="text-lg font-bold text-white">"{currentQuestion}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: voter.color }}>{voter.avatar}</div>
                    <span className="text-white/60">{voter.name} antwortet</span>
                  </div>
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('yes')}
                      className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center justify-center gap-1">
                      <Check className="w-7 h-7 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-bold">Ja</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('no')}
                      className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex flex-col items-center justify-center gap-1">
                      <X className="w-7 h-7 text-red-400" />
                      <span className="text-xs text-red-400 font-bold">Nein</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => castAnswer('maybe')}
                      className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex flex-col items-center justify-center gap-1">
                      <Minus className="w-7 h-7 text-amber-400" />
                      <span className="text-xs text-amber-400 font-bold">Vllt.</span>
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
            <h2 className="text-xl font-extrabold">{activePlayer.name} raet!</h2>
            <input type="text" value={guessAttempt} onChange={(e) => setGuessAttempt(e.target.value)}
              placeholder="Wer bin ich?"
              className="w-full max-w-sm bg-[#1b2028] border border-[#df8eff]/20 rounded-2xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#df8eff]/50" />
            <motion.button whileTap={{ scale: 0.97 }} onClick={tryGuess}
              disabled={!guessAttempt.trim()}
              className={cn("w-full max-w-sm py-4 rounded-2xl h-14 font-extrabold",
                guessAttempt.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0e14] shadow-[0_0_20px_rgba(223,142,255,0.3)]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed')}>
              Raten!
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
                  <p className="text-[#ff6b98] font-bold tracking-[0.25em] text-[11px] uppercase">Glückwunsch!</p>
                  <motion.h2
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.4 }}
                    className="text-4xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-[0_0_15px_rgba(223,142,255,0.5)]"
                  >
                    RICHTIG GERATEN!
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
                        Kategorie · {MODE_TO_CATEGORY[mode]}
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8abb3]">Fragen benötigt</p>
                      <p className="text-2xl font-black text-white">{activePlayer.questionsAsked + 1}</p>
                    </div>
                  </div>
                  <div className="bg-[#0f141a] rounded-2xl p-4 flex items-center gap-3 border border-[#44484f]/20">
                    <div className="w-11 h-11 rounded-lg bg-[#df8eff]/10 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-[#df8eff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8abb3]">Punkte</p>
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
                        +{Math.min(10, Math.max(1, maxQ - (activePlayer.questionsAsked + 1) + 1))} Punkte
                      </p>
                      <p className="text-xs text-[#a8abb3]">Belohnung für Runde</p>
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
                    Nächster Spieler
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
                <h2 className="text-2xl font-extrabold text-[#ff6e84]">Übersprungen</h2>
                <div className="text-[#a8abb3] text-sm text-center">
                  {activePlayer.name} war <span className="text-white font-bold">{activePlayer.character}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={afterGuess}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full h-14 font-extrabold text-[#0a0e14] shadow-[0_0_20px_rgba(223,142,255,0.3)]"
                  style={{ background: 'linear-gradient(90deg, #df8eff, #d779ff)' }}
                >
                  Weiter <ArrowRight className="w-5 h-5" />
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
              Spielende!
            </h2>
            <div className="text-lg font-bold text-[#df8eff]">{winner.name} gewinnt!</div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className={cn("flex items-center gap-3 bg-[#1b2028] border rounded-2xl px-4 py-3",
                  p.guessedCorrectly ? 'border-emerald-500/20' : 'border-[#44484f]/20')}>
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-white/30">{p.character} {p.guessedCorrectly ? '(erraten!)' : '(nicht erraten)'}</div>
                  </div>
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
  t: (key: string, fallback?: string) => string;
  haptics: ReturnType<typeof useHaptics>;
}

const SETUP_CATEGORIES: Array<{
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: 'primary' | 'secondary' | 'tertiary' | 'accent';
}> = [
  { id: 'prominente', label: 'Prominente', desc: 'Hollywood-Stars, Musiker und Pop-Kultur-Ikonen.', icon: <Star className="w-6 h-6" />, tone: 'primary' },
  { id: 'filme',      label: 'Filmhelden', desc: 'Von Klassiker-Ikonen bis Blockbuster-Legenden.', icon: <Film className="w-6 h-6" />, tone: 'primary' },
  { id: 'tiere',      label: 'Tiere',      desc: 'Vom Dschungel bis zum Ozean — rate das Tier!', icon: <PawPrint className="w-6 h-6" />, tone: 'tertiary' },
  { id: 'berufe',     label: 'Berufe',     desc: 'Welchen Job übst du gerade aus?',                icon: <Briefcase className="w-6 h-6" />, tone: 'secondary' },
];

const TONE_CLASSES: Record<'primary' | 'secondary' | 'tertiary' | 'accent', { ring: string; glow: string; iconBg: string; iconFg: string; text: string }> = {
  primary:   { ring: 'border-[#df8eff]', glow: 'shadow-[0_0_24px_rgba(223,142,255,0.22)]', iconBg: 'bg-[#df8eff]', iconFg: 'text-[#0a0e14]', text: 'text-[#df8eff]' },
  secondary: { ring: 'border-[#ff6b98]', glow: 'shadow-[0_0_24px_rgba(255,107,152,0.22)]', iconBg: 'bg-[#ff6b98]', iconFg: 'text-[#0a0e14]', text: 'text-[#ff6b98]' },
  tertiary:  { ring: 'border-[#8ff5ff]', glow: 'shadow-[0_0_24px_rgba(143,245,255,0.22)]', iconBg: 'bg-[#8ff5ff]', iconFg: 'text-[#003f43]', text: 'text-[#8ff5ff]' },
  accent:    { ring: 'border-[#df8eff]', glow: 'shadow-[0_0_24px_rgba(223,142,255,0.22)]', iconBg: 'bg-[#df8eff]', iconFg: 'text-[#0a0e14]', text: 'text-[#df8eff]' },
};

function WhoAmISetup({ onStart, onlinePlayers, t, haptics }: WhoAmISetupProps) {
  const isOnline = (onlinePlayers?.length ?? 0) > 0;
  const [players, setPlayers] = useState<{ id: string; name: string; color: string; avatar: string }[]>(() => {
    if (isOnline && onlinePlayers) {
      return onlinePlayers.map((p, i) => ({
        id: p.id,
        name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar ?? p.name.slice(0, 1).toUpperCase(),
      }));
    }
    return [
      { id: 'p-1', name: 'Du', color: PLAYER_COLORS[0], avatar: 'D' },
      { id: 'p-2', name: 'Spieler 2', color: PLAYER_COLORS[1], avatar: '2' },
    ];
  });
  const [categoryId, setCategoryId] = useState('prominente');
  const [editingId, setEditingId] = useState<string | null>(null);
  const MIN = 2;
  const MAX = 10;

  const addPlayer = () => {
    if (players.length >= MAX) return;
    const nextIdx = players.length;
    const id = `p-${Date.now()}-${nextIdx}`;
    setPlayers((prev) => [...prev, {
      id, name: `Spieler ${nextIdx + 1}`,
      color: PLAYER_COLORS[nextIdx % PLAYER_COLORS.length],
      avatar: String(nextIdx + 1),
    }]);
    setEditingId(id);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.length > MIN ? prev.filter((p) => p.id !== id) : prev);
  };

  const renamePlayer = (id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p));
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
          <p className="text-[#ff6b98] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">Spielvorbereitung</p>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight drop-shadow-[0_0_8px_rgba(223,142,255,0.35)]">
            Wer wirst du heute sein?
          </h2>
          <p className="text-[#a8abb3] text-sm mt-2 max-w-md">
            Wähle deine Mitspieler und eine Kategorie — der Rest passiert im Spiel.
          </p>
        </div>

        {/* Player strip */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3] inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8ff5ff]" />
              Spieler · {players.length}/{MAX}
            </h3>
            {!isOnline && players.length < MAX && (
              <button
                type="button"
                onClick={addPlayer}
                className="text-xs font-bold text-[#df8eff] hover:opacity-80 transition-opacity"
              >
                + Hinzufügen
              </button>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6 snap-x">
            {players.map((p, i) => {
              const isEditing = editingId === p.id;
              const isFirst = i === 0;
              return (
                <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-2 snap-start w-20">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-full p-1 shadow-lg shadow-[#df8eff]/15"
                      style={{
                        background: isFirst
                          ? 'linear-gradient(135deg, #df8eff, #ff6b98)'
                          : `linear-gradient(135deg, ${p.color}, #20262f)`,
                      }}
                    >
                      <div className="w-full h-full rounded-full border-4 border-[#0a0e14] flex items-center justify-center text-xl font-black text-white"
                        style={{ backgroundColor: p.color }}>
                        {p.avatar}
                      </div>
                    </div>
                    {isFirst && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#8ff5ff] border-4 border-[#0a0e14]" />
                    )}
                    {!isOnline && !isFirst && players.length > MIN && (
                      <button
                        type="button"
                        onClick={() => removePlayer(p.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#20262f] border border-[#44484f] flex items-center justify-center hover:bg-[#ff6e84]/20 hover:border-[#ff6e84]/40 transition-colors"
                        aria-label={`${p.name} entfernen`}
                      >
                        <X className="w-3 h-3 text-[#a8abb3]" />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={p.name}
                      maxLength={14}
                      onChange={(e) => renamePlayer(p.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="w-20 text-center text-xs font-bold bg-transparent border-b border-[#df8eff] text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => !isOnline && setEditingId(p.id)}
                      disabled={isOnline}
                      className="text-xs font-bold truncate max-w-full hover:text-[#df8eff] transition-colors"
                    >
                      {p.name}
                    </button>
                  )}
                </div>
              );
            })}
            {!isOnline && players.length < MAX && (
              <button
                type="button"
                onClick={addPlayer}
                className="flex-shrink-0 flex flex-col items-center gap-2 snap-start w-20 group"
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#44484f] flex items-center justify-center text-[#72757d] group-hover:border-[#df8eff] group-hover:text-[#df8eff] transition-colors active:scale-95">
                  <Play className="w-6 h-6 rotate-0" />
                </div>
                <span className="text-xs font-semibold text-[#a8abb3]">Gast</span>
              </button>
            )}
          </div>
        </section>

        {/* Category bento grid */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#8ff5ff]" />
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3]">Wähle ein Thema</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SETUP_CATEGORIES.map((cat) => {
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
                      {cat.label}
                    </h4>
                    <p className="text-xs text-[#a8abb3] leading-relaxed">{cat.desc}</p>
                    {active && (
                      <div className={cn('mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest', tone.text)}>
                        <Check className="w-3 h-3" /> Ausgewählt
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
      <div className="fixed bottom-6 inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
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
              SPIEL STARTEN
              <Play className="w-5 h-5" />
            </>
          ) : (
            'Mindestens 2 Spieler'
          )}
        </motion.button>
      </div>
      {/* Unused prop — silence lint */}
      <span className="hidden">{t('whoami.setup.hidden', '')}</span>
    </div>
  );
}
