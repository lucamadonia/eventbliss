import { generateWord, getWordPack, forbiddenWords, wordLanguage, translateReactionWord, type WordLanguage } from './word-content';
import '../headup/classic-stage.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { REACTION_TRANSPORT_GRACE_MS, validReaction } from './reaction-window';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Type, ChevronRight, RotateCcw, Trophy, Zap,
  Palette, Ban, Gauge, Crown, Target, Flame,
} from 'lucide-react';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import { PlayerSetup } from '../ui/PlayerSetup';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { WORDPRESS_MODE_ASSETS } from '../ui/premium-game-assets';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
type GameMode = 'kategorie' | 'stroop' | 'verboten' | 'speed-rush';
type Speed = 'slow' | 'medium' | 'fast';

interface PlayerState {
  name: string;
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  wrong: number;
  missed: number;
}

interface WordItem {
  text: string;
  isTarget: boolean;
  displayColor?: string; // for Stroop mode
}

// ---------------------------------------------------------------------------
// Word Lists
// ---------------------------------------------------------------------------

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

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SPEED_MS: Record<Speed, number> = { slow: 1500, medium: 1000, fast: 600 };

// ---------------------------------------------------------------------------
// Particle Background
// ---------------------------------------------------------------------------

function ParticleBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#d5f46a]/15"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

interface SetupProps {
  onStart: (players: PlayerState[], mode: GameMode, speed: Speed, rounds: number) => void;
  onlinePlayerNames?: string[];
  locked?: boolean;
}

function SetupScreen({ onStart, onlinePlayerNames = [], locked = false }: SetupProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<string[]>(
    onlinePlayerNames.length >= 2 ? onlinePlayerNames : [t('games.wordpress.defaultPlayer1'), t('games.wordpress.defaultPlayer2')]
  );
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [rounds, setRounds] = useState(5);

  const modes: { key: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'kategorie', label: t('gameModes.wordpress.kategorie.name'), desc: t('gameModes.wordpress.kategorie.desc'), icon: <Target className="w-5 h-5" /> },
    { key: 'stroop', label: t('gameModes.wordpress.stroop.name'), desc: t('gameModes.wordpress.stroop.desc'), icon: <Palette className="w-5 h-5" /> },
    { key: 'verboten', label: t('gameModes.wordpress.verboten.name'), desc: t('gameModes.wordpress.verboten.desc'), icon: <Ban className="w-5 h-5" /> },
    { key: 'speed-rush', label: t('gameModes.wordpress.speed-rush.name'), desc: t('gameModes.wordpress.speed-rush.desc'), icon: <Gauge className="w-5 h-5" /> },
  ];

  const canStart = players.length >= 1 && players.every(p => p.trim().length > 0);

  const isOnlineOrParty = onlinePlayerNames.length >= 2;
  const handleImportNames = (imported: string[]) => {
    setPlayers(() => {
      const merged = imported.slice(0, 8);
      while (merged.length < 1) merged.push('');
      return merged;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    const ps: PlayerState[] = players.map(name => ({
      name: name.trim(), score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, missed: 0,
    }));
    onStart(ps, mode, speed, rounds);
  };

  return (
    <motion.div className="min-h-0 bg-transparent p-0 flex flex-col items-center relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <motion.div className="w-full max-w-3xl space-y-7 py-3 relative z-10"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>

        {/* Header */}
        <StageHeader title={t('games.wordpress.title')} subtitle={t('games.wordpress.tagline')} />

        {/* Players */}
        <PlayerSetup locked={locked}
          players={players.map((name, i) => ({ id: String(i), name }))}
          onAdd={() => setPlayers([...players, ''])}
          onRemove={(id) => setPlayers(players.filter((_, idx) => idx !== Number(id)))}
          onRename={(id, name) => { const next = [...players]; next[Number(id)] = name; setPlayers(next); }}
          onImportNames={isOnlineOrParty ? undefined : handleImportNames}
          min={1}
          max={8}
          accent="#d5f46a"
          label={t('games.wordpress.playerLabel')}
        />

        {/* Mode */}
        <div className=" bg-white/5 border border-[#d5f46a]/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.modeHeading')}</h2>
          <div className="!grid grid-cols-2 gap-3">
            {modes.map(m => (
              <PremiumImageChoiceCard
                key={m.key}
                title={m.label}
                subtitle={m.desc}
                image={WORDPRESS_MODE_ASSETS[m.key]}
                selected={mode === m.key}
                onClick={() => setMode(m.key)}
                accent="#d5f46a"
              />
            ))}
          </div>
        </div>

        {/* Speed & Rounds */}
        <div className=" bg-white/5 border border-[#d5f46a]/20 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.settingsHeading')}</h2>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-2">{t('games.wordpress.speedLabel')}</label>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast'] as Speed[]).map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    speed === s
                      ? 'bg-[#d5f46a] text-white'
                      : 'bg-white/10 text-[#a8abb3] hover:bg-white/15'
                  }`}>
                  {s === 'slow' ? t('games.wordpress.speedSlow') : s === 'medium' ? t('games.wordpress.speedMedium') : t('games.wordpress.speedFast')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-1">{t('games.wordpress.roundsLabel', { count: rounds })}</label>
            <input type="range" min={3} max={15} step={1} value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-[#20262f] accent-[#d5f46a] cursor-pointer" />
          </div>
        </div>

        {/* Start */}
        <motion.button onClick={handleStart} disabled={!canStart}
          aria-label={t('games.wordpress.startAriaLabel')}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canStart
              ? 'bg-[#d5f46a] text-white  '
              : 'bg-[#1b2028] text-[#b5bdbe] cursor-not-allowed'
          }`}
          whileHover={canStart ? { scale: 1.02 } : {}}
          whileTap={canStart ? { scale: 0.98 } : {}}>
          <Zap className="w-5 h-5" /> {t('games.setup.startGame')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Playing Screen
// ---------------------------------------------------------------------------

interface PlayingProps {
  online?: OnlineGameProps;
  players: PlayerState[];
  mode: GameMode;
  speed: Speed;
  round: number;
  totalRounds: number;
  currentPlayerIndex: number;
  forbiddenWord: string;
  contentLanguage: WordLanguage;
  onPlayerDone: (updatedPlayer: PlayerState) => void;
  /** Live snapshot hoisted to the controller for the TV broadcast. */
  onLive?: (live: { word: string; displayColor?: string; wordIndex: number; combo: number; score: number }) => void;
}

const WORDS_PER_TURN = 12;


function PlayingScreen({ players, mode, speed, round, totalRounds, currentPlayerIndex, forbiddenWord, contentLanguage, onPlayerDone, onLive, online }: PlayingProps) {
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
  const { t, i18n } = useTranslation();
  const words = getWordPack(contentLanguage);
  const displayWords = getWordPack(i18n.language);
  const displayForbidden = translateReactionWord(forbiddenWord, contentLanguage, i18n.language);
  const player = players[currentPlayerIndex];
  const [wordIndex, setWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [score, setScore] = useState(player.score);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(player.maxCombo);
  const [correct, setCorrect] = useState(player.correct);
  const [wrong, setWrong] = useState(player.wrong);
  const [missed, setMissed] = useState(player.missed);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'missed' | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flyAway, setFlyAway] = useState(false);
  const [wordPos, setWordPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tappedRef = useRef(false);
  const [turnStarted, setTurnStarted] = useState(false);
  const speedMs = useRef(SPEED_MS[speed]);
  const [presentedIndex, setPresentedIndex] = useState(0);
  const visibleDuration = mode === 'speed-rush' ? Math.max(300, speedMs.current - wordIndex * 25) : speedMs.current;
  const activeId = online?.players[currentPlayerIndex]?.id;
  const isActiveDevice = !online || activeId === online.myPlayerId;
  const remoteActor = online && activeId !== (online.hostPlayerId ?? online.players.find(p => p.isHost)?.id);
  const reactionStarted = useRef(0);
  const reactionPause = useRef<number | null>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (online?.isConnected === false) reactionPause.current = performance.now();
    else if (reactionPause.current !== null) { reactionStarted.current += performance.now() - reactionPause.current; reactionPause.current = null; }
  }, [online?.isConnected]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'kategorie': return t('games.wordpress.promptKategorie');
      case 'stroop': return t('games.wordpress.promptStroop');
      case 'verboten': return t('games.wordpress.promptVerboten', { word: displayForbidden });
      case 'speed-rush': return t('games.wordpress.promptSpeedRush');
    }
  }, [mode, t, displayForbidden]);
  const ruleExample = mode === 'stroop' ? t('games.wordpress.exampleStroop', { red: displayWords.colors[0], blue: displayWords.colors[1] })
    : mode === 'verboten' ? t('games.wordpress.exampleForbidden', { word: displayForbidden })
    : t('games.wordpress.exampleCategory', { animal: displayWords.animals[0], object: displayWords.objects[0] });

  const showNextWord = useCallback(() => {
    setWordIndex(prev => {
      const next = prev + 1;
      return next;
    });
  }, []);

  // Generate word when index changes
  useEffect(() => {
    if ((online && !online.isHost) || wordIndex === 0 || wordIndex > WORDS_PER_TURN) return;

    const word = generateWord(mode, forbiddenWord, words);
    setCurrentWord(word);
    setPresentedIndex(wordIndex);
    tappedRef.current = false;
    setFlyAway(false);
    setFeedback(null);

    // Random position offset
    const xOff = (Math.random() - 0.5) * 32;
    const yOff = (Math.random() - 0.5) * 60;
    setWordPos({ x: xOff, y: yOff });

    // Speed Rush: decrease time each word
    const currentSpeed = mode === 'speed-rush'
      ? Math.max(300, speedMs.current - wordIndex * 25)
      : speedMs.current;

    const expireWord = () => {
      if (!tappedRef.current) {
        tappedRef.current = true;
        // Time expired without tap
        if (word.isTarget) {
          // Missed a target
          setMissed(p => p + 1);
          setScore(p => p - 3);
          setCombo(0);
          setFeedback('missed');
        }
        feedbackTimeoutRef.current = setTimeout(() => showNextWord(), 300);
      }
    };
    timeoutRef.current = setTimeout(expireWord, currentSpeed + (remoteActor ? REACTION_TRANSPORT_GRACE_MS : 0));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [wordIndex, mode, showNextWord, forbiddenWord, words]);

  // Hoist a live snapshot to the controller so the TV view can show the current
  // word, actual display color and live score/progress. The matching rule is
  // public; whether this particular word matches is evaluated only by the host.
  useEffect(() => {
    onLive?.({
      word: wordIndex <= WORDS_PER_TURN ? (currentWord?.text ?? '') : '',
      displayColor: currentWord?.displayColor,
      wordIndex: Math.min(wordIndex, WORDS_PER_TURN),
      combo,
      score,
    });
  }, [currentWord, wordIndex, combo, score, onLive]);

  // Start first word
  useEffect(() => {
    if (!turnStarted || (online && !online.isHost)) return;
    const t = setTimeout(() => setWordIndex(1), 800);
    return () => clearTimeout(t);
  }, [turnStarted]);

  // End turn when all words done
  useEffect(() => {
    if ((!online || online.isHost) && wordIndex > WORDS_PER_TURN) {
      const t = setTimeout(() => {
        onPlayerDone({
          ...player,
          score,
          combo: 0,
          maxCombo: Math.max(maxCombo, combo),
          correct,
          wrong,
          missed,
        });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [wordIndex, score, combo, maxCombo, correct, wrong, missed, player, onPlayerDone]);

  const handleTap = useCallback(() => {
    if (tappedRef.current || !currentWord || wordIndex > WORDS_PER_TURN) return;
    tappedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (currentWord.isTarget) {
      // Correct tap
      const newCombo = combo + 1;
      const bonus = Math.min(newCombo, 5);
      setScore(p => p + 10 + bonus);
      setCombo(newCombo);
      setMaxCombo(p => Math.max(p, newCombo));
      setCorrect(p => p + 1);
      setFeedback('correct');
      setFlyAway(true);
    } else {
      // Wrong tap
      setScore(p => p - 5);
      setCombo(0);
      setWrong(p => p + 1);
      setFeedback('wrong');
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    }

    feedbackTimeoutRef.current = setTimeout(() => showNextWord(), 350);
  }, [currentWord, combo, wordIndex, showNextWord]);

  const tap = useOnlineActions(online, 'wordpress-word', `${round}:${currentPlayerIndex}:${wordIndex}`, {
    ready: { allowed: !turnStarted && wordIndex === 0 ? activeId ?? false : false, run: () => setTurnStarted(true) },
    tap: { allowed: wordIndex > 0 && wordIndex <= WORDS_PER_TURN ? activeId ?? false : false, run: (elapsed: unknown) => { if (!online || validReaction(elapsed, visibleDuration)) handleTap(); } },
    expire: { allowed: wordIndex > 0 && wordIndex <= WORDS_PER_TURN ? activeId ?? false : false, run: () => {
      if (tappedRef.current || !currentWord) return;
      tappedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentWord.isTarget) { setMissed(p => p + 1); setScore(p => p - 3); setCombo(0); setFeedback('missed'); }
      feedbackTimeoutRef.current = setTimeout(showNextWord, 300);
    } },
  });
  useOnlineSnapshot(online, 'wordpress-word', { round, currentPlayerIndex, turnStarted, wordIndex, presentedIndex, currentWord: currentWord ? { ...currentWord, isTarget: false } : null, score, combo, maxCombo, correct, wrong, missed, feedback, shakeScreen, flyAway, wordPos, forbidden: forbiddenWord }, state => {
    if (state.round !== round || state.currentPlayerIndex !== currentPlayerIndex) return;
    setTurnStarted(state.turnStarted); setWordIndex(state.wordIndex); setCurrentWord(state.currentWord); setScore(state.score); setCombo(state.combo); setMaxCombo(state.maxCombo); setCorrect(state.correct); setWrong(state.wrong); setMissed(state.missed); setFeedback(state.feedback); setShakeScreen(state.shakeScreen); setFlyAway(state.flyAway); setWordPos(state.wordPos);
    setPresentedIndex(state.presentedIndex);
  });
  useEffect(() => {
    if (!isActiveDevice || presentedIndex !== wordIndex || wordIndex < 1 || wordIndex > WORDS_PER_TURN) return;
    reactionStarted.current = performance.now(); submitted.current = false;
    if (!online || online.isHost) return;
    const pending = setTimeout(() => { if (!submitted.current) { submitted.current = true; tap('expire'); } }, visibleDuration);
    return () => clearTimeout(pending);
  }, [presentedIndex, wordIndex, isActiveDevice]);
  const submitTap = () => {
    if (!isActiveDevice || submitted.current || presentedIndex !== wordIndex || online?.isConnected === false) return;
    const elapsed = performance.now() - reactionStarted.current;
    if (!validReaction(elapsed, visibleDuration)) return;
    submitted.current = true; tap('tap', elapsed);
  };

  const progress = wordIndex / WORDS_PER_TURN;

  return (
    <GameStage gameId="wordpress" className="reaction-display flex min-h-[100dvh] flex-col">
      <StageHeader title={player.name} eyebrow={t('games.play.round') + ' ' + round + '/' + totalRounds}
        trailing={<span dir="ltr" className="font-semibold tabular-nums">{Math.min(wordIndex, WORDS_PER_TURN)} / {WORDS_PER_TURN}</span>}
        progress={{ value: Math.min(wordIndex, WORDS_PER_TURN), total: WORDS_PER_TURN }} />
      <StagePanel tone="accent" className="reaction-rule !p-5" aria-labelledby="reaction-rule-title">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{t('games.wordpress.yourTask')}</p>
        <h2 id="reaction-rule-title" className="mt-2 text-2xl font-extrabold leading-tight">{modeLabel}</h2>
        <p className="mt-3 text-sm leading-relaxed">{ruleExample}</p>
      </StagePanel>
      {!turnStarted ? <div className="flex flex-1 flex-col justify-center gap-5 py-8">
        <p className="text-base leading-relaxed text-[var(--stage-muted)]">{t('games.wordpress.waitForMatch')}</p>
        {isActiveDevice ? <StageAction onClick={() => tap('ready')}>{t('games.wordpress.readyStart')}<ChevronRight className="h-5 w-5" /></StageAction>
          : <p className="text-center text-[var(--stage-muted)]">{t('games.wordpress.waitForPlayer', { name: player.name })}</p>}
      </div> : <button type="button" disabled={!isActiveDevice || !currentWord || !!feedback} aria-label={t('games.wordpress.tapWord')} aria-describedby="reaction-rule-title" onClick={submitTap}
        style={mode === 'stroop' ? { background: '#eee9da', borderColor: '#c8c1b0' } : undefined}
        className="relative my-5 flex min-h-[30dvh] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#d5f46a]/30 bg-[#151e16] px-7 py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d5f46a] disabled:cursor-default">
        {currentWord && wordIndex <= WORDS_PER_TURN && <span dir="auto" key={`${wordIndex}-${currentWord.text}`} className="relative z-10 block max-w-full break-words text-[clamp(2.75rem,10vw,7rem)] font-black leading-none tracking-tight" style={{ color: currentWord.displayColor || '#d5f46a', WebkitTextStroke: mode === 'stroop' ? '1px rgba(0,0,0,.25)' : undefined }}>{translateReactionWord(currentWord.text, contentLanguage, i18n.language)}</span>}
        {wordIndex > WORDS_PER_TURN && <span className="text-3xl font-bold text-[#d5f46a]">{t('games.wordpress.done')}</span>}
        {feedback && <span aria-hidden="true" className="pointer-events-none absolute inset-0 border-4 rounded-2xl" style={{ borderColor: feedback === 'correct' ? '#d5f46a' : feedback === 'wrong' ? '#ff8572' : '#e6ce81' }} />}
      </button>}
      <StageFooter className="!grid grid-cols-3 gap-3 text-center">
        <div><p className="text-xs text-[var(--stage-muted)]">{t('games.play.score')}</p><p className="mt-1 text-3xl font-bold tabular-nums">{score}</p></div>
        <div><p className="text-xs text-[var(--stage-muted)]">{t('games.wordpress.comboLabel')}</p><p dir="ltr" className="mt-1 text-3xl font-bold tabular-nums text-[#d5f46a]">{combo}×</p></div>
        <div><p className="text-xs text-[var(--stage-muted)]">{t('games.wordpress.wordLabel')}</p><p className="mt-1 text-3xl font-bold tabular-nums">{Math.min(wordIndex, WORDS_PER_TURN)}</p></div>
      </StageFooter>
    </GameStage>
  );
}

// ---------------------------------------------------------------------------
// Round End Screen
// ---------------------------------------------------------------------------

interface RoundEndProps {
  players: PlayerState[];
  round: number;
  totalRounds: number;
  onNextRound: () => void;
}

function RoundEndScreen({ players, round, totalRounds, onNextRound }: RoundEndProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="mx-auto w-full max-w-3xl space-y-7">
    <StageHeader title={t('games.wordpress.roundHeading', { round, total: totalRounds })} subtitle={t('games.wordpress.interimStandings')} />
    <ReactionStandings players={sorted} />
    <StageFooter><StageAction onClick={onNextRound}>{round < totalRounds ? t('games.wordpress.nextRound') : t('games.wordpress.showResults')}<ChevronRight className="h-5 w-5" /></StageAction></StageFooter>
  </div>;
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

interface GameOverProps {
  players: PlayerState[];
  onRestart: () => void;
}

function GameOverScreen({ players, onRestart }: GameOverProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="mx-auto w-full max-w-3xl space-y-7">
    <StageHeader title={t('games.wordpress.gameOver')} eyebrow={t('games.results.leaderboard')} />
    <ReactionStandings players={sorted} />
    <StageFooter><StageAction onClick={onRestart}><RotateCcw className="h-5 w-5" />{t('games.results.playAgain')}</StageAction></StageFooter>
  </div>;
}

function ReactionStandings({ players }: { players: PlayerState[] }) {
  const { t } = useTranslation();
  const best = Math.max(...players.map(player => player.score));
  return <ol className="divide-y divide-white/15 border-y border-white/15">{players.map((player, index) => {
    const attempts = player.correct + player.wrong + player.missed;
    const accuracy = attempts ? Math.round(player.correct / attempts * 100) : 0;
    return <li key={`${player.name}-${index}`} className="flex items-start gap-4 py-6">
      <span className="pt-1 text-sm tabular-nums text-[var(--stage-muted)]">{String(index + 1).padStart(2, '0')}</span>
      <div className="flex-1 min-w-0"><p className="text-xl font-semibold break-words">{player.name}</p><p className="mt-2 text-sm leading-relaxed text-[var(--stage-muted)]">{t('games.wordpress.accuracyCombo', { accuracy, maxCombo: player.maxCombo })}</p></div>
      <strong className={player.score === best ? 'text-4xl text-[#d5f46a] tabular-nums' : 'text-4xl tabular-nums'}>{player.score}</strong>
    </li>;
  })}</ol>;
}

// ---------------------------------------------------------------------------
// Main Game Controller
// ---------------------------------------------------------------------------

export default function WordPressGame({ online }: { online?: OnlineGameProps } = {}) {
  const { i18n } = useTranslation();
  const [contentLanguage, setContentLanguage] = useState(() => wordLanguage(i18n.language));
  const matchWords = getWordPack(contentLanguage);
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
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
  const [phase, setPhase] = useState<GamePhase>('setup');

  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));

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
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [forbiddenWord, setForbiddenWord] = useState(() => randomFrom(forbiddenWords(matchWords)));
  const [turnQueue, setTurnQueue] = useState<number[]>([]);
  // Live-Snapshot aus PlayingScreen hochgereicht (currentWord/combo/score leben
  // dort als State — ein direkter Verweis hier warf "Can't find variable" und
  // crashte das Spiel). Dient nur der TV-Ansicht.
  const [live, setLive] = useState<{ word: string; displayColor?: string; wordIndex: number; combo: number; score: number }>({ word: '', wordIndex: 0, combo: 0, score: 0 });
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  useTVGameBridge('wordpress', {
    phase, round, currentPlayerIndex, players, totalRounds,
    partyScoresById: online ? Object.fromEntries(online.players.map((p, i) => [p.id, players[i]?.score ?? 0])) : undefined,
    mode,
    currentWord: live.word,
    displayColor: live.displayColor,
    forbiddenWord, contentLanguage,
    wordIndex: live.wordIndex,
    wordsPerTurn: WORDS_PER_TURN,
    liveCombo: live.combo,
    liveScore: live.score,
  }, [phase, round, currentPlayerIndex, mode, forbiddenWord, contentLanguage, live], !online || online.isHost);

  const handleStart = useCallback((ps: PlayerState[], m: GameMode, s: Speed, r: number) => {
    const roster = online ? online.players.map((member, i) => ({ ...ps[i % ps.length], name: member.name })) : ps;
    const language = wordLanguage(i18n.language);
    setContentLanguage(language);
    setPlayers(roster);
    setMode(m);
    setSpeed(s);
    setTotalRounds(r);
    setRound(1);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(getWordPack(language))));
    // Build queue: all players take a turn in round 1
    setTurnQueue(roster.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [online, i18n.language]);

  const handlePlayerDone = useCallback((updatedPlayer: PlayerState) => {
    setPlayers(prev => prev.map((p, i) => i === currentPlayerIndex ? updatedPlayer : p));

    if (turnQueue.length > 0) {
      // More players in this round
      const [next, ...rest] = turnQueue;
      setCurrentPlayerIndex(next);
      setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
      setTurnQueue(rest);
      // Re-enter playing phase to reset PlayingScreen
      setPhase('roundEnd');
      setTimeout(() => setPhase('playing'), 50);
    } else {
      // Round complete
      setPhase('roundEnd');
    }
  }, [currentPlayerIndex, turnQueue, matchWords]);

  const handleNextRound = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound > totalRounds) {
      setPhase('gameOver');
      return;
    }
    setRound(nextRound);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [round, totalRounds, players, matchWords]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players[online.players.findIndex(p => p.id === online.myPlayerId)] : winner;
      recordEnd('drueck-das-wort', me?.score ?? 0, !!me && me.score === winner?.score);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(1);
    setCurrentPlayerIndex(0);
    setTurnQueue([]);
  }, []);

  // Preserve players and settings; start a new match with fresh reaction statistics.
  const rematch = useCallback(() => {
    if (players.length === 0) { handleRestart(); return; }
    gameRecordedRef.current = false;
    setPlayers(prev => prev.map(player => ({ ...player, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, missed: 0 })));
    setRound(1);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [players, handleRestart, matchWords]);

  const act = useOnlineActions(online, 'wordpress', `${phase}:${round}:${currentPlayerIndex}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    next: { allowed: phase === 'roundEnd' && turnQueue.length === 0 ? 'host' : false, run: handleNextRound },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: rematch },
  });
  useOnlineSnapshot(online, 'wordpress', { phase, players, mode, speed, round, totalRounds, currentPlayerIndex, turnQueue, forbiddenWord, contentLanguage }, state => {
    setPhase(state.phase); setPlayers(state.players); setMode(state.mode); setSpeed(state.speed); setRound(state.round); setTotalRounds(state.totalRounds); setCurrentPlayerIndex(state.currentPlayerIndex); setTurnQueue(state.turnQueue);
    setForbiddenWord(state.forbiddenWord);
    setContentLanguage(wordLanguage(state.contentLanguage));
  });
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;


  return (
    // Fragment, damit der Verlassen-Dialog NEBEN der AnimatePresence liegt und
    // deren mode="wait"-Phasenwechsel nicht als zweites Kind stört.
    <GameStage gameId="wordpress" className={phase === 'playing' ? 'wordpress-controller !p-0' : 'wordpress-controller'}>
    <AnimatePresence mode="wait">
      {phase === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0 }}>
          <SetupScreen locked={!!online} onStart={(...args) => act('start', ...args)} onlinePlayerNames={resolvedPlayerNames} />
        </motion.div>
      )}
      {phase === 'playing' && (
        <motion.div key={`playing-${round}-${currentPlayerIndex}`} exit={{ opacity: 0 }}>
          <PlayingScreen
            online={online}
            players={players}
            mode={mode}
            speed={speed}
            round={round}
            totalRounds={totalRounds}
            currentPlayerIndex={currentPlayerIndex}
            forbiddenWord={forbiddenWord}
            contentLanguage={contentLanguage}
            onPlayerDone={handlePlayerDone}
            onLive={setLive}
          />
        </motion.div>
      )}
      {phase === 'roundEnd' && (
        <motion.div key={`roundEnd-${round}`} exit={{ opacity: 0 }}>
          <RoundEndScreen
            players={players}
            round={round}
            totalRounds={totalRounds}
            onNextRound={() => act('next')}
          />
        </motion.div>
      )}
      {phase === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <GameOverScreen players={players} onRestart={() => act('again')} />
        </motion.div>
      )}
    </AnimatePresence>
    <ConfirmExitDialog {...exitGuard.dialogProps} accent="#d5f46a" />
    </GameStage>
  );
}
