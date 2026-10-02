import { GameStage, StageHeader } from '../ui/GameStage';
import './expedition.css';
import { createVisualScene, createVisualDifference, publicGeoPrompt, publicPanoramaDeck, type VisualScene as Scene, type VisualDiffScene as DiffScene } from './visual-content';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { personalResult } from '../social/result';
import { useLocalGamePaused } from '../engine/local-pause';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GameSetup } from '../ui/GameSetup';
import { FINDIT_MODE_ASSETS } from '../ui/premium-game-assets';
import { GEO_LOCATIONS, filterByRegion, filterByDifficulty, type GeoLocation } from './geo-locations';
import WorldFinderSetup from './WorldFinderSetup';
import { GeoRounds } from './GeoRounds';
import { getRandomStreetViewLocations, type StreetViewLocation } from './streetview-locations';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { PartyTurnRibbon } from '../ui/PartyTurnRibbon';
import { dropFromTurnOrder } from './turn-order';
import { findItActiveSeat, findItTvPlayers, scoreGeoRound, senderMayAct } from './guest-turns';
import { getColor, getGameModes, getSetupSettings, shuffleArray, type Mode, type Phase, type Player } from './findit-config';
import { FindItGameOver } from './FindItGameOver';
import { TurnPhases } from './TurnPhases';
import { useFindItAssets } from './useFindItAssets';
import { useFindItSync } from './useFindItSync';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FindItGame({ online }: { online?: OnlineGameProps }) {
  const locallyPaused = useLocalGamePaused();
  const tasks = usePausableTasks(online?.isConnected !== false);
  const { setTimeout } = tasks;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));

  // Core state
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über dem Pfeil im Spiel und läuft nicht über dessen onClick.
  // Ohne Eintrag im Back-Guard-Stapel navigiert er mitten in der Runde weg und
  // die Partie ist futsch. Delegiert bewusst an denselben `exitGuard` wie der
  // Pfeil, damit es genau EINEN Bestätigungsdialog gibt.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    // Karten-Setup ist noch Vorbereitung: zurück führt eine Stufe hoch,
    // genau wie der Pfeil dort (onBack={() => setPhase('setup')}).
    if (phase === 'karteSetup') { setPhase('setup'); return true; }
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [mode, setMode] = useState<Mode>('memory');
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(8);
  const [studyTime, setStudyTime] = useState(10);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // Geo state (Karte mode)
  const [geoPool, setGeoPool] = useState<GeoLocation[]>([]);
  const [currentGeo, setCurrentGeo] = useState<GeoLocation | null>(null);
  const [svLocations, setSvLocations] = useState<StreetViewLocation[]>([]);
  const [svRound, setSvRound] = useState(0);

  // Scene state
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [currentDiff, setCurrentDiff] = useState<DiffScene | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);

  // Timer state
  const [studyCountdown, setStudyCountdown] = useState(0);
  const [questionCountdown, setQuestionCountdown] = useState(15);

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [foundDiffs, setFoundDiffs] = useState<number[]>([]);

  // Do not consume competitive time until each participating device has decoded the atlas.
  const { imagesAvailable, imageError, setImageAttempt, setHostImagesAvailable } = useFindItAssets(online, players);

  // 🔁 guests on the host phone: turn modes hand the phone over before the guest's turn
  // (clock stands until "Ich bin Max"); Karte / Street View guests pin one after another (guest-turns.ts).
  const [geoSeat, setGeoSeat] = useState<string | null>(null);
  const handover = useSeatHandover(online, findItActiveSeat(mode, phase, players, currentPlayerIdx) ?? geoSeat);
  const clockHeld = handover.isPaused;
  // All devices + TV switch phase together (design §9); input opens after the beat.
  const sync = useSyncedPhase(online, phase, [phase, round, svRound, currentPlayerIdx]);
  const view = sync.view, inputOpen = sync.blocker === null;
  const seatOnTurn = players[currentPlayerIdx]?.id;
  // This phone holds the turn: own seat, or the 🔁 guest who confirmed the handover.
  const holdsTurn = !!online && !!seatOnTurn && (seatOnTurn === online.myPlayerId || handover.activeGuest === seatOnTurn);
  const canActNow = !online || (inputOpen && holdsTurn);

  // Public display receives images and translated labels; solutions only on reveal.
  const tvQuestion = currentScene?.questions[questionIdx];
  const tvRevealed = phase === 'answer' || phase === 'roundEnd';
  useTVGameBridge('findit', {
    phase, phaseStartsAt: sync.phaseStartsAt, handover: handover.tv,
    round, totalRounds, players: findItTvPlayers(players, online?.players), currentPlayerIdx,
    mode,
    studyCountdown,
    questionCountdown,
    imagesAvailable,
    questionIdx,
    totalQuestions: currentScene?.questions.length ?? 0,
    sceneName: t(currentScene?.name ?? currentDiff?.name ?? 'games.findit.visual.boardTitle'),
    // shared emoji grid (memory/speed) + diff grids (unterschiede)
    // Memory: no study time on the TV while the host phone travels to the guest.
    grid: (mode === 'memory' && phase !== 'study' && phase !== 'roundEnd') || (mode === 'memory' && clockHeld) ? '' : currentScene?.grid ?? '',
    gridA: currentDiff?.gridA ?? '',
    gridB: currentDiff?.gridB ?? '',
    // diff target indices + found cells are answer-spoiling → reveal only
    diffs: tvRevealed && currentDiff ? currentDiff.diffs : [],
    foundDiffs,
    diffCount: currentDiff?.count ?? 0,
    // question + options for the audience; the correct index leaks only on reveal
    question: tvQuestion ? t(tvQuestion.q, { position: tvQuestion.position }) : '',
    options: tvQuestion?.options.map(id => t(`games.findit.objects.${id}`)) ?? [],
    optionObjects: tvQuestion?.options ?? [],
    correctOption: tvRevealed ? (tvQuestion?.correct ?? null) : null,
    geoName: currentGeo?.name ?? '',
    geoLat: null,
    geoLng: null,
    selectedAnswer,
    answerCorrect,
  }, [phase, round, currentPlayerIdx, mode, studyCountdown, questionCountdown, questionIdx, tvQuestion?.q, currentScene?.grid, currentDiff, foundDiffs, currentGeo?.name, selectedAnswer, answerCorrect, players, sync.phaseStartsAt, handover.tv?.playerId, handover.tv?.progress?.phase, clockHeld], !online || online.isHost);

  // Timing
  const questionStartRef = useRef(0);
  const studyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (imagesAvailable && phase === 'question') questionStartRef.current = performance.now();
  }, [imagesAvailable, inputOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnectedAtRef = useRef<{ at: number; started: number | null } | null>(null);
  useEffect(() => {
    if (online?.isConnected === false || locallyPaused || clockHeld) {
      disconnectedAtRef.current ??= { at: performance.now(), started: questionStartRef.current };
    } else if (disconnectedAtRef.current) {
      const paused = disconnectedAtRef.current;
      if (questionStartRef.current !== null && questionStartRef.current === paused.started) questionStartRef.current += performance.now() - paused.at;
      disconnectedAtRef.current = null;
    }
  }, [online?.isConnected, locallyPaused, clockHeld]);

  // Latest-ref pattern: avoids stale closures across timer callbacks and forward references
  const handleTimeoutRef = useRef<() => void>(() => {});
  const advanceQuestionRef = useRef<() => void>(() => {});
  const advanceRoundRef = useRef<() => void>(() => {});

  // --- Online sync: host broadcasts the public state, non-host applies it ---
  useFindItSync(online, {
    imagesAvailable, mode, totalRounds, studyTime, currentScene, currentDiff, questionIdx, foundDiffs, studyCountdown, questionCountdown,
    phase, round, currentPlayerIdx, players, selectedAnswer, answerCorrect,
    // Include geo data so non-hosts can render the same map/streetview
    currentGeo: publicGeoPrompt(currentGeo),
    svLocations: publicPanoramaDeck(svLocations, svRound),
    svRound, phaseStartsAt: sync.phaseStartsAt,
  }, (data) => {
    if (data.imagesAvailable !== undefined) setHostImagesAvailable(data.imagesAvailable === true);
    if (data.mode !== undefined) setMode(data.mode as Mode);
    if (data.totalRounds !== undefined) setTotalRounds(data.totalRounds as number);
    if (data.studyTime !== undefined) setStudyTime(data.studyTime as number);
    if (data.currentScene !== undefined) setCurrentScene(data.currentScene as Scene | null);
    if (data.currentDiff !== undefined) setCurrentDiff(data.currentDiff as DiffScene | null);
    if (data.questionIdx !== undefined) setQuestionIdx(data.questionIdx as number);
    if (data.foundDiffs !== undefined) setFoundDiffs(data.foundDiffs as number[]);
    if (data.studyCountdown !== undefined) setStudyCountdown(data.studyCountdown as number);
    if (data.questionCountdown !== undefined) setQuestionCountdown(data.questionCountdown as number);
    sync.receive(data.phaseStartsAt);
    if (data.phase !== undefined) setPhase(data.phase as Phase);
    if (data.round !== undefined) setRound(data.round as number);
    if (data.currentPlayerIdx !== undefined) setCurrentPlayerIdx(data.currentPlayerIdx as number);
    if (data.players) setPlayers(data.players as Player[]);
    if (data.selectedAnswer !== undefined) setSelectedAnswer(data.selectedAnswer as number | null);
    if (data.answerCorrect !== undefined) setAnswerCorrect(data.answerCorrect as boolean | null);
    // Sync geo/streetview data so all players see the same location
    if (data.currentGeo) setCurrentGeo(data.currentGeo as GeoLocation);
    if (data.svLocations) setSvLocations(data.svLocations as StreetViewLocation[]);
    if (data.svRound !== undefined) setSvRound(data.svRound as number);
  });

  // ------- Setup handler -------
  const handleSetupStart = useCallback((
    setupPlayers: { id: string; name: string; color: string; avatar: string }[],
    modeId: string,
    settings: { timer: number; rounds: number },
  ) => {
    if (online && !online.isHost) return;
    const mapped: Player[] = setupPlayers.map((p, i) => ({
      ...p,
      color: getColor(i),
      score: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, fastestMs: Infinity,
    }));
    setPlayers(mapped);
    setMode(modeId as Mode);
    setTotalRounds(settings.rounds);
    setStudyTime(settings.timer);
    setRound(0);
    setCurrentPlayerIdx(0);

    if (modeId === 'karte') {
      setPhase('karteSetup');
      return;
    }

    if (modeId === 'streetview') {
      const locs = getRandomStreetViewLocations(settings.rounds);
      setSvLocations(locs);
      setSvRound(0);
      setTotalRounds(settings.rounds);
      setPhase('streetviewPlay');
      return;
    }

    // Start first round
    startRound(modeId as Mode, settings.timer);
  }, []);

  // ------- Start a round -------
  const startRound = useCallback((m: Mode, studySec: number) => {
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setQuestionIdx(0);
    setFoundDiffs([]);
    setCurrentDiff(m === 'unterschiede' ? createVisualDifference() : null);
    setCurrentScene(m === 'unterschiede' ? null : createVisualScene());
    setPhase(m === 'memory' ? 'study' : 'question');
    setStudyCountdown(studySec);
    setQuestionCountdown(m === 'unterschiede' ? Math.max(30, studySec * 3) : 15);
    questionStartRef.current = performance.now();
  }, []);

  // ------- Study countdown timer -------
  useEffect(() => {
    if ((online && (!online.isHost || online.isConnected === false || !inputOpen)) || clockHeld || locallyPaused || !imagesAvailable || phase !== 'study') return;
    studyTimerRef.current = setInterval(() => {
      setStudyCountdown(prev => {
        if (prev <= 1) {
          clearInterval(studyTimerRef.current!);
          if (mode === 'unterschiede') {
            // In diff mode, study shows both grids then go to question (find diffs)
            setPhase('question');
          } else if (mode === 'speed') {
            // Speed mode: scene stays visible, go to question immediately
            setPhase('question');
          } else {
            // Memory mode: hide scene, go to question
            setPhase('question');
          }
          setQuestionCountdown(15);
          questionStartRef.current = performance.now();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (studyTimerRef.current) clearInterval(studyTimerRef.current); };
  }, [online, imagesAvailable, phase, mode, locallyPaused, inputOpen, clockHeld]);

  // ------- Question countdown timer (NOT for karte/streetview — they have their own) -------
  useEffect(() => {
    if ((online && (!online.isHost || online.isConnected === false || !inputOpen)) || clockHeld || locallyPaused || !imagesAvailable || phase !== 'question') return;
    if (mode === 'karte' || mode === 'streetview') return; // MapRound/StreetViewRound handle their own timers
    questionTimerRef.current = setInterval(() => {
      setQuestionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current!);
          handleTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [online, imagesAvailable, phase, mode, questionIdx, round, currentPlayerIdx, locallyPaused, inputOpen, clockHeld]);

  // ------- Handle timeout -------
  const handleTimeout = useCallback(() => {
    if (mode === 'unterschiede') {
      setPhase('answer');
      setTimeout(() => advanceRoundRef.current(), 3000);
    } else {
      setAnswerCorrect(false);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, wrong: p.wrong + 1, streak: 0 } : p));
      setPhase('answer');
      setTimeout(() => advanceQuestionRef.current(), 1500);
    }
  }, [mode, currentPlayerIdx]);
  handleTimeoutRef.current = handleTimeout;

  // ------- Handle answer selection -------
  const handleAnswer = useCallback((optionIdx: number) => {
    if (online && !online.isHost) { online.broadcast('findit-action', { type: 'answer', optionIdx, round, questionIdx }); return; }
    if (!imagesAvailable || online?.isConnected === false) return;
    if (selectedAnswer !== null || locallyPaused || clockHeld || !imagesAvailable || phase !== 'question') return;
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const elapsed = performance.now() - questionStartRef.current;
    const question = currentScene?.questions[questionIdx];
    if (!question || !Number.isInteger(optionIdx) || optionIdx < 0 || optionIdx >= question.options.length) return;

    const correct = optionIdx === question.correct;
    setSelectedAnswer(optionIdx);
    setAnswerCorrect(correct);

    // Speed bonus: faster = more points (max 100, min 25)
    const timeBonus = Math.max(25, Math.round(100 * (1 - elapsed / 15000)));
    const points = correct ? timeBonus : 0;

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIdx) return p;
      const newStreak = correct ? p.streak + 1 : 0;
      return {
        ...p,
        score: p.score + points + (correct && newStreak >= 3 ? 25 : 0),
        correct: p.correct + (correct ? 1 : 0),
        wrong: p.wrong + (correct ? 0 : 1),
        streak: newStreak,
        bestStreak: Math.max(p.bestStreak, newStreak),
        fastestMs: correct ? Math.min(p.fastestMs, elapsed) : p.fastestMs,
      };
    }));

    setPhase('answer');
    setTimeout(() => advanceQuestionRef.current(), 1500);
  }, [online, imagesAvailable, round, selectedAnswer, phase, currentScene, questionIdx, currentPlayerIdx, clockHeld]);

  // ------- Handle diff tap -------
  const handleDiffTap = useCallback((cellIdx: number) => {
    if (online && !online.isHost) { online.broadcast('findit-action', { type: 'diff', cellIdx, round, questionIdx }); return; }
    if (!imagesAvailable || online?.isConnected === false) return;
    if (phase !== 'question' || clockHeld || !currentDiff || !Number.isInteger(cellIdx) || cellIdx < 0 || cellIdx >= 6) return;
    if (foundDiffs.includes(cellIdx)) return;

    if (currentDiff.diffs.includes(cellIdx)) {
      const newFound = [...foundDiffs, cellIdx];
      setFoundDiffs(newFound);
      // Points for finding a diff
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIdx ? { ...p, score: p.score + 50, correct: p.correct + 1 } : p
      ));
      if (newFound.length >= currentDiff.diffs.length) {
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        setPhase('answer');
        setTimeout(() => advanceRoundRef.current(), 3000);
      }
    } else {
      // Wrong tap penalty
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIdx ? { ...p, score: Math.max(0, p.score - 10), wrong: p.wrong + 1 } : p
      ));
    }
  }, [online, imagesAvailable, round, questionIdx, phase, currentDiff, foundDiffs, currentPlayerIdx, clockHeld]);

  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('findit-action', data => {
      if (phase !== 'question' || !inputOpen || !senderMayAct(players[currentPlayerIdx]?.id, data.__senderId, online.players) || data.round !== round || data.questionIdx !== questionIdx) return;
      if (data.type === 'answer' && Number.isInteger(data.optionIdx)) handleAnswer(data.optionIdx as number);
      if (data.type === 'diff' && Number.isInteger(data.cellIdx)) handleDiffTap(data.cellIdx as number);
    });
  }, [online, phase, players, currentPlayerIdx, round, questionIdx, handleAnswer, handleDiffTap, inputOpen]);

  // ------- Advance to next question or next round -------
  const advanceQuestion = useCallback(() => {
    if (!currentScene) return;
    const nextQ = questionIdx + 1;
    if (nextQ < currentScene.questions.length) {
      setQuestionIdx(nextQ);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setPhase('question');
      setQuestionCountdown(15);
      questionStartRef.current = performance.now();
    } else {
      advanceRoundRef.current();
    }
  }, [currentScene, questionIdx]);
  advanceQuestionRef.current = advanceQuestion;

  // ------- Advance round -------
  const advanceRound = useCallback(() => {
    const nextPlayer = (currentPlayerIdx + 1) % players.length;
    const nextRound = nextPlayer === 0 ? round + 1 : round;
    const actualRound = currentPlayerIdx === 0 ? round : round;

    if (actualRound + 1 >= totalRounds && nextPlayer === 0) {
      setPhase('gameOver');
      return;
    }

    // Show brief round end
    setPhase('roundEnd');
    setTimeout(() => {
      setCurrentPlayerIdx(nextPlayer);
      setRound(nextRound);
      startRound(mode, studyTime);
    }, 1500);
  }, [currentPlayerIdx, players.length, round, totalRounds, mode, studyTime, startRound]);
  advanceRoundRef.current = advanceRound;

  // ------- Host: kicked/left players leave the roster and the turn order (G7) -------
  useRemovedPlayers(online, ids => {
    const turnBased = mode !== 'karte' && mode !== 'streetview' && ['study', 'question', 'answer', 'roundEnd'].includes(phase);
    const next = dropFromTurnOrder(players, currentPlayerIdx, ids, turnBased && phase === 'roundEnd');
    if (!next) return;
    setPlayers(next.players);
    setCurrentPlayerIdx(next.currentIdx);
    if (!turnBased || !next.advance) return;
    tasks.clear();
    if (next.wrapped && round + 1 >= totalRounds) { setPhase('gameOver'); return; }
    if (next.wrapped) setRound(round + 1);
    startRound(mode, studyTime);
  });

  // ------- Restart -------
  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const result = personalResult(players, online?.myPlayerId);
      recordEnd('wo-ist-was', result.score, result.won);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleKarteSetup = useCallback((settings: { region: string; difficulty: number; rounds: number; timer?: number }) => {
    const filtered = filterByRegion(GEO_LOCATIONS, settings.region);
    const pool = filterByDifficulty(filtered.length > 0 ? filtered : [...GEO_LOCATIONS], settings.difficulty);
    const shuffled = shuffleArray(pool);
    setGeoPool(shuffled);
    setCurrentGeo(shuffled[0]);
    setTotalRounds(settings.rounds);
    setStudyTime(settings.timer || 30); // configurable timer per round
    setPhase('question');
  }, []);

  const handleRestart = useCallback(() => {
    tasks.clear();
    setPhase('setup');
    setPlayers([]);
    setRound(0);
  }, []);

  // A rematch keeps settings and roster, but no previous match statistics.
  const rematch = useCallback(() => {
    if (online && !online.isHost) { online.broadcast('findit-rematch', {}); return; }
    if (players.length === 0) { handleRestart(); return; }
    gameRecordedRef.current = false;
    tasks.clear();
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, fastestMs: Infinity })));
    setRound(0);
    setCurrentPlayerIdx(0);
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setFoundDiffs([]);


    if (mode === 'karte') {
      const shuffled = shuffleArray(geoPool.length > 0 ? geoPool : [...GEO_LOCATIONS]);
      setGeoPool(shuffled);
      setCurrentGeo(shuffled[0]);
      setPhase('question');
      return;
    }

    if (mode === 'streetview') {
      const locs = getRandomStreetViewLocations(totalRounds);
      setSvLocations(locs);
      setSvRound(0);
      setPhase('streetviewPlay');
      return;
    }

    startRound(mode, studyTime);
  }, [online, players, mode, geoPool, totalRounds, studyTime, startRound, handleRestart]);

  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('findit-rematch', data => { if (phase === 'gameOver' && players.some(p => p.id === data.__senderId)) rematch(); });
  }, [online, phase, players, rematch]);

  // ------- Sorted results -------
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  // ===== RENDER =====

  if (online && !online.isHost && (phase === 'setup' || phase === 'karteSetup')) return <OnlineWaiting />;
  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="wo-ist-was"
        modes={getGameModes(t)}
        modeAssets={FINDIT_MODE_ASSETS}
        accent="#8ff5ff"
        settings={getSetupSettings(t)}
        onStart={handleSetupStart}
        title={t('games.findit.gameOverTitle')}
        minPlayers={1}
        maxPlayers={10}
        onlinePlayers={online?.players}
      />
    );
  }

  if (phase === 'karteSetup') {
    return (
      <div className="fixed inset-0 z-50" style={{ background: '#0a0e14' }}>
        <WorldFinderSetup onStart={handleKarteSetup} onBack={() => setPhase('setup')} />
      </div>
    );
  }

  if (view === 'gameOver') {
    return (
      <>
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <FindItGameOver players={sortedPlayers} onRestart={rematch} onBack={() => navigate('/games')} totalRounds={totalRounds} />
      </>
    );
  }
  // Turn modes: phone in transit → only the opaque pass screen (Karte/Street View keep their round mounted below it).
  if (handover.overlay && mode !== 'karte' && mode !== 'streetview') return handover.overlay;

  const currentPlayer = players[currentPlayerIdx];

  return (
    <GameStage gameId="wo-ist-was" className="expedition select-none">
      {sync.blocker}
      <div className="expedition-workbench mx-auto max-w-4xl space-y-6">

        <StageHeader title={t(currentScene?.name ?? currentDiff?.name ?? 'games.findit.gameOverTitle')}
          eyebrow={t('games.findit.roundLabel',{current:round+1,total:totalRounds})}
          subtitle={t('games.findit.playerTurn',{name:currentPlayer?.name})}
          leading={!hasShellBackButton() ? <button onClick={exitGuard.request} aria-label={t('common.back')} className="expedition-back"><ArrowLeft size={20}/></button> : undefined}
          trailing={<div className="expedition-clock"><span>{view === 'study' ? studyCountdown : view === 'question' ? questionCountdown : currentPlayer?.score}</span><small>{view === 'study' || view === 'question' ? 's' : t('games.results.points')}</small></div>}
          progress={{value:round+1,total:totalRounds}} />
        {online && currentPlayer && mode !== 'karte' && mode !== 'streetview' && (
          <PartyTurnRibbon player={currentPlayer} kind={holdsTurn ? 'me' : 'other'}
            line={holdsTurn ? undefined : t('games.findit.watchTurn', 'Schau mit – gleich bist du dran.')} />
        )}

        <TurnPhases view={view} mode={mode} imagesAvailable={imagesAvailable} imageError={imageError} onRetryImages={() => setImageAttempt(value => value + 1)}
          studyCountdown={studyCountdown} studyTime={studyTime} questionCountdown={questionCountdown} currentScene={currentScene} currentDiff={currentDiff}
          questionIdx={questionIdx} selectedAnswer={selectedAnswer} answerCorrect={answerCorrect} foundDiffs={foundDiffs} players={players}
          canAct={canActNow} onAnswer={handleAnswer} onDiffTap={handleDiffTap} />

        <GeoRounds view={view} mode={mode} round={round} svRound={svRound} totalRounds={totalRounds} timerSeconds={studyTime} players={players}
          currentGeo={currentGeo} svLocation={svLocations[svRound]} online={online} handover={handover} onLocalSeat={setGeoSeat} onExit={exitGuard.request}
          onComplete={results => {
            if (online && !online.isHost) return;
            setPlayers(prev => scoreGeoRound(prev, results));
            if (mode === 'karte') {
              const nextRound = round + 1;
              if (nextRound >= totalRounds) setPhase('gameOver');
              else { setRound(nextRound); setCurrentGeo(geoPool[nextRound % geoPool.length]); }
            } else {
              const next = svRound + 1;
              if (next >= totalRounds) setPhase('gameOver');
              else setSvRound(next);
            }
          }} />
      </div>

      {(mode === 'karte' || mode === 'streetview') && handover.overlay}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#06b6d4" />
    </GameStage>
  );
}
