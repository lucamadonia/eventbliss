import { GameStage, StageHeader, StageAction, StageFooter } from '../ui/GameStage';
import './expedition.css';
import { ObjectBoard, ObjectPicture } from './VisualObjects';
import { OBJECT_ATLAS, createVisualScene, createVisualDifference, parseObjectGrid, projectVisualState, publicGeoPrompt, publicPanoramaDeck, type VisualScene as Scene, type VisualDiffScene as DiffScene } from './visual-content';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Zap, GitCompare, RotateCcw, ArrowLeft, Trophy, Medal, Play, Clock, Check, X, Target, MapPin, Camera } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { personalResult } from '../social/result';
import { useLocalGamePaused } from '../engine/local-pause';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { FINDIT_MODE_ASSETS } from '../ui/premium-game-assets';
import { GEO_LOCATIONS, filterByRegion, filterByDifficulty, type GeoLocation } from './geo-locations';
import WorldFinderSetup from './WorldFinderSetup';
import MapRound, { type MapRoundResult } from './MapRound';
import StreetViewRound, { type StreetViewResult } from './StreetViewRound';
import { getRandomStreetViewLocations, type StreetViewLocation } from './streetview-locations';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'karteSetup' | 'streetviewPlay' | 'study' | 'question' | 'answer' | 'roundEnd' | 'gameOver';
type Mode = 'memory' | 'speed' | 'unterschiede' | 'karte' | 'streetview';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  fastestMs: number;
}

// ---------------------------------------------------------------------------
// Scenes Data (16 scenes)
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

function getColor(i: number) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }

// ---------------------------------------------------------------------------
// Game Modes Config
// ---------------------------------------------------------------------------

function getGameModes(t: TFunction): GameMode[] {
  return [
    { id: 'memory', name: t('woIstWas.modes.memory', 'Memory'), desc: t('woIstWas.modes.memoryDesc', 'Merke dir die Szene und beantworte Fragen'), icon: <Eye className="w-6 h-6" /> },
    { id: 'speed', name: t('woIstWas.modes.speed', 'Speed'), desc: t('woIstWas.modes.speedDesc', 'Wer findet es am schnellsten?'), icon: <Zap className="w-6 h-6" /> },
    { id: 'unterschiede', name: t('woIstWas.modes.differences', 'Unterschiede'), desc: t('woIstWas.modes.differencesDesc', 'Finde 3 Unterschiede in zwei Bildern'), icon: <GitCompare className="w-6 h-6" /> },
    { id: 'karte', name: t('woIstWas.modes.map', 'Karte'), desc: t('woIstWas.modes.mapDesc', 'Finde Städte und Länder auf der Weltkarte'), icon: <MapPin className="w-6 h-6" /> },
    { id: 'streetview', name: t('woIstWas.modes.streetview', 'Street View'), desc: t('woIstWas.modes.streetviewDesc', 'Wo bist du? Rate den Standort!'), icon: <Camera className="w-6 h-6" /> },
  ];
}

function getSetupSettings(t: TFunction): SettingsConfig {
  return {
    timer: { min: 5, max: 60, default: 10, step: 1, label: t('woIstWas.settings.time', 'Zeit (Sek.)') },
    rounds: { min: 3, max: 15, default: 8, step: 1, label: t('woIstWas.settings.rounds', 'Runden') },
  };
}

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
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [readyPeers, setReadyPeers] = useState<string[]>([]);
  const [hostImagesAvailable, setHostImagesAvailable] = useState(false);
  const imagesAvailable = imageReady && (!online || (online.isHost
    ? players.every(p => p.id === online.myPlayerId || readyPeers.includes(p.id))
    : hostImagesAvailable));
  useEffect(() => {
    let active = true;
    const picture = new Image();
    setImageError(false);
    picture.onload = () => { if (active) setImageReady(true); };
    picture.onerror = () => { if (active) setImageError(true); };
    picture.src = OBJECT_ATLAS;
    return () => { active = false; picture.onload = null; picture.onerror = null; };
  }, [imageAttempt]);
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('findit-assets-ready', data => {
      if (typeof data.__senderId !== 'string') return;
      const id = data.__senderId;
      setReadyPeers(previous => previous.includes(id) ? previous : [...previous, id]);
    });
  }, [online]);
  useEffect(() => {
    if (!online || online.isHost || !imageReady) return;
    const announce = () => online.broadcast('findit-assets-ready', {});
    announce();
    const retry = setInterval(announce, 1500);
    return () => clearInterval(retry);
  }, [online, imageReady]);

  // Public display receives images and translated labels; solutions only on reveal.
  const tvQuestion = currentScene?.questions[questionIdx];
  const tvRevealed = phase === 'answer' || phase === 'roundEnd';
  useTVGameBridge('findit', {
    phase, round, totalRounds, players, currentPlayerIdx,
    mode,
    studyCountdown,
    questionCountdown,
    imagesAvailable,
    questionIdx,
    totalQuestions: currentScene?.questions.length ?? 0,
    sceneName: t(currentScene?.name ?? currentDiff?.name ?? 'games.findit.visual.boardTitle'),
    // shared emoji grid (memory/speed) + diff grids (unterschiede)
    grid: mode === 'memory' && phase !== 'study' && phase !== 'roundEnd' ? '' : currentScene?.grid ?? '',
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
  }, [phase, round, currentPlayerIdx, mode, studyCountdown, questionCountdown, questionIdx, tvQuestion?.q, currentScene?.grid, currentDiff, foundDiffs, currentGeo?.name, selectedAnswer, answerCorrect]);

  // Timing
  const questionStartRef = useRef(0);
  const studyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (imagesAvailable && phase === 'question') questionStartRef.current = performance.now();
  }, [imagesAvailable]);

  const disconnectedAtRef = useRef<{ at: number; started: number | null } | null>(null);
  useEffect(() => {
    if (online?.isConnected === false || locallyPaused) {
      disconnectedAtRef.current ??= { at: performance.now(), started: questionStartRef.current };
    } else if (disconnectedAtRef.current) {
      const paused = disconnectedAtRef.current;
      if (questionStartRef.current !== null && questionStartRef.current === paused.started) questionStartRef.current += performance.now() - paused.at;
      disconnectedAtRef.current = null;
    }
  }, [online?.isConnected, locallyPaused]);

  // Latest-ref pattern: avoids stale closures across timer callbacks and forward references
  const handleTimeoutRef = useRef<() => void>(() => {});
  const advanceQuestionRef = useRef<() => void>(() => {});
  const advanceRoundRef = useRef<() => void>(() => {});

  // --- Online sync: host broadcasts, non-host receives ---
  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('findit-state', (data) => {
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
    return unsub;
  }, [online]);

  // Listen for other players' map/streetview guesses (for parallel pin placement)
  useEffect(() => {
    if (!online) return;
    const unsub = online.onBroadcast('findit-guess', (data) => {
      // Host collects all guesses — handled by MapRound/StreetViewRound onRoundComplete
      // This is for future per-player parallel guessing
    });
    return unsub;
  }, [online]);

  const broadcastFindItState = useCallback((overrides?: Record<string, unknown>) => {
    if (!online?.isHost) return;
    online.broadcast('findit-state', projectVisualState({
      imagesAvailable, mode, totalRounds, studyTime, currentScene, currentDiff, questionIdx, foundDiffs, studyCountdown, questionCountdown,
      phase, round, currentPlayerIdx, players: JSON.parse(JSON.stringify(players)),
      selectedAnswer, answerCorrect,
      // Include geo data so non-hosts can render the same map/streetview
      currentGeo: publicGeoPrompt(currentGeo),
      svLocations: publicPanoramaDeck(svLocations, svRound),
      svRound,
      ...overrides,
    }));
  }, [online, imagesAvailable, mode, totalRounds, studyTime, currentScene, currentDiff, questionIdx, foundDiffs, studyCountdown, questionCountdown, phase, round, currentPlayerIdx, players, selectedAnswer, answerCorrect, currentGeo, svLocations, svRound]);

  useEffect(() => {
    if (online?.isHost) {
      broadcastFindItState();
    }
  }, [online, broadcastFindItState]);

  // Initial-state handshake: late joiners request current state, host replies.
  useEffect(() => {
    if (!online || !online.isHost) return;
    return online.onBroadcast('request-state', () => {
      if (phase !== 'setup') broadcastFindItState();
    });
  }, [online, phase, broadcastFindItState]);

  const requestedStateRef = useRef(false);
  useEffect(() => {
    if (!online || online.isHost || requestedStateRef.current) return;
    requestedStateRef.current = true;
    online.broadcast('request-state', {});
  }, [online]);

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
    if ((online && (!online.isHost || online.isConnected === false)) || locallyPaused || !imagesAvailable || phase !== 'study') return;
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
  }, [online, imagesAvailable, phase, mode, locallyPaused]);

  // ------- Question countdown timer (NOT for karte/streetview — they have their own) -------
  useEffect(() => {
    if ((online && (!online.isHost || online.isConnected === false)) || locallyPaused || !imagesAvailable || phase !== 'question') return;
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
  }, [online, imagesAvailable, phase, mode, questionIdx, round, currentPlayerIdx, locallyPaused]);

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
    if (selectedAnswer !== null || locallyPaused || !imagesAvailable || phase !== 'question') return;
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
  }, [online, imagesAvailable, round, selectedAnswer, phase, currentScene, questionIdx, currentPlayerIdx]);

  // ------- Handle diff tap -------
  const handleDiffTap = useCallback((cellIdx: number) => {
    if (online && !online.isHost) { online.broadcast('findit-action', { type: 'diff', cellIdx, round, questionIdx }); return; }
    if (!imagesAvailable || online?.isConnected === false) return;
    if (phase !== 'question' || !currentDiff || !Number.isInteger(cellIdx) || cellIdx < 0 || cellIdx >= 6) return;
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
  }, [online, imagesAvailable, round, questionIdx, phase, currentDiff, foundDiffs, currentPlayerIdx]);

  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('findit-action', data => {
      if (phase !== 'question' || data.__senderId !== players[currentPlayerIdx]?.id || data.round !== round || data.questionIdx !== questionIdx) return;
      if (data.type === 'answer' && Number.isInteger(data.optionIdx)) handleAnswer(data.optionIdx as number);
      if (data.type === 'diff' && Number.isInteger(data.cellIdx)) handleDiffTap(data.cellIdx as number);
    });
  }, [online, phase, players, currentPlayerIdx, round, questionIdx, handleAnswer, handleDiffTap]);

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

  // ------- Parsed grid memo -------
  const parsedGrid = useMemo(() => {
    if (currentScene) return parseObjectGrid(currentScene.grid);
    return null;
  }, [currentScene]);

  const parsedDiffA = useMemo(() => currentDiff ? parseObjectGrid(currentDiff.gridA) : null, [currentDiff]);
  const parsedDiffB = useMemo(() => currentDiff ? parseObjectGrid(currentDiff.gridB) : null, [currentDiff]);

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

  if (phase === 'gameOver') {
    return (
      <>
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <GameOverScreen players={sortedPlayers} onRestart={rematch} onBack={() => navigate('/games')} totalRounds={totalRounds} />
      </>
    );
  }

  const currentPlayer = players[currentPlayerIdx];

  return (
    <GameStage gameId="wo-ist-was" className="expedition select-none">
      <div className="expedition-workbench mx-auto max-w-4xl space-y-6">

        <StageHeader title={t(currentScene?.name ?? currentDiff?.name ?? 'games.findit.gameOverTitle')}
          eyebrow={t('games.findit.roundLabel',{current:round+1,total:totalRounds})}
          subtitle={t('games.findit.playerTurn',{name:currentPlayer?.name})}
          leading={!hasShellBackButton() ? <button onClick={exitGuard.request} aria-label={t('common.back')} className="expedition-back"><ArrowLeft size={20}/></button> : undefined}
          trailing={<div className="expedition-clock"><span>{phase === 'study' ? studyCountdown : phase === 'question' ? questionCountdown : currentPlayer?.score}</span><small>{phase === 'study' || phase === 'question' ? 's' : t('games.results.points')}</small></div>}
          progress={{value:round+1,total:totalRounds}} />

        {/* Study Phase */}
        {!imagesAvailable && mode !== 'karte' && mode !== 'streetview' && <div className="findit-content-loading" role="status">
          {t(imageError ? 'games.findit.visual.imageError' : 'games.findit.visual.loading')}
          {imageError && <StageAction onClick={() => setImageAttempt(value => value + 1)}>{t('games.findit.visual.retryImages')}</StageAction>}
        </div>}
        <AnimatePresence mode="wait">
          {imagesAvailable && phase === 'study' && (
            <motion.div
              key="study"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="expedition-phase space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="text-cyan-300 font-bold text-lg">{t('games.findit.studyMemorize')}</p>
                <motion.p
                  className="text-4xl font-black text-white"
                  key={studyCountdown}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {studyCountdown}
                </motion.p>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(studyCountdown / studyTime) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Emoji Grid */}
              {mode === 'unterschiede' && parsedDiffA && parsedDiffB ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ObjectBoard grid={parsedDiffA} label={t('games.findit.imgA')} />
                  <ObjectBoard grid={parsedDiffB} label={t('games.findit.imgB')} />
                </div>
              ) : parsedGrid ? (
                <ObjectBoard grid={parsedGrid} />
              ) : null}
            </motion.div>
          )}

          {/* Karte Mode is rendered OUTSIDE AnimatePresence below */}

          {/* Question Phase */}
          {imagesAvailable && (phase === 'question' || phase === 'answer') && mode !== 'unterschiede' && mode !== 'karte' && currentScene && (
            <motion.div
              key={`q-${questionIdx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="expedition-phase space-y-4"
            >
              {/* Show grid in speed mode */}
              {mode === 'speed' && parsedGrid && (
                <ObjectBoard grid={parsedGrid} compact />
              )}

              {/* Question timer */}
              <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-colors',
                    questionCountdown > 5 ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                  )}
                  style={{ width: `${(questionCountdown / 15) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="bg-gray-800/60 backdrop-blur border border-cyan-500/20 rounded-2xl p-5 text-center">
                <p className="text-xs text-cyan-400 mb-1 font-semibold">{t('games.findit.questionLabel', { current: questionIdx + 1, total: currentScene.questions.length })}</p>
                <p className="text-white font-bold text-lg leading-tight">{t(currentScene.questions[questionIdx].q, { position: currentScene.questions[questionIdx].position })}</p>
              </div>

              {/* Options */}
              <div className="findit-answer-options">
                {currentScene.questions[questionIdx].options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectOpt = idx === currentScene.questions[questionIdx].correct;
                  const showResult = phase === 'answer';

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={phase === 'answer' || !imagesAvailable || (!!online && online.myPlayerId !== players[currentPlayerIdx]?.id)}
                      className={cn(
                        'findit-answer-option rounded-xl border-2 font-semibold text-sm transition-all',
                        showResult && isCorrectOpt
                          ? 'border-green-400 bg-green-500/20 text-green-300'
                          : showResult && isSelected && !isCorrectOpt
                          ? 'border-red-400 bg-red-500/20 text-red-300'
                          : isSelected
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : 'border-gray-700 bg-gray-800/40 text-gray-200 hover:border-cyan-500/50 hover:bg-gray-800/60'
                      )}
                      whileTap={phase !== 'answer' ? { scale: 0.95 } : {}}
                    >
                      <ObjectPicture id={opt} label={t(`games.findit.objects.${opt}`)} />
                      <span className="flex items-center justify-center gap-2">
                        {showResult && isCorrectOpt && <Check className="w-4 h-4 text-green-400" />}
                        {showResult && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-red-400" />}
                        {t(`games.findit.objects.${opt}`)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Answer feedback */}
              <AnimatePresence>
                {phase === 'answer' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'text-center py-2 rounded-xl font-bold',
                      answerCorrect ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {answerCorrect ? t('games.findit.feedbackCorrect') : t('games.findit.feedbackWrong')}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Unterschiede Question Phase */}
          {imagesAvailable && (phase === 'question' || phase === 'answer') && mode === 'unterschiede' && currentDiff && parsedDiffA && parsedDiffB && (
            <motion.div
              key="diff-q"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="expedition-phase space-y-4"
            >
              <div className="text-center">
                <p className="text-cyan-300 font-bold">{t('games.findit.diffFindTitle', { count: currentDiff.count })}</p>
                <p className="text-gray-400 text-xs">{t('games.findit.visual.compareHint')}</p>
              </div>

              {/* Timer */}
              <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    questionCountdown > 5 ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                  )}
                  style={{ width: `${(questionCountdown / Math.max(30, studyTime * 3)) * 100}%` }}
                />
              </div>

              <div className="findit-comparison">
                <ObjectBoard grid={parsedDiffA} label={t('games.findit.imgOriginal')} compact />
                <ObjectBoard grid={parsedDiffB} label={t('games.findit.imgChanged')} targets={phase === 'answer' ? currentDiff.diffs : []} found={foundDiffs} onTap={handleDiffTap} disabled={phase !== 'question' || !imagesAvailable || (!!online && online.myPlayerId !== players[currentPlayerIdx]?.id)} />
              </div>

              <div className="flex justify-center gap-2">
                {Array.from({ length: currentDiff.count }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                      i < foundDiffs.length
                        ? 'border-green-400 bg-green-500/20'
                        : 'border-gray-600 bg-gray-800/40'
                    )}
                  >
                    {i < foundDiffs.length ? <Check className="w-4 h-4 text-green-400" /> : <span className="text-gray-500 text-xs">{i + 1}</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Round End */}
          {phase === 'roundEnd' && (
            <motion.div
              key="round-end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 space-y-3"
            >
              <Target className="w-10 h-10 text-cyan-400 mx-auto" />
              <p className="text-white font-bold text-xl">{t('games.findit.roundEndNext')}</p>
              <div className="flex justify-center gap-3">
                {players.map((p, i) => (
                  <div key={p.id} className="text-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.avatar}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{p.score}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Karte Mode — rendered OUTSIDE AnimatePresence for proper Leaflet height */}
        {phase === 'question' && mode === 'karte' && currentGeo && (
          <div className="fixed inset-0 z-50" style={{ background: '#0a0e14' }}>
            <MapRound
              key={`karte-${round}`}
              location={currentGeo}
              players={players}
              roundNumber={round + 1}
              totalRounds={totalRounds}
              timerSeconds={studyTime}
              online={online}
              onRoundComplete={(results: MapRoundResult[]) => {
                if (online && !online.isHost) return;
                const sorted = [...results].sort((a, b) => a.distanceKm - b.distanceKm);
                setPlayers(prev => prev.map(p => {
                  const res = results.find(r => r.playerId === p.id);
                  if (!res) return p;
                  const pts = Math.max(0, Math.round(1000 * Math.exp(-res.distanceKm / 2000)));
                  const isWinner = res.distanceKm < 20000 && res.distanceKm === sorted[0]?.distanceKm;
                  const bonus = isWinner ? 100 : 0;
                  return { ...p, score: p.score + pts + bonus, correct: p.correct + (isWinner ? 1 : 0) };
                }));
                const nextRound = round + 1;
                if (nextRound >= totalRounds) {
                  setPhase('gameOver');
                } else {
                  setRound(nextRound);
                  setCurrentGeo(geoPool[(nextRound) % geoPool.length]);
                }
              }}
              onExit={exitGuard.request}
            />
          </div>
        )}

        {/* Street View Mode */}
        {phase === 'streetviewPlay' && svLocations[svRound] && (
          <div className="fixed inset-0 z-50" style={{ background: '#0a0e14' }}>
            <StreetViewRound
              key={`sv-${svRound}`}
              location={svLocations[svRound]}
              players={players}
              roundNumber={svRound + 1}
              totalRounds={totalRounds}
              timerSeconds={studyTime}
              online={online}
              onRoundComplete={(results: StreetViewResult[]) => {
                if (online && !online.isHost) return;
                const sorted = [...results].sort((a, b) => a.distanceKm - b.distanceKm);
                setPlayers(prev => prev.map(p => {
                  const res = results.find(r => r.playerId === p.id);
                  if (!res) return p;
                  const pts = Math.max(0, Math.round(1000 * Math.exp(-res.distanceKm / 2000)));
                  const isWinner = res.distanceKm < 20000 && res.distanceKm === sorted[0]?.distanceKm;
                  return { ...p, score: p.score + pts + (isWinner ? 100 : 0), correct: p.correct + (isWinner ? 1 : 0) };
                }));
                const next = svRound + 1;
                if (next >= totalRounds) { setPhase('gameOver'); }
                else { setSvRound(next); }
              }}
              onExit={exitGuard.request}
            />
          </div>
        )}
      </div>

      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#06b6d4" />
    </GameStage>
  );
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

const rankIcons = [
  <Medal key="g" className="w-6 h-6 text-yellow-400" />,
  <Medal key="s" className="w-6 h-6 text-gray-300" />,
  <Medal key="b" className="w-6 h-6 text-amber-600" />,
];

const confettiColors = [
  '#06b6d4', '#0ea5e9', '#22d3ee', '#67e8f9', '#a5f3fc',
  '#8b5cf6', '#a78bfa', '#c4b5fd', '#f59e0b', '#fbbf24',
  '#ec4899', '#f472b6', '#10b981', '#34d399', '#6ee7b7',
  '#ef4444', '#f87171', '#fca5a5', '#6366f1', '#818cf8',
];

function GameOverScreen({ players, onRestart, onBack, totalRounds }: {
  players: Player[]; onRestart: () => void; onBack: () => void; totalRounds: number;
}) {
  const { t } = useTranslation();
  const winner = players[0];
  const totalCorrect = players.reduce((s, p) => s + p.correct, 0);
  const bestStreak = Math.max(...players.map(p => p.bestStreak), 0);

  return <GameStage gameId="wo-ist-was" className="expedition"><div className="expedition-results">
    <StageHeader title={players.filter(p=>p.score===winner?.score).map(p=>p.name).join(' / ')} eyebrow={t('games.findit.gameOverTitle')} subtitle={t('games.findit.points',{score:winner?.score})}/>
    <div className="expedition-facts">{[{label:t('games.findit.statsRounds'),value:totalRounds},{label:t('games.findit.statsCorrect'),value:totalCorrect},{label:t('games.findit.statsBestStreak'),value:bestStreak}].map(stat=><div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
    <div className="expedition-ranking">{players.map(player=><div key={player.id}><span>{String(players.filter(p=>p.score>player.score).length+1).padStart(2,'0')}</span><div><strong>{player.name}</strong><small>{t('games.findit.correctOf',{correct:player.correct,wrong:player.wrong})}</small></div><b>{player.score}</b></div>)}</div>
    <StageFooter><StageAction onClick={onRestart}><RotateCcw size={19}/>{t('games.findit.btnPlayAgain')}</StageAction>{!hasShellBackButton()&&<StageAction variant="secondary" onClick={onBack}>{t('games.findit.btnOtherGame')}</StageAction>}</StageFooter>
  </div></GameStage>;
}
