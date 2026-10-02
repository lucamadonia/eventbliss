import { GameStage } from '../ui/GameStage';
import './design.css';
import { emojiPointsForTurn, emojiTeamSizes, matchesEmojiAnswer, awardEmojiPoints, publicEmojiPuzzle, nextEmojiTurn, emojiRoundBudget } from './game-rules';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameTimer } from '@/games/engine/TimerSystem';
import { getEMOJI_PUZZLES, type EmojiPuzzle } from './emoji-content';
import { useGameEnd } from '../social/useGameEnd';
import { GameSetup, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { PLAYER_COLORS, GAME_MODES, shuffle } from './emoji-setup';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { applyEmojiRemoval } from './removal';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { emojiActiveSeat, emojiIsHolder, emojiRevealCard, emojiStartPlayers, emojiTvPlayers, emojiTvPuzzle, type EmojiPhase, type EmojiRevealCard } from './party-turns';
import { GameOverScreen, PlayingScreen, ReadyScreen, RevealScreen, TeamLine } from './EmojiScreens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = EmojiPhase;

interface Player {
  team?: number;
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
}

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

  // 🔁 guests hold the host phone for their whole turn (sharedDevice 'turns'); the clock stands while it travels.
  const handover = useSeatHandover(online, emojiActiveSeat(phase, players, currentPlayerIdx));
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound, currentPlayerIdx]); // all devices + TV switch together

  // Timer
  const handleTimerExpire = useCallback(() => {
    if (online && (!online.isHost || online.isConnected === false)) return;
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    setPlayers(prev => awardEmojiPoints(prev, currentPlayerIdx, 0, mode === 'team'));
    setPhase('reveal');
  }, [online, currentPlayerIdx, mode]);
  const timer = useGameTimer(timerDuration, handleTimerExpire, !online || (online.isHost && online.isConnected !== false && !handover.isPaused));
  useOnlineSnapshot(online, 'emojiguess-clock-state', { timeLeft: timer.timeLeft }, data => timer.reset(data.timeLeft));

  useTVGameBridge('emojiguess', {
    phase, phaseStartsAt, handover: handover.tv, currentRound, currentPlayerIdx, players: emojiTvPlayers(players), totalRounds,
    ...emojiTvPuzzle(phase, currentPuzzle), // answer only in the reveal
    timeLeft: timer.timeLeft,
    maxTime: timerDuration,
  }, [phase, phaseStartsAt, currentRound, currentPlayerIdx, showAnswer, timer.timeLeft, players.map(p => p.score).join(','), handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''], !online || online.isHost);

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
      const mapped: Player[] = emojiStartPlayers(setupPlayers, PLAYER_COLORS, !!online);
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
    setRoundPoints(showAnswer ? 0 : emojiPointsForTurn(pointsAvailable, currentPlayerIdx, players, mode === 'team'));
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

  // Host: a removed player leaves the rotation; if it was his puzzle, the next player takes over (G7).
  useRemovedPlayers(online, ids => {
    const r = applyEmojiRemoval({ phase, players, currentPlayerIdx, currentRound, totalRounds }, ids);
    if (!r) return;
    setPlayers(r.players); setCurrentPlayerIdx(r.currentPlayerIdx); setCurrentRound(r.currentRound);
    if (r.finished) { stopTimers(); setPhase('gameOver'); } else if (r.restartTurn) startRound();
  });

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

  // Freeze the revealed puzzle: the reveal stays on screen while the next one is already drawn (phase gate).
  const revealRef = useRef<EmojiRevealCard<EmojiPuzzle, Player> | null>(null);
  revealRef.current = emojiRevealCard(revealRef.current, phase, { round: currentRound, holder: currentPlayer, puzzle: currentPuzzle, points: roundPoints });
  const shownReveal = revealRef.current;

  useOnlineSnapshot(online, 'game-state', { phase, currentRound, totalRounds, currentPlayerIdx, currentPuzzle: phase === 'ready' ? null : publicEmojiPuzzle(currentPuzzle, phase === 'reveal' || phase === 'gameOver', showHint), players, mode, timerDuration, showHint, showAnswer, pointsAvailable, answerError, attempt, roundPoints, phaseStartsAt }, data => {
    receivePhaseStart(data.phaseStartsAt);
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
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen
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

  const holder = emojiIsHolder(online, currentPlayer?.id, handover.activeGuest);
  const lastTurn = currentPlayerIdx === players.length - 1 && currentRound >= totalRounds;
  const revealSeat = shownReveal?.holder ?? currentPlayer;
  return (
    <div data-phase={view} className="relative min-h-[100dvh] text-white flex flex-col">
      {blocker}
      {view === 'ready' && currentPlayer && <ReadyScreen seat={currentPlayer} round={currentRound} total={totalRounds} seconds={timerDuration}
        points={emojiPointsForTurn(100, currentPlayerIdx, players, mode === 'team')} holder={holder} onReady={ready} />}
      {view === 'playing' && currentPuzzle && currentPlayer && <PlayingScreen seat={currentPlayer} puzzle={currentPuzzle} round={currentRound} total={totalRounds}
        timeLeft={timer.timeLeft} percentLeft={timer.percentLeft} points={emojiPointsForTurn(pointsAvailable, currentPlayerIdx, players, mode === 'team')}
        showHint={showHint} holder={holder} answer={answerInput} answerError={answerError} onAnswer={setAnswerInput}
        onSubmit={() => handleCorrectGuess()} onReveal={toggleAnswer} onSkip={handleSkip}
        teamNote={mode === 'team' && new Set(emojiTeamSizes(players)).size > 1 && <p className="px-4 text-center text-sm text-white/70">{t('games.emojiguess.balancedTeamPoints', { defaultValue: 'Bei ungleichen Teams werden die Punkte gewichtet: Beide Teams können pro Runde gleich viele Punkte erreichen.' })}</p>}
        teams={mode === 'team' && <TeamLine players={players} label={team => t('games.emojiguess.teamLabel', { team: team === 0 ? 'A' : 'B' })} />} />}
      {view === 'reveal' && shownReveal && revealSeat && <RevealScreen seat={revealSeat} puzzle={shownReveal.puzzle} points={shownReveal.points}
        nextName={phase === 'reveal' && !lastTurn ? players[(currentPlayerIdx + 1) % players.length]?.name ?? null : null}
        canAdvance={(!online || online.isHost) && phase === 'reveal'} onNext={advanceRound} />}
      {view === 'gameOver' && <GameOverScreen sorted={sortedPlayers} achievements={newAchievements} onDismiss={clearAchievements}
        canReplay={!online || online.isHost} onReplay={playAgain} onLeave={() => navigate('/games')} />}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#eed867" />
    </div>
  );
}

export default function EmojiGuessGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="emoji-raten" className="rebus-game"><EmojiGuessGameContent online={online} /></GameStage>;
}
