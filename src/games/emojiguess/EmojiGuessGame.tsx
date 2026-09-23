import { GameStage, StageHeader, StagePanel, StageAction } from '../ui/GameStage';
import './design.css';
import { emojiPointsForTurn, matchesEmojiAnswer, awardEmojiPoints, publicEmojiPuzzle, nextEmojiTurn, emojiRoundBudget } from './game-rules';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, RotateCcw, Timer, ArrowLeft, ArrowRight,
  Zap, Clock, Crown, Lightbulb, Eye, Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameTimer } from '@/games/engine/TimerSystem';
import { getEMOJI_PUZZLES, type EmojiPuzzle } from './emoji-content';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'ready' | 'setup' | 'playing' | 'reveal' | 'roundEnd' | 'gameOver';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

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
// Setup config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: '30 Sek. pro Runde', icon: <Clock className="w-6 h-6" /> },
  { id: 'speed', name: 'Speed', desc: '10 Sek. pro Runde', icon: <Zap className="w-6 h-6" /> },
  { id: 'team', name: 'Team', desc: 'Teams wechseln sich ab', icon: <Crown className="w-6 h-6" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EmojiGuessGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));

  const SETUP_SETTINGS: SettingsConfig = {
    timer: { min: 5, max: 60, default: 30, step: 5, label: t('games.setup.timer') },
    rounds: { min: 1, max: 30, default: 10, step: 1, label: t('games.setup.rounds') },
  };

  // Setup state
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg — die Partie ist
  // dann futsch. Setup und Endstand haben nichts zu verlieren und reichen
  // weiter an den Routen-Handler.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [answerInput, setAnswerInput] = useState('');
  const [answerError, setAnswerError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [timerDuration, setTimerDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(10);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<EmojiPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pointsAvailable, setPointsAvailable] = useState(100);
  const deck = useRef<EmojiPuzzle[]>([]);
  const deckPos = useRef(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  const handleTimerExpire = useCallback(() => {
    if (online && (!online.isHost || online.isConnected === false)) return;
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    setPlayers(prev => awardEmojiPoints(prev, currentPlayerIdx, 0, mode === 'team'));
    setPhase('reveal');
  }, [online, currentPlayerIdx, mode]);
  const timer = useGameTimer(timerDuration, handleTimerExpire, !online || (online.isHost && online.isConnected !== false));
  useOnlineSnapshot(online, 'emojiguess-clock-state', { timeLeft: timer.timeLeft }, data => timer.reset(data.timeLeft));

  useTVGameBridge('emojiguess', {
    phase, currentRound, currentPlayerIdx, players, totalRounds,
    emojis: phase === 'ready' ? '' : currentPuzzle?.emojis || '',
    category: phase === 'ready' ? '' : currentPuzzle?.category || '',
    answer: phase === 'reveal' ? (currentPuzzle?.answer || '') : '',
    timeLeft: timer.timeLeft,
    maxTime: timerDuration,
  }, [phase, currentRound, currentPlayerIdx, showAnswer, timer.timeLeft], !online || online.isHost);

  // Derived
  const currentPlayer = players[currentPlayerIdx] ?? null;

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    (
      setupPlayers: { id: string; name: string; color: string; avatar: string }[],
      selectedMode: string,
      settings: { timer: number; rounds: number },
    ) => {
      if (online && (!online.isHost || online.isConnected === false)) return;
      const mapped: Player[] = setupPlayers.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        score: 0,
        streak: 0,
      }));
      setPlayers(mapped);
      setMode(selectedMode);
      setTimerDuration(selectedMode === 'speed' ? 10 : settings.timer);
      deck.current = shuffle(getEMOJI_PUZZLES());
      setTotalRounds(emojiRoundBudget(settings.rounds, mapped.length, deck.current.length));
      deckPos.current = 0;
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      startRound(selectedMode === 'speed' ? 10 : settings.timer);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [online],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  const route = useOnlineAuthority(online, 'emojiguess', `${phase}:${currentRound}:${currentPlayerIdx}:${attempt}`, {
    ready: { allow: sender => phase === 'ready' && sender === players[currentPlayerIdx]?.id, run: () => ready() },
    toggleAnswer: { allow: sender => phase === 'playing' && sender === players[currentPlayerIdx]?.id, run: () => toggleAnswer() },
    handleCorrectGuess: { allow: (sender, args) => phase === "playing" && typeof args[0] === "string" && args[0].length <= 120 && sender === players[currentPlayerIdx]?.id, run: (...args) => handleCorrectGuess(args[0]) },
    handleSkip: { allow: (sender, args) => phase === "playing" && sender === players[currentPlayerIdx]?.id, run: (...args) => handleSkip() },
    advanceRound: { allow: (sender, args) => phase === "reveal" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => advanceRound() },
    playAgain: { allow: (sender, args) => phase === "gameOver" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => playAgain() },
  });

  function ready() { if (route('ready')) return; timer.start(); setPhase('playing'); }

  function toggleAnswer() { if (route('toggleAnswer')) return; stopTimers(); setShowAnswer(true); setPlayers(prev => awardEmojiPoints(prev, currentPlayerIdx, 0, mode === 'team')); setPhase('reveal'); }

  function drawPuzzle(): EmojiPuzzle {
    return deck.current[deckPos.current++];
  }

  function startRound(dur?: number) {
    const puzzle = drawPuzzle();
    setCurrentPuzzle(puzzle);
    setRoundPoints(0);
    setAnswerInput(''); setAnswerError(false); setAttempt(0);
    setShowHint(false);
    setShowAnswer(false);
    setPointsAvailable(100);
    timer.reset(dur ?? timerDuration);
    timer.pause();
    setPhase('ready');

  }

  // Derive hints and points from the authoritative pausable clock.
  useEffect(() => {
    if (phase !== 'playing' || (online && (!online.isHost || online.isConnected === false))) return;
    setPointsAvailable(Math.max(10, Math.round(timer.timeLeft / timerDuration * 100)));
    setShowHint(timerDuration - timer.timeLeft >= Math.ceil(timerDuration / 2));
  }, [phase, timer.timeLeft, timerDuration, online?.isHost, online?.isConnected]);

  function stopTimers() {
    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    if (pointsIntervalRef.current) { clearInterval(pointsIntervalRef.current); pointsIntervalRef.current = null; }
    timer.pause();
  }

  function handleCorrectGuess(answer = answerInput) {
    if (route("handleCorrectGuess", [answer])) return;
    if (typeof answer !== 'string' || !matchesEmojiAnswer(answer, currentPuzzle?.answer ?? '', currentPuzzle?.aliases)) {
      setAnswerError(true);
      setAttempt(value => value + 1);
      return;
    }
    stopTimers();
    setRoundPoints(showAnswer ? 0 : emojiPointsForTurn(pointsAvailable, currentPlayerIdx, players.length, mode === 'team'));
    setPlayers(prev => awardEmojiPoints(prev, currentPlayerIdx, showAnswer ? 0 : pointsAvailable, mode === 'team'));
    setPhase('reveal');
  }

  function handleSkip() {
    if (route("handleSkip", [])) return;
    stopTimers();
    setPlayers(prev => awardEmojiPoints(prev, currentPlayerIdx, 0, mode === 'team'));
    setPhase('reveal');
  }

  function advanceRound() {
    if (route("advanceRound", [])) return;
    const next = nextEmojiTurn(currentPlayerIdx, currentRound, players.length, totalRounds);
    if (next.finished) { setPhase('gameOver'); return; }
    setCurrentPlayerIdx(next.nextPlayer);
    setCurrentRound(next.round);
    startRound();
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('emoji-raten', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  function resetGame() {
    stopTimers();
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
  }

  // Rematch: restart gameplay directly with the SAME players and their
  // settings. Scores and content reset for the new match (fresh deck,
  // round/player counters), then we jump straight into the first round.
  function playAgain() {
    if (route("playAgain", [])) return;
    stopTimers();
    gameRecordedRef.current = false;
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0 })));
    deck.current = shuffle(getEMOJI_PUZZLES());
    deckPos.current = 0;
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
    setShowAnswer(false);
    startRound();
  }

  useEffect(() => { setAnswerInput(''); }, [currentRound, currentPlayerIdx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    };
  }, []);

  // Sorted players for results
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  useOnlineSnapshot(online, 'game-state', { phase, currentRound, totalRounds, currentPlayerIdx, currentPuzzle: phase === 'ready' ? null : publicEmojiPuzzle(currentPuzzle, phase === 'reveal' || phase === 'gameOver', showHint), players, mode, timerDuration, showHint, showAnswer, pointsAvailable, answerError, attempt, roundPoints }, data => {
    setRoundPoints(data.roundPoints);
    setAnswerError(data.answerError); setAttempt(data.attempt ?? 0);
    setPhase(data.phase);
    setCurrentRound(data.currentRound);
    setTotalRounds(data.totalRounds);
    setCurrentPlayerIdx(data.currentPlayerIdx);
    setCurrentPuzzle(data.currentPuzzle);
    setPlayers(data.players);
    setMode(data.mode);
    setTimerDuration(data.timerDuration);
    setShowHint(data.showHint);
    setShowAnswer(data.showAnswer);
    setPointsAvailable(data.pointsAvailable);
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (phase === 'setup') {
    return (
      <>
      <p className="rebus-budget">{t('games.emojiguess.poolBudget', { puzzleCount: getEMOJI_PUZZLES().length, defaultValue: '{{puzzleCount}} kuratierte Rätsel. Die Rundenzahl wird bei großen Gruppen begrenzt: gleich viele Züge für alle, ohne Wiederholung.' })}</p>
      <GameSetup
        gameId="emojiguess"
        fixedTimerByMode={{ speed: 10 }}
        modes={getTranslatedModes('emojiguess', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title={t('games.emojiguess.title')}
        maxPlayers={20}
        onlinePlayers={online?.players}
      />
      </>
    );
  }

  return (
    <div data-phase={phase} className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      {phase === 'ready' && <section className="rebus-ready">
        <StageHeader eyebrow={t('games.emojiguess.title')} title={currentPlayer?.name}
          subtitle={t('games.findit.roundLabel', { current: currentRound, total: totalRounds })} />
        <StagePanel tone="paper" className="rebus-ready-card">
          <span className="rebus-issue">{String(currentRound).padStart(2, '0')}</span>
          <h2>{t('games.emojiguess.readyTitle', { defaultValue: 'Dein Rätsel wartet' })}</h2>
          <p>{t('games.emojiguess.readyBody', { defaultValue: 'Lies die Bilder von links nach rechts. Gesucht ist ein Begriff aus der angezeigten Kategorie.' })}</p>
          <p className="rebus-ready-time">{timerDuration} s · {t('games.emojiguess.pointsAvailable')} {emojiPointsForTurn(100, currentPlayerIdx, players.length, mode === 'team')}</p>
        </StagePanel>
        {!online || online.myPlayerId === currentPlayer?.id
          ? <StageAction onClick={ready}>{t('games.emojiguess.readyStart', { defaultValue: 'Bereit – Rätsel zeigen' })}<ArrowRight className="h-5 w-5" /></StageAction>
          : <p role="status">{t('games.emojiguess.waitingFor', { name: currentPlayer?.name, defaultValue: 'Warte auf {{name}}' })}</p>}
      </section>}
      {/* ---- PLAYING ---- */}
      {phase === 'playing' && currentPuzzle && (
        <div className="flex-1 flex flex-col">
          {/* Timer bar */}
          <div className="h-1 bg-white/[0.04]">
            <motion.div
              className={cn('h-full', timer.percentLeft > 25
                ? 'bg-gradient-to-r from-[#eed867] to-[#e9e4d3]'
                : 'bg-red-500')}
              initial={{ width: '100%' }}
              animate={{ width: `${timer.percentLeft}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <StageHeader eyebrow={t('games.emojiguess.title')} title={currentPlayer?.name}
            subtitle={t('games.findit.roundLabel', { current: currentRound, total: totalRounds })}
            trailing={<span className="rebus-clock" role="timer">{timer.timeLeft}<small>s</small></span>} />
          {/* Category badge */}
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs font-semibold text-[#eed867]">
              {currentPuzzle.category} · {currentPuzzle.difficulty}/3
            </span>
          </div>

          <div className="rebus-poster" aria-label={t('games.emojiguess.clueLabel', { defaultValue: 'Bilderrätsel' })}>
            <span className="rebus-caption">{t('games.emojiguess.clueLabel', { defaultValue: 'Bilderrätsel' })}</span>
            <div className="rebus-glyphs">{currentPuzzle.emojis}</div>
            <div className="rebus-clue-meta"><span><strong>{emojiPointsForTurn(pointsAvailable, currentPlayerIdx, players.length, mode === 'team')}</strong> {t('games.emojiguess.pointsAvailable')}</span>
              {showHint && <span className="rebus-hint"><Lightbulb className="h-4 w-4" />{t('games.emojiguess.hintPrefix', { letter: currentPuzzle.answer.charAt(0) })}</span>}
            </div>
          </div>

          {mode === 'team' && players.length % 2 === 1 && <p className="px-4 text-center text-sm text-white/70">{t('games.emojiguess.balancedTeamPoints', { defaultValue: 'Bei ungleichen Teams werden die Punkte gewichtet: Beide Teams können pro Runde gleich viele Punkte erreichen.' })}</p>}
          {mode === 'team' && <div className="flex justify-center gap-6 p-3">{[0, 1].map(team => <p key={team}>{t('games.emojiguess.teamLabel', { team: team === 0 ? 'A' : 'B' })}: {players.filter((_, i) => i % 2 === team).map(p => p.name).join(', ')} · {players[team]?.score ?? 0}</p>)}</div>}
          <form className="rebus-controls" onSubmit={e => { e.preventDefault(); if (answerInput.trim()) handleCorrectGuess(); }}>
            {!online || online.myPlayerId === currentPlayer?.id ? <>
              <label htmlFor="rebus-answer">{t('games.emojiguess.answerLabel')}</label>
              <div className="rebus-entry">
                <input id="rebus-answer" value={answerInput} onChange={e => { setAnswerInput(e.target.value); }} maxLength={120}
                  autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" aria-invalid={answerError} aria-describedby={answerError ? 'rebus-error' : undefined}
                  placeholder={t('games.emojiguess.answerLabel')} />
                <StageAction type="submit" disabled={!answerInput.trim()}>{t('games.emojiguess.submitAnswer', { defaultValue: 'Antwort prüfen' })}<ArrowRight className="h-5 w-5" /></StageAction>
              </div>
              {answerError && <p id="rebus-error" role="status" className="rebus-error">{t('games.emojiguess.tryAgain', { defaultValue: 'Noch nicht richtig. Versuche einen anderen Begriff.' })}</p>}
              <div className="rebus-secondary-actions">
                <StageAction type="button" variant="ghost" onClick={toggleAnswer}><Eye className="h-4 w-4" />{t('games.emojiguess.showAnswer')}</StageAction>
                <StageAction type="button" variant="ghost" onClick={handleSkip}>{t('games.emojiguess.skipPuzzle', { defaultValue: 'Überspringen' })}</StageAction>
              </div>
            </> : <p role="status">{t('games.emojiguess.waitingFor', { name: currentPlayer?.name, defaultValue: 'Warte auf {{name}}' })}</p>}
          </form>
        </div>
      )}

      {/* ---- REVEAL ---- */}
      {phase === 'reveal' && currentPuzzle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rebus-result flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <span className="rebus-caption">{t(roundPoints > 0 ? 'games.emojiguess.solved' : 'games.emojiguess.solution', { defaultValue: roundPoints > 0 ? 'Gelöst' : 'Auflösung' })}</span>
          <StagePanel tone="paper" className="rebus-solution">
            <div className="rebus-glyphs">{currentPuzzle.emojis}</div>
            <p className="rebus-caption">{currentPuzzle.category}</p>
            <h2>{currentPuzzle.answer}</h2>
          </StagePanel>
          <p role="status" className="rebus-score">+{roundPoints}</p>
          {!(currentPlayerIdx === players.length - 1 && currentRound >= totalRounds) && <p>{t('games.emojiguess.nextPlayer', { name: players[(currentPlayerIdx + 1) % players.length]?.name, defaultValue: 'Als Nächstes: {{name}}' })}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!!online && !online.isHost}
            onClick={advanceRound}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-[#eed867] text-[#0a0e14] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]"
          >
            {t('games.play.next')} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}


      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-sans text-[#eed867] neon-glow">
            {t('games.results.gameOver')}
          </h2>

          {sortedPlayers[0] && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#1b2028] border border-amber-500/20">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: sortedPlayers[0].color }}
              >
                {sortedPlayers[0].avatar}
              </div>
              <div>
                <div className="font-bold text-white">{sortedPlayers.filter(p => p.score === sortedPlayers[0].score).map(p => p.name).join(' & ')}</div>
                <div className="text-amber-400 text-sm font-semibold">{t('games.findit.points', { score: sortedPlayers[0].score })}</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="w-full space-y-2">
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-[1rem] border',
                  i === 0
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-[#1b2028] border-[#44484f]/20',
                )}
              >
                <span className="text-sm font-bold text-white/40 w-6 text-center">{i + 1}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">{p.name}</span>
                <span className="text-sm font-bold text-white/70">{p.score}</span>
              </motion.div>
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!!online && !online.isHost}
              onClick={playAgain}
              className="w-full flex items-center justify-center gap-2 bg-[#eed867] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]"
            >
              <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
            </motion.button>
            {/* Nur im Web. In der App macht das der FloatingBackButton. */}
            {!hasShellBackButton() && (
              <button
                onClick={() => navigate('/games')}
                className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
              >
                {t('games.results.otherGame')}
              </button>
            )}
          </div>
        </motion.div>
      )}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#eed867" />
    </div>
  );
}

export default function EmojiGuessGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="emoji-raten" className="rebus-game"><EmojiGuessGameContent online={online} /></GameStage>;
}
