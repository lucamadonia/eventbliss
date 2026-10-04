import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { usePartySession } from '@/hooks/usePartySession';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import type { KickMode } from '@/games/party/controller-api';
import { kickControllerPlayer, ownMember, useControllerParty } from '@/games/party/controller-session';
import { KickPlayerSheet, type KickTarget } from './KickPlayerSheet';
import { scheduleKick } from './kick-queue';
import { PartySheet, SeatAvatar, SeatIcon } from './PartySheet';

interface KickTargets {
  available: boolean;
  mode: 'controller' | 'local';
  players: (KickTarget & { guest: boolean; account: boolean })[];
  playing: boolean;
  participantIds: readonly string[];
  kick: (target: KickTarget, mode: KickMode) => void;
}

/**
 * Who the Host may remove right now. Joystick party: every seat except the
 * Host's own, through the server. One-phone party: local players, as long as
 * two remain (the session refuses fewer).
 */
export function usePartyKickTargets(): KickTargets {
  const controller = useControllerParty();
  const room = useGameRoom();
  const local = usePartySession();
  const data = controller.data;
  if (data && ownMember(data)?.is_host) {
    return {
      available: data.party.status !== 'finished',
      mode: 'controller',
      players: data.members.filter(m => !m.banned && !m.is_host)
        .map(m => ({ id: m.player_id, name: m.name, avatar: m.avatar, color: m.color, guest: m.controlled_by != null, account: m.user_id != null })),
      playing: data.party.status === 'playing',
      participantIds: room.room?.participantIds ?? [],
      kick: (target, mode) => scheduleKick(target.id, target.name, () => kickControllerPlayer(target.id, mode)),
    };
  }
  const session = local.session;
  const players = session && session.playMode !== 'controllers' ? session.players : [];
  return {
    available: players.length > 0,
    mode: 'local',
    players: players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, guest: true, account: false })),
    playing: false,
    participantIds: [],
    kick: target => scheduleKick(target.id, target.name, () => local.removePlayer(target.id)),
  };
}

/** TVRemote "Spieler": pick someone, then the same KickPlayerSheet as in the lobby. */
export function PartyPlayerPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const targets = usePartyKickTargets();
  const [target, setTarget] = useState<(KickTargets['players'][number]) | null>(null);
  return <>
    <PartySheet open={open && !target} onClose={onClose} title={t('partyPlay.remote.playersTitle', 'Spieler entfernen')}
      subtitle={targets.playing ? t('partyPlay.kick.playingHint', 'Das laufende Spiel geht ohne Pause weiter.') : undefined}>
      <ul className="space-y-2">
        {targets.players.map(player => (
          <li key={player.id}>
            <button type="button" data-testid={`kick-player-${player.id}`} onClick={() => { haptics.light(); setTarget(player); }}
              className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white/[.04] px-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10">
              <SeatAvatar avatar={player.avatar} color={player.color} size={44} />
              <span className="min-w-0 flex-1">
                <strong className="block truncate">{player.name}</strong>
                {targets.mode === 'controller' && <span className="flex items-center gap-1 text-sm text-white/50"><SeatIcon guest={player.guest} />{player.guest ? t('partyPlay.seat.hostDevice', 'am Host-Handy') : t('partyPlay.seat.phone', 'eigenes Handy')}</span>}
              </span>
              <ChevronRight className="h-5 w-5 text-white/40 rtl:rotate-180" aria-hidden />
            </button>
          </li>
        ))}
        {targets.players.length === 0 && <li className="rounded-2xl bg-white/[.03] p-4 text-sm text-white/55">{t('partyPlay.remote.nobody', 'Niemand zum Entfernen.')}</li>}
      </ul>
    </PartySheet>
    <KickPlayerSheet target={target} playing={targets.playing}
      inMatch={!!target && targets.participantIds.includes(target.id)} canBan={!!target?.account}
      onClose={() => setTarget(null)}
      onConfirm={(who, mode) => { setTarget(null); onClose(); targets.kick(who, mode); }} />
  </>;
}
