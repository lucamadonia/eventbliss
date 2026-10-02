import { useTranslation } from 'react-i18next';
import type { ControllerPartyData } from '@/games/party/controller-api';
import { setControllerPlaylist, startControllerGame } from '@/games/party/controller-session';
import {
  availabilityText, chipFor, controllerGameAvailability, joinNames, nextAvailableIndex, sitOutHint, sittingOutNames,
} from '@/games/party/party-availability';
import { playableGames, type AvailabilityChip, type PlayableGame } from '@/lib/playable-games';

const act = (work: Promise<unknown>) => { void work.catch(() => { /* state displays failure */ }); };

/** Moves the entry at `from` to `to` (used to play a later fitting game now). */
export function movePlaylistEntry(playlist: readonly string[], from: number, to: number): string[] {
  const next = [...playlist];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

export interface NextGame {
  /** The game that would start now (first startable entry), else the due one. */
  game: PlayableGame | null;
  /** The due entry cannot start; `game` is a later one that can. */
  skipped: boolean;
  due: PlayableGame | null;
  chip: AvailabilityChip | null;
  /** E03: who sits this game out. */
  sitOutHint: string | null;
  /** Exact blocker for the start, or null when it can start. */
  blocker: string | null;
  start: () => void;
}

/**
 * „What's next?“ for the joystick lobby — one source for the Host's start bar,
 * the next-game hero card and the players' teaser.
 */
export function useNextGame(data: ControllerPartyData | null, notReady: string[], connected: boolean): NextGame {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const tr = (key: string, fallback: string, options?: Record<string, unknown>) => t(key, fallback, options);
  if (!data) return { game: null, skipped: false, due: null, chip: null, sitOutHint: null, blocker: null, start: () => {} };
  const playlist = data.party.playlist;
  const nextIndex = data.results.length;
  const find = (id?: string) => playableGames.find(game => game.id === id) ?? null;
  const fitIndex = nextAvailableIndex(playlist, nextIndex, id => controllerGameAvailability(id, data).startable);
  const dueId = playlist[nextIndex];
  const id = fitIndex >= 0 ? playlist[fitIndex] : dueId;
  const availability = id ? controllerGameAvailability(id, data) : null;
  const sitOut = id ? sittingOutNames(id, data) : [];
  const dueText = dueId ? availabilityText(controllerGameAvailability(dueId, data), tr, sittingOutNames(dueId, data), locale) : null;
  const dueName = dueId ? t(find(dueId)?.nameKey ?? dueId) : '';
  const blocker = !dueId ? t('partyPlay.lobby.noGame', 'Plane zuerst ein Spiel.')
    : fitIndex < 0 ? (dueText ? `${dueName}: ${dueText}` : t('partyPlay.lobby.nothingFits', 'Kein geplantes Spiel passt zu eurer Runde.'))
    : !connected ? t('partyPlay.lobby.connecting', 'Verbinde …')
    : notReady.length === 1 ? t('partyPlay.lobby.notReadyOne', '{{name}} ist noch nicht bereit', { name: notReady[0] })
    : notReady.length ? t('partyPlay.lobby.notReadyNames', 'Noch nicht bereit: {{names}}', { names: joinNames(notReady, locale) })
    : null;
  return {
    game: find(id), due: find(dueId), skipped: fitIndex > nextIndex,
    chip: availability ? chipFor(availability, sitOut, locale) : null,
    sitOutHint: availability ? sitOutHint(availability, tr, sitOut, locale) : null,
    blocker,
    start: () => {
      if (fitIndex < 0) return;
      const nextId = playlist[fitIndex];
      // The server's playlist position is the result count: bring the fitting game forward first.
      if (fitIndex > nextIndex) act(setControllerPlaylist(movePlaylistEntry(playlist, fitIndex, nextIndex)).then(() => startControllerGame(nextId)));
      else act(startControllerGame(nextId));
    },
  };
}
