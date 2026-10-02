import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Gamepad2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import { AvailabilityChipView } from './AvailabilityChipView';
import type { NextGame } from './useNextGame';

interface Props {
  next: NextGame;
  role: 'host' | 'player';
  /** player_ids of 🔁 guests sitting out — QA hook for the E03 hint. */
  sitOutIds?: string[];
}

/**
 * The next game as the hero of the lobby: art, name, how it plays in one line
 * and whether it fits. For players it is the anticipation teaser (no notice
 * box); for the Host it is what the start bar below will launch.
 */
export function NextGameCard({ next, role, sitOutIds = [] }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const game = next.game;
  const [art, setArt] = useState<'loading' | 'loaded' | 'failed'>('loading');
  useEffect(() => { setArt('loading'); }, [game?.id]);
  if (!game) {
    return role === 'player'
      ? <p role="status" data-testid="next-game-empty" className="rounded-3xl border border-white/10 bg-white/[.04] p-5 text-center text-white/70">{t('partyControllers.hostChoosing')}</p>
      : null;
  }
  return (
    <motion.article key={game.id} data-testid="next-game-card" data-game-id={game.id} variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1020]">
      {/* Never an empty card: game-colour gradient + shimmer while loading, icon if the art fails. */}
      <div className={cn('relative h-36 w-full bg-gradient-to-br', game.gradient)}>
        {art !== 'loaded' && art !== 'failed' && <div aria-hidden className="absolute inset-0 animate-pulse bg-white/10" />}
        {art === 'failed' && <Gamepad2 aria-hidden className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white/80" />}
        {art !== 'failed' && <img src={game.image} alt="" loading="eager" onLoad={() => setArt('loaded')} onError={() => setArt('failed')}
          className={cn('h-full w-full object-cover transition-opacity duration-300', art === 'loaded' ? 'opacity-100' : 'opacity-0')} />}
      </div>
      <div aria-hidden className="absolute inset-x-0 top-0 h-36 bg-gradient-to-t from-[#0d1020] via-[#0d1020]/30 to-transparent" />
      <div className="relative -mt-10 space-y-2 px-5 pb-5">
        <p className="text-xs font-semibold text-[#8ff5ff]">{role === 'host' ? t('partyPlay.next.host', 'Als Nächstes') : t('partyPlay.next.player', 'Gleich spielt ihr')}</p>
        <h2 className="font-game text-3xl leading-tight text-white">{t(game.nameKey)}</h2>
        <p className="line-clamp-2 text-sm text-white/65">{t(game.descKey)}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {next.chip && <AvailabilityChipView chip={next.chip} />}
          {next.sitOutHint && next.chip?.variant !== 'sitout' && (
            <span data-testid="lobby-sitout-hint" data-player-ids={sitOutIds.join(',')} className="inline-flex items-center gap-1 text-xs text-[#8ff5ff]">
              <Users className="h-3.5 w-3.5" aria-hidden />{next.sitOutHint}
            </span>
          )}
          {next.chip?.variant === 'sitout' && <span data-testid="lobby-sitout-hint" data-player-ids={sitOutIds.join(',')} className="sr-only">{next.sitOutHint}</span>}
        </div>
        {role === 'host' && next.skipped && next.due && (
          <p role="status" data-testid="setlist-suggestion" data-game-id={game.id} className="text-xs text-amber-200">
            {t('partyPlay.lobby.skipped', '{{game}} passt gerade nicht – weiter mit {{next}}.', { game: t(next.due.nameKey), next: t(game.nameKey) })}
          </p>
        )}
      </div>
    </motion.article>
  );
}
