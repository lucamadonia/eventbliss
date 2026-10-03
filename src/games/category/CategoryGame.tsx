import '../headup/classic-stage.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GameStage } from '../ui/GameStage';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useGameEnd } from '../social/useGameEnd';
import { personalResult } from '../social/result';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { getCategories, generateCategoryPrompt } from '@/games/content/categories';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useInitialRoster } from '@/games/ui/useInitialRoster';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { useBackGuard } from '@/lib/back-guard';
import { SCENE_LEAD_MS, phaseStage } from '@/lib/party-motion';
import { dropCategoryPlayers } from './removal';
import {
  categoryActiveSeat, chargeLoss, creditAnswer, isValidWordPayload, judgeWord, nextAnswerer, pickFrom, resumeDeadline,
  roundStarter, seatPlayers, showsValidationFor, turnExpired,
  type CategoryPlayer, type GameMode, type Phase, type RoundResult, type SaidWord, type WordVerdict,
} from './category-rules';
import { CategorySetup } from './CategorySetup';
import { CategoryRevealScreen, PlayingScreen, RoundEndScreen } from './CategoryScreens';
import { colorOf, stageBackground } from './CategoryStage';
import { GameOverScreen } from './GameOverScreen';

/**
 * Kategorie — one answerer at a time under a clock. Party-Play mode `turns`:
 * when a 🔁 guest of the host phone must answer, the phone is handed over
 * first; the clock stands during the handover (deadline shifted) and the
 * guest's words are credited to the guest seat.
 */
export default function CategoryGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Shared helper: same ranking, live on the party session.
  const partyPlayerNames = (useInitialRoster() ?? []).map(p => p.name);
  const resolvedPlayerNames = onlinePlayerNames.length >= 2 ? onlinePlayerNames : partyPlayerNames.length >= 2 ? partyPlayerNames : [];

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<CategoryPlayer[]>([]);
  const [mode, setMode] = useState<GameMode>('classic');
  const [maxRounds, setMaxRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [turnDeadline, setTurnDeadline] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [roundWords, setRoundWords] = useState<SaidWord[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [usedCategories, setUsedCategories] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentLetter, setCurrentLetter] = useState<string | undefined>();
  const [validation, setValidation] = useState<{ playerId: string; result: WordVerdict; sequence: number }>();
  /** Phones: the host phone is being passed on (from the snapshot). */
  const [remotePaused, setRemotePaused] = useState(false);
  /** Host: re-arms the turn clock after a stale (too early) expiry was ignored. */
  const [rearm, setRearm] = useState(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // 🔁 guests answer on the host phone: hand it over before their turn.
  const handover = useSeatHandover(online, categoryActiveSeat(phase, players, currentPlayerIndex));
  // All devices + TV switch phase together (design §9 beat).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound]);
  const clockPaused = online ? (online.isHost ? handover.isPaused : remotePaused) : false;
  /** Gated online phases start SCENE_LEAD_MS later; the first answerer keeps the full clock. */
  const freshDeadline = useCallback((lead = 0) => Date.now() + lead + timerSeconds * 1000, [timerSeconds]);

  // Host: a stopped clock (handover in progress or lost connection) shifts the deadline.
  const stoppedAt = useRef<number | null>(null);
  const clockStopped = online?.isConnected === false || handover.isPaused;
  useEffect(() => {
    if (!online?.isHost) return;
    if (clockStopped) stoppedAt.current ??= Date.now();
    else if (stoppedAt.current !== null) {
      const since = stoppedAt.current;
      stoppedAt.current = null;
      setTurnDeadline(deadline => resumeDeadline(deadline, since, Date.now()));
    }
  }, [online?.isHost, clockStopped]);
  const deadlineRef = useRef(turnDeadline);
  deadlineRef.current = turnDeadline;

  useTVGameBridge(
    'category',
    {
      phase, currentRound, currentPlayerIndex, currentCategory, players, currentLetter, roundWords, timerSeconds,
      // On roundEnd the timed-out player (last result's loser) is highlighted on TV.
      loserId: roundResults[roundResults.length - 1]?.loserId ?? null,
      handover: handover.tv, phaseStartsAt, turnDeadline, clockPaused,
    },
    [phase, currentRound, currentPlayerIndex, currentLetter, roundWords.length, roundResults.length, players.length,
      JSON.stringify(handover.tv), phaseStartsAt, turnDeadline, clockPaused],
    !online || online.isHost,
  );

  const pickCategory = useCallback(() => {
    const category = pickFrom(getCategories(), usedCategories);
    setUsedCategories(prev => new Set(prev).add(category));
    setCurrentCategory(category);
    setCurrentLetter(mode === 'letter' ? generateCategoryPrompt().letter : undefined);
  }, [usedCategories, mode]);

  /** Fresh match on the current settings: round 1, first category, reveal. */
  const beginMatch = useCallback((nextMode: GameMode) => {
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setRoundWords([]);
    setRoundResults([]);
    const category = pickFrom(getCategories(), new Set());
    setCurrentCategory(category);
    setUsedCategories(new Set([category]));
    setCurrentLetter(nextMode === 'letter' ? generateCategoryPrompt().letter : undefined);
    setPhase('categoryReveal');
  }, []);

  const handleStart = useCallback((p: CategoryPlayer[], m: GameMode, rounds: number, timer: number) => {
    // Party/online: every seat incl. 🔁 guests, with avatar + colour; local: typed names.
    setPlayers(online ? seatPlayers(p, online.players) : p);
    setMode(m);
    setMaxRounds(rounds);
    setTimerSeconds(timer);
    beginMatch(m);
  }, [online?.players, beginMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevealReady = useCallback(() => {
    setTurnDeadline(freshDeadline(online ? SCENE_LEAD_MS : 0));
    setPhase('playing');
  }, [freshDeadline, online]);

  const handleWordSaid = useCallback((word: string): WordVerdict => {
    const verdict = judgeWord(word, roundWords, mode, currentLetter);
    if (verdict !== 'ok') return verdict;
    const playerId = players[currentPlayerIndex].id;
    setTurnDeadline(freshDeadline());
    setRoundWords(prev => [...prev, { word, playerId }]);
    setPlayers(prev => creditAnswer(prev, playerId));
    setCurrentPlayerIndex(prev => nextAnswerer(prev, players.length));
    return 'ok';
  }, [currentPlayerIndex, players, mode, currentLetter, roundWords, freshDeadline]);

  const handleTimerExpire = useCallback(() => {
    if (online) {
      if (!online.isHost || phase !== 'playing') return;
      // A screen that remounted with the old deadline (e.g. right after a handover) must not end the round.
      if (!turnExpired(deadlineRef.current, Date.now())) { setRearm(n => n + 1); return; }
    }
    const loserId = players[currentPlayerIndex]?.id ?? null;
    setPlayers(prev => chargeLoss(prev, loserId));
    setRoundResults(prev => [...prev, { category: currentCategory, letter: currentLetter, words: roundWords, loserId }]);
    setPhase('roundEnd');
  }, [currentPlayerIndex, players, currentCategory, currentLetter, roundWords, online, phase]);

  const handleNextRound = useCallback(() => {
    if (currentRound >= maxRounds) { setPhase('gameOver'); return; }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setCurrentPlayerIndex(roundStarter(nextRound, players.length));
    setRoundWords([]);
    pickCategory();
    setPhase('categoryReveal');
  }, [currentRound, maxRounds, pickCategory, players.length]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const result = personalResult(players, online?.myPlayerId);
      recordEnd('category', result.score, result.won);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRoundResults([]);
    setUsedCategories(new Set());
  }, []);

  // Confirm before leaving mid-round; the arrow drops to setup (local) or leaves (online).
  const exitGuard = useConfirmExit(() => online ? navigate('/games') : handleRestart());
  // Native back (FloatingBackButton / Android) runs through the same single dialog.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });

  // A rematch keeps the roster and settings, and starts fresh scoring.
  const handlePlayAgain = useCallback(() => {
    gameRecordedRef.current = false;
    setPlayers(previous => previous.map(player => ({ ...player, score: 0, losses: 0 })));
    beginMatch(mode);
  }, [mode, beginMatch]);

  // Host: a removed player leaves the circle; if they were answering, the next one gets a fresh turn (G7).
  useRemovedPlayers(online, ids => {
    const drop = dropCategoryPlayers(players, currentPlayerIndex, phase, ids);
    if (!drop) return;
    setPlayers(drop.players); setCurrentPlayerIndex(drop.currentPlayerIndex);
    if (drop.restartTurn) setTurnDeadline(freshDeadline());
  });

  const act = useOnlineActions(online, 'category', `${phase}:${currentRound}:${currentPlayerIndex}:${roundWords.length}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    ready: { allowed: phase === 'categoryReveal' ? 'host' : false, run: handleRevealReady },
    // The answerer's seat; a 🔁 guest's word comes from the device that controls the seat (canAct).
    word: { answer: true, allowed: phase === 'playing' ? players[currentPlayerIndex]?.id ?? false : false, run: (word: unknown) => {
      if (!isValidWordPayload(word)) return;
      const playerId = players[currentPlayerIndex].id;
      const result = handleWordSaid(word);
      setValidation(previous => ({ playerId, result, sequence: (previous?.sequence ?? 0) + 1 }));
    } },
    next: { allowed: phase === 'roundEnd' ? 'host' : false, run: handleNextRound },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: handlePlayAgain },
    restart: { allowed: 'host', run: handleRestart },
  });
  const revealReady = useCallback(() => act('ready'), [act]);
  useOnlineSnapshot(online, 'category', {
    phase, players, mode, maxRounds, timerSeconds, turnDeadline, currentRound, currentPlayerIndex, roundWords, roundResults,
    currentCategory, currentLetter, validation, phaseStartsAt, clockPaused: handover.isPaused,
  }, s => {
    setValidation(s.validation);
    setTurnDeadline(s.turnDeadline);
    setPhase(s.phase); setPlayers(s.players); setMode(s.mode); setMaxRounds(s.maxRounds); setTimerSeconds(s.timerSeconds); setCurrentRound(s.currentRound); setCurrentPlayerIndex(s.currentPlayerIndex); setRoundWords(s.roundWords); setRoundResults(s.roundResults); setCurrentCategory(s.currentCategory); setCurrentLetter(s.currentLetter);
    setRemotePaused(!!s.clockPaused); receivePhaseStart(s.phaseStartsAt);
  });

  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen

  const latestResult = roundResults[roundResults.length - 1];
  const answerer = players[currentPlayerIndex];
  const canSubmit = !online || act.can('word');
  const myValidation = !online || (validation && showsValidationFor(validation.playerId, online.myPlayerId, localSeats(online), handover.activeGuest)) ? validation : undefined;
  const backHidden = hasShellBackButton() && view === 'setup';

  return (
    <GameStage gameId="category" className="category-stage" data-phase={view}
      style={view === 'setup' ? undefined : stageBackground(colorOf(answerer), view === 'playing' && canSubmit && !clockPaused)}>
      {blocker}
      <div className="min-h-0">
        <div className="mx-auto w-full max-w-3xl py-4">
          <div className="mb-6 flex items-center justify-between">
            {/* In setup the shell's FloatingBackButton leaves the game; elsewhere this arrow
                goes back to setup behind a confirm, so it stays (invisible keeps the layout). */}
            <button
              onClick={() => (view === 'setup' ? navigate('/games') : view === 'gameOver' ? (online ? navigate('/games') : handleRestart()) : exitGuard.request())}
              className={`flex items-center gap-2 text-white/65 hover:text-white/60 transition-colors${backHidden ? ' invisible pointer-events-none' : ''}`}
              aria-hidden={backHidden} tabIndex={backHidden ? -1 : undefined}
              aria-label={view === 'setup' ? t('common.back') : t('games.category.quit')}>
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{view === 'setup' ? t('common.back') : t('games.category.quit')}</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[0.5rem] bg-[#0d0915] border border-[#f2bc66]/20 flex items-center justify-center">
                <Timer className="h-4 w-4 text-[#f2bc66]" />
              </div>
              <span className="text-lg font-extrabold font-sans text-[#f2bc66]">{t('games.category.title')}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={view === 'categoryReveal' || view === 'playing' || view === 'roundEnd' ? `${view}-${currentRound}` : view}
              variants={phaseStage} initial="initial" animate="animate" exit="exit">
              {view === 'setup' && <CategorySetup locked={!!online} onStart={(...args) => act('start', ...args)} onlinePlayerNames={resolvedPlayerNames} />}
              {view === 'categoryReveal' && (
                <CategoryRevealScreen category={currentCategory} letter={currentLetter} mode={mode} starter={answerer}
                  onReady={revealReady} connected={online?.isConnected !== false} />
              )}
              {view === 'playing' && answerer && (
                <PlayingScreen category={currentCategory} letter={currentLetter} mode={mode} players={players}
                  currentPlayerIndex={currentPlayerIndex} timerSeconds={timerSeconds} words={roundWords}
                  validation={myValidation} canSubmit={canSubmit} paused={clockPaused} rearmKey={rearm}
                  onWordSaid={word => { if (!online) return handleWordSaid(word); act('word', word); return 'pending'; }}
                  deadline={online ? turnDeadline : undefined} connected={online?.isConnected !== false}
                  onTimerExpire={handleTimerExpire} />
              )}
              {view === 'roundEnd' && latestResult && (
                <RoundEndScreen result={latestResult} players={players} round={currentRound} maxRounds={maxRounds}
                  canAdvance={!online || act.can('next')} onNext={() => act('next')} />
              )}
              {view === 'gameOver' && <>
                <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
                <GameOverScreen players={players} canControl={!online || act.can('again')} onPlayAgain={() => act('again')} onRestart={() => act('restart')} />
              </>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#f2bc66" />
    </GameStage>
  );
}
