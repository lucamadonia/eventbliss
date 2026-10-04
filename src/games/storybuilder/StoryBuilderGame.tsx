import '../headup/classic-stage.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { advanceReveal, storyTurn } from './reveal-rules';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { removeFromStory } from './roster-change';
import { phaseOfBeat, storyBeatKey, storyTurnClosed, writerSeat, writingClockRuns, writingTimedOut } from './guest-turn';
import { WritingWait } from './WritingWait';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { usePhaseGate } from '../party/usePhaseGate';
import { planPhaseStart } from '../party/phase-gate';
import { serverClock } from '../party/scene-clock';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, RotateCcw, ArrowRight, ArrowLeft,
  BookOpen, Pen, Sparkles, Music, Type, Eye,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { cn } from '@/lib/utils';
import { getSTORY_STARTERS, getSTORY_PROMPTS } from './story-prompts';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { STORY_MODE_ASSETS } from '../ui/premium-game-assets';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'writing' | 'passing' | 'storyReveal' | 'gameOver';
type Mode = 'classic' | 'vorgabe' | 'reimzeit';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface StorySentence {
  playerId: string;
  playerName: string;
  text: string;
  prompt?: string;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

const MAX_CHARS = 150;

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
  { id: 'classic', name: 'Classic', desc: 'Free text', icon: <Pen className="w-6 h-6" /> },
  { id: 'vorgabe', name: 'Prompt', desc: 'With sentence starters', icon: <BookOpen className="w-6 h-6" /> },
  { id: 'reimzeit', name: 'Rhyme Time', desc: 'Sentences must rhyme', icon: <Music className="w-6 h-6" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryBuilderGame({ online }: { online?: OnlineGameProps } = {}) {
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));

  const setupSettings: SettingsConfig = useMemo(() => ({
    timer: { min: 1, max: 3, default: 1, step: 1, label: t('games.storybuilder.setupTimerLabel') },
    rounds: { min: 1, max: 5, default: 2, step: 1, label: t('games.storybuilder.setupRoundsLabel') },
  }), [t]);

  // Setup
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg — die Partie ist
  // dann futsch. Setup und Endstand haben nichts zu verlieren und reichen
  // weiter an den Routen-Handler.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'storyReveal') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<Mode>('classic');
  const [sentencesPerPlayer, setSentencesPerPlayer] = useState(1);
  const [totalRounds, setTotalRounds] = useState(2);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentSentenceNum, setCurrentSentenceNum] = useState(1);
  const [sentences, setSentences] = useState<StorySentence[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Story reveal
  const [revealIdx, setRevealIdx] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  // Prompts deck
  const promptsDeck = useRef<string[]>([]);
  const promptsPos = useRef(0);
  const startersDeck = useRef<string[]>([]);
  const startersPos = useRef(0);

  // 🔁-Gaeste am Host-Handy schreiben selbst (guest-turn.ts): erst weitergeben, Uhr steht solange.
  const writerId = writerSeat(phase, players[currentPlayerIdx]?.id);
  const handover = useSeatHandover(online, writerId);
  const awaitingGuest = !!writerId && handover.isGuest(writerId) && handover.activeGuest !== writerId;
  // Gemeinsamer Takt: Der Host plant jeden Wechsel (Phase und Zug) mit Vorlauf;
  // Handys (Snapshot) und TV (Bridge) wechseln zum selben Moment.
  const beat = storyBeatKey(phase, currentRound, currentPlayerIdx, currentSentenceNum);
  const [remotePhaseStartsAt, setRemotePhaseStartsAt] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plannedPhaseStart = useMemo(() => (online ? planPhaseStart() : serverClock.now()), [beat]);
  const phaseStartsAt = online && !online.isHost ? remotePhaseStartsAt : plannedPhaseStart;
  const gate = usePhaseGate(beat, online ? phaseStartsAt : null);
  const view = phaseOfBeat(gate.shown);

  useTVGameBridge(
    'storybuilder',
    {
      phase, phaseStartsAt, handover: handover.tv, currentRound, currentPlayerIdx, players, mode, totalRounds,
      partyScoresById: Object.fromEntries(players.map(p => [p.id, 0])),
      // Only finished sentences are broadcast — never the in-progress typed input.
      sentences: sentences.map((s) => ({
        text: s.text,
        player: s.playerName,
        playerColor: players.find((p) => p.id === s.playerId)?.color,
      })),
      // 'vorgabe'/'reimzeit' carry a prompt/constraint line; classic does not.
      prompt: mode === 'classic' ? '' : currentPrompt,
    },
    [phase, phaseStartsAt, currentRound, currentPlayerIdx, sentences.length, currentPrompt, handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''],
    !online || online.isHost,
  );

  // Derived
  const currentPlayer = players[currentPlayerIdx] ?? null;
  const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1] : null;
  const totalTurns = players.length * sentencesPerPlayer * totalRounds;
  const currentTurn = storyTurn(currentRound, currentPlayerIdx, currentSentenceNum, players.length, sentencesPerPlayer);

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    (
      setupPlayers: { id: string; name: string; color: string; avatar: string }[],
      selectedMode: string,
      settings: { timer: number; rounds: number },
    ) => {
      const mapped: Player[] = setupPlayers.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      }));
      setPlayers(mapped);
      setMode(selectedMode as Mode);
      setSentencesPerPlayer(settings.timer);
      setTotalRounds(settings.rounds);
      setSentences([]);
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      setCurrentSentenceNum(1);
      setInputText('');

      promptsDeck.current = shuffle(getSTORY_PROMPTS());
      promptsPos.current = 0;
      startersDeck.current = shuffle(getSTORY_STARTERS());
      startersPos.current = 0;

      // Set first prompt
      if (selectedMode === 'vorgabe') {
        const starter = startersDeck.current[0];
        startersPos.current = 1;
        setCurrentPrompt(starter);
      } else if (selectedMode === 'reimzeit') {
        setCurrentPrompt(t('games.storybuilder.rhymeMustRhyme'));
      } else {
        setCurrentPrompt('');
      }

      setPhase('writing');
    },
    [t],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  function getNextPrompt(sentenceCount: number): string {
    if (mode === 'vorgabe') {
      // First sentence of the entire story uses a starter
      if (sentenceCount === 0) {
        return startersDeck.current[startersPos.current % startersDeck.current.length];
      }
      const prompt = promptsDeck.current[promptsPos.current % promptsDeck.current.length];
      promptsPos.current++;
      return prompt;
    }
    if (mode === 'reimzeit') {
      return t('games.storybuilder.rhymeMustRhyme');
    }
    return '';
  }

  function submitSentence(text = inputText, skip = false) {
    const trimmed = text.trim().slice(0, MAX_CHARS);
    if ((!trimmed && !skip) || !currentPlayer) return;

    const newSentence: StorySentence = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      text: trimmed,
      prompt: mode === 'vorgabe' ? currentPrompt : undefined,
    };

    const updatedSentences = skip ? sentences : [...sentences, newSentence];
    setSentences(updatedSentences);
    setInputText('');

    // Calculate next turn
    const nextSentenceNum = currentSentenceNum + 1;
    if (nextSentenceNum > sentencesPerPlayer) {
      // Move to next player
      const nextPlayerIdx = currentPlayerIdx + 1;
      if (nextPlayerIdx >= players.length) {
        // Check if more rounds
        const nextRound = currentRound + 1;
        if (nextRound > totalRounds) {
          // Story complete, go to reveal
          setRevealIdx(0);
          setIsRevealing(false);
          setPhase('storyReveal');
          return;
        }
        setCurrentRound(nextRound);
        setCurrentPlayerIdx(0);
      } else {
        setCurrentPlayerIdx(nextPlayerIdx);
      }
      setCurrentSentenceNum(1);
    } else {
      setCurrentSentenceNum(nextSentenceNum);
    }

    setCurrentPrompt(getNextPrompt(updatedSentences.length));
    setPhase(online ? 'writing' : 'passing');
  }

  function confirmPass() {
    setPhase('writing');
  }

  // Reveal animation
  useEffect(() => {
    if (phase !== 'storyReveal') return;
    setIsRevealing(true);
    setRevealIdx(0);

    let index = 0;
    let pending: number;
    const revealNext = () => {
      index = Math.min(index + 1, sentences.length - 1);
      setRevealIdx(previous => advanceReveal(previous, index));
      if (index < sentences.length - 1) pending = setTimeout(revealNext, 2000);
    };
    pending = setTimeout(revealNext, 2000);
    return () => clearTimeout(pending);
  }, [phase, sentences.length]);

  const [writingSeconds, setWritingSeconds] = useState(90);
  useEffect(() => { setWritingSeconds(90); }, [phase, currentRound, currentPlayerIdx, currentSentenceNum]);
  const clock = { phase, seconds: writingSeconds, authoritative: !online || online.isHost, handoverPaused: handover.isPaused || awaitingGuest, connected: online?.isConnected !== false };
  useEffect(() => {
    if (!writingClockRuns(clock)) return;
    const pending = setTimeout(() => setWritingSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(pending);
  }, [phase, writingSeconds, currentRound, currentPlayerIdx, currentSentenceNum, clock.handoverPaused]);
  useEffect(() => {
    if (writingTimedOut(clock)) submitSentence('', true);
  }, [writingSeconds, phase, online?.isConnected, clock.handoverPaused]);

  useEffect(() => {
    if (phase === 'storyReveal' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      recordEnd('story-builder', sentences.length, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  function resetGame() {
    setPhase('setup');
    setPlayers([]);
    setSentences([]);
  }

  // Nochmal spielen: KEEP players + mode + settings; only the story content is
  // reset. We replicate handleStart's gameplay-entry (fresh decks + first prompt)
  // and jump straight to 'writing' — never back to 'setup'.
  function rematch() {
    if (players.length === 0) { resetGame(); return; }
    setSentences([]);
    setInputText('');
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
    setCurrentSentenceNum(1);
    setRevealIdx(0);
    setIsRevealing(false);
    gameRecordedRef.current = false;

    promptsDeck.current = shuffle(getSTORY_PROMPTS());
    promptsPos.current = 0;
    startersDeck.current = shuffle(getSTORY_STARTERS());
    startersPos.current = 0;

    if (mode === 'vorgabe') {
      const starter = startersDeck.current[0];
      startersPos.current = 1;
      setCurrentPrompt(starter);
    } else if (mode === 'reimzeit') {
      setCurrentPrompt(t('games.storybuilder.rhymeMustRhyme'));
    } else {
      setCurrentPrompt('');
    }

    setPhase('writing');
  }

  // Host: Entfernte fallen aus der Reihe; schrieb gerade jemand von ihnen,
  // beginnt die naechste Person mit frischer Uhr (roster-change.ts).
  useRemovedPlayers(online, ids => {
    const change = removeFromStory({ players, phase, currentRound, totalRounds, currentPlayerIdx, currentSentenceNum }, ids);
    if (!change.changed) return;
    const next = change.state;
    setPlayers(next.players); setCurrentRound(next.currentRound); setCurrentPlayerIdx(next.currentPlayerIdx); setCurrentSentenceNum(next.currentSentenceNum);
    if (next.phase === 'storyReveal' && phase !== 'storyReveal') { setRevealIdx(0); setIsRevealing(false); }
    setPhase(next.phase as Phase);
    if (change.turnRestarted) { setWritingSeconds(90); setInputText(''); }
  });
  const act = useOnlineActions(online, 'storybuilder', `${phase}:${currentRound}:${currentPlayerIdx}:${currentSentenceNum}:${sentences.length}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    sentence: { answer: storyTurnClosed, allowed: phase === 'writing' ? currentPlayer?.id ?? false : false, run: (text: unknown) => { if (typeof text === 'string') submitSentence(text); } },
    ready: { allowed: phase === 'passing' ? currentPlayer?.id ?? false : false, run: confirmPass },
    skip: { allowed: phase === 'writing' || phase === 'passing' ? currentPlayer?.id ?? false : false, run: () => submitSentence('', true) },
    again: { allowed: phase === 'storyReveal' || phase === 'gameOver' ? 'host' : false, run: rematch },
  });
  useOnlineSnapshot(online, 'storybuilder', { phase, phaseStartsAt, players, mode, sentencesPerPlayer, totalRounds, currentRound, currentPlayerIdx, currentSentenceNum, sentences, currentPrompt, writingSeconds }, s => {
    setWritingSeconds(s.writingSeconds);
    setRemotePhaseStartsAt(typeof s.phaseStartsAt === 'number' ? s.phaseStartsAt : null);
    setPhase(s.phase); setPlayers(s.players); setMode(s.mode); setSentencesPerPlayer(s.sentencesPerPlayer); setTotalRounds(s.totalRounds); setCurrentRound(s.currentRound); setCurrentPlayerIdx(s.currentPlayerIdx); setCurrentSentenceNum(s.currentSentenceNum); setSentences(s.sentences); setCurrentPrompt(s.currentPrompt);
  });
  useEffect(() => { setInputText(''); }, [sentences.length, currentPlayerIdx, currentRound, currentSentenceNum]);
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;


  // =========================================================================
  // RENDER
  // =========================================================================

  // Handy unterwegs zu einem Gast: nur der deckende Weitergabe-Bildschirm.
  if (handover.overlay || awaitingGuest) return <>{handover.overlay}<ConfirmExitDialog {...exitGuard.dialogProps} accent="#227768" /></>;

  if (view === 'setup') {
    return (
      <GameSetup
        gameId="storybuilder"
        modes={getTranslatedModes('storybuilder', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))}
        modeAssets={STORY_MODE_ASSETS}
        accent="#f6b94a"
        settings={setupSettings}
        onStart={(...args) => act('start', ...args)}
        title="Story Builder"
        onlinePlayers={online?.players}
      />
    );
  }

  return (
    <GameStage gameId="storybuilder" className="story-manuscript" style={{ '--stage-bg': '#f4eee0', '--stage-surface': '#e9e2d3', '--stage-accent': '#227768', '--stage-secondary': '#227768', '--stage-ink': '#20332d', '--stage-muted': '#52605a' } as React.CSSProperties}>
      <StageHeader title={view === 'storyReveal' ? t('games.storybuilder.ourStory') : currentPlayer?.name ?? 'StoryBuilder'}
        eyebrow="StoryBuilder" progress={view === 'storyReveal' ? { value: Math.min(revealIdx + 1, sentences.length), total: sentences.length } : { value: currentTurn, total: totalTurns }}
        trailing={(view === 'writing' || view === 'passing') && <span className="tabular-nums text-lg font-semibold">{writingSeconds}s</span>} />

      {view === 'writing' && currentPlayer && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 py-5">
          {lastSentence && <section className="border-l-2 border-[#227768]/30 pl-5 py-2">
            <p className="mb-2 text-xs font-semibold tracking-wide text-[#52605a]">{t('games.storybuilder.lastSentenceBy', { name: lastSentence.playerName })}</p>
            <p className="font-serif text-xl sm:text-2xl leading-relaxed text-[#20332d]">{lastSentence.text}</p>
          </section>}
          {mode === 'vorgabe' && currentPrompt && <p className="text-sm font-semibold text-[#227768]">{currentPrompt}</p>}
          {mode === 'reimzeit' && <p className="text-sm font-semibold text-[#227768]">{t('games.storybuilder.rhymeMustRhyme')}</p>}
          {online && !act.can('sentence') ? <WritingWait name={currentPlayer.name} avatar={currentPlayer.avatar} color={currentPlayer.color} seconds={writingSeconds} /> : <>
          <StagePanel tone="paper" className="flex-1 !rounded-sm !p-5 sm:!p-8 min-h-64 border-t-4 !border-t-[#227768]">
            <label htmlFor="story-sentence" className="mb-5 block text-sm font-semibold text-[#52605a]">{t('games.storybuilder.inputPlaceholder')}</label>
            <textarea id="story-sentence" value={inputText} disabled={!act.can('sentence')}
              onChange={e => { if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value); }}
              placeholder={t('games.storybuilder.inputPlaceholder')} rows={5}
              className="min-h-48 w-full resize-y bg-transparent font-serif text-2xl leading-relaxed text-[#20332d] placeholder:text-[#6b786f] outline-none focus-visible:ring-2 focus-visible:ring-[#227768] disabled:opacity-60" />
            <p className="text-right text-xs tabular-nums text-[#52605a]">{inputText.length} / {MAX_CHARS}</p>
          </StagePanel>
          <StageFooter className="!bg-transparent !px-0 flex flex-wrap gap-3">
            <StageAction variant="secondary" disabled={!act.can('skip')} onClick={() => act('skip')}>{t('games.storybuilder.skipTurn')}</StageAction>
            <StageAction className="flex-1" disabled={!inputText.trim() || !act.can('sentence')} onClick={() => act('sentence', inputText)}><Pen className="h-5 w-5" />{t('games.storybuilder.submitBtn')}</StageAction>
          </StageFooter></>}
        </div>
      )}
      {view === 'passing' && <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-10">
        <p className="font-serif text-4xl sm:text-6xl leading-tight">{t('games.storybuilder.passDevice')}</p>
        <p className="text-lg text-[#52605a]">{t('games.storybuilder.playerIsNext', { name: players[currentPlayerIdx]?.name })}</p>
        <StageAction disabled={!act.can('ready')} onClick={() => act('ready')}><ArrowRight className="h-5 w-5" />{t('games.storybuilder.readyBtn')}</StageAction>
        <StageAction variant="ghost" disabled={!act.can('skip')} onClick={() => act('skip')}>{t('games.storybuilder.skipTurn')}</StageAction>
      </div>}
      {view === 'storyReveal' && <div className="mx-auto w-full max-w-3xl py-5">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <StagePanel tone="paper" className="!rounded-sm !p-6 sm:!p-10">
          <article className="space-y-8">
            {sentences.length === 0 && <p role="status" className="text-center text-[#52605a]">{t('games.storybuilder.emptyStory', { defaultValue: 'No sentences yet. Start a new story together.' })}</p>}
            {sentences.map((sentence, index) => index <= revealIdx && <section key={`${sentence.playerId}-${index}`} className="border-b border-[#20332d]/10 pb-7 last:border-0">
              <div className="mb-3 flex gap-3 text-xs text-[#52605a]"><span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span><span>{sentence.playerName}</span></div>
              <p className="font-serif text-xl sm:text-2xl leading-relaxed text-[#20332d] break-words">{sentence.text}</p>
            </section>)}
          </article>
        </StagePanel>
        <StageFooter className="mt-6 flex flex-wrap gap-3">
          {revealIdx < sentences.length - 1 ? <StageAction className="flex-1" onClick={() => setRevealIdx(sentences.length - 1)}><Eye className="h-5 w-5" />{t('games.storybuilder.showAll')}</StageAction> : <StageAction className="flex-1" disabled={!act.can('again')} onClick={() => act('again')}><RotateCcw className="h-5 w-5" />{t('games.storybuilder.playAgain')}</StageAction>}
          {!hasShellBackButton() && <StageAction variant="secondary" onClick={() => navigate('/games')}>{t('games.storybuilder.otherGame')}</StageAction>}
        </StageFooter>
      </div>}
      {/* Einblend-Takt (Design §9): Eingaben erst nach dem gemeinsamen Wechsel. */}
      {!gate.inputOpen && <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#227768" />
    </GameStage>
  );
}
