import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Ban, Check, Ear, Eye, Play, SkipForward, Tv, X } from 'lucide-react';
import { StageAction, StagePanel } from '../ui/GameStage';
import { cardEnter, countdownTick, handoverReveal, playerGlow, pressable } from '@/lib/party-motion';
import type { TabooCard } from '../content/taboo-words';
import type { TabooSeat, TabooSeatRole } from './taboo-seats';

/**
 * Handy-Bildschirme von WORTVERBOT (Design §9): Buehne oben (wer erklaert,
 * gross, in seinem Licht), Handlung unten in der Daumenzone. Die Karte
 * rendert AUSSCHLIESSLICH `SecretCard` — und nur, wenn der Aufrufer
 * `mayHolderSeeCard` bejaht hat (`card` ist sonst null).
 */
const seatVars = (color: string): CSSProperties => ({ '--seat': color } as CSSProperties);

export function SeatAvatar({ seat, size = 96, active = false }: { seat: TabooSeat; size?: number; active?: boolean }) {
  return (
    <span aria-hidden className="taboo-avatar" style={{ width: size, height: size, fontSize: size * 0.48, boxShadow: playerGlow(seat.color, active ? 'active' : 'soft'), background: `radial-gradient(circle at 30% 25%, ${seat.color}66, ${seat.color}1f)` }}>
      {seat.avatar}
    </span>
  );
}

/** Buehne: der Erklaerer. `mine` = dieses Handy haelt gerade eine Rolle in diesem Zug. */
export function SeatStage({ seat, eyebrow, line, mine, trailing, compact = false }: { seat: TabooSeat; eyebrow: ReactNode; line: ReactNode; mine: boolean; trailing?: ReactNode; compact?: boolean }) {
  return (
    <header className={`taboo-seat-stage${mine ? ' is-mine' : ''}${compact ? ' is-compact' : ''}`} style={seatVars(seat.color)}>
      <SeatAvatar seat={seat} size={compact ? 52 : 104} active={mine} />
      <div className="min-w-0 flex-1">
        <p className="taboo-label">{eyebrow}</p>
        <h1 className="taboo-stage-name">{seat.name}</h1>
        <div className="taboo-stage-line">{line}</div>
      </div>
      {trailing}
    </header>
  );
}

function RolePill({ role, team }: { role: TabooSeatRole; team: string }) {
  const { t } = useTranslation();
  const label = {
    explainer: t('games.taboo.role.explainer', 'Du erklärst'),
    referee: t('games.taboo.role.referee', 'Du bist Schiri'),
    guesser: t('games.taboo.role.guesser', 'Du rätst mit'),
    watcher: t('games.taboo.role.watcher', { team, defaultValue: '{{team}} ist dran' }),
  }[role];
  const Icon = role === 'explainer' ? Play : role === 'referee' ? Eye : role === 'guesser' ? Ear : Tv;
  return <span className={`taboo-role-pill is-${role}`}><Icon className="h-4 w-4" aria-hidden />{label}</span>;
}

/** Kein Geheimnis zu sehen: ruhige Buehne statt leerem Bildschirm. */
function ListenCard({ title, body, seat }: { title: ReactNode; body: ReactNode; seat: TabooSeat }) {
  return (
    <div role="status" className="taboo-listen" style={seatVars(seat.color)}>
      <Ear className="h-6 w-6 shrink-0" aria-hidden />
      <div><p className="taboo-listen-title">{title}</p><p className="taboo-listen-body">{body}</p></div>
    </div>
  );
}

export interface TurnStartProps {
  explainer: TabooSeat; teamName: string; round: number; total: number; countdown: number | null;
  role: TabooSeatRole; canBegin: boolean; onBegin: () => void;
}

export function TurnStartScreen({ explainer, teamName, round, total, countdown, role, canBegin, onBegin }: TurnStartProps) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  const mine = role === 'explainer';
  const hint = {
    explainer: t('games.taboo.turn.explainerHint', 'Tippe auf Start, sobald dein Team bereit ist. Dein Team darf nicht aufs Handy schauen.'),
    referee: t('games.taboo.turn.refereeHint', 'Du liest die Karte mit und drückst „Tabu!“, sobald ein verbotenes Wort fällt.'),
    guesser: t('games.taboo.turn.guesserHint', { name: explainer.name, defaultValue: '{{name}} erklärt gleich – hör gut zu und rate laut.' }),
    watcher: t('games.taboo.turn.watcherHint', { name: explainer.name, team: teamName, defaultValue: '{{name}} erklärt gleich für {{team}}.' }),
  }[role];
  return (
    <section className="taboo-screen">
      <SeatStage seat={explainer} mine={mine} eyebrow={t('games.taboo.turn.roundLabel', { current: round, total })}
        line={t('games.taboo.turn.isUp', { team: teamName })} />
      <RolePill role={role} team={teamName} />
      <div className="taboo-center">
        {/* popLayout, not wait: the role card shows at once, even if a tab throttles the countdown's exit tween. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {countdown !== null
            ? <motion.p key={`c${countdown}`} className="taboo-countdown tabular-nums" variants={countdownTick} initial={reduce ? false : 'initial'} animate="animate" exit="exit">{countdown}</motion.p>
            : mine || role === 'referee'
              ? <motion.div key="back" data-testid={mine ? 'taboo-card-back' : 'taboo-referee-preview'} className="taboo-card-back" style={seatVars(explainer.color)} variants={cardEnter} initial={false} animate="animate" exit="exit">
                  <Ban className="h-10 w-10" aria-hidden />
                  <p>{mine ? t('games.taboo.turn.cardBack', 'Deine Karte liegt verdeckt bereit')
                    : t('games.taboo.turn.refereePreview', { name: explainer.name, defaultValue: 'Du siehst die Karte, sobald {{name}} erklärt' })}</p>
                </motion.div>
              : <motion.p key="hint" className="taboo-hint" variants={cardEnter} initial={false} animate="animate" exit="exit">{hint}</motion.p>}
        </AnimatePresence>
        {(mine || role === 'referee') && countdown === null && <p className="taboo-hint">{hint}</p>}
      </div>
      <div className="taboo-thumb">
        {canBegin
          ? <motion.div {...pressable}><StageAction className="w-full" disabled={countdown !== null} onClick={onBegin}><Play className="h-5 w-5" />{t('games.taboo.turn.startBtn')}</StageAction></motion.div>
          : countdown === null && <p className="taboo-wait">{t('games.taboo.turn.waitingFor', { name: explainer.name, defaultValue: 'Warte auf {{name}} …' })}</p>}
      </div>
    </section>
  );
}

/** Die geheime Karte. Wird nur gerendert, wenn der Halter sie sehen darf. */
function SecretCard({ card, cardKey, label }: { card: TabooCard; cardKey: number; label: string }) {
  const reduce = !!useReducedMotion();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={cardKey} variants={handoverReveal} initial={reduce ? false : 'initial'} animate="animate" exit="exit" className="taboo-card-slot flex-1 flex">
        <StagePanel className="taboo-word-card flex-1" data-testid="taboo-secret-card">
          <p className="mb-5 text-xs font-semibold tracking-wide text-[#c5bbb3]">{label}</p>
          <h2 className="mb-8 text-[clamp(2.5rem,8vw,5.8rem)] font-black tracking-tight leading-none text-[#fff9ed] break-words">{card.term}</h2>
          <ul className="divide-y divide-[#ff8572]/20">{card.forbidden.map((word, index) => <li key={index} className="flex items-center gap-4 py-3 text-xl sm:text-2xl text-[#ff9b88]"><Ban className="h-5 w-5 shrink-0" /><span className="break-words min-w-0">{word}</span></li>)}</ul>
        </StagePanel>
      </motion.div>
    </AnimatePresence>
  );
}

export interface PlayingProps {
  explainer: TabooSeat; teamName: string; role: TabooSeatRole; card: TabooCard | null; cardKey: number;
  timeLeft: number; total: number; scoreLine: ReactNode; correct: number; misses: number;
  can: (action: 'correct' | 'skip' | 'taboo' | 'referee') => boolean; onAction: (action: 'correct' | 'skip' | 'taboo' | 'referee') => void;
}

export function PlayingScreen({ explainer, teamName, role, card, cardKey, timeLeft, total, scoreLine, correct, misses, can, onAction }: PlayingProps) {
  const { t } = useTranslation();
  const mine = role === 'explainer' || role === 'referee';
  const timerChip = <span className={`taboo-timer tabular-nums${timeLeft <= 10 ? ' is-low' : ''}`}>{timeLeft}s</span>;
  return (
    <div className="taboo-playing mx-auto flex w-full max-w-4xl min-h-[80dvh] flex-col gap-5">
      <SeatStage compact seat={explainer} mine={mine} eyebrow={scoreLine} line={<RolePill role={role} team={teamName} />} trailing={timerChip} />
      <div className="taboo-progress" aria-hidden><span style={{ width: `${total > 0 ? Math.max(0, Math.min(100, (timeLeft / total) * 100)) : 0}%` }} /></div>
      {card
        ? <SecretCard card={card} cardKey={cardKey} label={role === 'referee' ? t('games.taboo.refereeRole') : t('games.taboo.playing.currentWord')} />
        : role === 'guesser'
          ? <ListenCard seat={explainer} title={t('games.taboo.playing.guessTitle', 'Rate laut!')} body={t('games.taboo.playing.guessBody', { name: explainer.name, defaultValue: 'Die Karte siehst du nicht – hör {{name}} gut zu.' })} />
          : <ListenCard seat={explainer} title={t('games.taboo.playing.watchTitle', { name: explainer.name, defaultValue: '{{name}} erklärt' })} body={t('games.taboo.playing.watchBody', 'Schau auf den Fernseher und lach mit.')} />}
      <p className="text-sm text-[var(--stage-muted)] tabular-nums">{t('games.taboo.playing.correctCount', { count: correct })} · {t('games.taboo.playing.skipCount', { count: misses })}</p>
      {role === 'explainer' && card && <div className="stage-footer !grid grid-cols-3 gap-2 sm:gap-3">
        <StageAction variant="danger" className="!px-2 flex-col sm:flex-row" disabled={!can('taboo')} onClick={() => onAction('taboo')}><X className="h-5 w-5" />{t('games.taboo.playing.tabooBtn')}</StageAction>
        <StageAction variant="secondary" className="!px-2 flex-col sm:flex-row" disabled={!can('skip')} onClick={() => onAction('skip')}><SkipForward className="h-5 w-5" />{t('games.taboo.playing.skipBtn')}</StageAction>
        <StageAction className="!px-2 flex-col sm:flex-row" disabled={!can('correct')} onClick={() => onAction('correct')}><Check className="h-5 w-5" />{t('games.taboo.playing.correctBtn')}</StageAction>
      </div>}
      {role === 'referee' && card && <div className="stage-footer">
        <motion.div {...pressable} className="w-full"><StageAction variant="danger" className="w-full taboo-buzz" disabled={!can('referee')} onClick={() => onAction('referee')}><Ban className="h-6 w-6" />{t('games.taboo.playing.tabooBtn')}</StageAction></motion.div>
        <p className="taboo-hint mt-2">{t('games.taboo.playing.refereeHint', 'Verbotenes Wort gehört? Sofort drücken.')}</p>
      </div>}
    </div>
  );
}
