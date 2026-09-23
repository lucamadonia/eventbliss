import { personalResult } from '../social/result';
import { validBallot } from './vote-rules';
import { DuelBallot } from './DuelBallot';
import { GameStage, StageHeader, StageAction } from '../ui/GameStage';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Timer,
  Zap, MessageSquare, Shuffle, BarChart3, Clock, Check,
  Users, Stars, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useGameTimer } from '../engine/TimerSystem';
import { getTHISORTHAT_PAIRS, type ThisOrThatPair } from './thisorthat-content';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useHaptics } from "@/hooks/useHaptics";
import { PlayerSetup } from '../ui/PlayerSetup';
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { GameSetupBackLink } from '@/games/ui/GameSetupBackLink';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { useInitialRoster } from '@/games/ui/useInitialRoster';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'voting' | 'reveal' | 'debate' | 'gameOver';

interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
}

interface RoundVote {
  pair: ThisOrThatPair;
  votes: Record<string, 'A' | 'B'>;
}

const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];

// Sentinel used internally so import logic doesn't depend on the displayed name.
const DEFAULT_PLAYER_SENTINEL = '__DEFAULT__';

// Mode cards for the bento setup grid. `size` controls the grid span,
// `tone` selects the accent color family used for border/chip/icon.
type ModeCard = {
  id: string;
  labelKey: string;
  tagKey?: string;
  descKey: string;
  icon: React.ReactNode;
  size: 'large' | 'medium' | 'small';
  tone: 'primary' | 'secondary' | 'tertiary';
};
const MODE_CARDS: ModeCard[] = [
  { id: 'classic', labelKey: 'gameModes.thisorthat.classic.name', tagKey: 'games.thisorthat.modeTagPopular', descKey: 'gameModes.thisorthat.classic.desc', icon: <Shuffle className="w-6 h-6" />, size: 'large',  tone: 'primary'  },
  { id: 'speed',   labelKey: 'gameModes.thisorthat.speed.name',                                               descKey: 'gameModes.thisorthat.speed.desc',   icon: <Zap className="w-6 h-6" />,      size: 'small',  tone: 'tertiary' },
  { id: 'debatte', labelKey: 'gameModes.thisorthat.debatte.name',                                             descKey: 'gameModes.thisorthat.debatte.desc', icon: <MessageSquare className="w-6 h-6" />, size: 'medium', tone: 'secondary' },
  { id: 'chaos',   labelKey: 'games.thisorthat.modeChaosLabel',                                               descKey: 'games.thisorthat.modeChaosDesc',    icon: <Flame className="w-6 h-6" />,    size: 'medium', tone: 'primary'  },
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
// Component
// ---------------------------------------------------------------------------

const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-cyan { text-shadow: 0 0 20px rgba(143,245,255,0.6), 0 0 40px rgba(143,245,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;

export default function ThisOrThatGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const exitGuard = useConfirmExit(() => navigate('/games'));

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
  const [mode, setMode] = useState('classic');
  const [speedTimer, setSpeedTimer] = useState(5);
  const [totalRounds, setTotalRounds] = useState(15);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [matchId, setMatchId] = useState<string>(() => crypto.randomUUID());
  const voteTurn = `${matchId}:${currentRound}`;

  const [deck, setDeck] = useState(() => shuffle(getTHISORTHAT_PAIRS()));
  const [deckPos, setDeckPos] = useState(0);
  const [currentPair, setCurrentPair] = useState<ThisOrThatPair | null>(null);
  const [voterIdx, setVoterIdx] = useState(0);
  const [roundVotes, setRoundVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [history, setHistory] = useState<RoundVote[]>([]);

  // TV payload — the cast view reads FLAT fields + live vote tallies (ThisOrThat
  // has no secrets, everything is shareable). Previously only {currentPair} was
  // sent nested, so the TV showed "Option A/B" placeholders and 50/50 with 0
  // votes. Compute and broadcast exactly what TVThisOrThatView consumes.
  const tvVotersA = players.filter((p) => roundVotes[p.id] === 'A');
  const tvVotersB = players.filter((p) => roundVotes[p.id] === 'B');
  const tvTotalVotes = tvVotersA.length + tvVotersB.length;
  const mapVoter = (p: typeof players[number]) => ({ id: p.id, name: p.name, color: p.color, avatar: (p as { avatar?: string }).avatar ?? '' });
  useTVGameBridge('thisorthat', {
    phase,
    round: currentRound,
    totalRounds,
    category: currentPair?.category ?? '',
    optionA: currentPair?.optionA ?? '',
    optionB: currentPair?.optionB ?? '',
    votesA: tvVotersA.length,
    votesB: tvVotersB.length,
    percentA: tvTotalVotes ? (tvVotersA.length / tvTotalVotes) * 100 : 50,
    percentB: tvTotalVotes ? (tvVotersB.length / tvTotalVotes) * 100 : 50,
    votersA: tvVotersA.map(mapVoter),
    votersB: tvVotersB.map(mapVoter),
    players,
  }, [phase, currentRound, roundVotes, players, currentPair], !online || online.isHost);

  const handleDebateExpire = useCallback(() => { if (!online || online.isHost) setPhase('reveal'); }, [online]);
  const debateTimer = useGameTimer(30, handleDebateExpire, online?.isConnected !== false);
  const debateTimerRef = useRef(debateTimer);
  debateTimerRef.current = debateTimer;

  // speedTimerHook must be declared before handleSpeedExpire uses it
  const speedTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);

  const handleSpeedExpire = useCallback(() => {
    if (online && !online.isHost) return;
    if (online?.isHost) {
      setRoundVotes(prev => {
        const complete = { ...prev };
        for (const p of players) if (!complete[p.id]) complete[p.id] = Math.random() > 0.5 ? 'A' : 'B';
        return complete;
      });
      setPhase('reveal');
      return;
    }
    // auto-pick random if not voted in time
    setRoundVotes((prev) => {
      const p = players[voterIdx];
      if (p && !prev[p.id]) return { ...prev, [p.id]: Math.random() > 0.5 ? 'A' : 'B' };
      return prev;
    });
    if (voterIdx + 1 >= players.length) {
      setPhase('reveal');
    } else {
      setVoterIdx((v) => v + 1);
      speedTimerRef.current?.reset(speedTimer);
      speedTimerRef.current?.start();
    }
  }, [online, voterIdx, players, speedTimer]);

  const speedTimerHook = useGameTimer(speedTimer, handleSpeedExpire, online?.isConnected !== false);
  speedTimerRef.current = speedTimerHook;

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => {
    setMatchId(crypto.randomUUID());
    const p = mapped.map((m, i) => ({ ...m, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 }));
    setPlayers(p);
    setMode(selectedMode);
    setSpeedTimer(settings.timer);
    setTotalRounds(settings.rounds);
    setCurrentRound(1);
    setDeckPos(0);
    setHistory([]);
    startRound(0, p, selectedMode, settings.timer);
  };

  const startRound = (pos: number, pls?: Player[], roundMode = mode, roundSeconds = speedTimer, roundDeck = deck) => {
    const pair = roundDeck[pos % roundDeck.length];
    setCurrentPair(pair);
    setRoundVotes({});
    setVoterIdx(0);
    setPhase('voting');
    if (roundMode === 'speed') {
      speedTimerHook.reset(roundSeconds);
      speedTimerHook.start();
    }
  };

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------

  const castVote = (choice: 'A' | 'B') => {
    if (phase !== 'voting' || online?.isConnected === false) return;
    // Online mode: everyone votes simultaneously on their own device
    if (online) {
      const myId = online.myPlayerId;
      if (!myId || roundVotes[myId]) return; // already voted
      if (online.isHost) {
        applyVoteLocally(myId, choice);
      } else {
        // Non-host broadcasts to host and optimistically shows own vote
        online.broadcast('player-action', { type: 'vote', playerId: myId, choice, turn: voteTurn });
        setRoundVotes(prev => prev[myId] ? prev : { ...prev, [myId]: choice });
      }
      return;
    }

    // Offline pass-and-play (unchanged)
    const voter = players[voterIdx];
    if (!voter) return;
    const newVotes = { ...roundVotes, [voter.id]: choice };
    setRoundVotes(newVotes);

    if (voterIdx + 1 >= players.length) {
      if (mode === 'speed') speedTimerHook.pause();
      if (mode === 'debatte') {
        debateTimer.reset(30);
        debateTimer.start();
        setPhase('debate');
      } else {
        setPhase('reveal');
      }
    } else {
      setVoterIdx((v) => v + 1);
      if (mode === 'speed') {
        speedTimerHook.reset(speedTimer);
        speedTimerHook.start();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Reveal stats
  // ---------------------------------------------------------------------------

  const voteStats = useMemo(() => {
    const total = Object.keys(roundVotes).length;
    const aCount = Object.values(roundVotes).filter((v) => v === 'A').length;
    const bCount = total - aCount;
    return { total, aCount, bCount, aPct: total > 0 ? Math.round((aCount / total) * 100) : 0, bPct: total > 0 ? Math.round((bCount / total) * 100) : 0 };
  }, [roundVotes]);

  // ---------------------------------------------------------------------------
  // Next round
  // ---------------------------------------------------------------------------

  const nextRound = () => {
    if (online && !online.isHost) return;
    if (currentPair) {
      setHistory((h) => [...h, { pair: currentPair, votes: { ...roundVotes } }]);
    }
    // Award points: majority gets 1 point per voter in majority
    const majority = voteStats.aCount === voteStats.bCount ? null : voteStats.aCount > voteStats.bCount ? 'A' : 'B';
    setPlayers((prev) => prev.map((p) => ({
      ...p,
      score: p.score + (roundVotes[p.id] === majority ? 1 : 0),
    })));

    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }
    const nextPos = deckPos + 1;
    setDeckPos(nextPos);
    setCurrentRound((r) => r + 1);
    startRound(nextPos);
  };

  const endDebate = () => { if (!online || online.isHost) setPhase('reveal'); };

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const result = personalResult(players, online?.myPlayerId);
      recordEnd('this-or-that', result.score, result.won);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const resetGame = () => {
    if (online && !online.isHost) return;
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
  };

  // Keep the roster and settings, start a new match with fresh scores.
  const playAgain = () => {
    if (online && !online.isHost) return;
    gameRecordedRef.current = false;
    setMatchId(crypto.randomUUID());
    setPlayers(prev => prev.map(player => ({ ...player, score: 0 })));
    setCurrentRound(1);
    setDeckPos(0);
    setHistory([]);
    const freshDeck = shuffle(getTHISORTHAT_PAIRS());
    setDeck(freshDeck);
    startRound(0, undefined, mode, speedTimer, freshDeck);
  };

  const winner = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score)[0], [players]);

  /* ---- Online: host broadcast helper ---- */
  const broadcastGameState = useCallback(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, matchId, totalRounds, mode, speedTimer, history,
      speedRemaining: speedTimerHook.timeLeft, debateRemaining: debateTimer.timeLeft,
      currentPair,
      roundVotes,
      players,
    });
  }, [online, phase, currentRound, matchId, totalRounds, mode, speedTimer, history, currentPair, roundVotes, players, speedTimerHook.timeLeft, debateTimer.timeLeft]);

  /* ---- Online: host broadcasts on state change ---- */
  useEffect(() => {
    broadcastGameState();
  }, [broadcastGameState]);

  /* ---- Online: handshake — host replies to late joiners with full state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('request-state', () => broadcastGameState());
  }, [online, broadcastGameState]);

  /* ---- Online: host merges votes coming from non-hosts ---- */
  const applyVoteLocally = useCallback((playerId: string, choice: 'A' | 'B') => {
    setRoundVotes(prev => {
      if (prev[playerId]) return prev;
      const next = { ...prev, [playerId]: choice };
      if (online?.isHost && Object.keys(next).length >= players.length) {
        // All players voted → transition phase
        queueMicrotask(() => {
          if (mode === 'speed') speedTimerHook.pause();
          if (mode === 'debatte') {
            debateTimer.reset(30);
            debateTimer.start();
            setPhase('debate');
          } else {
            setPhase('reveal');
          }
        });
      }
      return next;
    });
  }, [online, players.length, mode, speedTimerHook, debateTimer]);

  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('player-action', (data) => {
      if (phase === 'voting' && online.isConnected !== false && validBallot(data, voteTurn, players.map(p => p.id))) {
        applyVoteLocally(data.playerId, data.choice);
      }
    });
  }, [online, phase, players, voteTurn, applyVoteLocally]);

  /* ---- Online: non-host syncs game-state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (typeof data.matchId === 'string') setMatchId(data.matchId);
      if (data.phase) setPhase(data.phase as Phase);
      if (data.mode) setMode(data.mode as string);
      if (typeof data.speedRemaining === 'number') speedTimerRef.current?.reset(data.speedRemaining);
      if (typeof data.debateRemaining === 'number') debateTimerRef.current.reset(data.debateRemaining);
      if (typeof data.totalRounds === 'number') setTotalRounds(data.totalRounds);
      if (typeof data.speedTimer === 'number') setSpeedTimer(data.speedTimer);
      if (Array.isArray(data.history)) setHistory(data.history as RoundVote[]);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.currentPair) setCurrentPair(data.currentPair as ThisOrThatPair);
      if (data.roundVotes) setRoundVotes(data.roundVotes as Record<string, 'A' | 'B'>);
      if (data.players) {
        setPlayers(data.players as Player[]);
      }
    });
  }, [online]);

  /* ---- Online: non-host requests current state once on mount ---- */
  const requestedStateRef = useRef(false);
  useEffect(() => {
    if (!online || online.isHost || requestedStateRef.current) return;
    requestedStateRef.current = true;
    online.broadcast('request-state', {});
  }, [online]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (phase === 'setup') {
    return (
      <ThisOrThatSetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        haptics={haptics}
      />
    );
  }

  // Sentiment strings for the reveal phase
  const sentimentLandslide = t('games.thisorthat.sentimentLandslide');
  const sentimentMajority  = t('games.thisorthat.sentimentMajority');
  const sentimentClose     = t('games.thisorthat.sentimentClose');

  return (
    <GameStage gameId="this-or-that" className="duel-shell duel-shell relative min-h-[100dvh]  text-white flex flex-col font-game">
      <style>{EP_STYLE}</style>
      {/* Ambient glow orbs */}
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
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-[#a8abb3]">
          {t('games.thisorthat.roundIndicator', { current: currentRound, total: totalRounds })}
        </div>
        <div className="px-3 py-1 rounded-full glass-card border border-[#44484f]/30 text-xs font-bold text-[#8ff5ff]">
          {currentPair?.category}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* VOTING — full-bleed A/B panels with floating VS medallion */}
        {phase === 'voting' && currentPair && (() => {
          const myId = online?.myPlayerId;
          const iAlreadyVoted = !!(online && myId && roundVotes[myId]);
          const votedCount = Object.keys(roundVotes).length;
          const tap = (choice: 'A' | 'B') => {
            if (iAlreadyVoted) return;
            void haptics.medium();
            castVote(choice);
          };
          return (
            <motion.div
              key="voting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col px-4 sm:px-6 py-4"
            >
              {/* Title + progress strip */}
              <div className="mb-4 sm:mb-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter italic">
                  THIS <span className="text-[#edb095] drop-shadow-[0_0_10px_#df8eff]">or</span> THAT?
                </h2>
                <div className="mt-3 flex justify-center gap-1">
                  {Array.from({ length: totalRounds }).slice(0, 12).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i < currentRound - 1 && 'w-6 bg-[#df8eff]/70',
                        i === currentRound - 1 && 'w-8 bg-[#df8eff] shadow-[0_0_10px_#df8eff]',
                        i > currentRound - 1 && 'w-6 bg-[#20262f]',
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Voter banner */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {online ? (
                  <span className="text-[#a8abb3] text-xs font-semibold">
                    {iAlreadyVoted
                      ? t('games.thisorthat.waitingForOthers', { voted: votedCount, total: players.length })
                      : t('games.thisorthat.yourChoice')}
                  </span>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: players[voterIdx]?.color }}
                    >
                      {players[voterIdx]?.avatar}
                    </div>
                    <span className="text-[#a8abb3] text-xs font-semibold">
                      <span className="text-white font-bold">{players[voterIdx]?.name}</span>{' '}
                      {t('games.thisorthat.playerChooses')}
                    </span>
                  </>
                )}
                {mode === 'speed' && (
                  <span className={cn(
                    "ml-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black",
                    speedTimerHook.timeLeft <= 2
                      ? 'bg-[#ff6e84]/15 text-[#ff6e84] animate-pulse'
                      : 'bg-[#ff6b98]/15 text-[#ff6b98]',
                  )}>
                    {speedTimerHook.timeLeft}s
                  </span>
                )}
              </div>

              <DuelBallot a={currentPair.optionA} b={currentPair.optionB} choose={tap} locked={iAlreadyVoted}
                selected={online ? roundVotes[online.myPlayerId] : undefined} label={t('games.thisorthat.choose')} />

              {/* Voter progress dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {players.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      online
                        ? i < votedCount ? 'bg-[#df8eff] scale-125' : 'bg-white/10'
                        : i < voterIdx ? 'bg-[#df8eff] scale-125'
                        : i === voterIdx ? 'bg-white scale-150' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* DEBATE */}
        {phase === 'debate' && currentPair && (
          <motion.div key="debate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <MessageSquare className="w-10 h-10 text-[#ff6b98]" />
            <h2 className="text-2xl font-extrabold">{t('games.thisorthat.debateTitle')}</h2>
            <p className="text-white/40 text-sm text-center">{t('games.thisorthat.debateHint')}</p>
            <div className="text-4xl font-mono font-black text-[#ff6b98]">{debateTimer.timeLeft}s</div>
            <div className="flex gap-4 w-full max-w-sm">
              <div className="flex-1 rounded-2xl bg-[#df8eff]/10 border border-[#df8eff]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#edb095]">{currentPair.optionA}</span>
              </div>
              <div className="text-white/20 self-center font-bold">vs</div>
              <div className="flex-1 rounded-2xl bg-[#8ff5ff]/10 border border-[#8ff5ff]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#8ff5ff]">{currentPair.optionB}</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} disabled={!!online && !online.isHost} onClick={endDebate}
              className="mt-4 px-8 py-3 rounded-2xl bg-white/10 border border-white/10 text-white/60 font-bold text-sm">
              {t('games.thisorthat.debateSkip')}
            </motion.button>
          </motion.div>
        )}

        {phase === 'reveal' && currentPair && <div className="duel-verdict">
          <StageHeader title={t(voteStats.aCount===voteStats.bCount?'games.thisorthat.tie':'games.thisorthat.verdictTitle')} eyebrow={t('games.thisorthat.roundResult',{round:currentRound})} subtitle={t('games.thisorthat.voteCount',{count:voteStats.total})}/>
          <div className="duel-results-grid">{(['A','B'] as const).map((side,i)=>{const count=i===0?voteStats.aCount:voteStats.bCount; const percent=i===0?voteStats.aPct:voteStats.bPct; return <section key={side} data-side={side} className="duel-result-column">
            <div className="duel-result-top"><span>{side}</span><strong>{percent}<small>%</small></strong></div>
            <h2>{i===0?currentPair.optionA:currentPair.optionB}</h2><div className="duel-result-track"><span style={{width:`${percent}%`}}/></div>
            <p>{t('games.thisorthat.votes',{count})}</p><div className="duel-result-voters">{players.filter(p=>roundVotes[p.id]===side).map(p=><span key={p.id}>{p.name}</span>)}</div>
          </section>;})}</div>
          <StageAction className="w-full mt-7" disabled={!!online&&!online.isHost} onClick={()=>{void haptics.light();nextRound();}}>{t(currentRound>=totalRounds?'games.results.gameOver':'games.play.next')}<ArrowRight size={20}/></StageAction>
        </div>}

        {phase === 'gameOver' && winner && (
          <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
            <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-extrabold text-[#edb095] neon-glow">
              {t('games.results.gameOver')}
            </h2>
            <div className="text-lg font-bold text-[#8ff5ff]">
              {t('games.thisorthat.playerWins', { name: players.filter(p => p.score === winner.score).map(p => p.name).join(', ') })}
            </div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-2xl px-4 py-3">
                  <span className="text-white/30 text-sm font-bold w-5">#{players.filter(other => other.score > p.score).length + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
                  <span className="text-[#8ff5ff] font-bold">
                    {t('games.thisorthat.scorePoints', { score: p.score })}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-3 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} disabled={!!online && !online.isHost} onClick={playAgain}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_25px_rgba(207,150,255,0.25)]">
                <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
              </motion.button>
              {!hasShellBackButton() && (
                <button onClick={() => navigate('/games')}
                  className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
                  {t('games.results.otherGame')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#df8eff" />
    </GameStage>
  );
}

// ---------------------------------------------------------------------------
// ThisOrThatSetup — bento-grid game setup (hero + mode cards + difficulty +
// player strip + start). Lives inside the same file to keep the diff
// reviewable; the shared `GameSetup` component stays in place for the 6
// other games that use it.
// ---------------------------------------------------------------------------

interface ThisOrThatSetupProps {
  onStart: (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => void;
  onlinePlayers?: { id: string; name: string; color?: string; avatar?: string }[];
  haptics: ReturnType<typeof useHaptics>;
}

const TONE_STYLE: Record<'primary' | 'secondary' | 'tertiary', {
  border: string; chip: string; icon: string; text: string; glow: string;
}> = {
  primary:   { border: 'border-[#df8eff]', chip: 'bg-[#df8eff]/20 text-[#edb095]',  icon: 'text-[#edb095]',  text: 'text-[#edb095]',  glow: 'shadow-[0_0_22px_rgba(223,142,255,0.22)]' },
  secondary: { border: 'border-[#ff6b98]', chip: 'bg-[#ff6b98]/20 text-[#ff6b98]',  icon: 'text-[#ff6b98]',  text: 'text-[#ff6b98]',  glow: 'shadow-[0_0_22px_rgba(255,107,152,0.22)]' },
  tertiary:  { border: 'border-[#8ff5ff]', chip: 'bg-[#8ff5ff]/20 text-[#8ff5ff]',  icon: 'text-[#8ff5ff]',  text: 'text-[#8ff5ff]',  glow: 'shadow-[0_0_22px_rgba(143,245,255,0.22)]' },
};

function ThisOrThatSetup({ onStart, onlinePlayers, haptics }: ThisOrThatSetupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOnline = (onlinePlayers?.length ?? 0) > 0;
  /**
   * Party-Besetzung uebernehmen. Beim Umbau auf dieses eigene Bento-Setup
   * (Commit 977653d) ging der Party-Zweig verloren, den der geteilte
   * `GameSetup` mitgebracht hatte — seither begann This or That mitten in
   * einer Party mit zwei Platzhaltern.
   */
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });

  const [modeId, setModeId] = useState<string>('classic');
  const [rounds, setRounds] = useState<number>(15);
  const [players, setPlayers] = useState<{ id: string; name: string; color: string; avatar: string }[]>(() => {
    if (isOnline && onlinePlayers) {
      return onlinePlayers.map((p, i) => ({
        id: p.id, name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar ?? p.name.slice(0, 1).toUpperCase(),
      }));
    }
    if (partyRoster) {
      return partyRoster.map((p, i) => ({
        id: p.id, name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar,
      }));
    }
    return [
      { id: 'p-1', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[0], avatar: 'P' },
      { id: 'p-2', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[1], avatar: '2' },
    ];
  });

  // Resolve the display name: sentinel → translated default, otherwise use stored name
  const resolveDisplayName = (name: string, idx: number): string => {
    if (name === DEFAULT_PLAYER_SENTINEL) {
      return idx === 0 ? t('games.thisorthat.defaultPlayer1') : t('games.thisorthat.defaultPlayerN', { n: idx + 1 });
    }
    return name;
  };

  const MIN = 2, MAX = 20;
  const addPlayer = () => {
    if (isOnline) return; // Online: Spielerliste ist fix (Remote-Geräte)
    if (players.length >= MAX) return;
    const idx = players.length;
    const id = `p-${Date.now()}-${idx}`;
    void haptics.select();
    setPlayers((prev) => [...prev, {
      id,
      name: DEFAULT_PLAYER_SENTINEL,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      avatar: String(idx + 1),
    }]);
  };
  const removePlayer = (id: string) => {
    if (isOnline) return;
    setPlayers((prev) => prev.length > MIN ? prev.filter((p) => p.id !== id) : prev);
  };
  const renamePlayer = (id: string, name: string) => {
    if (isOnline) return;
    setPlayers((prev) => prev.map((p) =>
      p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p,
    ));
  };

  // Replace entire roster with imported names; drop all existing players incl. sentinels/placeholders.
  // Pad to MIN with sentinel placeholders if fewer than MIN names are imported.
  const handleImportNames = (names: string[]) => {
    if (isOnline) return;
    const fresh: { id: string; name: string; color: string; avatar: string }[] = [];
    for (const n of names) {
      if (fresh.length >= MAX) break;
      const trimmed = n.trim();
      if (!trimmed) continue;
      fresh.push({
        id: `p-${Date.now()}-${fresh.length}`,
        name: trimmed,
        color: PLAYER_COLORS[fresh.length % PLAYER_COLORS.length],
        avatar: trimmed.slice(0, 1).toUpperCase() || '?',
      });
    }
    while (fresh.length < MIN) {
      const idx = fresh.length;
      fresh.push({
        id: `p-${Date.now()}-${idx}`,
        name: DEFAULT_PLAYER_SENTINEL,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        avatar: String(idx + 1),
      });
    }
    setPlayers(fresh);
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const handleStart = () => {
    if (!canStart) return;
    void haptics.celebrate();
    // Resolve sentinel display names before passing to game
    const resolved = players.map((p, i) => ({
      ...p,
      name: resolveDisplayName(p.name, i),
      avatar: p.name === DEFAULT_PLAYER_SENTINEL
        ? (i === 0 ? t('games.thisorthat.defaultPlayer1').slice(0, 1).toUpperCase() : String(i + 1))
        : p.avatar,
    }));
    onStart(
      resolved,
      modeId === 'chaos' ? 'speed' : modeId, // chaos routes to speed with tighter rounds
      { timer: modeId === 'chaos' ? 3 : 5, rounds },
    );
  };

  // Bento grid layout map: col/row spans per card size. `large` takes
  // 4 columns of the 6-col grid with double height, others fill in.
  const bentoClasses: Record<ModeCard['size'], string> = {
    large:  'col-span-4 h-44 sm:h-48',
    medium: 'col-span-3 h-36 sm:h-40',
    small:  'col-span-2 h-44 sm:h-48',
  };

  return (
    <GameStage gameId="this-or-that" className="duel-shell relative min-h-screen overflow-hidden  text-[#f1f3fc] pb-40">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#df8eff]/10 rounded-full blur-[100px]" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#ff6b98]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-32 -right-20 w-64 h-64 bg-[#ff6b98]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#df8eff]/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        {/* Back + hero */}
        <GameSetupBackLink
          onClick={() => navigate('/games')}
          className="mb-6 text-[#a8abb3] hover:text-white transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('common.back')}
        </GameSetupBackLink>

        <section className="relative mb-10">
          <p className="text-[#8ff5ff] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">
            {t('games.thisorthat.socialChallenge')}
          </p>
          <h2 className="text-5xl font-black tracking-tighter leading-[0.95] mb-3">
            This <span className="text-[#edb095] italic drop-shadow-[0_0_10px_rgba(223,142,255,0.5)]">{t('games.thisorthat.orWord')}</span> That
          </h2>
          <p className="text-[#a8abb3] text-sm max-w-[300px]">
            {t('games.thisorthat.setupSubtitle')}
          </p>
        </section>

        {/* Player setup — always first section */}
        <section className="mb-10">
          <PlayerSetup
            players={players.map((p, i) => ({
              id: p.id,
              name: resolveDisplayName(p.name, i),
              color: p.color,
              avatar: p.avatar,
              readOnly: isOnline,
            }))}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onRename={(id, name) => renamePlayer(id, name)}
            onImportNames={isOnline ? undefined : handleImportNames}
            min={MIN}
            max={isOnline ? players.length : MAX}
            accent="#df8eff"
            maxNameLength={12}
          />
        </section>

        {/* Mode bento grid */}
        <section className="mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3] mb-4 flex items-center gap-2">
            {t('games.setup.selectMode')}
            <span className="w-1.5 h-1.5 bg-[#ff6b98] rounded-full animate-pulse" />
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {MODE_CARDS.map((m) => {
              const active = modeId === m.id;
              const tone = TONE_STYLE[m.tone];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { void haptics.select(); setModeId(m.id); }}
                  aria-pressed={active}
                  aria-label={t(m.labelKey)}
                  className={cn(
                    'relative rounded-2xl overflow-hidden group text-left transition-all active:scale-[0.98]',
                    bentoClasses[m.size],
                    active
                      ? cn('border-2', tone.border, tone.glow)
                      : 'border border-[#44484f]/20 hover:border-[#44484f]/60',
                  )}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(32,38,47,0.8), rgba(15,20,26,0.95))'
                      : 'rgba(15,20,26,0.7)',
                  }}
                >
                  {/* Oversized bg icon */}
                  <div className={cn(
                    'absolute -right-2 -bottom-2 opacity-10 transition-opacity pointer-events-none',
                    active ? 'opacity-25' : 'group-hover:opacity-20',
                    tone.icon,
                  )}>
                    <span className="block scale-[5] origin-bottom-right">
                      {m.icon}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      {m.tagKey && (
                        <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md', tone.chip)}>
                          {t(m.tagKey)}
                        </span>
                      )}
                      {active && (
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', tone.chip)}>
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={cn('mb-1.5', tone.icon)}>{m.icon}</div>
                      <h4 className={cn('text-lg font-extrabold leading-none mb-1', active ? tone.text : 'text-white')}>
                        {t(m.labelKey)}
                      </h4>
                      {m.size !== 'small' && (
                        <p className="text-[10px] text-[#a8abb3] leading-snug line-clamp-2">{t(m.descKey)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rounds slider */}
        <section className="rounded-2xl bg-[#0f141a] border-l-4 border-[#df8eff] p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#a8abb3] font-medium text-sm">{t('games.setup.rounds')}</span>
            <span className="text-[#8ff5ff] font-black text-lg tabular-nums">{rounds}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            aria-label={t('games.setup.rounds')}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#df8eff]"
            style={{
              background: `linear-gradient(to right, #df8eff 0%, #ff6b98 ${((rounds - 5) / 25) * 100}%, #20262f ${((rounds - 5) / 25) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-bold text-[#44484f] mt-2">
            <span>5</span>
            <span>15</span>
            <span>30</span>
          </div>
        </section>
      </main>

      {/* Floating start CTA */}
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
          style={canStart ? { background: 'linear-gradient(135deg, #df8eff, #d779ff)' } : {}}
        >
          {canStart ? (
            <>
              {t('games.thisorthat.startGame')}
              <Zap className="w-5 h-5" />
            </>
          ) : (
            t('games.setup.minPlayers', { count: MIN })
          )}
        </motion.button>
      </div>
    </GameStage>
  );
}
