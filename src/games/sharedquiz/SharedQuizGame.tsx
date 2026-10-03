import { KnowledgeStage } from './KnowledgeStage';
import { GameStage } from '../ui/GameStage';
import { sharedRoundPoints } from './rules';
import { sharedQuizSnapshotFor, sharedQuizTVQuestion } from './private-state';
import { useOnlineAuthority, usePrivateSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { removeFromSharedQuiz } from './roster-change';
import { RoleBadge, PlayerScreen, HandoffScreen } from './LocalScreens';
import { OnlinePlayStage } from './OnlinePlayStage';
import { RevealPanel, GameOverPanel } from './ResultScreens';
import { SetupPanel } from './SetupScreen';
import { useSharedQuizGuests } from './useSharedQuizGuests';
import { useGuestHandover } from '../ui/useGuestHandover';
import { localActiveSeats } from '../ui/guest-handover';
import { usePhaseGate } from '../party/usePhaseGate';
import { planPhaseStart } from '../party/phase-gate';
import { serverClock } from '../party/scene-clock';
import { useTranslation } from "react-i18next";
import { useState, useMemo, useRef, useEffect } from 'react';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Users, MessageCircle, Lightbulb, HelpCircle, Link, Crown,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { personalResult } from '../social/result';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import { getSHARED_QUIZ_QUESTIONS, type SharedQuizQuestion } from './sharedquiz-content';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mode = 'trio' | 'chain' | 'allornothing';
type Phase =
  | 'setup'
  | 'roundIntro'
  | 'playerA'
  | 'handoffAB'
  | 'playerB'
  | 'handoffBC'
  | 'playerC'
  | 'reveal'
  | 'gameOver';

interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

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

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SharedQuizGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const resolvedNames = onlinePlayerNames.length >= 3
    ? onlinePlayerNames
    : partyPlayerNames.length >= 3
      ? partyPlayerNames
      : [];
  const initialPlayers: Player[] = resolvedNames.length >= 3
    ? resolvedNames.map((name, i) => ({ id: online?.players[i]?.id ?? partyRoster[i]?.id ?? `p${i + 1}`, name, color: getPlayerColor(i), score: 0 }))
    : [
        { id: 'p1', name: t('games.sharedquiz.defaultPlayer', { n: 1 }), color: getPlayerColor(0), score: 0 },
        { id: 'p2', name: t('games.sharedquiz.defaultPlayer', { n: 2 }), color: getPlayerColor(1), score: 0 },
        { id: 'p3', name: t('games.sharedquiz.defaultPlayer', { n: 3 }), color: getPlayerColor(2), score: 0 },
      ];
  /* ---- Setup ---- */
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [mode, setMode] = useState<Mode>('trio');
  const [totalRounds, setTotalRounds] = useState(10);

  /* ---- Game state ---- */
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
  const [round, setRound] = useState(1);
  const deck = useRef<SharedQuizQuestion[]>(shuffle(getSHARED_QUIZ_QUESTIONS()));
  const deckPos = useRef(0);
  const [currentQ, setCurrentQ] = useState<SharedQuizQuestion | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roleIndices, setRoleIndices] = useState<[number, number, number]>([0, 1, 2]);

  // 🔁-Gaeste am Host-Handy: jede Rolle nur verdeckt fuer den, der sie hat (guest-roles.ts).
  // Das Spiel hat keine Uhr — darum kein „Uhr angehalten“-Hinweis.
  const handover = useGuestHandover(online, { secret: true, clockPaused: false });
  const localSeats = useMemo(() => localActiveSeats(online), [online]);
  const guests = useSharedQuizGuests({
    handover, active: !!online && phase === 'playerC', mode, round, players, roleIndices,
    answered: teamAnswers.length, localSeats, ownSeat: online?.myPlayerId,
  });
  useEffect(() => { if (phase === 'setup' || phase === 'gameOver') handover.cancel(); }, [phase, handover.cancel]);

  // Gemeinsamer Phasenstart (Design §9): online plant der Host jeden Wechsel mit
  // Vorlauf; Handys (Schnappschuss) und TV (Bridge) wechseln zur selben Serverzeit.
  const [remotePhaseStartsAt, setRemotePhaseStartsAt] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plannedPhaseStart = useMemo(() => (online ? planPhaseStart() : serverClock.now()), [phase, round]);
  const phaseStartsAt = online && !online.isHost ? remotePhaseStartsAt : plannedPhaseStart;
  const gate = usePhaseGate(phase, online ? phaseStartsAt : null);

  useTVGameBridge('sharedquiz', {
    phase, phaseStartsAt, round, totalRounds, roleIndices,
    // Volle Identitaet fuer den Fernseher — Rollen-Infos erst in der Aufloesung.
    players: players.map(p => ({ ...p, avatar: online?.players.find(o => o.id === p.id)?.avatar })),
    handover: handover.tv,
    ...sharedQuizTVQuestion(phase, currentQ),
  }, [phase, round, selectedAnswer, roleIndices, phaseStartsAt, handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''], !online || online.isHost);

  /* ---- Player management ---- */
  const nextId = useRef(4);
  const addPlayer = () => {
    if (players.length >= 10) return;
    const i = players.length;
    setPlayers(p => [...p, { id: `p${nextId.current++}`, name: t('games.sharedquiz.defaultPlayer', { n: i + 1 }), color: getPlayerColor(i), score: 0 }]);
  };
  const removePlayer = (id: string) => {
    if (players.length <= 3) return;
    setPlayers(p => p.filter(x => x.id !== id));
  };
  const updateName = (id: string, name: string) => {
    setPlayers(p => p.map(x => x.id === id ? { ...x, name } : x));
  };
  const isOnlineOrParty = resolvedNames.length >= 3;
  const handleImportNames = (names: string[]) => {
    const capped = names.slice(0, 10);
    const roster: Player[] = capped.map((n, i) => ({
      id: `p${nextId.current++}`,
      name: n,
      color: getPlayerColor(i),
      score: 0,
    }));
    while (roster.length < 3) {
      const i = roster.length;
      roster.push({ id: `p${nextId.current++}`, name: t('games.sharedquiz.defaultPlayer', { n: i + 1 }), color: getPlayerColor(i), score: 0 });
    }
    setPlayers(roster);
  };

  /* ---- Draw question ---- */
  function drawQuestion(): SharedQuizQuestion {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(getSHARED_QUIZ_QUESTIONS());
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Role players ---- */
  const playerA = players[roleIndices[0] % players.length];
  const playerB = players[roleIndices[1] % players.length];
  const playerC = players[roleIndices[2] % players.length];

  const route = useOnlineAuthority(online, 'sharedquiz', `${phase}:${round}:${teamAnswers.length}`, {
    startGame: { allow: (sender, args) => phase === "setup" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => startGame() },
    handleAnswer: { answer: true, allow: (sender, args) => phase === "playerC" && sender === players[roleIndices[mode === 'trio' ? 2 : teamAnswers.length]]?.id && Number.isInteger(args[0]) && args[0] >= 0 && args[0] < 4, run: (...args) => handleAnswer(args[0]) },
    playAgain: { allow: (sender, args) => phase === "gameOver" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => playAgain() },
    nextRound: { allow: (sender, args) => phase === "reveal" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => nextRound() },
    advancePhase: { allow: (sender, args) => sender === players[roleIndices[phase === "playerB" || phase === "handoffAB" ? 1 : phase === "handoffBC" ? 2 : 0]]?.id && ["roundIntro", "playerA", "handoffAB", "playerB", "handoffBC"].includes(phase), run: (...args) => advancePhase() },
  });

  function advancePhase() {
    if (route('advancePhase')) return;
    const next: Partial<Record<Phase, Phase>> = { roundIntro: 'playerA', playerA: 'handoffAB', handoffAB: 'playerB', playerB: 'handoffBC', handoffBC: 'playerC' };
    if (next[phase]) setPhase(next[phase]!);
  }

  /* ---- Start game ---- */
  function startGame() {
    if (route("startGame", [])) return;
    const reset = players.map(p => ({ ...p, score: 0 }));
    setPlayers(reset);
    deck.current = shuffle(getSHARED_QUIZ_QUESTIONS());
    deckPos.current = 0;
    setRound(1);
    setRoleIndices([0, 1, 2]);
    startRound([0, 1, 2]);
  }

  function startRound(indices: [number, number, number]) {
    setCurrentQ(drawQuestion());
    setSelectedAnswer(null);
    setTeamAnswers([]);
    setRoleIndices(indices);
    setPhase(online || mode !== 'trio' ? 'playerC' : 'roundIntro');
  }

  /* ---- Answer ---- */
  function handleAnswer(idx: number) {
    if (route("handleAnswer", [idx])) return;
    if (mode !== 'trio') {
      const submitted = [...teamAnswers, idx];
      setTeamAnswers(submitted);
      if (submitted.length < 3) return;
      const correctCount = submitted.filter(answer => answer === currentQ?.correctIndex).length;
      const points = sharedRoundPoints(mode, submitted, currentQ?.correctIndex ?? -1);
      setPlayers(prev => prev.map((p, i) => roleIndices.includes(i) ? { ...p, score: p.score + points } : p));
      setSelectedAnswer(points > 0 ? currentQ?.correctIndex ?? idx : -1);
      setPhase('reveal');
      return;
    }
    setSelectedAnswer(idx);
    setPhase('reveal');
    if (currentQ && idx === currentQ.correctIndex) {
      setPlayers(prev => prev.map((p, i) => {
        const isRole = [roleIndices[0] % players.length, roleIndices[1] % players.length, roleIndices[2] % players.length].includes(i);
        return isRole ? { ...p, score: p.score + 1 } : p;
      }));
    }
  }

  /* ---- Rematch: same roster and settings, fresh scores and questions ---- */
  function playAgain() {
    if (route("playAgain", [])) return;
    gameRecordedRef.current = false;
    setPlayers(previous => previous.map(player => ({ ...player, score: 0 })));
    deck.current = shuffle(getSHARED_QUIZ_QUESTIONS());
    deckPos.current = 0;
    setRound(1);
    startRound([0, 1, 2]);
  }

  /* ---- Next round ---- */
  function nextRound() {
    if (route("nextRound", [])) return;
    if (round >= totalRounds) { setPhase('gameOver'); return; }
    const next: [number, number, number] = [
      (roleIndices[0] + 1) % players.length,
      (roleIndices[1] + 1) % players.length,
      (roleIndices[2] + 1) % players.length,
    ];
    setRound(r => r + 1);
    startRound(next);
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const result = personalResult(players, online?.myPlayerId);
      recordEnd('geteilt-gequizzt', result.score, result.won);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Sorted players for results ---- */
  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  /* ---- Mode info ---- */
  const modes: { id: Mode; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'trio', name: t('gameModes.sharedquiz.trio.name'), desc: t('gameModes.sharedquiz.trio.desc'), icon: <Users className="w-6 h-6" /> },
    { id: 'chain', name: t('gameModes.sharedquiz.chain.name'), desc: t('gameModes.sharedquiz.chain.desc'), icon: <Link className="w-6 h-6" /> },
    { id: 'allornothing', name: t('gameModes.sharedquiz.allornothing.name'), desc: t('gameModes.sharedquiz.allornothing.desc'), icon: <Crown className="w-6 h-6" /> },
  ];

  const isCorrect = currentQ && selectedAnswer === currentQ.correctIndex;

  usePrivateSnapshot(online, 'sharedquiz-state', { phase, phaseStartsAt, round, totalRounds, roleIndices, currentQ, players, mode, selectedAnswer, teamAnswers }, sharedQuizSnapshotFor, data => {
    setPhase(data.phase);
    setRemotePhaseStartsAt(typeof data.phaseStartsAt === 'number' ? data.phaseStartsAt : null);
    setRound(data.round);
    setTotalRounds(data.totalRounds);
    setRoleIndices(data.roleIndices);
    setCurrentQ(data.currentQ);
    setPlayers(data.players);
    setMode(data.mode);
    setSelectedAnswer(data.selectedAnswer);
    setTeamAnswers(data.teamAnswers ?? []);
  });

  // Host entfernt jemanden mitten im Spiel: Rolle weitergeben statt haengen (Masterplan 6.6).
  useRemovedPlayers(online, ids => {
    const change = removeFromSharedQuiz({ players, roleIndices, phase, mode, teamAnswers }, ids);
    if (!change.changed) return;
    setPlayers(change.state.players);
    setRoleIndices(change.state.roleIndices);
    setTeamAnswers(change.state.teamAnswers);
  });

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  // Gerendert wird die GEZEIGTE Phase (usePhaseGate), damit alle Geraete gleichzeitig wechseln.
  const view = gate.shown;
  const renderPhase = () => {

  if (handover.overlay) return <>{handover.overlay}<ConfirmExitDialog {...exitGuard.dialogProps} /></>;
  if (view === 'playerC' && currentQ && (online || mode !== 'trio')) {
    return <OnlinePlayStage mode={mode} q={currentQ} players={players} roleIndices={roleIndices} answered={teamAnswers.length}
      round={round} totalRounds={totalRounds} myId={online?.myPlayerId} handover={handover} guests={guests} onAnswer={handleAnswer}>
      <ConfirmExitDialog {...exitGuard.dialogProps} />
    </OnlinePlayStage>;
  }
  if (view === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  return (
    <GameStage gameId="geteilt-gequizzt" className="knowledge-stage relative flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-cyan { text-shadow: 0 0 20px rgba(143,245,255,0.6), 0 0 40px rgba(143,245,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="hidden absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />

      {view === 'setup' && (
        <SetupPanel players={players} locked={!!online} onAdd={addPlayer} onRemove={removePlayer} onRename={updateName}
          onImportNames={isOnlineOrParty ? undefined : handleImportNames} modes={modes} mode={mode} onMode={setMode}
          totalRounds={totalRounds} onRounds={setTotalRounds} onStart={startGame} onBack={() => navigate('/games')} />
      )}

      {/* ---- ROUND INTRO ---- */}
      {view === 'roundIntro' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="knowledge-handoff flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8ff5ff]">{t('games.sharedquiz.roundLabel', { round, total: totalRounds })}</span>
          </div>
          <h2 className="text-2xl font-extrabold font-sans text-white text-center">{t('games.sharedquiz.roleDistribution')}</h2>
          <div className="w-full max-w-sm space-y-3">
            <RoleBadge icon={<HelpCircle className="w-5 h-5" />} label={t('games.sharedquiz.roleQuestion')} player={playerA} />
            <RoleBadge icon={<MessageCircle className="w-5 h-5" />} label={t('games.sharedquiz.roleAnswers')} player={playerB} />
            <RoleBadge icon={<Lightbulb className="w-5 h-5" />} label={t('games.sharedquiz.roleHint')} player={playerC} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={advancePhase}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-3 rounded-full font-extrabold text-lg shadow-[0_0_20px_rgba(143,245,255,0.25)]">
            {t('games.sharedquiz.letsGo')} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- PLAYER A: Question ---- */}
      {view === 'playerA' && currentQ && (
        <PlayerScreen name={playerA.name} color={playerA.color} instruction={t('games.sharedquiz.readQuestion')}
          onNext={advancePhase}>
          <div className="text-center">
            <div className="text-xs font-bold text-[#8ff5ff] uppercase tracking-widest mb-3">{t('games.sharedquiz.roleQuestion')}</div>
            <div className="text-2xl font-extrabold font-sans text-white leading-tight">{currentQ.question}</div>
          </div>
        </PlayerScreen>
      )}

      {/* ---- HANDOFF A->B ---- */}
      {view === 'handoffAB' && (
        <HandoffScreen from={playerA.name} to={playerB.name} toColor={playerB.color}
          onContinue={advancePhase} />
      )}

      {/* ---- PLAYER B: Answers ---- */}
      {view === 'playerB' && currentQ && (
        <PlayerScreen name={playerB.name} color={playerB.color} instruction={t('games.sharedquiz.readAnswers')}
          onNext={advancePhase}>
          <div>
            <div className="text-xs font-bold text-[#8ff5ff] uppercase tracking-widest mb-3 text-center">{t('games.sharedquiz.roleAnswers')}</div>
            <div className="space-y-2">
              {currentQ.answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-[#44484f]/20 rounded-[1rem] px-4 py-3">
                  <span className="w-8 h-8 rounded-full bg-[#8ff5ff]/20 text-[#8ff5ff] flex items-center justify-center font-bold text-sm">{ANSWER_LABELS[i]}</span>
                  <span className="text-white font-semibold">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </PlayerScreen>
      )}

      {/* ---- HANDOFF B->C ---- */}
      {view === 'handoffBC' && (
        <HandoffScreen from={playerB.name} to={playerC.name} toColor={playerC.color}
          onContinue={advancePhase} />
      )}

      {/* ---- PLAYER C: Hint + Answer Selection ---- */}
      {view === 'playerC' && currentQ && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: playerC.color }}>{getPlayerInitial(playerC.name)}</div>
            <span className="text-white font-bold">{playerC.name}</span>
          </div>
          <div className="w-full rounded-[1rem] bg-[#151a21]/80 backdrop-blur-xl border border-[#44484f]/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{t('games.sharedquiz.hintLabel')}</span>
            </div>
            <p className="text-white/80 text-base leading-relaxed">{currentQ.hint}</p>
          </div>
          <p className="text-white/40 text-sm">{t('games.sharedquiz.readHintAndAnswer')}</p>
          <div className="w-full space-y-2">
            {currentQ.answers.map((a, i) => (
              <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => handleAnswer(i)}
                className="w-full flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 hover:border-[#8ff5ff]/40 rounded-[1rem] px-4 py-3 transition-colors">
                <span className="w-8 h-8 rounded-full bg-[#8ff5ff]/20 text-[#8ff5ff] flex items-center justify-center font-bold text-sm">{ANSWER_LABELS[i]}</span>
                <span className="text-white font-semibold">{a}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {view === 'reveal' && currentQ && (
        <RevealPanel currentQ={currentQ} isCorrect={!!isCorrect} mode={mode} teamAnswers={teamAnswers} players={players}
          roleIndices={roleIndices} selectedAnswer={selectedAnswer} canAdvance={!online || online.isHost} onNext={nextRound} lastRound={round >= totalRounds} />
      )}
      {view === 'gameOver' && (
        <GameOverPanel sorted={sorted} achievements={newAchievements} onDismiss={clearAchievements}
          canRestart={!online || online.isHost} onPlayAgain={playAgain} onOtherGame={() => navigate('/games')} />
      )}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#8ff5ff" />
    </GameStage>
  );
  };

  return <>
    {renderPhase()}
    {/* Einblend-Takt (Design §9): Eingaben erst ab 1200 ms nach dem Wechsel; Weitergabe (z-90) bleibt bedienbar. */}
    {!gate.inputOpen && <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />}
  </>;
}
