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
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { WHOAMI_CHARACTERS, type WhoAmICharacter } from './whoami-content-de';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

type Phase = 'setup' | 'assign' | 'asking' | 'answerVote' | 'guessing' | 'guessResult' | 'gameOver';
interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
  character: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean;
}
const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
const MAX_QUESTIONS = 20;

const GAME_MODES: GameMode[] = [
  { id: 'prominente', name: 'Prominente', desc: 'Beruehmte Persoenlichkeiten', icon: <Star className="w-6 h-6" /> },
  { id: 'tiere', name: 'Tiere', desc: 'Rate das Tier!', icon: <PawPrint className="w-6 h-6" /> },
  { id: 'berufe', name: 'Berufe', desc: 'Welcher Beruf bist du?', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'filme', name: 'Filme', desc: 'Filmcharaktere erraten', icon: <Film className="w-6 h-6" /> },
];

const MODE_TO_CATEGORY: Record<string, string> = {
  prominente: 'Prominente',
  tiere: 'Tiere',
  berufe: 'Berufe',
  filme: 'Filme',
};

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 10, max: 30, default: 20, step: 1, label: 'Max. Fragen pro Spieler' },
  rounds: { min: 1, max: 5, default: 1, step: 1, label: 'Runden' },
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
  const navigate = useNavigate();

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

  // Asking state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [voteResults, setVoteResults] = useState<Record<string, 'yes'|'no'|'maybe'>>({});
  const [voterIdx, setVoterIdx] = useState(0);
  const [guessAttempt, setGuessAttempt] = useState('');
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);

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
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Wer bin ich?"
        minPlayers={2}
        maxPlayers={10}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-['Plus_Jakarta_Sans']">
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
            {/* Big reveal card */}
            <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.5 }}
              className="w-full max-w-sm rounded-2xl bg-[#1b2028] border border-[#df8eff]/20 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]" />
              <div className="text-white/40 text-sm mb-2">{players[revealIdx]?.name} ist:</div>
              <div className="text-3xl font-extrabold text-[#df8eff] mb-1">{players[revealIdx]?.character}</div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: players[revealIdx]?.color }}>
                  {players[revealIdx]?.avatar}
                </div>
              </div>
            </motion.div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={nextReveal}
              className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3.5 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
              {revealIdx + 1 >= players.length ? <><Play className="w-5 h-5" /> Spiel starten</> : <>Weiter <ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </motion.div>
        )}

        {/* ASKING PHASE */}
        {phase === 'asking' && activePlayer && (
          <motion.div key="asking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center gap-5 px-4 py-6">
            <ActivePlayerBanner
              playerName={activePlayer.name}
              playerColor={activePlayer.color}
              playerAvatar={activePlayer.avatar}
              hidden={false}
            />
            {/* Player info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: activePlayer.color }}>{activePlayer.avatar}</div>
              <div>
                <div className="font-bold text-white">{activePlayer.name}</div>
                <div className="text-xs text-white/40">Frage {activePlayer.questionsAsked + 1}/{maxQ}</div>
              </div>
            </div>
            {/* Big ? card */}
            <div className="w-full max-w-sm rounded-2xl glass-card border border-[#df8eff]/20 p-8 text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <HelpCircle className="w-16 h-16 mx-auto text-[#df8eff] neon-glow" style={{ filter: 'drop-shadow(0 0 15px rgba(223,142,255,0.5))' }} />
              </motion.div>
              <div className="text-[#a8abb3] text-sm mt-3">Wer bin ich?</div>
            </div>
            {/* Last vote results */}
            {Object.keys(voteResults).length > 0 && (
              <div className="flex gap-3">
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                  Ja: {voteSummary.yes}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                  Nein: {voteSummary.no}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
                  Vielleicht: {voteSummary.maybe}
                </div>
              </div>
            )}
            {/* Question input */}
            <div className="w-full max-w-sm space-y-3">
              <input type="text" value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Stelle eine Ja/Nein Frage..."
                className="w-full bg-[#1b2028] border border-[#44484f]/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#df8eff]/50" />
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitQuestion}
                  disabled={!currentQuestion.trim()}
                  className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm",
                    currentQuestion.trim()
                      ? 'bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] shadow-[0_0_20px_rgba(207,150,255,0.25)]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed')}>
                  Frage stellen
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={skipToGuess}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#8ff5ff] to-[#0ea5e9] text-[#0a0e14] font-bold text-sm shadow-[0_0_20px_rgba(143,245,255,0.25)]">
                  Raten!
                </motion.button>
              </div>
            </div>
            {/* Progress */}
            <div className="w-full max-w-sm">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] rounded-full"
                  animate={{ width: `${(activePlayer.questionsAsked / maxQ) * 100}%` }} />
              </div>
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

        {/* GUESS RESULT */}
        {phase === 'guessResult' && activePlayer && (
          <motion.div key="guessResult" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            {guessCorrect ? (<>
              <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <div className="w-24 h-24 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Check className="w-12 h-12 text-emerald-400" /></div>
              </motion.div>
              <h2 className="text-2xl font-extrabold text-emerald-400">Richtig!</h2>
              <div className="text-white/60">{activePlayer.name} ist <span className="text-[#df8eff] font-bold">{activePlayer.character}</span></div>
            </>) : (<>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <div className="w-24 h-24 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <X className="w-12 h-12 text-red-400" /></div>
              </motion.div>
              <h2 className="text-2xl font-extrabold text-red-400">Falsch!</h2>
              <div className="text-white/40 text-sm">Noch {maxQ - (activePlayer?.questionsAsked ?? 0)} Fragen uebrig</div>
            </>)}
            <motion.button whileTap={{ scale: 0.97 }} onClick={afterGuess}
              className="flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3.5 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(223,142,255,0.3)]">
              Weiter <ArrowRight className="w-5 h-5" />
            </motion.button>
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
