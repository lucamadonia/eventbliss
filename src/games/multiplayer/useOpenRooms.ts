import { useEffect, useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { gameRoomSession } from './useGameRoom';

export interface OpenRoom {
  roomCode: string; gameId: string; hostName: string; playerCount: number; timestamp: number;
}
let channel: RealtimeChannel | null = null;
let rooms: OpenRoom[] = [];
const listeners = new Set<() => void>();
let consumers = 0;
let advertised = '';
let stopSession: (() => void) | null = null;
const empty: OpenRoom[] = [];

function currentAdvertisement(): OpenRoom | null {
  const { room, players, myPlayerId, connection } = gameRoomSession.getSnapshot();
  if (!room || room.hostId !== myPlayerId || room.status !== 'lobby' || connection !== 'connected') return null;
  return { roomCode: room.roomCode, gameId: room.gameId, hostName: players.find(p => p.id === myPlayerId)?.name || '', playerCount: players.length, timestamp: 0 };
}
function updateAdvertisement() {
  if (!channel || channel.state !== 'joined') return;
  const room = currentAdvertisement();
  const signature = JSON.stringify(room);
  if (signature === advertised) return;
  advertised = signature;
  if (room) void channel.track({ ...room, timestamp: Date.now() });
  else void channel.untrack();
}
function ensureChannel() {
  if (channel) return;
  const active = supabase.channel('open-rooms', { config: { presence: { key: crypto.randomUUID() } } });
  channel = active;
  active.on('presence', { event: 'sync' }, () => {
    const available = Object.values(active.presenceState<OpenRoom>()).flat()
      .filter(r => /^[A-HJ-NP-Z2-9]{6}$/.test(r.roomCode) && typeof r.hostName === 'string' && typeof r.gameId === 'string' && Number.isFinite(r.playerCount));
    rooms = [...new Map(available.map(r => [r.roomCode, r])).values()].sort((a,b) => b.timestamp - a.timestamp).slice(0, 10);
    listeners.forEach(listener => listener());
  });
  active.subscribe(status => { if (status === 'SUBSCRIBED') { advertised = ''; updateAdvertisement(); } });
  stopSession = gameRoomSession.subscribe(updateAdvertisement);
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getRooms = () => rooms;
export function useOpenRooms() {
  const result = useSyncExternalStore(subscribe, getRooms, () => empty);
  useEffect(() => {
    consumers++; ensureChannel();
    return () => {
      if (--consumers > 0) return;
      const old = channel; channel = null; advertised = ''; rooms = [];
      stopSession?.(); stopSession = null;
      if (old) void supabase.removeChannel(old);
    };
  }, []);
  return result;
}
// Compatibility for callers: presence now supplies an initial snapshot and
// removes disconnected hosts automatically, instead of one-off broadcasts.
export function broadcastRoomCreated(_room: OpenRoom) { updateAdvertisement(); }
export function broadcastRoomClosed(_roomCode: string) { if (channel) void channel.untrack(); advertised = ''; }
export function broadcastRoomUpdated(_update: Partial<OpenRoom> & { roomCode: string }) { updateAdvertisement(); }
