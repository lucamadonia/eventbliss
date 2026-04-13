import { useState, useEffect, useRef } from 'react';
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
  const gameStartedRef = useRef(false);

  useEffect(() => {
    let bothSubscribed = 0;
    const totalChannels = 2;

    // Subscribe to BOTH channel prefixes so TV works for
    // online rooms (game-room:) AND offline TV mode (tv-room:)
    const channel = supabase.channel(`game-room:${roomCode}`);
    const tvChannel = supabase.channel(`tv-room:${roomCode}`);

    // Helper: broadcast tv-ready on BOTH channels so the host receives it
    // regardless of which channel prefix the game uses.
    const broadcastTVReady = () => {
      bothSubscribed++;
      if (bothSubscribed >= totalChannels) {
        setIsConnected(true);
        const readyPayload = { tvReady: true, ts: Date.now() };
        channel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
        tvChannel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
      }
    };

    const markGameStarted = () => {
      if (!gameStartedRef.current) {
        gameStartedRef.current = true;
        setGameStarted(true);
      }
    };

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ id: string; name: string; color: string; avatar: string; isReady: boolean; joinedAt: number }>();
      const sorted = Object.values(state).flat().sort((a, b) => a.joinedAt - b.joinedAt);
      setPlayers(sorted.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, isReady: p.isReady })));
    });

    channel.on('broadcast', { event: 'tv-state' }, ({ payload }) => {
      setGameState(payload as TVState);
      // Auto-set gameStarted if we receive any tv-state — handles case where
      // TV connected AFTER game-start was broadcast (timing issue)
      markGameStarted();
    });
    channel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => { setLeaderboard(((payload as any).scores || []) as TVScore[]); });
    channel.on('broadcast', { event: 'tv-drawing' }, ({ payload }) => {
      if ((payload as any).type === 'clear') setDrawing([]);
      else setDrawing(prev => [...prev, payload]);
    });
    channel.on('broadcast', { event: 'game-start' }, ({ payload }) => {
      markGameStarted(); setGameEnded(false);
      if (payload) setGameState(payload as TVState);
    });
    channel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });
    channel.on('broadcast', { event: 'bomb-state' }, ({ payload }) => {
      const s = (payload as any).state;
      if (s) setGameState({ game: 'bomb', phase: s.phase, ...s });
    });
    // Listen for state-sync responses from the host (sent when host sees tv-ready)
    channel.on('broadcast', { event: 'tv-state-sync' }, ({ payload }) => {
      if (payload) {
        setGameState(payload as TVState);
        markGameStarted();
        setGameEnded(false);
      }
    });

    // Mirror all TV events from the tv-room channel (offline TV mode)
    tvChannel.on('broadcast', { event: 'tv-state' }, ({ payload }) => {
      setGameState(payload as TVState);
      markGameStarted();
    });
    tvChannel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => { setLeaderboard(((payload as any).scores || []) as TVScore[]); });
    tvChannel.on('broadcast', { event: 'game-start' }, ({ payload }) => {
      markGameStarted(); setGameEnded(false);
      if (payload) setGameState(payload as TVState);
    });
    tvChannel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });
    // Listen for state-sync on tv-room channel too
    tvChannel.on('broadcast', { event: 'tv-state-sync' }, ({ payload }) => {
      if (payload) {
        setGameState(payload as TVState);
        markGameStarted();
        setGameEnded(false);
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') broadcastTVReady();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(status === 'TIMED_OUT'
          ? 'Verbindung hat zu lange gedauert. Bitte Seite neu laden.'
          : 'Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      }
    });
    tvChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') broadcastTVReady();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(status === 'TIMED_OUT'
          ? 'Verbindung hat zu lange gedauert. Bitte Seite neu laden.'
          : 'Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      }
    });
    return () => {
      gameStartedRef.current = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(tvChannel);
    };
  }, [roomCode]);

  return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error };
}
