import { personalResult } from '../social/result';
import { validBallot } from './vote-rules';
import { GameStage } from '../ui/GameStage';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { useGameTimer } from '../engine/TimerSystem';
import { getTHISORTHAT_PAIRS, type ThisOrThatPair } from './thisorthat-content';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { ballotComplete, dropVoters, hideSidesWhileVoting, nextLocalVoter, speedExpiry } from './guest-ballot';
import { acceptInput, deadline } from '../party/scene-schedule';
import { serverClock } from '../party/scene-clock';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useHaptics } from "@/hooks/useHaptics";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { PLAYER_COLORS, ThisOrThatSetup } from './ThisOrThatSetup';
import { TotDebate, TotGameOver, TotReveal, TotVoting } from './ThisOrThatPanels';

type Phase = 'setup' | 'voting' | 'reveal' | 'debate' | 'gameOver';

interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
}

interface RoundVote {
  pair: ThisOrThatPair;
  votes: Record<string, 'A' | 'B'>;
}

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
  // 🔁 guests on this phone vote after the own seat, each on a fresh ballot after a handover.
  const localVoter = online ? nextLocalVoter(localSeats(online), players, roundVotes) : null;
  const handover = useSeatHandover(online, phase === 'voting' ? localVoter : null);
  // Seats sharing the host phone vote one after another: sides stay hidden until the reveal.
  const hideSides = hideSidesWhileVoting(phase, online?.players ?? []);
  const tvVotersA = hideSides ? [] : players.filter((p) => roundVotes[p.id] === 'A');
  const tvVotersB = hideSides ? [] : players.filter((p) => roundVotes[p.id] === 'B');
  const tvTotalVotes = tvVotersA.length + tvVotersB.length;
  const mapVoter = (p: typeof players[number]) => ({ id: p.id, name: p.name, color: p.color, avatar: (p as { avatar?: string }).avatar ?? '' });
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound]); // all devices + TV switch together
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
    handover: handover.tv, phaseStartsAt, votedIds: players.filter(p => roundVotes[p.id]).map(p => p.id), // who voted, never which side
  }, [phase, currentRound, roundVotes, players, currentPair, JSON.stringify(handover.tv), phaseStartsAt], !online || online.isHost);

  const clocksRun = online?.isConnected !== false && !handover.isPaused;
  const handleDebateExpire = useCallback(() => { if (!online || online.isHost) setPhase('reveal'); }, [online]);
  const debateTimer = useGameTimer(30, handleDebateExpire, clocksRun);
  const debateTimerRef = useRef(debateTimer);
  debateTimerRef.current = debateTimer;

  // speedTimerHook must be declared before handleSpeedExpire uses it
  const speedTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);

  const handleSpeedExpire = useCallback(() => {
    if (online && !online.isHost) return;
    if (online?.isHost) {
      // Queued guests on this phone keep their ballot; each gets a full timer after the handover.
      const queued = localSeats(online).filter(id => id !== localVoter);
      // Functional update keeps a ballot that arrived in the same tick; the reveal follows in the effect below.
      setRoundVotes(prev => speedExpiry(players, prev, queued, () => Math.random() > 0.5 ? 'A' : 'B').votes);
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
  }, [online, voterIdx, players, speedTimer, localVoter]);

  const speedTimerHook = useGameTimer(speedTimer, handleSpeedExpire, clocksRun);
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
      const myId = localVoter ?? online.myPlayerId;
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
      phase, phaseStartsAt, currentRound, matchId, totalRounds, mode, speedTimer, history,
      speedRemaining: speedTimerHook.timeLeft, debateRemaining: debateTimer.timeLeft,
      currentPair,
      roundVotes,
      players,
    });
  }, [online, phase, phaseStartsAt, currentRound, matchId, totalRounds, mode, speedTimer, history, currentPair, roundVotes, players, speedTimerHook.timeLeft, debateTimer.timeLeft]);

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
      if (phase === 'voting' && online.isConnected !== false && validBallot(data, voteTurn, players.map(p => p.id))
        && (mode !== 'speed' || !clocksRun || acceptInput({ deadline: speedDeadline.current, playerId: data.playerId, sceneId: voteTurn, graceMs: 750 }))) {
        applyVoteLocally(data.playerId, data.choice);
      }
    });
  }, [online, phase, players, voteTurn, applyVoteLocally, mode, clocksRun]);

  /* ---- Host: speed votes after the visible clock ran out are late (F12); the deadline follows pauses ---- */
  const speedDeadline = useRef(Number.POSITIVE_INFINITY);
  useEffect(() => { speedDeadline.current = deadline(serverClock.now(), speedTimerHook.timeLeft * 1000 + 1000); }, [speedTimerHook.timeLeft]);

  /* ---- Host: per-person time for each guest, removed players leave the round ---- */
  const guestTurn = handover.activeGuest ?? '';
  useEffect(() => {
    if (guestTurn && mode === 'speed' && phase === 'voting') { speedTimerHook.reset(speedTimer); speedTimerHook.start(); }
  }, [guestTurn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (online?.isHost && mode === 'speed' && phase === 'voting' && ballotComplete(players, roundVotes)) { speedTimerHook.pause(); setPhase('reveal'); }
  }, [roundVotes]); // eslint-disable-line react-hooks/exhaustive-deps
  const removedKey = online?.removedPlayerIds?.join(',') ?? '';
  useEffect(() => {
    if (!online?.isHost) return;
    const drop = dropVoters(players, roundVotes, online.removedPlayerIds ?? []);
    if (!drop) return;
    setPlayers(drop.players); setRoundVotes(drop.votes);
    if (phase !== 'voting' || !ballotComplete(drop.players, drop.votes)) return;
    if (mode === 'speed') speedTimerHook.pause();
    if (mode === 'debatte') { debateTimer.reset(30); debateTimer.start(); setPhase('debate'); } else setPhase('reveal');
  }, [removedKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
      receivePhaseStart(data.phaseStartsAt);
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
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen
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
      <style>{EP_STYLE}</style>{blocker}
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
          onClick={() => (view === 'gameOver' ? navigate('/games') : exitGuard.request())}
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
        {view === 'voting' && currentPair && (
          <TotVoting key="voting" online={online} localVoter={localVoter} players={players} roundVotes={roundVotes} voterIdx={voterIdx}
            totalRounds={totalRounds} currentRound={currentRound} mode={mode} speedTimeLeft={speedTimerHook.timeLeft}
            currentPair={currentPair} haptics={haptics} castVote={castVote} />
        )}

        {/* DEBATE */}
        {view === 'debate' && currentPair && (
          <TotDebate key="debate" online={online} currentPair={currentPair} debateTimeLeft={debateTimer.timeLeft} endDebate={endDebate} />
        )}

        {view === 'reveal' && currentPair && (
          <TotReveal key="reveal" online={online} currentPair={currentPair} currentRound={currentRound} totalRounds={totalRounds}
            players={players} roundVotes={roundVotes} voteStats={voteStats} haptics={haptics} nextRound={nextRound} />
        )}

        {view === 'gameOver' && winner && (
          <TotGameOver key="over" online={online} players={players} winner={winner} newAchievements={newAchievements}
            clearAchievements={clearAchievements} playAgain={playAgain} onOtherGame={() => navigate('/games')} />
        )}
      </AnimatePresence>

      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#df8eff" />
    </GameStage>
  );
}
