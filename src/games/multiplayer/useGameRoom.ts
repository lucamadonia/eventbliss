import { useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomSession } from './room-session';

export type { GameRoom, RoomPlayer, SavedRoom } from './room-types';
export { getSavedRoom, getRoomHistory, removeFromRoomHistory } from './room-types';
export const gameRoomSession = new RoomSession(supabase);
export const getOnlineRoomPlayers = () => gameRoomSession.getSnapshot().players;
export const subscribeOnlineRoom = gameRoomSession.subscribe;

export function useGameRoom() {
  const state = useSyncExternalStore(gameRoomSession.subscribe, gameRoomSession.getSnapshot, gameRoomSession.getServerSnapshot);
  return {
    ...state,
    roomHasPremium: state.room?.settings.controllerParty
      ? state.room.settings.hostPremium === true : state.players.some(player => player.isPremium),
    isHost: !!state.myPlayerId && state.room?.hostId === state.myPlayerId,
    /** Own id + 🔁 guests this device plays (lobby roster; games get the active subset). */
    localPlayerIds: state.localPlayerIds ?? [],
    /** True once this device was removed from the party; never auto-rejoin. */
    removed: !!state.removed,
    createRoom: gameRoomSession.createRoom,
    joinRoom: gameRoomSession.joinRoom,
    leaveRoom: gameRoomSession.leaveRoom,
    reconnect: gameRoomSession.reconnect,
    setReady: gameRoomSession.setReady,
    selectGame: gameRoomSession.selectGame,
    selectGames: gameRoomSession.selectGames,
    startGame: gameRoomSession.startGame,
    broadcast: gameRoomSession.broadcast,
    broadcastTo: gameRoomSession.broadcastTo,
    onBroadcast: gameRoomSession.onBroadcast,
    kickPlayer: gameRoomSession.kickPlayer,
    dropParticipant: gameRoomSession.dropParticipant,
  };
}
export type UseGameRoomReturn = ReturnType<typeof useGameRoom>;
