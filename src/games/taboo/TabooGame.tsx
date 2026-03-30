import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameTimer } from '../engine/TimerSystem';
import { TABOO_CARDS_DE, type TabooCard } from '../content/taboo-words-de';
import { Play, SkipForward, Trophy, RotateCcw, Users, Timer, Check, X, ArrowRight, MessageCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Team {
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
  players: string[];
  score: number;
}

type CardResult = { card: TabooCard; result: 'correct' | 'taboo' | 'skipped' };

type Phase =
  | 'setup'
  | 'turnStart'
  | 'playing'
  | 'turnSummary'
  | 'gameOver';

/* ------------------------------------------------------------------ */
/*  Buzzer Sound via Web Audio API                                     */
/* ------------------------------------------------------------------ */

const audioCtxRef = { current: null as AudioContext | null };

function playBuzzer() {
  try {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* silent fallback */ }
}

/* ------------------------------------------------------------------ */
/*  Shuffle helper                                                     */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TabooGameProps {
  players: string[];
  onClose?: () => void;
}

export default function TabooGame({ players, onClose }: TabooGameProps) {
  /* ---- Setup state ---- */
  const [timerOption, setTimerOption] = useState(60);
  const [totalRounds, setTotalRounds] = useState(2);

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');
  const [teams, setTeams] = useState<[Team, Team]>(buildTeams(players));
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [explainerIdx, setExplainerIdx] = useState<[number, number]>([0, 0]);
  const [currentRound, setCurrentRound] = useState(1);

  /* ---- Card state ---- */
  const deck = useRef<TabooCard[]>(shuffle(TABOO_CARDS_DE));
  const deckPos = useRef(0);
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [turnResults, setTurnResults] = useState<CardResult[]>([]);
  const [cardKey, setCardKey] = useState(0);

  /* ---- Buzzer flash ---- */
  const [showFlash, setShowFlash] = useState(false);

  /* ---- Countdown ---- */
  const [countdown, setCountdown] = useState<number | null>(null);

  /* ---- Timer ---- */
  const handleTimerExpire = useCallback(() => {
    setPhase('turnSummary');
  }, []);

  const timer = useGameTimer(timerOption, handleTimerExpire);

  /* ---- Derived ---- */
  const activeTeam = teams[activeTeamIdx];
  const explainer = activeTeam.players[explainerIdx[activeTeamIdx]];

  /* ---- Build teams helper ---- */
  function buildTeams(pls: string[]): [Team, Team] {
    const shuffled = shuffle(pls);
    const mid = Math.ceil(shuffled.length / 2);
    return [
      {
        name: 'Team A',
        color: 'bg-[#cf96ff]',
        textColor: 'text-[#cf96ff]',
        borderColor: 'border-[#cf96ff]',
        players: shuffled.slice(0, mid),
        score: 0,
      },
      {
        name: 'Team B',
        color: 'bg-[#00e3fd]',
        textColor: 'text-[#00e3fd]',
        borderColor: 'border-[#00e3fd]',
        players: shuffled.slice(mid),
        score: 0,
      },
    ];
  }

  /* ---- Next card ---- */
  function drawCard(): TabooCard {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(TABOO_CARDS_DE);
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Start turn (with 3-2-1 countdown) ---- */
  function startTurn() {
    setTurnResults([]);
    setCountdown(3);
  }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setCurrentCard(drawCard());
      setCardKey((k) => k + 1);
      timer.reset(timerOption);
      timer.start();
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  /* ---- Card actions ---- */
  function handleCorrect() {
    if (!currentCard) return;
    setTurnResults((r) => [...r, { card: currentCard, result: 'correct' }]);
    setCurrentCard(drawCard());
    setCardKey((k) => k + 1);
  }

  function handleTaboo() {
    if (!currentCard) return;
    playBuzzer();
    navigator.vibrate?.([300]);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 350);
    setTurnResults((r) => [...r, { card: currentCard, result: 'taboo' }]);
    setCurrentCard(drawCard());
    setCardKey((k) => k + 1);
  }

  function handleSkip() {
    if (!currentCard) return;
    setTurnResults((r) => [...r, { card: currentCard, result: 'skipped' }]);
    setCurrentCard(drawCard());
    setCardKey((k) => k + 1);
  }

  /* ---- End turn: tally and switch ---- */
  function endTurn() {
    const correct = turnResults.filter((r) => r.result === 'correct').length;
    const taboo = turnResults.filter((r) => r.result === 'taboo').length;
    const points = correct - taboo;

    setTeams((prev) => {
      const copy: [Team, Team] = [{ ...prev[0] }, { ...prev[1] }];
      copy[activeTeamIdx].score += points;
      return copy;
    });

    setExplainerIdx((prev) => {
      const copy: [number, number] = [...prev];
      copy[activeTeamIdx] = (copy[activeTeamIdx] + 1) % teams[activeTeamIdx].players.length;
      return copy;
    });

    const nextTeamIdx = activeTeamIdx === 0 ? 1 : 0;

    if (nextTeamIdx === 0) {
      if (currentRound >= totalRounds) {
        setPhase('gameOver');
        return;
      }
      setCurrentRound((r) => r + 1);
    }

    setActiveTeamIdx(nextTeamIdx);
    setPhase('turnStart');
  }

  /* ---- Reset game ---- */
  function resetGame() {
    setTeams(buildTeams(players));
    setActiveTeamIdx(0);
    setExplainerIdx([0, 0]);
    setCurrentRound(1);
    setTurnResults([]);
    setCurrentCard(null);
    deck.current = shuffle(TABOO_CARDS_DE);
    deckPos.current = 0;
    timer.reset(timerOption);
    setPhase('setup');
  }

  /* ---- MVP calc ---- */
  const mvp = useMemo(() => {
    const winner = teams[0].score >= teams[1].score ? teams[0] : teams[1];
    return winner.players[0] ?? 'Unbekannt';
  }, [teams]);

  /* ---- Turn score ---- */
  const turnCorrect = turnResults.filter((r) => r.result === 'correct').length;
  const turnTaboo = turnResults.filter((r) => r.result === 'taboo').length;
  const turnSkipped = turnResults.filter((r) => r.result === 'skipped').length;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0d15] text-white flex flex-col">

      {/* ---- TABOO flash overlay ---- */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 bg-red-600/80 flex items-center justify-center pointer-events-none"
          >
            <motion.span
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-6xl font-black text-white"
            >
              TABU!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- SETUP ---- */}
      {phase === 'setup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col px-4 py-8 pb-32 max-w-lg mx-auto w-full"
        >
          {/* Hero Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1rem] bg-[#1f1f29] border border-[#cf96ff]/20 mb-4">
              <MessageCircle className="w-8 h-8 text-[#cf96ff]" />
            </div>
            <h1 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#cf96ff] to-[#cf96ff]/60 bg-clip-text text-transparent">
              Wortverbot
            </h1>
            <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
              Erklaere Begriffe, ohne die verbotenen Woerter zu verwenden!
            </p>
          </div>

          {/* Team Split Display */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {teams.map((t, i) => (
              <div
                key={i}
                className={`rounded-[1rem] bg-[#1f1f29] border p-4 ${
                  i === 0 ? 'border-[#cf96ff]/20' : 'border-[#00e3fd]/20'
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${
                  i === 0 ? 'text-[#cf96ff]' : 'text-[#00e3fd]'
                }`}>
                  {t.name}
                </div>
                <div className="space-y-1.5">
                  {t.players.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#cf96ff]' : 'bg-[#00e3fd]'}`} />
                      <span className="text-sm text-white/70 truncate">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Settings Bento Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Timer Card */}
            <div className="bg-[#1f1f29] border border-white/[0.06] rounded-[1rem] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-[#cf96ff]/70" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Zeit</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[60, 90, 120].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTimerOption(s)}
                    className={`py-2 rounded-full text-xs font-bold transition-all
                      ${timerOption === s
                        ? 'bg-[#cf96ff] text-[#0d0d15] shadow-[0_0_12px_rgba(207,150,255,0.3)]'
                        : 'bg-white/[0.06] text-white/40 hover:bg-white/10'
                      }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds Card */}
            <div className="bg-[#1f1f29] border border-white/[0.06] rounded-[1rem] p-4">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-4 h-4 text-[#cf96ff]/70" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Runden</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    className={`py-2 rounded-full text-xs font-bold transition-all
                      ${totalRounds === r
                        ? 'bg-[#cf96ff] text-[#0d0d15] shadow-[0_0_12px_rgba(207,150,255,0.3)]'
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
            <div className="max-w-lg mx-auto space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setPhase('turnStart'); }}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] text-base font-extrabold font-[Plus_Jakarta_Sans] uppercase tracking-wide shadow-[0_0_30px_rgba(207,150,255,0.25)] flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Spiel starten
              </motion.button>
              {onClose && (
                <button onClick={onClose} className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition">
                  Zurueck
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- TURN START (with countdown) ---- */}
      {phase === 'turnStart' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
        >
          {/* Round badge */}
          <div className="px-4 py-1.5 rounded-full bg-[#1f1f29] border border-white/[0.06]">
            <span className={`text-xs font-bold uppercase tracking-widest ${activeTeam.textColor}`}>
              Runde {currentRound} / {totalRounds}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white">
            {activeTeam.name} ist dran!
          </h2>

          <div className="flex items-center gap-2 px-4 py-2 rounded-[1rem] bg-[#13131b]/80 backdrop-blur-xl border border-white/[0.06]">
            <Users className="w-4 h-4 text-white/40" />
            <span className="font-semibold text-white/70">{explainer}</span>
            <span className="text-white/30 text-sm">erklaert</span>
          </div>

          {/* Score display */}
          <ScoreBar teams={teams} />

          {countdown !== null ? (
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-7xl font-black text-[#cf96ff] drop-shadow-[0_0_20px_rgba(207,150,255,0.5)]"
            >
              {countdown}
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startTurn}
              className="mt-2 flex items-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] px-8 py-3 rounded-full font-extrabold text-lg shadow-[0_0_25px_rgba(207,150,255,0.25)]"
            >
              <Play className="w-5 h-5" /> Los geht's!
            </motion.button>
          )}
        </motion.div>
      )}

      {/* ---- PLAYING ---- */}
      {phase === 'playing' && currentCard && (
        <div className="flex-1 flex flex-col">
          {/* Timer bar */}
          <div className="h-1 bg-white/[0.04]">
            <motion.div
              className={`h-full ${timer.percentLeft > 25 ? 'bg-gradient-to-r from-[#cf96ff] to-[#a855f7]' : 'bg-red-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${timer.percentLeft}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header: score + timer */}
          <div className="flex items-center justify-between px-4 py-3">
            <ScoreBar teams={teams} compact />
            <div className={`px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] text-lg font-mono font-bold ${timer.timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
              {timer.timeLeft}s
            </div>
          </div>

          {/* Card */}
          <div className="flex-1 flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={cardKey}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm rounded-[1rem] bg-[#13131b]/80 backdrop-blur-xl border border-white/[0.06] p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Gradient top border */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#cf96ff] via-[#a855f7] to-[#cf96ff]" />

                {/* Term */}
                <div className="text-center mb-6 pt-2">
                  <div className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-white leading-tight">
                    {currentCard.term}
                  </div>
                </div>

                {/* Forbidden words as badges */}
                <div className="flex flex-col gap-2">
                  {currentCard.forbidden.map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-red-500/[0.08] border border-red-500/20 rounded-[1rem] px-4 py-2.5"
                    >
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-red-300 font-bold text-base">{word}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-4 pb-6 pt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCorrect}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Check className="w-5 h-5" /> Richtig!
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTaboo}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 rounded-full py-4 font-black text-base text-white shadow-[0_0_25px_rgba(239,68,68,0.3)] border-2 border-red-400 animate-[pulse_2s_ease-in-out_infinite]"
            >
              TABU!
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="flex-none flex items-center justify-center bg-[#1f1f29] border border-white/[0.06] rounded-full py-4 px-5 text-white/40"
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* ---- TURN SUMMARY ---- */}
      {phase === 'turnSummary' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white">Zeit abgelaufen!</h2>
          <div className={`px-4 py-1.5 rounded-full bg-[#1f1f29] border border-white/[0.06] text-sm font-bold ${activeTeam.textColor}`}>
            {activeTeam.name}
          </div>

          {/* Stats cards */}
          <div className="flex gap-3 w-full">
            <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#00e3fd] text-center">
              <div className="text-3xl font-black text-[#00e3fd]">{turnCorrect}</div>
              <div className="text-xs text-white/40 mt-1">Richtig</div>
            </div>
            <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-[#ff7350] text-center">
              <div className="text-3xl font-black text-[#ff7350]">{turnTaboo}</div>
              <div className="text-xs text-white/40 mt-1">Tabu</div>
            </div>
            <div className="flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border-l-4 border-white/20 text-center">
              <div className="text-3xl font-black text-white/30">{turnSkipped}</div>
              <div className="text-xs text-white/40 mt-1">Übersprungen</div>
            </div>
          </div>

          <div className="text-lg font-bold">
            Punkte: <span className={turnCorrect - turnTaboo >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {turnCorrect - turnTaboo >= 0 ? '+' : ''}{turnCorrect - turnTaboo}
            </span>
          </div>

          {/* Card results list */}
          <div className="w-full max-h-48 overflow-y-auto space-y-1.5">
            {turnResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#1f1f29] border border-white/[0.04] rounded-[1rem] px-4 py-2.5 text-sm">
                {r.result === 'correct' && <Check className="w-4 h-4 text-emerald-400" />}
                {r.result === 'taboo' && <X className="w-4 h-4 text-red-400" />}
                {r.result === 'skipped' && <ArrowRight className="w-4 h-4 text-white/30" />}
                <span className="text-white/70">{r.card.term}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={endTurn}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_25px_rgba(207,150,255,0.25)]"
          >
            Weiter <ArrowRight className="w-5 h-5" />
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
          {/* Celebration header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Spielende!
          </h2>

          {/* Winner */}
          {teams[0].score !== teams[1].score ? (
            <div className={`px-6 py-2 rounded-full bg-[#1f1f29] border text-lg font-bold ${
              teams[0].score > teams[1].score
                ? 'border-[#cf96ff]/30 text-[#cf96ff]'
                : 'border-[#00e3fd]/30 text-[#00e3fd]'
            }`}>
              {teams[0].score > teams[1].score ? teams[0].name : teams[1].name} gewinnt!
            </div>
          ) : (
            <div className="px-6 py-2 rounded-full bg-[#1f1f29] border border-white/10 text-lg font-bold text-white/60">
              Unentschieden!
            </div>
          )}

          {/* Final scores */}
          <div className="flex gap-6 w-full max-w-xs">
            {teams.map((t, i) => (
              <div key={i} className={`flex-1 p-4 rounded-[1rem] bg-[#1f1f29] border text-center ${
                i === 0 ? 'border-[#cf96ff]/20' : 'border-[#00e3fd]/20'
              } ${teams[0].score > teams[1].score && i === 0 || teams[1].score > teams[0].score && i === 1
                ? 'shadow-[0_0_20px_rgba(207,150,255,0.1)]' : ''
              }`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${t.textColor}`}>{t.name}</div>
                <div className="text-4xl font-black text-white">{t.score}</div>
              </div>
            ))}
          </div>

          {/* MVP */}
          <div className="text-sm text-white/40">
            MVP: <span className="text-white/70 font-semibold">{mvp}</span>
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] py-4 rounded-full font-extrabold text-base shadow-[0_0_25px_rgba(207,150,255,0.25)]"
            >
              <RotateCcw className="w-4 h-4" /> Nochmal
            </motion.button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
              >
                Anderes Spiel
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Bar sub-component                                            */
/* ------------------------------------------------------------------ */

function ScoreBar({ teams, compact }: { teams: [Team, Team]; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full bg-[#1f1f29] border border-white/[0.06] ${compact ? '' : 'mt-2'}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#cf96ff]" />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#cf96ff]`}>{teams[0].score}</span>
      </div>
      <span className="text-white/20 text-xs">vs</span>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#00e3fd]" />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#00e3fd]`}>{teams[1].score}</span>
      </div>
    </div>
  );
}
