import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import type { ControllerMember } from '@/games/party/controller-api';
import { normalizeName } from '@/games/party/guest-match';
import { listStagger, partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { SeatAvatar, SeatIcon } from './PartySheet';
import { usePartyScreenTrace } from './ui-trace';

/** Search appears from seven seats on (masterplan 3.3). */
export const WHO_SEARCH_FROM = 7;

/** Guest seats (🔁) are pickable; phone seats (📱) are only listed. Banned seats never show. */
export function whoAreYouSeats(members: readonly ControllerMember[], ownPlayerId: string | null) {
  const visible = members.filter(m => !m.banned && m.player_id !== ownPlayerId);
  return {
    guests: visible.filter(m => m.controlled_by != null),
    phones: visible.filter(m => m.controlled_by == null),
  };
}

export interface SeatNotice { text: string; code: string | null }

interface Props {
  hostName: string;
  members: readonly ControllerMember[];
  ownPlayerId: string | null;
  points: Record<string, number>;
  busy?: boolean;
  notice?: SeatNotice | null;
  onPick: (guest: ControllerMember) => void;
  onCreateNew: () => void;
  /** Party is full: a new seat is impossible, so this text replaces "neu anlegen" (B13). */
  fullNotice?: string | null;
}

export function WhoAreYou({ hostName, members, ownPlayerId, points, busy, notice, onPick, onCreateNew, fullNotice }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const [query, setQuery] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { guests, phones } = useMemo(() => whoAreYouSeats(members, ownPlayerId), [members, ownPlayerId]);
  const searchable = guests.length + phones.length >= WHO_SEARCH_FROM;
  const needle = normalizeName(query);
  const shown = needle ? guests.filter(g => normalizeName(g.name).includes(needle)) : guests;
  const seatCount = guests.length + phones.length;
  // A seat someone else just took fades out quietly instead of sliding (RTL-safe).
  const rowVariants = { ...partyMotion('cardEnter', reduced), exit: partyMotion('leaveFade', reduced).exit };

  usePartyScreenTrace('who-are-you');
  // The pick glow stays while the request runs and clears once it is answered.
  useEffect(() => { if (!busy) setPickedId(null); }, [busy]);

  return (
    <section aria-labelledby="who-title" data-testid="who-are-you" data-seat-count={seatCount} className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#8ff5ff]">
          {t('partyPlay.who.partyOf', '{{name}}s Party · {{count}} Spieler', { name: hostName, count: members.filter(m => !m.banned).length })}
        </p>
        <h1 id="who-title" className="text-4xl font-black tracking-tight">{t('partyPlay.who.title', 'Wer bist du?')}</h1>
        <p className="text-white/60">{t('partyPlay.who.subtitle', 'Tippe auf deinen Namen – deine Punkte kommen mit.')}</p>
      </header>

      {notice && <p role="alert" data-testid="seat-error" data-error-code={notice.code ?? ''} className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{notice.text}</p>}

      {searchable && (
        <label className="relative block">
          <span className="sr-only">{t('partyPlay.who.search', 'Suchen')}</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" aria-hidden />
          <input type="search" data-testid="seat-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('partyPlay.who.search', 'Suchen')}
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[.05] ps-12 pe-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]" />
        </label>
      )}

      <motion.ul className="space-y-2.5" variants={listStagger} initial="initial" animate="animate">
        <AnimatePresence initial={false}>
          {shown.map(guest => {
            const picked = pickedId === guest.player_id;
            return (
              <motion.li key={guest.player_id} layout={!reduced} variants={rowVariants} exit="exit">
                <motion.button type="button" disabled={busy} data-testid={`seat-option-${guest.player_id}`}
                  {...(reduced ? {} : pressable)}
                  onClick={() => { haptics.select(); setPickedId(guest.player_id); onPick(guest); }}
                  className={cn('group flex min-h-[72px] w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[.05] px-4 text-start transition-[opacity,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10',
                    pickedId && !picked && 'opacity-50')}
                  style={picked ? { boxShadow: playerGlow(guest.color, 'active') } : undefined}>
                  <span className="rounded-full" style={{ boxShadow: playerGlow(guest.color) }}><SeatAvatar avatar={guest.avatar} color={guest.color} size={44} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-lg">{guest.name}</strong>
                    <span className="flex items-center gap-1 text-sm text-white/55">
                      <SeatIcon guest />{t('partyPlay.seat.hostDevice', 'am Host-Handy')}
                      {(points[guest.player_id] ?? 0) > 0 && ` · ${t('partyPlay.who.points', '{{count}} Punkte', { count: points[guest.player_id] })}`}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-white/40 transition group-active:translate-x-1 rtl:rotate-180" aria-hidden />
                </motion.button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {needle && shown.length === 0 && <li className="rounded-2xl bg-white/[.03] p-4 text-sm text-white/55">{t('partyPlay.who.noMatch', 'Niemand mit diesem Namen am Host-Handy.')}</li>}
      </motion.ul>

      {phones.length > 0 && (
        <div className="space-y-2 opacity-45">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">{t('partyPlay.who.alreadyIn', 'Schon mit eigenem Handy dabei')}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/80" aria-label={t('partyPlay.who.alreadyIn', 'Schon mit eigenem Handy dabei')}>
            {phones.map(member => (
              <li key={member.player_id} data-testid={`seat-taken-${member.player_id}`} className="flex items-center gap-1.5">
                <span aria-hidden>{member.avatar}</span><SeatIcon guest={false} />{member.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/95 to-transparent px-1 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6">
        {fullNotice ? <p role="status" data-testid="party-full-message" className="rounded-3xl border border-white/10 bg-white/[.06] p-4 text-center text-sm text-white/80">{fullNotice}</p> : <motion.button type="button" disabled={busy} data-testid="seat-create-new" onClick={() => { haptics.light(); onCreateNew(); }}
          {...(reduced ? {} : pressable)}
          className={cn('flex min-h-16 w-full items-center justify-center gap-3 rounded-3xl px-5 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] disabled:opacity-50',
            guests.length > 0
              ? 'border border-dashed border-white/20 bg-white/[.06] text-white'
              : 'bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#0a0e14] shadow-[0_16px_50px_rgba(143,245,255,.25)]')}>
          <UserPlus className="h-5 w-5" aria-hidden />{t('partyPlay.who.createNew', 'Ich finde mich nicht – neu anlegen')}
        </motion.button>}
      </div>
    </section>
  );
}
