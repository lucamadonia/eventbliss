import { motion, useReducedMotion } from 'framer-motion';
import { avatarOrFallback } from '../multiplayer/seat-avatar';
import { useTranslation } from 'react-i18next';
import { partyMotion, playerGlow, readableOn } from '@/lib/party-motion';

/**
 * Who sets the pin on this phone right now — avatar in the player's own glow.
 * On the host phone it changes with every 🔁 guest after the handover.
 */
export function GuessSeatChip({ player, lit, guest = false }: { player: { id: string; name: string; color: string; avatar?: string }; lit: boolean; guest?: boolean }) {
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
      <span dir="auto" className="text-sm font-bold">
        {guest ? t('games.findit.guessSeat', '{{name}} setzt den Pin', { name: player.name }) : player.name}
      </span>
    </motion.div>
  );
}
