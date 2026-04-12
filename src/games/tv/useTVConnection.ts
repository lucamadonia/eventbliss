import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TVPlayer { id: string; name: string; color: string; avatar: string; isReady: boolean; }
export interface TVState { game: string; phase: string; [key: string]: unknown; }
export interface TVScore { name: string; score: number; color: string; }

export function useTVConnection(roomCode: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<TVPlayer[]>([]);
  const [gameState, setGameState] = useState<TVState | null>(null);
  const [leaderboard, setLeaderboard] = useState<TVScore[]>([]);
  const [drawing, setDrawing] = useState<unknown[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to BOTH channel prefixes so TV works for
    // online rooms (game-room:) AND offline TV mode (tv-room:)
    const channel = supabase.channel(`game-room:${roomCode}`);
    const tvChannel = supabase.channel(`tv-room:${roomCode}`);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ id: string; name: string; color: string; avatar: string; isReady: boolean; joinedAt: number }>();
      const sorted = Object.values(state).flat().sort((a, b) => a.joinedAt - b.joinedAt);
      setPlayers(sorted.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, isReady: p.isReady })));
    });

    channel.on('broadcast', { event: 'tv-state' }, ({ payload }) => { setGameState(payload as TVState); });
    channel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => { setLeaderboard(((payload as any).scores || []) as TVScore[]); });
    channel.on('broadcast', { event: 'tv-drawing' }, ({ payload }) => {
      if ((payload as any).type === 'clear') setDrawing([]);
      else setDrawing(prev => [...prev, payload]);
    });
    channel.on('broadcast', { event: 'game-start' }, ({ payload }) => {
      setGameStarted(true); setGameEnded(false);
      if (payload) setGameState(payload as TVState);
    });
    channel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });
    channel.on('broadcast', { event: 'bomb-state' }, ({ payload }) => {
      const s = (payload as any).state;
      if (s) setGameState({ game: 'bomb', phase: s.phase, ...s });
    });

    // Mirror all TV events from the tv-room channel (offline TV mode)
    tvChannel.on('broadcast', { event: 'tv-state' }, ({ payload }) => { setGameState(payload as TVState); });
    tvChannel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => { setLeaderboard(((payload as any).scores || []) as TVScore[]); });
    tvChannel.on('broadcast', { event: 'game-start' }, ({ payload }) => {
      setGameStarted(true); setGameEnded(false);
      if (payload) setGameState(payload as TVState);
    });
    tvChannel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setIsConnected(true);
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(status === 'TIMED_OUT'
          ? 'Verbindung hat zu lange gedauert. Bitte Seite neu laden.'
          : 'Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      }
    });
    tvChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setIsConnected(true);
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(status === 'TIMED_OUT'
          ? 'Verbindung hat zu lange gedauert. Bitte Seite neu laden.'
          : 'Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      }
    });
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tvChannel);
    };
  }, [roomCode]);

  return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error };
}
