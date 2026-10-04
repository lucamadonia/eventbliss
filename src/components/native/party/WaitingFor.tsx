import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ControllerMember } from '@/games/party/controller-api';
import { joinNames } from '@/games/party/party-availability';
import { partyMotion, playerGlow } from '@/lib/party-motion';
import { SeatAvatar } from './PartySheet';

/** "Warte auf Tom" — who the room still waits for, with faces (NOW-first for a ready player). */
export function WaitingFor({ members }: { members: readonly ControllerMember[] }) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const names = joinNames(members.slice(0, 3).map(m => m.name), i18n.language);
  return (
    <motion.div data-testid="lobby-waiting-for" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
      className="mx-auto flex w-fit items-center gap-3 rounded-full bg-white/[.06] py-1.5 pe-4 ps-1.5" role="status">
      <span className="flex ps-2">
        {members.slice(0, 3).map(m => <span key={m.player_id} className="-ms-2 rounded-full" style={{ boxShadow: `0 0 0 2px #060810, ${playerGlow(m.color)}` }}><SeatAvatar avatar={m.avatar} color={m.color} size={32} /></span>)}
      </span>
      <span className="text-sm font-semibold text-white/85">
        {members.length > 3
          ? t('partyPlay.lobby.waitingMany', 'Warte auf {{names}} und {{count}} weitere', { names, count: members.length - 3 })
          : t('partyPlay.lobby.waitingFor', 'Warte auf {{names}}', { names })}
      </span>
    </motion.div>
  );
}
