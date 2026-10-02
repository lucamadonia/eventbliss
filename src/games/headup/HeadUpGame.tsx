import '../headup/classic-stage.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useOnlineActions, useOnlineSnapshot, useOnlinePrivateSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { gravityPitch, HeadUpTiltTracker } from './tilt-tracker';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCcw, ChevronRight, Trophy, Check, X, Play, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { getHeadUpCategories, type HeadUpCategory } from '../content/headup-words';
import { useGameTimer } from '../engine/TimerSystem';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import { PlayerSetup } from '../ui/PlayerSetup';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { HEADUP_THEME_ASSETS } from '../ui/premium-game-assets';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { removeFromHeadUp } from './roster-change';

// ── Types ──────────────────────────────────────────────────────────────────────

type GameScreen = 'setup' | 'ready' | 'playing' | 'roundResult' | 'gameOver';
interface WordResult { word: string; correct: boolean }
interface RoundScore { playerName: string; correct: number; skipped: number; words: WordResult[] }

// ── Neon Pulse Styles ──────────────────────────────────────────────────────────


// Nur für die einmalige Geräte-Feinjustage der Kipp-Schwellen. Danach auf false.
const TILT_DEBUG = false;

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

function triggerHaptic(style: 'light' | 'medium' | 'heavy') {
  if (Capacitor.isNativePlatform()) { Haptics.impact({ style: style as never }).catch(() => {}); }
  else if ('vibrate' in navigator) { navigator.vibrate(style === 'light' ? 50 : style === 'medium' ? 100 : 200); }
}

// ── Timer Circle SVG ───────────────────────────────────────────────────────────

function TimerCircle({ timeLeft, percent, warn }: { timeLeft: number; percent: number; warn: boolean }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className="headup-clock relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1b2028" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={warn ? '#ff6e84' : '#df8eff'} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-mono text-sm font-bold ${warn ? 'text-[#ff6e84]' : 'text-[#df8eff]'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HeadUpGame({ online }: { online?: OnlineGameProps }) {
  const { t } = useTranslation();
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const initialPlayers = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [t('games.headup.playerFallback', { n: 1 }), t('games.headup.playerFallback', { n: 2 })];
  const [screen, setScreen] = useState<GameScreen>('setup');
  const [selectedCategory, setSelectedCategory] = useState<HeadUpCategory | null>(null);
  const [timerDuration, setTimerDuration] = useState(60);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers);
  const isOnlineOrParty = onlinePlayerNames.length >= 2 || partyPlayerNames.length >= 2;
  const handleImportNames = (names: string[]) => {
    const roster = [...names];
    while (roster.length < 2) roster.push('');
    setPlayerNames(roster.slice(0, 12));
  };
  const totalRounds = playerNames.length;
  const [currentRound, setCurrentRound] = useState(1);
  // Online: Runde N gehoert order[N - 1] (beim Start eingefroren), nicht dem
  // N-ten Eintrag der live schrumpfenden Raumliste (siehe roster-change.ts).
  const [order, setOrder] = useState<string[]>([]);
  const actorId = online ? order[currentRound - 1] ?? online.players[currentRound - 1]?.id ?? false : false;
  const [wordQueue, setWordQueue] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [roundWords, setRoundWords] = useState<WordResult[]>([]);
  const [allRounds, setAllRounds] = useState<RoundScore[]>([]);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const cooldownRef = useRef(false);
  const orientationActiveRef = useRef(false);
  const armedRef = useRef(false); // Neutral-Zone-Re-Arm: eine Neigung = eine Antwort
  const [isArmed, setIsArmed] = useState(false); // sichtbarer „Bereit"-Status
  const tiltTracker = useRef(new HeadUpTiltTracker());
  // Kalibrierte Neutral-Halteposition (Nick-Winkel). Auf der Stirn hält niemand
  // exakt 0° — die Erkennung misst die Neigung RELATIV zu dieser Baseline, sonst
  // wird eine Richtung (z.B. Skip) unerreichbar, wenn neutral schon leicht gekippt.
  const baselineRef = useRef<number | null>(null);
  const smoothRef = useRef<number | null>(null); // EMA-Glättung gegen Ruckel
  // Live-Debug (nur für die Geräte-Feinjustage; TILT_DEBUG danach auf false).
  const [tiltDebug, setTiltDebug] = useState<{ pitch: number; delta: number; armed: boolean } | null>(null);
  const debugTickRef = useRef(0);

  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false && (!!online || !exitGuard.open));

  // Der Kipp-Sensor hört auf `devicemotion` und weiß nichts vom Dialog. Bliebe
  // er scharf, würde eine Neigung HINTER der offenen Abfrage weiter Wörter
  // abhaken. Also still legen, solange gefragt wird, und beim Weiterspielen
  // exakt so neu kalibrieren wie beim Rundenstart (Baseline verwerfen, 150ms
  // Lock, damit die erste Neigung nicht verschluckt wird).
  const suspendTilt = useCallback(() => {
    tiltTracker.current.reset();
    orientationActiveRef.current = false;
    armedRef.current = false;
    setIsArmed(false);
  }, []);
  const resumeTilt = useCallback(() => {
    if ((screen !== 'playing' && screen !== 'ready') || (online && actorId !== online.myPlayerId)) return;
    orientationActiveRef.current = false;
    armedRef.current = false;
    setIsArmed(false);
    baselineRef.current = null;
    smoothRef.current = null;
    tiltTracker.current.reset();
    setTimeout(() => { orientationActiveRef.current = true; }, 150);
  }, [screen, online, actorId, setTimeout]);

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (screen === 'setup' || screen === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); resumeTilt(); return true; }
    suspendTilt();
    exitGuard.request();
    return true;
  });

  const handleTimerExpire = useCallback(() => {
    if (online && !online.isHost) return;
    orientationActiveRef.current = false;
    armedRef.current = false;
    setIsArmed(false);
    triggerHaptic('heavy');
    setScreen('roundResult');
  }, [online?.isHost]);

  const [remoteTime, setRemoteTime] = useState(60);
  const actionRef = useRef<(name: string, ...args: unknown[]) => void>(() => {});
  const { timeLeft: hostTime, start: startTimer, reset: resetTimer } =
    useGameTimer(timerDuration, handleTimerExpire, online?.isConnected !== false && (!!online || !exitGuard.open));
  const timeLeft = online && !online.isHost ? remoteTime : hostTime;
  const percentLeft = timerDuration > 0 ? timeLeft / timerDuration * 100 : 0;

  useTVGameBridge('headup', { phase: screen, currentRound, totalRounds, currentWord: online ? '' : wordQueue[currentWordIndex], players: playerNames,
    partyScoresById: Object.fromEntries((online ? order : partyRoster.map(p => p.id)).map((id, index) => [id, allRounds[index]?.correct ?? 0])),
    correctCount: roundWords.filter(w => w.correct).length, skippedCount: roundWords.filter(w => !w.correct).length, timeLeft, category: selectedCategory?.name || '' }, [screen, currentRound, currentWordIndex, timeLeft, allRounds], !online || online.isHost);

  const handleStartRound = useCallback(() => {
    if (!selectedCategory) return;
    cooldownRef.current = false;
    setFlash(null);
    setWordQueue(shuffleArray(selectedCategory.words));
    setCurrentWordIndex(0);
    setRoundWords([]);
    setScreen('ready');
    setCountdown(null);
  }, [selectedCategory]);

  useEffect(() => {
    if (countdown === null || (online && !online.isHost)) return;
    if (countdown === 0) {
      setCountdown(null); setScreen('playing'); resetTimer(timerDuration); startTimer();
      // The ready listener already calibrated the forehead pose. Do not reset
      // or briefly disable it when the first word becomes visible.
      armedRef.current = tiltTracker.current.armed;
      setIsArmed(tiltTracker.current.armed);
      if (online?.isHost) {
        online.broadcast('tv-state', {
          game: 'headup', phase: 'playing',
          word: '',
          currentPlayer: playerNames[currentRound - 1] || t('games.headup.playerFallback', { n: currentRound }),
          correct: 0, skipped: 0, timeLeft: timerDuration,
          round: currentRound, totalRounds,
          category: selectedCategory?.name || '',
        });
      }
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, timerDuration, resetTimer, startTimer]);

  const currentWord = wordQueue[currentWordIndex] ?? '';
  const correctCount = roundWords.filter((w) => w.correct).length;
  const skippedCount = roundWords.filter((w) => !w.correct).length;

  const advanceWord = useCallback((correct: boolean) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    const newCorrect = correctCount + (correct ? 1 : 0);
    const newSkipped = skippedCount + (correct ? 0 : 1);
    setRoundWords((prev) => [...prev, { word: currentWord, correct }]);
    setFlash(correct ? 'green' : 'red');
    triggerHaptic(correct ? 'medium' : 'light');
    setTimeout(() => setFlash(null), 300);
    setCurrentWordIndex((prev) => {
      const next = prev + 1;
      if (online?.isHost) {
        online.broadcast('tv-state', {
          game: 'headup', phase: 'playing',
          word: '',
          currentPlayer: playerNames[currentRound - 1] || t('games.headup.playerFallback', { n: currentRound }),
          correct: newCorrect, skipped: newSkipped,
          timeLeft, round: currentRound, totalRounds,
          category: selectedCategory?.name || '',
        });
      }
      if (next >= wordQueue.length) { setWordQueue((q) => shuffleArray(q)); return 0; }
      return next;
    });
    setTimeout(() => { cooldownRef.current = false; }, 300);
  }, [currentWord, wordQueue.length, online, correctCount, skippedCount, timeLeft, currentRound, totalRounds, playerNames, selectedCategory, wordQueue]);

  // ── Tilt-Erkennung (Gravitationsvektor, orientierungsunabhängig) ─────────────
  // Der bisherige Weg über DeviceOrientation.beta war im Querformat mehrdeutig
  // und nahe der Senkrechten gimbal-instabil → Skip löste praktisch nie aus.
  // Jetzt: Nick-Winkel aus dem Schwerkraftvektor (accelerationIncludingGravity)
  // — eindeutig, kein Umschlag, roll-invariant (egal ob Hoch-/Querformat).
  const [motionAllowed, setMotionAllowed] = useState(() => typeof DeviceMotionEvent !== 'undefined' && !('requestPermission' in DeviceMotionEvent));
  const [motionPending, setMotionPending] = useState(false);
  const motionPhase = screen === 'ready' || screen === 'playing';
  const motionContext = useRef({ screen, connected: online?.isConnected !== false, paused: exitGuard.open });
  motionContext.current = { screen, connected: online?.isConnected !== false, paused: exitGuard.open };
  const requestMotion = async () => {
    setMotionPending(true);
    try {
      const api = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      setMotionAllowed(!api.requestPermission || await api.requestPermission() === 'granted');
    } catch { setMotionAllowed(false); }
    finally { setMotionPending(false); }
  };
  useEffect(() => {
    if (!motionAllowed || !motionPhase || (online && actorId !== online.myPlayerId)) return;
    const tracker = tiltTracker.current;
    tracker.reset();
    orientationActiveRef.current = true;
    const handle = (event: DeviceMotionEvent) => {
      if (!orientationActiveRef.current || !motionContext.current.connected || motionContext.current.paused || !event.accelerationIncludingGravity) return;
      const pitch = gravityPitch(event.accelerationIncludingGravity);
      if (pitch === null) return;
      const action = tiltTracker.current.sample(pitch, motionContext.current.screen === 'playing');
      armedRef.current = tiltTracker.current.armed;
      setIsArmed(tiltTracker.current.armed);
      if (action) actionRef.current('word', action === 'correct');
    };
    window.addEventListener('devicemotion', handle);
    return () => { orientationActiveRef.current = false; tracker.reset(); window.removeEventListener('devicemotion', handle); };
    // Keep the listener and ready-phase calibration across ready -> playing.
  }, [motionPhase, currentRound, actorId, motionAllowed, online?.myPlayerId]);

  const handleNextRound = useCallback(() => {
    const name = playerNames[currentRound - 1] || t('games.headup.playerFallback', { n: currentRound });
    setAllRounds((prev) => [...prev, { playerName: name, correct: correctCount, skipped: skippedCount, words: [...roundWords] }]);
    if (currentRound >= totalRounds) setScreen('gameOver');
    else { setCurrentRound((r) => r + 1); handleStartRound(); }
  }, [currentRound, totalRounds, playerNames, roundWords, correctCount, skippedCount, handleStartRound]);

  useEffect(() => {
    if (screen === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const ownIndex = online ? order.indexOf(online.myPlayerId) : -1;
      const ownScore = ownIndex >= 0 ? allRounds[ownIndex]?.correct ?? 0 : totalCorrect;
      recordEnd('headup', ownScore, !online || ownScore === Math.max(...allRounds.map(r => r.correct)));
    }
    if (screen === 'setup') gameRecordedRef.current = false;
  }, [screen]);



  const handleRestart = useCallback(() => {
    setScreen('setup'); setSelectedCategory(null); setCurrentRound(1); setAllRounds([]); setRoundWords([]);
    orientationActiveRef.current = false;
  }, []);

  // Rematch: keep the same players AND category, wipe the previous game's
  // round results, and jump straight back into gameplay (ready countdown) —
  // never back to the setup screen.
  const playAgain = useCallback(() => {
    setCurrentRound(1);
    setAllRounds([]);
    setRoundWords([]);
    orientationActiveRef.current = false;
    gameRecordedRef.current = false;
    handleStartRound();
  }, [handleStartRound]);

  // Host: Entfernte fallen aus der Reihenfolge; war es die aktive Person, startet
  // die naechste frisch (Uhr gestoppt, neue Woerter).
  useRemovedPlayers(online, ids => {
    const change = removeFromHeadUp({ order, names: playerNames, currentRound, screen, allRounds }, ids);
    if (!change.changed) return;
    const next = change.state;
    setOrder(next.order); setPlayerNames(next.names); setCurrentRound(next.currentRound); setAllRounds(next.allRounds);
    if (change.roundRestarted || next.screen === 'gameOver') { resetTimer(timerDuration); suspendTilt(); }
    if (change.roundRestarted) handleStartRound();
    else setScreen(next.screen);
  });
  const act = useOnlineActions(online, 'headup', `${screen}:${currentRound}:${currentWordIndex}:${countdown}`, {
    start: { allowed: screen === 'setup' ? 'host' : false, run: () => { if (online) { setPlayerNames(online.players.map(p => p.name)); setOrder(online.players.map(p => p.id)); } handleStartRound(); } },
    ready: { allowed: screen === 'ready' && countdown === null ? actorId : false, run: () => { if (screen === 'ready' && countdown === null) setCountdown(3); } },
    word: { allowed: screen === 'playing' ? actorId : false, run: (correct: unknown) => { if (typeof correct === 'boolean') advanceWord(correct); } },
    next: { allowed: screen === 'roundResult' ? 'host' : false, run: handleNextRound },
    again: { allowed: screen === 'gameOver' ? 'host' : false, run: playAgain },
    restart: { allowed: 'host', run: handleRestart },
  });
  actionRef.current = act;
  useOnlinePrivateSnapshot(online, 'headup', { screen, playerNames, order, selectedCategory, timerDuration, currentRound, currentWordIndex, wordQueue, roundWords, allRounds, countdown, timeLeft }, (state, recipient) => ({ ...state, selectedCategory: state.selectedCategory ? { ...state.selectedCategory, words: [] } : null, wordQueue: state.wordQueue.map((word, index) => recipient === actorId || index !== state.currentWordIndex ? '' : word) }), state => {
    setScreen(state.screen); setPlayerNames(state.playerNames); setOrder(state.order ?? []); setSelectedCategory(state.selectedCategory); setTimerDuration(state.timerDuration); setCurrentRound(state.currentRound); setCurrentWordIndex(state.currentWordIndex); setWordQueue(state.wordQueue); setRoundWords(state.roundWords); setAllRounds(state.allRounds); setCountdown(state.countdown); setRemoteTime(state.timeLeft);
  });
  if (online && !online.isHost && screen === 'setup') return <OnlineWaiting />;

  const finalRounds = allRounds;
  const totalCorrect = finalRounds.reduce((s, r) => s + r.correct, 0);
  const bestRound = finalRounds.reduce((b, r) => (r.correct > b.correct ? r : b), finalRounds[0] ?? { playerName: '', correct: 0, skipped: 0, words: [] });

  const featured = getHeadUpCategories()[0];
  const gridCats = getHeadUpCategories().slice(1);

  return (
    <GameStage gameId="headup" className="headup-stage">

      <AnimatePresence mode="wait">

        {/* ── SETUP ─────────────────────────────────────────────────── */}
        {screen === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="py-3 max-w-3xl mx-auto">
            <div className="text-center mb-8 pt-6">
              <h1 className="text-4xl font-extrabold tracking-tighter text-[#f1f3fc]">{t('games.headup.gameTitle')}</h1>
              <p className="mt-3 text-sm text-[var(--stage-muted)]">{t('games.headup.holdToForehead')}</p>
            </div>

            {/* Players */}
            <div className="mb-6">
              <PlayerSetup locked={!!online}
                players={playerNames.map((name, i) => ({ id: String(i), name }))}
                onAdd={() => setPlayerNames([...playerNames, ''])}
                onRemove={(id) => setPlayerNames(playerNames.filter((_, j) => j !== Number(id)))}
                onRename={(id, name) => { const n = [...playerNames]; n[Number(id)] = name; setPlayerNames(n); }}
                onImportNames={isOnlineOrParty ? undefined : handleImportNames}
                min={2}
                max={12}
                accent="#df8eff"
                label={t('games.headup.playerLabel')}
              />
            </div>

            {/* Featured Category */}
            {featured && (
              <PremiumImageChoiceCard
                title={featured.name}
                subtitle={t('games.headup.wordCount', { count: featured.words.length })}
                image={HEADUP_THEME_ASSETS[featured.id]}
                selected={selectedCategory?.id === featured.id}
                onClick={() => setSelectedCategory(featured)}
                badge={`${t('games.headup.featuredBadge')} · ${t('games.headup.topPickBadge')}`}
                accent="#df8eff"
                layout="wide"
                priority
                className="mb-6"
              />
            )}

            {/* Category Grid */}
            <h2 className="text-xs font-semibold text-[#a8abb3] uppercase tracking-widest mb-3 px-1">{t('games.headup.categoriesLabel')}</h2>
            <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
              {gridCats.map((cat) => (
                <PremiumImageChoiceCard
                  key={cat.id}
                  title={cat.name}
                  subtitle={t('games.headup.wordCount', { count: cat.words.length })}
                  image={HEADUP_THEME_ASSETS[cat.id]}
                  selected={selectedCategory?.id === cat.id}
                  onClick={() => setSelectedCategory(cat)}

                  accent="#df8eff"
                />
              ))}
            </div>

            {/* Settings */}
            <div className="bg-[#181d1b] rounded-2xl p-5 border border-[#20262f] mb-6">
              <h3 className="text-xs font-semibold text-[#a8abb3] uppercase tracking-widest mb-4">{t('games.headup.settingsLabel')}</h3>
              <div>
                <label className="text-xs text-[#a8abb3] mb-2 block"><Trans i18nKey="games.headup.timerLabel" values={{ duration: timerDuration }} components={{ 1: <strong className="font-semibold text-white" /> }} /></label>
                <input type="range" min={15} max={120} step={5} value={timerDuration} onChange={(e) => setTimerDuration(+e.target.value)}
                  className="w-full h-1 rounded-full appearance-none bg-[#1b2028] accent-[#df8eff]" />
              </div>
            </div>

            {/* Start Button */}
            <div className="relative z-20 mt-2">
              <div className="mx-auto text-center">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => act('start')} disabled={!selectedCategory}
                  className={`w-full py-4 rounded-full text-base font-extrabold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                    selectedCategory ? 'bg-[#df8eff] text-[#101513]' : 'bg-[#1b2028] text-[#b5bdbe] cursor-not-allowed'
                  }`}>
                  <Play className="w-5 h-5" /> {t('games.headup.startGame')}
                </motion.button>
                <p className="text-xs text-[#a8abb3] mt-2 uppercase tracking-widest">{t('games.headup.holdToForehead')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── READY ─────────────────────────────────────────────────── */}
        {screen === 'ready' && <motion.div key="ready" initial={{opacity: 0}} animate={{opacity: 1}} className="headup-ready mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-5 text-center">
          <p className="text-sm font-bold text-[#df8eff]">{playerNames[currentRound - 1]}</p>
          <Smartphone className="h-20 w-20 text-[#df8eff]" strokeWidth={1} aria-hidden="true" />
          <h1 className="text-xl font-bold">{t('games.headup.holdToForehead')}</h1>
          <div className="flex gap-6 text-sm"><span className="flex items-center gap-2 text-[#8ff5ff]"><ChevronDown className="h-5 w-5" />{t('games.headup.tiltDownCorrect')}</span><span className="flex items-center gap-2 text-[#ff6e84]"><ChevronUp className="h-5 w-5" />{t('games.headup.tiltUpSkip')}</span></div>
          {countdown !== null ? <strong className="text-7xl font-black text-[#df8eff] tabular-nums">{countdown === 0 ? t('games.headup.go') : countdown}</strong> : <div className="flex w-full max-w-xs flex-col gap-2">
            <StageAction disabled={!act.can('ready') || motionPending} onClick={async () => { await requestMotion(); act('ready'); }}>{t('games.headup.readyBtn')}</StageAction>
            <button className="text-sm text-[#a8abb3] underline underline-offset-4" disabled={!act.can('ready') || motionPending} onClick={() => { setMotionAllowed(false); act('ready'); }}>{t('games.headup.buttonsOnly')}</button>
          </div>}
          <p className="text-xs text-[#a8abb3]">{t('games.headup.roundLabel', {current: currentRound, total: totalRounds})} · {selectedCategory?.name}</p>
        </motion.div>}

        {screen === 'playing' && <motion.div key="playing" initial={{opacity: 0}} animate={{opacity: 1}} className="headup-play relative mx-auto flex w-full max-w-5xl flex-col overflow-hidden">
          {flash && <div key={currentWordIndex} aria-hidden="true" className={`pointer-events-none absolute inset-0 z-20 ${flash === 'green' ? 'bg-[#8ff5ff]/20' : 'bg-[#ff6e84]/20'}`} />}
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-[#df8eff]/20 px-3 py-1 text-xs text-[#df8eff]">{playerNames[currentRound - 1]} · {currentRound}/{totalRounds}</span>
            <TimerCircle timeLeft={timeLeft} percent={percentLeft} warn={timeLeft <= 10} />
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-4">
            <div className="w-full text-center">
              <p className="break-words text-[clamp(2.7rem,10vw,7rem)] font-black italic tracking-tight leading-[1.05] text-[#df8eff]">{online && actorId === online.myPlayerId ? playerNames[currentRound - 1] : currentWord}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-5 py-2 text-sm">
            <span className="flex items-center gap-2 text-[#8ff5ff]"><Check className="h-4 w-4" />{correctCount}</span>
            <span className="flex items-center gap-2 text-[#ff6e84]"><X className="h-4 w-4" />{skippedCount}</span>
          </div>
          {motionAllowed && (!online || actorId === online.myPlayerId) && <p className="mb-2 text-center text-xs text-[#a8abb3]">{isArmed ? t('games.headup.armed') : t('games.headup.holdToForehead')}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-full border border-[#ff6e84]/25 bg-[#1b2028] px-4 py-3 text-sm font-semibold text-[#ff6e84]" disabled={!act.can('word')} onClick={() => act('word', false)}><X className="h-4 w-4" />{t('games.headup.skip')}</button>
            <button className="flex items-center justify-center gap-2 rounded-full bg-[#8ff5ff] px-4 py-3 text-sm font-semibold text-[#0a0e14]" disabled={!act.can('word')} onClick={() => act('word', true)}><Check className="h-4 w-4" />{t('games.headup.correct')}</button>
          </div>
        </motion.div>}

        {screen === 'roundResult' && <div className="mx-auto w-full max-w-3xl space-y-7 py-4">
          <StageHeader title={playerNames[currentRound - 1]} eyebrow={t('games.headup.results')} trailing={<span className="text-5xl font-bold tabular-nums text-[#df8eff]">{correctCount}</span>} subtitle={`${correctCount} ${t('games.headup.correct')} · ${skippedCount} ${t('games.headup.skipped')}`} />
          <ul className="divide-y divide-white/15">{roundWords.map((word, index) => <li key={index} className="flex items-center gap-4 py-4 text-lg">{word.correct ? <Check className="h-5 w-5 shrink-0 text-[#df8eff]" /> : <X className="h-5 w-5 shrink-0 text-[#e5a79a]" />}<span className="break-words">{word.word}</span></li>)}</ul>
          <StageFooter><StageAction disabled={!act.can('next')} onClick={() => act('next')}>{currentRound >= totalRounds ? t('games.headup.results') : t('games.headup.nextPlayer')}<ChevronRight className="h-5 w-5" /></StageAction></StageFooter>
        </div>}
        {screen === 'gameOver' && <div className="mx-auto w-full max-w-3xl space-y-7 py-4">
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <StageHeader title={t('games.headup.gameOver')} subtitle={t('games.headup.wordsGuessedLabel')} trailing={<span className="text-6xl font-black tabular-nums text-[#df8eff]">{totalCorrect}</span>} />
          <div className="grid grid-cols-2 gap-4"><StagePanel tone="quiet"><p className="text-xs text-[var(--stage-muted)]">{t('games.headup.rounds')}</p><p className="mt-3 text-3xl font-bold">{finalRounds.length}</p></StagePanel><StagePanel tone="quiet"><p className="text-xs text-[var(--stage-muted)]">{t('games.headup.best')}</p><p className="mt-3 text-3xl font-bold">{bestRound.correct}</p></StagePanel></div>
          <section><h2 className="mb-3 text-sm text-[var(--stage-muted)]">{t('games.headup.resultsPerRound')}</h2><ol className="divide-y divide-white/15">{finalRounds.map((result, index) => <li key={index} className="flex items-center gap-4 py-5"><span className="text-sm tabular-nums text-[var(--stage-muted)]">{index + 1}</span><div className="flex-1 min-w-0"><p className="text-xl font-semibold break-words">{result.playerName}</p><p className="mt-1 text-sm text-[var(--stage-muted)]">{result.skipped} {t('games.headup.skipped')}</p></div><strong className="text-3xl text-[#df8eff]">{result.correct}</strong></li>)}</ol></section>
          <StageFooter className="flex-wrap"><StageAction disabled={!act.can('again')} onClick={() => act('again')}><RotateCcw className="h-5 w-5" />{t('games.headup.playAgain')}</StageAction><StageAction variant="secondary" disabled={!act.can('restart')} onClick={() => act('restart')}>{t('games.headup.back')}</StageAction></StageFooter>
        </div>}

      </AnimatePresence>
      <ConfirmExitDialog
        open={exitGuard.open}
        onStay={() => { exitGuard.cancel(); resumeTilt(); }}
        onLeave={exitGuard.confirm}
        accent="#df8eff"
      />
    </GameStage>
  );
}
