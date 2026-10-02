import { GameStage } from '../ui/GameStage';
import { TeamRail } from './TeamRail';
import { wagerPoints } from './rules';
import { splitQuizSnapshotFor } from './private-state';
import { useOnlineAuthority, useOnlineSnapshot, usePrivateSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { removeFromSplitQuiz } from './roster-change';
import { assignTeams } from './guest-teams';
import { useSplitGuests } from './useSplitGuests';
import { localActiveSeats } from '../ui/guest-handover';
import { serverClock } from '../party/scene-clock';
import { planPhaseStart } from '../party/phase-gate';
import { usePhaseGate } from '../party/usePhaseGate';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameTimer } from '../engine/TimerSystem';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Play, Trophy, RotateCcw, Timer, ArrowRight, ArrowLeft,
  Smartphone, Shuffle, Zap, Crown, Star, ChevronRight, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

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

const TEAM_A_COLOR = '#a3d6ee';
const TEAM_B_COLOR = '#f2b792';

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

/**
 * Verteilt die vier Antworten fair auf beide Teams: JEDES Team sieht die
 * richtige Antwort + genau EINEN (je unterschiedlichen) Ablenker, zufällig
 * angeordnet. Vorher bekam ein Team statisch nur die Indizes 0/1 bzw. 2/3 —
 * lag die richtige Antwort in der anderen Hälfte, hatte ein Team gar keine
 * richtige Option zur Auswahl. Gibt pro Team zwei Indizes in q.answers zurück.
 */
function computeSplit(q: QuizQuestion): [number[], number[]] {
  const wrong = shuffle([0, 1, 2, 3].filter((i) => i !== q.correct));
  const pairA = shuffle([q.correct, wrong[0]]);
  const pairB = shuffle([q.correct, wrong[1]]);
  return [pairA, pairB];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SplitQuizGameProps {
  players?: string[];
  onClose?: () => void;
  online?: OnlineGameProps;
}

// Default player names are set dynamically via t() inside the component

export default function SplitQuizGame({ players: initialPlayers, onClose, online }: SplitQuizGameProps) {
  const { t } = useTranslation();
  const onlinePlayerNames = online?.players?.map((p, i, all) => all.filter(other => other.name === p.name).length > 1 ? `${p.name} (${i + 1})` : p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyPlayerNames = (useInitialRoster() ?? []).map((p) => p.name);
  const defaultPlayers = [
    t('games.splitquiz.defaultPlayer', { n: 1 }),
    t('games.splitquiz.defaultPlayer', { n: 2 }),
    t('games.splitquiz.defaultPlayer', { n: 3 }),
    t('games.splitquiz.defaultPlayer', { n: 4 }),
  ];
  const startPlayers = onlinePlayerNames.length >= 4
    ? onlinePlayerNames
    : partyPlayerNames.length >= 4
      ? partyPlayerNames
      : initialPlayers && initialPlayers.length >= 4 ? initialPlayers : defaultPlayers;
  /* ---- Setup state ---- */
  const [playerNames, setPlayerNames] = useState<string[]>(startPlayers);
  const [totalRounds, setTotalRounds] = useState(10);
  const [bettingEnabled, setBettingEnabled] = useState(true);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES));

  const [rosterIds, setRosterIds] = useState(() => startPlayers.map((_, i) => online?.players[i]?.id ?? `local-${i}`));
  const nameFor = (id: string) => playerNames[rosterIds.indexOf(id)] ?? id;
  const initialOrder = useRef(shuffle(rosterIds));
  /* ---- Team state ---- */
  const [teamA, setTeamA] = useState<TeamState>(() => buildTeam(t('games.splitquiz.teamA'), TEAM_A_COLOR, initialOrder.current, 0));
  const [teamB, setTeamB] = useState<TeamState>(() => buildTeam(t('games.splitquiz.teamB'), TEAM_B_COLOR, initialOrder.current, 1));

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');

  const navigate = useNavigate();
  // GamesHub reicht `onClose` hier zwar durch, die Prop ist aber optional —
  // deshalb der Rückfall auf `/games`.
  const exitGuard = useConfirmExit(() => { if (onClose) onClose(); else navigate('/games'); });

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0); // 0 = A answers first, then B
  const [teamAnswered, setTeamAnswered] = useState<[boolean, boolean]>([false, false]);
  const sealedAnswers = useRef<[number | null, number | null]>([null, null]);
  const sealedBets = useRef<[number, number]>([1, 1]);
  const [roundOutcomes, setRoundOutcomes] = useState<{ answer: number; points: number }[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentBet, setCurrentBet] = useState(1);
  const [showBetting, setShowBetting] = useState(false);

  /* ---- Question deck ---- */
  const deck = useRef<QuizQuestion[]>([]);
  const deckPos = useRef(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  // Pro Frage: welche zwei Antwort-Indizes sieht Team A bzw. Team B (je
  // richtige Antwort + ein Ablenker). Siehe computeSplit().
  const [answerSplit, setAnswerSplit] = useState<[number[], number[]]>([[0, 1], [2, 3]]);

  /* ---- Round tracking for MVP ---- */
  const playerCorrectMap = useRef<Record<string, number>>({});



  // 🔁-Gaeste am Host-Handy: verdeckte Weitergabe an das aktive Team (secret).
  const guests = useSplitGuests({ online, teams: [teamA.players, teamB.players], activeTeam: activeTeamIdx, phase });
  // Gemeinsamer Phasenstart (Serverzeit): der Host plant jeden Wechsel mit
  // Vorlauf und schickt ihn an Handys und TV — alle wechseln gleichzeitig.
  const [remotePhaseStartsAt, setRemotePhaseStartsAt] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plannedPhaseStart = useMemo(() => (online ? planPhaseStart() : serverClock.now()), [phase, currentRound, activeTeamIdx]);
  const phaseStartsAt = online && !online.isHost ? remotePhaseStartsAt : plannedPhaseStart;
  const gate = usePhaseGate(phase, online ? phaseStartsAt : null);

  const seatInfo = (id: string) => online?.players.find(p => p.id === id);
  useTVGameBridge('splitquiz', {
    partyScoresById: online ? Object.fromEntries([teamA, teamB].flatMap(team => team.players.map(id => [id, team.score]))) : undefined,
    phase, phaseStartsAt, currentRound, players: playerNames, teamA: { ...teamA, players: teamA.players.map(nameFor) }, teamB: { ...teamB, players: teamB.players.map(nameFor) }, totalRounds,
    // Volle Spieler-Identitaet fuer den TV (nur Oeffentliches: Name, Symbol, Farbe, Team).
    playerInfo: rosterIds.map(id => ({ id, name: nameFor(id), avatar: seatInfo(id)?.avatar ?? '', color: seatInfo(id)?.color ?? '', team: teamA.players.includes(id) ? 0 : teamB.players.includes(id) ? 1 : -1 })),
    handover: guests.handover.tv,
    question: !online || (phase === 'reveal' && teamAnswered[activeTeamIdx === 0 ? 1 : 0]) ? currentQuestion?.question || '' : '',
    answers: !online || (phase === 'reveal' && teamAnswered[activeTeamIdx === 0 ? 1 : 0]) ? currentQuestion?.answers || [] : [],
    // Online sieht das wartende Team die Kategorie erst zur Aufloesung — der TV auch.
    category: !online || phase === 'reveal' ? currentQuestion?.category || '' : '',
    correctAnswer: phase === 'reveal' && teamAnswered.every(Boolean) ? currentQuestion?.correct ?? -1 : -1,
  }, [phase, currentRound, activeTeamIdx, phaseStartsAt, guests.handover.tv?.playerId ?? '', guests.handover.tv?.progress?.phase ?? '', rosterIds.join(',')], !online || online.isHost);

  const commitAnswerRef = useRef<(answer: number) => void>(() => {});
  /* ---- Timer ---- */
  const handleTimerExpire = useCallback(() => {
    // auto-skip if no answer given
    if (phase === 'question' || phase === 'betting') {
      if (online && !online.isHost) return;
      timer.pause();
      commitAnswerRef.current(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Die Frage-Uhr steht, solange das Handy unterwegs ist und bis der Einblend-Takt die Eingabe freigibt.
  const timer = useGameTimer(20, handleTimerExpire, (!online || (online.isHost && online.isConnected !== false)) && !guests.handover.isPaused && gate.inputOpen);

  /* ---- Derived ---- */
  const activeTeam = activeTeamIdx === 0 ? teamA : teamB;
  const inactiveTeam = activeTeamIdx === 0 ? teamB : teamA;
  const maxScore = Math.max(teamA.score, teamB.score, 1);

  /* ---- Build team helper ---- */
  function buildTeam(name: string, color: string, pls: string[], half: number): TeamState {
    const shuffled = pls;
    const mid = Math.ceil(shuffled.length / 2);
    return {
      name,
      color,
      // Plaetze des Host-Handys moeglichst in EIN Team (guest-teams.ts) — dann
      // braucht es keine verdeckte Weitergabe zwischen den Teams.
      players: assignTeams(shuffled, localActiveSeats(online))[half],
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
    if (online || playerNames.length >= 30) return;
    const name = t('games.splitquiz.defaultPlayer', { n: playerNames.length + 1 });
    setPlayerNames(prev => [...prev, name]);
    const id = crypto.randomUUID();
    setRosterIds(prev => [...prev, id]);
    // Add to smaller team
    if (teamA.players.length <= teamB.players.length) {
      setTeamA(prev => ({ ...prev, players: [...prev.players, id] }));
    } else {
      setTeamB(prev => ({ ...prev, players: [...prev.players, id] }));
    }
  }

  function removePlayer(idx: number) {
    if (online || playerNames.length <= 4) return;
    const name = rosterIds[idx];
    setRosterIds(prev => prev.filter((_, i) => i !== idx));
    setPlayerNames(prev => prev.filter((_, i) => i !== idx));
    setTeamA(prev => ({ ...prev, players: prev.players.filter(p => p !== name) }));
    setTeamB(prev => ({ ...prev, players: prev.players.filter(p => p !== name) }));
  }

  function updatePlayerName(idx: number, name: string) {
    if (online) return;
    setPlayerNames(prev => prev.map((p, i) => i === idx ? name : p));
  }

  const isOnlineOrParty = onlinePlayerNames.length >= 4 || partyPlayerNames.length >= 4;
  function handleImportNames(names: string[]) {
    if (online) return;
    // REPLACE the entire roster with the imported names (drop all existing players
    // incl. placeholders), then pad up to the minimum of 4 with blank entries.
    const roster = names.slice(0, 30);
    let idx = roster.length + 1;
    while (roster.length < 4) {
      roster.push(t('games.splitquiz.defaultPlayer', { n: idx++ }));
    }
    setPlayerNames(roster);
    const ids = roster.map(() => crypto.randomUUID());
    setRosterIds(ids);
    const mid = Math.ceil(roster.length / 2);
    setTeamA(prev => ({ ...prev, players: ids.slice(0, mid) }));
    setTeamB(prev => ({ ...prev, players: ids.slice(mid) }));
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
    const [nextA, nextB] = assignTeams(shuffle(all), localActiveSeats(online));
    setTeamA(prev => ({ ...prev, players: nextA }));
    setTeamB(prev => ({ ...prev, players: nextB }));
  }

  const route = useOnlineAuthority(online, 'splitquiz', `${phase}:${currentRound}:${activeTeamIdx}`, {
    startGame: { allow: (sender, args) => phase === "setup" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => startGame() },
    beginQuestion: { allow: (sender, args) => phase === "handoff" && (activeTeamIdx === 0 ? teamA : teamB).players.includes(sender), run: (...args) => beginQuestion() },
    confirmBet: { allow: (sender, args) => phase === "betting" && (activeTeamIdx === 0 ? teamA : teamB).players.includes(sender), run: (...args) => confirmBet() },
    handleAnswer: { allow: (sender, args) => phase === "question" && Number.isInteger(args[0]) && args[0] >= 0 && args[0] < 4 && answerSplit[activeTeamIdx].includes(args[0]) && (activeTeamIdx === 0 ? teamA : teamB).players.includes(sender), run: (...args) => handleAnswer(args[0]) },
    nextAfterReveal: { allow: (sender, args) => phase === "reveal" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => nextAfterReveal() },
    playAgain: { allow: (sender, args) => phase === "gameOver" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => playAgain() },
    chooseBet: { allow: (sender, args) => phase === "betting" && [1,2,3].includes(args[0]) && (activeTeamIdx === 0 ? teamA : teamB).players.includes(sender), run: (...args) => chooseBet(args[0]) },
  });

  usePrivateSnapshot(online, 'splitquiz-state', { phase, phaseStartsAt, teamA, teamB, currentRound, activeTeamIdx, currentQuestion, answerSplit, selectedAnswer, roundOutcomes, teamAnswered, totalRounds, bettingEnabled, currentBet, showBetting, playerNames, rosterIds, correctMap: playerCorrectMap.current }, (state, recipient) => splitQuizSnapshotFor(state, recipient), data => {
    setPhase(data.phase);
    setRemotePhaseStartsAt(typeof data.phaseStartsAt === 'number' ? data.phaseStartsAt : null);
    setTeamA(data.teamA);
    setTeamB(data.teamB);
    setCurrentRound(data.currentRound);
    setActiveTeamIdx(data.activeTeamIdx);
    setCurrentQuestion(data.currentQuestion);
    setAnswerSplit(data.answerSplit);
    setSelectedAnswer(data.selectedAnswer);
    setRoundOutcomes(data.roundOutcomes ?? []);
    setTeamAnswered(data.teamAnswered);
    setTotalRounds(data.totalRounds);
    setBettingEnabled(data.bettingEnabled);
    setCurrentBet(data.currentBet);
    setShowBetting(data.showBetting);
    setPlayerNames(data.playerNames);
    setRosterIds(data.rosterIds);
    playerCorrectMap.current = data.correctMap ?? {};
  });
  useOnlineSnapshot(online, 'splitquiz-clock-state', { timeLeft: timer.timeLeft }, data => timer.reset(data.timeLeft));
  function chooseBet(value: number) { if (route('chooseBet', [value])) return; setCurrentBet(value); }
  /* ---- Start game ---- */
  function startGame() {
    if (route("startGame", [])) return;
    buildDeck();
    playerCorrectMap.current = {};
    [...teamA.players, ...teamB.players].forEach(p => { playerCorrectMap.current[p] = 0; });
    setTeamA(prev => ({ ...prev, score: 0, correctCount: 0 }));
    setTeamB(prev => ({ ...prev, score: 0, correctCount: 0 }));
    setCurrentRound(1);
    setActiveTeamIdx(0);
    setTeamAnswered([false, false]);
    setRoundOutcomes([]);
    sealedAnswers.current = [null, null];
    sealedBets.current = [1, 1];
    setPhase('handoff');
    const q = drawQuestion();
    setCurrentQuestion(q);
    setAnswerSplit(computeSplit(q));
  }

  /* ---- Begin question for active team ---- */
  function beginQuestion() {
    if (route("beginQuestion", [])) return;
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
    if (route("confirmBet", [])) return;
    setShowBetting(false);
    setPhase('question');
  }

  /* ---- Handle answer ---- */
  function handleAnswer(answerIdx: number) {
    if (route("handleAnswer", [answerIdx])) return;
    commitAnswer(answerIdx);
  }

  function commitAnswer(answerIdx: number) {
    if (sealedAnswers.current[activeTeamIdx] !== null) return;
    timer.pause();
    sealedAnswers.current[activeTeamIdx] = answerIdx;
    sealedBets.current[activeTeamIdx] = currentBet;
    const answered: [boolean, boolean] = [...teamAnswered];
    answered[activeTeamIdx] = true;
    setTeamAnswered(answered);
    if (!answered[activeTeamIdx === 0 ? 1 : 0]) {
      setActiveTeamIdx(activeTeamIdx === 0 ? 1 : 0);
      setSelectedAnswer(null);
      setPhase('handoff');
      return;
    }
    setRoundOutcomes(sealedAnswers.current.map((answer, i) => ({ answer: answer ?? -1, points: wagerPoints(answer === currentQuestion?.correct, sealedBets.current[i]) })));
    [setTeamA, setTeamB].forEach((setTeam, i) => {
      const correct = sealedAnswers.current[i] === currentQuestion?.correct;
      const points = wagerPoints(correct, sealedBets.current[i]);
      setTeam(prev => ({ ...prev, score: prev.score + points, correctCount: prev.correctCount + (correct ? 1 : 0) }));
    });
    setSelectedAnswer(answerIdx);
    setPhase('reveal');
  }

  commitAnswerRef.current = commitAnswer;

  // Host entfernt jemanden mitten im Spiel (Masterplan 6.6): Teams aufraeumen,
  // leeres Team auffuellen und dann mit frischer Frage weiter, nie haengen.
  useRemovedPlayers(online, ids => {
    const change = removeFromSplitQuiz({ phase, rosterIds, playerNames, teamA, teamB, activeTeamIdx, teamAnswered }, ids);
    if (!change.changed) return;
    ids.forEach(id => { delete playerCorrectMap.current[id]; });
    setRosterIds(change.state.rosterIds);
    setPlayerNames(change.state.playerNames);
    setTeamA(change.state.teamA);
    setTeamB(change.state.teamB);
    if (change.restartQuestion) {
      timer.pause();
      timer.reset(20);
      sealedAnswers.current = [null, null];
      sealedBets.current = [1, 1];
      setRoundOutcomes([]);
      setTeamAnswered([false, false]);
      setActiveTeamIdx(0);
      setSelectedAnswer(null);
      setCurrentBet(1);
      setShowBetting(false);
      const q = drawQuestion();
      setCurrentQuestion(q);
      setAnswerSplit(computeSplit(q));
      setPhase('handoff');
    } else if (change.skipActive) {
      commitAnswer(-1);
    }
  });

  /* ---- Next after reveal ---- */
  function nextAfterReveal() {
    if (route("nextAfterReveal", [])) return;
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
    setRoundOutcomes([]);
    sealedAnswers.current = [null, null];
    sealedBets.current = [1, 1];
    setActiveTeamIdx(0);
    setSelectedAnswer(null);
    setCurrentBet(1);
    const q = drawQuestion();
    setCurrentQuestion(q);
    setAnswerSplit(computeSplit(q));
    setPhase('handoff');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winnerScore = Math.max(teamA.score, teamB.score);
      const myTeam = online ? [teamA, teamB].find(team => team.players.includes(online.myPlayerId)) : undefined;
      recordEnd('split-quiz', online ? myTeam?.score ?? 0 : winnerScore, !online || myTeam?.score === winnerScore);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Restart ---- */
  function restart() {
    setPhase('setup');
    timer.reset(20);
  }

  // Preserve teams and settings; start a new match with fresh scores and MVP tallies.
  function playAgain() {
    if (route("playAgain", [])) return;
    gameRecordedRef.current = false;
    setTeamA(prev => ({ ...prev, score: 0, correctCount: 0 }));
    setTeamB(prev => ({ ...prev, score: 0, correctCount: 0 }));
    playerCorrectMap.current = {};
    buildDeck();
    setCurrentRound(1);
    setActiveTeamIdx(0);
    setTeamAnswered([false, false]);
    setRoundOutcomes([]);
    sealedAnswers.current = [null, null];
    sealedBets.current = [1, 1];
    setSelectedAnswer(null);
    setCurrentBet(1);
    setShowBetting(false);
    timer.reset(20);
    setPhase('handoff');
    const q = drawQuestion();
    setCurrentQuestion(q);
    setAnswerSplit(computeSplit(q));
  }

  /* ---- Get visible answers for a team (richtige Antwort + 1 Ablenker) ---- */
  function getTeamAnswers(teamIdx: number): number[] {
    return answerSplit[teamIdx] ?? (teamIdx === 0 ? [0, 1] : [2, 3]);
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

  /* Jede Phase hat hier ihr eigenes `return`. Damit der Verlassen-Dialog
     nicht mehrfach im Quelltext steht, wird er einmal gebaut. */
  const arenaRail = <TeamRail teams={[teamA,teamB].map(team=>({...team,players:team.players.map(nameFor)}))} active={activeTeamIdx} round={currentRound} total={totalRounds}/>;
  const exitDialog = <ConfirmExitDialog {...exitGuard.dialogProps} accent="#df8eff" />;

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  // Gerendert wird die GEZEIGTE Phase (usePhaseGate) — Host, Handys und TV wechseln gleichzeitig.
  const view = gate.shown;
  const renderPhase = () => {
  // Waehrend das Host-Handy weitergegeben wird, ist NUR der deckende Weitergabe-Bildschirm im DOM.
  if (guests.handover.overlay) return <>{guests.handover.overlay}{exitDialog}</>;

  /* ---- SETUP ---- */
  // Wer das Handy haelt, bestimmt, welche Team-Haelfte es zeigen darf (eigener Platz oder bestaetigter Gast).
  const myTeamIndex = guests.holderTeam;
  if (online && view !== 'setup' && view !== 'gameOver' && view !== 'reveal' && myTeamIndex !== activeTeamIdx) {
    return <GameStage gameId="split-quiz" className="quiz-arena min-h-[100dvh]  text-white px-5 py-10 flex flex-col items-center justify-center gap-6">
      {exitDialog}
        {arenaRail}
      <h1 className="text-2xl font-bold">{t('games.splitquiz.title')}</h1>
      <p>{t('games.splitquiz.roundOf', { current: currentRound, total: totalRounds })}</p>
      <div className="max-w-md w-full rounded-3xl bg-white/5 border border-white/10 p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
        <p className="text-white/50">{activeTeam.players.map(nameFor).join(' · ')}</p>
        <p>{t('nativeExtra.gameLobby.waitingForPlayers')}</p>
      </div>
      <p>{teamA.name}: {teamA.score} · {teamB.name}: {teamB.score}</p>
    </GameStage>;
  }
  if (view === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (view === 'setup') {
    return (
      <GameStage gameId="split-quiz" className="quiz-arena min-h-screen     px-4 py-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            {/* top-4 left-4 ist in der App exakt die Stelle, an der der
                FloatingBackButton liegt — dort nur einer von beiden. */}
            {onClose && !hasShellBackButton() && (
              <button onClick={onClose} className="absolute top-4 left-4 text-[#a8abb3] hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-white">{t('games.splitquiz.title')}</h1>
            <p className="text-sm text-[#a8abb3]">{t('games.splitquiz.subtitle')}</p>
          </div>

          {/* Player names */}
          <PlayerSetup locked={!!online}
            players={playerNames.map((name, i) => ({ id: String(i), name }))}
            onAdd={addPlayer}
            onRemove={(id) => removePlayer(Number(id))}
            onRename={(id, name) => updatePlayerName(Number(id), name)}
            onImportNames={isOnlineOrParty ? undefined : handleImportNames}
            min={4}
            max={30}
            accent="#df8eff"
            label={t('games.splitquiz.playerLabel')}
          />

          {/* Teams visualization */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: TEAM_A_COLOR, background: `${TEAM_A_COLOR}10` }}>
              <h3 className="font-bold text-sm" style={{ color: TEAM_A_COLOR }}>{t('games.splitquiz.teamA')}</h3>
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
                      {nameFor(p).charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{nameFor(p)}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: TEAM_B_COLOR, background: `${TEAM_B_COLOR}10` }}>
              <h3 className="font-bold text-sm" style={{ color: TEAM_B_COLOR }}>{t('games.splitquiz.teamB')}</h3>
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
                      {nameFor(p).charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{nameFor(p)}</span>
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
            <Shuffle className="w-4 h-4" /> {t('games.splitquiz.reshuffleTeams')}
          </button>

          {/* Rounds */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f1f3fc]">{t('games.splitquiz.roundsLabel', { count: totalRounds })}</label>
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
            <label className="text-sm font-medium text-[#f1f3fc]">{t('games.splitquiz.categoriesLabel')}</label>
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
                  {t(`games.splitquiz.cat_${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Betting toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#f1f3fc]">{t('games.splitquiz.bettingEnabled')}<span className="block text-xs text-white/50 mt-1">{t('games.splitquiz.wagerRisk')}</span></span>
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
            <Play className="w-5 h-5" /> {t('games.splitquiz.startGame')}
          </motion.button>
        </div>
      </GameStage>
    );
  }

  /* ---- HANDOFF (pass the phone) ---- */
  if (view === 'handoff') {
    return (
      <GameStage gameId="split-quiz" className="quiz-arena arena-stacked min-h-screen flex flex-col items-center px-4">
        {exitDialog}
        {arenaRail}
        <motion.div
          className="arena-handoff text-center space-y-6 w-full max-w-xl"
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
            <p className="text-[#a8abb3] text-sm">{t('games.splitquiz.roundOf', { current: currentRound, total: totalRounds })}</p>
            <h2 className="text-2xl font-bold text-white mt-1">
              {online ? t('games.splitquiz.ready') : t('games.splitquiz.passDevice')}
            </h2>
            <h2 className="text-3xl font-black mt-1" style={{ color: activeTeam.color }}>
              {activeTeam.name}
            </h2>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {activeTeam.players.map(p => (
                <span key={p} className="px-2 py-1 rounded-full text-xs font-medium text-white/80" style={{ backgroundColor: `${activeTeam.color}30` }}>
                  {nameFor(p)}
                </span>
              ))}
            </div>
          </div>
          {!online && <p className="text-[#a8abb3]/60 text-xs">{t('games.splitquiz.nopeekWarning')}</p>}
          <motion.button
            onClick={beginQuestion}
            className="arena-primary px-8 py-3.5 rounded-lg font-bold text-lg"
            style={{ backgroundColor: activeTeam.color, boxShadow: 'none' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('games.splitquiz.ready')} <ArrowRight className="w-5 h-5 inline ml-1" />
          </motion.button>
        </motion.div>
      </GameStage>
    );
  }

  /* ---- BETTING ---- */
  if (view === 'betting' && showBetting && currentQuestion) {
    return (
      <GameStage gameId="split-quiz" className="quiz-arena arena-stacked min-h-screen flex flex-col items-center px-4">
        {exitDialog}
        {arenaRail}
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
              {t('games.splitquiz.placeBet', { team: activeTeam.name })}
            </p>
            <p className="text-[#a8abb3] text-sm">{t('games.splitquiz.howConfident')}</p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3].map(bet => (
              <motion.button
                key={bet}
                data-selected={currentBet === bet}
                onClick={() => chooseBet(bet)}
                className={cn(
                  'arena-chip font-bold text-2xl transition-all',
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
                <span>{bet}x</span><small>+{bet*100} / {100*(1-bet)}</small>
              </motion.button>
            ))}
          </div>

          <p className="text-sm text-[#a8abb3]/60">
            {t('games.splitquiz.betPoints', { points: currentBet * 100 })}
          </p>

          <motion.button
            onClick={confirmBet}
            className="arena-primary w-full py-3.5 rounded-lg font-bold text-base"
            style={{ backgroundColor: activeTeam.color }}
            whileTap={{ scale: 0.97 }}
          >
            {t('games.splitquiz.confirmBet')}
          </motion.button>
        </motion.div>
      </GameStage>
    );
  }

  /* ---- QUESTION ---- */
  if (view === 'question' && currentQuestion) {
    const visibleAnswerIndices = getTeamAnswers(activeTeamIdx);
    const answerLabels = activeTeamIdx === 0 ? ['A', 'B'] : ['C', 'D'];

    return (
      <GameStage gameId="split-quiz" className="quiz-arena min-h-screen     px-4 py-6 flex flex-col">
        {exitDialog}
        {arenaRail}
        {/* HUD */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${activeTeam.color}25`, color: activeTeam.color }}>
              {activeTeam.name}
            </span>
            <span className="text-xs text-[#a8abb3]/60">{t('games.splitquiz.roundOf', { current: currentRound, total: totalRounds })}</span>
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
          <div className="arena-question-card w-full max-w-3xl mb-6">
            <p className="text-xs text-[#a8abb3]/60 mb-2 uppercase tracking-wider">{t(`games.splitquiz.cat_${currentQuestion.category}`)}</p>
            <h2 className="text-xl font-bold text-white leading-tight">{currentQuestion.question}</h2>
            {currentBet > 1 && (
              <p className="mt-2 text-xs font-semibold" style={{ color: activeTeam.color }}>
                <Zap className="w-3 h-3 inline" /> {t('games.splitquiz.betActive', { multiplier: currentBet })}
              </p>
            )}
          </div>

          {/* Answer buttons */}
          <div className="w-full max-w-3xl grid gap-3 sm:grid-cols-2">
            {visibleAnswerIndices.map((ansIdx, i) => (
              <motion.button
                key={ansIdx}
                onClick={() => handleAnswer(ansIdx)}
                className="arena-answer w-full text-left font-medium text-white border-2 transition-all flex items-center gap-3"
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
      </GameStage>
    );
  }

  /* ---- REVEAL ---- */
  if (view === 'reveal' && currentQuestion) {
    const isCorrect = selectedAnswer === currentQuestion.correct;
    const points = wagerPoints(isCorrect, currentBet);

    return (
      <GameStage gameId="split-quiz" className="quiz-arena min-h-screen     px-4 py-6 flex flex-col items-center justify-center">
        {exitDialog}
        {arenaRail}
        <AnimatePresence>
          <motion.div
            className="w-full max-w-3xl space-y-6 text-center"
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
                {points > 0 ? `+${points}` : points}
              </p>
            </motion.div>

            <div className="arena-reveal-table">{roundOutcomes.map((outcome, i) => <div key={i} className="rounded-xl bg-white/5 p-3"><strong>{i === 0 ? teamA.name : teamB.name}</strong><p>{outcome.answer >= 0 ? 'ABCD'[outcome.answer] : '-'} / {outcome.points > 0 ? '+' : ''}{outcome.points}</p></div>)}</div>
            {/* All answers revealed */}
            <div className="space-y-2 text-left">
              {currentQuestion.answers.map((ans, i) => {
                if (online && !ans) return null;
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
                <span style={{ color: TEAM_A_COLOR }}>{t('games.splitquiz.teamScore', { team: t('games.splitquiz.teamA'), score: teamA.score })}</span>
                <span style={{ color: TEAM_B_COLOR }}>{t('games.splitquiz.teamScore', { team: t('games.splitquiz.teamB'), score: teamB.score })}</span>
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
              disabled={!!online && !online.isHost} onClick={nextAfterReveal}
              className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base backdrop-blur-sm hover:bg-white/15 transition-colors"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {t('games.splitquiz.next')} <ArrowRight className="w-4 h-4 inline ml-1" />
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </GameStage>
    );
  }

  /* ---- GAME OVER ---- */
  if (view === 'gameOver') {
    const winner = teamA.score >= teamB.score ? teamA : teamB;
    const loser = teamA.score >= teamB.score ? teamB : teamA;
    const isDraw = teamA.score === teamB.score;

    return (
      <GameStage gameId="split-quiz" className="quiz-arena min-h-screen     px-4 py-8">
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
            <p className="text-sm text-[#a8abb3] uppercase tracking-wider">{t('games.splitquiz.title')}</p>
            {isDraw ? (
              <h2 className="text-2xl font-bold text-white">{t('games.splitquiz.draw')}</h2>
            ) : (
              <>
                <h2 className="text-2xl font-bold" style={{ color: winner.color }}>{t('games.splitquiz.wins', { team: winner.name })}</h2>
                <p className="text-lg font-semibold text-white">{t('games.splitquiz.points', { count: winner.score })}</p>
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
              <span style={{ color: TEAM_A_COLOR }}>{t('games.splitquiz.teamScore', { team: t('games.splitquiz.teamA'), score: teamA.score })}</span>
              <span style={{ color: TEAM_B_COLOR }}>{t('games.splitquiz.teamScore', { team: t('games.splitquiz.teamB'), score: teamB.score })}</span>
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
                <p className="text-xs text-[#a8abb3]">{t('games.splitquiz.correctCount', { count: team.correctCount })}</p>
                <div className="space-y-1">
                  {team.players.map(p => (
                    <span key={p} className="block text-xs text-[#a8abb3] truncate">{nameFor(p)}</span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* MVP */}
          {false && mvp && (
            <motion.div
              className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-xs text-yellow-400/70 uppercase tracking-wider">MVP</p>
              <p className="text-lg font-bold text-yellow-300">{mvp}</p>
              <p className="text-xs text-yellow-400/50">{t('games.splitquiz.mvpContributed', { count: playerCorrectMap.current[mvp] || 0 })}</p>
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
              { label: t('games.splitquiz.statRounds'), value: totalRounds },
              { label: t('games.splitquiz.statQuestions'), value: totalRounds },
              { label: t('games.splitquiz.statBetting'), value: bettingEnabled ? t('games.splitquiz.on') : t('games.splitquiz.off') },
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
            {onClose && !hasShellBackButton() && (
              <motion.button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border-2 border-[#44484f]/60 text-[#f1f3fc] font-semibold flex items-center justify-center gap-2 hover:border-[#44484f] transition-colors text-sm"
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeft className="w-4 h-4" />
                {t('games.splitquiz.otherGame')}
              </motion.button>
            )}
            <motion.button
              disabled={!!online && !online.isHost} onClick={playAgain}
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(59,130,246,0.4)] text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw className="w-4 h-4" />
              {t('games.splitquiz.playAgain')}
            </motion.button>
          </motion.div>
        </div>
      </GameStage>
    );
  }

  /* Fallback */
  return exitDialog;
  };

  return <>
    {renderPhase()}
    {/* Einblend-Takt (Design §9): Eingaben erst ab 1200 ms nach dem Wechsel — die Weitergabe (z-90) bleibt bedienbar. */}
    {!gate.inputOpen && <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />}
  </>;
}
