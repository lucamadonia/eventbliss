import { GameStage } from '../ui/GameStage';
import './design.css';
import { completeTruth } from './scoring';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flame, Heart, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { useGameTimer } from '../engine/TimerSystem';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { haptics } from '@/hooks/useHaptics';
import { getTRUTH_QUESTIONS, getDARE_CHALLENGES, type TruthQuestion, type DareChallenge } from './truthdare-content';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { dropTruthDarePlayers, scoreVote } from './removal';
import { PLAYER_COLORS, shuffle, getIntensityForRound, type Phase, type Player } from './game-model';
import { canActFor, seatRoster, truthDareActiveSeat, turnRole, voterOrder } from './turns';
import { TurnHeader } from './TurnHeader';
import { SpinPanel, ChoicePanel, VotePanel, GameOverPanel } from './TruthDarePanels';
import { RevealPanel } from './RevealPanel';

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Classic', desc: 'All categories mixed', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'eskalation', name: 'Escalation', desc: 'Gets wilder every round!', icon: <Flame className="w-6 h-6" /> },
  { id: 'nur-wahrheit', name: 'Truth Only', desc: 'Only questions, no dares', icon: <Heart className="w-6 h-6" /> },
  { id: 'nur-pflicht', name: 'Dare Only', desc: 'Only challenges, no questions', icon: <Shield className="w-6 h-6" /> },
];

type TFn = (key: string, fallback?: string) => string;

function getSetupSettings(t: TFn): SettingsConfig {
  return {
    timer: { min: 10, max: 120, default: 60, step: 5, label: t('games.truthdare.timerLabel', 'Dare Timer (Sec.)') },
    rounds: { min: 5, max: 30, default: 15, step: 1, label: t('games.setup.rounds', 'Rounds') },
  };
}

const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(150,160,165,0.6), 0 0 40px rgba(150,160,165,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;

function TruthDareGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Confirm-before-quit for the in-game header back button (active play only).
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);

  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt über
  // dem Pfeil im Spiel; ohne Back-Guard navigiert er mitten in der Runde weg.
  // Delegiert an denselben `exitGuard` wie der Pfeil → genau EIN Dialog.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [timerSec, setTimerSec] = useState(60);
  const [totalRounds, setTotalRounds] = useState(15);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  const [spinAngle, setSpinAngle] = useState(0);
  const [spinTarget, setSpinTarget] = useState(0);
  const [choiceType, setChoiceType] = useState<'truth' | 'dare' | null>(null);
  const [currentItem, setCurrentItem] = useState<TruthQuestion | DareChallenge | null>(null);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [voterIdx, setVoterIdx] = useState(0);

  const [truthDeck, setTruthDeck] = useState(() => shuffle(getTRUTH_QUESTIONS()));
  const turnQueue = useRef<number[]>([]);
  const [dareDeck, setDareDeck] = useState(() => shuffle(getDARE_CHALLENGES()));
  const truthPos = useMemo(() => ({ current: 0 }), []);
  const darePos = useMemo(() => ({ current: 0 }), []);

  // 🔁 guests (sharedDevice 'turns'): the chosen guest gets the host phone to choose and act,
  // each guest voter gets it for their vote; while it travels the dare clock stands still.
  const actingSeat = truthDareActiveSeat(phase, players, activeIdx, voterIdx);
  const handover = useSeatHandover(online, actingSeat);
  // All devices + TV switch phase together (design §9.3).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound]);

  const handleTimerExpire = useCallback(() => {
    if (online && (!online.isHost || online.isConnected === false)) return;
    if (choiceType === 'dare') { setVotes({}); setVoterIdx(0); setPhase('vote'); }
  }, [choiceType, online]);

  const timer = useGameTimer(timerSec, handleTimerExpire, (!online || (online.isHost && online.isConnected !== false)) && !handover.isPaused);
  useOnlineSnapshot(online, 'truthdare-clock-state', { timeLeft: timer.timeLeft }, data => timer.reset(data.timeLeft));

  const activePlayer = players[activeIdx];

  // NOTE: must come AFTER `timer` is declared (TDZ crash otherwise).
  useTVGameBridge('truthdare', {
    phase, phaseStartsAt, handover: handover.tv,
    currentRound, totalRounds, activeIdx,
    players: players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, score: p.score, truthCount: p.truthCount, dareCount: p.dareCount })),
    actingId: actingSeat,
    choiceType,
    task: currentItem?.text ?? '',
    timeLeft: timer.timeLeft,
    maxTime: timerSec,
    voteTally: {
      yes: Object.values(votes).filter(Boolean).length,
      no: Object.values(votes).filter((v) => !v).length,
    },
  }, [phase, phaseStartsAt, currentRound, activeIdx, choiceType, timer.timeLeft, votes, players, handover.tv?.playerId, handover.tv?.progress?.phase], !online || online.isHost);

  // Host-authoritative: the host device acts for its own seat AND its 🔁 guests (hostActor),
  // so every `allow` names the seat by turn order, never by myPlayerId.
  const hostId = online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id;
  const route = useOnlineAuthority(online, 'truthdare', `${phase}:${currentRound}:${activeIdx}:${voterIdx}`, {
    doSpin: { allow: (sender) => phase === "spin" && sender === hostId, run: () => doSpin() },
    handleChoice: { allow: (sender, args) => phase === "choice" && ["truth", "dare"].includes(args[0]) && sender === players[activeIdx]?.id, run: (...args) => handleChoice(args[0]), answer: true },
    rerollCurrent: { allow: (sender) => phase === "reveal" && sender === players[activeIdx]?.id, run: () => rerollCurrent() },
    startVote: { allow: (sender) => phase === "reveal" && sender === players[activeIdx]?.id, run: () => startVote() },
    castVote: { allow: (sender, args) => phase === "vote" && typeof args[0] === "boolean" && sender === voterOrder(players, activeIdx)[voterIdx]?.id, run: (...args) => castVote(args[0]), answer: true },
    nextRound: { allow: (sender) => ["choice", "reveal"].includes(phase) && sender === players[activeIdx]?.id, run: () => nextRound() },
    playAgain: { allow: (sender) => phase === "gameOver" && sender === hostId, run: () => playAgain() },
  });

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => {
    if (online && (!online.isHost || online.isConnected === false)) return;
    setPlayers(seatRoster(mapped, PLAYER_COLORS, !!online));
    setMode(selectedMode);
    setTimerSec(settings.timer);
    setTotalRounds(settings.rounds);
    setCurrentRound(1);
    setActiveIdx(0);
    setPhase('spin');
  };

  // Spin
  const spinPending = useRef(false);
  const spinRemaining = useRef(2800);
  const doSpin = () => {
    if (route("doSpin", [])) return;
    if (spinPending.current) return;
    spinPending.current = true;
    spinRemaining.current = 2800;
    if (!turnQueue.current.length) turnQueue.current = shuffle(players.map((_, i) => i));
    const target = turnQueue.current.shift()!;
    setSpinTarget(target);
    const extraSpins = 3 + Math.floor(Math.random() * 3);
    const sliceAngle = 360 / players.length;
    setSpinAngle((prev) => prev + extraSpins * 360 + target * sliceAngle + sliceAngle / 2);
  };
  useEffect(() => {
    if (!spinPending.current || phase !== 'spin' || (online && (!online.isHost || online.isConnected === false))) return;
    const started = Date.now();
    const timeout = setTimeout(() => {
      spinPending.current = false;
      setActiveIdx(spinTarget);
      setPhase('choice');
    }, spinRemaining.current);
    return () => {
      clearTimeout(timeout);
      spinRemaining.current = Math.max(0, spinRemaining.current - (Date.now() - started));
    };
  }, [spinAngle, spinTarget, phase, online?.isHost, online?.isConnected]);

  // Draw card
  const drawTruth = () => {
    const intensities = getIntensityForRound(mode, currentRound, totalRounds);
    const pool = truthDeck.filter((q) => intensities.includes(q.intensity));
    if (truthPos.current >= pool.length) truthPos.current = 0;
    setCurrentItem(pool[truthPos.current++ % pool.length]);
    setChoiceType('truth');
    setPhase('reveal');
  };

  const drawDare = () => {
    const intensities = getIntensityForRound(mode, currentRound, totalRounds);
    const pool = dareDeck.filter((q) => intensities.includes(q.intensity));
    if (darePos.current >= pool.length) darePos.current = 0;
    setCurrentItem(pool[darePos.current++ % pool.length]);
    setChoiceType('dare');
    timer.reset(timerSec);
    timer.start();
    setPhase('reveal');
  };

  const handleChoice = (type: 'truth' | 'dare') => {
    if (route("handleChoice", [type])) return;
    if (mode === 'nur-wahrheit') return drawTruth();
    if (mode === 'nur-pflicht') return drawDare();
    if (type === 'truth') drawTruth();
    else drawDare();
  };

  // Re-draw the same type without advancing the round ("Neue Aufgabe").
  const rerollCurrent = () => {
    if (route("rerollCurrent", [])) return;
    if (choiceType === 'truth') drawTruth();
    else if (choiceType === 'dare') drawDare();
  };

  // Vote — the others judge one after another, in roster order.
  const startVote = () => {
    if (route("startVote", [])) return;
    setVotes({});
    setVoterIdx(0);
    setPhase('vote');
    timer.pause();
  };

  const castVote = (yes: boolean) => {
    if (route("castVote", [yes])) return;
    const otherPlayers = voterOrder(players, activeIdx);
    // Credited by turn order: `allow` already pinned the sender (phone, host or the host's guest) to this seat.
    const voter = otherPlayers[voterIdx];
    if (!voter) return;
    setVotes((prev) => ({ ...prev, [voter.id]: yes }));
    if (voterIdx + 1 >= otherPlayers.length) {
      const allVotes = { ...votes, [voter.id]: yes };
      setPlayers((prev) => scoreVote(prev, activeIdx, allVotes, choiceType));
      advanceAfterVote();
    } else {
      setVoterIdx((v) => v + 1);
    }
  };

  // Next round
  const nextRound = () => {
    if (route("nextRound", [])) return;
    if (phase === 'reveal' && choiceType === 'truth') {
      setPlayers(prev => prev.map((p, i) => i === activeIdx ? completeTruth(p) : p));
    }
    advanceAfterVote();
  };
  const advanceAfterVote = () => {
    timer.pause();
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1);
    setChoiceType(null);
    setCurrentItem(null);
    setPhase('spin');
  };
  // Host: a kicked/left player leaves the wheel; their turn ends unscored, a vote waiting on them closes.
  useRemovedPlayers(online, ids => {
    const drop = dropTruthDarePlayers({ phase, players, activeIdx, spinTarget, turnQueue: turnQueue.current, votes, voterIdx, choiceType }, ids);
    if (!drop) return;
    turnQueue.current = drop.turnQueue;
    setPlayers(drop.players); setActiveIdx(drop.activeIdx); setSpinTarget(drop.spinTarget); setVotes(drop.votes); setVoterIdx(drop.voterIdx);
    if (drop.endTurn) { timer.pause(); advanceAfterVote(); }
  });

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('wahrheit-pflicht', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  // Preserve players and settings; reset scores and per-match counts.
  const playAgain = () => {
    if (route("playAgain", [])) return;
    setCurrentRound(1);
    setActiveIdx(0);
    setChoiceType(null);
    setCurrentItem(null);
    setVotes({});
    setVoterIdx(0);
    truthPos.current = 0;
    darePos.current = 0;
    turnQueue.current = [];
    setTruthDeck(shuffle(getTRUTH_QUESTIONS()));
    setDareDeck(shuffle(getDARE_CHALLENGES()));
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, truthCount: 0, dareCount: 0 })));
    gameRecordedRef.current = false;
    timer.reset(timerSec);
    setPhase('spin');
  };

  useOnlineSnapshot(online, 'game-state', { phase, phaseStartsAt, currentRound, totalRounds, activeIdx, choiceType, currentItem, players, mode, timerSec, votes, voterIdx, spinAngle, spinTarget }, data => {
    setPhase(data.phase);
    setCurrentRound(data.currentRound);
    setTotalRounds(data.totalRounds);
    setActiveIdx(data.activeIdx);
    setChoiceType(data.choiceType);
    setCurrentItem(data.currentItem);
    setPlayers(data.players);
    setMode(data.mode);
    setTimerSec(data.timerSec);
    setVotes(data.votes);
    setVoterIdx(data.voterIdx);
    setSpinAngle(data.spinAngle);
    setSpinTarget(data.spinTarget);
    receivePhaseStart(data.phaseStartsAt);
  });

  const drink = () => {
    const d = drinkingMode.recordDrink();
    if (d) {
      haptics.warning();
      setDisclaimer(d);
      setTimeout(() => setDisclaimer(null), 5000);
    }
    nextRound();
  };

  // Render
  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  if (handover.overlay) return <>{handover.overlay}<ConfirmExitDialog {...exitGuard.dialogProps} accent="#f09a8a" /></>; // phone in transit: only the opaque pass screen
  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="truthdare"
        modes={getTranslatedModes('truthdare', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))}
        settings={getSetupSettings((key, fallback) => t(key, { defaultValue: fallback }))}
        onStart={handleStart}
        title={t('games.truthdare.gameTitle', 'Truth or Dare 2.0')}
        minPlayers={2}
        maxPlayers={20}
        onlinePlayers={online?.players}
      />
    );
  }

  // Who acts in the shown phase, and may this device act for them (own seat or a 🔁 guest)?
  const seats = online ? localSeats(online) : null;
  const viewSeatId = truthDareActiveSeat(view, players, activeIdx, voterIdx);
  const viewSeat = players.find(p => p.id === viewSeatId);
  const role = turnRole(view, choiceType);
  const mine = canActFor(viewSeatId, seats);
  const voters = voterOrder(players, activeIdx);

  return (
    <div data-phase={view} className="relative min-h-[100dvh] bg-[#060810] text-white flex flex-col font-game">
      <style>{EP_STYLE}</style>{blocker}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#f09a8a]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#ff6b98]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#44484f]/20">
        {/* In der App liegt der FloatingBackButton genau auf diesem Pfeil — dort nur unsichtbar
            schalten: der Platzhalter hält die Kopfzeile im Gleichgewicht. */}
        <button
          onClick={() => (view === 'gameOver' ? navigate('/games') : exitGuard.request())}
          className={`p-2 text-[#a8abb3] hover:text-white${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-[0.8125rem] font-semibold text-[#a8abb3] tabular-nums">
          {t('games.truthdare.roundHeader', { current: currentRound, total: totalRounds })}
        </div>
        <div className="px-3 py-1 rounded-full glass-card border border-[#44484f]/30 text-sm font-bold text-[#f09a8a]">
          {mode === 'eskalation' ? <Flame className="w-4 h-4 inline" /> : null} {t(`gameModes.truthdare.${mode}.name`)}
        </div>
      </div>

      {viewSeat && role && (
        <div className="px-4 pt-4">
          <TurnHeader seat={viewSeat} role={role} isMe={!!online && mine} subject={role === 'vote' ? activePlayer : undefined} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'spin' && (
          <SpinPanel key="spin" players={players} spinAngle={spinAngle} canSpin={!online || online.isHost} onSpin={doSpin} />
        )}
        {view === 'choice' && activePlayer && (
          <ChoicePanel key="choice" player={activePlayer} mode={mode} canAct={mine} isDrinkingMode={isDrinkingMode}
            onChoose={handleChoice} onDrink={drink} disclaimer={disclaimer} drinkCount={drinkingMode.drinkCount} />
        )}
        {view === 'reveal' && currentItem && activePlayer && (
          <RevealPanel key="reveal" item={currentItem} choiceType={choiceType} player={activePlayer}
            others={voters} timeLeft={timer.timeLeft} canAct={mine}
            onDone={choiceType === 'dare' ? startVote : nextRound} onReroll={rerollCurrent} />
        )}
        {view === 'vote' && activePlayer && (
          <VotePanel key="vote" subject={activePlayer} voters={voters} voterIdx={voterIdx} canVote={mine}
            isDrinkingMode={isDrinkingMode} onVote={castVote} />
        )}
        {view === 'gameOver' && players.length > 0 && (
          <GameOverPanel key="over" players={players} achievements={newAchievements} onDismissAchievements={clearAchievements}
            canAgain={!online || online.isHost} onAgain={playAgain} onOtherGame={() => navigate('/games')} />
        )}
      </AnimatePresence>
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#f09a8a" />
    </div>
  );
}

export default function TruthDareGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="wahrheit-pflicht" className="split-game"><TruthDareGameContent online={online} /></GameStage>;
}
