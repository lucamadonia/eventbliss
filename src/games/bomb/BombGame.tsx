import { publicBombState } from './rules';
import { removeBombPlayers } from './removal';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { resetQuestions, type QuizQuestion } from '../content/questions';
import BombSetupScreen from './BombSetupScreen';
import BombPlayingScreen from './BombPlayingScreen';
import BombExplosionScreen from './BombExplosionScreen';
import BombResultsScreen, { BombRoundEndScreen } from './BombResultsScreen';
import BombTutorial from './BombTutorial';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { usePhaseGate } from '../party/usePhaseGate';
import { generateTask, speedFuseRange, useBombTimer, useTickSound } from './bomb-clock';
import { bombHolderId, bombHolderKind, bombSenderMayAct, bombTvHandover, bombTvPlayers, enterBombPhase } from './guest-turns';

// ---------------------------------------------------------------------------
// Types (exported for sub-components)
// ---------------------------------------------------------------------------

export type GamePhase = 'setup' | 'playing' | 'explosion' | 'roundEnd' | 'gameOver';
export type GameMode = 'kategorie' | 'quiz' | 'speed' | 'alle';

export interface PlayerState {
  id?: string;
  name: string;
  penalties: number;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  players: PlayerState[];
  currentPlayerIndex: number;
  round: number;
  totalRounds: number;
  timerMin: number;
  timerMax: number;
  currentTask: string;
  currentQuiz: QuizQuestion | null;
  explodedPlayerIndex: number;
  speedTimerBase: number;
  randomTimer: boolean;
  sameCategory: boolean;
  revision?: number;
  /** Host: shared start of the current phase (server time) — all devices switch together. */
  phaseStartsAt?: number;
}


const defaultState: GameState = {
  phase: 'setup',
  mode: 'kategorie',
  players: [{ name: '', penalties: 0 }, { name: '', penalties: 0 }],
  currentPlayerIndex: 0,
  round: 1,
  totalRounds: 5,
  timerMin: 15,
  timerMax: 45,
  currentTask: '',
  currentQuiz: null,
  explodedPlayerIndex: -1,
  speedTimerBase: 30,
  randomTimer: false,
  sameCategory: false,
};

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function BombGame({ online }: { online?: OnlineGameProps }) {
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const resolvedPlayerNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const onlineInitialPlayers = resolvedPlayerNames.length >= 2
    ? resolvedPlayerNames.map((name, index) => ({ id: online?.players[index]?.id ?? partyRoster[index]?.id, name, penalties: 0 }))
    : undefined;
  const [state, setState] = useState<GameState>({
    ...defaultState,
    ...(onlineInitialPlayers ? { players: onlineInitialPlayers } : {}),
  });
  // All devices + TV switch phase together; the fuse only burns once input is open (design §9).
  const gate = usePhaseGate(state.phase, online ? state.phaseStartsAt : null);
  const view = gate.shown;
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const speedReductionRef = useRef(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);

  const navigate = useNavigate();
  // Achtung: `handleExit` weiter unten ist KEIN Ausstieg aus der Route, sondern
  // ein Reset zurück ins Setup desselben Spiels. Der echte Ausstieg gehört
  // hierher. Bombes Phase liegt verschachtelt in `state.phase`.
  const exitGuard = useConfirmExit(() => navigate('/games'));

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (state.phase === 'setup' || state.phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });


  // --- Online sync: host broadcasts state, non-host receives ---
  const consumedRevision = useRef<number>(-1);
  const broadcastState = useCallback((newState: GameState, extra?: Record<string, unknown>) => {
    if (!online || !online.isHost) return;
    online.broadcast('bomb-state', {
      ...extra,
      state: JSON.parse(JSON.stringify(publicBombState(newState))),
    });
    online.broadcast('tv-state', {
      game: 'bomb',
      phase: newState.phase,
      players: newState.players,
      currentPlayerIndex: newState.currentPlayerIndex,
      currentTask: newState.currentTask,
      round: newState.round,
      totalRounds: newState.totalRounds,
      explodedPlayerIndex: newState.explodedPlayerIndex,
    });
  }, [online]);

  // Host: kicked/left players leave the roster; the bomb moves on if they held it.
  useRemovedPlayers(online, ids => setState(prev => {
    const next = removeBombPlayers(prev, ids);
    if (next !== prev) setTimeout(() => broadcastState(next), 0);
    return next;
  }));

  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('bomb-state', (data) => {
      const incoming = data.state as unknown as GameState;
      if (incoming) {
        setState(incoming);
        if (incoming.phase === 'playing') {
          setTimerActive(false);
          setTimerKey((k) => k + 1);
        } else {
          setTimerActive(false);
        }
      }
    });
    return unsub;
  }, [online]);

  // Host: answers from phones — only for the current holder, from them or the device playing their 🔁 seat.
  useEffect(() => {
    if (!online || !online.isHost) return;
    return online.onBroadcast('bomb-action', (data) => {
      if (online.isConnected === false || state.phase !== 'playing' || !gate.inputOpen || data.revision !== (state.revision ?? 0)
        || consumedRevision.current === data.revision
        || !bombSenderMayAct(bombHolderId(state.players, state.currentPlayerIndex, online.players), data.__senderId, online.players)) return;
      const answer = Number(data.answerIndex);
      if (data.action === 'weiter' && state.mode !== 'quiz' && state.mode !== 'alle') advancePlayer();
      else if (data.action === 'alle-answer' && state.mode === 'alle' && typeof data.knows === 'boolean') applyAlle(data.knows);
      else if (data.action === 'quiz-answer' && state.currentQuiz && Number.isInteger(answer) && answer >= 0 && answer <= 3) applyQuiz(answer);
      else return;
      consumedRevision.current = state.revision ?? 0;
    });
  }, [online, state, gate.inputOpen, broadcastState]); // eslint-disable-line react-hooks/exhaustive-deps

  const fuse = speedFuseRange(state, speedReductionRef.current);

  const handleExplode = useCallback(() => {
    if (online && !online.isHost) return;
    setTimerActive(false);
    setState((prev) => {
      const updated = [...prev.players];
      const penaltyAmount = prev.mode === 'alle' ? 2 : 1;
      updated[prev.currentPlayerIndex] = {
        ...updated[prev.currentPlayerIndex],
        penalties: updated[prev.currentPlayerIndex].penalties + penaltyAmount,
      };
      const next = enterBombPhase({
        ...prev,
        revision: (prev.revision ?? 0) + 1,
        players: updated,
        explodedPlayerIndex: prev.currentPlayerIndex,
      }, 'explosion');
      // Broadcast from host after explosion
      if (online?.isHost) {
        setTimeout(() => {
          online.broadcast('bomb-state', { state: JSON.parse(JSON.stringify(next)) });
          online.broadcast('tv-state', {
            game: 'bomb', phase: 'explosion',
            players: next.players, currentPlayerIndex: next.currentPlayerIndex,
            explodedPlayerIndex: next.explodedPlayerIndex,
            round: next.round, totalRounds: next.totalRounds,
          });
        }, 0);
      }
      return next;
    });
  }, [online]);

  const { progress: localProgress, durationMs } = useBombTimer(timerActive, fuse.min, fuse.max, handleExplode, online?.isConnected !== false && gate.inputOpen);
  const [remoteDuration, setRemoteDuration] = useState(0);
  const [remoteProgress, setRemoteProgress] = useState(0);
  const timerBroadcastAt = useRef(0);
  const progress = online && !online.isHost ? remoteProgress : localProgress;
  useEffect(() => {
    if (!online?.isHost || Date.now() - timerBroadcastAt.current < 250) return;
    timerBroadcastAt.current = Date.now();
    online.broadcast('bomb-timer-state', { progress: localProgress, durationMs });
  }, [online, localProgress, durationMs]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('bomb-timer-state', data => {
      if (typeof data.progress === 'number') setRemoteProgress(data.progress);
      if (typeof data.durationMs === 'number') setRemoteDuration(data.durationMs);
    });
  }, [online]);

  useTickSound(timerActive && online?.isConnected !== false, progress);

  // TV bridge — placed AFTER useBombTimer so it can broadcast the live timer.
  // `timeLeft` is an integer (or -1 in random/hidden mode), so it re-broadcasts
  // ~once per second instead of per animation frame.
  const bombAvgSec = durationMs / 1000;
  const bombTimeLeft = state.randomTimer ? -1 : Math.max(0, Math.round((1 - progress) * bombAvgSec));
  useTVGameBridge('bomb', {
    phase: state.phase, phaseStartsAt: state.phaseStartsAt, mode: state.mode, players: bombTvPlayers(state.players, online?.players ?? partyRoster),
    handover: online ? bombTvHandover(bombHolderId(state.players, state.currentPlayerIndex, online.players), online.players) : null,
    partyScoresById: Object.fromEntries(state.players.flatMap((player, index) => { const id = player.id ?? online?.players[index]?.id ?? partyRoster[index]?.id; return id ? [[id, Math.max(...state.players.map(p => p.penalties)) - player.penalties]] : []; })),
    currentPlayerIndex: state.currentPlayerIndex, round: state.round, totalRounds: state.totalRounds,
    currentTask: state.currentTask, explodedPlayerIndex: state.explodedPlayerIndex,
    timeLeft: bombTimeLeft, timeTotal: bombAvgSec, randomTimer: state.randomTimer,
  }, [state.phase, state.phaseStartsAt, state.mode, state.round, state.currentPlayerIndex, state.explodedPlayerIndex, state.players.length, bombTimeLeft], !online || online.isHost);

  const update = (partial: Partial<GameState>) => setState((prev) => ({ ...prev, ...partial }));

  const startGame = () => {
    // Non-host cannot start game
    if (online && !online.isHost) return;
    resetQuestions();
    speedReductionRef.current = 0;
    const { task, quiz } = generateTask(state.mode);
    const newState: GameState = enterBombPhase({
      ...state,
      revision: (state.revision ?? 0) + 1,
      currentPlayerIndex: 0,
      round: 1,
      currentTask: task,
      currentQuiz: quiz,
      players: state.players.map((p) => ({ ...p, penalties: 0 })),
    }, 'playing');
    setState(newState);
    broadcastState(newState);

    // Show tutorial for 'alle' mode once per session
    if (state.mode === 'alle' && !sessionStorage.getItem('bomb-alle-tutorial-seen')) {
      setShowTutorial(true);
      // Don't start timer yet — it begins after tutorial dismissal
      return;
    }
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  const advancePlayer = () => {
    // If sameCategory is on AND mode is kategorie/alle, keep same task for the round
    const keepTask = state.sameCategory && (state.mode === 'kategorie' || state.mode === 'alle');
    const { task, quiz } = keepTask ? { task: state.currentTask, quiz: state.currentQuiz } : generateTask(state.mode);
    setState((prev) => {
      const next = {
        ...prev,
        revision: (prev.revision ?? 0) + 1,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        currentTask: task,
        currentQuiz: quiz,
      };
      broadcastState(next);
      return next;
    });
  };

  const handleWeiter = () => {
    if (!canPlay) return;
    if (online && !online.isHost) {
      // Non-host sends action to host
      online.broadcast('bomb-action', { action: 'weiter', revision: state.revision ?? 0 });
      return;
    }
    advancePlayer();
  };

  const handleQuizAnswer = (idx: number) => {
    if (!canPlay) return;
    if (online && !online.isHost) {
      online.broadcast('bomb-action', { action: 'quiz-answer', answerIndex: idx, revision: state.revision ?? 0 });
      return;
    }
    applyQuiz(idx);
  };

  const applyQuiz = (idx: number) => {
    if (state.currentQuiz && idx !== state.currentQuiz.correctIndex) {
      // Wrong answer: vibrate + generate new question, but KEEP same player
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      const { task, quiz } = generateTask(state.mode);
      const newState = { ...state, revision: (state.revision ?? 0) + 1, currentTask: task, currentQuiz: quiz };
      setState(newState);
      broadcastState(newState);
      return;
    }
    // Correct answer: advance to next player
    advancePlayer();
  };

  const handleAlleAnswer = (knows: boolean) => {
    if (!canPlay) return;
    if (online && !online.isHost) {
      online.broadcast('bomb-action', { action: 'alle-answer', knows, revision: state.revision ?? 0 });
      return;
    }
    applyAlle(knows);
  };

  const applyAlle = (knows: boolean) => {
    setState(prev => {
      const players = prev.players.map((p, i) => i === prev.currentPlayerIndex && !knows ? { ...p, penalties: p.penalties + 1 } : p);
      const next = { ...prev, revision: (prev.revision ?? 0) + 1, players, currentPlayerIndex: (prev.currentPlayerIndex + 1) % players.length };
      broadcastState(next);
      return next;
    });
  };

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    sessionStorage.setItem('bomb-alle-tutorial-seen', 'true');
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  useEffect(() => {
    if (state.phase === 'gameOver' && !recordedRef.current) {
      recordedRef.current = true;
      const winner = [...state.players].sort((a, b) => a.penalties - b.penalties)[0];
      const me = online ? state.players[online.players.findIndex(player => player.id === online.myPlayerId)] : winner;
      const bestScore = state.totalRounds - (me?.penalties ?? state.totalRounds);
      recordEnd('bomb', Math.max(0, bestScore), !!me && me.penalties === winner?.penalties);
    }
    if (state.phase === 'setup') recordedRef.current = false;
  }, [state.phase]);

  const handleExplosionNext = () => {
    if (online && !online.isHost) return;
    if (state.round >= state.totalRounds) {
      const next = enterBombPhase(state, 'gameOver');
      setState(next);
      broadcastState(next);
    } else {
      const next = enterBombPhase(state, 'roundEnd');
      setState(next);
      broadcastState(next);
    }
  };

  const handleNextRound = () => {
    if (online && !online.isHost) return;
    if (state.mode === 'speed') {
      speedReductionRef.current += 3000;
    }
    const { task, quiz } = generateTask(state.mode);
    const next: GameState = enterBombPhase({
      ...state,
      revision: (state.revision ?? 0) + 1,
      round: state.round + 1,
      currentPlayerIndex: 0,
      currentTask: task,
      currentQuiz: quiz,
    }, 'playing');
    setState(next);
    setTimerKey((k) => k + 1);
    setTimerActive(true);
    broadcastState(next);
  };

  const handleRestart = () => {
    if (online && !online.isHost) return;
    // A rematch keeps the roster and settings, and starts fresh scoring.
    speedReductionRef.current = 0;
    resetQuestions();
    recordedRef.current = false;
    const { task, quiz } = generateTask(state.mode);
    const newState: GameState = enterBombPhase({
      ...state,
      revision: (state.revision ?? 0) + 1,
      players: state.players.map(p => ({ ...p, penalties: 0 })),
      currentPlayerIndex: 0,
      round: 1,
      currentTask: task,
      currentQuiz: quiz,
      explodedPlayerIndex: -1,
    }, 'playing');
    setState(newState);
    broadcastState(newState);

    if (state.mode === 'alle' && !sessionStorage.getItem('bomb-alle-tutorial-seen')) {
      setShowTutorial(true);
      return;
    }
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  const handleExit = () => {
    if (online && !online.isHost) return;
    setTimerActive(false);
    setState({ ...defaultState });
  };

  // 🔁 guests hold the bomb on the host phone: the host simply hands it over, the fuse keeps burning (guest-turns.ts).
  const holderId = bombHolderId(state.players, state.currentPlayerIndex, online?.players);
  const holderKind = online ? bombHolderKind(holderId, online.myPlayerId, localSeats(online)) : 'me';
  const holderSeat = online?.players.find(p => p.id === holderId);
  const canPlay = state.phase === 'playing' && gate.inputOpen && (!online || (online.isConnected !== false && holderKind !== 'other'));
  if (state.phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  return (
    // Fragment, damit der Verlassen-Dialog NEBEN der AnimatePresence liegt und
    // deren mode="wait"-Phasenwechsel nicht als zweites Kind stört.
    <>
    {!gate.inputOpen && <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />}
    <AnimatePresence mode="wait">
      {view === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0 }}>
          <BombSetupScreen locked={!!online} state={state} onUpdate={update} onStart={startGame} />
        </motion.div>
      )}
      {showTutorial && (
        <BombTutorial onDismiss={handleTutorialDismiss} />
      )}
      {view === 'playing' && !showTutorial && (
        <motion.div key={`playing-${timerKey}`} exit={{ opacity: 0 }}>
          <BombPlayingScreen
            canPlay={canPlay}
            state={state}
            progress={progress}
            timeLeft={Math.max(0, Math.ceil((1 - progress) * (online && !online.isHost ? remoteDuration : durationMs) / 1000))}
            onWeiter={handleWeiter}
            onQuizAnswer={handleQuizAnswer}
            onAlleAnswer={handleAlleAnswer}
            holder={online && holderSeat ? { player: holderSeat, kind: holderKind } : undefined}
            seats={online ? bombTvPlayers(state.players, online.players) : undefined}
          />
        </motion.div>
      )}
      {view === 'explosion' && (
        <motion.div key="explosion" exit={{ opacity: 0 }}>
          <BombExplosionScreen
            playerName={state.players[state.explodedPlayerIndex]?.name ?? '???'}
            onNext={handleExplosionNext}
          />
        </motion.div>
      )}
      {view === 'roundEnd' && (
        <motion.div key="roundEnd" exit={{ opacity: 0 }}>
          <BombRoundEndScreen state={state} onNext={handleNextRound} />
        </motion.div>
      )}
      {view === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <BombResultsScreen state={state} onRestart={handleRestart} onExit={handleExit} />
        </motion.div>
      )}
    </AnimatePresence>
    <ConfirmExitDialog {...exitGuard.dialogProps} accent="#ff7350" />
    </>
  );
}
