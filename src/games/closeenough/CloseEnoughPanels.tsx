/**
 * NAH DRAN — Bildschirmteile des Spiels: Kopf mit Uhr und Frage, Eingabe,
 * Weiterreichen (ein Handy), Auflösung, Runden-Auftakt und Verlassen-Dialog.
 * Reine Darstellung; Zustand und Regeln liegen in CloseEnoughGame.
 */
import { avatarOrFallback } from '../multiplayer/seat-avatar';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, ExternalLink, Target, Trophy } from 'lucide-react';
import { hasShellBackButton } from '../ui/shell-back';
import { PartyTurnRibbon, type TurnRibbonPlayer } from '../ui/PartyTurnRibbon';
import { partyMotion, playerGlow, readableOn } from '@/lib/party-motion';
import { formatNumber } from './number-format';
import { type CeResult } from './closeenough-scoring';
import { NumberEntry } from './NumberEntry';
import { RevealChart, type RevealMark } from './RevealChart';
import { BullseyeBurst, CloseEnoughAtmosphere, CountUp } from './CloseEnoughAtmosphere';
import { categoryLabelKey, formatAnswer, questionText, type CeQuestion } from './closeenough-content';
import { CE, CHART_THEME, ENTRY_THEME, type Player } from './ce-theme';

type SeatOf = (id: string) => { avatar?: string; color?: string } | undefined;

export function CeHeader({ round, totalRounds, timeLeft, duration, guessing, question, onLeave }: {
  round: number; totalRounds: number; timeLeft: number; duration: number; guessing: boolean;
  question: CeQuestion | null; onLeave: () => void;
}) {
  const { t } = useTranslation();
  const urgent = guessing && timeLeft <= 5 && timeLeft > 0;
  return (
    <>
      {/* Kopf: Runde, Uhr, Ausstieg */}
      <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
        {/* In der App löst der FloatingBackButton über den Back-Guard denselben
            Dialog aus — dort nur unsichtbar schalten, nicht entfernen, damit
            Runde und Punkte in der Kopfzeile stehen bleiben, wo sie waren. */}
        <button
          onClick={onLeave}
          className={`min-h-11 text-xs font-bold${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
          style={{ color: CE.dim }}
        >
          ← {t('games.closeenough.leave')}
        </button>
        <div className="text-xs font-bold tabular-nums" style={{ color: CE.dim }}>
          {t('games.closeenough.roundOf', { round: round + 1, total: totalRounds })}
        </div>
        {/* Uhr als Ring: Die verbleibende Zeit ist damit eine Form, keine
            Zahl, die man erst lesen muss. Unter fünf Sekunden pulst sie. */}
        <motion.div
          className="relative w-9 h-9 flex items-center justify-center"
          animate={urgent ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={{ duration: 0.7, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={CE.surface} strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
              stroke={timeLeft <= 5 ? CE.bad : CE.accent}
              strokeDasharray={2 * Math.PI * 15.5}
              strokeDashoffset={2 * Math.PI * 15.5 * (1 - Math.max(0, timeLeft) / duration)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="text-xs font-black tabular-nums" style={{ color: timeLeft <= 5 && guessing ? CE.bad : CE.accent }}>
            {guessing ? timeLeft : 0}
          </span>
        </motion.div>
      </div>

      {/* Frage */}
      <div className="relative z-10 px-4">
        <motion.div
          key={question?.id ?? 'none'}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="rounded-3xl p-5 border"
          style={{ background: CE.elevated, borderColor: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}
        >
          {question && (
            <span className="inline-block mb-2 px-2.5 py-1 rounded-full text-[13px] font-black" style={{ background: CE.surface, color: CE.dim }}>
              {t(categoryLabelKey(question.category))}
            </span>
          )}
          <p dir="auto" className="text-lg font-black leading-snug">{question ? questionText(question, t) : ''}</p>
        </motion.div>

        {/* Uhrbalken */}
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: CE.surface }}>
          <div
            className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${(timeLeft / duration) * 100}%`, background: timeLeft <= 5 ? CE.bad : CE.accent }}
          />
        </div>
      </div>
    </>
  );
}

export function CeReveal({ question, results, marks, players, isOnline, myResult, truthLabel, lang, canAdvance, isLast, onNext }: {
  question: CeQuestion; results: CeResult[]; marks: RevealMark[]; players: Player[]; isOnline: boolean;
  myResult: CeResult | null; truthLabel: string; lang: string; canAdvance: boolean; isLast: boolean; onNext: () => void;
}) {
  const { t } = useTranslation();
  const winners = results.filter((r) => r.value !== null && r.rank === 1);
  return (
    <motion.div key="reveal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 px-4 mt-4 pb-10">
      <div className="rounded-3xl p-4" style={{ background: CE.surface }}>
        <RevealChart marks={marks} truth={question.answer} tolerancePct={question.tolerancePct} unitKey={question.unitKey}
          lang={lang} truthLabel={truthLabel} theme={CHART_THEME} />
      </div>

      {/*
        Offline sitzen alle vor DEMSELBEN Gerät — dort gehört die ganze
        Rangliste hin, nicht nur das Ergebnis dessen, der zuletzt getippt
        hat. Online sieht jeder nur sein eigenes Ergebnis; die Zahlen der
        anderen stehen ohnehin auf der Achse.
      */}
      {!isOnline && results.length > 0 && (
        <div className="mt-3 rounded-3xl p-2" style={{ background: CE.surface }}>
          {results.map((r) => {
            const rp = players.find((x) => x.id === r.playerId);
            return (
              <motion.div key={r.playerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * r.rank, type: 'spring', stiffness: 320, damping: 26 }}
                className="flex items-center gap-3 px-3 py-2">
                <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                  style={{ background: r.bonus ? CE.gold : (rp?.color ?? CE.accent), color: CE.bg }}>
                  {r.rank}
                </span>
                <span dir="auto" className="flex-1 min-w-0 break-words line-clamp-2 text-sm font-bold leading-tight">{rp?.name}</span>
                <span className="text-xs tabular-nums" style={{ color: CE.dim }}>
                  {r.value === null ? t('games.closeenough.noGuess') : formatAnswer(r.value, question.unitKey, lang)}
                </span>
                <span className="text-sm font-black tabular-nums w-14 text-end" style={{ color: r.bonus ? CE.gold : CE.truth }}>
                  <CountUp value={r.points} prefix="+" />
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Das eigene Ergebnis in Worten — die Achse zeigt das Bild, hier steht die Zahl. */}
      {isOnline && myResult && (
        <div className="mt-3 rounded-3xl p-4 text-center" style={{ background: CE.surface }}>
          {myResult.value === null ? (
            <p className="text-sm font-bold" style={{ color: CE.dim }}>{t('games.closeenough.noGuess')}</p>
          ) : (
            <>
              <p className="text-sm" style={{ color: CE.dim }}>
                {t('games.closeenough.yourGuess')}:{' '}
                <span className="font-black tabular-nums" style={{ color: CE.text }}>{formatAnswer(myResult.value, question.unitKey, lang)}</span>
              </p>
              <p className="mt-1 text-sm font-black" style={{ color: myResult.bonus ? CE.gold : CE.accent }}>
                {myResult.bonus
                  ? t('games.closeenough.exactHit')
                  : t('games.closeenough.offBy', { percent: formatNumber(myResult.relErr * 100, lang, 1) })}
              </p>
            </>
          )}
          <div className="relative mt-2">
            {myResult.bonus && <BullseyeBurst color={CE.gold} />}
            <p className="text-2xl font-black tabular-nums" style={{ color: CE.truth }}>
              <CountUp value={myResult.points} prefix="+" /> {t('games.closeenough.points')}
            </p>
          </div>
        </div>
      )}

      {/* Rundensieger */}
      <p className="mt-3 text-center text-sm" style={{ color: CE.dim }}>
        {winners.length === 0 ? t('games.closeenough.nobody') : (
          <>
            <Trophy className="w-4 h-4 inline me-1" style={{ color: CE.gold }} />
            {t('games.closeenough.roundWinner', { name: winners.map((w) => players.find((p) => p.id === w.playerId)?.name ?? '').join(', ') })}
          </>
        )}
      </p>

      {/* Beleg. Bei einer Zahl ist die Herkunft die einzige Möglichkeit, einen Streit am Spieltisch zu beenden. */}
      <p className="mt-3 text-center text-[13px] leading-snug" style={{ color: CE.dim }}>
        {t('games.closeenough.source')}:{' '}
        {question.sourceUrl ? (
          <a href={question.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
            {question.sourceLabel}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : question.sourceLabel}
        {question.asOfYear ? ` · ${question.asOfYear}` : ''}
      </p>

      {/* Weiter darf nur der Host — sonst springen zwei Geräte gleichzeitig. */}
      {canAdvance && (
        <button onClick={onNext} className="mt-4 w-full h-14 rounded-2xl font-black flex items-center justify-center gap-2" style={{ background: CE.accent, color: CE.bg }}>
          {isLast ? t('games.closeenough.finish') : t('games.closeenough.next')}
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      )}
    </motion.div>
  );
}

/** Ein Handy, mehrere Spieler: Gerät weiterreichen (nur lokal). */
export function CePass({ player, onReady }: { player: Player; onReady: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div key="pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 px-4 mt-10 pb-10 text-center">
      <p className="text-sm" style={{ color: CE.dim }}>{t('games.closeenough.passTo')}</p>
      <p dir="auto" className="text-3xl font-black mt-2 text-white">{player.name}</p>
      <button onClick={onReady} className="mt-8 w-full h-14 rounded-2xl font-black" style={{ background: CE.accent, color: CE.bg }}>
        {t('games.closeenough.passReady')}
      </button>
    </motion.div>
  );
}

export function CeEntry({ activePlayer, ribbon, submitted, players, submittedSet, seatOf, raw, onRawChange, onSubmit, lang, unitLabel, unitKey, hint, hintShown, onShowHint }: {
  activePlayer: Player | null;
  /** Party: wer an DIESEM Handy gerade schätzt (Host selbst oder ein 🔁-Gast). */
  ribbon?: TurnRibbonPlayer;
  submitted: boolean; players: Player[]; submittedSet: ReadonlySet<string>; seatOf: SeatOf;
  raw: string; onRawChange: (raw: string) => void; onSubmit: () => void; lang: string; unitLabel: string;
  unitKey: string | undefined; hint: string | null; hintShown: boolean; onShowHint: () => void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const done = players.filter((p) => submittedSet.has(p.id)).length;
  return (
    <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 px-4 mt-4 pb-10">
      {activePlayer && !submitted && (ribbon
        ? <PartyTurnRibbon className="mb-3" player={ribbon} kind="me" line={t('games.closeenough.partyYourEstimate', 'Dein Tipp bleibt geheim bis zur Auflösung.')} />
        : <p dir="auto" className="mb-2 text-center text-sm font-bold" style={{ color: activePlayer.color }}>{activePlayer.name}</p>)}

      {submitted || !activePlayer ? (
        // Abgegeben: ab hier zeigt die Fläche, WER schon dran war — nie, WAS jemand getippt hat.
        <div data-testid="ce-submitted" className="rounded-[28px] p-6 text-center" style={{ background: CE.surface, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          <motion.span variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" className="inline-grid">
            <Check className="w-10 h-10 mx-auto" style={{ color: CE.truth }} />
          </motion.span>
          <p className="mt-2 font-black">{t('games.closeenough.submitted')}</p>
          <p className="mt-1 text-sm tabular-nums" style={{ color: CE.dim }}>
            {t('games.closeenough.waitingOthers', { done, total: players.length })}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {players.map((p) => {
              const isDone = submittedSet.has(p.id);
              const seat = seatOf(p.id);
              const color = seat?.color || p.color;
              return (
                <span key={p.id} className="min-h-9 ps-1 pe-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-opacity"
                  style={{ background: CE.elevated, color: isDone ? CE.text : CE.dim, opacity: isDone ? 1 : 0.6, boxShadow: isDone ? playerGlow(color, 'soft') : undefined }}>
                  <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full text-sm" style={{ background: color, color: readableOn(color) }}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : avatarOrFallback(seat?.avatar, p.id)}
                  </span>
                  <span dir="auto">{p.name}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <NumberEntry
          raw={raw}
          onRawChange={onRawChange}
          onSubmit={onSubmit}
          lang={lang}
          unitLabel={unitLabel}
          allowNegative={unitKey === 'year'}
          // Jahreszahlen weder gruppieren noch als Wort zeigen: „1.515" und „1,5 Tausend" sind als Jahresangabe beide falsch.
          isYear={unitKey === 'year'}
          hint={hint}
          hintShown={hintShown}
          onShowHint={onShowHint}
          theme={ENTRY_THEME}
        />
      )}
    </motion.div>
  );
}

/** Runden-Auftakt — deckt die Fläche kurz zu, damit die neue Frage einen eigenen Moment bekommt. */
export function CeIntro({ show, round }: { show: boolean; round: number }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="intro" data-testid="ce-intro" className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ background: CE.bg }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.45 } }}>
          <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} intense />
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="relative z-10 text-center">
            <Target className="w-12 h-12 mx-auto mb-3" style={{ color: CE.accent }} />
            <p className="text-4xl font-black" style={{ color: CE.text }}>{t('games.closeenough.roundIntro', { round: round + 1 })}</p>
            <p className="mt-2 text-sm" style={{ color: CE.dim }}>{t('games.closeenough.getReady')}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CeExitConfirm({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: CE.elevated }}>
            <p className="text-lg font-black">{t('games.closeenough.leaveTitle')}</p>
            <p className="mt-2 text-sm" style={{ color: CE.dim }}>{t('games.closeenough.leaveBody')}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={onStay} className="h-12 rounded-2xl font-black" style={{ background: CE.surface, color: CE.text }}>
                {t('games.closeenough.leaveStay')}
              </button>
              <button onClick={onLeave} className="h-12 rounded-2xl font-black" style={{ background: CE.bad, color: CE.bg }}>
                {t('games.closeenough.leaveGo')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
