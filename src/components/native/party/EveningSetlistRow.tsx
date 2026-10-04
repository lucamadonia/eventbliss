import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listStagger, partyMotion } from '@/lib/party-motion';
import { playableGames, type AvailabilityChip } from '@/lib/playable-games';
import { AvailabilityChipView } from './AvailabilityChipView';
import { GameArt } from './NextGameCard';

interface Props {
  /** Game ids after the hero game, in order. */
  gameIds: string[];
  /** Position number of the first entry (the hero is 1). */
  firstNumber?: number;
  /** Chip only on deviation (design §4.1) — return null when the game fits. */
  chipFor: (gameId: string) => AvailabilityChip | null;
  onRemove?: (offset: number) => void;
  onEdit?: () => void;
}

/** "Der Rest des Abends": the coming games as a compact, snap-scrolling row. */
export function EveningSetlistRow({ gameIds, firstNumber = 2, chipFor, onRemove, onEdit }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  if (!gameIds.length && !onEdit) return null;
  return (
    <section data-testid="evening-setlist" aria-labelledby="evening-setlist-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="evening-setlist-title" className="text-sm font-bold text-white/80">{t('partyPlay.evening.rest', 'Danach')}</h2>
        {onEdit && <button type="button" data-testid="evening-setlist-edit" onClick={onEdit}
          className="min-h-11 rounded-full px-3 text-sm font-semibold text-[#8ff5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5">
          {t('partyPlay.evening.editOrder', 'Reihenfolge ändern')}</button>}
      </div>
      {gameIds.length > 0 && (
        <motion.ol className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1" variants={listStagger} initial="initial" animate="animate">
          {gameIds.map((id, i) => {
            const game = playableGames.find(g => g.id === id);
            const chip = chipFor(id);
            return (
              <motion.li key={`${id}:${i}`} data-testid={`evening-game-${id}`} variants={partyMotion('cardEnter', reduced)} className="relative w-[84px] shrink-0 snap-start">
                <div className="relative">
                  {game ? <GameArt game={game} className="h-[72px] w-[72px] rounded-2xl" iconClassName="h-7 w-7" /> : <div className="h-[72px] w-[72px] rounded-2xl bg-white/10" />}
                  <span className="absolute -start-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-[#060810] px-1 font-game text-xs font-black tabular-nums text-white ring-1 ring-white/20">{firstNumber + i}</span>
                  {onRemove && <button type="button" onClick={() => onRemove(i)} aria-label={t('partyControllers.remove')}
                    className="absolute -end-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#060810] text-white/70 ring-1 ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]">
                    <X className="h-3.5 w-3.5" aria-hidden /></button>}
                </div>
                <p className="mt-1.5 w-[72px] truncate text-xs font-semibold text-white/85">{game ? t(game.nameKey) : id}</p>
                {chip && <AvailabilityChipView chip={chip} className="mt-1 max-w-[84px]" />}
              </motion.li>
            );
          })}
        </motion.ol>
      )}
    </section>
  );
}
