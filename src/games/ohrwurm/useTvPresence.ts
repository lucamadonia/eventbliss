// OHRWURM — weiss das Geraet, dass ein Fernseher im Raum ist? Der TV meldet
// sich mit 'tv-ready' (Verbindung + Herzschlag). Der Host teilt den Stand im
// Snapshot; Clients setzen ihn von dort (darum der Setter).
import { useEffect, useRef, useState } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { TV_STALE_MS } from '../tv/useTVConnection';

export function useTvPresence(online: OnlineGameProps | undefined) {
  const [tvConnected, setTvConnected] = useState(false);
  // Wann hat sich der TV zuletzt gemeldet? Treibt den Verfall von tvConnected.
  const tvSeenAtRef = useRef(0);
  const isOnline = !!online;

  // Host learns a TV joined the room (TV broadcasts 'tv-ready' on connect).
  useEffect(() => {
    if (!online) return;
    return online.onBroadcast('tv-ready', () => {
      tvSeenAtRef.current = Date.now();
      setTvConnected(true);
    });
  }, [online]);

  // Der TV meldet sich im Takt von TV_HEARTBEAT_MS. Bleibt er zu lange still,
  // ist er weg — und die Telefone müssen den Ton ZURÜCKBEKOMMEN. Ohne das war
  // `tvConnected` eine Einwegsperre: einmal true, unterdrückte `audioDevice`
  // auf jedem Telefon dauerhaft die Wiedergabe, während die Oberfläche
  // unverändert aussah.
  useEffect(() => {
    if (!isOnline || !tvConnected) return;
    const id = window.setInterval(() => {
      if (Date.now() - tvSeenAtRef.current > TV_STALE_MS) setTvConnected(false);
    }, 5_000);
    return () => window.clearInterval(id);
  }, [isOnline, tvConnected]);

  return [tvConnected, setTvConnected] as const;
}
