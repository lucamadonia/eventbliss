import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Eye, Lightbulb, RotateCcw, Trophy, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkPop, playerGlow, pressable } from '@/lib/party-motion';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { StageAction } from '../ui/GameStage';
import { GameEndOverlay } from '../social/GameEndOverlay';
import type { EmojiPuzzle } from './emoji-content';
import { emojiTeamOf } from './game-rules';

/**
 * Phone screens of EMOJI-RATEN (design §9): a stage on top (the puzzle holder,
 * big, in his own light) and the action in the thumb zone below. The answer is
 * only ever rendered by `RevealScreen`.
 */
export interface EmojiSeat { id: string; name: string; avatar: string; color: string; score: number; team?: number }

const glowBg = (color: string): CSSProperties => ({ '--seat': color } as CSSProperties);

export function SeatBubble({ seat, size = 88, active = false }: { seat: EmojiSeat; size?: number; active?: boolean }) {
  return (
    <span aria-hidden className="emoji-seat-bubble" style={{ width: size, height: size, fontSize: size * 0.5, boxShadow: playerGlow(seat.color, active ? 'active' : 'soft'), background: `radial-gradient(circle at 30% 25%, ${seat.color}66, ${seat.color}22)` }}>
      {seat.avatar}
    </span>
  );
}

/** Stage: who holds the puzzle. `mine` lights the screen in his colour. */
export function HolderStage({ seat, eyebrow, line, mine, trailing, compact = false }: { seat: EmojiSeat; eyebrow: ReactNode; line: ReactNode; mine: boolean; trailing?: ReactNode; compact?: boolean }) {
  return (
    <header className={cn('emoji-stage', mine && 'is-mine', compact && 'is-compact')} style={glowBg(seat.color)}>
      <SeatBubble seat={seat} size={compact ? 56 : 104} active={mine} />
      <div className="emoji-stage-text">
        <p className="emoji-label">{eyebrow}</p>
        <h1 className="emoji-stage-name">{seat.name}</h1>
        <p className="emoji-stage-line">{line}</p>
      </div>
      {trailing}
    </header>
  );
}

/** Calm waiting stage instead of an empty screen: look at the TV. */
export function WatchCard({ seat, title }: { seat: EmojiSeat; title?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="emoji-watch" style={glowBg(seat.color)}>
      <Tv className="h-5 w-5" aria-hidden />
      <div>
        <p className="emoji-watch-title">{title ?? t('games.emojiguess.watchTitle', { name: seat.name, defaultValue: '{{name}} rät gerade' })}</p>
        <p className="emoji-watch-body">{t('games.emojiguess.watchBody', { defaultValue: 'Schau auf den Fernseher und rate leise mit.' })}</p>
      </div>
    </div>
  );
}

export function ReadyScreen({ seat, round, total, seconds, points, holder, onReady }: { seat: EmojiSeat; round: number; total: number; seconds: number; points: number; holder: boolean; onReady: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="rebus-ready emoji-screen">
      <HolderStage seat={seat} mine={holder} eyebrow={t('games.findit.roundLabel', { current: round, total })}
        line={holder ? t('games.emojiguess.yourTurn', { defaultValue: 'Du bist dran' }) : t('games.emojiguess.nextUp', { defaultValue: 'ist als Nächstes dran' })} />
      <div className="emoji-panel">
        <h2 className="emoji-title">{t('games.emojiguess.readyTitle', { defaultValue: 'Dein Rätsel wartet' })}</h2>
        <p>{t('games.emojiguess.readyBody', { defaultValue: 'Lies die Bilder von links nach rechts. Gesucht ist ein Begriff aus der angezeigten Kategorie.' })}</p>
        <p className="emoji-facts"><span>{seconds} s</span><span>{points} {t('games.emojiguess.pointsAvailable')}</span></p>
      </div>
      <div className="emoji-thumb">
        {holder
          ? <motion.div {...pressable}><StageAction className="emoji-primary" onClick={onReady}>{t('games.emojiguess.readyStart', { defaultValue: 'Bereit – Rätsel zeigen' })}<ArrowRight className="h-5 w-5" /></StageAction></motion.div>
          : <WatchCard seat={seat} title={t('games.emojiguess.waitingFor', { name: seat.name, defaultValue: 'Warte auf {{name}}' })} />}
      </div>
    </section>
  );
}

export interface PlayingProps {
  seat: EmojiSeat; puzzle: EmojiPuzzle; round: number; total: number; timeLeft: number; percentLeft: number;
  points: number; showHint: boolean; holder: boolean; teamNote: ReactNode; teams: ReactNode;
  answer: string; answerError: boolean; onAnswer: (v: string) => void; onSubmit: () => void; onReveal: () => void; onSkip: () => void;
}

export function PlayingScreen(p: PlayingProps) {
  const { t } = useTranslation();
  const submit = (e: FormEvent) => { e.preventDefault(); if (p.answer.trim()) p.onSubmit(); };
  return (
    <div className="flex-1 flex flex-col emoji-screen">
      <div className="emoji-timebar" aria-hidden><motion.span className={cn(p.percentLeft <= 25 && 'is-low')} initial={{ width: '100%' }} animate={{ width: `${p.percentLeft}%` }} transition={{ duration: 0.3 }} /></div>
      <HolderStage compact seat={p.seat} mine={p.holder} eyebrow={t('games.findit.roundLabel', { current: p.round, total: p.total })}
        line={`${p.puzzle.category} · ${p.puzzle.difficulty}/3`}
        trailing={<span className="rebus-clock" role="timer">{p.timeLeft}<small>s</small></span>} />
      <div className="rebus-poster" aria-label={t('games.emojiguess.clueLabel', { defaultValue: 'Bilderrätsel' })}>
        <span className="rebus-caption">{t('games.emojiguess.clueLabel', { defaultValue: 'Bilderrätsel' })}</span>
        <div className="rebus-glyphs">{p.puzzle.emojis}</div>
        <div className="rebus-clue-meta"><span><strong>{p.points}</strong> {t('games.emojiguess.pointsAvailable')}</span>
          {p.showHint && <span className="rebus-hint"><Lightbulb className="h-4 w-4" />{t('games.emojiguess.hintPrefix', { letter: p.puzzle.answer.charAt(0) })}</span>}
        </div>
      </div>
      {p.teamNote}
      {p.teams}
      <form className="rebus-controls emoji-thumb" onSubmit={submit}>
        {p.holder ? <>
          <label htmlFor="rebus-answer" className="emoji-label">{t('games.emojiguess.answerLabel')}</label>
          <div className="rebus-entry">
            <input id="rebus-answer" value={p.answer} onChange={e => p.onAnswer(e.target.value)} maxLength={120}
              autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" aria-invalid={p.answerError} aria-describedby={p.answerError ? 'rebus-error' : undefined}
              placeholder={t('games.emojiguess.answerLabel')} />
            <StageAction type="submit" className="emoji-primary" disabled={!p.answer.trim()}>{t('games.emojiguess.submitAnswer', { defaultValue: 'Antwort prüfen' })}<ArrowRight className="h-5 w-5" /></StageAction>
          </div>
          {p.answerError && <p id="rebus-error" role="status" className="rebus-error">{t('games.emojiguess.tryAgain', { defaultValue: 'Noch nicht richtig. Versuche einen anderen Begriff.' })}</p>}
          <div className="rebus-secondary-actions">
            <StageAction type="button" variant="ghost" onClick={p.onReveal}><Eye className="h-4 w-4" />{t('games.emojiguess.showAnswer')}</StageAction>
            <StageAction type="button" variant="ghost" onClick={p.onSkip}>{t('games.emojiguess.skipPuzzle', { defaultValue: 'Überspringen' })}</StageAction>
          </div>
        </> : <WatchCard seat={p.seat} />}
      </form>
    </div>
  );
}

export function TeamLine({ players, label }: { players: EmojiSeat[]; label: (team: number) => string }) {
  return (
    <div className="emoji-teams">
      {[0, 1].map(team => {
        const members = players.filter((p, i) => emojiTeamOf(p, i) === team);
        return <p key={team}><span className="emoji-label">{label(team)}</span><span>{members.map(p => p.name).join(', ')}</span><strong>{members[0]?.score ?? 0}</strong></p>;
      })}
    </div>
  );
}

export function RevealScreen({ seat, puzzle, points, nextName, canAdvance, onNext }: { seat: EmojiSeat; puzzle: EmojiPuzzle; points: number; nextName: string | null; canAdvance: boolean; onNext: () => void }) {
  const { t } = useTranslation();
  const solved = points > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rebus-result emoji-screen flex-1 flex flex-col items-center justify-center gap-5 py-6 max-w-lg mx-auto w-full">
      <HolderStage seat={seat} mine={solved} eyebrow={t(solved ? 'games.emojiguess.solved' : 'games.emojiguess.solution', { defaultValue: solved ? 'Gelöst' : 'Auflösung' })}
        line={solved ? t('games.emojiguess.solvedBy', { defaultValue: 'hat es erraten' }) : t('games.emojiguess.notSolved', { defaultValue: 'diesmal nicht erraten' })} />
      <div className="stage-panel stage-panel--paper rebus-solution">
        <div className="rebus-glyphs">{puzzle.emojis}</div>
        <p className="rebus-caption">{puzzle.category}</p>
        <h2>{puzzle.answer}</h2>
      </div>
      <motion.p role="status" className="rebus-score" variants={checkPop} initial="initial" animate="animate">+{points}</motion.p>
      {nextName && <p className="emoji-next">{t('games.emojiguess.nextPlayer', { name: nextName, defaultValue: 'Als Nächstes: {{name}}' })}</p>}
      <div className="emoji-thumb w-full">
        <motion.div {...pressable}><StageAction className="emoji-primary w-full" disabled={!canAdvance} onClick={onNext}>{t('games.play.next')} <ArrowRight className="w-5 h-5" /></StageAction></motion.div>
      </div>
    </motion.div>
  );
}

export function GameOverScreen({ sorted, achievements, onDismiss, canReplay, onReplay, onLeave }: { sorted: EmojiSeat[]; achievements: Parameters<typeof GameEndOverlay>[0]['achievements']; onDismiss: () => void; canReplay: boolean; onReplay: () => void; onLeave: () => void }) {
  const { t } = useTranslation();
  const top = sorted[0];
  const winners = top ? sorted.filter(p => p.score === top.score) : [];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="emoji-screen flex-1 flex flex-col items-center justify-center gap-6 py-8 max-w-lg mx-auto w-full">
      <GameEndOverlay achievements={achievements} onDismiss={onDismiss} />
      {top && <header className="emoji-stage is-mine emoji-podium" style={glowBg(top.color)}>
        <motion.span variants={checkPop} initial="initial" animate="animate"><SeatBubble seat={top} size={112} active /></motion.span>
        <div className="emoji-stage-text">
          <p className="emoji-label"><Trophy className="inline h-4 w-4 mr-1" aria-hidden />{t('games.results.gameOver')}</p>
          <h1 className="emoji-stage-name">{winners.map(p => p.name).join(' & ')}</h1>
          <p className="emoji-stage-line">{t('games.findit.points', { score: top.score })}</p>
        </div>
      </header>}
      <ol className="w-full space-y-2">
        {sorted.map((p, i) => (
          <motion.li key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
            className={cn('emoji-rank', i === 0 && 'is-top')} style={glowBg(p.color)}>
            <span className="emoji-rank-pos">{i + 1}</span>
            <SeatBubble seat={p} size={36} active={i === 0} />
            <span className="flex-1 truncate font-medium">{p.name}</span>
            <span className="emoji-rank-score">{p.score}</span>
          </motion.li>
        ))}
      </ol>
      <div className="emoji-thumb w-full space-y-3">
        <motion.div {...pressable}><StageAction className="emoji-primary w-full" disabled={!canReplay} onClick={onReplay}><RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}</StageAction></motion.div>
        {/* Nur im Web. In der App macht das der FloatingBackButton. */}
        {!hasShellBackButton() && <StageAction variant="ghost" className="w-full" onClick={onLeave}>{t('games.results.otherGame')}</StageAction>}
      </div>
    </motion.div>
  );
}
