import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyMotion, playerGlow } from '@/lib/party-motion';
import { playableGames } from '@/lib/playable-games';
import { useGameRoom } from './useGameRoom';
import { WaitingDot } from './MatchGuardOverlay';
import { avatarOrFallback } from './seat-avatar';

/**
 * Calm waiting stage (design §5/§9): your own avatar in your colour, a slow
 * waiting dot instead of a spinner, and the game that is about to start.
 */
export default function OnlineWaiting() {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const { players, myPlayerId, room } = useGameRoom();
  const me = players.find(player => player.id === myPlayerId);
  const color = me?.color ?? '#df8eff';
  const game = playableGames.find(candidate => candidate.id === room?.gameId);
  return (
    <div role="status" data-testid="online-waiting" className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center text-white"
      style={{ background: `radial-gradient(60% 45% at 50% 38%, ${color}2e, transparent 70%), #060810` }}>
      <motion.span variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate" aria-hidden
        className="grid h-28 w-28 place-items-center rounded-full text-6xl"
        style={{ background: `radial-gradient(circle at 30% 25%, ${color}66, ${color}22)`, boxShadow: playerGlow(color, 'active') }}>
        {avatarOrFallback(me?.avatar, myPlayerId || 0)}
      </motion.span>
      <h2 className="text-2xl font-extrabold font-game">{t('partyPlay.waitingTitle', 'Gleich geht’s los')}</h2>
      <p className="flex items-center gap-2 text-base text-white/75"><WaitingDot color={color} />{t('games.ohrwurm.waitingForHost')}</p>
      {game && <p className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/80" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {t('partyPlay.nextGame', 'Als Nächstes: {{game}}', { game: t(game.nameKey) })}</p>}
    </div>
  );
}
