import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Minus, User, Play, Eye, EyeOff, ChevronRight,
  Clock, CheckCircle2, Trophy, ArrowLeft, RotateCcw,
  Shield, AlertTriangle, Crown, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase =
  | 'setup'
  | 'wordReveal'
  | 'discussion'
  | 'voting'
  | 'revealCountdown'
  | 'reveal'
  | 'bonusGuess'
  | 'results';

interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  hasSpoken: boolean;
  votedFor: string | null;
  score: number;
}

interface WordSet {
  category: string;
  word: string;
}

// ---------------------------------------------------------------------------
// Word Sets
// ---------------------------------------------------------------------------

const WORD_SETS: WordSet[] = [
  { category: 'Tiere', word: 'Elefant' },
  { category: 'Tiere', word: 'Pinguin' },
  { category: 'Tiere', word: 'Delfin' },
  { category: 'Essen', word: 'Pizza' },
  { category: 'Essen', word: 'Sushi' },
  { category: 'Essen', word: 'Schnitzel' },
  { category: 'Länder', word: 'Japan' },
  { category: 'Länder', word: 'Brasilien' },
  { category: 'Länder', word: 'Ägypten' },
  { category: 'Berufe', word: 'Feuerwehrmann' },
  { category: 'Berufe', word: 'Astronaut' },
  { category: 'Berufe', word: 'Detektiv' },
  { category: 'Filme', word: 'Titanic' },
  { category: 'Filme', word: 'Matrix' },
  { category: 'Filme', word: 'König der Löwen' },
  { category: 'Sport', word: 'Fußball' },
  { category: 'Sport', word: 'Surfen' },
  { category: 'Orte', word: 'Strand' },
  { category: 'Orte', word: 'Bibliothek' },
  { category: 'Orte', word: 'Freizeitpark' },
  { category: 'Musik', word: 'Klavier' },
  { category: 'Musik', word: 'Schlagzeug' },
  { category: 'Fahrzeuge', word: 'U-Boot' },
  { category: 'Fahrzeuge', word: 'Heißluftballon' },
  { category: 'Kleidung', word: 'Smoking' },
  { category: 'Natur', word: 'Vulkan' },
  { category: 'Natur', word: 'Regenbogen' },
  { category: 'Feiertage', word: 'Silvester' },
  { category: 'Getränke', word: 'Cappuccino' },
  { category: 'Spiele', word: 'Schach' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function createPlayer(name: string): Player {
  return {
    id: `p-${nextId++}`,
    name,
    isImpostor: false,
    hasSpoken: false,
    votedFor: null,
    score: 0,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImpostorGame() {
  // --- Setup state ---
  const [players, setPlayers] = useState<Player[]>(() => [
    createPlayer('Spieler 1'),
    createPlayer('Spieler 2'),
    createPlayer('Spieler 3'),
    createPlayer('Spieler 4'),
  ]);
  const [impostorCount, setImpostorCount] = useState(1);
  const [timerDuration, setTimerDuration] = useState(90);

  // --- Game state ---
  const [phase, setPhase] = useState<Phase>('setup');
  const [currentWordSet, setCurrentWordSet] = useState<WordSet | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [votingPlayer, setVotingPlayer] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [bonusGuess, setBonusGuess] = useState('');
  const [bonusResult, setBonusResult] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Derived ---
  const impostors = useMemo(() => players.filter((p) => p.isImpostor), [players]);
  const villagers = useMemo(() => players.filter((p) => !p.isImpostor), [players]);

  const voteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    players.forEach((p) => {
      if (p.votedFor) tally[p.votedFor] = (tally[p.votedFor] || 0) + 1;
    });
    return tally;
  }, [players]);

  const mostVotedId = useMemo(() => {
    let maxVotes = 0;
    let maxId = '';
    Object.entries(voteTally).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        maxId = id;
      }
    });
    return maxId;
  }, [voteTally]);

  const mostVotedPlayer = players.find((p) => p.id === mostVotedId);
  const impostorCaught = mostVotedPlayer?.isImpostor ?? false;

  // --- Player management ---
  const addPlayer = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length >= 15) return prev;
      return [...prev, createPlayer(`Spieler ${prev.length + 1}`)];
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 4) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateName = useCallback((id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // --- Start game ---
  const startGame = useCallback(() => {
    const wordSet = pickRandom(WORD_SETS);
    setCurrentWordSet(wordSet);

    const shuffledIndices = shuffle(players.map((_, i) => i));
    const impostorIndices = new Set(shuffledIndices.slice(0, impostorCount));

    setPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        isImpostor: impostorIndices.has(i),
        hasSpoken: false,
        votedFor: null,
      }))
    );

    setRevealIndex(0);
    setWordVisible(false);
    setPhase('wordReveal');
  }, [players, impostorCount]);

  // --- Discussion timer ---
  useEffect(() => {
    if (phase !== 'discussion') return;
    setTimeLeft(timerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('voting');
          setVotingPlayer(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timerDuration]);

  // --- Reveal countdown ---
  useEffect(() => {
    if (phase !== 'revealCountdown') return;
    setCountdownNum(3);
    const timer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('reveal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // --- Word reveal navigation ---
  const handleRevealTap = () => {
    if (wordVisible) {
      setWordVisible(false);
      if (revealIndex < players.length - 1) {
        setRevealIndex((i) => i + 1);
      } else {
        setPhase('discussion');
        setCurrentSpeaker(0);
      }
    } else {
      setWordVisible(true);
    }
  };

  // --- Mark spoken ---
  const markSpoken = (index: number) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, hasSpoken: true } : p))
    );
    if (index < players.length - 1) {
      setCurrentSpeaker(index + 1);
    }
  };

  // --- Skip to voting ---
  const skipToVoting = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('voting');
    setVotingPlayer(0);
  };

  // --- Cast vote ---
  const castVote = (targetId: string) => {
    const voter = players[votingPlayer];
    if (targetId === voter.id) return;

    setPlayers((prev) =>
      prev.map((p, i) => (i === votingPlayer ? { ...p, votedFor: targetId } : p))
    );

    if (votingPlayer < players.length - 1) {
      setVotingPlayer((i) => i + 1);
    } else {
      setTimeout(() => setPhase('revealCountdown'), 300);
    }
  };

  // --- Score calculation ---
  const calculateScores = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => {
        let points = p.score;
        if (impostorCaught) {
          if (!p.isImpostor) points += 10;
        } else {
          if (p.isImpostor) points += 15;
        }
        return { ...p, score: points };
      })
    );
  }, [impostorCaught]);

  // --- Bonus guess ---
  const submitBonusGuess = () => {
    const correct =
      bonusGuess.trim().toLowerCase() === currentWordSet?.word.toLowerCase();
    setBonusResult(correct);
    if (correct) {
      setPlayers((prev) =>
        prev.map((p) => (p.isImpostor ? { ...p, score: p.score + 10 } : p))
      );
    }
    setTimeout(() => setPhase('results'), 1500);
  };

  // --- Move to bonus or results after reveal ---
  const proceedFromReveal = () => {
    calculateScores();
    if (!impostorCaught && impostors.length > 0) {
      setBonusGuess('');
      setBonusResult(null);
      setPhase('bonusGuess');
    } else {
      setPhase('results');
    }
  };

  // --- New round ---
  const newRound = () => {
    setRound((r) => r + 1);
    setPhase('setup');
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        isImpostor: false,
        hasSpoken: false,
        votedFor: null,
      }))
    );
    setCurrentWordSet(null);
    setBonusGuess('');
    setBonusResult(null);
  };

  const resetGame = () => {
    setRound(1);
    setPhase('setup');
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        isImpostor: false,
        hasSpoken: false,
        votedFor: null,
        score: 0,
      }))
    );
    setCurrentWordSet(null);
    setBonusGuess('');
    setBonusResult(null);
  };

  const canStart = players.length >= 4 && players.every((p) => p.name.trim());

  // --- Format timer ---
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  // --- SETUP ---
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#0d0d15] px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          <motion.h1
            className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Hochstapler
          </motion.h1>
          <p className="text-center text-gray-400 text-sm">
            Finde den Hochstapler unter euch!
          </p>

          {round > 1 && (
            <div className="text-center text-xs text-purple-400 font-semibold">
              Runde {round}
            </div>
          )}

          {/* Player list */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Spieler ({players.length})
            </h2>
            <AnimatePresence initial={false}>
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: getPlayerColor(i) }}
                  >
                    {player.name ? getPlayerInitial(player.name) : <User className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updateName(player.id, e.target.value)}
                    placeholder={`Spieler ${i + 1}`}
                    maxLength={20}
                    className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                  {players.length > 4 && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length < 15 && (
              <motion.button
                onClick={addPlayer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors text-sm"
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                Spieler hinzufügen
              </motion.button>
            )}
          </section>

          {/* Impostor count */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Hochstapler
            </h2>
            <div className="flex gap-3">
              {[1, 2].map((n) => (
                <motion.button
                  key={n}
                  onClick={() => setImpostorCount(n)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors',
                    impostorCount === n
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                      : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  {n} {n === 1 ? 'Hochstapler' : 'Hochstapler'}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Timer */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Diskussionszeit
            </h2>
            <div className="flex gap-3">
              {[60, 90, 120].map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setTimerDuration(t)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors',
                    timerDuration === t
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  {t}s
                </motion.button>
              ))}
            </div>
          </section>

          {/* Start */}
          <motion.button
            onClick={startGame}
            disabled={!canStart}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
              canStart
                ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            )}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            <Play className="w-5 h-5" />
            Spiel starten!
          </motion.button>
        </div>
      </div>
    );
  }

  // --- WORD REVEAL ---
  if (phase === 'wordReveal') {
    const currentPlayer = players[revealIndex];
    return (
      <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-8">
          <AnimatePresence mode="wait">
            {!wordVisible ? (
              <motion.div
                key={`pass-${revealIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <Shield className="w-16 h-16 text-purple-400 opacity-60" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    {revealIndex + 1} / {players.length}
                  </p>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Gib das Handy an
                  </h2>
                  <p
                    className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  >
                    {currentPlayer.name}
                  </p>
                </div>
                <motion.button
                  onClick={handleRevealTap}
                  className="w-full py-4 rounded-2xl bg-gray-800/80 border border-gray-700 text-white font-semibold flex items-center justify-center gap-2 hover:bg-gray-700/80 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <Eye className="w-5 h-5" />
                  Antippen zum Aufdecken
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key={`word-${revealIndex}`}
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="space-y-6"
              >
                {currentPlayer.isImpostor ? (
                  <div className="space-y-4">
                    <motion.div
                      animate={{ x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      <AlertTriangle className="w-20 h-20 text-red-500 mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
                    </motion.div>
                    <motion.p
                      className="text-4xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      HOCHSTAPLER!
                    </motion.p>
                    <p className="text-gray-400 text-sm">
                      Du kennst das Wort nicht. Falle nicht auf!
                    </p>
                    <p className="text-gray-500 text-xs">
                      Kategorie: {currentWordSet?.category}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">
                      {currentWordSet?.category}
                    </p>
                    <p className="text-5xl font-black text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                      {currentWordSet?.word}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Merke dir das Wort!
                    </p>
                  </div>
                )}
                <motion.button
                  onClick={handleRevealTap}
                  className="w-full py-4 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-semibold flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <EyeOff className="w-5 h-5" />
                  Verstanden &mdash; Weitergeben
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- DISCUSSION ---
  if (phase === 'discussion') {
    const urgency = timeLeft <= 10;
    return (
      <div className="min-h-screen bg-[#0d0d15] px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Timer */}
          <motion.div
            className={cn(
              'text-center py-4 rounded-2xl border',
              urgency
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-purple-500/30 bg-purple-500/5'
            )}
            animate={urgency ? { scale: [1, 1.02, 1] } : {}}
            transition={urgency ? { repeat: Infinity, duration: 0.5 } : {}}
          >
            <Clock className={cn('w-6 h-6 mx-auto mb-1', urgency ? 'text-red-400' : 'text-purple-400')} />
            <p className={cn('text-4xl font-black', urgency ? 'text-red-400' : 'text-white')}>
              {formatTime(timeLeft)}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Kategorie: <span className="text-purple-400">{currentWordSet?.category}</span>
            </p>
          </motion.div>

          {/* Speaker list */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Jeder sagt etwas zum Wort
            </h2>
            {players.map((player, i) => (
              <motion.button
                key={player.id}
                onClick={() => !player.hasSpoken && markSpoken(i)}
                disabled={player.hasSpoken}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                  i === currentSpeaker && !player.hasSpoken
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/50'
                    : player.hasSpoken
                      ? 'border-gray-700/30 bg-gray-800/20 opacity-60'
                      : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600'
                )}
                layout
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: getPlayerColor(i) }}
                >
                  {getPlayerInitial(player.name)}
                </div>
                <span className="flex-1 text-white font-medium text-sm">
                  {player.name}
                </span>
                {player.hasSpoken ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : i === currentSpeaker ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                  </motion.div>
                ) : null}
              </motion.button>
            ))}
          </section>

          {/* Skip button */}
          <motion.button
            onClick={skipToVoting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.3)]"
            whileTap={{ scale: 0.97 }}
          >
            Zur Abstimmung
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // --- VOTING ---
  if (phase === 'voting') {
    const voter = players[votingPlayer];
    return (
      <div className="min-h-screen bg-[#0d0d15] px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center space-y-1">
            <p className="text-gray-400 text-sm">
              {votingPlayer + 1} / {players.length}
            </p>
            <h2 className="text-xl font-bold text-white">
              {voter.name} stimmt ab
            </h2>
            <p className="text-gray-400 text-xs">
              Wer ist der Hochstapler?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {players.map((target, i) => {
              const isSelf = target.id === voter.id;
              return (
                <motion.button
                  key={target.id}
                  onClick={() => !isSelf && castVote(target.id)}
                  disabled={isSelf}
                  className={cn(
                    'relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all',
                    isSelf
                      ? 'border-gray-800 bg-gray-900/50 opacity-30 cursor-not-allowed'
                      : 'border-gray-700 bg-gray-800/40 hover:border-pink-500/60 hover:bg-pink-500/5 active:scale-95'
                  )}
                  whileHover={!isSelf ? { scale: 1.03 } : {}}
                  whileTap={!isSelf ? { scale: 0.95 } : {}}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: getPlayerColor(i) }}
                  >
                    {getPlayerInitial(target.name)}
                  </div>
                  <span className="text-white font-semibold text-sm truncate max-w-full">
                    {target.name}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] text-gray-500">(Du)</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- REVEAL COUNTDOWN ---
  if (phase === 'revealCountdown') {
    return (
      <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={countdownNum}
            className="text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {countdownNum}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  // --- REVEAL ---
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen bg-[#0d0d15] px-4 py-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Result banner */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className={cn(
              'py-6 px-4 rounded-3xl border-2',
              impostorCaught
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-red-500/50 bg-red-500/10'
            )}
          >
            <motion.p
              className={cn(
                'text-3xl font-black mb-2',
                impostorCaught ? 'text-green-400' : 'text-red-400'
              )}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: 3, duration: 0.4 }}
            >
              {impostorCaught ? 'HOCHSTAPLER ENTLARVT!' : 'HOCHSTAPLER ÜBERLEBT!'}
            </motion.p>
            <p className="text-gray-300 text-sm">
              {impostorCaught
                ? 'Gut gemacht! Ihr habt den Hochstapler gefunden.'
                : 'Der Hochstapler hat euch getäuscht!'}
            </p>
          </motion.div>

          {/* Most voted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Meiste Stimmen
            </p>
            {mostVotedPlayer && (
              <div className="flex items-center justify-center gap-3">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4',
                    mostVotedPlayer.isImpostor ? 'ring-red-500/60' : 'ring-green-500/60'
                  )}
                  style={{ backgroundColor: getPlayerColor(players.indexOf(mostVotedPlayer)) }}
                >
                  {getPlayerInitial(mostVotedPlayer.name)}
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{mostVotedPlayer.name}</p>
                  <p className={cn('text-sm font-semibold', mostVotedPlayer.isImpostor ? 'text-red-400' : 'text-green-400')}>
                    {mostVotedPlayer.isImpostor ? 'War der Hochstapler!' : 'War KEIN Hochstapler!'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Real impostors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              {impostors.length === 1 ? 'Der Hochstapler war' : 'Die Hochstapler waren'}
            </p>
            <div className="flex justify-center gap-3">
              {impostors.map((imp) => (
                <div key={imp.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-xl">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: getPlayerColor(players.indexOf(imp)) }}
                  >
                    {getPlayerInitial(imp.name)}
                  </div>
                  <span className="text-red-400 font-semibold text-sm">{imp.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* The real word */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Das Wort war</p>
            <p className="text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {currentWordSet?.word}
            </p>
            <p className="text-purple-400 text-xs mt-1">{currentWordSet?.category}</p>
          </motion.div>

          {/* Continue */}
          <motion.button
            onClick={proceedFromReveal}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Weiter
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // --- BONUS GUESS ---
  if (phase === 'bonusGuess') {
    return (
      <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Crown className="w-12 h-12 text-yellow-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">
              Bonusrunde!
            </h2>
            <p className="text-gray-400 text-sm">
              {impostors.map((i) => i.name).join(' & ')}: Könnt ihr das Wort erraten?
            </p>
            <p className="text-purple-400 text-xs">
              Kategorie: {currentWordSet?.category}
            </p>
          </motion.div>

          {bonusResult === null ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <input
                type="text"
                value={bonusGuess}
                onChange={(e) => setBonusGuess(e.target.value)}
                placeholder="Wort eingeben..."
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                onKeyDown={(e) => e.key === 'Enter' && bonusGuess.trim() && submitBonusGuess()}
              />
              <motion.button
                onClick={submitBonusGuess}
                disabled={!bonusGuess.trim()}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2',
                  bonusGuess.trim()
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                )}
                whileTap={bonusGuess.trim() ? { scale: 0.97 } : {}}
              >
                <Send className="w-5 h-5" />
                Raten!
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'py-6 px-4 rounded-2xl border-2',
                bonusResult
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-gray-600 bg-gray-800/40'
              )}
            >
              <p className={cn('text-2xl font-black', bonusResult ? 'text-yellow-400' : 'text-gray-400')}>
                {bonusResult ? 'RICHTIG! +10 Punkte!' : 'Leider falsch!'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-[#0d0d15] px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider">Rangliste</p>
          </motion.div>

          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  i === 0
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-gray-800/40 border-gray-700/50'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="w-8 flex items-center justify-center">
                  {i === 0 ? (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">{i + 1}</span>
                  )}
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: getPlayerColor(players.indexOf(player)) }}
                >
                  {getPlayerInitial(player.name)}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">
                  {player.name}
                </span>
                {player.isImpostor && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                    Hochstapler
                  </span>
                )}
                <span className="text-sm font-bold text-gray-300 min-w-[40px] text-right">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex gap-3 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={resetGame}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-semibold flex items-center justify-center gap-2 hover:border-gray-500 transition-colors text-sm"
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw className="w-4 h-4" />
              Neu starten
            </motion.button>
            <motion.button
              onClick={newRound}
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-4 h-4" />
              Nochmal!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
