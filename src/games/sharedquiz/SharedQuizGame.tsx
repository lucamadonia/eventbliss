import { useTranslation } from "react-i18next";
import { useState, useMemo, useRef, useEffect } from 'react';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from 'framer-motion';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import {
  Play, Trophy, RotateCcw, ArrowRight, Plus, Minus,
  Users, Eye, MessageCircle, Lightbulb, HelpCircle, Check, X,
  ChevronRight, Link, Crown,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import { SHARED_QUIZ_QUESTIONS, type SharedQuizQuestion } from './sharedquiz-content-de';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { getActivePartySession } from "@/hooks/usePartySession";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mode = 'trio' | 'chain' | 'allornothing';
type Phase =
  | 'setup'
  | 'roundIntro'
  | 'playerA'
  | 'handoffAB'
  | 'playerB'
  | 'handoffBC'
  | 'playerC'
  | 'reveal'
  | 'gameOver';

interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SharedQuizGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  const partyPlayerNames = getActivePartySession()?.players?.map(p => p.name) ?? [];
  const resolvedNames = onlinePlayerNames.length >= 3
    ? onlinePlayerNames
    : partyPlayerNames.length >= 3
      ? partyPlayerNames
      : [];
  const initialPlayers: Player[] = resolvedNames.length >= 3
    ? resolvedNames.map((name, i) => ({ id: `p${i + 1}`, name, color: getPlayerColor(i), score: 0 }))
    : [
        { id: 'p1', name: 'Spieler 1', color: getPlayerColor(0), score: 0 },
        { id: 'p2', name: 'Spieler 2', color: getPlayerColor(1), score: 0 },
        { id: 'p3', name: 'Spieler 3', color: getPlayerColor(2), score: 0 },
      ];
  /* ---- Setup ---- */
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [mode, setMode] = useState<Mode>('trio');
  const [totalRounds, setTotalRounds] = useState(10);

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const deck = useRef<SharedQuizQuestion[]>(shuffle(SHARED_QUIZ_QUESTIONS));
  const deckPos = useRef(0);
  const [currentQ, setCurrentQ] = useState<SharedQuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roleIndices, setRoleIndices] = useState<[number, number, number]>([0, 1, 2]);

  useTVGameBridge('sharedquiz', {
    phase, round, players, totalRounds,
    question: currentQ?.question || '',
    answers: currentQ?.answers || [],
    correctAnswer: phase === 'reveal' ? currentQ?.correctIndex ?? -1 : -1,
  }, [phase, round, selectedAnswer]);

  /* ---- Player management ---- */
  const nextId = useRef(4);
  const addPlayer = () => {
    if (players.length >= 10) return;
    const i = players.length;
    setPlayers(p => [...p, { id: `p${nextId.current++}`, name: `Spieler ${i + 1}`, color: getPlayerColor(i), score: 0 }]);
  };
  const removePlayer = (id: string) => {
    if (players.length <= 3) return;
    setPlayers(p => p.filter(x => x.id !== id));
  };
  const updateName = (id: string, name: string) => {
    setPlayers(p => p.map(x => x.id === id ? { ...x, name } : x));
  };

  /* ---- Draw question ---- */
  function drawQuestion(): SharedQuizQuestion {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(SHARED_QUIZ_QUESTIONS);
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Role players ---- */
  const playerA = players[roleIndices[0] % players.length];
  const playerB = players[roleIndices[1] % players.length];
  const playerC = players[roleIndices[2] % players.length];

  /* ---- Start game ---- */
  function startGame() {
    const reset = players.map(p => ({ ...p, score: 0 }));
    setPlayers(reset);
    deck.current = shuffle(SHARED_QUIZ_QUESTIONS);
    deckPos.current = 0;
    setRound(1);
    setRoleIndices([0, 1, 2]);
    startRound([0, 1, 2]);
  }

  function startRound(indices: [number, number, number]) {
    setCurrentQ(drawQuestion());
    setSelectedAnswer(null);
    setRoleIndices(indices);
    setPhase('roundIntro');
  }

  /* ---- Answer ---- */
  function handleAnswer(idx: number) {
    setSelectedAnswer(idx);
    setPhase('reveal');
    if (currentQ && idx === currentQ.correctIndex) {
      setPlayers(prev => prev.map((p, i) => {
        const isRole = [roleIndices[0] % players.length, roleIndices[1] % players.length, roleIndices[2] % players.length].includes(i);
        return isRole ? { ...p, score: p.score + 1 } : p;
      }));
    }
  }

  /* ---- Next round ---- */
  function nextRound() {
    if (round >= totalRounds) { setPhase('gameOver'); return; }
    const next: [number, number, number] = [
      (roleIndices[0] + 1) % players.length,
      (roleIndices[1] + 1) % players.length,
      (roleIndices[2] + 1) % players.length,
    ];
    setRound(r => r + 1);
    startRound(next);
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('geteilt-gequizzt', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Sorted players for results ---- */
  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  /* ---- Mode info ---- */
  const modes: { id: Mode; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'trio', name: 'Trio-Challenge', desc: 'Frage, Antworten & Hinweis verteilt', icon: <Users className="w-6 h-6" /> },
    { id: 'chain', name: 'Ketten-Quiz', desc: 'Hinweis-Kette von Spieler zu Spieler', icon: <Link className="w-6 h-6" /> },
    { id: 'allornothing', name: 'Alle oder Keiner', desc: 'Nur Punkte wenn alle richtig liegen', icon: <Crown className="w-6 h-6" /> },
  ];

  const isCorrect = currentQ && selectedAnswer === currentQ.correctIndex;

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, round, totalRounds, roleIndices,
      currentQ: currentQ ? { question: currentQ.question, options: currentQ.options, correctIndex: currentQ.correctIndex } : null,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  }, [phase, round, roleIndices, currentQ, players, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.round) setRound(data.round as number);
      if (data.roleIndices) setRoleIndices(data.roleIndices as [number, number, number]);
      if (data.currentQ) setCurrentQ(data.currentQ as SharedQuizQuestion);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-cyan { text-shadow: 0 0 20px rgba(143,245,255,0.6), 0 0 40px rgba(143,245,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ---- SETUP ---- */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col px-4 py-8 pb-32 max-w-lg mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1rem] bg-[#1b2028] border border-[#8ff5ff]/20 mb-4">
              <Users className="w-8 h-8 text-[#8ff5ff]" />
            </div>
            <h1 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#8ff5ff] to-[#8ff5ff]/60 bg-clip-text text-transparent">
              Geteilt & Gequizzt
            </h1>
            <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
              Wissen ist aufgeteilt — nur gemeinsam kommt ihr zur Loesung!
            </p>
          </div>

          {/* Players */}
          <section className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Spieler ({players.length})</h2>
            <AnimatePresence initial={false}>
              {players.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: p.color }}>{getPlayerInitial(p.name)}</div>
                  <input type="text" value={p.name} onChange={e => updateName(p.id, e.target.value)}
                    maxLength={20} className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8ff5ff]/50 text-sm" />
                  {players.length > 3 && (
                    <button onClick={() => removePlayer(p.id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center">
                      <Minus className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length < 10 && (
              <button onClick={addPlayer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-[#8ff5ff]/50 hover:text-[#8ff5ff] transition-colors text-sm">
                <Plus className="w-4 h-4" /> Spieler hinzufuegen
              </button>
            )}
          </section>

          {/* Mode */}
          <section className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Modus</h2>
            <div className="space-y-2">
              {modes.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={cn('w-full flex items-center gap-3 p-4 rounded-[1rem] border-2 transition-colors text-left',
                    mode === m.id ? 'border-[#8ff5ff] bg-[#8ff5ff]/10 text-white' : 'border-gray-700 bg-[#1b2028] text-gray-300 hover:border-gray-600')}>
                  <span className="text-[#8ff5ff]">{m.icon}</span>
                  <div><div className="text-sm font-semibold">{m.name}</div><div className="text-xs text-white/40">{m.desc}</div></div>
                </button>
              ))}
            </div>
          </section>

          {/* Rounds */}
          <section className="mb-6">
            <div className="bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/40">Runden</span>
                <span className="text-white font-bold">{totalRounds}</span>
              </div>
              <input type="range" min={3} max={20} step={1} value={totalRounds}
                onChange={e => setTotalRounds(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-[#8ff5ff] cursor-pointer" />
            </div>
          </section>

          {/* Start */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
            <div className="max-w-lg mx-auto space-y-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={startGame}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide shadow-[0_0_20px_rgba(143,245,255,0.3)] flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Spiel starten
              </motion.button>
              <button onClick={() => navigate('/games')} className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition">Zurueck</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- ROUND INTRO ---- */}
      {phase === 'roundIntro' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8ff5ff]">Runde {round} / {totalRounds}</span>
          </div>
          <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white text-center">Rollenverteilung</h2>
          <div className="w-full max-w-sm space-y-3">
            <RoleBadge icon={<HelpCircle className="w-5 h-5" />} label="Frage" player={playerA} />
            <RoleBadge icon={<MessageCircle className="w-5 h-5" />} label="Antworten" player={playerB} />
            <RoleBadge icon={<Lightbulb className="w-5 h-5" />} label="Hinweis & Antwort" player={playerC} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('playerA')}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-3 rounded-full font-extrabold text-lg shadow-[0_0_20px_rgba(143,245,255,0.25)]">
            Los geht's! <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- PLAYER A: Question ---- */}
      {phase === 'playerA' && currentQ && (
        <PlayerScreen name={playerA.name} color={playerA.color} instruction="Lies die Frage laut vor!"
          onNext={() => setPhase('handoffAB')}>
          <div className="text-center">
            <div className="text-xs font-bold text-[#8ff5ff] uppercase tracking-widest mb-3">Frage</div>
            <div className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white leading-tight">{currentQ.question}</div>
          </div>
        </PlayerScreen>
      )}

      {/* ---- HANDOFF A->B ---- */}
      {phase === 'handoffAB' && (
        <HandoffScreen from={playerA.name} to={playerB.name} toColor={playerB.color}
          onContinue={() => setPhase('playerB')} />
      )}

      {/* ---- PLAYER B: Answers ---- */}
      {phase === 'playerB' && currentQ && (
        <PlayerScreen name={playerB.name} color={playerB.color} instruction="Lies die Antworten laut vor!"
          onNext={() => setPhase('handoffBC')}>
          <div>
            <div className="text-xs font-bold text-[#8ff5ff] uppercase tracking-widest mb-3 text-center">Antworten</div>
            <div className="space-y-2">
              {currentQ.answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-[#44484f]/20 rounded-[1rem] px-4 py-3">
                  <span className="w-8 h-8 rounded-full bg-[#8ff5ff]/20 text-[#8ff5ff] flex items-center justify-center font-bold text-sm">{ANSWER_LABELS[i]}</span>
                  <span className="text-white font-semibold">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </PlayerScreen>
      )}

      {/* ---- HANDOFF B->C ---- */}
      {phase === 'handoffBC' && (
        <HandoffScreen from={playerB.name} to={playerC.name} toColor={playerC.color}
          onContinue={() => setPhase('playerC')} />
      )}

      {/* ---- PLAYER C: Hint + Answer Selection ---- */}
      {phase === 'playerC' && currentQ && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: playerC.color }}>{getPlayerInitial(playerC.name)}</div>
            <span className="text-white font-bold">{playerC.name}</span>
          </div>
          <div className="w-full rounded-[1rem] bg-[#151a21]/80 backdrop-blur-xl border border-[#44484f]/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Hinweis</span>
            </div>
            <p className="text-white/80 text-base leading-relaxed">{currentQ.hint}</p>
          </div>
          <p className="text-white/40 text-sm">Lies den Hinweis vor und waehle die Antwort!</p>
          <div className="w-full space-y-2">
            {currentQ.answers.map((a, i) => (
              <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => handleAnswer(i)}
                className="w-full flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 hover:border-[#8ff5ff]/40 rounded-[1rem] px-4 py-3 transition-colors">
                <span className="w-8 h-8 rounded-full bg-[#8ff5ff]/20 text-[#8ff5ff] flex items-center justify-center font-bold text-sm">{ANSWER_LABELS[i]}</span>
                <span className="text-white font-semibold">{a}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ---- REVEAL ---- */}
      {phase === 'reveal' && currentQ && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center',
              isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
              {isCorrect ? <Check className="w-8 h-8 text-emerald-400" /> : <X className="w-8 h-8 text-red-400" />}
            </div>
          </motion.div>
          <h2 className={cn('text-2xl font-extrabold font-[Plus_Jakarta_Sans]',
            isCorrect ? 'text-emerald-400' : 'text-red-400')}>
            {isCorrect ? 'Richtig!' : 'Falsch!'}
          </h2>

          <div className="w-full rounded-[1rem] bg-[#151a21]/80 border border-[#44484f]/20 p-5 space-y-4">
            <div><div className="text-xs text-white/40 uppercase tracking-widest mb-1">Frage</div>
              <div className="text-white font-bold">{currentQ.question}</div></div>
            <div className="space-y-1.5">
              {currentQ.answers.map((a, i) => (
                <div key={i} className={cn('flex items-center gap-3 rounded-[1rem] px-4 py-2.5 border',
                  i === currentQ.correctIndex ? 'bg-emerald-500/10 border-emerald-500/30' :
                  i === selectedAnswer ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.02] border-white/[0.04]')}>
                  <span className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                    i === currentQ.correctIndex ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40')}>{ANSWER_LABELS[i]}</span>
                  <span className={cn('font-semibold text-sm', i === currentQ.correctIndex ? 'text-emerald-300' : 'text-white/60')}>{a}</span>
                  {i === currentQ.correctIndex && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-[1rem] px-4 py-3">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-amber-200/80 text-sm">{currentQ.hint}</span>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={nextRound}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
            {round >= totalRounds ? 'Ergebnis' : 'Weiter'} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-[#8ff5ff] neon-glow-cyan">
            Spielende!
          </h2>
          <div className="w-full space-y-2">
            {sorted.map((p, i) => (
              <div key={p.id} className={cn('flex items-center gap-3 rounded-[1rem] px-4 py-3 border',
                i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20')}>
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  i === 0 ? 'bg-amber-500 text-[#0a0e14]' : 'bg-white/10 text-white/40')}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: p.color }}>{getPlayerInitial(p.name)}</div>
                <span className="flex-1 font-semibold text-white truncate">{p.name}</span>
                <span className={cn('font-bold text-lg', i === 0 ? 'text-amber-400' : 'text-white/60')}>{p.score}</span>
              </div>
            ))}
          </div>
          <div className="w-full space-y-3 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('setup'); }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
              <RotateCcw className="w-4 h-4" /> Nochmal
            </motion.button>
            <button onClick={() => navigate('/games')}
              className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
              Anderes Spiel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RoleBadge({ icon, label, player }: { icon: React.ReactNode; label: string; player: Player }) {
  return (
    <div className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] px-4 py-3">
      <span className="text-[#8ff5ff]">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
        <div className="font-bold text-white">{player.name}</div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{ backgroundColor: player.color }}>{getPlayerInitial(player.name)}</div>
    </div>
  );
}

function PlayerScreen({ name, color, instruction, onNext, children }: {
  name: string; color: string; instruction: string; onNext: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}>{getPlayerInitial(name)}</div>
        <span className="text-white font-bold text-lg">{name}</span>
      </div>
      <div className="w-full rounded-[1rem] bg-[#151a21]/80 backdrop-blur-xl border border-[#44484f]/20 p-6 shadow-2xl">
        {children}
      </div>
      <p className="text-[#8ff5ff] text-sm font-semibold">{instruction}</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onNext}
        className="flex items-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-3 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
        Weiter <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

function HandoffScreen({ from, to, toColor, onContinue }: {
  from: string; to: string; toColor: string; onContinue: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
        style={{ backgroundColor: toColor }}>{getPlayerInitial(to)}</motion.div>
      <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white text-center">
        Gib an {to}
      </h2>
      <p className="text-white/40 text-sm">Andere bitte nicht auf den Bildschirm schauen!</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onContinue}
        className="mt-4 flex items-center gap-2 bg-[#1b2028] border border-[#44484f]/20 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-white/[0.06] transition-colors">
        <Eye className="w-5 h-5" /> Bereit
      </motion.button>
    </motion.div>
  );
}
