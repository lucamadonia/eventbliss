import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameTimer } from '../engine/TimerSystem';
import { TABOO_CARDS_DE, type TabooCard } from '../content/taboo-words-de';
import { Play, SkipForward, Trophy, RotateCcw, Users, Timer, Check, X, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Team {
  name: string;
  color: string;        // tailwind bg class
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
        color: 'bg-violet-600',
        textColor: 'text-violet-400',
        borderColor: 'border-violet-500',
        players: shuffled.slice(0, mid),
        score: 0,
      },
      {
        name: 'Team B',
        color: 'bg-cyan-600',
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500',
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

    /* advance explainer */
    setExplainerIdx((prev) => {
      const copy: [number, number] = [...prev];
      copy[activeTeamIdx] = (copy[activeTeamIdx] + 1) % teams[activeTeamIdx].players.length;
      return copy;
    });

    const nextTeamIdx = activeTeamIdx === 0 ? 1 : 0;

    /* If both teams have played this round, advance round */
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
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-gray-950 via-purple-950/40 to-gray-950 text-white flex flex-col">

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
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8"
        >
          <h1 className="text-3xl font-black tracking-tight">Wortverbot</h1>
          <p className="text-white/60 text-sm text-center max-w-xs">
            Erklaere Begriffe, ohne die verbotenen Woerter zu verwenden!
          </p>

          {/* Teams preview */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {teams.map((t, i) => (
              <div
                key={i}
                className={`rounded-xl border ${i === 0 ? 'border-violet-500/50' : 'border-cyan-500/50'} bg-white/5 backdrop-blur p-3`}
              >
                <div className={`text-xs font-bold mb-2 ${i === 0 ? 'text-violet-400' : 'text-cyan-400'}`}>
                  {t.name}
                </div>
                {t.players.map((p) => (
                  <div key={p} className="text-sm text-white/80 truncate">{p}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Timer select */}
          <div className="flex items-center gap-3">
            <Timer className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/60">Zeit pro Runde:</span>
            {[60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => setTimerOption(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  timerOption === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>

          {/* Rounds select */}
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/60">Runden:</span>
            {[1, 2, 3, 4].map((r) => (
              <button
                key={r}
                onClick={() => setTotalRounds(r)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  totalRounds === r
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setPhase('turnStart'); }}
            className="mt-4 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition px-8 py-3 rounded-2xl font-bold text-lg shadow-lg shadow-violet-600/30"
          >
            <Play className="w-5 h-5" /> Spiel starten
          </button>

          {onClose && (
            <button onClick={onClose} className="text-white/40 text-sm hover:text-white/60 transition">
              Zurueck
            </button>
          )}
        </motion.div>
      )}

      {/* ---- TURN START (with countdown) ---- */}
      {phase === 'turnStart' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
        >
          <div className={`text-sm font-bold uppercase tracking-widest ${activeTeam.textColor}`}>
            Runde {currentRound} / {totalRounds}
          </div>
          <h2 className="text-2xl font-black">{activeTeam.name} ist dran!</h2>
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{explainer}</span> erklaert
          </div>

          {/* Score display */}
          <ScoreBar teams={teams} />

          {countdown !== null ? (
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-7xl font-black text-violet-400"
            >
              {countdown}
            </motion.div>
          ) : (
            <button
              onClick={startTurn}
              className={`mt-2 flex items-center gap-2 ${activeTeam.color} hover:opacity-90 transition px-8 py-3 rounded-2xl font-bold text-lg shadow-lg`}
            >
              <Play className="w-5 h-5" /> Los geht's!
            </button>
          )}
        </motion.div>
      )}

      {/* ---- PLAYING ---- */}
      {phase === 'playing' && currentCard && (
        <div className="flex-1 flex flex-col">
          {/* Timer bar */}
          <div className="h-1.5 bg-white/10">
            <motion.div
              className={`h-full ${timer.percentLeft > 25 ? 'bg-violet-500' : 'bg-red-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${timer.percentLeft}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header: score + timer */}
          <div className="flex items-center justify-between px-4 py-2">
            <ScoreBar teams={teams} compact />
            <div className={`text-xl font-mono font-bold ${timer.timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
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
                className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
              >
                {/* Term */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-black text-white leading-tight">
                    {currentCard.term}
                  </div>
                </div>

                {/* Forbidden words */}
                <div className="flex flex-col gap-2">
                  {currentCard.forbidden.map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-red-600/20 border border-red-500/40 rounded-xl px-4 py-2"
                    >
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-red-300 font-semibold text-lg">{word}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-4 pb-6 pt-3">
            <button
              onClick={handleCorrect}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition rounded-2xl py-4 font-bold text-lg shadow-lg shadow-emerald-600/20"
            >
              <Check className="w-5 h-5" /> Richtig!
            </button>

            <button
              onClick={handleTaboo}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 transition rounded-2xl py-4 font-black text-lg shadow-lg shadow-red-600/30 border-2 border-red-400 animate-[pulse_2s_ease-in-out_infinite]"
            >
              TABU!
            </button>

            <button
              onClick={handleSkip}
              className="flex-none flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 transition rounded-2xl py-4 px-4 text-sm text-white/70"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- TURN SUMMARY ---- */}
      {phase === 'turnSummary' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8"
        >
          <h2 className="text-2xl font-black">Zeit abgelaufen!</h2>
          <div className={`text-sm font-bold ${activeTeam.textColor}`}>{activeTeam.name}</div>

          {/* Stats row */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-emerald-400">{turnCorrect}</div>
              <div className="text-xs text-white/50">Richtig</div>
            </div>
            <div>
              <div className="text-3xl font-black text-red-400">{turnTaboo}</div>
              <div className="text-xs text-white/50">Tabu</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white/40">{turnSkipped}</div>
              <div className="text-xs text-white/50">Uebersprungen</div>
            </div>
          </div>

          <div className="text-lg font-bold">
            Punkte: <span className={turnCorrect - turnTaboo >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {turnCorrect - turnTaboo >= 0 ? '+' : ''}{turnCorrect - turnTaboo}
            </span>
          </div>

          {/* Card results list */}
          <div className="w-full max-w-sm max-h-48 overflow-y-auto space-y-1">
            {turnResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-sm">
                {r.result === 'correct' && <Check className="w-4 h-4 text-emerald-400" />}
                {r.result === 'taboo' && <X className="w-4 h-4 text-red-400" />}
                {r.result === 'skipped' && <ArrowRight className="w-4 h-4 text-white/40" />}
                <span className="text-white/80">{r.card.term}</span>
              </div>
            ))}
          </div>

          <button
            onClick={endTurn}
            className={`mt-2 flex items-center gap-2 ${activeTeam.color} hover:opacity-90 transition px-8 py-3 rounded-2xl font-bold text-lg shadow-lg`}
          >
            Weiter <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8"
        >
          <Trophy className="w-12 h-12 text-yellow-400" />
          <h2 className="text-3xl font-black">Spielende!</h2>

          {/* Winner */}
          {teams[0].score !== teams[1].score ? (
            <div className={`text-xl font-bold ${teams[0].score > teams[1].score ? teams[0].textColor : teams[1].textColor}`}>
              {teams[0].score > teams[1].score ? teams[0].name : teams[1].name} gewinnt!
            </div>
          ) : (
            <div className="text-xl font-bold text-white/70">Unentschieden!</div>
          )}

          {/* Final scores */}
          <div className="flex gap-8">
            {teams.map((t, i) => (
              <div key={i} className="text-center">
                <div className={`text-sm font-bold ${t.textColor}`}>{t.name}</div>
                <div className="text-5xl font-black mt-1">{t.score}</div>
              </div>
            ))}
          </div>

          {/* MVP */}
          <div className="text-sm text-white/50">
            MVP: <span className="text-white/80 font-semibold">{mvp}</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition px-6 py-3 rounded-2xl font-bold shadow-lg shadow-violet-600/30"
            >
              <RotateCcw className="w-4 h-4" /> Nochmal
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-6 py-3 rounded-2xl font-bold"
              >
                Beenden
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
    <div className={`flex items-center gap-3 ${compact ? '' : 'mt-2'}`}>
      <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-full ${teams[0].color}`} />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-violet-400`}>{teams[0].score}</span>
      </div>
      <span className="text-white/30 text-xs">vs</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-full ${teams[1].color}`} />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-cyan-400`}>{teams[1].score}</span>
      </div>
    </div>
  );
}
