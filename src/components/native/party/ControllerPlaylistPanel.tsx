import { Check, Play, Plus, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ControllerPartyData } from '@/games/party/controller-api';
import { setControllerPlaylist, startControllerGame } from '@/games/party/controller-session';
import {
  availabilityStatus, availabilityText, chipFor, controllerGameAvailability, joinNames, nextAvailableIndex, sitOutHint, sittingOutNames,
} from '@/games/party/party-availability';
import { playableGames } from '@/lib/playable-games';
import { cn } from '@/lib/utils';
import { AvailabilityChipView } from './AvailabilityChipView';
import { lobbyButton as button } from './ControllerPartyStart';

interface Props {
  data: ControllerPartyData;
  /** Names of active phone players that are not ready yet. */
  notReady: string[];
  busy: boolean;
  connected: boolean;
}
const act = (work: Promise<unknown>) => { void work.catch(() => { /* state displays failure */ }); };
const nameKey = (id: string) => playableGames.find(g => g.id === id)?.nameKey ?? id;

/** Moves the entry at `from` to `to` (used to play a later fitting game now). */
export function movePlaylistEntry(playlist: readonly string[], from: number, to: number): string[] {
  const next = [...playlist];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

/**
 * Host lobby: next game, start button with its reason, set list and picker.
 * Planning stays open while people still join: only games that can never
 * run here (premium, too many) are disabled. Starting needs `startable`;
 * every game shows its chip („wartet auf 2 Spieler“, „max. 4 Spieler“).
 */
export function ControllerPlaylistPanel({ data, notReady, busy, connected }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const tr = (key: string, fallback: string, options?: Record<string, unknown>) => t(key, fallback, options);
  const playlist = data.party.playlist;
  const nextIndex = data.results.length;
  const availability = (id: string) => controllerGameAvailability(id, data);
  const fitIndex = nextAvailableIndex(playlist, nextIndex, id => availability(id).startable);
  const next = fitIndex >= 0 ? playlist[fitIndex] : undefined;
  const skipped = fitIndex > nextIndex;
  const due = playlist[nextIndex];
  const nextAvailability = next ? availability(next) : null;
  const sitOut = next ? sittingOutNames(next, data) : [];
  const hint = nextAvailability ? sitOutHint(nextAvailability, tr, sitOut, locale) : null;
  const dueText = due ? availabilityText(availability(due), tr, sittingOutNames(due, data), locale) : null;
  const disabledReason = !due ? t('partyPlay.lobby.noGame', 'Plane zuerst ein Spiel.')
    : !next ? (dueText ? `${t(nameKey(due))}: ${dueText}` : t('partyPlay.lobby.nothingFits', 'Kein geplantes Spiel passt zu eurer Runde.'))
    : !connected ? t('partyPlay.lobby.connecting', 'Verbinde …')
    : notReady.length ? t('partyPlay.lobby.notReadyNames', 'Noch nicht bereit: {{names}}', { names: joinNames(notReady, locale) })
    : null;

  const start = () => {
    if (!next) return;
    // The server's playlist position is the result count: bring the fitting game forward first.
    if (skipped) act(setControllerPlaylist(movePlaylistEntry(playlist, fitIndex, nextIndex)).then(() => startControllerGame(next)));
    else act(startControllerGame(next));
  };

  return <section className="space-y-4">
    <h2 className="text-lg font-bold">{next ? t('nativeExtra.partyNight.continueTo', { game: t(nameKey(next)) }) : t('partyControllers.playlist')}</h2>
    {skipped && due && <p role="status" data-testid="setlist-suggestion" data-game-id={next} className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">
      {t('partyPlay.lobby.skipped', '{{game}} passt gerade nicht – weiter mit {{next}}.', { game: t(nameKey(due)), next: t(nameKey(next!)) })}
    </p>}
    <button data-testid="lobby-start" data-disabled-reason={disabledReason ?? undefined} disabled={!!disabledReason || busy}
      className={`${button} w-full bg-[#df8eff] text-black`} onClick={start}><Play className="me-2 inline h-5 w-5" />{t('partyControllers.startNext')}</button>
    {disabledReason && <p role="status" className="text-sm text-white/70">{disabledReason}</p>}
    {hint && <p role="status" data-testid="lobby-sitout-hint" data-player-ids={data.members.filter(m => !m.banned && m.controlled_by != null).map(m => m.player_id).join(',')}
      className="flex items-center gap-2 text-sm text-[#8ff5ff]"><Users className="h-4 w-4" aria-hidden />{hint}</p>}

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
