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

  useEffect(() => {
    const channel = supabase.channel(`game-room:${roomCode}`);

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

    channel.subscribe((status) => { if (status === 'SUBSCRIBED') setIsConnected(true); });
    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded };
}
