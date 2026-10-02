import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Heart, MessageCircle, Vote } from 'lucide-react';
import { playerGlow } from '@/lib/party-motion';
import type { TurnRole } from './turns';

interface Seat { id: string; name: string; color: string; avatar: string }

/**
 * "Who is acting" stage (design §9.1/9.2): the acting seat's avatar with its own
 * glow, name large, what they do now — and whether that's you. The player's
 * colour lights the panel, it is never used as text colour.
 */
export function TurnHeader({ seat, role, isMe, subject }: {
  seat: Seat; role: TurnRole; isMe: boolean;
  /** Vote only: the player being judged. */
  subject?: Seat;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const Icon = role === 'vote' ? Vote : role === 'dare' ? Flame : role === 'answer' ? MessageCircle : Heart;
  const label = {
    choose: t('games.truthdare.turnChoose', 'wählt Wahrheit oder Pflicht'),
    answer: t('games.truthdare.turnAnswer', 'beantwortet die Frage'),
    dare: t('games.truthdare.turnDare', 'macht die Pflicht'),
    vote: t('games.truthdare.turnVote', { name: subject?.name ?? '', defaultValue: 'urteilt über {{name}}' }),
  }[role];
  return (
    <motion.section
      key={`${seat.id}:${role}`}
      data-testid="truthdare-turn-header"
      initial={reduced ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
      className="td-turn relative w-full max-w-xl mx-auto overflow-hidden rounded-[22px] border border-white/[0.07] px-4 py-3.5 flex items-center gap-4"
      style={{ background: `radial-gradient(120% 140% at 0% 0%, ${seat.color}2e 0%, transparent 60%), #0d0915` }}
      aria-live="polite"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" />
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black"
          style={{ backgroundColor: seat.color, boxShadow: playerGlow(seat.color, 'active'), color: '#fff' }}>
          {seat.avatar}
        </div>
        {subject && (
          <div className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0d0915]"
            style={{ backgroundColor: subject.color, color: '#fff' }} aria-hidden>
            {subject.avatar}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold text-white/55 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" aria-hidden />
          {isMe ? t('games.truthdare.turnYou', 'Du bist dran') : t('games.truthdare.turnOther', 'Jetzt dran')}
        </p>
        <p className="font-game font-extrabold text-[1.75rem] leading-tight truncate">{seat.name}</p>
        <p className="text-[0.9375rem] font-medium text-white/70 truncate">{label}</p>
      </div>
    </motion.section>
  );
}

/** Calm hint under the stage when another seat acts: look at them (or the TV), nothing to tap. */
export function WatchHint({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <p data-testid="truthdare-watch" className="text-center text-[0.9375rem] font-medium text-white/50 px-6">
      {t('games.truthdare.watchOther', { name, defaultValue: '{{name}} ist dran — schau zu oder auf den Fernseher.' })}
    </p>
  );
}
