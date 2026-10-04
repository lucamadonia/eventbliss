import { avatarOrFallback } from '@/games/multiplayer/seat-avatar';
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EyeOff, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyMotion, playerGlow, readableOn } from '@/lib/party-motion';
import type { CharacterView } from './party-seats';

/** Gegen die Papier-Farben aus design.css: Text erbt immer die Umgebung. */
const INHERIT = { color: 'inherit' } as const;

/** Design §9: Grund → Panel → aktives Element. */
export const DEPTH = { ground: '#060810', panel: '#0d0915', active: '#16101f' } as const;

interface Seat { id: string; name: string; avatar: string; color: string }

/** Avatar mit persoenlichem Farbschein (Ring + Glow, nie als Textfarbe). */
export function SeatAvatar({ seat, size = 56, active = false }: { seat: Seat; size?: number; active?: boolean }) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `radial-gradient(circle at 30% 25%, ${seat.color}66, ${seat.color}22)`,
        boxShadow: active ? playerGlow(seat.color, 'active') : `inset 0 0 0 2px ${seat.color}aa` }}>
      {avatarOrFallback(seat.avatar, seat.id)}
    </span>
  );
}

/**
 * Buehne oben (Design §9.1): wer dran ist, gross und in seiner Farbe; darunter
 * die Handlung in der Daumenzone (`children`).
 */
export function PartyStage({ seat, eyebrow, title, subtitle, children, testId, contentTop = false }: {
  seat?: Seat; eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; children?: ReactNode; testId?: string;
  /** Content follows the subline directly (lists) instead of sitting in the thumb zone. */
  contentTop?: boolean;
}) {
  const reduce = !!useReducedMotion();
  const glow = seat?.color ?? '#ef987e';
  return (
    <motion.div data-testid={testId} data-seat-id={seat?.id} variants={partyMotion('phaseStage', reduce)} initial="initial" animate="animate" exit="exit"
      className="relative flex flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]" style={{ background: DEPTH.ground }}>
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 22%, ${glow}2e 0%, ${glow}0f 34%, transparent 64%)` }} />
      <div className="relative flex min-h-[34dvh] flex-col items-center justify-center gap-3 pt-6 text-center">
        {seat && <SeatAvatar seat={seat} size={104} active />}
        {eyebrow && <p className="text-[0.8125rem] font-semibold text-white/60">{eyebrow}</p>}
        <h2 className="max-w-[18ch] font-game text-[clamp(1.75rem,8vw,2.75rem)] font-extrabold leading-tight text-white">{title}</h2>
        {subtitle && <p className="max-w-sm text-base font-medium text-white/60">{subtitle}</p>}
      </div>
      <div className={`relative mx-auto ${contentTop ? 'mt-2' : 'mt-auto'} flex w-full max-w-md flex-col gap-3 pt-4`}>{children}</div>
    </motion.div>
  );
}

/**
 * Eine Figur, so wie der Halter sie sehen darf:
 * hidden → „???“ · open → Name · guarded → Karte mit Rueckseite in
 * Spielerfarbe, Name nur solange gehalten (Design §9.2 „nie ohne Geste“).
 */
export function SecretName({ view, color, className = '', testId }: { view: CharacterView; color: string; className?: string; testId?: string }) {
  const { t } = useTranslation();
  const [held, setHeld] = useState(false);
  if (view.kind === 'hidden') {
    return <span data-testid={testId} data-secret="hidden" style={INHERIT} className={`inline-flex items-center gap-2 ${className}`}><EyeOff className="h-[0.8em] w-[0.8em] opacity-60" aria-hidden />???</span>;
  }
  if (view.kind === 'open') return <span data-testid={testId} data-secret="open" style={INHERIT} className={className}>{view.text}</span>;
  const show = (on: boolean) => () => setHeld(on);
  return (
    <button type="button" data-testid={testId} data-secret="guarded" aria-pressed={held}
      aria-label={held ? view.text : t('games.whoami.party.holdToSee', 'Halten zum Ansehen')}
      onPointerDown={show(true)} onPointerUp={show(false)} onPointerLeave={show(false)} onPointerCancel={show(false)}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setHeld(true); } }}
      onKeyUp={show(false)} onBlur={show(false)} onContextMenu={e => e.preventDefault()}
      className={`relative inline-flex min-h-12 select-none items-center justify-center gap-2 rounded-xl px-4 py-2 transition-colors ${className}`}
      style={{ background: held ? DEPTH.active : `linear-gradient(145deg, ${color}55, ${color}22)`, boxShadow: playerGlow(color, held ? 'active' : 'soft'), WebkitTouchCallout: 'none' }}>
      {held ? view.text : <><Hand className="h-4 w-4 opacity-80" aria-hidden /><span style={INHERIT} className="text-sm font-semibold">{t('games.whoami.party.holdToSee', 'Halten zum Ansehen')}</span></>}
    </button>
  );
}

/** Ruhiges Warten in der Farbe dessen, der dran ist (Design §9.2 „Warten“). */
export function PartyWaiting({ seat, text }: { seat?: Seat; text: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left" style={{ background: DEPTH.panel, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      {seat && <SeatAvatar seat={seat} size={36} />}
      <div className="min-w-0">
        <p className="text-base font-medium text-white">{text}</p>
        <p className="text-[0.8125rem] font-semibold text-white/50">{t('games.whoami.party.lookAtTv', 'Schau auf den Fernseher oder in die Runde')}</p>
      </div>
    </div>
  );
}
