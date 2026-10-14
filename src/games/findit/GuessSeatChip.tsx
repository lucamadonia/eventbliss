import { motion, useReducedMotion } from 'framer-motion';
import { avatarOrFallback } from '../multiplayer/seat-avatar';
import { useTranslation } from 'react-i18next';
import { partyMotion, playerGlow, readableOn } from '@/lib/party-motion';

/**
 * Who sets the pin on this phone right now — avatar in the player's own glow.
 * On the host phone it changes with every 🔁 guest after the handover.
 */
export function GuessSeatChip({ player, lit, host = false, status = 'guess' }: {
  player: { id: string; name: string; color: string; avatar?: string };
  lit: boolean;
  host?: boolean;
  status?: 'explore' | 'guess' | 'waiting';
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const avatar = avatarOrFallback(player.avatar, player.id);
  return (
    <motion.div key={player.id} variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
      data-testid="findit-guess-seat" data-player-id={player.id}
      className="flex min-h-11 items-center gap-2 rounded-full py-1.5 pe-4 ps-1.5 text-white"
      style={{ background: lit ? `radial-gradient(140% 160% at 0% 50%, ${player.color}33 0%, #0d0915 70%)` : '#0d0915',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: lit ? playerGlow(player.color, 'soft') : undefined }}>
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold"
        style={{ backgroundColor: player.color, color: readableOn(player.color), boxShadow: lit ? playerGlow(player.color, 'active') : undefined }}>{avatar}</span>
      <span dir="auto" className="flex min-w-0 flex-col leading-tight">
        <span className="text-xs font-semibold text-white/60">
          {host ? t('partyControllers.host', 'Host') : t('games.findit.playerTurn', '{{name}} ist dran', { name: player.name })}
        </span>
        <span className="max-w-[55vw] truncate text-sm font-bold">
          {status === 'waiting' ? t('games.findit.mapWaitingPlayers')
            : status === 'explore' ? t('games.findit.svLookAround')
              : t('games.findit.svSetPin')}
        </span>
      </span>
    </motion.div>
  );
}
