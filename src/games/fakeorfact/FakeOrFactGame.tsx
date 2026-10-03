import { GameStage, StageHeader, StagePanel, StageAction } from '../ui/GameStage';
import './design.css';
import { publicQuizRound, settleQuizRound } from './round-state';
import { useGameTimer } from '../engine/TimerSystem';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, HelpCircle } from 'lucide-react';
import { getFACTS, getTHREE_STATEMENTS, type Fact, type ThreeStatements } from './fakeorfact-content';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { useGameEnd } from '../social/useGameEnd';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { acceptInput, deadline } from '../party/scene-schedule';
import { serverClock } from '../party/scene-clock';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { dropQuizPlayers } from './removal';
import { PLAYER_COLORS, shuffle, type Phase, type Mode, type Player } from './game-model';
import { answeringSeat, clockHeldForTurn, deviceMayAnswer, localSeatResults, needsDeadlineCheck, recordAnswer, seatColor, turnMarks, tvAnswered } from './turn-order';
import { TurnStage } from './TurnStage';
import { GameOverPanel, RevealPanel, StatementPanel } from './FofPanels';

// ---------------------------------------------------------------------------
// Setup config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: 'Wahr oder Falsch', icon: <Shield className="w-6 h-6" /> },
  { id: 'three', name: 'Zwei Luegen', desc: 'Finde die Wahrheit', icon: <HelpCircle className="w-6 h-6" /> },
];

type Vote = { playerId: string; correct: boolean; answer: boolean | number | null };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FakeOrFactGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));

  const SETUP_SETTINGS: SettingsConfig = {
    timer: { min: 5, max: 30, default: 15, step: 5, label: t('games.fakeorfact.timerLabel') },
    rounds: { min: 5, max: 25, default: 10, step: 1, label: t('games.fakeorfact.roundsLabel') },
  };

  // Setup
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
  const [mode, setMode] = useState<Mode>('classic');
  const [totalRounds, setTotalRounds] = useState(10);
  const [timerSec, setTimerSec] = useState(15);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // Classic mode
  const [factDeck, setFactDeck] = useState<Fact[]>([]);
  const [factIdx, setFactIdx] = useState(0);
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [playerVote, setPlayerVote] = useState<boolean | null>(null);

  // Three-statement mode
  const [threeDeck, setThreeDeck] = useState<ThreeStatements[]>([]);
  const [threeIdx, setThreeIdx] = useState(0);
  const [currentThree, setCurrentThree] = useState<ThreeStatements | null>(null);
  const [playerThreeVote, setPlayerThreeVote] = useState<number | null>(null);

  // Vote tracking for percentage bar
  const [votes, setVotes] = useState<Vote[]>([]);

  // ---------------------------------------------------------------------------
  // Party-Play: 🔁 guests judge their turn on the host phone (guestPolicy 'turns')
  // ---------------------------------------------------------------------------

  const currentPlayer = players[currentPlayerIdx] ?? null;
  const turnSeat = answeringSeat(phase, players, currentPlayerIdx);
  const handover = useSeatHandover(online, turnSeat);
  // The clock stands while the host phone travels to/from the seat whose turn it is (phones mirror the host value).
  const hostSeats = online ? localSeats(online) : [];
  const clocksRun = online?.isConnected !== false && !clockHeldForTurn(handover.isPaused, turnSeat, hostSeats);
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound]);

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
        color: seatColor(p.color, i, PLAYER_COLORS, !!online),
        score: 0,
        streak: 0,
      }));
      setPlayers(mapped);
      setMode(selectedMode as Mode);
      setTotalRounds(settings.rounds);
      setTimerSec(settings.timer);
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      setVotes([]);

      if (selectedMode === 'three') {
        const shuffled = shuffle(getTHREE_STATEMENTS());
        setThreeDeck(shuffled);
        setThreeIdx(0);
        setCurrentThree(shuffled[0]);
        setPlayerThreeVote(null);
      } else {
        const shuffled = shuffle(getFACTS());
        setFactDeck(shuffled);
        setFactIdx(0);
        setCurrentFact(shuffled[0]);
        setPlayerVote(null);
      }
      setPhase(online ? 'statement' : 'handoff');
    },
    [online],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  // Share of votes that were correct so far this reveal (phone bar + TV bar).
  const correctPct = useMemo(() => {
    if (votes.length === 0) return 0;
    return Math.round((votes.filter(v => v.correct).length / votes.length) * 100);
  }, [votes]);

  useTVGameBridge('fakeorfact', {
    phase, currentRound, currentPlayerIdx, mode, totalRounds,
    players: players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, score: p.score, streak: p.streak })),
    // Who already judged (identity only — what they chose stays hidden until the reveal).
    voters: tvAnswered(players, votes),
    statement: phase === 'handoff' ? '' : currentFact?.statement || '',
    statements: phase === 'handoff' ? [] : currentThree?.statements || [],
    category: currentFact?.category || currentThree?.category || '',
    // The truth is hidden until reveal: classic → 0=True / 1=False, three → trueIndex.
    correctAnswer: phase === 'reveal'
      ? (mode === 'three'
          ? (currentThree?.trueIndex ?? -1)
          : (currentFact ? (currentFact.isTrue ? 0 : 1) : -1))
      : -1,
    explanation: phase === 'reveal' ? (currentFact?.explanation || '') : '',
    correctPct: phase === 'reveal' ? correctPct : -1,
    votesCount: votes.length,
    phaseStartsAt,
    handover: handover.tv,
  }, [phase, currentRound, currentPlayerIdx, votes.length, players, phaseStartsAt, handover.tv?.playerId, handover.tv?.progress?.phase],
  !online || online.isHost);

  // Host: remote answers after the visible clock ran out are late (F12); seats on this device never are.
  const answerDeadline = useRef(Number.POSITIVE_INFINITY);
  const onTime = (sender: string, token: string) =>
    !needsDeadlineCheck(sender, hostSeats, clocksRun) || acceptInput({ deadline: answerDeadline.current, playerId: sender, sceneId: token, graceMs: 750 });
  const turnToken = `${phase}:${currentRound}:${currentPlayerIdx}`;
  const isTurn = (sender: string) => phase === 'statement' && sender === players[currentPlayerIdx]?.id && onTime(sender, turnToken);
  const hostId = online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id;

  const route = useOnlineAuthority(online, 'fakeorfact', turnToken, {
    handleClassicVote: { allow: (sender, args) => mode !== "three" && typeof args[0] === "boolean" && isTurn(sender), run: (...args) => handleClassicVote(args[0]), answer: true },
    handleThreeVote: { allow: (sender, args) => mode === "three" && Number.isInteger(args[0]) && args[0] >= 0 && args[0] < 3 && isTurn(sender), run: (...args) => handleThreeVote(args[0]), answer: true },
    advanceRound: { allow: (sender) => phase === "reveal" && sender === hostId, run: () => advanceRound() },
    playAgain: { allow: (sender) => phase === "gameOver" && sender === hostId, run: () => playAgain() },
  });

  function scoreAndAdvance(correct: boolean, answer: boolean | number | null = null) {
    timer.pause();
    // Credit the seat whose turn it is (validated by the authority: own seat, a 🔁 guest after handover, or the sender).
    const seat = currentPlayer?.id ?? route.actingSeat() ?? '';
    const nextVotes = recordAnswer(votes, { playerId: seat, correct, answer });
    setVotes(nextVotes);
    if (currentPlayerIdx + 1 >= players.length) {
      setPlayers(prev => settleQuizRound(prev, nextVotes));
      setPhase('reveal');
    } else {
      setCurrentPlayerIdx(i => i + 1);
      if (!online) setPhase('handoff');
      setPlayerVote(null); setPlayerThreeVote(null);
    }
  }
  const expire = useCallback(() => {
    if (phase === 'statement' && (!online || online.isHost)) scoreAndAdvance(false);
  }, [phase, currentPlayerIdx, votes, players, online?.isHost]);
  // Each seat (every 🔁 guest too) gets the full time; the clock stands while the phone is passed.
  const timer = useGameTimer(timerSec, expire, clocksRun);
  useEffect(() => {
    if (online && !online.isHost) return;
    if (phase === 'statement') { timer.reset(timerSec); timer.start(); }
    else timer.pause();
  }, [phase, currentRound, currentPlayerIdx, timerSec, online?.isHost]);
  useEffect(() => {
    answerDeadline.current = clocksRun ? deadline(serverClock.now(), timer.timeLeft * 1000 + 1000) : Number.POSITIVE_INFINITY;
  }, [timer.timeLeft, clocksRun]);
  // Host: a kicked/left player leaves the queue; if it was their turn it passes on (or the round settles).
  useRemovedPlayers(online, ids => {
    const drop = dropQuizPlayers({ phase, players, currentPlayerIdx, votes }, ids);
    if (!drop) return;
    setPlayers(drop.players); setVotes(drop.votes); setCurrentPlayerIdx(drop.currentPlayerIdx);
    if (drop.reveal) { timer.pause(); setPhase('reveal'); }
    if (drop.restartTurn) { timer.reset(timerSec); timer.start(); setPlayerVote(null); setPlayerThreeVote(null); }
  });

  function handleClassicVote(isTrue: boolean) {
    if (route("handleClassicVote", [isTrue])) return;
    setPlayerVote(isTrue);
    scoreAndAdvance(currentFact ? isTrue === currentFact.isTrue : false, isTrue);
  }

  function handleThreeVote(idx: number) {
    if (route("handleThreeVote", [idx])) return;
    setPlayerThreeVote(idx);
    scoreAndAdvance(currentThree ? idx === currentThree.trueIndex : false, idx);
  }

  function advanceRound() {
    if (route("advanceRound", [])) return;
    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }
    setCurrentRound(r => r + 1);
    setCurrentPlayerIdx(0);
    setPlayerVote(null);
    setPlayerThreeVote(null);
    setVotes([]);

    if (mode === 'three') {
      const next = threeIdx + 1;
      setThreeIdx(next);
      setCurrentThree(threeDeck[next % threeDeck.length]);
    } else {
      const next = factIdx + 1;
      setFactIdx(next);
      setCurrentFact(factDeck[next % factDeck.length]);
    }
    setPhase(online ? 'statement' : 'handoff');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('fake-or-fact', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  // Rematch: restart gameplay directly, keeping the SAME players and their
  // settings. Reshuffles a fresh deck and resets scoring for the current mode,
  // resets per-match counters/votes, then jumps straight to the first statement.
  function playAgain() {
    if (route("playAgain", [])) return;
    gameRecordedRef.current = false;
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0 })));
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
    setVotes([]);
    setPlayerVote(null);
    setPlayerThreeVote(null);

    if (mode === 'three') {
      const shuffled = shuffle(getTHREE_STATEMENTS());
      setThreeDeck(shuffled);
      setThreeIdx(0);
      setCurrentThree(shuffled[0]);
    } else {
      const shuffled = shuffle(getFACTS());
      setFactDeck(shuffled);
      setFactIdx(0);
      setCurrentFact(shuffled[0]);
    }
    setPhase(online ? 'statement' : 'handoff');
  }

  useOnlineSnapshot(online, 'game-state', publicQuizRound({ phase, currentRound, totalRounds, currentPlayerIdx, currentFact, currentThree, players, mode, playerVote, playerThreeVote, votes, timerSec, timeLeft: timer.timeLeft, phaseStartsAt }), data => {
    setTimerSec(data.timerSec); timer.reset(data.timeLeft);
    receivePhaseStart(data.phaseStartsAt);
    setPhase(data.phase);
    setCurrentRound(data.currentRound);
    setTotalRounds(data.totalRounds);
    setCurrentPlayerIdx(data.currentPlayerIdx);
    setCurrentFact(data.currentFact);
    setCurrentThree(data.currentThree);
    setPlayers(data.players);
    setMode(data.mode);
    const mine = data.votes.find((v: { playerId: string }) => v.playerId === online?.myPlayerId);
    setPlayerVote(online ? (typeof mine?.answer === 'boolean' ? mine.answer : null) : data.playerVote);
    setPlayerThreeVote(online ? (typeof mine?.answer === 'number' ? mine.answer : null) : data.playerThreeVote);
    setVotes(data.votes);
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  const mine = online ? votes.find(v => v.playerId === online.myPlayerId) : null;
  const displayVote = online ? (typeof mine?.answer === 'boolean' ? mine.answer : null) : playerVote;
  const displayThreeVote = online ? (typeof mine?.answer === 'number' ? mine.answer : null) : playerThreeVote;
  // Online: own seat, or a 🔁 guest only after they took the phone (never during the pass).
  const canAnswer = !online || deviceMayAnswer(currentPlayer?.id ?? null, online.myPlayerId, handover.activeGuest);
  const exitDialog = <ConfirmExitDialog {...exitGuard.dialogProps} accent="#78d9db" />;
  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (handover.overlay) return <>{handover.overlay}{exitDialog}</>; // phone in transit: only the opaque pass screen
  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="fakeorfact"
        modes={getTranslatedModes('fakeorfact', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title={t('games.fakeorfact.title')}
        onlinePlayers={online?.players}
      />
    );
  }

  const wasCorrect = mode === 'classic' && !!currentFact
    && (online ? mine?.correct === true : displayVote === currentFact.isTrue);
  const threeStatus = online && mode === 'three'
    ? (displayThreeVote === null ? t('games.fakeorfact.noAnswer') : mine?.correct ? t('games.fakeorfact.correct') : t('games.fakeorfact.wrong'))
    : null;

  return (
    <div data-phase={view} className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(150,160,165,0.6), 0 0 40px rgba(150,160,165,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      {blocker}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#78d9db]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#ede9dc]/8 rounded-full blur-[120px] pointer-events-none" />

      {view === 'handoff' && <div className="m-auto w-full max-w-lg space-y-6 p-6">
        <StageHeader title={currentPlayer?.name} eyebrow={t('games.findit.mapHandoffTo')} />
        <StagePanel><p>{t('games.fakeorfact.title')}</p></StagePanel>
        <StageAction className="w-full" onClick={() => setPhase('statement')}>{t('games.findit.mapReadyBtn')}</StageAction>
      </div>}

      {view === 'statement' && (
        <TurnStage player={currentPlayer} mine={canAnswer} guestHere={!!currentPlayer && handover.activeGuest === currentPlayer.id}
          round={currentRound} total={totalRounds} timeLeft={timer.timeLeft} timerSec={timerSec}
          marks={online ? turnMarks(players, votes, currentPlayerIdx, phase) : []} players={players} />
      )}

      <AnimatePresence mode="wait">
        {view === 'statement' && (
          <StatementPanel key={`statement-${currentRound}-${currentPlayerIdx}`} mode={mode} fact={currentFact} three={currentThree}
            turnKey={`${currentRound}-${currentPlayerIdx}`} canAnswer={canAnswer} waitingFor={currentPlayer} answered={!!mine}
            onClassic={handleClassicVote} onThree={handleThreeVote} />
        )}

        {view === 'reveal' && (
          <RevealPanel key="reveal" mode={mode} fact={currentFact} three={currentThree} wasCorrect={wasCorrect}
            displayVote={displayVote} threeStatus={threeStatus} correctPct={correctPct}
            seatRows={online ? localSeatResults(localSeats(online), players, votes) : []}
            canContinue={!online || online.isHost} onContinue={advanceRound} />
        )}

        {view === 'gameOver' && (
          <GameOverPanel key="gameOver" players={players} achievements={newAchievements} onDismiss={clearAchievements}
            canAgain={!online || online.isHost} onAgain={playAgain} onOtherGame={() => navigate('/games')} />
        )}
      </AnimatePresence>
      {exitDialog}
    </div>
  );
}

export default function FakeOrFactGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="fake-or-fact" className="newsroom-game"><FakeOrFactGameContent online={online} /></GameStage>;
}
