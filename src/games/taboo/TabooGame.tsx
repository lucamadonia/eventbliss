import './taboo-presentation.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useOnlineActions, OnlineWaiting } from '../bottlespin/online-controller';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { useGameTimer } from '../engine/TimerSystem';
import { getTabooCards, type TabooCard } from '../content/taboo-words';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { haptics } from '@/hooks/useHaptics';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { dropTabooPlayers, teamIndexOf } from './removal';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { localActiveSeats, localGuestIds } from '../ui/guest-handover';
import { mayHolderSeeCard, phoneHolder, tabooHandoverSeat, tabooRoles, tabooSeat, tabooSeatRole, tabooSnapshotFor, tabooTvPlayers, tabooTvState, turnClosed } from './taboo-seats';
import { useTabooSync } from './useTabooSync';
import { PlayingScreen, TurnStartScreen } from './TabooScreens';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Team { name: string; color: string; textColor: string; borderColor: string; players: string[]; score: number; ids?: string[] }
type CardResult = { card: TabooCard; result: 'correct' | 'taboo' | 'skipped' };
type Phase = 'setup' | 'turnStart' | 'playing' | 'turnSummary' | 'gameOver';

/* ------------------------------------------------------------------ */
/*  Buzzer Sound via Web Audio API                                     */
/* ------------------------------------------------------------------ */

const audioCtxRef = { current: null as AudioContext | null };
function playBuzzer() {
  try {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  } catch { /* silent fallback */ }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Electric Pulse Styles                                              */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TabooGameProps { players?: string[]; onClose?: () => void; online?: OnlineGameProps }

export default function TabooGame({ players = [], onClose, online }: TabooGameProps) {
  const { t } = useTranslation();
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);
  const [timerOption, setTimerOption] = useState(60);
  const [totalRounds, setTotalRounds] = useState(2);
  // Auto-populate from online room players if available
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyPlayerNames = (useInitialRoster() ?? []).map((p) => p.name);
  const initialPlayers = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : players;
  const [phase, setPhase] = useState<Phase>('setup');

  const navigate = useNavigate();
  // GamesHub reicht `onClose` für dieses Spiel NICHT durch (die Knöpfe auf
  // Setup/Endstand sind dort deshalb gar nicht sichtbar) — dann ist `/games`
  // das Ziel.
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
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers);
  const [teams, setTeams] = useState<[Team, Team]>(buildTeams(initialPlayers));
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [explainerIdx, setExplainerIdx] = useState<[number, number]>([0, 0]);
  const [currentRound, setCurrentRound] = useState(1);
  const deck = useRef<TabooCard[]>(shuffle(getTabooCards()));
  const deckPos = useRef(0);
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [turnResults, setTurnResults] = useState<CardResult[]>([]);
  const [cardKey, setCardKey] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const activeTeam = teams[activeTeamIdx];
  const explainer = activeTeam.players[explainerIdx[activeTeamIdx]];

  // Party-Play (sharedDevice 'turns' + verdeckte Weitergabe): Erklaerer und Schiri
  // je Zug; ein 🔁-Gast in einer dieser Rollen bekommt das Host-Handy. Die Karte
  // haengt am HALTER des Handys, nie am Besitzer (taboo-seats.ts).
  const roles = useMemo(() => tabooRoles(teams, activeTeamIdx, explainerIdx, online?.players), [teams, activeTeamIdx, explainerIdx, online?.players]);
  const localIds = useMemo(() => localActiveSeats(online), [online]);
  const guestIds = useMemo(() => localGuestIds(online), [online]);
  const handover = useSeatHandover(online, online ? tabooHandoverSeat(phase, roles, id => guestIds.includes(id), id => id === online.myPlayerId || localIds.includes(id)) : null, { secret: true });
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound, activeTeamIdx]);
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false && !handover.isPaused);

  const handleTimerExpire = useCallback(() => { if (!online || online.isHost) setPhase('turnSummary'); }, [online?.isHost]);
  // Die Zuguhr steht, solange das Handy wandert, und laeuft erst mit dem gemeinsamen Phasenstart.
  const timer = useGameTimer(timerOption, handleTimerExpire, online?.isConnected !== false && !handover.isPaused && (!online || !blocker));

  const explainerSeat = online && roles.explainerId ? tabooSeat(roles.explainerId, explainer ?? '', activeTeamIdx as 0 | 1, online.players) : tabooSeat(explainer ?? '', explainer ?? '', activeTeamIdx as 0 | 1);
  const tvPayload = useMemo(() => tabooTvState({ phase, phaseStartsAt, currentRound, totalRounds, teams, activeTeamIdx, explainer: online ? explainerSeat : explainer ?? '',
    timeLeft: timer.timeLeft, turnResults, players: tabooTvPlayers(teams, online?.players), handover: handover.tv }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [phase, phaseStartsAt, currentRound, totalRounds, teams, activeTeamIdx, JSON.stringify(explainerSeat), timer.timeLeft, turnResults, online?.players, JSON.stringify(handover.tv ?? null)]);
  useEffect(() => { if (online?.isHost) online.broadcast('tv-state', { game: 'taboo', ...tvPayload }); }, [online?.isHost, tvPayload]); // eslint-disable-line react-hooks/exhaustive-deps
  useTVGameBridge('taboo', {
    ...tvPayload,
    partyScoresById: online ? Object.fromEntries(online.players.map((p, i) => [p.id, teams[teamIndexOf(teams, p.id, i, online.players.length)].score])) : undefined,
  }, [phase, currentRound, activeTeamIdx, timer.timeLeft, turnResults.length, teams[0].score, teams[1].score, phaseStartsAt, handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''], !online || online.isHost);
  useEffect(() => { if (online && view !== 'setup') haptics.light(); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // `ids` (online only, never shuffled) keep each seat tied to its room player when players are removed mid-match.
  function buildTeams(pls: string[], ids?: string[]): [Team, Team] {
    const s = online ? pls : shuffle(pls); const mid = Math.ceil(s.length / 2);
    return [
      { name: 'Team A', color: 'bg-[#ff8572]', textColor: 'text-[#ff8572]', borderColor: 'border-[#ff8572]', players: s.slice(0, mid), score: 0, ...(ids && { ids: ids.slice(0, mid) }) },
      { name: 'Team B', color: 'bg-[#e6ce81]', textColor: 'text-[#e6ce81]', borderColor: 'border-[#e6ce81]', players: s.slice(mid), score: 0, ...(ids && { ids: ids.slice(mid) }) },
    ];
  }

  function addPlayer() {
    const next = [...playerNames, ''];
    setPlayerNames(next);
    setTeams(buildTeams(next));
  }

  function removePlayer(idx: number) {
    const next = playerNames.filter((_, i) => i !== idx);
    setPlayerNames(next);
    setTeams(buildTeams(next));
  }

  function renamePlayer(idx: number, name: string) {
    const next = playerNames.map((n, i) => (i === idx ? name : n));
    setPlayerNames(next);
    setTeams(buildTeams(next));
  }

  const isOnlineOrParty = onlinePlayerNames.length >= 2 || partyPlayerNames.length >= 2;

  function handleImportNames(names: string[]) {
    // Replace entire roster with imported names (drop existing incl. placeholders).
    // Pad to minimum 2 with empty strings if fewer than 2 are supplied.
    const imported = names.slice(0, 20);
    const padded: string[] = imported.length >= 2 ? imported : [...imported, ...Array(2 - imported.length).fill('')];
    setPlayerNames(padded);
    setTeams(buildTeams(padded));
  }

  const canStart = teams[0].players.length >= 2 && teams[1].players.length >= 2 && playerNames.every(name => name.trim());

  function drawCard(): TabooCard {
    if (deckPos.current >= deck.current.length) { deck.current = shuffle(getTabooCards()); deckPos.current = 0; }
    return deck.current[deckPos.current++];
  }

  function startTurn() { setTurnResults([]); setCountdown(3); }
  useEffect(() => {
    if (phase !== 'turnStart' || countdown !== null || (online && !online.isHost)) return;
    const pending = setTimeout(startTurn, 30000);
    return () => clearTimeout(pending);
  }, [phase, countdown, activeTeamIdx, currentRound]);

  useEffect(() => {
    if (countdown === null || (online && !online.isHost)) return;
    if (countdown === 0) {
      setCountdown(null); setCurrentCard(drawCard()); setCardKey(k => k + 1); timer.reset(timerOption); timer.start(); setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function handleCorrect() {
    if (!currentCard) return;
    setTurnResults(r => [...r, { card: currentCard, result: 'correct' }]);
    const next = drawCard(); setCurrentCard(next); setCardKey(k => k + 1);
  }

  function handleTaboo() {
    if (!currentCard) return;
    playBuzzer(); navigator.vibrate?.([300]);
    setShowFlash(true); setTimeout(() => setShowFlash(false), 350);
    setTurnResults(r => [...r, { card: currentCard, result: 'taboo' }]); setCurrentCard(drawCard()); setCardKey(k => k + 1);
    if (isDrinkingMode) {
      const d = drinkingMode.recordDrink();
      if (d) {
        setTimeout(() => {
          haptics.warning();
          setDisclaimer(d);
          setTimeout(() => setDisclaimer(null), 5000);
        }, 600);
      }
    }
  }

  function handleSkip() {
    if (!currentCard) return;
    setTurnResults(r => [...r, { card: currentCard, result: 'skipped' }]);
    const next = drawCard(); setCurrentCard(next); setCardKey(k => k + 1);
  }

  function endTurn() {
    timer.pause();
    const correct = turnResults.filter(r => r.result === 'correct').length;
    const taboo = turnResults.filter(r => r.result === 'taboo').length;
    const points = correct - taboo;
    setTeams(prev => { const c: [Team, Team] = [{ ...prev[0] }, { ...prev[1] }]; c[activeTeamIdx].score += points; return c; });
    setExplainerIdx(prev => { const c: [number, number] = [...prev]; c[activeTeamIdx] = (c[activeTeamIdx] + 1) % teams[activeTeamIdx].players.length; return c; });
    const nextTeamIdx = activeTeamIdx === 0 ? 1 : 0;
    if (nextTeamIdx === 0) { if (currentRound >= totalRounds) { setPhase('gameOver'); return; } setCurrentRound(r => r + 1); }
    setActiveTeamIdx(nextTeamIdx); setPhase('turnStart');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !recordedRef.current) {
      recordedRef.current = true;
      const winnerScore = Math.max(teams[0].score, teams[1].score);
      const myIndex = online?.players.findIndex(p => p.id === online.myPlayerId) ?? -1;
      const myTeam = online && myIndex >= 0 ? teams[teamIndexOf(teams, online.myPlayerId, myIndex, online.players.length)] : null;
      recordEnd('taboo', myTeam?.score ?? winnerScore, !online || myTeam?.score === winnerScore);
    }
    if (phase === 'setup') recordedRef.current = false;
  }, [phase]);

  // Return to setup (lets players/teams/settings be changed). Rebuilds teams
  // from the current roster, which resets scores to 0.
  function resetGame() {
    setTeams(buildTeams(playerNames)); setActiveTeamIdx(0); setExplainerIdx([0, 0]); setCurrentRound(1);
    setTurnResults([]); setCurrentCard(null); deck.current = shuffle(getTabooCards()); deckPos.current = 0; timer.reset(timerOption); setPhase('setup');
  }

  // A rematch keeps the teams and settings, with fresh match scores.
  function playAgain() {
    recordedRef.current = false;
    // A team emptied by removals is refilled from the remaining players for the rematch.
    setTeams(prev => prev.some(team => !team.players.length) ? buildTeams([...prev[0].players, ...prev[1].players], online ? [...prev[0].ids ?? [], ...prev[1].ids ?? []] : undefined) : [{ ...prev[0], score: 0 }, { ...prev[1], score: 0 }]);
    setActiveTeamIdx(0); setExplainerIdx([0, 0]); setCurrentRound(1);
    setTurnResults([]); setCurrentCard(null);
    deck.current = shuffle(getTabooCards()); deckPos.current = 0;
    timer.reset(timerOption);
    setPhase('turnStart');
  }

  // Host: a removed player leaves their team; explainer gone mid-turn → turn ends, empty team → match ends (G7).
  useRemovedPlayers(online, ids => {
    const drop = dropTabooPlayers(teams, activeTeamIdx, explainerIdx, phase, ids);
    if (!drop) return;
    setTeams(drop.teams); setExplainerIdx(drop.explainerIdx);
    if (drop.phase !== phase) { timer.pause(); setCountdown(null); setPhase(drop.phase as Phase); }
  });
  const actorId = roles.explainerId ?? false;
  const refereeId = roles.refereeId ?? false;
  const act = useOnlineActions(online, 'taboo', `${phase}:${currentRound}:${activeTeamIdx}:${explainerIdx.join(',')}:${cardKey}:${countdown}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: () => { const names = online ? online.players.map(p => p.name) : playerNames; if (names.length < 4 || names.some(name => !name.trim())) return; setPlayerNames(names); setTeams(buildTeams(names, online?.players.map(p => p.id))); const cycle = Math.ceil(names.length / 2); setTotalRounds(Math.ceil(totalRounds / cycle) * cycle); setPhase('turnStart'); } },
    begin: { allowed: phase === 'turnStart' && countdown === null ? actorId : false, run: startTurn },
    correct: { allowed: phase === 'playing' ? actorId : false, run: handleCorrect, answer: turnClosed },
    skip: { allowed: phase === 'playing' ? actorId : false, run: handleSkip, answer: turnClosed },
    taboo: { allowed: phase === 'playing' ? actorId : false, run: handleTaboo, answer: turnClosed },
    referee: { allowed: phase === 'playing' ? refereeId : false, run: handleTaboo, answer: turnClosed },
    next: { allowed: phase === 'turnSummary' ? 'host' : false, run: endTurn },
    again: { allowed: phase === 'gameOver' && teams[0].players.length + teams[1].players.length >= 2 ? 'host' : false, run: playAgain },
  });
  // Je Geraet (nie an 🔁-Gaeste): Karte nur fuer Erklaerer/Schiri im laufenden Zug.
  useTabooSync(online, localIds, { phase, teams, playerNames, activeTeamIdx, explainerIdx, currentRound, totalRounds, timerOption, currentCard, turnResults, cardKey, countdown, timeLeft: timer.timeLeft, phaseStartsAt }, (state, recipient) => tabooSnapshotFor(state, recipient, roles), state => {
    setPhase(state.phase); setTeams(state.teams); setPlayerNames(state.playerNames); setActiveTeamIdx(state.activeTeamIdx); setExplainerIdx(state.explainerIdx); setCurrentRound(state.currentRound); setTotalRounds(state.totalRounds); setTimerOption(state.timerOption); setCurrentCard(state.currentCard); setTurnResults(state.turnResults); setCardKey(state.cardKey); setCountdown(state.countdown); timer.reset(state.timeLeft); receivePhaseStart(state.phaseStartsAt);
  });

  // Wer haelt dieses Handy, welche Rolle hat er, darf er die Karte sehen?
  const holder = phoneHolder({ isOnline: !!online, myId: online?.myPlayerId ?? null, activeGuest: handover.activeGuest, handoverPaused: handover.isPaused });
  const activeTeamIds = activeTeam.ids ?? (online ? online.players.map(p => p.id).filter((_, i) => teamIndexOf(teams, '', i, online.players.length) === activeTeamIdx) : []);
  const seatRole = tabooSeatRole({ isOnline: !!online, holder, roles, activeTeamIds });
  const visibleCard = view === 'playing' && mayHolderSeeCard({ isOnline: !!online, phase, holder, roles }) ? currentCard : null;

  const mvp = useMemo(() => { const w = teams[0].score >= teams[1].score ? teams[0] : teams[1]; return w.players[0] ?? t('games.taboo.gameover.unknown'); }, [teams]);
  const turnCorrect = turnResults.filter(r => r.result === 'correct').length;
  const turnTaboo = turnResults.filter(r => r.result === 'taboo').length;
  const turnSkipped = turnResults.filter(r => r.result === 'skipped').length;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;
  // Handy unterwegs: nur der deckende Weitergabe-Schirm, darunter nichts Geheimes.
  if (handover.overlay) return <>{handover.overlay}<ConfirmExitDialog {...exitGuard.dialogProps} accent="#ff8572" /></>;
  return (
    <GameStage gameId="taboo" className="taboo-stage" data-phase={view}>
      {blocker}
      {showFlash && <p role="status" className="mb-4 rounded-xl bg-[#ff8572] px-5 py-3 font-bold text-[#211311]">{isDrinkingMode ? t('games.taboo.flash.drink') : t('games.taboo.buzzer')}</p>}
      {disclaimer && <p role="status" className="mb-4 rounded-xl border border-[#e6ce81]/40 p-4 text-sm text-[#e6ce81]">{disclaimer.message}</p>}
      {view === 'setup' && <div className="mx-auto w-full max-w-3xl space-y-7">
        <StageHeader title={t('games.taboo.name')} subtitle={t('games.taboo.voiceHint')} />
        <PlayerSetup locked={!!online} players={playerNames.map((name, index) => ({ id: String(index), name }))}
          onAdd={addPlayer} onRemove={id => removePlayer(Number(id))} onRename={(id, name) => renamePlayer(Number(id), name)}
          onImportNames={isOnlineOrParty ? undefined : handleImportNames} min={4} max={20} accent="#ff8572" label={t('games.setup.players')} />
        <div className="grid grid-cols-2 gap-4">{teams.map((team, index) => <StagePanel key={team.name} tone="quiet" className="!rounded-xl !p-4 border-t-4" style={{ borderTopColor: index === 0 ? '#ff8572' : '#e6ce81' }}><p className="mb-3 text-sm font-bold">{team.name}</p><p className="text-sm leading-relaxed text-[var(--stage-muted)] break-words">{team.players.filter(Boolean).join(', ')}</p></StagePanel>)}</div>
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-4 rounded-xl border border-white/15 p-5"><span className="flex justify-between gap-3 text-sm">{t('games.taboo.setup.timerLabel')}<strong>{timerOption}s</strong></span><input type="range" min={60} max={120} step={30} value={timerOption} onChange={event => setTimerOption(Number(event.target.value))} className="h-11 w-full accent-[#ff8572]" /></label>
          <label className="space-y-4 rounded-xl border border-white/15 p-5"><span className="flex justify-between gap-3 text-sm">{t('games.taboo.setup.roundsLabel')}<strong>{totalRounds}</strong></span><input type="range" min={1} max={4} value={totalRounds} onChange={event => setTotalRounds(Number(event.target.value))} className="h-11 w-full accent-[#ff8572]" /></label>
        </section>
        <StageFooter><StageAction className="w-full" disabled={!canStart} onClick={() => act('start')}><Play className="h-5 w-5" />{t('games.taboo.setup.startBtn')}</StageAction></StageFooter>
      </div>}
      {view === 'turnStart' && <TurnStartScreen explainer={explainerSeat} teamName={activeTeam.name} round={currentRound} total={totalRounds} countdown={countdown}
        role={seatRole} canBegin={seatRole === 'explainer' && act.can('begin')} onBegin={() => act('begin')} />}
      {view === 'playing' && <PlayingScreen explainer={explainerSeat} teamName={activeTeam.name} role={seatRole} card={visibleCard} cardKey={cardKey}
        timeLeft={timer.timeLeft} total={timerOption} scoreLine={`${teams[0].name} ${teams[0].score} · ${teams[1].name} ${teams[1].score}`}
        correct={turnCorrect} misses={turnTaboo + turnSkipped} can={action => act.can(action)} onAction={action => act(action)} />}
      {view === 'turnSummary' && <div className="mx-auto w-full max-w-3xl space-y-7">
        <StageHeader title={t('games.taboo.summary.pointsLabel')} eyebrow={activeTeam.name} trailing={<span className="text-5xl font-bold tabular-nums">{turnCorrect - turnTaboo > 0 ? '+' : ''}{turnCorrect - turnTaboo}</span>} />
        <div className="grid grid-cols-3 divide-x divide-white/15 text-center">{[[turnCorrect, t('games.taboo.summary.correct')], [turnTaboo, t('games.taboo.summary.taboo')], [turnSkipped, t('games.taboo.summary.skipped')]].map(([value, label]) => <div key={String(label)} className="px-2"><p className="text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-[var(--stage-muted)]">{label}</p></div>)}</div>
        <ul className="divide-y divide-white/10">{turnResults.map((result, index) => <li key={index} className="flex items-center justify-between gap-4 py-4"><span className="text-lg break-words">{result.card.term}</span><span className="font-semibold tabular-nums text-[#ff9b88]">{result.result === 'correct' ? '+1' : result.result === 'taboo' ? '-1' : '0'}</span></li>)}</ul>
        <StageFooter><StageAction disabled={!act.can('next')} onClick={() => act('next')}>{t('games.taboo.summary.nextRoundBtn')}<ArrowRight className="h-5 w-5" /></StageAction></StageFooter>
      </div>}
      {view === 'gameOver' && <div className="mx-auto w-full max-w-3xl space-y-8">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <StageHeader title={t('games.taboo.gameover.title')} subtitle={teams[0].score === teams[1].score ? t('games.taboo.gameover.draw') : t('games.taboo.gameover.wins', { team: teams[0].score > teams[1].score ? teams[0].name : teams[1].name })} />
        <div className="grid grid-cols-2 gap-4">{teams.map(team => <StagePanel key={team.name} tone={team.score === Math.max(...teams.map(item => item.score)) ? 'accent' : 'quiet'}><p className="text-sm font-semibold">{team.name}</p><p className="my-5 text-6xl font-black tabular-nums">{team.score}</p><p className="text-sm leading-relaxed break-words">{team.players.join(', ')}</p></StagePanel>)}</div>
        <StageFooter className="flex-wrap"><StageAction disabled={!act.can('again')} onClick={() => act('again')}><RotateCcw className="h-5 w-5" />{t('games.taboo.gameover.playAgainBtn')}</StageAction>{onClose && <StageAction variant="secondary" onClick={onClose}>{t('games.taboo.gameover.otherGameBtn')}</StageAction>}</StageFooter>
      </div>}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#ff8572" />
    </GameStage>
  );
}
