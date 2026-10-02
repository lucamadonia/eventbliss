import { Check, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ControllerPartyData } from '@/games/party/controller-api';
import { setControllerPlaylist } from '@/games/party/controller-session';
import { availabilityStatus, chipFor, controllerGameAvailability, nextAvailableIndex, sittingOutNames } from '@/games/party/party-availability';
import { playableGames } from '@/lib/playable-games';
import { cn } from '@/lib/utils';
import { AvailabilityChipView } from './AvailabilityChipView';

interface Props {
  data: ControllerPartyData;
  busy: boolean;
}
const act = (work: Promise<unknown>) => { void work.catch(() => { /* state displays failure */ }); };
const nameKey = (id: string) => playableGames.find(g => g.id === id)?.nameKey ?? id;

/**
 * Host lobby: set list and game picker. The next game and its start live in
 * the hero card and the sticky start bar (useNextGame). Planning stays open
 * while people still join: only games that can never run here (premium, too
 * many) are disabled; every game shows its chip.
 */
export function ControllerPlaylistPanel({ data, busy }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const playlist = data.party.playlist;
  const nextIndex = data.results.length;
  const availability = (id: string) => controllerGameAvailability(id, data);
  const skipped = nextAvailableIndex(playlist, nextIndex, id => availability(id).startable) > nextIndex;

  return <section className="space-y-4">
    {playlist.length > 0 && <details className="rounded-2xl border border-white/10 p-4" open={skipped}><summary className="min-h-11 cursor-pointer py-2 font-semibold">{t('partyControllers.playlist')} <span className="text-white/60">({playlist.length})</span></summary>
      <ol className="space-y-2">{playlist.map((id, index) => {
        const done = index < nextIndex;
        const entry = availability(id);
        const chip = chipFor(entry, sittingOutNames(id, data), locale);
        return <li key={`${id}:${index}`} data-testid={done ? undefined : `setlist-hint-${id}`} data-status={availabilityStatus(entry)}
          className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className={cn('text-white/50', chip.locked && !done && 'opacity-45')}>{index + 1}</span>
          <span className="min-w-0 flex-1"><span className={cn('block truncate', chip.locked && !done && 'opacity-45')}>{t(nameKey(id))}</span>
            {!done && chip.variant !== 'fits' && <AvailabilityChipView chip={chip} className="mt-1" />}</span>
          {done ? <Check size={18} /> : <button className="grid h-11 w-11 place-items-center" aria-label={t('partyControllers.remove')} onClick={() => act(setControllerPlaylist(playlist.filter((_, i) => i !== index)))}><X size={18} /></button>}
        </li>;
      })}</ol>
    </details>}

    <details className="rounded-2xl border border-white/10 bg-white/5 p-4"><summary className="min-h-11 cursor-pointer py-2 font-semibold">{t('nativeExtra.partyNight.pickTitle')}</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{playableGames.map(game => {
      const entry = availability(game.id);
      const chip = chipFor(entry, sittingOutNames(game.id, data), locale);
      // Locked tiles (premium, too many) stay visible: only image and name dim, never the chip.
      const blocked = chip.locked || playlist.length >= 30;
      return <button key={game.id} type="button" data-testid={`game-option-${game.id}`} data-available={entry.plannable} data-startable={entry.startable}
        aria-disabled={blocked || busy || undefined} onClick={() => { if (!blocked && !busy) act(setControllerPlaylist([...playlist, game.id])); }}
        className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]">
        <img src={game.image} alt="" className={cn('h-14 w-14 rounded-xl object-cover', chip.locked && 'opacity-45 grayscale')} loading="lazy" />
        <span className="min-w-0 flex-1"><strong className={cn('block text-sm', chip.locked && 'opacity-45')}>{t(game.nameKey)}</strong>
          {/* "passt" on every tile is noise: only deviations get a chip (design §4.1). */}
          {chip.variant !== 'fits' && <AvailabilityChipView chip={chip} className="mt-1" />}</span>
        {!blocked && <Plus size={18} aria-hidden />}
      </button>;
    })}</div></details>
  </section>;
}
