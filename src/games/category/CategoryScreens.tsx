import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, Mic, Repeat2 } from 'lucide-react';
import { checkPop } from '@/lib/party-motion';
import { useGameTimer } from '@/games/engine/TimerSystem';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { haptics } from '@/hooks/useHaptics';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { VERBAL, secondsLeft, type CategoryPlayer, type GameMode, type RoundResult, type SaidWord, type WordVerdict } from './category-rules';
import { CategoryAvatar, CategoryCard, Label, Panel, SeatRow, TurnHero, WordCloud, colorOf } from './CategoryStage';

const primaryButton = 'flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f2bc66] px-6 text-base font-extrabold text-[#101513] transition active:scale-[0.97] disabled:opacity-35';
const secondaryButton = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-[#16101f] px-5 text-[0.95rem] font-semibold text-white/85 transition active:scale-[0.97] disabled:opacity-35';

// ---------------------------------------------------------------------------
// Category reveal: 3-2-1 with the category as the announcement
// ---------------------------------------------------------------------------

export function CategoryRevealScreen({ category, letter, mode, starter, onReady, connected = true }: {
  category: string; letter?: string; mode: GameMode; starter?: CategoryPlayer; onReady: () => void; connected?: boolean;
}) {
  const { setTimeout, clearTimeout } = usePausableTasks(connected);
  const { t } = useTranslation();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) { onReady(); return; }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const showLetter = mode === 'letter' && letter ? letter : undefined;
  return (
    <div className="flex min-h-[70dvh] flex-col justify-center gap-7">
      <div className="grid place-items-center gap-2 text-center">
        <Label>{t('games.category.categoryLabel')}</Label>
        <AnimatePresence mode="popLayout">
          <motion.span key={count} initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            className="font-game font-black tabular-nums text-[#f2bc66]" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.5rem)' }} aria-live="polite">
            {count > 0 ? count : t('games.category.go')}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.div initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.5 }}>
        <CategoryCard label={t('games.category.categoryLabel')} category={category} letter={showLetter} active color="#f2bc66" />
      </motion.div>
      {showLetter && <p className="text-center text-sm text-white/60">{t('games.category.onlyWithLetter', { letter: showLetter })}</p>}
      {starter && (
        <div className="flex items-center justify-center gap-3">
          <CategoryAvatar player={starter} size={44} active />
          <p className="text-base font-semibold">{t('games.category.starts', '{{name}} beginnt', { name: starter.name })}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Playing: stage (answerer + clock) on top, action in the thumb zone
// ---------------------------------------------------------------------------

export function PlayingScreen({
  category, letter, mode, players, currentPlayerIndex, timerSeconds, deadline, connected = true, paused = false,
  validation, canSubmit = true, words, onWordSaid, onTimerExpire, rearmKey = 0,
}: {
  category: string; letter?: string; mode: GameMode; players: CategoryPlayer[]; currentPlayerIndex: number; timerSeconds: number;
  deadline?: number; connected?: boolean;
  /** The host phone is being passed to a 🔁 guest: the clock stands on every device. */
  paused?: boolean;
  validation?: { result: WordVerdict; sequence: number }; canSubmit?: boolean; words: SaidWord[];
  onWordSaid: (word: string) => WordVerdict | 'pending'; onTimerExpire: () => void;
  /** Host bumps it after ignoring a too-early expiry: restart the clock from the deadline. */
  rearmKey?: number;
}) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState('');
  const [flash, setFlash] = useState<'duplicate' | 'wrong_letter' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useGameTimer(timerSeconds, onTimerExpire, connected && !paused);
  const current = players[currentPlayerIndex];
  const color = colorOf(current);
  const shownLetter = mode === 'letter' ? letter : undefined;

  useEffect(() => {
    if (!validation) return;
    if (validation.result === 'ok') { setInputVal(''); setFlash(null); } else { setFlash(validation.result); haptics.warning(); }
  }, [validation?.sequence]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    timer.reset(deadline ? Math.min(timerSeconds, secondsLeft(deadline, Date.now())) : timerSeconds);
    timer.start();
  }, [currentPlayerIndex, timerSeconds, deadline, rearmKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setInputVal('');
    if (canSubmit) { inputRef.current?.focus(); haptics.light(); }
  }, [currentPlayerIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (word: string) => {
    if (!canSubmit) return;
    const result = onWordSaid(word);
    if (result === 'ok') { setInputVal(''); inputRef.current?.focus(); haptics.success(); } else if (result !== 'pending') {
      setFlash(result); haptics.warning();
      window.setTimeout(() => setFlash(null), 900);
    }
  };
  const handleSubmit = () => { const word = inputVal.trim(); if (word) submit(word); };

  return (
    <div className="flex min-h-[78dvh] flex-col gap-5">
      {/* Stage: about 40 % of the height, the answerer is the event. */}
      <section className="flex min-h-[36dvh] flex-col items-center justify-center gap-3 text-center">
        <TurnHero player={current} timeLeft={timer.timeLeft} total={timerSeconds} paused={paused} />
        <p className="font-game font-black leading-none" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.5rem)' }}>
          {current?.name}
        </p>
        <p className="text-[0.95rem] font-medium text-white/65" role="status">
          {paused ? t('games.category.passingPhone', '{{name}} bekommt gerade das Handy …', { name: current?.name ?? '' })
            : canSubmit ? t('games.category.yourTurn', 'Du bist dran – nenn ein Wort!')
              : t('games.category.othersTurn', 'Hör gut zu – gleich kann es dich treffen.')}
        </p>
      </section>

      <CategoryCard label={t('games.category.categoryLabel')} category={category} letter={shownLetter} active={canSubmit} color={color} />
      <SeatRow players={players} activeIndex={currentPlayerIndex} />

      {canSubmit && !paused ? (
        <div className="mt-auto space-y-3">
          <label htmlFor="category-word" className="sr-only">{t('games.category.wordPlaceholder')}</label>
          <div className="flex items-stretch gap-3">
            <input id="category-word" ref={inputRef} value={inputVal} autoComplete="off" enterKeyHint="send" maxLength={200}
              onChange={event => setInputVal(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSubmit()}
              placeholder={t('games.category.wordPlaceholder')}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#16101f] px-4 py-4 text-lg text-white placeholder:text-white/40 focus:outline-none"
              style={{ boxShadow: `0 0 0 2px ${color}55` }} />
            <button type="button" disabled={!inputVal.trim()} onClick={handleSubmit} aria-label={t('games.category.submitWord')}
              className="grid min-h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f2bc66] text-[#101513] transition active:scale-95 disabled:opacity-35">
              <Check className="h-6 w-6" />
            </button>
          </div>
          <AnimatePresence>
            {flash && (
              <motion.p variants={checkPop} initial="initial" animate="animate" exit="exit" role="alert"
                className="flex items-center gap-2 rounded-2xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-4 py-3 text-sm text-[#ffbcc6]">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {flash === 'duplicate' ? t('games.category.duplicate') : t('games.category.wrongLetter', { letter })}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="button" className={secondaryButton} onClick={() => { submit(VERBAL); setInputVal(''); }}>
            <Mic className="h-5 w-5" />{t('games.category.saidVerbal')}
          </button>
        </div>
      ) : (
        <Panel className="mt-auto flex items-center gap-3 !py-4">
          {paused ? <Repeat2 className="h-5 w-5 shrink-0 text-[#df8eff]" aria-hidden /> : <CategoryAvatar player={current} size={32} />}
          <p className="text-[0.95rem] font-medium text-white/75">
            {paused ? t('games.category.clockStopped', 'Die Uhr steht, bis {{name}} bereit ist.', { name: current?.name ?? '' })
              : t('games.category.waitingAnswer', '{{name}} sucht ein Wort …', { name: current?.name ?? '' })}
          </p>
        </Panel>
      )}

      {words.length > 0 && (
        <section className="space-y-2 border-t border-white/[0.07] pt-4">
          <Label>{t('games.category.wordsHeard', { count: words.length })}</Label>
          <WordCloud words={words} players={players} max={18} />
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round end: who ran out of time, the words, the standings
// ---------------------------------------------------------------------------

export function RoundEndScreen({ result, players, round, maxRounds, onNext, canAdvance = true }: {
  result: RoundResult; players: CategoryPlayer[]; round: number; maxRounds: number; onNext: () => void; canAdvance?: boolean;
}) {
  const { t } = useTranslation();
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);
  const loser = players.find(p => p.id === result.loserId);
  const standings = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (!isDrinkingMode || !loser) return;
    const d = drinkingMode.recordDrink();
    if (!d) return;
    const show = window.setTimeout(() => { haptics.warning(); setDisclaimer(d); }, 1000);
    const hide = window.setTimeout(() => setDisclaimer(null), 6000);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[78dvh] flex-col gap-6">
      <section className="flex min-h-[30dvh] flex-col items-center justify-center gap-3 text-center">
        <Label>{t('games.category.roundOf', { round, maxRounds })}</Label>
        {loser ? <>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <CategoryAvatar player={loser} size={104} active />
          </motion.div>
          <p className="text-[0.95rem] font-semibold text-white/70">{isDrinkingMode ? t('games.category.drink') : t('games.category.timeUp')}</p>
          <p className="font-game font-black leading-none break-words" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.5rem)' }}>{loser.name}</p>
        </> : <p className="font-game text-3xl font-black">{result.category}</p>}
      </section>
      {disclaimer && <p role="status" className="rounded-2xl border border-[#f2bc66]/30 p-4 text-sm leading-relaxed text-[#e6ce81]">{disclaimer.message} {t('games.category.drinkResponsibly', { count: drinkingMode.drinkCount })}</p>}
      <Panel>
        <Label className="mb-3">{result.category} · {t('games.category.wordsSaid', { count: result.words.length })}</Label>
        {result.words.length ? <WordCloud words={result.words} players={players} /> : <p className="text-sm text-white/60">{t('games.category.noWords')}</p>}
      </Panel>
      <Panel>
        <Label className="mb-2">{t('games.category.scoreboard')}</Label>
        <ol className="divide-y divide-white/[0.06]">
          {standings.map((player, index) => (
            <motion.li key={player.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }}
              className="flex items-center gap-3 py-3">
              <span className="w-5 text-sm tabular-nums text-white/50">{index + 1}</span>
              <CategoryAvatar player={player} size={36} active={index === 0 && player.score > 0} />
              <span className="min-w-0 flex-1 truncate text-base font-medium">{player.name}</span>
              <strong className="shrink-0 text-lg tabular-nums text-[#f2bc66]">{t('games.category.scorePoints', { score: player.score })}</strong>
            </motion.li>
          ))}
        </ol>
      </Panel>
      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-[#060810] via-[#060810] to-transparent pb-2 pt-6">
        {canAdvance ? (
          <button type="button" className={primaryButton} onClick={onNext}>
            {round < maxRounds ? t('games.category.nextRound') : t('games.category.results')}<ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <p className="text-center text-sm text-white/60">{t('games.category.hostContinues', 'Der Host startet gleich die nächste Runde.')}</p>
        )}
      </div>
    </div>
  );
}
