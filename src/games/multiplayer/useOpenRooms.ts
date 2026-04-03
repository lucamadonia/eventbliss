import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OpenRoom {
  roomCode: string;
  gameId: string;
  hostName: string;
  playerCount: number;
  timestamp: number;
}

export function useOpenRooms() {
  const [rooms, setRooms] = useState<OpenRoom[]>([]);

  useEffect(() => {
    const channel = supabase.channel('open-rooms');

    channel.on('broadcast', { event: 'room-created' }, ({ payload }) => {
      const room = payload as OpenRoom;
      setRooms(prev => [room, ...prev.filter(r => r.roomCode !== room.roomCode)].slice(0, 10));
    });

    channel.on('broadcast', { event: 'room-closed' }, ({ payload }) => {
      setRooms(prev => prev.filter(r => r.roomCode !== (payload as any).roomCode));
    });

    channel.on('broadcast', { event: 'room-updated' }, ({ payload }) => {
      const update = payload as Partial<OpenRoom> & { roomCode: string };
      setRooms(prev => prev.map(r => r.roomCode === update.roomCode ? { ...r, ...update } : r));
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return rooms;
}

/** Broadcast that a room was created */
export function broadcastRoomCreated(room: OpenRoom) {
  try { supabase.channel('open-rooms').send({ type: 'broadcast', event: 'room-created', payload: room }); } catch {}
}

/** Broadcast that a room was closed */
export function broadcastRoomClosed(roomCode: string) {
  try { supabase.channel('open-rooms').send({ type: 'broadcast', event: 'room-closed', payload: { roomCode } }); } catch {}
}
