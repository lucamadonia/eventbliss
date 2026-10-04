import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ControllerMember } from '@/games/party/controller-api';
import { listStagger, partyMotion, playerGlow } from '@/lib/party-motion';
import { SeatAvatar } from './PartySheet';

interface Props {
  members: readonly ControllerMember[];
  /** Seats that count as ready (phones that tapped, guests at the Host's phone). */
  readyIds: ReadonlySet<string>;
  hostColor: string;
  gamesPlanned: number;
  /** Before the first game, the lobby is the editable evening plan. */
  firstGameReady?: boolean;
  plannedMinutes?: number;
  tvConnected: boolean;
  /** "What's happening for me right now" — e.g. „Warte auf Tom“. */
  now?: ReactNode;
  /** Name of the game that is running now; replaces plan and ready counter (no meaning mid-game). */
  runningGame?: string | null;
  onBack: () => void;
}

const MAX_AVATARS = 8;
const AVATAR = 60;

/**
 * The lobby stage (design §9.1): one message — how many are here, how many
 * are ready, who. The code lives in the invite card, not here.
 */
export function PartyLobbyHeader({ members, readyIds, hostColor, gamesPlanned, firstGameReady, plannedMinutes, tvConnected, now, runningGame, onBack }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const shown = members.slice(0, MAX_AVATARS);
  const readyCount = members.filter(m => readyIds.has(m.player_id)).length;
  const avatarVariants = { ...partyMotion('avatarArrive', reduced), exit: partyMotion('leaveFade', reduced).exit };
  return (
    <header data-testid="lobby-stage" className="relative -mx-5 -mt-[max(24px,env(safe-area-inset-top))] overflow-hidden bg-[#060810] px-5 pb-7 pt-[max(24px,env(safe-area-inset-top))]">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 80% at 50% 0%, ${hostColor}2e, transparent 65%)` }} />
      <div className="relative flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label={t('common.back')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-white/80">{firstGameReady ? t('partyPlay.evening.title', 'Euer Abend') : t('partyPlay.lobby.kickerEmpty', 'Party-Abend')}</p>
          <p className="text-sm text-white/55">{runningGame ? t('partyPlay.lobby.runningNow', 'Läuft gerade: {{game}}', { game: runningGame }) : firstGameReady ? t('partyPlay.evening.meta', '{{count}} Spiele · ca. {{minutes}} Min.', { count: gamesPlanned, minutes: plannedMinutes ?? 0 }) : gamesPlanned > 0 ? t('partyPlay.lobby.planned', '{{count}} Spiele geplant', { count: gamesPlanned }) : t('partyPlay.lobby.nonePlanned', 'Noch kein Spiel geplant')}</p>
        </div>
        {tvConnected && <span data-testid="lobby-tv-status" className="flex items-center gap-1.5 rounded-full bg-[#8ff5ff]/12 px-3 py-1 text-xs font-semibold text-[#8ff5ff]">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#8ff5ff] shadow-[0_0_8px_#8ff5ff]" />{t('partyPlay.tv.short', 'TV')}
        </span>}
      </div>

      <div className="relative mt-6 flex flex-col items-center text-center" aria-live="polite">
        <motion.p key={members.length} className="font-game text-6xl font-black leading-none text-white tabular-nums"
          initial={reduced ? false : { scale: 1 }} animate={reduced ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 0.2 }}>
          {members.length}
        </motion.p>
        {!runningGame && <p data-testid="lobby-ready-count" className="mt-1 text-sm font-semibold text-[#8ff5ff]">
          {t('partyPlay.ready.count', '{{ready}} von {{total}} bereit', { ready: readyCount, total: members.length })}
        </p>}
        <motion.ul className="mt-5 flex items-center justify-center ps-[10px]" variants={listStagger} initial="initial" animate="animate"
          aria-label={t('partyControllers.players', { count: members.length })}>
          <AnimatePresence initial={false}>
            {shown.map(member => {
              const ready = !runningGame && readyIds.has(member.player_id);
              return (
                <motion.li key={member.player_id} layout={!reduced} variants={avatarVariants} exit="exit"
                  data-ready={ready} title={member.name}
                  className="-ms-[10px] rounded-full transition-shadow duration-300"
                  // One element carries the ring: the inner #060810 band separates overlapping avatars cleanly.
                  style={{ boxShadow: ready ? '0 0 0 2px #060810, 0 0 0 4px #8ff5ff' : `0 0 0 2px #060810, ${playerGlow(member.color)}` }}>
                  <SeatAvatar avatar={member.avatar} color={member.color} size={AVATAR} />
                </motion.li>
              );
            })}
          </AnimatePresence>
          {members.length > shown.length && <li className="-ms-[10px] grid place-items-center rounded-full bg-white/10 text-sm font-bold"
            style={{ width: AVATAR, height: AVATAR, boxShadow: '0 0 0 2px #060810' }}>+{members.length - shown.length}</li>}
        </motion.ul>
        {now && <div className="mt-5 w-full">{now}</div>}
      </div>
    </header>
  );
}
