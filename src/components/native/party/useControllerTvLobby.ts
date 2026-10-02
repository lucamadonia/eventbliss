import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoomPlayer } from '@/games/multiplayer/room-types';
import type { ControllerPartyData } from '@/games/party/controller-api';
import { controllerGameAvailability, nextAvailableIndex } from '@/games/party/party-availability';
import type { PartySession } from '@/games/party/session-schema';
import { buildPartyNightState } from '@/games/party/standings';
import { serverClock } from '@/games/party/scene-clock';
import { controllerLobbyState } from '@/games/tv/tv-lobby-state';
import { useTVContext } from '@/contexts/TVBroadcastContext';
import { getBaseUrl } from '@/lib/platform';
import { playableGames } from '@/lib/playable-games';

/**
 * The Host's phone feeds the TV while the party is in the lobby: the waiting
 * room (`lobby`, big join QR) before the first game, then map / standings.
 * The next game is the next one that can START; otherwise the due one, and
 * the TV shows why it waits.
 */
export function useControllerTvLobby(data: ControllerPartyData | null, session: PartySession | null, presence: RoomPlayer[], isHost: boolean) {
  const { t, i18n } = useTranslation();
  const tv = useTVContext();
  useEffect(() => {
    if (!isHost || !tv?.isActive || !session || !data || data.party.status === 'playing') return;
    const playlist = data.party.playlist, nextIndex = data.results.length;
    const ended = data.party.status === 'finished';
    const view = ended || (playlist.length > 0 && nextIndex >= playlist.length) ? 'finale' : nextIndex ? 'between' : 'intro';
    const nameFor = (id: string) => t(playableGames.find(game => game.id === id)?.nameKey ?? id);
    const partyNight = buildPartyNightState(session, nameFor, view);
    const fit = nextAvailableIndex(playlist, nextIndex, id => controllerGameAvailability(id, data).startable);
    const shownId = fit >= 0 ? playlist[fit] : playlist[nextIndex];
    const game = playableGames.find(entry => entry.id === shownId);
    const lobby = ended ? undefined : controllerLobbyState({
      data, presence, baseUrl: getBaseUrl(), gamesPlanned: playlist.length,
      // The builder judges availability itself (gameAvailability) and the TV words it.
      nextGame: game ? { id: game.id, name: nameFor(game.id), minPlayers: game.minPlayers, maxPlayers: game.maxPlayers } : null,
    });
    tv.broadcastTV('tv-state', { game: 'lobby', phase: 'idle', lang: i18n.language, partyNight,
      controllerJoinCode: ended ? null : data.party.code, players: session.players, serverNow: new Date(serverClock.now()).toISOString(), ...(lobby ? { lobby } : {}) });
  }, [isHost, tv, session, data, presence, t, i18n.language]);
}
