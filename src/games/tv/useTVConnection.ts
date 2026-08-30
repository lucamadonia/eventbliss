import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n';
import { createTVPacketGate, stripTVMessageId } from './tv-wire';

/**
 * Uebernimmt die Sprache des Telefons.
 *
 * Der Fernseher laeuft auf einem FREMDEN Geraet: ohne diese Uebernahme
 * ermittelt i18next seine Sprache aus dessen `navigator.language` — bei einem
 * deutschen Fernseher also Deutsch, egal was der Gastgeber eingestellt hat.
 * Genau das war der Grund, warum auf dem Fernseher alles deutsch erschien,
 * obwohl kein einziger Uebersetzungsschluessel fehlte.
 *
 * Das Nachladen des Sprachpakets passiert von selbst — src/i18n/index.ts
 * haengt `loadLocale` an das `languageChanged`-Ereignis.
 */
function applyPhoneLanguage(payload: unknown): void {
  const lang = (payload as { lang?: unknown } | null)?.lang;
  if (typeof lang !== 'string' || !lang) return;
  if (lang.split('-')[0] === i18n.language?.split('-')[0]) return;
  // Abgeschirmt und IMMER nach `setGameState`: `changeLanguage` stoesst einen
  // Nachlade- und Rerender-Vorgang an, der den Ereignis-Handler verlassen
  // kann. Stand die Zeile vorher, kam der Zustand nie an und der Fernseher
  // blieb in der Lobby stehen — mit korrekt uebersetzter Lobby, was die
  // Fehlersuche zusaetzlich in die Irre fuehrte. Das Bild darf nie an der
  // Uebersetzung haengen.
  try {
    void i18n.changeLanguage(lang);
  } catch {
    // Sprache nicht ladbar: der Fernseher bleibt bei seiner — kein Grund,
    // die Uebertragung zu verlieren.
  }
}

/**
 * Zuletzt empfangener Zustand je Raum, ABSICHTLICH ausserhalb von React.
 *
 * Ein Sprachwechsel laesst den Baum ueber `TVScreen` suspendieren; die
 * Komponente wird dabei neu gemountet und verlor bisher den gesamten
 * Uebertragungszustand. Sichtbar wurde das als Fernseher, der nach dem ersten
 * Zustand in die Lobby zurueckfiel — in der richtigen Sprache, was die
 * Fehlersuche in die Irre fuehrte.
 *
 * Der Fernseher soll einen Neuaufbau ueberstehen, ohne auf den naechsten
 * Broadcast zu warten: zwischen zwei Spielen kann Minuten lang keiner kommen.
 */
const lastStateByRoom = new Map<string, TVState>();
const startedRooms = new Set<string>();

/** Takt, in dem der TV seine Anwesenheit erneut meldet (siehe Heartbeat unten). */
export const TV_HEARTBEAT_MS = 15_000;
/** Nach so langer Stille gilt der TV als weg. Bewusst ein Vielfaches des
 *  Heartbeats, damit ein einzelnes verlorenes Paket ihn nicht abmeldet. */
export const TV_STALE_MS = 45_000;

export interface TVPlayer { id: string; name: string; color: string; avatar: string; isReady: boolean; }
export interface TVState { game: string; phase: string; [key: string]: unknown; }
export interface TVScore { name: string; score: number; color: string; }

export function useTVConnection(roomCode: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<TVPlayer[]>([]);
  const [gameState, setGameStateRaw] = useState<TVState | null>(
    () => lastStateByRoom.get(roomCode) ?? null
  );
  const initialSignature = gameState ? JSON.stringify(gameState) : '';
  const committedStateSignatureRef = useRef(initialSignature);
  const pendingStateRef = useRef<TVState | null>(null);
  const pendingStateSignatureRef = useRef('');
  const stateFrameRef = useRef<number | null>(null);
  /**
   * Collapse a burst to the newest state once per display frame. Supabase may
   * deliver compatible channel copies only milliseconds apart; rendering both
   * would make every transition visibly lag behind on a Smart TV.
   */
  const setGameState = useCallback((nextWire: TVState): boolean => {
    const next = stripTVMessageId(nextWire);
    const signature = JSON.stringify(next);
    if (signature === pendingStateSignatureRef.current) return false;
    if (stateFrameRef.current === null && signature === committedStateSignatureRef.current) return false;

    pendingStateRef.current = next;
    pendingStateSignatureRef.current = signature;
    if (stateFrameRef.current !== null) return true;

    const commit = () => {
      stateFrameRef.current = null;
      const pending = pendingStateRef.current;
      const pendingSignature = pendingStateSignatureRef.current;
      pendingStateRef.current = null;
      pendingStateSignatureRef.current = '';
      if (!pending || pendingSignature === committedStateSignatureRef.current) return;
      committedStateSignatureRef.current = pendingSignature;
      lastStateByRoom.set(roomCode, pending);
      setGameStateRaw(pending);
    };

    if (typeof window.requestAnimationFrame === 'function') {
      stateFrameRef.current = window.requestAnimationFrame(commit);
    } else {
      commit();
    }
    return true;
  }, [roomCode]);
  const [leaderboard, setLeaderboard] = useState<TVScore[]>([]);
  const [drawing, setDrawing] = useState<unknown[]>([]);
  const [gameStarted, setGameStarted] = useState(() => startedRooms.has(roomCode));
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gameStartedRef = useRef(startedRooms.has(roomCode));

  useEffect(() => {
    let bothSubscribed = 0;
    const totalChannels = 2;
    const acceptPacket = createTVPacketGate();

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
        startedRooms.add(roomCode);
        setGameStarted(true);
        // Re-announce TV presence now that a game is actively broadcasting.
        // Covers the common case where the TV joined during the lobby (before
        // the game component's 'tv-ready' listener existed) — the host now
        // learns a TV is connected and treats it as the speaker.
        const readyPayload = { tvReady: true, ts: Date.now() };
        channel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
        tvChannel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
      }
    };

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ id: string; name: string; color: string; avatar: string; isReady: boolean; joinedAt: number }>();
      const sorted = Object.values(state).flat().sort((a, b) => a.joinedAt - b.joinedAt);
      setPlayers(sorted.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, isReady: p.isReady })));
    });

    const handleTVState = (payload: unknown) => {
      if (!acceptPacket(payload)) return;
      const accepted = setGameState(payload as TVState);
      if (accepted) applyPhoneLanguage(payload);
      // Auto-set gameStarted if we receive any tv-state — handles case where
      // TV connected AFTER game-start was broadcast (timing issue)
      markGameStarted();
    };
    const handleLeaderboard = (payload: unknown) => {
      if (!acceptPacket(payload)) return;
      const clean = stripTVMessageId((payload || {}) as Record<string, unknown>);
      setLeaderboard(((clean as { scores?: unknown }).scores || []) as TVScore[]);
    };
    const handleGameStart = (payload: unknown) => {
      if (!acceptPacket(payload)) return;
      markGameStarted();
      setGameEnded(false);
      if (payload) setGameState(payload as TVState);
    };
    const handleStateSync = (payload: unknown) => {
      if (!payload || !acceptPacket(payload)) return;
      setGameState(payload as TVState);
      applyPhoneLanguage(payload);
      markGameStarted();
      setGameEnded(false);
    };

    channel.on('broadcast', { event: 'tv-state' }, ({ payload }) => handleTVState(payload));
    channel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => handleLeaderboard(payload));
    channel.on('broadcast', { event: 'tv-drawing' }, ({ payload }) => {
      if (!acceptPacket(payload)) return;
      const clean = stripTVMessageId((payload || {}) as Record<string, unknown>);
      if ((clean as { type?: string }).type === 'clear') setDrawing([]);
      else setDrawing(prev => [...prev, clean]);
    });
    // Batched stroke replay for TVs that connected mid-drawing
    channel.on('broadcast', { event: 'tv-drawing-sync' }, ({ payload }) => {
      if (!acceptPacket(payload)) return;
      const clean = stripTVMessageId((payload || {}) as Record<string, unknown>);
      const segments = (clean as { segments?: unknown[] }).segments;
      if (Array.isArray(segments)) setDrawing(segments);
    });
    channel.on('broadcast', { event: 'game-start' }, ({ payload }) => handleGameStart(payload));
    channel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });
    channel.on('broadcast', { event: 'bomb-state' }, ({ payload }) => {
      const s = (payload as { state?: TVState }).state;
      if (s) setGameState({ game: 'bomb', phase: s.phase, ...s });
    });
    // Listen for state-sync responses from the host (sent when host sees tv-ready)
    channel.on('broadcast', { event: 'tv-state-sync' }, ({ payload }) => handleStateSync(payload));

    // Mirror all TV events from the tv-room channel (offline TV mode)
    tvChannel.on('broadcast', { event: 'tv-state' }, ({ payload }) => handleTVState(payload));
    tvChannel.on('broadcast', { event: 'tv-leaderboard' }, ({ payload }) => handleLeaderboard(payload));
    tvChannel.on('broadcast', { event: 'game-start' }, ({ payload }) => handleGameStart(payload));
    tvChannel.on('broadcast', { event: 'game-end' }, () => { setGameEnded(true); });
    // Listen for state-sync on tv-room channel too
    tvChannel.on('broadcast', { event: 'tv-state-sync' }, ({ payload }) => handleStateSync(payload));

    const handleStatus = (status: string) => {
      if (status === 'SUBSCRIBED') broadcastTVReady();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(status === 'TIMED_OUT'
          ? i18n.t('tv.connectionTimeout', 'Verbindung hat zu lange gedauert. Bitte Seite neu laden.')
          : i18n.t('tv.connectionFailed', 'Verbindung fehlgeschlagen. Bitte Seite neu laden.'));
      }
    };
    channel.subscribe(handleStatus);
    tvChannel.subscribe(handleStatus);

    // Lebenszeichen. Ohne das erfährt das Telefon NIE, dass ein TV wieder weg
    // ist: es setzt tvConnected einmalig auf true und übergibt dem TV dauerhaft
    // die Ausgabe (bei OHRWURM den Ton). Verschwindet der TV, blieb die Partie
    // stumm, ohne dass sich sichtbar etwas geändert hätte.
    const heartbeat = window.setInterval(() => {
      const readyPayload = { tvReady: true, ts: Date.now() };
      channel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
      tvChannel.send({ type: 'broadcast', event: 'tv-ready', payload: readyPayload });
    }, TV_HEARTBEAT_MS);

    return () => {
      gameStartedRef.current = false;
      window.clearInterval(heartbeat);
      if (stateFrameRef.current !== null) window.cancelAnimationFrame(stateFrameRef.current);
      supabase.removeChannel(channel);
      supabase.removeChannel(tvChannel);
    };
  }, [roomCode, setGameState]);

  return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error };
}
