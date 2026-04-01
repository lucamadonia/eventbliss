import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameTimer } from '../engine/TimerSystem';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Play, Trophy, RotateCcw, Timer, ArrowRight, ArrowLeft,
  Smartphone, Shuffle, Zap, Crown, Star, ChevronRight, X, Plus, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuizQuestion {
  question: string;
  answers: [string, string, string, string];
  correct: number; // 0-3
  category: Category;
}

type Category = 'Geografie' | 'Geschichte' | 'Wissenschaft' | 'Sport' | 'Unterhaltung' | 'Allgemeinwissen';

interface TeamState {
  name: string;
  color: string;       // hex
  players: string[];
  score: number;
  correctCount: number;
}

type Phase =
  | 'setup'
  | 'handoff'
  | 'question'
  | 'betting'
  | 'reveal'
  | 'gameOver';

/* ------------------------------------------------------------------ */
/*  Questions (50+)                                                    */
/* ------------------------------------------------------------------ */

const SPLIT_QUESTIONS: QuizQuestion[] = [
  // Geografie (10)
  { question: 'Welches ist das größte Land der Welt?', answers: ['Russland', 'Kanada', 'China', 'USA'], correct: 0, category: 'Geografie' },
  { question: 'In welchem Land liegt Machu Picchu?', answers: ['Peru', 'Bolivien', 'Kolumbien', 'Ecuador'], correct: 0, category: 'Geografie' },
  { question: 'Welcher Fluss fließt durch Kairo?', answers: ['Nil', 'Tigris', 'Euphrat', 'Kongo'], correct: 0, category: 'Geografie' },
  { question: 'Welches ist die kleinste Nation der Welt?', answers: ['Monaco', 'Vatikanstadt', 'Malta', 'San Marino'], correct: 1, category: 'Geografie' },
  { question: 'In welchem Ozean liegt Hawaii?', answers: ['Atlantik', 'Indischer Ozean', 'Pazifik', 'Arktischer Ozean'], correct: 2, category: 'Geografie' },
  { question: 'Welche Stadt wird „Ewige Stadt" genannt?', answers: ['Athen', 'Rom', 'Kairo', 'Jerusalem'], correct: 1, category: 'Geografie' },
  { question: 'Welches Land hat die meisten Einwohner?', answers: ['Indien', 'USA', 'China', 'Indonesien'], correct: 0, category: 'Geografie' },
  { question: 'Wo steht der Eiffelturm?', answers: ['Paris', 'London', 'Berlin', 'Madrid'], correct: 0, category: 'Geografie' },
  { question: 'Welcher Kontinent hat die meisten Länder?', answers: ['Asien', 'Europa', 'Afrika', 'Südamerika'], correct: 2, category: 'Geografie' },
  { question: 'In welchem Land liegt der Mount Everest?', answers: ['Indien', 'China', 'Nepal', 'Bhutan'], correct: 2, category: 'Geografie' },

  // Geschichte (10)
  { question: 'Wann fiel die Berliner Mauer?', answers: ['1989', '1991', '1987', '1990'], correct: 0, category: 'Geschichte' },
  { question: 'Wer war der erste Mensch auf dem Mond?', answers: ['Buzz Aldrin', 'Juri Gagarin', 'Neil Armstrong', 'Michael Collins'], correct: 2, category: 'Geschichte' },
  { question: 'In welchem Jahr begann der Erste Weltkrieg?', answers: ['1914', '1912', '1916', '1918'], correct: 0, category: 'Geschichte' },
  { question: 'Wer malte die Mona Lisa?', answers: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], correct: 1, category: 'Geschichte' },
  { question: 'Welches Imperium baute das Kolosseum?', answers: ['Griechisches', 'Osmanisches', 'Römisches', 'Persisches'], correct: 2, category: 'Geschichte' },
  { question: 'Wann endete der Zweite Weltkrieg?', answers: ['1943', '1944', '1945', '1946'], correct: 2, category: 'Geschichte' },
  { question: 'Wer entdeckte Amerika 1492?', answers: ['Kolumbus', 'Magellan', 'Vasco da Gama', 'Amerigo Vespucci'], correct: 0, category: 'Geschichte' },
  { question: 'Welche Revolution begann 1789?', answers: ['Industrielle Revolution', 'Amerikanische Revolution', 'Französische Revolution', 'Russische Revolution'], correct: 2, category: 'Geschichte' },
  { question: 'Wer erfand den Buchdruck?', answers: ['Gutenberg', 'Luther', 'Galileo', 'Newton'], correct: 0, category: 'Geschichte' },
  { question: 'Welches Schiff sank 1912?', answers: ['Lusitania', 'Titanic', 'Bismarck', 'Britannic'], correct: 1, category: 'Geschichte' },

  // Wissenschaft (10)
  { question: 'Was ist das chemische Symbol für Gold?', answers: ['Au', 'Ag', 'Go', 'Gd'], correct: 0, category: 'Wissenschaft' },
  { question: 'Wie viele Planeten hat unser Sonnensystem?', answers: ['7', '9', '8', '10'], correct: 2, category: 'Wissenschaft' },
  { question: 'Was ist das härteste natürliche Material?', answers: ['Stahl', 'Diamant', 'Quarz', 'Titan'], correct: 1, category: 'Wissenschaft' },
  { question: 'Welches Gas atmen Pflanzen ein?', answers: ['Sauerstoff', 'Stickstoff', 'CO2', 'Wasserstoff'], correct: 2, category: 'Wissenschaft' },
  { question: 'Wie viele Knochen hat ein Mensch?', answers: ['206', '208', '196', '212'], correct: 0, category: 'Wissenschaft' },
  { question: 'Wer formulierte die Relativitätstheorie?', answers: ['Newton', 'Einstein', 'Hawking', 'Bohr'], correct: 1, category: 'Wissenschaft' },
  { question: 'Welches Organ produziert Insulin?', answers: ['Leber', 'Niere', 'Bauchspeicheldrüse', 'Milz'], correct: 2, category: 'Wissenschaft' },
  { question: 'Was ist die Lichtgeschwindigkeit (km/s)?', answers: ['300.000', '150.000', '500.000', '1.000.000'], correct: 0, category: 'Wissenschaft' },
  { question: 'Wie heißt das größte Organ des Menschen?', answers: ['Leber', 'Gehirn', 'Haut', 'Lunge'], correct: 2, category: 'Wissenschaft' },
  { question: 'Welches Element hat die Ordnungszahl 1?', answers: ['Helium', 'Wasserstoff', 'Lithium', 'Sauerstoff'], correct: 1, category: 'Wissenschaft' },

  // Sport (10)
  { question: 'Wie oft gewann Brasilien die Fußball-WM?', answers: ['5', '4', '3', '6'], correct: 0, category: 'Sport' },
  { question: 'In welcher Stadt fanden die ersten Olympischen Spiele statt?', answers: ['Rom', 'Athen', 'Sparta', 'Olympia'], correct: 1, category: 'Sport' },
  { question: 'Wie viele Spieler hat eine Fußballmannschaft?', answers: ['11', '10', '9', '12'], correct: 0, category: 'Sport' },
  { question: 'Welcher Sport wird in Wimbledon gespielt?', answers: ['Golf', 'Cricket', 'Tennis', 'Polo'], correct: 2, category: 'Sport' },
  { question: 'Wie lang ist ein Marathon in Kilometern?', answers: ['42,195', '40', '45', '38,5'], correct: 0, category: 'Sport' },
  { question: 'In welchem Land wurde Basketball erfunden?', answers: ['USA', 'Kanada', 'England', 'Frankreich'], correct: 0, category: 'Sport' },
  { question: 'Welche Farbe hat die Mittellinie beim Tennis?', answers: ['Gelb', 'Rot', 'Weiß', 'Blau'], correct: 2, category: 'Sport' },
  { question: 'Wie viele Ringe hat das olympische Symbol?', answers: ['4', '6', '5', '3'], correct: 2, category: 'Sport' },
  { question: 'Welche Sportart nutzt einen Puck?', answers: ['Curling', 'Eishockey', 'Lacrosse', 'Hockey'], correct: 1, category: 'Sport' },
  { question: 'Wer hat die meisten F1-Weltmeistertitel?', answers: ['Schumacher', 'Hamilton', 'Senna', 'Verstappen'], correct: 1, category: 'Sport' },

  // Unterhaltung (10)
  { question: 'Wer spielte Jack in „Titanic"?', answers: ['Brad Pitt', 'Leonardo DiCaprio', 'Tom Cruise', 'Johnny Depp'], correct: 1, category: 'Unterhaltung' },
  { question: 'Wie heißt die Eiskönigin auf Englisch?', answers: ['Snow Queen', 'Ice Princess', 'Frozen', 'Cold Heart'], correct: 2, category: 'Unterhaltung' },
  { question: 'Welche Band sang „Bohemian Rhapsody"?', answers: ['Beatles', 'Queen', 'Led Zeppelin', 'Rolling Stones'], correct: 1, category: 'Unterhaltung' },
  { question: 'Wie heißt der Zauberer in „Herr der Ringe"?', answers: ['Dumbledore', 'Merlin', 'Gandalf', 'Saruman'], correct: 2, category: 'Unterhaltung' },
  { question: 'Welche Serie spielt in Westeros?', answers: ['Vikings', 'Game of Thrones', 'The Witcher', 'Lord of the Rings'], correct: 1, category: 'Unterhaltung' },
  { question: 'Wer ist der Sänger von „Shape of You"?', answers: ['Ed Sheeran', 'Justin Bieber', 'Bruno Mars', 'The Weeknd'], correct: 0, category: 'Unterhaltung' },
  { question: 'Wie heißt das gelbe Wesen bei Pokémon?', answers: ['Glumanda', 'Pikachu', 'Schiggy', 'Evoli'], correct: 1, category: 'Unterhaltung' },
  { question: 'In welchem Film sagt man „Möge die Macht mit dir sein"?', answers: ['Star Trek', 'Star Wars', 'Dune', 'Matrix'], correct: 1, category: 'Unterhaltung' },
  { question: 'Wie viele Harry-Potter-Bücher gibt es?', answers: ['6', '8', '7', '5'], correct: 2, category: 'Unterhaltung' },
  { question: 'Wer singt „Rolling in the Deep"?', answers: ['Beyoncé', 'Adele', 'Rihanna', 'Lady Gaga'], correct: 1, category: 'Unterhaltung' },

  // Allgemeinwissen (10)
  { question: 'Wie viele Tage hat ein Schaltjahr?', answers: ['365', '366', '364', '367'], correct: 1, category: 'Allgemeinwissen' },
  { question: 'Welche Farbe entsteht aus Rot und Blau?', answers: ['Grün', 'Lila', 'Orange', 'Braun'], correct: 1, category: 'Allgemeinwissen' },
  { question: 'Wie heißt der längste Fluss Europas?', answers: ['Donau', 'Rhein', 'Wolga', 'Elbe'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Welches Tier ist das schnellste an Land?', answers: ['Löwe', 'Gepard', 'Pferd', 'Antilope'], correct: 1, category: 'Allgemeinwissen' },
  { question: 'Wie viele Zähne hat ein Erwachsener?', answers: ['28', '30', '32', '34'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Was ist die Hauptstadt der Schweiz?', answers: ['Zürich', 'Genf', 'Bern', 'Basel'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Welches Vitamin liefert Sonnenlicht?', answers: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin B12'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Wie viele Kontinente gibt es?', answers: ['5', '6', '7', '8'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Welche Blutgruppe ist der Universalspender?', answers: ['A', 'B', '0 negativ', 'AB'], correct: 2, category: 'Allgemeinwissen' },
  { question: 'Wie heißt die Währung Japans?', answers: ['Yuan', 'Won', 'Yen', 'Baht'], correct: 2, category: 'Allgemeinwissen' },
];

const ALL_CATEGORIES: Category[] = ['Geografie', 'Geschichte', 'Wissenschaft', 'Sport', 'Unterhaltung', 'Allgemeinwissen'];

const TEAM_A_COLOR = '#df8eff';
const TEAM_B_COLOR = '#8ff5ff';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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

interface SplitQuizGameProps {
  players?: string[];
  onClose?: () => void;
  online?: OnlineGameProps;
}

const DEFAULT_PLAYERS = ['Spieler 1', 'Spieler 2', 'Spieler 3', 'Spieler 4'];

export default function SplitQuizGame({ players: initialPlayers, onClose, online }: SplitQuizGameProps) {
  const startPlayers = initialPlayers && initialPlayers.length >= 4 ? initialPlayers : DEFAULT_PLAYERS;
  /* ---- Setup state ---- */
  const [playerNames, setPlayerNames] = useState<string[]>(startPlayers);
  const [totalRounds, setTotalRounds] = useState(10);
  const [bettingEnabled, setBettingEnabled] = useState(true);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES));

  /* ---- Team state ---- */
  const [teamA, setTeamA] = useState<TeamState>(() => buildTeam('Team A', TEAM_A_COLOR, startPlayers, 0));
  const [teamB, setTeamB] = useState<TeamState>(() => buildTeam('Team B', TEAM_B_COLOR, startPlayers, 1));

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0); // 0 = A answers first, then B
  const [teamAnswered, setTeamAnswered] = useState<[boolean, boolean]>([false, false]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentBet, setCurrentBet] = useState(1);
  const [showBetting, setShowBetting] = useState(false);

  /* ---- Question deck ---- */
  const deck = useRef<QuizQuestion[]>([]);
  const deckPos = useRef(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  /* ---- Round tracking for MVP ---- */
  const playerCorrectMap = useRef<Record<string, number>>({});

  // --- Online sync: host broadcasts state, non-host receives ---
  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('splitquiz-state', (data) => {
      if (data.phase !== undefined) setPhase(data.phase as Phase);
      if (data.teamA) setTeamA(data.teamA as TeamState);
      if (data.teamB) setTeamB(data.teamB as TeamState);
      if (data.currentRound !== undefined) setCurrentRound(data.currentRound as number);
      if (data.activeTeamIdx !== undefined) setActiveTeamIdx(data.activeTeamIdx as number);
      if (data.currentQuestion !== undefined) setCurrentQuestion(data.currentQuestion as QuizQuestion | null);
      if (data.selectedAnswer !== undefined) setSelectedAnswer(data.selectedAnswer as number | null);
      if (data.teamAnswered) setTeamAnswered(data.teamAnswered as [boolean, boolean]);
    });
    return unsub;
  }, [online]);

  const broadcastQuizState = useCallback((overrides?: Record<string, unknown>) => {
    if (!online?.isHost) return;
    online.broadcast('splitquiz-state', {
      phase, teamA, teamB, currentRound, activeTeamIdx,
      currentQuestion, selectedAnswer, teamAnswered,
      ...overrides,
    });
  }, [online, phase, teamA, teamB, currentRound, activeTeamIdx, currentQuestion, selectedAnswer, teamAnswered]);

  // Broadcast on key state changes
  useEffect(() => {
    if (online?.isHost && phase !== 'setup') {
      broadcastQuizState();
    }
  }, [phase, currentRound, activeTeamIdx, selectedAnswer]);

  /* ---- Timer ---- */
  const handleTimerExpire = useCallback(() => {
    // auto-skip if no answer given
    if (phase === 'question' || phase === 'betting') {
      handleAnswer(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const timer = useGameTimer(20, handleTimerExpire);

  /* ---- Derived ---- */
  const activeTeam = activeTeamIdx === 0 ? teamA : teamB;
  const inactiveTeam = activeTeamIdx === 0 ? teamB : teamA;
  const maxScore = Math.max(teamA.score, teamB.score, 1);

  /* ---- Build team helper ---- */
  function buildTeam(name: string, color: string, pls: string[], half: number): TeamState {
    const shuffled = shuffle(pls);
    const mid = Math.ceil(shuffled.length / 2);
    return {
      name,
      color,
      players: half === 0 ? shuffled.slice(0, mid) : shuffled.slice(mid),
      score: 0,
      correctCount: 0,
    };
  }

  /* ---- Shuffle deck ---- */
  function buildDeck() {
    const filtered = SPLIT_QUESTIONS.filter(q => selectedCategories.has(q.category));
    deck.current = shuffle(filtered.length > 0 ? filtered : SPLIT_QUESTIONS);
    deckPos.current = 0;
  }

  function drawQuestion(): QuizQuestion {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(deck.current);
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Category toggle ---- */
  function toggleCategory(cat: Category) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  /* ---- Player management ---- */
  function addPlayer() {
    if (playerNames.length >= 30) return;
    const name = `Spieler ${playerNames.length + 1}`;
    setPlayerNames(prev => [...prev, name]);
    // Add to smaller team
    if (teamA.players.length <= teamB.players.length) {
      setTeamA(prev => ({ ...prev, players: [...prev.players, name] }));
    } else {
      setTeamB(prev => ({ ...prev, players: [...prev.players, name] }));
    }
  }

  function removePlayer(idx: number) {
    if (playerNames.length <= 4) return;
    const name = playerNames[idx];
    setPlayerNames(prev => prev.filter((_, i) => i !== idx));
    setTeamA(prev => ({ ...prev, players: prev.players.filter(p => p !== name) }));
    setTeamB(prev => ({ ...prev, players: prev.players.filter(p => p !== name) }));
  }

  function updatePlayerName(idx: number, name: string) {
    const oldName = playerNames[idx];
    setPlayerNames(prev => prev.map((p, i) => i === idx ? name : p));
    setTeamA(prev => ({ ...prev, players: prev.players.map(p => p === oldName ? name : p) }));
    setTeamB(prev => ({ ...prev, players: prev.players.map(p => p === oldName ? name : p) }));
  }

  /* ---- Drag player between teams ---- */
  function movePlayer(playerName: string, fromTeam: 'A' | 'B') {
    if (fromTeam === 'A') {
      if (teamA.players.length <= 1) return;
      setTeamA(prev => ({ ...prev, players: prev.players.filter(p => p !== playerName) }));
      setTeamB(prev => ({ ...prev, players: [...prev.players, playerName] }));
    } else {
      if (teamB.players.length <= 1) return;
      setTeamB(prev => ({ ...prev, players: prev.players.filter(p => p !== playerName) }));
      setTeamA(prev => ({ ...prev, players: [...prev.players, playerName] }));
    }
  }

  /* ---- Shuffle teams ---- */
  function reshuffleTeams() {
    const all = [...teamA.players, ...teamB.players];
    const shuffled = shuffle(all);
    const mid = Math.ceil(shuffled.length / 2);
    setTeamA(prev => ({ ...prev, players: shuffled.slice(0, mid) }));
    setTeamB(prev => ({ ...prev, players: shuffled.slice(mid) }));
  }

  /* ---- Start game ---- */
  function startGame() {
    buildDeck();
    playerCorrectMap.current = {};
    [...teamA.players, ...teamB.players].forEach(p => { playerCorrectMap.current[p] = 0; });
    setTeamA(prev => ({ ...prev, score: 0, correctCount: 0 }));
    setTeamB(prev => ({ ...prev, score: 0, correctCount: 0 }));
    setCurrentRound(1);
    setActiveTeamIdx(0);
    setTeamAnswered([false, false]);
    setPhase('handoff');
    const q = drawQuestion();
    setCurrentQuestion(q);
  }

  /* ---- Begin question for active team ---- */
  function beginQuestion() {
    setSelectedAnswer(null);
    setCurrentBet(1);
    setShowBetting(false);
    timer.reset(20);
    timer.start();
    if (bettingEnabled) {
      setShowBetting(true);
      setPhase('betting');
    } else {
      setPhase('question');
    }
  }

  /* ---- Confirm bet ---- */
  function confirmBet() {
    setShowBetting(false);
    setPhase('question');
  }

  /* ---- Handle answer ---- */
  function handleAnswer(answerIdx: number) {
    timer.pause();
    setSelectedAnswer(answerIdx);

    if (currentQuestion && answerIdx >= 0 && answerIdx === currentQuestion.correct) {
      const points = 100 * currentBet;
      const setActive = activeTeamIdx === 0 ? setTeamA : setTeamB;
      setActive(prev => ({
        ...prev,
        score: prev.score + points,
        correctCount: prev.correctCount + 1,
      }));
      // Track MVP
      activeTeam.players.forEach(p => {
        playerCorrectMap.current[p] = (playerCorrectMap.current[p] || 0) + 1;
      });
    }

    setPhase('reveal');
  }

  /* ---- Next after reveal ---- */
  function nextAfterReveal() {
    const newAnswered: [boolean, boolean] = [...teamAnswered];
    newAnswered[activeTeamIdx] = true;
    setTeamAnswered(newAnswered);

    // If other team hasn't answered this question yet
    if (!newAnswered[activeTeamIdx === 0 ? 1 : 0]) {
      setActiveTeamIdx(activeTeamIdx === 0 ? 1 : 0);
      setSelectedAnswer(null);
      setCurrentBet(1);
      setPhase('handoff');
      return;
    }

    // Both teams answered — move to next round
    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }

    setCurrentRound(r => r + 1);
    setTeamAnswered([false, false]);
    setActiveTeamIdx(0);
    setSelectedAnswer(null);
    setCurrentBet(1);
    const q = drawQuestion();
    setCurrentQuestion(q);
    setPhase('handoff');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winnerScore = Math.max(teamA.score, teamB.score);
      recordEnd('split-quiz', winnerScore, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Restart ---- */
  function restart() {
    setPhase('setup');
    timer.reset(20);
  }

  /* ---- Get visible answers for a team ---- */
  function getTeamAnswers(teamIdx: number): [number, number] {
    return teamIdx === 0 ? [0, 1] : [2, 3];
  }

  /* ---- MVP calculation ---- */
  const mvp = useMemo(() => {
    let best = '';
    let bestCount = 0;
    Object.entries(playerCorrectMap.current).forEach(([name, count]) => {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    });
    return best;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---- Tug-of-war percentage ---- */
  const tugPercent = useMemo(() => {
    const total = teamA.score + teamB.score;
    if (total === 0) return 50;
    return (teamA.score / total) * 100;
  }, [teamA.score, teamB.score]);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  /* ---- SETUP ---- */
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] px-4 py-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            {onClose && (
              <button onClick={onClose} className="absolute top-4 left-4 text-[#a8abb3] hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-white">Split Quiz</h1>
            <p className="text-sm text-[#a8abb3]">Jedes Team sieht nur die Hälfte der Antworten!</p>
          </div>

          {/* Player names */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f1f3fc]">Spieler ({playerNames.length})</label>
            <div className="grid grid-cols-2 gap-2">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={name}
                    onChange={e => updatePlayerName(i, e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[#44484f] text-white text-xs focus:border-[#df8eff] focus:outline-none"
                    maxLength={20}
                  />
                  {playerNames.length > 4 && (
                    <button onClick={() => removePlayer(i)} className="p-1 text-[#a8abb3]/60 hover:text-red-400">
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {playerNames.length < 30 && (
              <button
                onClick={addPlayer}
                className="w-full py-2 rounded-xl border border-dashed border-[#44484f] text-[#a8abb3] text-xs font-medium flex items-center justify-center gap-1.5 hover:border-[#44484f] hover:text-[#f1f3fc] transition-colors"
              >
                <Plus className="w-3 h-3" /> Spieler hinzufügen
              </button>
            )}
          </div>

          {/* Teams visualization */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: TEAM_A_COLOR, background: `${TEAM_A_COLOR}10` }}>
              <h3 className="font-bold text-sm" style={{ color: TEAM_A_COLOR }}>Team A</h3>
              <div className="space-y-1">
                {teamA.players.map(p => (
                  <motion.button
                    key={p}
                    layout
                    onClick={() => movePlayer(p, 'A')}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: TEAM_A_COLOR }}>
                      {p.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{p}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: TEAM_B_COLOR, background: `${TEAM_B_COLOR}10` }}>
              <h3 className="font-bold text-sm" style={{ color: TEAM_B_COLOR }}>Team B</h3>
              <div className="space-y-1">
                {teamB.players.map(p => (
                  <motion.button
                    key={p}
                    layout
                    onClick={() => movePlayer(p, 'B')}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: TEAM_B_COLOR }}>
                      {p.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{p}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40 rotate-180" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Shuffle button */}
          <button
            onClick={reshuffleTeams}
            className="w-full py-2 rounded-xl border border-[#44484f] text-[#f1f3fc] text-sm font-medium flex items-center justify-center gap-2 hover:border-[#44484f] transition-colors"
          >
            <Shuffle className="w-4 h-4" /> Teams neu mischen
          </button>

          {/* Rounds */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f1f3fc]">Runden: {totalRounds}</label>
            <input
              type="range"
              min={5}
              max={15}
              value={totalRounds}
              onChange={e => setTotalRounds(Number(e.target.value))}
              className="w-full accent-[#df8eff]"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f1f3fc]">Kategorien</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    selectedCategories.has(cat)
                      ? 'bg-[#df8eff]/20 border-[#df8eff] text-[#df8eff]'
                      : 'bg-[#1b2028]/40 border-[#44484f] text-[#a8abb3]/60'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Betting toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#f1f3fc]">Wetten erlauben</span>
            <button
              onClick={() => setBettingEnabled(!bettingEnabled)}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                bettingEnabled ? 'bg-[#df8eff]' : 'bg-[#20262f]'
              )}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                animate={{ left: bettingEnabled ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Start button */}
          <motion.button
            onClick={startGame}
            disabled={teamA.players.length < 1 || teamB.players.length < 1}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,142,255,0.3)] disabled:opacity-40"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5" /> Spiel starten
          </motion.button>
        </div>
      </div>
    );
  }

  /* ---- HANDOFF (pass the phone) ---- */
  if (phase === 'handoff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] flex items-center justify-center px-4">
        <motion.div
          className="text-center space-y-6 max-w-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Smartphone className="w-16 h-16 mx-auto" style={{ color: activeTeam.color }} />
          </motion.div>
          <div>
            <p className="text-[#a8abb3] text-sm">Runde {currentRound} / {totalRounds}</p>
            <h2 className="text-2xl font-bold text-white mt-1">
              Gebt das Handy an
            </h2>
            <h2 className="text-3xl font-black mt-1" style={{ color: activeTeam.color }}>
              {activeTeam.name}
            </h2>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {activeTeam.players.map(p => (
                <span key={p} className="px-2 py-1 rounded-full text-xs font-medium text-white/80" style={{ backgroundColor: `${activeTeam.color}30` }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[#a8abb3]/60 text-xs">Das andere Team darf NICHT mitsehen!</p>
          <motion.button
            onClick={beginQuestion}
            className="px-8 py-3.5 rounded-2xl text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: activeTeam.color, boxShadow: `0 0 30px ${activeTeam.color}50` }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Bereit! <ArrowRight className="w-5 h-5 inline ml-1" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ---- BETTING ---- */
  if (phase === 'betting' && showBetting && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-sm space-y-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Timer bar */}
          <div className="h-1.5 rounded-full bg-[#1b2028] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: activeTeam.color }}
              animate={{ width: `${timer.percentLeft}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: activeTeam.color }}>
              {activeTeam.name} - Wette platzieren
            </p>
            <p className="text-[#a8abb3] text-sm">Wie sicher seid ihr euch?</p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3].map(bet => (
              <motion.button
                key={bet}
                onClick={() => setCurrentBet(bet)}
                className={cn(
                  'w-20 h-20 rounded-2xl font-bold text-xl border-2 transition-all',
                  currentBet === bet
                    ? 'text-white scale-105'
                    : 'text-[#a8abb3] bg-[#1b2028]/50 border-[#44484f]'
                )}
                style={currentBet === bet ? {
                  borderColor: activeTeam.color,
                  backgroundColor: `${activeTeam.color}25`,
                  boxShadow: `0 0 20px ${activeTeam.color}30`,
                } : undefined}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4 mx-auto mb-1" />
                {bet}x
              </motion.button>
            ))}
          </div>

          <p className="text-sm text-[#a8abb3]/60">
            {currentBet === 1 ? '100 Punkte' : currentBet === 2 ? '200 Punkte' : '300 Punkte'} bei richtiger Antwort
          </p>

          <motion.button
            onClick={confirmBet}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
            style={{ backgroundColor: activeTeam.color }}
            whileTap={{ scale: 0.97 }}
          >
            Wette bestätigen
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ---- QUESTION ---- */
  if (phase === 'question' && currentQuestion) {
    const visibleAnswerIndices = getTeamAnswers(activeTeamIdx);
    const answerLabels = activeTeamIdx === 0 ? ['A', 'B'] : ['C', 'D'];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] px-4 py-6 flex flex-col">
        {/* HUD */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${activeTeam.color}25`, color: activeTeam.color }}>
              {activeTeam.name}
            </span>
            <span className="text-xs text-[#a8abb3]/60">Runde {currentRound}/{totalRounds}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#a8abb3]">
            <Timer className="w-4 h-4" />
            <span className={cn('text-sm font-bold tabular-nums', timer.timeLeft <= 5 && 'text-red-400')}>
              {timer.timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1.5 rounded-full bg-[#1b2028] overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: timer.timeLeft <= 5 ? '#ef4444' : activeTeam.color }}
            animate={{ width: `${timer.percentLeft}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Scoreboard tug-of-war bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span style={{ color: TEAM_A_COLOR }}>{teamA.score}</span>
            <span style={{ color: TEAM_B_COLOR }}>{teamB.score}</span>
          </div>
          <div className="h-2 rounded-full bg-[#1b2028] overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${TEAM_A_COLOR}, ${TEAM_B_COLOR})` }}
              animate={{ width: `${tugPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        {/* Question card — glass-morphism */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          key={`q-${currentRound}-${activeTeamIdx}`}
        >
          <div className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
            <p className="text-xs text-[#a8abb3]/60 mb-2 uppercase tracking-wider">{currentQuestion.category}</p>
            <h2 className="text-xl font-bold text-white leading-tight">{currentQuestion.question}</h2>
            {currentBet > 1 && (
              <p className="mt-2 text-xs font-semibold" style={{ color: activeTeam.color }}>
                <Zap className="w-3 h-3 inline" /> {currentBet}x Wette aktiv
              </p>
            )}
          </div>

          {/* Answer buttons */}
          <div className="w-full max-w-md space-y-3">
            {visibleAnswerIndices.map((ansIdx, i) => (
              <motion.button
                key={ansIdx}
                onClick={() => handleAnswer(ansIdx)}
                className="w-full py-4 px-5 rounded-2xl text-left font-medium text-white border-2 transition-all backdrop-blur-sm bg-white/5 hover:bg-white/10 flex items-center gap-3"
                style={{ borderColor: `${activeTeam.color}60` }}
                whileHover={{ scale: 1.01, borderColor: activeTeam.color }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: `${activeTeam.color}30`, color: activeTeam.color }}
                >
                  {answerLabels[i]}
                </span>
                <span className="text-base">{currentQuestion.answers[ansIdx]}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---- REVEAL ---- */
  if (phase === 'reveal' && currentQuestion) {
    const isCorrect = selectedAnswer === currentQuestion.correct;
    const points = isCorrect ? 100 * currentBet : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] px-4 py-6 flex flex-col items-center justify-center">
        <AnimatePresence>
          <motion.div
            className="w-full max-w-md space-y-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key="reveal"
          >
            {/* Result icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              {isCorrect ? (
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-green-500/20">
                  <Star className="w-10 h-10 text-green-400" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-red-500/20">
                  <X className="w-10 h-10 text-red-400" />
                </div>
              )}
            </motion.div>

            {/* Points animation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium" style={{ color: activeTeam.color }}>
                {activeTeam.name}
              </p>
              <p className={cn(
                'text-4xl font-black',
                isCorrect ? 'text-green-400' : 'text-red-400'
              )}>
                {isCorrect ? `+${points}` : '+0'}
              </p>
            </motion.div>

            {/* All answers revealed */}
            <div className="space-y-2 text-left">
              {currentQuestion.answers.map((ans, i) => {
                const isCorrectAnswer = i === currentQuestion.correct;
                const wasSelected = i === selectedAnswer;
                return (
                  <motion.div
                    key={i}
                    className={cn(
                      'py-3 px-4 rounded-xl border-2 flex items-center gap-3',
                      isCorrectAnswer ? 'bg-green-500/15 border-green-500' : wasSelected ? 'bg-red-500/15 border-red-500' : 'bg-[#1b2028]/30 border-[#44484f]/50'
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      isCorrectAnswer ? 'bg-green-500 text-white' : 'bg-[#20262f] text-[#a8abb3]'
                    )}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className={cn(
                      'text-sm font-medium',
                      isCorrectAnswer ? 'text-green-300' : wasSelected ? 'text-red-300' : 'text-[#a8abb3]'
                    )}>
                      {ans}
                    </span>
                    {isCorrectAnswer && <Star className="w-4 h-4 text-green-400 ml-auto" />}
                  </motion.div>
                );
              })}
            </div>

            {/* Tug-of-war bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: TEAM_A_COLOR }}>Team A: {teamA.score}</span>
                <span style={{ color: TEAM_B_COLOR }}>Team B: {teamB.score}</span>
              </div>
              <div className="h-3 rounded-full bg-[#1b2028] overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${TEAM_A_COLOR}, ${TEAM_A_COLOR})` }}
                  animate={{ width: `${tugPercent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
                <div
                  className="absolute inset-0 h-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${TEAM_A_COLOR}00 ${tugPercent - 5}%, ${TEAM_B_COLOR} ${tugPercent + 5}%)`,
                    opacity: 0.3,
                  }}
                />
              </div>
            </div>

            {/* Next button */}
            <motion.button
              onClick={nextAfterReveal}
              className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base backdrop-blur-sm hover:bg-white/15 transition-colors"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Weiter <ArrowRight className="w-4 h-4 inline ml-1" />
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  /* ---- GAME OVER ---- */
  if (phase === 'gameOver') {
    const winner = teamA.score >= teamB.score ? teamA : teamB;
    const loser = teamA.score >= teamB.score ? teamB : teamA;
    const isDraw = teamA.score === teamB.score;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f141a] to-[#0a0e14] px-4 py-8">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <div className="mx-auto max-w-md space-y-6">
          {/* Confetti dots */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? TEAM_A_COLOR : TEAM_B_COLOR,
                  left: `${(i / 20) * 100 + Math.random() * 5}%`,
                }}
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

          {/* Trophy */}
          <motion.div
            className="flex justify-center relative z-10"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${winner.color}30` }}>
              <Trophy className="w-10 h-10" style={{ color: winner.color }} />
            </div>
          </motion.div>

          {/* Winner announcement */}
          <motion.div
            className="text-center space-y-1 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-[#a8abb3] uppercase tracking-wider">Split Quiz</p>
            {isDraw ? (
              <h2 className="text-2xl font-bold text-white">Unentschieden!</h2>
            ) : (
              <>
                <h2 className="text-2xl font-bold" style={{ color: winner.color }}>{winner.name} gewinnt!</h2>
                <p className="text-lg font-semibold text-white">{winner.score} Punkte</p>
              </>
            )}
          </motion.div>

          {/* Tug-of-war final */}
          <motion.div
            className="space-y-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex justify-between text-sm font-bold">
              <span style={{ color: TEAM_A_COLOR }}>Team A: {teamA.score}</span>
              <span style={{ color: TEAM_B_COLOR }}>Team B: {teamB.score}</span>
            </div>
            <div className="h-4 rounded-full bg-[#1b2028] overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: TEAM_A_COLOR }}
                initial={{ width: '50%' }}
                animate={{ width: `${tugPercent}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15, delay: 0.8 }}
              />
            </div>
          </motion.div>

          {/* Team details */}
          <motion.div
            className="grid grid-cols-2 gap-3 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[teamA, teamB].map((team, i) => (
              <div
                key={team.name}
                className="rounded-2xl border p-3 space-y-2"
                style={{ borderColor: `${team.color}40`, background: `${team.color}08` }}
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" style={{ color: team.color, opacity: team === winner && !isDraw ? 1 : 0.3 }} />
                  <span className="text-sm font-bold" style={{ color: team.color }}>{team.name}</span>
                </div>
                <p className="text-2xl font-black text-white">{team.score}</p>
                <p className="text-xs text-[#a8abb3]">{team.correctCount} richtige</p>
                <div className="space-y-1">
                  {team.players.map(p => (
                    <span key={p} className="block text-xs text-[#a8abb3] truncate">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* MVP */}
          {mvp && (
            <motion.div
              className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-xs text-yellow-400/70 uppercase tracking-wider">MVP</p>
              <p className="text-lg font-bold text-yellow-300">{mvp}</p>
              <p className="text-xs text-yellow-400/50">{playerCorrectMap.current[mvp] || 0} Team-Siege beigetragen</p>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-3 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            {[
              { label: 'Runden', value: totalRounds },
              { label: 'Fragen', value: totalRounds },
              { label: 'Wetten', value: bettingEnabled ? 'An' : 'Aus' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#1b2028]/40 border border-[#44484f]/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-[#a8abb3] uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex gap-3 pt-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {onClose && (
              <motion.button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border-2 border-[#44484f]/60 text-[#f1f3fc] font-semibold flex items-center justify-center gap-2 hover:border-[#44484f] transition-colors text-sm"
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Anderes Spiel
              </motion.button>
            )}
            <motion.button
              onClick={restart}
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(59,130,246,0.4)] text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw className="w-4 h-4" />
              Nochmal
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* Fallback */
  return null;
}
