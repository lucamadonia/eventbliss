import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { PartyTurnRibbon } from '../ui/PartyTurnRibbon';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useOnlineActions, useOnlineSnapshot } from '../bottlespin/online-controller';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { generateWord, getWordPack, translateReactionWord, type WordLanguage } from './word-content';
import { REACTION_TRANSPORT_GRACE_MS, validReaction } from './reaction-window';
import { actorIsRemote, playsOnThisDevice, wordPressActiveId } from './guest-turns';
import { SPEED_MS, WORDS_PER_TURN, type GameMode, type PlayerState, type Speed, type WordItem } from './wordpress-types';

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
  /** Party: the shared phase beat is still running — no taps yet. */
  inputOpen?: boolean;
}



export function PlayingScreen({ players, mode, speed, round, totalRounds, currentPlayerIndex, forbiddenWord, contentLanguage, onPlayerDone, onLive, online, inputOpen = true }: PlayingProps) {
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
  const activeId = wordPressActiveId(players, currentPlayerIndex, online?.players) ?? undefined;
  // A 🔁 guest plays on the host phone after the handover (guest-turns.ts): local seat, no transport grace.
  const isActiveDevice = !online || playsOnThisDevice(activeId ?? null, localSeats(online));
  const remoteActor = !!online && actorIsRemote(activeId ?? null, online.players, online.hostPlayerId ?? online.players.find(p => p.isHost)?.id);
  const activeSeat = online?.players.find(p => p.id === activeId);
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

  const tap = useOnlineActions(online, 'wordpress-word', `${round}:${activeId ?? currentPlayerIndex}:${wordIndex}`, {
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
        <p className="text-[13px] font-bold opacity-70">{t('games.wordpress.yourTask')}</p>
        <h2 id="reaction-rule-title" className="mt-2 text-2xl font-extrabold leading-tight">{modeLabel}</h2>
        <p className="mt-3 text-sm leading-relaxed">{ruleExample}</p>
      </StagePanel>
      {!turnStarted ? <div className="flex flex-1 flex-col justify-center gap-5 py-8">
        {activeSeat && <PartyTurnRibbon player={activeSeat} kind={isActiveDevice ? 'me' : 'other'}
          line={isActiveDevice ? t('games.wordpress.partyReadyLine', 'Tippe auf „Bereit“, dann läuft die Uhr.') : t('games.wordpress.partyWatchLine', 'Schau zu – du bist gleich dran.')} />}
        <p className="text-base leading-relaxed text-[var(--stage-muted)]">{t('games.wordpress.waitForMatch')}</p>
        {isActiveDevice ? <StageAction disabled={!inputOpen} className="min-h-[56px]" onClick={() => tap('ready')}>{t('games.wordpress.readyStart')}<ChevronRight className="h-5 w-5" /></StageAction>
          : !activeSeat && <p className="text-center text-[var(--stage-muted)]">{t('games.wordpress.waitForPlayer', { name: player.name })}</p>}
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

