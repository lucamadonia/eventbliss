import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Ban, Check, Crown, MoreHorizontal, Pencil, Smartphone, UserMinus, UserPlus, UserX, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import type { ControllerMember, ControllerPartyData } from '@/games/party/controller-api';
import {
  addControllerGuest, bannedMembers, kickControllerPlayer, releaseControllerSeat, releaseOwnControllerSeat, removeControllerGuest,
  unbanControllerPlayer, updateControllerProfile, type PlayerProfile,
} from '@/games/party/controller-session';
import { MAX_PARTY_PLAYERS, suggestPlayerLook } from '@/games/party/session-schema';
import { listStagger, partyMotion, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { KickPlayerSheet, type KickTarget } from './KickPlayerSheet';
import { scheduleKick } from './kick-queue';
import { PartySheet, SeatAvatar, SeatIcon } from './PartySheet';
import { PlayerProfileEditor } from './PlayerProfileEditor';

interface Props {
  data: ControllerPartyData;
  myUserId: string;
  presence: readonly { id: string; isReady: boolean }[];
  participantIds: readonly string[];
  busy: boolean;
}

type Sheet = { kind: 'actions' | 'profile'; member: ControllerMember } | { kind: 'add' } | null;
const act = (work: Promise<unknown>) => { void work.catch(() => { /* the session store shows the error */ }); };

/** Lobby player list: 📱/🔁 seats, ready and connection state, Host actions. */
export function PartyRoster({ data, myUserId, presence, participantIds, busy }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [kick, setKick] = useState<KickTarget | null>(null);
  const isHost = data.party.host_user_id === myUserId;
  const playing = data.party.status === 'playing';
  const members = data.members.filter(m => !m.banned);
  const banned = bannedMembers(data);
  const full = members.length >= MAX_PARTY_PLAYERS;
  const close = () => setSheet(null);
  // Rows arrive like cards and leave quietly (T19).
  const rowVariants = { ...partyMotion('cardEnter', reduced), exit: partyMotion('leaveFade', reduced).exit };

  const status = (member: ControllerMember) => {
    if (member.controlled_by != null) return member.pending_claim
      ? { text: t('partyPlay.seat.pendingClaim', 'wechselt nach der Runde aufs eigene Handy'), tone: 'text-amber-200' }
      : { text: t('partyPlay.seat.hostDevice', 'am Host-Handy'), tone: 'text-white/55' };
    const seen = presence.find(p => p.id === member.player_id);
    if (!seen) return { text: t('partyControllers.offline'), tone: 'text-rose-200', offline: true };
    if (member.is_host) return { text: t('partyPlay.seat.host', 'Host'), tone: 'text-[#df8eff]' };
    return seen.isReady ? { text: t('partyControllers.ready'), tone: 'text-[#8ff5ff]', ready: true } : { text: t('partyControllers.notReadyYet'), tone: 'text-white/55' };
  };
  const canOpen = (member: ControllerMember) => isHost || member.user_id === myUserId;
  const target = (member: ControllerMember): KickTarget => ({ id: member.player_id, name: member.name, avatar: member.avatar, color: member.color });
  const queueKick = (who: KickTarget, run: () => Promise<unknown>) => { scheduleKick(who.id, who.name, run); };

  return (
    <section className="space-y-3" aria-labelledby="roster-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="roster-title" className="text-lg font-bold">{t('partyControllers.players', { count: members.filter(m => data.party.host_plays || !m.is_host).length })}</h2>
        {isHost && !playing && (
          <button type="button" data-testid="lobby-add-guest" disabled={busy || full} onClick={() => { haptics.light(); setSheet({ kind: 'add' }); }}
            className="flex min-h-11 items-center gap-2 rounded-full bg-white/[.07] px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/15 disabled:opacity-40">
            <UserPlus className="h-4 w-4" aria-hidden />{t('partyPlay.roster.addGuest', 'Spieler ohne Handy')}
          </button>
        )}
      </div>

      <motion.ul className="space-y-2" variants={listStagger} initial="initial" animate="animate">
        <AnimatePresence initial={false}>
          {members.map(member => {
            const s = status(member), mine = member.user_id === myUserId, guest = member.controlled_by != null;
            return (
              <motion.li key={member.player_id} layout={!reduced}
                variants={rowVariants} exit="exit"
                data-testid={`lobby-player-${member.player_id}`} data-seat={guest ? 'host-device' : 'phone'}
                data-ready={String(guest || 'ready' in s || member.is_host)} data-connected={String(!('offline' in s))}
                data-host={String(member.is_host)} data-pending-claim={String(member.pending_claim)}>
                <motion.button type="button" disabled={!canOpen(member)} aria-haspopup="dialog" {...(reduced || !canOpen(member) ? {} : pressable)}
                  aria-label={`${member.name}, ${guest ? t('partyPlay.seat.hostDevice', 'am Host-Handy') : t('partyPlay.seat.phone', 'eigenes Handy')}, ${s.text}`}
                  onClick={() => { haptics.light(); setSheet({ kind: 'actions', member }); }}
                  className={cn('flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]',
                    mine ? 'border-[#8ff5ff]/35 bg-[#8ff5ff]/[.06]' : 'border-white/[.06] bg-white/[.04]')}>
                  <span className="relative">
                    <SeatAvatar avatar={member.avatar} color={member.color} size={44} dimmed={'offline' in s} />
                    <span aria-hidden className="absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-[#0a0e14] text-white/70"><SeatIcon guest={guest} /></span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <strong className="truncate">{member.name}</strong>
                      {member.is_host && <Crown className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
                      {mine && <span className="rounded-full bg-[#8ff5ff]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8ff5ff]">{t('partyPlay.roster.you', 'Du')}</span>}
                    </span>
                    <span className={cn('flex items-center gap-1 text-sm', s.tone)}>
                      {'offline' in s && <WifiOff className="h-3.5 w-3.5" aria-hidden />}
                      {'ready' in s && <Check className="h-3.5 w-3.5" aria-hidden />}
                      {s.text}
                    </span>
                  </span>
                  {canOpen(member) && <MoreHorizontal className="h-5 w-5 shrink-0 text-white/40" aria-hidden />}
                </motion.button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      {isHost && banned.length > 0 && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-white/70">{t('partyPlay.roster.banned', 'Gesperrt ({{count}})', { count: banned.length })}</summary>
          <ul className="space-y-2">{banned.map(member => (
            <li key={member.player_id} className="flex min-h-12 items-center gap-3">
              <Ban className="h-4 w-4 text-rose-300" aria-hidden /><span className="flex-1 truncate">{member.name}</span>
              <button type="button" data-testid={`unban-${member.player_id}`} disabled={busy} onClick={() => act(unbanControllerPlayer(member.player_id))}
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[#8ff5ff] active:bg-white/10">{t('partyPlay.roster.unban', 'Sperre aufheben')}</button>
            </li>))}
          </ul>
        </details>
      )}

      {/* Actions for one seat */}
      <PartySheet open={sheet?.kind === 'actions'} onClose={close}
        title={sheet?.kind === 'actions' ? sheet.member.name : ''}
        subtitle={sheet?.kind === 'actions' ? status(sheet.member).text : undefined}>
        {sheet?.kind === 'actions' && (() => {
          const member = sheet.member, mine = member.user_id === myUserId, guest = member.controlled_by != null;
          const rows: { key: string; testId: string; label: string; hint?: string; Icon: typeof Pencil; danger?: boolean; disabled?: boolean; onClick: () => void }[] = [];
          if (mine || (isHost && guest)) rows.push({ key: 'profile', testId: `lobby-edit-${member.player_id}`, label: t('partyPlay.roster.editProfile', 'Name, Symbol & Farbe'), hint: playing ? t('partyPlay.profile.lockedShort', 'nach der Runde änderbar') : undefined, Icon: Pencil, onClick: () => setSheet({ kind: 'profile', member }) });
          if (mine && !member.is_host && !playing) rows.push({ key: 'notMe', testId: 'seat-release', label: t('partyPlay.roster.notMe', 'Das bin ich nicht'), hint: t('partyPlay.roster.notMeHint', 'Platz zurück ans Host-Handy, dann neu wählen'), Icon: UserX, onClick: () => { close(); act(releaseOwnControllerSeat()); } });
          if (isHost && guest && member.pending_claim) rows.push({ key: 'cancelClaim', testId: `seat-cancel-claim-${member.player_id}`, label: t('partyPlay.roster.cancelClaim', 'Vormerkung aufheben'), hint: t('partyPlay.seat.pendingClaim', 'wechselt nach der Runde aufs eigene Handy'), Icon: UserX, onClick: () => { close(); act(releaseControllerSeat(member.player_id)); } });
          if (isHost && !guest && !member.is_host) rows.push({ key: 'release', testId: `seat-recall-${member.player_id}`, label: t('partyPlay.roster.release', 'Zurück ans Host-Handy holen'), disabled: playing,
            hint: playing ? t('partyPlay.roster.afterRound', 'nach der Runde möglich') : t('partyPlay.roster.releaseHint', 'z. B. Akku leer – Punkte bleiben'), Icon: Smartphone, onClick: () => { close(); act(releaseControllerSeat(member.player_id)); } });
          if (isHost && !member.is_host) rows.push({ key: 'remove', testId: `lobby-kick-${member.player_id}`, label: t('partyPlay.roster.remove', 'Entfernen …'), Icon: UserMinus, danger: true, onClick: () => {
            close();
            if (guest && !playing) queueKick(target(member), () => removeControllerGuest(member.player_id));
            else setKick(target(member));
          } });
          return <div className="space-y-2">{rows.map(({ key, testId, label, hint, Icon, danger, disabled, onClick }) => (
            <button key={key} type="button" data-testid={testId} disabled={busy || disabled} onClick={() => { haptics.light(); onClick(); }}
              className="flex min-h-14 w-full items-center gap-4 rounded-2xl bg-white/[.04] px-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10 disabled:opacity-40">
              <Icon className={cn('h-5 w-5 shrink-0', danger ? 'text-rose-300' : 'text-[#8ff5ff]')} aria-hidden />
              <span className="min-w-0 flex-1"><strong className={cn('block', danger && 'text-rose-200')}>{label}</strong>{hint && <span className="text-sm text-white/50">{hint}</span>}</span>
            </button>))}</div>;
        })()}
      </PartySheet>

      {/* Profile of an existing seat (own or a guest's) */}
      <PartySheet open={sheet?.kind === 'profile'} onClose={close}
        title={t('partyPlay.profile.title', 'Profil')}>
        {sheet?.kind === 'profile' && (
          <PlayerProfileEditor key={sheet.member.player_id} initial={sheet.member} locked={playing} busy={busy}
            hostDevice={sheet.member.controlled_by != null} submitLabel={t('partyPlay.profile.save', 'Speichern')}
            onSubmit={profile => { const id = sheet.member.player_id; close(); act(updateControllerProfile(id, profile)); }} />
        )}
      </PartySheet>

      {/* New guest without a phone */}
      <PartySheet open={sheet?.kind === 'add'} onClose={close}
        title={t('partyPlay.roster.addGuestTitle', 'Spieler ohne Handy')}
        subtitle={t('partyPlay.roster.addGuestHint', 'Spielt an deinem Handy mit. Kann später per QR aufs eigene Handy wechseln.')}>
        {sheet?.kind === 'add' && (
          <PlayerProfileEditor initial={{ name: '', ...suggestPlayerLook(members) }} hostDevice busy={busy} testIds={{ name: 'guest-name', save: 'guest-save' }}
            submitLabel={t('partyPlay.roster.addGuestSubmit', 'Hinzufügen')}
            onSubmit={(profile: PlayerProfile) => { close(); act(addControllerGuest(profile)); }} />
        )}
      </PartySheet>

      <KickPlayerSheet target={kick} playing={playing} inMatch={!!kick && participantIds.includes(kick.id)}
        canBan={!!kick && data.members.some(m => m.player_id === kick.id && m.user_id != null)}
        onClose={() => setKick(null)}
        onConfirm={(who, mode) => { setKick(null); queueKick(who, () => kickControllerPlayer(who.id, mode)); }} />
    </section>
  );
}
