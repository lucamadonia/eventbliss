import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Zap, GitCompare, RotateCcw, ArrowLeft, Trophy, Medal, Play, Clock, Check, X, Target, MapPin, Camera } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { GEO_LOCATIONS, filterByRegion, type GeoLocation } from './geo-locations';
import WorldFinderSetup from './WorldFinderSetup';
import MapRound, { type MapRoundResult } from './MapRound';
import StreetViewRound, { type StreetViewResult } from './StreetViewRound';
import { getRandomStreetViewLocations, type StreetViewLocation } from './streetview-locations';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'karteSetup' | 'streetviewPlay' | 'study' | 'question' | 'answer' | 'roundEnd' | 'gameOver';
type Mode = 'memory' | 'speed' | 'unterschiede' | 'karte' | 'streetview';

interface Scene {
  name: string;
  grid: string;
  questions: { q: string; options: string[]; correct: number }[];
}

interface DiffScene {
  name: string;
  gridA: string;
  gridB: string;
  diffs: number[]; // indices of differing cells in gridB
}

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

const SCENES: Scene[] = [
  {
    name: 'Am Strand',
    grid: '🌴🏖️☀️⛱️🌊\n🐚🦀🏄‍♂️🐬🎣\n🍦🥥🧴👙🩱',
    questions: [
      { q: 'Welches Tier war im Bild?', options: ['Krabbe', 'Hund', 'Vogel', 'Fisch'], correct: 0 },
      { q: 'Was für ein Sport war zu sehen?', options: ['Surfen', 'Tennis', 'Fußball', 'Golf'], correct: 0 },
      { q: 'Welche Frucht war dabei?', options: ['Apfel', 'Kokosnuss', 'Banane', 'Orange'], correct: 1 },
    ],
  },
  {
    name: 'In der Stadt',
    grid: '🏢🏪🚗🚦🏛️\n👨‍💼🧑‍🎨🚲🚌🏍️\n🌳🐕🗑️🪧📮',
    questions: [
      { q: 'Welches Fahrzeug war NICHT zu sehen?', options: ['Auto', 'Zug', 'Bus', 'Fahrrad'], correct: 1 },
      { q: 'Welches Tier war in der Stadt?', options: ['Katze', 'Hund', 'Vogel', 'Pferd'], correct: 1 },
      { q: 'Was stand am Straßenrand?', options: ['Briefkasten', 'Telefon', 'Brunnen', 'Statue'], correct: 0 },
    ],
  },
  {
    name: 'In der Küche',
    grid: '🍳🥘🧑‍🍳🍰🧁\n🥕🍅🧄🌶️🥦\n🍴🥄🔪🍷🧂',
    questions: [
      { q: 'Welches Gemüse war NICHT dabei?', options: ['Karotte', 'Gurke', 'Tomate', 'Knoblauch'], correct: 1 },
      { q: 'Welches Besteck war zu sehen?', options: ['Gabel', 'Essstäbchen', 'Löffel', 'Gabel und Löffel'], correct: 3 },
      { q: 'Was für ein Getränk war dabei?', options: ['Bier', 'Wein', 'Wasser', 'Saft'], correct: 1 },
    ],
  },
  {
    name: 'Im Wald',
    grid: '🌲🌳🍄🦊🐿️\n🍂🌿🦉🐛🕷️\n🏕️🔥🪵🎒🧭',
    questions: [
      { q: 'Welches Tier war im Wald?', options: ['Bär', 'Fuchs', 'Hirsch', 'Hase'], correct: 1 },
      { q: 'Was war auf dem Boden?', options: ['Pilz', 'Blume', 'Stein', 'Bach'], correct: 0 },
      { q: 'Was war beim Campingplatz?', options: ['Zelt', 'Feuer', 'Auto', 'Hütte'], correct: 1 },
    ],
  },
  {
    name: 'Im Büro',
    grid: '💻🖨️📱📊📋\n☕🖊️📁📌📎\n🪴🕰️📞🗂️💡',
    questions: [
      { q: 'Welches Gerät war zu sehen?', options: ['Drucker', 'Scanner', 'Kamera', 'Radio'], correct: 0 },
      { q: 'Was hing an der Wand?', options: ['Bild', 'Uhr', 'Spiegel', 'Kalender'], correct: 1 },
      { q: 'Welches Getränk stand auf dem Tisch?', options: ['Tee', 'Wasser', 'Kaffee', 'Saft'], correct: 2 },
    ],
  },
  {
    name: 'Im Weltraum',
    grid: '🚀🌍🌙⭐🪐\n👨‍🚀🛸🌌☄️🔭\n🛰️🌑🌞🌠💫',
    questions: [
      { q: 'Was flog durch den Weltraum?', options: ['Rakete', 'Flugzeug', 'Ballon', 'Drache'], correct: 0 },
      { q: 'Welcher Himmelskörper war dabei?', options: ['Jupiter', 'Mond', 'Mars', 'Venus'], correct: 1 },
      { q: 'Was nutzte der Astronaut?', options: ['Fernglas', 'Teleskop', 'Kamera', 'Kompass'], correct: 1 },
    ],
  },
  {
    name: 'Unter Wasser',
    grid: '🐠🐙🦈🐡🐳\n🪸🌊🐢🦞🐚\n⚓🔱🧜‍♀️🏴‍☠️💎',
    questions: [
      { q: 'Welcher Fisch war zu sehen?', options: ['Hai', 'Lachs', 'Goldfisch', 'Karpfen'], correct: 0 },
      { q: 'Was lag auf dem Meeresboden?', options: ['Anker', 'Boot', 'Kiste', 'Netz'], correct: 0 },
      { q: 'Welche Figur war unter Wasser?', options: ['Taucher', 'Meerjungfrau', 'Pirat', 'Fischer'], correct: 1 },
    ],
  },
  {
    name: 'Auf dem Bauernhof',
    grid: '🐄🐔🐷🐴🐑\n🌾🚜🏠🌻🥚\n🐶🐱🦆🥛🧀',
    questions: [
      { q: 'Welches Tier war NICHT dabei?', options: ['Kuh', 'Ziege', 'Pferd', 'Huhn'], correct: 1 },
      { q: 'Welche Blume war zu sehen?', options: ['Rose', 'Sonnenblume', 'Tulpe', 'Lilie'], correct: 1 },
      { q: 'Welches Fahrzeug war auf dem Hof?', options: ['Auto', 'Traktor', 'LKW', 'Motorrad'], correct: 1 },
    ],
  },
  {
    name: 'Im Krankenhaus',
    grid: '🏥🚑💊🩺🩹\n👩‍⚕️🧑‍⚕️🛏️💉🌡️\n🦽🧪📋❤️‍🩹🔬',
    questions: [
      { q: 'Was benutzte der Arzt?', options: ['Stethoskop', 'Hammer', 'Lupe', 'Waage'], correct: 0 },
      { q: 'Welches Fahrzeug war zu sehen?', options: ['Taxi', 'Krankenwagen', 'Bus', 'Polizei'], correct: 1 },
      { q: 'Was stand im Labor?', options: ['Computer', 'Mikroskop', 'Telefon', 'Drucker'], correct: 1 },
    ],
  },
  {
    name: 'Auf der Party',
    grid: '🎉🎈🎂🎁🎊\n🎵🎤🕺💃🥂\n🍕🍿🎸🎹🪩',
    questions: [
      { q: 'Welches Instrument war dabei?', options: ['Trompete', 'Gitarre', 'Violine', 'Flöte'], correct: 1 },
      { q: 'Was gab es zu essen?', options: ['Burger', 'Pizza', 'Hotdog', 'Salat'], correct: 1 },
      { q: 'Was hing an der Decke?', options: ['Lampe', 'Luftballons', 'Banner', 'Sterne'], correct: 1 },
    ],
  },
  {
    name: 'Am Flughafen',
    grid: '✈️🛫🧳🪪🎫\n👮‍♂️🛃🛒🏧💺\n🌐🕐📡🚖🅿️',
    questions: [
      { q: 'Was brauchte man am Check-in?', options: ['Pass', 'Schlüssel', 'Brille', 'Handy'], correct: 0 },
      { q: 'Welches Fahrzeug wartete draußen?', options: ['Bus', 'Taxi', 'Zug', 'Straßenbahn'], correct: 1 },
      { q: 'Was hing an der Wand?', options: ['Bildschirm', 'Uhr', 'Karte', 'Spiegel'], correct: 1 },
    ],
  },
  {
    name: 'Im Spielzimmer',
    grid: '🧸🪀🎲🧩🎮\n🖍️📚🪁🤖🦸\n🎨🪆🏎️🛹🪃',
    questions: [
      { q: 'Welches Spielzeug war dabei?', options: ['Ball', 'Teddybär', 'Puppe', 'Kreisel'], correct: 1 },
      { q: 'Was konnte man damit malen?', options: ['Kreide', 'Pinsel', 'Buntstifte', 'Filzstifte'], correct: 2 },
      { q: 'Welches Fahrzeug war im Zimmer?', options: ['Zug', 'Rennauto', 'Flugzeug', 'Schiff'], correct: 1 },
    ],
  },
  {
    name: 'Im Zoo',
    grid: '🦁🐘🦒🐆🦩\n🐒🐧🦜🐊🦘\n🎋🪨🌴🎟️📸',
    questions: [
      { q: 'Welches Tier war am größten?', options: ['Löwe', 'Elefant', 'Giraffe', 'Krokodil'], correct: 1 },
      { q: 'Welcher Vogel war dabei?', options: ['Adler', 'Flamingo', 'Schwan', 'Storch'], correct: 1 },
      { q: 'Was brauchte man am Eingang?', options: ['Ausweis', 'Ticket', 'Gutschein', 'Karte'], correct: 1 },
    ],
  },
  {
    name: 'Beim Sport',
    grid: '⚽🏀🎾🏈🏐\n🥊🏋️🤸🚴🏊\n🏟️🥇🏆📣🎽',
    questions: [
      { q: 'Welche Sportart war NICHT zu sehen?', options: ['Fußball', 'Hockey', 'Tennis', 'Boxen'], correct: 1 },
      { q: 'Wo fand der Sport statt?', options: ['Park', 'Stadion', 'Halle', 'Strand'], correct: 1 },
      { q: 'Welche Auszeichnung war dabei?', options: ['Medaille', 'Pokal', 'Urkunde', 'Medaille und Pokal'], correct: 3 },
    ],
  },
  {
    name: 'Weihnachten',
    grid: '🎄⭐🎅🤶🦌\n🎁🕯️❄️⛄🔔\n🍪🥛🎶🛷🧦',
    questions: [
      { q: 'Welches Tier zog den Schlitten?', options: ['Pferd', 'Rentier', 'Hund', 'Esel'], correct: 1 },
      { q: 'Was lag unter dem Baum?', options: ['Geschenke', 'Nüsse', 'Äpfel', 'Spielzeug'], correct: 0 },
      { q: 'Was stand auf dem Tisch?', options: ['Punsch', 'Milch', 'Tee', 'Kakao'], correct: 1 },
    ],
  },
  {
    name: 'Im Garten',
    grid: '🌸🌷🌻🌺🌹\n🦋🐝🐞🐌🪺\n🌱💧🧤🪴🏡',
    questions: [
      { q: 'Welches Insekt war im Garten?', options: ['Fliege', 'Biene', 'Ameise', 'Käfer'], correct: 1 },
      { q: 'Welche Blume war NICHT zu sehen?', options: ['Rose', 'Tulpe', 'Orchidee', 'Sonnenblume'], correct: 2 },
      { q: 'Was brauchte man zum Gärtnern?', options: ['Schaufel', 'Handschuhe', 'Harke', 'Schere'], correct: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Difference Scenes (for "Unterschiede" mode)
// ---------------------------------------------------------------------------

const DIFF_SCENES: DiffScene[] = [
  {
    name: 'Strand-Unterschiede',
    gridA: '🌴🏖️☀️⛱️🌊\n🐚🦀🏄‍♂️🐬🎣\n🍦🥥🧴👙🩱',
    gridB: '🌴🏖️🌙⛱️🌊\n🐚🐙🏄‍♂️🐬🎣\n🍦🥥🧴👗🩱',
    diffs: [2, 6, 13],
  },
  {
    name: 'Stadt-Unterschiede',
    gridA: '🏢🏪🚗🚦🏛️\n👨‍💼🧑‍🎨🚲🚌🏍️\n🌳🐕🗑️🪧📮',
    gridB: '🏢🏪🚕🚦🏛️\n👨‍💼🧑‍🎨🛴🚌🏍️\n🌳🐈🗑️🪧📮',
    diffs: [2, 7, 11],
  },
  {
    name: 'Küche-Unterschiede',
    gridA: '🍳🥘🧑‍🍳🍰🧁\n🥕🍅🧄🌶️🥦\n🍴🥄🔪🍷🧂',
    gridB: '🍳🥘🧑‍🍳🍩🧁\n🥕🍆🧄🌶️🥦\n🍴🥄🔪🍺🧂',
    diffs: [3, 6, 13],
  },
  {
    name: 'Wald-Unterschiede',
    gridA: '🌲🌳🍄🦊🐿️\n🍂🌿🦉🐛🕷️\n🏕️🔥🪵🎒🧭',
    gridB: '🌲🌳🍄🐺🐿️\n🍂🌿🦅🐛🕷️\n🏕️🔥🪵🎒🗺️',
    diffs: [3, 7, 14],
  },
  {
    name: 'Party-Unterschiede',
    gridA: '🎉🎈🎂🎁🎊\n🎵🎤🕺💃🥂\n🍕🍿🎸🎹🪩',
    gridB: '🎉🎈🧁🎁🎊\n🎵🎤🕺💃🍷\n🍕🍿🎸🥁🪩',
    diffs: [2, 9, 13],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseGrid(grid: string): string[][] {
  return grid.split('\n').map(row => [...new Intl.Segmenter('en', { granularity: 'grapheme' })].map(() => '').length > 0
    ? Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(row)).map(s => s.segment)
    : row.split('')
  );
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

function getColor(i: number) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }

// ---------------------------------------------------------------------------
// Game Modes Config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'memory', name: 'Memory', desc: 'Merke dir die Szene und beantworte Fragen', icon: <Eye className="w-6 h-6" /> },
  { id: 'speed', name: 'Speed', desc: 'Wer findet es am schnellsten?', icon: <Zap className="w-6 h-6" /> },
  { id: 'unterschiede', name: 'Unterschiede', desc: 'Finde 3 Unterschiede in zwei Bildern', icon: <GitCompare className="w-6 h-6" /> },
  { id: 'karte', name: 'Karte', desc: 'Finde Staedte und Laender auf der Weltkarte', icon: <MapPin className="w-6 h-6" /> },
  { id: 'streetview', name: 'Street View', desc: 'Wo bist du? Rate den Standort!', icon: <Camera className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 5, max: 60, default: 10, step: 1, label: 'Zeit (Sek.)' },
  rounds: { min: 3, max: 15, default: 8, step: 1, label: 'Runden' },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FindItGame({ online }: { online?: OnlineGameProps }) {
  const navigate = useNavigate();

  // Core state
  const [phase, setPhase] = useState<Phase>('setup');
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
  const [scenePool, setScenePool] = useState<Scene[]>([]);
  const [diffPool, setDiffPool] = useState<DiffScene[]>([]);
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

  // Timing
  const questionStartRef = useRef(0);
  const studyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Online sync: host broadcasts, non-host receives ---
  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('findit-state', (data) => {
      if (data.phase !== undefined) setPhase(data.phase as Phase);
      if (data.round !== undefined) setRound(data.round as number);
      if (data.currentPlayerIdx !== undefined) setCurrentPlayerIdx(data.currentPlayerIdx as number);
      if (data.players) setPlayers(data.players as Player[]);
      if (data.selectedAnswer !== undefined) setSelectedAnswer(data.selectedAnswer as number | null);
      if (data.answerCorrect !== undefined) setAnswerCorrect(data.answerCorrect as boolean | null);
    });
    return unsub;
  }, [online]);

  const broadcastFindItState = useCallback((overrides?: Record<string, unknown>) => {
    if (!online?.isHost) return;
    online.broadcast('findit-state', {
      phase, round, currentPlayerIdx, players: JSON.parse(JSON.stringify(players)),
      selectedAnswer, answerCorrect,
      ...overrides,
    });
  }, [online, phase, round, currentPlayerIdx, players, selectedAnswer, answerCorrect]);

  useEffect(() => {
    if (online?.isHost && phase !== 'setup') {
      broadcastFindItState();
    }
  }, [phase, round, currentPlayerIdx, selectedAnswer]);

  // ------- Setup handler -------
  const handleSetupStart = useCallback((
    setupPlayers: { id: string; name: string; color: string; avatar: string }[],
    modeId: string,
    settings: { timer: number; rounds: number },
  ) => {
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
    setScenePool(shuffleArray([...SCENES]));
    setDiffPool(shuffleArray([...DIFF_SCENES]));

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
    startRound(modeId as Mode, shuffleArray([...SCENES]), shuffleArray([...DIFF_SCENES]), 0, settings.timer);
  }, []);

  // ------- Start a round -------
  const startRound = useCallback((
    m: Mode, scenes: Scene[], diffs: DiffScene[], roundIdx: number, studySec: number,
  ) => {
    if (m === 'unterschiede') {
      const diff = diffs[roundIdx % diffs.length];
      setCurrentDiff(diff);
      setCurrentScene(null);
      setFoundDiffs([]);
      setPhase('study');
      setStudyCountdown(studySec);
    } else {
      const scene = scenes[roundIdx % scenes.length];
      setCurrentScene(scene);
      setCurrentDiff(null);
      setQuestionIdx(0);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setPhase('study');
      setStudyCountdown(studySec);
    }
  }, []);

  // ------- Study countdown timer -------
  useEffect(() => {
    if (phase !== 'study') return;
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
  }, [phase, mode]);

  // ------- Question countdown timer (NOT for karte/streetview — they have their own) -------
  useEffect(() => {
    if (phase !== 'question') return;
    if (mode === 'karte' || mode === 'streetview') return; // MapRound/StreetViewRound handle their own timers
    questionTimerRef.current = setInterval(() => {
      setQuestionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [phase, questionIdx, round]);

  // ------- Handle timeout -------
  const handleTimeout = useCallback(() => {
    if (mode === 'unterschiede') {
      advanceRound();
    } else {
      setAnswerCorrect(false);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, wrong: p.wrong + 1, streak: 0 } : p));
      setPhase('answer');
      setTimeout(() => advanceQuestion(), 1500);
    }
  }, [mode, currentPlayerIdx, questionIdx, round, totalRounds]);

  // ------- Handle answer selection -------
  const handleAnswer = useCallback((optionIdx: number) => {
    if (selectedAnswer !== null || phase !== 'question') return;
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const elapsed = performance.now() - questionStartRef.current;
    const question = currentScene?.questions[questionIdx];
    if (!question) return;

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
    setTimeout(() => advanceQuestion(), 1500);
  }, [selectedAnswer, phase, currentScene, questionIdx, currentPlayerIdx]);

  // ------- Handle diff tap -------
  const handleDiffTap = useCallback((cellIdx: number) => {
    if (phase !== 'question' || !currentDiff) return;
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
        setTimeout(() => advanceRound(), 1000);
      }
    } else {
      // Wrong tap penalty
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIdx ? { ...p, score: Math.max(0, p.score - 10), wrong: p.wrong + 1 } : p
      ));
    }
  }, [phase, currentDiff, foundDiffs, currentPlayerIdx]);

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
      advanceRound();
    }
  }, [currentScene, questionIdx]);

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
      startRound(mode, scenePool, diffPool, nextRound * players.length + nextPlayer, studyTime);
    }, 1500);
  }, [currentPlayerIdx, players.length, round, totalRounds, mode, scenePool, diffPool, studyTime]);

  // ------- Restart -------
  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('wo-ist-was', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleKarteSetup = useCallback((settings: { region: string; difficulty: number; rounds: number; timer?: number }) => {
    const filtered = filterByRegion(GEO_LOCATIONS, settings.region);
    const pool = filtered.length > 0 ? filtered : [...GEO_LOCATIONS];
    const shuffled = shuffleArray(pool);
    setGeoPool(shuffled);
    setCurrentGeo(shuffled[0]);
    setTotalRounds(settings.rounds);
    setStudyTime(settings.timer || 30); // configurable timer per round
    setPhase('question');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(0);
  }, []);

  // ------- Parsed grid memo -------
  const parsedGrid = useMemo(() => {
    if (currentScene) return parseGrid(currentScene.grid);
    return null;
  }, [currentScene]);

  const parsedDiffA = useMemo(() => currentDiff ? parseGrid(currentDiff.gridA) : null, [currentDiff]);
  const parsedDiffB = useMemo(() => currentDiff ? parseGrid(currentDiff.gridB) : null, [currentDiff]);

  // ------- Sorted results -------
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  // ===== RENDER =====

  if (phase === 'setup') {
    return (
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleSetupStart}
        title="Wo ist was?"
        minPlayers={1}
        maxPlayers={10}
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
        <GameOverScreen players={sortedPlayers} onRestart={handleRestart} onBack={() => navigate('/games')} totalRounds={totalRounds} />
      </>
    );
  }

  const currentPlayer = players[currentPlayerIdx];

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 select-none">
      <div className="mx-auto max-w-lg space-y-4">

        {/* Header bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/games')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Runde {round + 1}/{totalRounds}</p>
            <p className="text-white font-bold text-sm">{currentScene?.name ?? currentDiff?.name ?? ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: currentPlayer?.color }}>
              {currentPlayer?.avatar}
            </div>
            <span className="text-white text-xs font-semibold">{currentPlayer?.score}</span>
          </div>
        </div>

        {/* Player indicator */}
        <motion.div
          key={currentPlayerIdx}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${currentPlayer?.color}30`, color: currentPlayer?.color }}>
            {currentPlayer?.name} ist dran
          </span>
        </motion.div>

        {/* Study Phase */}
        <AnimatePresence mode="wait">
          {phase === 'study' && (
            <motion.div
              key="study"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="text-cyan-300 font-bold text-lg">Merke dir alles!</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <EmojiGrid grid={parsedDiffA} label="Bild A" pulsing />
                  <EmojiGrid grid={parsedDiffB} label="Bild B" pulsing />
                </div>
              ) : parsedGrid ? (
                <EmojiGrid grid={parsedGrid} pulsing />
              ) : null}
            </motion.div>
          )}

          {/* Karte Mode is rendered OUTSIDE AnimatePresence below */}

          {/* Question Phase */}
          {(phase === 'question' || phase === 'answer') && mode !== 'unterschiede' && mode !== 'karte' && currentScene && (
            <motion.div
              key={`q-${questionIdx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Show grid in speed mode */}
              {mode === 'speed' && parsedGrid && (
                <EmojiGrid grid={parsedGrid} small />
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
                <p className="text-xs text-cyan-400 mb-1 font-semibold">Frage {questionIdx + 1}/{currentScene.questions.length}</p>
                <p className="text-white font-bold text-lg leading-tight">{currentScene.questions[questionIdx].q}</p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {currentScene.questions[questionIdx].options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectOpt = idx === currentScene.questions[questionIdx].correct;
                  const showResult = phase === 'answer';

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={phase === 'answer'}
                      className={cn(
                        'p-4 rounded-xl border-2 font-semibold text-sm transition-all',
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
                      <span className="flex items-center justify-center gap-2">
                        {showResult && isCorrectOpt && <Check className="w-4 h-4 text-green-400" />}
                        {showResult && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-red-400" />}
                        {opt}
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
                    {answerCorrect ? 'Richtig! 🎯' : 'Leider falsch!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Unterschiede Question Phase */}
          {(phase === 'question' || phase === 'answer') && mode === 'unterschiede' && currentDiff && parsedDiffA && parsedDiffB && (
            <motion.div
              key="diff-q"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <p className="text-cyan-300 font-bold">Finde {currentDiff.diffs.length} Unterschiede!</p>
                <p className="text-gray-400 text-xs">Tippe auf die Unterschiede im rechten Bild</p>
              </div>

              {/* Timer */}
              <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    questionCountdown > 5 ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                  )}
                  style={{ width: `${(questionCountdown / 15) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <EmojiGrid grid={parsedDiffA} label="Original" small />
                <DiffGrid grid={parsedDiffB} label="Verändert" diffs={currentDiff.diffs} found={foundDiffs} onTap={handleDiffTap} />
              </div>

              <div className="flex justify-center gap-2">
                {currentDiff.diffs.map((_, i) => (
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
              <p className="text-white font-bold text-xl">Nächster Spieler!</p>
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
              onRoundComplete={(results: MapRoundResult[]) => {
                const sorted = [...results].sort((a, b) => a.distanceKm - b.distanceKm);
                setPlayers(prev => prev.map(p => {
                  const res = results.find(r => r.playerId === p.id);
                  if (!res) return p;
                  const pts = Math.max(0, Math.round(1000 * Math.exp(-res.distanceKm / 2000)));
                  const isWinner = sorted[0]?.playerId === p.id;
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
              onExit={() => navigate('/games')}
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
              timerSeconds={30}
              onRoundComplete={(results: StreetViewResult[]) => {
                const sorted = [...results].sort((a, b) => a.distanceKm - b.distanceKm);
                setPlayers(prev => prev.map(p => {
                  const res = results.find(r => r.playerId === p.id);
                  if (!res) return p;
                  const pts = Math.max(0, Math.round(1000 * Math.exp(-res.distanceKm / 2000)));
                  const isWinner = sorted[0]?.playerId === p.id;
                  return { ...p, score: p.score + pts + (isWinner ? 100 : 0), correct: p.correct + (isWinner ? 1 : 0) };
                }));
                const next = svRound + 1;
                if (next >= totalRounds) { setPhase('gameOver'); }
                else { setSvRound(next); }
              }}
              onExit={() => navigate('/games')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emoji Grid Component
// ---------------------------------------------------------------------------

function EmojiGrid({ grid, label, pulsing, small }: { grid: string[][]; label?: string; pulsing?: boolean; small?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl border-2 p-3 backdrop-blur bg-gray-800/40 transition-all',
      pulsing ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-pulse' : 'border-gray-700/50'
    )}>
      {label && <p className="text-[10px] text-gray-400 text-center mb-1 font-semibold uppercase tracking-wider">{label}</p>}
      <div className="flex flex-col items-center gap-1">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((cell, ci) => (
              <span key={ci} className={cn('text-center', small ? 'text-xl w-7 h-7' : 'text-3xl w-10 h-10')} role="img">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff Grid (tappable)
// ---------------------------------------------------------------------------

function DiffGrid({ grid, label, diffs, found, onTap }: {
  grid: string[][];
  label?: string;
  diffs: number[];
  found: number[];
  onTap: (idx: number) => void;
}) {
  let cellIdx = 0;
  return (
    <div className="rounded-2xl border-2 border-cyan-500/30 p-3 backdrop-blur bg-gray-800/40">
      {label && <p className="text-[10px] text-gray-400 text-center mb-1 font-semibold uppercase tracking-wider">{label}</p>}
      <div className="flex flex-col items-center gap-1">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((cell, ci) => {
              const idx = cellIdx++;
              const isFound = found.includes(idx);
              const isDiff = diffs.includes(idx);
              return (
                <motion.button
                  key={ci}
                  onClick={() => onTap(idx)}
                  className={cn(
                    'text-xl w-7 h-7 rounded-lg transition-all',
                    isFound ? 'bg-green-500/30 ring-2 ring-green-400' : 'hover:bg-cyan-500/10 active:bg-cyan-500/20'
                  )}
                  whileTap={{ scale: 0.85 }}
                >
                  {cell}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
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
  const winner = players[0];
  const totalCorrect = players.reduce((s, p) => s + p.correct, 0);
  const bestStreak = Math.max(...players.map(p => p.bestStreak), 0);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 relative">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {confettiColors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: color, left: `${(i / 20) * 100 + Math.random() * 5}%` }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
              opacity: [1, 1, 0],
              rotate: 360 * (i % 2 === 0 ? 1 : -1),
              x: [0, (i % 2 === 0 ? 1 : -1) * (30 + Math.random() * 40)],
            }}
            transition={{ duration: 2.5 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'easeIn' }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-md space-y-6 relative z-10">
        {/* Trophy */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-cyan-400" />
          </div>
        </motion.div>

        {/* Winner */}
        <motion.div className="text-center space-y-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <p className="text-sm text-gray-400 uppercase tracking-wider">Wo ist was?</p>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: winner?.color, boxShadow: `0 0 20px ${winner?.color}60` }}
            >
              {winner?.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{winner?.name}</h2>
              <p className="text-cyan-400 font-semibold">{winner?.score} Punkte</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.section className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Rangliste</h3>
          <div className="space-y-2">
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  i === 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-gray-800/40 border-gray-700/50'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="w-8 flex items-center justify-center">
                  {i < 3 ? rankIcons[i] : <span className="text-sm font-bold text-gray-500">{i + 1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: player.color }}>
                  {player.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium text-sm truncate block">{player.name}</span>
                  <span className="text-[10px] text-gray-400">{player.correct} richtig &middot; {player.wrong} falsch</span>
                </div>
                {player.bestStreak >= 3 && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-semibold">
                    {player.bestStreak}x
                  </span>
                )}
                <span className="text-sm font-bold text-gray-300 min-w-[40px] text-right">{player.score}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section className="grid grid-cols-3 gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
          {[
            { label: 'Runden', value: totalRounds },
            { label: 'Richtig gesamt', value: totalCorrect },
            { label: 'Bester Streak', value: bestStreak },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.section>

        {/* Actions */}
        <motion.div className="flex gap-3 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <motion.button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-semibold flex items-center justify-center gap-2 hover:border-gray-500 transition-colors text-sm"
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Anderes Spiel
          </motion.button>
          <motion.button
            onClick={onRestart}
            className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw className="w-4 h-4" />
            Nochmal spielen
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
