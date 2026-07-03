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

/**
 * Best-effort send on the shared 'open-rooms' channel. Broadcast sends are
 * only delivered once the channel is actually joined — a bare
 * `supabase.channel(...).send(...)` on a fresh channel is silently dropped.
 * supabase.channel() dedupes by topic, so this reuses the useOpenRooms
 * listener channel when one is mounted.
 */
async function sendOpenRooms(event: string, payload: Record<string, unknown>) {
  try {
    const ch = supabase.channel('open-rooms');
    if (ch.state !== 'joined' && ch.state !== 'joining') ch.subscribe();
    const start = Date.now();
    while (ch.state !== 'joined' && Date.now() - start < 3000) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (ch.state === 'joined') {
      await ch.send({ type: 'broadcast', event, payload });
    }
  } catch { /* discovery is best-effort */ }
}

/** Broadcast that a room was created */
export function broadcastRoomCreated(room: OpenRoom) {
  void sendOpenRooms('room-created', room as unknown as Record<string, unknown>);
}

/** Broadcast that a room was closed */
export function broadcastRoomClosed(roomCode: string) {
  void sendOpenRooms('room-closed', { roomCode });
}

/** Broadcast a player-count / metadata update for an open room */
export function broadcastRoomUpdated(update: Partial<OpenRoom> & { roomCode: string }) {
  void sendOpenRooms('room-updated', update as unknown as Record<string, unknown>);
}
