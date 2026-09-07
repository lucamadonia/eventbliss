import '../headup/classic-stage.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from "framer-motion";
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  ArrowLeft,
  Timer,
  Trophy,
  RotateCcw,
  Check,
  AlertTriangle,
  Zap,
  Clock,
  Crown,
  Type,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useGameTimer } from "@/games/engine/TimerSystem";
import { getCategories, generateCategoryPrompt } from "@/games/content/categories";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
import { haptics } from "@/hooks/useHaptics";
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameMode = "classic" | "rapid" | "letter";
type Phase = "setup" | "categoryReveal" | "playing" | "roundEnd" | "gameOver";

interface CategoryPlayer {
  id: string;
  name: string;
  score: number;
  losses: number;
}

interface RoundResult {
  category: string;
  letter?: string;
  words: { word: string; playerId: string }[];
  loserId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_INFO: Record<GameMode, { icon: React.ElementType; timer: number }> = {
  classic: { icon: Clock, timer: 30 },
  rapid:   { icon: Zap,   timer: 10 },
  letter:  { icon: Type,  timer: 20 },
};

const AVATARS = ["🎉", "🎈", "🎊", "🎶", "🎵", "🎸", "🎤", "🎭", "🎬", "🌟", "💫", "🔥", "⚡", "🎯", "🏆"];

// ---------------------------------------------------------------------------
// Timer Circle SVG
// ---------------------------------------------------------------------------

function TimerCircle({ percent, timeLeft, total }: { percent: number; timeLeft: number; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const isLow = timeLeft <= 5;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={isLow ? "#ff6e84" : "url(#timerGradEP)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        <defs>
          <linearGradient id="timerGradEP" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f2bc66" />
            <stop offset="100%" stopColor="#f2bc66" />
          </linearGradient>
        </defs>
      </svg>
      <motion.span
        className={`absolute text-4xl font-black ${isLow ? "text-red-400" : "text-white"}`}
        animate={isLow ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.6 }}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Word Chip (glass pill)
// ---------------------------------------------------------------------------

function WordChip({ word, isNew }: { word: string; isNew: boolean }) {
  return (
    <motion.span
      initial={isNew ? { opacity: 0, scale: 0.6, y: 10 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="inline-block rounded-full border border-white/[0.08] bg-[#151a21]/80  px-3.5 py-1.5 text-sm font-medium text-white/70"
    >
      {word}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

function SetupScreen({
  onStart,
  onlinePlayerNames = [],
  locked = false,
}: {
  onStart: (players: CategoryPlayer[], mode: GameMode, rounds: number, timer: number) => void;
  onlinePlayerNames?: string[];
  locked?: boolean;
}) {
  const { t } = useTranslation();
  const [names, setNames] = useState<string[]>(
    onlinePlayerNames.length >= 2 ? onlinePlayerNames : ["", ""]
  );
  const [mode, setMode] = useState<GameMode>("classic");
  const [rounds, setRounds] = useState(5);
  const [timerVal, setTimerVal] = useState(MODE_INFO.classic.timer);

  const handleModeChange = (m: GameMode) => {
    setMode(m);
    setTimerVal(MODE_INFO[m].timer);
  };

  const addPlayer = () => setNames((prev) => [...prev, ""]);
  const removePlayer = (i: number) => setNames((prev) => prev.filter((_, idx) => idx !== i));
  const updateName = (i: number, v: string) => setNames((prev) => prev.map((n, idx) => (idx === i ? v : n)));
  const isOnlineOrParty = onlinePlayerNames.length >= 2;

  const handleImportNames = (imported: string[]) => {
    const next = imported.slice(0, 15);
    while (next.length < 2) next.push("");
    setNames(next);
  };

  const canStart = names.filter((n) => n.trim()).length >= 2;

  const handleStart = () => {
    const players: CategoryPlayer[] = names
      .filter((n) => n.trim())
      .map((name, i) => ({ id: `p${i}`, name: name.trim(), score: 0, losses: 0 }));
    onStart(players, mode, rounds, timerVal);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-4">
      {/* Players Card */}
      <PlayerSetup locked={locked}
        players={names.map((name, i) => ({ id: String(i), name, avatar: undefined }))}
        onAdd={addPlayer}
        onRemove={(id) => removePlayer(Number(id))}
        onRename={(id, name) => updateName(Number(id), name)}
        onImportNames={isOnlineOrParty ? undefined : handleImportNames}
        min={2}
        max={15}
        accent="#f2bc66"
        label={t('games.setup.players')}
      />

      {/* Mode Selection Cards */}
      <div className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-5 space-y-4">
        <h2 className="text-base font-extrabold font-sans text-white">
          {t('games.category.gameMode')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(MODE_INFO) as GameMode[]).map((m) => {
            const info = MODE_INFO[m];
            const Icon = info.icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex items-center gap-3 rounded-[1rem] border p-4 text-left transition-all relative overflow-hidden ${
                  active
                    ? "border-[#f2bc66]/40 bg-[#f2bc66]/[0.08] "
                    : "border-[#44484f]/20 bg-[#151a21] hover:border-white/10"
                }`}
              >
                {active && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2bc66] to-transparent" />
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-[0.75rem] ${active ? "bg-[#f2bc66]/15" : "bg-white/[0.04]"}`}>
                  <Icon className={`h-5 w-5 ${active ? "text-[#f2bc66]" : "text-white/60"}`} />
                </div>
                <div>
                  <span className={`font-semibold ${active ? "text-[#f2bc66]" : "text-white/70"}`}>
                    {t(`gameModes.category.${m}.name`)}
                  </span>
                  <p className="text-xs text-white/60">
                    {t(`gameModes.category.${m}.desc`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Bento Grid */}
      <div className="!grid grid-cols-2 gap-3">
        <div className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/65 uppercase tracking-wider">
              {t('games.setup.timer')}
            </span>
            <span className="text-sm font-bold text-[#f2bc66]">{timerVal}s</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={timerVal}
            onChange={(e) => setTimerVal(Number(e.target.value))}
            className="w-full accent-[#f2bc66] h-1.5"
          />
        </div>
        <div className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/65 uppercase tracking-wider">
              {t('games.setup.rounds')}
            </span>
            <span className="text-sm font-bold text-[#f2bc66]">{rounds}</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full accent-[#f2bc66] h-1.5"
          />
        </div>
      </div>

      {/* Fixed Bottom Start Button */}
      <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-[var(--stage-bg)] py-4 z-20">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={!canStart}
            onClick={handleStart}
            className="w-full rounded-full bg-[#f2bc66] py-4 text-base font-extrabold font-sans text-[#101513] uppercase tracking-wide  transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {t('games.setup.startGame')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Reveal Screen
// ---------------------------------------------------------------------------

function CategoryRevealScreen({
  category,
  letter,
  mode,
  onReady,
  connected = true,
}: {
  category: string;
  letter?: string;
  mode: GameMode;
  onReady: () => void;
  connected?: boolean;
}) {
  const { setTimeout, clearTimeout } = usePausableTasks(connected);
  const { t } = useTranslation();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onReady();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onReady]);

  return <div className="flex min-h-[65dvh] flex-col justify-center gap-7">
    <StageHeader title={t('games.category.categoryLabel')} trailing={<span className="text-5xl font-bold tabular-nums text-[#f2bc66]">{count > 0 ? count : t('games.category.go')}</span>} />
    <StagePanel tone="accent" className="!rounded-xl !p-7 min-h-60 flex flex-col justify-center">
      {mode === 'letter' && letter && <p className="mb-5 text-7xl font-black">{letter}</p>}
      <h2 className="text-4xl sm:text-6xl font-black leading-tight break-words">{category}</h2>
    </StagePanel>
    {mode === 'letter' && letter && <p className="text-sm text-[var(--stage-muted)]">{t('games.category.onlyWithLetter', { letter })}</p>}
  </div>;
}

// ---------------------------------------------------------------------------
// Playing Screen
// ---------------------------------------------------------------------------

function PlayingScreen({
  category,
  letter,
  mode,
  players,
  currentPlayerIndex,
  timerSeconds,
  deadline,
  connected = true,
  validation,
  canSubmit = true,
  words,
  onWordSaid,
  onTimerExpire,
}: {
  category: string;
  letter?: string;
  mode: GameMode;
  players: CategoryPlayer[];
  currentPlayerIndex: number;
  timerSeconds: number;
  deadline?: number;
  connected?: boolean;
  validation?: { result: 'ok' | 'duplicate' | 'wrong_letter'; sequence: number };
  canSubmit?: boolean;
  words: { word: string; playerId: string }[];
  onWordSaid: (word: string) => "ok" | "duplicate" | "wrong_letter" | "pending";
  onTimerExpire: () => void;
}) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState("");
  const [flash, setFlash] = useState<"duplicate" | "wrong_letter" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!validation) return;
    if (validation.result === 'ok') { setInputVal(''); setFlash(null); }
    else setFlash(validation.result);
  }, [validation?.sequence]);

  const timer = useGameTimer(timerSeconds, onTimerExpire, connected);

  useEffect(() => {
    timer.reset(deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : timerSeconds);
    timer.start();
    setInputVal("");
    if (canSubmit) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIndex, timerSeconds, deadline]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const word = inputVal.trim();
    if (!word) return;
    const result = onWordSaid(word);
    if (result === "ok") {
      setInputVal("");
      inputRef.current?.focus();
    } else if (result !== 'pending') {
      setFlash(result);
      setTimeout(() => setFlash(null), 600);
    }
  };

  const handleGesagt = () => {
    if (!canSubmit) return;
    onWordSaid("__verbal__");
    setInputVal("");
  };

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="space-y-5">
      <StageHeader title={currentPlayer.name} eyebrow={t('games.category.submitWord')}
        trailing={<span className="tabular-nums text-3xl font-semibold">{timer.timeLeft}s</span>}
        progress={{ value: timer.timeLeft, total: timerSeconds }} />
      <StagePanel className="!rounded-xl !border-[#f2bc66]/30 !p-6 sm:!p-9">
        <p className="mb-4 text-xs uppercase tracking-widest text-[var(--stage-muted)]">{t('games.category.categoryLabel')}</p>
        <div className="flex flex-wrap items-end gap-6">
          {mode === 'letter' && letter && <span className="text-8xl font-black leading-none text-[#f2bc66]">{letter}</span>}
          <h2 className="flex-1 min-w-0 break-words text-3xl sm:text-5xl font-bold leading-tight text-[#fff4dc]">{category}</h2>
        </div>
      </StagePanel>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--stage-muted)]">{players.map((player, index) => <span key={player.id} className={index === currentPlayerIndex ? 'font-bold text-[#f2bc66]' : ''}>{index + 1}. {player.name}</span>)}</div>
      <div className="space-y-3">
        <label htmlFor="category-word" className="block text-sm text-[var(--stage-muted)]">{t('games.category.wordPlaceholder')}</label>
        <div className="flex items-stretch gap-3">
          <input id="category-word" ref={inputRef} value={inputVal} disabled={!canSubmit} onChange={event => setInputVal(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSubmit()}
            placeholder={t('games.category.wordPlaceholder')} className="min-w-0 flex-1 rounded-xl border border-[#f2bc66]/40 bg-[#11150f] px-4 py-4 text-lg text-white placeholder:text-[#b5b9a9] focus:outline-none focus:ring-2 focus:ring-[#f2bc66] disabled:opacity-60" />
          <StageAction disabled={!canSubmit || !inputVal.trim()} onClick={handleSubmit} aria-label={t('games.category.submitWord')}><Check className="h-6 w-6" /></StageAction>
        </div>
        {flash && <p role="status" className="flex items-center gap-2 text-sm text-[#ffbc9d]"><AlertTriangle className="h-5 w-5 shrink-0" />{flash === 'duplicate' ? t('games.category.duplicate') : t('games.category.wrongLetter', { letter })}</p>}
        <StageAction variant="secondary" className="w-full" disabled={!canSubmit} onClick={handleGesagt}>{t('games.category.saidVerbal')}</StageAction>
      </div>
      {words.length > 0 && <section className="border-t border-white/10 pt-5">
        <p className="mb-3 text-xs uppercase tracking-wide text-[var(--stage-muted)]">{t('games.category.wordsHeard', { count: words.length })}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-40 overflow-y-auto text-sm text-[#cdd1c2]">{words.map((word, index) => <span key={`${word.word}-${index}`}>{word.word === '__verbal__' ? players.find(player => player.id === word.playerId)?.name : word.word}</span>)}</div>
      </section>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round End Screen
// ---------------------------------------------------------------------------

function RoundEndScreen({
  result,
  players,
  round,
  maxRounds,
  onNext,
}: {
  result: RoundResult;
  players: CategoryPlayer[];
  round: number;
  maxRounds: number;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);
  const loser = players.find((p) => p.id === result.loserId);

  // Record drink when round ends with a loser in drinking mode
  useEffect(() => {
    if (isDrinkingMode && loser) {
      const d = drinkingMode.recordDrink();
      if (d) {
        setTimeout(() => {
          haptics.warning();
          setDisclaimer(d);
          setTimeout(() => setDisclaimer(null), 5000);
        }, 1000);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="space-y-7">
    <StageHeader title={result.category} eyebrow={t('games.category.roundOf', { round, maxRounds })} />
    {loser && <StagePanel tone="accent" className="!rounded-xl"><p className="text-sm font-semibold">{isDrinkingMode ? t('games.category.drink') : t('games.category.timeUp')}</p><p className="mt-3 text-3xl font-bold break-words">{loser.name}</p></StagePanel>}
    {disclaimer && <p role="status" className="rounded-xl border border-[#f2bc66]/30 p-4 text-sm leading-relaxed text-[#e6ce81]">{disclaimer.message} {t('games.category.drinkResponsibly', { count: drinkingMode.drinkCount })}</p>}
    <section><h2 className="mb-3 text-sm text-[var(--stage-muted)]">{t('games.category.wordsSaid', { count: result.words.length })}</h2><div className="flex flex-wrap gap-x-5 gap-y-3 border-y border-white/15 py-5 text-lg">{result.words.length ? result.words.map((word, index) => <span key={index}>{word.word === '__verbal__' ? players.find(player => player.id === word.playerId)?.name : word.word}</span>) : <p className="text-sm">{t('games.category.noWords')}</p>}</div></section>
    <section><h2 className="mb-3 text-sm text-[var(--stage-muted)]">{t('games.category.scoreboard')}</h2><ol className="divide-y divide-white/15">{[...players].sort((first, second) => second.score - first.score).map(player => <li key={player.id} className="flex items-center justify-between gap-4 py-4"><span className="text-lg break-words">{player.name}</span><strong className="shrink-0 text-xl text-[#f2bc66]">{t('games.category.scorePoints', { score: player.score })}</strong></li>)}</ol></section>
    <StageFooter><StageAction onClick={onNext}>{round < maxRounds ? t('games.category.nextRound') : t('games.category.results')}</StageAction></StageFooter>
  </div>;
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

function GameOverScreen({ players, onPlayAgain, onRestart }: { players: CategoryPlayer[]; onPlayAgain: () => void; onRestart: () => void }) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="space-y-7">
    <StageHeader title={t('games.category.finalResults')} eyebrow={t('games.category.scoreboard')} />
    <ol className="divide-y divide-white/15 border-y border-white/15">{sorted.map((player, index) => <li key={player.id} className="flex items-center gap-4 py-6">
      <span className="text-sm text-[var(--stage-muted)]">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xl font-semibold break-words">{player.name}</p><p className="mt-1 text-sm text-[var(--stage-muted)]">{t('games.category.roundsLost', { count: player.losses })}</p></div><strong className="text-4xl tabular-nums text-[#f2bc66]">{player.score}</strong>
    </li>)}</ol>
    <StageFooter className="flex-wrap"><StageAction onClick={onPlayAgain}><RotateCcw className="h-5 w-5" />{t('games.category.playAgain')}</StageAction><StageAction variant="secondary" onClick={onRestart}>{t('games.category.otherGame')}</StageAction></StageFooter>
  </div>;
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function CategoryGame({ online }: { online?: OnlineGameProps } = {}) {
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyPlayerNames = (useInitialRoster() ?? []).map((p) => p.name);
  const resolvedPlayerNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<CategoryPlayer[]>([]);
  const [mode, setMode] = useState<GameMode>("classic");
  const [maxRounds, setMaxRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [turnDeadline, setTurnDeadline] = useState(0);
  const pausedAt = useRef<number | null>(null);
  useEffect(() => {
    if (!online?.isHost) return;
    if (online.isConnected === false) pausedAt.current ??= Date.now();
    else if (pausedAt.current !== null) {
      const pausedFor = Date.now() - pausedAt.current;
      pausedAt.current = null;
      setTurnDeadline(deadline => deadline > 0 ? deadline + pausedFor : deadline);
    }
  }, [online?.isHost, online?.isConnected]);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [roundWords, setRoundWords] = useState<{ word: string; playerId: string }[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const saidWordsRef = useRef<Set<string>>(new Set());

  const [usedCategories, setUsedCategories] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentLetter, setCurrentLetter] = useState<string | undefined>();

  useTVGameBridge(
    'category',
    {
      phase, currentRound, currentPlayerIndex, currentCategory, players,
      currentLetter, roundWords, timerSeconds,
      // On roundEnd the timed-out player (last result's loser) is highlighted on TV.
      loserId: roundResults[roundResults.length - 1]?.loserId ?? null,
    },
    [phase, currentRound, currentPlayerIndex, currentLetter, roundWords.length, roundResults.length],
  );

  const pickCategory = useCallback(() => {
    const available = getCategories().filter((c) => !usedCategories.has(c));
    const pool = available.length > 0 ? available : getCategories();
    const cat = pool[Math.floor(Math.random() * pool.length)];
    setUsedCategories((prev) => new Set(prev).add(cat));
    setCurrentCategory(cat);
    if (mode === "letter") {
      const prompt = generateCategoryPrompt();
      setCurrentLetter(prompt.letter);
    } else {
      setCurrentLetter(undefined);
    }
  }, [usedCategories, mode]);

  const handleStart = useCallback(
    (p: CategoryPlayer[], m: GameMode, rounds: number, timer: number) => {
      setPlayers(online ? online.players.map((member, i) => ({ ...p[i % p.length], id: member.id, name: member.name })) : p);
      setMode(m);
      setMaxRounds(rounds);
      setTimerSeconds(timer);
      setCurrentRound(1);
      setCurrentPlayerIndex(0);
      setRoundWords([]);
      setRoundResults([]);
      saidWordsRef.current.clear();
      setUsedCategories(new Set());
      const available = getCategories();
      const cat = available[Math.floor(Math.random() * available.length)];
      setCurrentCategory(cat);
      setUsedCategories(new Set([cat]));
      if (m === "letter") {
        const prompt = generateCategoryPrompt();
        setCurrentLetter(prompt.letter);
      }
      setPhase("categoryReveal");
    },
    []
  );

  const handleRevealReady = useCallback(() => {
    setTurnDeadline(Date.now() + timerSeconds * 1000);
    setPhase("playing");
  }, [timerSeconds]);

  const handleWordSaid = useCallback(
    (word: string): "ok" | "duplicate" | "wrong_letter" => {
      if (word !== "__verbal__") {
        const normalized = word.toLowerCase().trim();
        if (saidWordsRef.current.has(normalized)) return "duplicate";
        if (mode === "letter" && currentLetter && !normalized.startsWith(currentLetter.toLowerCase())) {
          return "wrong_letter";
        }
        saidWordsRef.current.add(normalized);
      }
      const playerId = players[currentPlayerIndex].id;
      setTurnDeadline(Date.now() + timerSeconds * 1000);
      setRoundWords((prev) => [...prev, { word, playerId }]);
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, score: p.score + 1 } : p))
      );
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
      return "ok";
    },
    [currentPlayerIndex, players, mode, currentLetter, timerSeconds]
  );

  const handleTimerExpire = useCallback(() => {
    if (online && !online.isHost) return;
    const loserId = players[currentPlayerIndex]?.id ?? null;
    setPlayers((prev) =>
      prev.map((p) => (p.id === loserId ? { ...p, losses: p.losses + 1 } : p))
    );
    const result: RoundResult = {
      category: currentCategory,
      letter: currentLetter,
      words: roundWords,
      loserId,
    };
    setRoundResults((prev) => [...prev, result]);
    setPhase("roundEnd");
  }, [currentPlayerIndex, players, currentCategory, currentLetter, roundWords, online?.isHost]);

  const handleNextRound = useCallback(() => {
    if (currentRound >= maxRounds) {
      setPhase("gameOver");
      return;
    }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setCurrentPlayerIndex((nextRound - 1) % players.length);
    setRoundWords([]);
    saidWordsRef.current.clear();
    pickCategory();
    setPhase("categoryReveal");
  }, [currentRound, maxRounds, pickCategory, players.length]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('category', me?.score ?? 0, !online || me?.id === winner?.id);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setPlayers([]);
    setRoundResults([]);
    setUsedCategories(new Set());
  }, []);

  // Confirm before leaving mid-round (accidental back tap during active play).
  // Preserves the existing destination: the back button drops to the setup
  // screen (handleRestart), just gated behind a "Spiel verlassen?" dialog.
  const exitGuard = useConfirmExit(() => online ? navigate('/games') : handleRestart());

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über dem Pfeil im Spiel und läuft nicht über dessen onClick.
  // Ohne Eintrag im Back-Guard-Stapel navigiert er mitten in der Runde weg und
  // die Partie ist futsch. Delegiert bewusst an denselben `exitGuard` wie der
  // Pfeil, damit es genau EINEN Bestätigungsdialog gibt.
  useBackGuard(() => {
    if (phase === "setup" || phase === "gameOver") return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });

  // Rematch: restart gameplay directly (no setup screen), keeping the same
  // players AND their accumulated score/losses (carry over — do not zero).
  const handlePlayAgain = useCallback(() => {
    gameRecordedRef.current = false;
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setRoundWords([]);
    setRoundResults([]);
    saidWordsRef.current.clear();
    const available = getCategories();
    const cat = available[Math.floor(Math.random() * available.length)];
    setCurrentCategory(cat);
    setUsedCategories(new Set([cat]));
    if (mode === "letter") {
      const prompt = generateCategoryPrompt();
      setCurrentLetter(prompt.letter);
    } else {
      setCurrentLetter(undefined);
    }
    setPhase("categoryReveal");
  }, [mode]);

  const [validation, setValidation] = useState<{ playerId: string; result: 'ok' | 'duplicate' | 'wrong_letter'; sequence: number }>();
  const act = useOnlineActions(online, 'category', `${phase}:${currentRound}:${currentPlayerIndex}:${roundWords.length}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    ready: { allowed: phase === 'categoryReveal' ? 'host' : false, run: handleRevealReady },
    word: { allowed: phase === 'playing' ? players[currentPlayerIndex]?.id ?? false : false, run: (word: unknown) => { if (typeof word === 'string' && word.trim() && word.length <= 200) { const playerId = players[currentPlayerIndex].id; const result = handleWordSaid(word); setValidation(previous => ({ playerId, result, sequence: (previous?.sequence ?? 0) + 1 })); } } },
    next: { allowed: phase === 'roundEnd' ? 'host' : false, run: handleNextRound },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: handlePlayAgain },
    restart: { allowed: 'host', run: handleRestart },
  });
  const revealReady = useCallback(() => act('ready'), [act]);
  useOnlineSnapshot(online, 'category', { phase, players, mode, maxRounds, timerSeconds, turnDeadline, currentRound, currentPlayerIndex, roundWords, roundResults, currentCategory, currentLetter, validation }, s => {
    setValidation(s.validation);
    setTurnDeadline(s.turnDeadline);
    setPhase(s.phase); setPlayers(s.players); setMode(s.mode); setMaxRounds(s.maxRounds); setTimerSeconds(s.timerSeconds); setCurrentRound(s.currentRound); setCurrentPlayerIndex(s.currentPlayerIndex); setRoundWords(s.roundWords); setRoundResults(s.roundResults); setCurrentCategory(s.currentCategory); setCurrentLetter(s.currentLetter);
  });
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;


  const latestResult = roundResults[roundResults.length - 1];

  return (
    <GameStage gameId="category" className="category-stage">
      <div className="min-h-0">
        <div className="mx-auto w-full max-w-3xl py-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            {/* Im Setup ist der Pfeil ein reines „raus hier" — das macht in der
                App der FloatingBackButton, der genau darüber liegt. In allen
                anderen Phasen führt er NICHT hinaus, sondern zurück ins Setup
                (handleRestart), und bleibt deshalb stehen. Unsichtbar statt
                entfernt, damit der Titel rechts bleibt und nicht unter den
                schwebenden Pfeil rutscht. */}
            {(() => {
              const hidden = hasShellBackButton() && phase === "setup";
              return (
                <button
                  onClick={() =>
                    phase === "setup"
                      ? navigate("/games")
                      : phase === "gameOver"
                        ? online ? navigate('/games') : handleRestart()
                        : exitGuard.request()
                  }
                  className={`flex items-center gap-2 text-white/65 hover:text-white/60 transition-colors${hidden ? ' invisible pointer-events-none' : ''}`}
                  aria-hidden={hidden}
                  tabIndex={hidden ? -1 : undefined}
                  aria-label={phase === "setup" ? t('common.back') : t('games.category.quit')}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {phase === "setup" ? t('common.back') : t('games.category.quit')}
                  </span>
                </button>
              );
            })()}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[0.5rem] bg-[#1b2028] border border-[#f2bc66]/20 flex items-center justify-center">
                <Timer className="h-4 w-4 text-[#f2bc66]" />
              </div>
              <span className="text-lg font-extrabold font-sans text-[#f2bc66]">
                {t('games.category.title')}
              </span>
            </div>
          </div>

          {/* Phase Content */}
          <AnimatePresence mode="wait">
            {phase === "setup" && <SetupScreen locked={!!online} key="setup" onStart={(...args) => act('start', ...args)} onlinePlayerNames={resolvedPlayerNames} />}
            {phase === "categoryReveal" && (
              <CategoryRevealScreen
                key={`reveal-${currentRound}`}
                category={currentCategory}
                letter={currentLetter}
                mode={mode}
                onReady={revealReady}
                connected={online?.isConnected !== false}
              />
            )}
            {phase === "playing" && (
              <>
              <PlayingScreen
                key={`playing-${currentRound}`}
                category={currentCategory}
                letter={currentLetter}
                mode={mode}
                players={players}
                currentPlayerIndex={currentPlayerIndex}
                timerSeconds={timerSeconds}
                words={roundWords}
                validation={!online || validation?.playerId === online.myPlayerId ? validation : undefined}
                canSubmit={!online || act.can('word')}
                onWordSaid={(word) => { if (!online) return handleWordSaid(word); act('word', word); return 'pending'; }}
                deadline={online ? turnDeadline : undefined}
                connected={online?.isConnected !== false}
                onTimerExpire={handleTimerExpire}
              />
              </>
            )}
            {phase === "roundEnd" && latestResult && (
              <RoundEndScreen
                key={`roundEnd-${currentRound}`}
                result={latestResult}
                players={players}
                round={currentRound}
                maxRounds={maxRounds}
                onNext={() => act('next')}
              />
            )}
            {phase === "gameOver" && (
              <div key="gameOver">
                <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
                <GameOverScreen players={players} onPlayAgain={() => act('again')} onRestart={() => act('restart')} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#f2bc66" />
    </GameStage>
  );
}
