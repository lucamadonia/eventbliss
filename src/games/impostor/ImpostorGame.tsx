import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Plus, Minus, User, Play, Eye, EyeOff, ChevronRight,
  Clock, CheckCircle2, Trophy, ArrowLeft, RotateCcw,
  Shield, AlertTriangle, Crown, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { getActivePartySession } from "@/hooks/usePartySession";

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

// Word sets loaded from dedicated content file (100+ words, multilingual)
import {
  IMPOSTOR_WORDS_DE, IMPOSTOR_WORDS_EN, IMPOSTOR_WORDS_ES, IMPOSTOR_WORDS_FR,
  IMPOSTOR_WORDS_IT, IMPOSTOR_WORDS_NL, IMPOSTOR_WORDS_PL, IMPOSTOR_WORDS_PT,
  IMPOSTOR_WORDS_TR, IMPOSTOR_WORDS_AR,
} from './impostor-words';
import i18n from 'i18next';

function getWordSets(): WordSet[] {
  const lang = i18n.language?.split('-')[0] || 'de';
  const map: Record<string, WordSet[]> = {
    de: IMPOSTOR_WORDS_DE, en: IMPOSTOR_WORDS_EN, es: IMPOSTOR_WORDS_ES,
    fr: IMPOSTOR_WORDS_FR, it: IMPOSTOR_WORDS_IT, nl: IMPOSTOR_WORDS_NL,
    pl: IMPOSTOR_WORDS_PL, pt: IMPOSTOR_WORDS_PT, tr: IMPOSTOR_WORDS_TR,
    ar: IMPOSTOR_WORDS_AR,
  };
  return map[lang] || map.de;
}

const WORD_SETS = IMPOSTOR_WORDS_DE; // fallback for type inference

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

export default function ImpostorGame({ online }: { online?: OnlineGameProps }) {
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  const partyPlayerNames = getActivePartySession()?.players?.map(p => p.name) ?? [];
  const resolvedNames = onlinePlayerNames.length >= 4
    ? onlinePlayerNames
    : partyPlayerNames.length >= 4
      ? partyPlayerNames
      : [];
  // --- Setup state ---
  const [players, setPlayers] = useState<Player[]>(() =>
    resolvedNames.length >= 4
      ? resolvedNames.map(name => createPlayer(name))
      : [
          createPlayer('Spieler 1'),
          createPlayer('Spieler 2'),
          createPlayer('Spieler 3'),
          createPlayer('Spieler 4'),
        ]
  );
  const [impostorCount, setImpostorCount] = useState(1);
  const [timerDuration, setTimerDuration] = useState(90);

  // --- Game state ---
  const [phase, setPhase] = useState<Phase>('setup');
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
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

  useTVGameBridge('impostor', { phase, round, players }, [phase, round]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Online sync ---
  useEffect(() => {
    if (!online) return;
    // Host broadcasts full impostor state on every phase change
    if (online.isHost) {
      const payload = {
        players: JSON.parse(JSON.stringify(players)),
        phase, currentWordSet, revealIndex, wordVisible, timeLeft,
        currentSpeaker, votingPlayer, countdownNum, round,
      };
      online.broadcast('impostor-state', payload);
    }
  }, [online, phase, revealIndex, wordVisible, currentSpeaker, votingPlayer, countdownNum, round]);

  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('impostor-state', (data) => {
      if (data.players) setPlayers(data.players as Player[]);
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentWordSet !== undefined) setCurrentWordSet(data.currentWordSet as WordSet | null);
      if (data.revealIndex !== undefined) setRevealIndex(data.revealIndex as number);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft as number);
      if (data.currentSpeaker !== undefined) setCurrentSpeaker(data.currentSpeaker as number);
      if (data.votingPlayer !== undefined) setVotingPlayer(data.votingPlayer as number);
      if (data.round !== undefined) setRound(data.round as number);
    });
    return unsub;
  }, [online]);

  useEffect(() => {
    if (!online || !online.isHost) return;
    const unsub = online.onBroadcast('impostor-action', (data) => {
      if (data.action === 'vote' && typeof data.voterId === 'string' && typeof data.targetId === 'string') {
        setPlayers((prev) => prev.map((p) => p.id === data.voterId ? { ...p, votedFor: data.targetId as string } : p));
      }
    });
    return unsub;
  }, [online]);

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
    const wordSet = pickRandom(getWordSets());
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

  useEffect(() => {
    if (phase === 'results' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('hochstapler', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

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
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          <motion.h1
            className="text-2xl font-bold text-center bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#df8eff] bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Hochstapler
          </motion.h1>
          <p className="text-center text-[#a8abb3] text-sm">
            Finde den Hochstapler unter euch!
          </p>

          {round > 1 && (
            <div className="text-center text-xs text-[#df8eff] font-semibold">
              Runde {round}
            </div>
          )}

          {/* Player list */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
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
                    className="flex-1 bg-[#151a21]/60 border border-[#44484f] rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#df8eff]/50 text-base"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#44484f] text-[#a8abb3] hover:border-[#df8eff]/50 hover:text-[#df8eff] transition-colors text-sm"
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                Spieler hinzufügen
              </motion.button>
            )}
          </section>

          {/* Impostor count */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
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
                      ? 'border-[#ff6b98] bg-[#ff6b98]/10 text-[#ff6b98]'
                      : 'border-[#44484f] bg-[#151a21]/40 text-[#a8abb3] hover:border-[#44484f]/60'
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
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
                      ? 'border-[#df8eff] bg-[#df8eff]/10 text-[#df8eff]'
                      : 'border-[#44484f] bg-[#151a21]/40 text-[#a8abb3] hover:border-[#44484f]/60'
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
                ? 'bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#df8eff] text-white shadow-[0_0_20px_rgba(223,142,255,0.3)] hover:shadow-[0_0_30px_rgba(223,142,255,0.4)]'
                : 'bg-[#1b2028] text-gray-500 cursor-not-allowed'
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
    const phaseNum = String(revealIndex + 1).padStart(2, '0');
    const totalPhases = String(players.length).padStart(2, '0');
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        {/* Ambient glow layer */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-[#df8eff]/10 blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#ff6b98]/10 blur-[120px]" />
          <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-[#0a0e14] to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-10">
          <div className="w-full max-w-md space-y-8">
            {/* Phase pill */}
            <div className="flex justify-center">
              <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#df8eff]/20 text-[#df8eff] text-[10px] font-bold tracking-[0.25em] uppercase">
                Secret Reveal · {phaseNum}/{totalPhases}
              </div>
            </div>

            {/* Main secret card with asymmetric deco */}
            <div className="relative group">
              {/* Decorative rotating square top-left */}
              <motion.div
                className="absolute -top-4 -left-4 w-16 h-16 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#ff6b98] to-[#df8eff]"
                animate={{ rotate: [12, 45, 12] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative z-10 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl overflow-hidden"
                style={{
                  background: 'rgba(32, 38, 47, 0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(223, 142, 255, 0.12)',
                }}
              >
                {/* Radial texture */}
                <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(223,142,255,0.4),transparent_60%)]" />

                <AnimatePresence mode="wait">
                  {!wordVisible ? (
                    <motion.div
                      key={`pass-${revealIndex}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="relative z-10 w-full space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[#ff6b98] font-bold tracking-[0.25em] text-[10px] uppercase">
                          Phase {phaseNum}
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                          HANDY WEITERGEBEN
                        </h2>
                      </div>
                      <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-[#44484f]/40 flex flex-col items-center justify-center overflow-hidden bg-black/40">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#df8eff]/5 to-[#ff6b98]/5" />
                        <Shield className="w-14 h-14 text-[#df8eff]/40 mb-2 relative" />
                        <p className="relative text-2xl font-black bg-gradient-to-r from-[#df8eff] to-[#ff6b98] bg-clip-text text-transparent">
                          {currentPlayer.name}
                        </p>
                      </div>
                      <motion.button
                        onClick={handleRevealTap}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 px-8 rounded-full text-[#0a0e14] font-extrabold text-sm tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(223,142,255,0.4)] hover:shadow-[0_0_30px_rgba(223,142,255,0.6)] transition-all"
                        style={{ background: 'linear-gradient(90deg, #df8eff, #d779ff)' }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Geheimnis anzeigen
                        </span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`word-${revealIndex}`}
                      initial={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      className="relative z-10 w-full space-y-6"
                    >
                      {currentPlayer.isImpostor ? (
                        <div className="space-y-4">
                          <span className="text-[#ff6e84] font-bold tracking-[0.25em] text-[10px] uppercase">
                            Rolle enthüllt
                          </span>
                          <motion.div
                            animate={{ x: [0, -4, 4, -4, 4, 0] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                            className="flex justify-center"
                          >
                            <AlertTriangle className="w-16 h-16 text-[#ff6e84] drop-shadow-[0_0_24px_rgba(255,110,132,0.55)]" />
                          </motion.div>
                          <motion.h2
                            className="text-4xl font-black tracking-tight text-[#ff6e84] drop-shadow-[0_0_20px_rgba(255,110,132,0.5)]"
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ repeat: Infinity, duration: 1.6 }}
                          >
                            HOCHSTAPLER
                          </motion.h2>
                          <p className="text-sm text-[#a8abb3]">
                            Du kennst das Wort nicht.<br />Bluff dich durch und falle nicht auf.
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff6e84]/10 border border-[#ff6e84]/30 text-[11px] font-bold uppercase tracking-widest text-[#ff6e84]">
                            Kategorie · {currentWordSet?.category}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <span className="text-[#8ff5ff] font-bold tracking-[0.25em] text-[10px] uppercase">
                            Dein Wort
                          </span>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a8abb3]">
                            {currentWordSet?.category}
                          </p>
                          <p className="text-5xl font-black leading-none text-white drop-shadow-[0_0_24px_rgba(223,142,255,0.35)] tracking-tight">
                            {currentWordSet?.word}
                          </p>
                          <p className="text-xs text-[#a8abb3]/80">
                            Merk's dir gut — aber verrate nichts.
                          </p>
                        </div>
                      )}
                      <motion.button
                        onClick={handleRevealTap}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 px-8 rounded-full bg-[#20262f] border border-[#df8eff]/30 text-[#df8eff] font-extrabold text-sm tracking-[0.2em] uppercase hover:bg-[#262c36] transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <EyeOff className="w-4 h-4" /> Verstanden · Weitergeben
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative corner bracket bottom-right */}
              <div className="pointer-events-none absolute -bottom-2 -right-2 w-24 h-24 border-b-2 border-r-2 border-[#8ff5ff]/30 rounded-br-3xl" />
            </div>

            {/* Players ready mini grid */}
            <div className="grid grid-cols-4 gap-3 pt-4">
              {players.map((p, i) => {
                const done = i < revealIndex;
                const current = i === revealIndex;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex flex-col items-center space-y-2',
                      !done && !current && 'opacity-40',
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold',
                        done && 'bg-[#df8eff]/20 border-[#df8eff]',
                        current && 'bg-[#ff6b98]/20 border-[#ff6b98] shadow-[0_0_16px_rgba(255,107,152,0.4)]',
                        !done && !current && 'bg-[#20262f] border-[#44484f]',
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#df8eff]" />
                      ) : (
                        getPlayerInitial(p.name)
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider',
                        current ? 'text-[#ff6b98]' : done ? 'text-[#df8eff]/80' : 'text-[#a8abb3]',
                      )}
                    >
                      {p.name.length > 8 ? p.name.slice(0, 8) : p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DISCUSSION ---
  if (phase === 'discussion') {
    const urgency = timeLeft <= 10;
    const spokenCount = players.filter((p) => p.hasSpoken).length;
    const progress = players.length > 0 ? spokenCount / players.length : 0;
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 -right-20 w-72 h-72 rounded-full bg-[#df8eff]/10 blur-[110px]" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#ff6b98]/10 blur-[130px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-md px-6 py-8 space-y-6">
          {/* Phase pill */}
          <div className="flex justify-center">
            <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#df8eff]/20 text-[#df8eff] text-[10px] font-bold tracking-[0.25em] uppercase">
              Diskussion · Phase 02
            </div>
          </div>

          {/* Timer card */}
          <div className="relative group">
            <motion.div
              className="absolute -top-3 -right-3 w-14 h-14 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#8ff5ff] to-[#df8eff]"
              animate={{ rotate: [12, -12, 12] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className={cn(
                'relative z-10 rounded-2xl p-6 text-center overflow-hidden',
                urgency ? 'border border-[#ff6e84]/50' : 'border border-[#df8eff]/20',
              )}
              style={{
                background: 'rgba(32, 38, 47, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              animate={urgency ? { scale: [1, 1.02, 1] } : {}}
              transition={urgency ? { repeat: Infinity, duration: 0.6 } : {}}
            >
              <span className={cn(
                'text-[10px] font-bold tracking-[0.3em] uppercase',
                urgency ? 'text-[#ff6e84]' : 'text-[#a8abb3]',
              )}>
                {urgency ? 'Letzte Sekunden' : 'Zeit für Diskussion'}
              </span>
              <p className={cn(
                'text-6xl font-black tabular-nums tracking-tighter mt-1 drop-shadow-[0_0_12px_rgba(241,243,252,0.25)]',
                urgency ? 'text-[#ff6e84]' : 'text-white',
              )}>
                {formatTime(timeLeft)}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0e14]/60 border border-[#44484f]/40 text-[11px] text-[#a8abb3]">
                Kategorie · <span className="text-[#df8eff] font-semibold">{currentWordSet?.category}</span>
              </div>
            </motion.div>
          </div>

          {/* Progress + speakers */}
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#a8abb3]">
                Reihum sprechen
              </h2>
              <span className="text-[11px] font-mono text-[#8ff5ff]">
                {spokenCount} / {players.length}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-[#20262f] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#8ff5ff] via-[#df8eff] to-[#ff6b98]"
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              />
            </div>
            <div className="space-y-2">
              {players.map((player, i) => {
                const isActive = i === currentSpeaker && !player.hasSpoken;
                return (
                  <motion.button
                    key={player.id}
                    onClick={() => !player.hasSpoken && markSpoken(i)}
                    disabled={player.hasSpoken}
                    layout
                    whileTap={{ scale: player.hasSpoken ? 1 : 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors overflow-hidden relative',
                      isActive && 'border-[#df8eff]/60 shadow-[0_0_16px_rgba(223,142,255,0.18)]',
                      player.hasSpoken && 'border-[#44484f]/30 opacity-50',
                      !isActive && !player.hasSpoken && 'border-[#44484f]/50 hover:border-[#df8eff]/30',
                    )}
                    style={{
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(223,142,255,0.12), rgba(255,107,152,0.08))'
                        : 'rgba(21, 26, 33, 0.4)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: getPlayerColor(i) }}
                    >
                      {getPlayerInitial(player.name)}
                    </div>
                    <span className="flex-1 text-sm font-semibold">{player.name}</span>
                    {player.hasSpoken ? (
                      <CheckCircle2 className="w-5 h-5 text-[#8ff5ff]" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#df8eff]"
                      >
                        Am Zug
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* CTA to voting */}
          <motion.button
            onClick={skipToVoting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-full text-[#0a0e14] font-extrabold text-sm tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(255,107,152,0.35)] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg, #df8eff, #ff6b98)' }}
          >
            Zur Abstimmung
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    );
  }

  // --- VOTING ---
  if (phase === 'voting') {
    const voter = players[votingPlayer];
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#ff6b98]/12 blur-[120px]" />
          <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-[#df8eff]/10 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-md px-6 py-8 space-y-6">
          <div className="flex justify-center">
            <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#ff6b98]/30 text-[#ff6b98] text-[10px] font-bold tracking-[0.25em] uppercase">
              Abstimmung · {votingPlayer + 1}/{players.length}
            </div>
          </div>
          <div className="relative group">
            <motion.div
              className="absolute -top-3 -left-3 w-14 h-14 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#ff6b98] to-[#df8eff]"
              animate={{ rotate: [12, 40, 12] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="relative z-10 rounded-2xl p-6 text-center space-y-2 overflow-hidden"
              style={{
                background: 'rgba(32, 38, 47, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 152, 0.18)',
              }}
            >
              <span className="text-[#ff6b98] font-bold tracking-[0.25em] text-[10px] uppercase">
                {voter.name} stimmt ab
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">Wer ist der Hochstapler?</h2>
              <p className="text-xs text-[#a8abb3]">Geheime Wahl — antippen um abzustimmen.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {players.map((target, i) => {
              const isSelf = target.id === voter.id;
              return (
                <motion.button
                  key={target.id}
                  onClick={() => !isSelf && castVote(target.id)}
                  disabled={isSelf}
                  whileHover={!isSelf ? { scale: 1.03 } : {}}
                  whileTap={!isSelf ? { scale: 0.95 } : {}}
                  className={cn(
                    'relative p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all overflow-hidden',
                    isSelf
                      ? 'border-[#44484f]/30 opacity-30 cursor-not-allowed'
                      : 'border-[#44484f]/50 hover:border-[#ff6b98]/60',
                  )}
                  style={{
                    background: isSelf
                      ? 'rgba(21, 26, 33, 0.3)'
                      : 'rgba(32, 38, 47, 0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                    style={{ backgroundColor: getPlayerColor(i) }}
                  >
                    {getPlayerInitial(target.name)}
                  </div>
                  <span className="text-sm font-semibold truncate max-w-full">{target.name}</span>
                  {isSelf && (
                    <span className="text-[10px] uppercase tracking-widest text-[#a8abb3]">Du</span>
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
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8 flex items-center justify-center">
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
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider">
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
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider">
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
            className="bg-[#df8eff]/10 border border-[#df8eff]/30 rounded-2xl p-4"
          >
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider mb-1">Das Wort war</p>
            <p className="text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {currentWordSet?.word}
            </p>
            <p className="text-[#df8eff] text-xs mt-1">{currentWordSet?.category}</p>
          </motion.div>

          {/* Continue */}
          <motion.button
            onClick={proceedFromReveal}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#df8eff] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
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
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-4">
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
            <p className="text-[#a8abb3] text-sm">
              {impostors.map((i) => i.name).join(' & ')}: Könnt ihr das Wort erraten?
            </p>
            <p className="text-[#df8eff] text-xs">
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
                className="w-full bg-[#151a21]/60 border border-[#44484f] rounded-xl px-4 py-3 text-white text-center text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                onKeyDown={(e) => e.key === 'Enter' && bonusGuess.trim() && submitBonusGuess()}
              />
              <motion.button
                onClick={submitBonusGuess}
                disabled={!bonusGuess.trim()}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2',
                  bonusGuess.trim()
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                    : 'bg-[#1b2028] text-gray-500 cursor-not-allowed'
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
                  : 'border-gray-600 bg-[#151a21]/40'
              )}
            >
              <p className={cn('text-2xl font-black', bonusResult ? 'text-yellow-400' : 'text-[#a8abb3]')}>
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
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
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
            <p className="text-[#a8abb3] text-sm uppercase tracking-wider">Rangliste</p>
          </motion.div>

          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  i === 0
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#151a21]/40 border-[#44484f]/50'
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
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#df8eff] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-sm"
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
