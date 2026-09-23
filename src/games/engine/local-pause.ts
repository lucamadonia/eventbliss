import { useSyncExternalStore } from 'react';
import { gameRoomSession } from '@/games/multiplayer/useGameRoom';

const dialogs = new Set<symbol>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const offRoom = gameRoomSession.subscribe(listener);
  document.addEventListener('visibilitychange', listener);
  return () => { listeners.delete(listener); offRoom(); document.removeEventListener('visibilitychange', listener); };
};
export function holdLocalGame(): () => void {
  const token = Symbol(); dialogs.add(token); notify();
  return () => { dialogs.delete(token); notify(); };
}
export function useLocalGamePaused(): boolean {
  return useSyncExternalStore(subscribe, () => {
    if (gameRoomSession.getSnapshot().room?.status === 'playing') return false;
    return dialogs.size > 0 || document.visibilityState === 'hidden';
  }, () => false);
}
