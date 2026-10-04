import { avatarOrFallback } from '@/games/multiplayer/seat-avatar';
import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { playerGlow } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { CATEGORY_ACCENT, VERBAL, type CategoryPlayer, type SaidWord } from './category-rules';

/**
 * Design §9 building blocks for Kategorie: one look on phone and TV.
 * Ground #060810 → panel #0d0915 (hairline + top light edge) → active #16101f
 * with glow. Player colour is light (glow/ring/gradient), never text colour.
 */
export const colorOf = (player?: Pick<CategoryPlayer, 'color'> | null) => player?.color || CATEGORY_ACCENT;

/** Stage background; the active player's colour as an 18 % radial light when it is your turn. */
export function stageBackground(color: string, lit: boolean): CSSProperties {
  return {
    background: lit ? `radial-gradient(120% 70% at 50% 18%, ${color}2e 0%, transparent 62%), #060810` : '#060810',
    transition: 'background 700ms ease',
    '--stage-bg': '#060810',
  } as CSSProperties;
}

export function Panel({ active = false, color, className, children, style }: { active?: boolean; color?: string; className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-white/[0.07] p-5',
      active ? 'bg-[#16101f]' : 'bg-[#0d0915]', className)}
      style={{ boxShadow: active && color ? playerGlow(color) : undefined, ...style }}>
      <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {children}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[0.8125rem] font-semibold text-white/60', className)}>{children}</p>;
}

/** Round avatar bubble in the player's colour — same look as the TV cards. */
export function CategoryAvatar({ player, size = 56, active = false, dimmed = false }: { player?: CategoryPlayer | null; size?: number; active?: boolean; dimmed?: boolean }) {
  const color = colorOf(player);
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-bold text-white transition-opacity"
      style={{
        width: size, height: size, fontSize: size * 0.5,
        background: `radial-gradient(circle at 30% 25%, ${color}66, ${color}22)`,
        boxShadow: active ? playerGlow(color, 'active') : `inset 0 0 0 2px ${color}88`,
        opacity: dimmed ? 0.4 : 1,
      }}>
      {avatarOrFallback(player?.avatar, player?.id ?? 0)}
    </span>
  );
}

/**
 * Stage hero: the answerer big with their glow, the turn clock as a ring
 * around the avatar. `paused` = the host phone is being passed on.
 */
export function TurnHero({ player, timeLeft, total, paused = false, size = 132 }: { player?: CategoryPlayer | null; timeLeft: number; total: number; paused?: boolean; size?: number }) {
  const color = colorOf(player);
  const ring = size + 28;
  const radius = ring / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const share = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const low = !paused && timeLeft <= 5;
  return (
    <div className="relative grid place-items-center" style={{ width: ring, height: ring }}>
      <svg width={ring} height={ring} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <motion.circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke={low ? '#ff6e84' : color} strokeWidth={6}
          strokeLinecap="round" strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - share), opacity: paused ? 0.35 : 1 }}
          transition={{ duration: 0.45, ease: 'linear' }} />
      </svg>
      <motion.div key={player?.id ?? 'none'} initial={{ opacity: 0, scale: 0.7, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
        <CategoryAvatar player={player} size={size} active={!paused} />
      </motion.div>
      <span className={cn('absolute -bottom-1 rounded-full border border-white/10 bg-[#0d0915] px-3 py-1 text-lg font-bold tabular-nums',
        low ? 'text-[#ff9aa9]' : 'text-white')} role="timer" aria-live="off">
        {paused ? '··' : `${timeLeft}s`}
      </span>
    </div>
  );
}

/** Category (and letter) as the big announcement. */
export function CategoryCard({ label, category, letter, active, color }: { label: string; category: string; letter?: string; active?: boolean; color?: string }) {
  return (
    <Panel active={active} color={color} className="!p-6">
      <Label>{label}</Label>
      <div className="mt-3 flex items-end gap-4">
        {letter && <span className="font-game text-7xl font-black leading-none text-[#f2bc66]">{letter}</span>}
        <h2 className="min-w-0 flex-1 break-words font-game font-black leading-tight text-[#fff4dc]" style={{ fontSize: 'clamp(1.75rem, 8vw, 2.75rem)' }}>{category}</h2>
      </div>
    </Panel>
  );
}

/** Seat row: who is in the circle, the answerer lifted, the rest stepped back. */
export function SeatRow({ players, activeIndex, loserId }: { players: readonly CategoryPlayer[]; activeIndex: number; loserId?: string | null }) {
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {players.map((player, index) => {
        const active = index === activeIndex;
        return (
          <li key={player.id} className="flex flex-col items-center gap-1" style={{ transform: active ? 'scale(1.08)' : 'scale(0.96)' }}>
            <CategoryAvatar player={player} size={40} active={active} dimmed={!active && player.id !== loserId && activeIndex >= 0} />
            <span className={cn('max-w-[4.5rem] truncate text-xs', active ? 'font-semibold text-white' : 'text-white/55')}>{player.name}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Words of the round, a spoken answer shows as the speaker's name. */
export function WordCloud({ words, players, max }: { words: readonly SaidWord[]; players: readonly CategoryPlayer[]; max?: number }) {
  const shown = max ? words.slice(-max) : words;
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((word, index) => {
        const speaker = players.find(player => player.id === word.playerId);
        const verbal = word.word === VERBAL;
        return (
          <motion.span key={`${word.word}-${index}`} initial={{ opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#16101f] px-3 py-1.5 text-sm text-white/80"
            style={{ boxShadow: `inset 0 0 0 1px ${colorOf(speaker)}33` }}>
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: colorOf(speaker) }} />
            {verbal ? speaker?.name : word.word}
          </motion.span>
        );
      })}
    </div>
  );
}
