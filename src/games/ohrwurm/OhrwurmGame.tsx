import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, ArrowRight, RotateCcw, Trophy, Users, User, Plus, X as CloseIcon,
  Check, Music2, Fish, Repeat, ExternalLink, ChevronRight, Sparkles, Crown, Zap, Heart,
  Loader2, QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { Confetti } from '@/components/expenses-v2/Confetti';
import {
  buildDeck, resolveRound, insertSorted, hasWon,
  type Participant, type Phase, type PendingCounter, type RoundResolution, type Song,
} from './ohrwurm-engine';
import { OHRWURM_GENRES, spotifyTrackDeepLink, spotifyTrackUrl } from './ohrwurm-content';
import { useGameTimer } from '../engine/TimerSystem';
import { MysteryPlayer } from './MysteryPlayer';
import { PlayerSetup } from '../ui/PlayerSetup';
import { supabase } from '@/integrations/supabase/client';
import { type PlaybackMode, type SpotifyBridge, spotifyModePossible, getSpotifyBridge, resolveSpotifyUri } from './playback';
import { loadExtraSongs } from './ohrwurm-extra-songs';
import { useTranslation } from 'react-i18next';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';

const ROUND_SECONDS = 60;      // Zeit zum Einordnen (Speed-Regel)
const SPEED_BONUS_MS = 10_000; // innerhalb 10s → Speed-Bonus (+2 🎣)

// ---------------------------------------------------------------------------
// Design-Tokens (Spec §6) — als lokale Konstanten, damit das Corporate-Design
// an einer Stelle gepflegt werden kann.
// ---------------------------------------------------------------------------
const OW = {
  primary: '#FF2E88',   // Aktion / Hervorhebung
  secondary: '#26E0C4', // Konter / Erfolg
  accent: '#FFD23F',    // Highlight / Slots
  bg: '#16101f',
  elevated: '#1e1530',
  surface: '#241a39',
  text: '#F7F2E9',
  dim: '#b3a8c9',
} as const;

const PLAYER_COLORS = ['#FF2E88', '#26E0C4', '#FFD23F', '#8b5cf6'];
const MAX_HOOKS = 5;        // Hausregel-Cap (Spec §2.4)
const START_HOOKS = 3;      // Spec §2.1

const OW_STYLE = `
.ow-glow-pink { text-shadow: 0 0 18px rgba(255,46,136,.55), 0 0 40px rgba(255,46,136,.3); }
.ow-glow-teal { text-shadow: 0 0 18px rgba(38,224,196,.55), 0 0 40px rgba(38,224,196,.3); }
.ow-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
@keyframes ow-eq { 0%,100% { height: 20%; } 50% { height: 100%; } }
.ow-chip:focus-visible { outline: 2px solid #FF2E8899; outline-offset: 2px; }
`;

// ---------------------------------------------------------------------------
// Setup-Konfiguration
// ---------------------------------------------------------------------------
interface OhrwurmConfig {
  mode: 'solo' | 'group';
  winTarget: number;
  genre: string | null;
  playback: PlaybackMode;
}

interface SetupPlayer { id: string; name: string; color: string; avatar: string; }

// ===========================================================================
// Haupt-Komponente
// ===========================================================================
export default function OhrwurmGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { i18n } = useTranslation();
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);

  // --- Online roles -------------------------------------------------------
  // Offline (no `online` prop) → this single device is effectively the host
  // and runs all game logic, exactly as before. Online → the room host owns
  // the authoritative state and broadcasts it; other devices mirror it and
  // send their inputs back as actions.
  const isOnline = !!online;
  const isHost = !online || online.isHost;
  const myId = online?.myPlayerId ?? null;
  // Whether a TV is connected to the room (host learns this via the 'tv-ready'
  // event and shares it in the snapshot). When a TV is present it is the
  // speaker; otherwise the active player's own phone plays the preview.
  const [tvConnected, setTvConnected] = useState(false);

  // Admin-gepflegte Songs (Tabelle ohrwurm_songs) für die aktuelle Sprache
  // zur statischen Liste zuschalten.
  useEffect(() => {
    void loadExtraSongs(i18n.language?.split('-')[0]);
  }, [i18n.language]);

  const [phase, setPhase] = useState<Phase>('setup');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deck, setDeck] = useState<Song[]>([]);
  const [turn, setTurn] = useState(0);
  const [song, setSong] = useState<Song | null>(null);
  const [placement, setPlacement] = useState<number | null>(null);
  const [counter, setCounter] = useState<PendingCounter | null>(null);
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<RoundResolution | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [swapUsed, setSwapUsed] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false); // aktive Person hat Titel+Interpret angesagt
  const [bonusDecided, setBonusDecided] = useState(false);
  const [winTarget, setWinTarget] = useState(10);
  const [genre, setGenre] = useState<string | null>(null);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // --- In-App-Wiedergabe (verborgene 30s-Vorschau) + Runden-Timer ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawIdRef = useRef(0);
  const playStartedAtRef = useRef<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [listening, setListening] = useState(false);              // Timer läuft (Song gestartet)
  const [placeElapsedMs, setPlaceElapsedMs] = useState<number | null>(null);
  // Spotify-Autorisierung (Token via native Bridge) — ermöglicht Like/Playlist.
  // Die In-Game-Wiedergabe läuft IMMER über die 30s-Vorschau (<audio>); der ganze
  // Song ist erst NACH dem Reveal per Deep-Link/QR direkt in Spotify erreichbar.
  const spotifyBridgeRef = useRef<SpotifyBridge | null>(null);
  const spotifyModeRef = useRef(false); // ist der Spotify-Premium-Modus gewählt?
  const [spotifyUri, setSpotifyUri] = useState<string | null>(null);
  // Sichtbarer Spotify-Status: null | 'connecting' | 'ok' | 'preview:<grund>'
  const [spotifyStatus, setSpotifyStatus] = useState<string | null>(null);
  // Lade-Status der Reveal-Spotify-Aktionen (verhindert Doppel-Schreiben bei Doppeltipp).
  const [likeBusy, setLikeBusy] = useState(false);
  const [playlistBusy, setPlaylistBusy] = useState(false);
  // QR-Overlay sichtbar?
  const [qrOpen, setQrOpen] = useState(false);

  const active = participants[turn] ?? null;
  const ownedIds = useMemo(
    () => new Set(participants.flatMap((p) => p.timeline.map((s) => s.id))),
    [participants],
  );

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); try { a.currentTime = 0; } catch { /* noop */ } }
    setIsAudioPlaying(false);
  }, []);

  // Vorschau für die gezogene Karte server-seitig (iTunes) auflösen.
  const loadPreview = useCallback(async (s: Song, myDraw: number) => {
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const { data } = await supabase.functions.invoke('ohrwurm-preview', {
        body: { artist: s.artist, title: s.title },
      });
      if (drawIdRef.current !== myDraw) return; // veraltete Antwort verwerfen
      setPreviewUrl((data as { previewUrl?: string | null } | null)?.previewUrl ?? null);
    } catch {
      if (drawIdRef.current === myDraw) setPreviewUrl(null);
    } finally {
      if (drawIdRef.current === myDraw) setPreviewLoading(false);
    }
  }, []);

  // --- Stapel: oberste Karte ziehen, ggf. neu mischen (Spec §2.6) ---------
  const takeCard = useCallback((d: Song[], owned: Set<string>): { card: Song; rest: Song[] } => {
    if (d.length > 0) {
      return { card: d[d.length - 1], rest: d.slice(0, -1) };
    }
    const fresh = buildDeck(genre).filter((s) => !owned.has(s.id));
    return { card: fresh[fresh.length - 1], rest: fresh.slice(0, -1) };
  }, [genre]);

  // --- Neue Runde starten -------------------------------------------------
  const beginTurn = useCallback((parts: Participant[], d: Song[], idx: number) => {
    const owned = new Set(parts.flatMap((p) => p.timeline.map((s) => s.id)));
    const { card, rest } = takeCard(d, owned);
    setParticipants(parts);
    setDeck(rest);
    setTurn(idx);
    setSong(card);
    setPlacement(null);
    setCounter(null);
    setCounteringId(null);
    setResolution(null);
    setFlipped(false);
    setSwapUsed(false);
    setBonusClaimed(false);
    setBonusDecided(false);
    // Wiedergabe/Timer für die neue Runde zurücksetzen + Vorschau laden
    stopAudio();
    setListening(false);
    setPlaceElapsedMs(null);
    playStartedAtRef.current = null;
    const myDraw = ++drawIdRef.current;
    void loadPreview(card, myDraw);
    // Spotify-Premium aktiv? Track-URI parallel auflösen (Bridge spielt sie ab).
    // Gebackene URI SOFORT setzen — unabhängig davon, ob die Bridge schon
    // verbunden ist (sie verbindet async erst nach dem Spotify-Login; sonst
    // bliebe die erste Karte ohne URI → 30s-Vorschau trotz „verbunden").
    setSpotifyUri(card.spotifyUri ?? null);
    if (!card.spotifyUri && spotifyModeRef.current) {
      void resolveSpotifyUri(card).then((uri) => { if (drawIdRef.current === myDraw) setSpotifyUri(uri); });
    }
    setPhase('draw');
  }, [takeCard, stopAudio, loadPreview]);

  // --- Spielstart ---------------------------------------------------------
  const handleStart = useCallback((cfg: OhrwurmConfig, players: SetupPlayer[]) => {
    let d = buildDeck(cfg.genre);
    const parts: Participant[] = players.map((p) => {
      const startCard = d[d.length - 1];
      d = d.slice(0, -1);
      return {
        id: p.id,
        name: p.name,
        type: cfg.mode === 'group' ? 'group' : 'player',
        color: p.color,
        avatar: p.avatar,
        timeline: [startCard],
        hooks: START_HOOKS,
      };
    });
    setWinTarget(cfg.winTarget);
    setGenre(cfg.genre);
    // Spotify-Premium-Modus gewählt? Bridge nur zum AUTORISIEREN holen (Token für
    // Like/Playlist). KEINE App-Remote-Wiedergabe mehr — im Spiel läuft die 30s-
    // Vorschau; der ganze Song ist erst nach dem Reveal per Deep-Link erreichbar.
    spotifyBridgeRef.current = null;
    spotifyModeRef.current = cfg.playback === 'spotify';
    if (cfg.playback === 'spotify') {
      setSpotifyStatus('connecting');
      void getSpotifyBridge().then(({ bridge, reason }) => {
        if (!bridge) { setSpotifyStatus('preview:' + reason); flash('Spotify: ' + reason + ' — 30s-Vorschau'); return; }
        spotifyBridgeRef.current = bridge;
        setSpotifyStatus('ok');
      });
    } else {
      setSpotifyStatus(null);
    }
    void haptics.celebrate();
    beginTurn(parts, d, 0);
  }, [beginTurn, haptics, flash]);

  // --- 60s-Timer: läuft ab → Karte verfällt, nächste Person ---------------
  const handleTimeout = useCallback(() => {
    // In online mode only the host runs the authoritative timeout; clients just
    // mirror the clock for display.
    if (online && !online.isHost) return;
    if (!song) return;
    stopAudio();
    setListening(false);
    void haptics.error();
    flash('⏱ Zeit abgelaufen — Karte verfällt');
    const nextIdx = (turn + 1) % participants.length;
    const newDeck = [song, ...deck]; // verfallene Karte zurück nach unten
    window.setTimeout(() => beginTurn(participants, newDeck, nextIdx), 650);
  }, [song, stopAudio, haptics, flash, turn, participants, deck, beginTurn]);

  const roundTimer = useGameTimer(ROUND_SECONDS, handleTimeout);

  const replayAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a || !previewUrl) return;
    try { a.currentTime = 0; } catch { /* noop */ }
    a.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    void haptics.light();
  }, [previewUrl, haptics]);

  // --- Phase 1: Tausch (Spec §2.4 #2) -------------------------------------
  const handleSwap = useCallback(() => {
    if (!active || !song || swapUsed || active.hooks < 1) return;
    void haptics.medium();
    const owned = new Set(participants.flatMap((p) => p.timeline.map((s) => s.id)));
    // aktuelle Karte unter den Stapel, neue oberste ziehen
    const deckWithBack = [song, ...deck];
    const { card, rest } = takeCard(deckWithBack, owned);
    setParticipants((prev) => prev.map((p, i) => (i === turn ? { ...p, hooks: p.hooks - 1 } : p)));
    setDeck(rest);
    setSong(card);
    setSwapUsed(true);
    setBonusClaimed(false); // neue Karte → ggf. erneut Titel+Interpret ansagen
    // neuer Song → Wiedergabe/Timer zurücksetzen, neue Vorschau laden
    stopAudio();
    setListening(false);
    setPlaceElapsedMs(null);
    playStartedAtRef.current = null;
    roundTimer.reset(ROUND_SECONDS);
    const myDraw = ++drawIdRef.current;
    void loadPreview(card, myDraw);
    // Gebackene URI SOFORT setzen — unabhängig davon, ob die Bridge schon
    // verbunden ist (sie verbindet async erst nach dem Spotify-Login; sonst
    // bliebe die erste Karte ohne URI → 30s-Vorschau trotz „verbunden").
    setSpotifyUri(card.spotifyUri ?? null);
    if (!card.spotifyUri && spotifyModeRef.current) {
      void resolveSpotifyUri(card).then((uri) => { if (drawIdRef.current === myDraw) setSpotifyUri(uri); });
    }
    flash('Karte getauscht — 1 🎣 abgegeben');
  }, [active, song, swapUsed, participants, deck, turn, takeCard, haptics, flash, stopAudio, roundTimer, loadPreview]);

  // --- Phase 2: Einordnen -------------------------------------------------
  const handlePlace = useCallback((slotIndex: number) => {
    if (!active) return;
    void haptics.light();
    // Speed messen + Timer/Audio stoppen
    const elapsed = playStartedAtRef.current != null ? Date.now() - playStartedAtRef.current : null;
    setPlaceElapsedMs(elapsed);
    roundTimer.pause();
    stopAudio();
    setPlacement(slotIndex);
    const someoneCanCounter = participants.some((p, i) => i !== turn && p.hooks >= 1);
    if (someoneCanCounter) {
      setPhase('counter');
    } else {
      goReveal(slotIndex, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, participants, turn, haptics, roundTimer, stopAudio]);

  // --- Phase 3: Konter ----------------------------------------------------
  const handleChooseCounter = useCallback((pid: string) => {
    void haptics.medium();
    setCounteringId(pid);
    setPhase('counterPlace');
  }, [haptics]);

  const handleCommitCounter = useCallback((slotIndex: number) => {
    if (!counteringId || placement === null) return;
    void haptics.medium();
    setParticipants((prev) => prev.map((p) => (p.id === counteringId ? { ...p, hooks: p.hooks - 1 } : p)));
    const ct: PendingCounter = { participantId: counteringId, slotIndex };
    goReveal(placement, ct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counteringId, placement, haptics]);

  const handleNoCounter = useCallback(() => {
    if (placement === null) return;
    goReveal(placement, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  // --- Phase 4: Auflösung -------------------------------------------------
  const goReveal = (slotIndex: number, ct: PendingCounter | null) => {
    if (!active || !song) return;
    const res = resolveRound(active.id, active.timeline, { slotIndex }, ct, song);

    // Erfolgreicher Konter (Konterer gewinnt die Karte): eingesetzten 🎣
    // zurückgeben (Hitster: nur fehlgeschlagene Token sind verloren).
    const counterRefund = !!(ct && res.winnerId === ct.participantId);

    setParticipants((prev) => {
      let next = prev;
      if (res.winnerId) {
        next = prev.map((p) =>
          p.id === res.winnerId
            ? {
                ...p,
                timeline: insertSorted(p.timeline, song),
                hooks: counterRefund ? Math.min(MAX_HOOKS, p.hooks + 1) : p.hooks,
              }
            : p,
        );
      } else {
        // zurück auf den Stapel (nach ganz unten)
        setDeck((d) => [song, ...d]);
      }
      return next;
    });

    setCounter(ct);
    setResolution(res);
    setPhase('reveal');
    setFlipped(false);
    // Flip nach kurzem Moment
    window.setTimeout(() => setFlipped(true), 220);
    if (res.winnerId) void haptics.success(); else void haptics.warning();
  };

  // --- Phase 5: Bonus -----------------------------------------------------
  // Speed-Bonus: innerhalb 10s platziert UND angesagt → +2 statt +1 🎣.
  const speedEligible = placeElapsedMs != null && placeElapsedMs <= SPEED_BONUS_MS && bonusClaimed;
  const handleBonus = useCallback((earned: boolean) => {
    setBonusDecided(true);
    if (earned && active) {
      const amount = speedEligible ? 2 : 1;
      void haptics.success();
      setParticipants((prev) => prev.map((p, i) =>
        i === turn ? { ...p, hooks: Math.min(MAX_HOOKS, p.hooks + amount) } : p));
      flash(speedEligible ? '⚡ Blitz-Bonus! +2 🎣' : '+1 🎣 Bonus!');
    }
  }, [active, turn, haptics, flash, speedEligible]);

  // --- Weiter / Sieg-Check ------------------------------------------------
  const handleContinue = useCallback(() => {
    const won = participants.find((p) => hasWon(p, winTarget));
    if (won) {
      setWinner(won);
      setPhase('gameOver');
      void haptics.celebrate();
      return;
    }
    const nextIdx = (turn + 1) % participants.length;
    beginTurn(participants, deck, nextIdx);
  }, [participants, winTarget, turn, deck, beginTurn, haptics]);

  // --- Stats beim Spielende -----------------------------------------------
  useEffect(() => {
    if (phase === 'gameOver' && winner && !recordedRef.current) {
      recordedRef.current = true;
      recordEnd('ohrwurm', winner.timeline.length, true);
    }
    if (phase === 'setup') recordedRef.current = false;
  }, [phase, winner, recordEnd]);

  const resetGame = useCallback(() => {
    stopAudio();
    spotifyBridgeRef.current?.disconnect().catch(() => {});
    spotifyBridgeRef.current = null;
    spotifyModeRef.current = false;
    setSpotifyStatus(null);
    setSpotifyUri(null);
    roundTimer.reset(ROUND_SECONDS);
    setListening(false);
    setPreviewUrl(null);
    setPhase('setup');
    setParticipants([]);
    setWinner(null);
    setSong(null);
  }, [stopAudio, roundTimer]);

  // Beim Verlassen des Spiels Audio stoppen + Spotify-Verbindung lösen.
  useEffect(() => () => {
    const a = audioRef.current; if (a) a.pause();
    spotifyBridgeRef.current?.disconnect().catch(() => {});
  }, []);

  // =========================================================================
  // Online sync (host-authority) + TV bridge
  // =========================================================================
  const iAmActive = !isOnline || (!!active && myId === active.id);
  // Which device makes sound: offline → this one; online → the TV if connected,
  // otherwise the active player's own phone.
  const audioDevice = !isOnline ? true : (!tvConnected && !!active && myId === active.id);

  // Authoritative timer start (host owns the 60s clock).
  const beginListening = useCallback(() => {
    if (listening) return;
    playStartedAtRef.current = Date.now();
    setListening(true);
    roundTimer.reset(ROUND_SECONDS);
    roundTimer.start();
    void haptics.medium();
  }, [listening, roundTimer, haptics]);

  // Route a player input: offline / host → run locally; remote client → send to host.
  const act = useCallback((type: string, payload: Record<string, unknown>, run: () => void) => {
    if (isOnline && !isHost) { online!.broadcast('ohrwurm-action', { type, ...payload }); return; }
    run();
  }, [isOnline, isHost, online]);

  // Press "play": start the shared clock + (only on the audio device) play sound.
  const pressPlay = useCallback(() => {
    act('listen', {}, beginListening);
    if (!audioDevice) return;
    const a = audioRef.current;
    if (!a || !previewUrl) return;
    if (a.paused) a.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
    else { a.pause(); setIsAudioPlaying(false); }
  }, [act, beginListening, audioDevice, previewUrl]);

  // Host applies actions coming from remote clients.
  const applyAction = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'toPlace': setPhase('place'); break;
      case 'toggleBonus': setBonusClaimed((v) => !v); break;
      case 'listen': beginListening(); break;
      case 'swap': handleSwap(); break;
      case 'place': handlePlace(data.slot as number); break;
      case 'chooseCounter': handleChooseCounter(data.pid as string); break;
      case 'commitCounter': handleCommitCounter(data.slot as number); break;
      case 'noCounter': handleNoCounter(); break;
      case 'bonus': handleBonus(data.earned as boolean); break;
      case 'continue': handleContinue(); break;
      default: break;
    }
  }, [beginListening, handleSwap, handlePlace, handleChooseCounter, handleCommitCounter, handleNoCounter, handleBonus, handleContinue]);

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('ohrwurm-action', (data) => applyAction(data));
  }, [online, isHost, applyAction]);

  // Host learns a TV joined the room (TV broadcasts 'tv-ready' on connect).
  useEffect(() => {
    if (!online) return;
    return online.onBroadcast('tv-ready', () => setTvConnected(true));
  }, [online]);

  // Non-host: mirror the host's clock locally for display only (host owns timeout).
  useEffect(() => {
    if (!isOnline || isHost) return;
    if (listening) { roundTimer.reset(ROUND_SECONDS); roundTimer.start(); }
    else roundTimer.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isHost, listening]);

  // Host → FULL authoritative snapshot, ONLY on real game-state changes.
  // (Deliberately NOT depending on roundTimer.timeLeft: re-sending the whole
  // snapshot every second would spam ~60 msgs/round and trigger a re-render
  // storm on every client. The live countdown rides in tv-state below.)
  useEffect(() => {
    if (!online || !isHost) return;
    const snapshot = {
      phase, participants, turn, song, placement, counter, counteringId, resolution,
      flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre, winner,
      previewUrl, spotifyUri, listening, placeElapsedMs, tvConnected,
    };
    online.broadcast('ohrwurm-state', { snapshot: JSON.parse(JSON.stringify(snapshot)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, isHost, phase, participants, turn, song, placement, counter, counteringId, resolution, flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre, winner, previewUrl, spotifyUri, listening, placeElapsedMs, tvConnected]);

  // Host → TV state (spoiler-free). Carries the live countdown, so it updates
  // per second — but ONLY the TV consumes it, so no client re-render storm.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', {
      game: 'ohrwurm',
      phase,
      players: participants.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.timeline.length, hooks: p.hooks })),
      activeId: active?.id ?? null,
      activeName: active?.name ?? '',
      timeline: active ? active.timeline.map((s) => ({ id: s.id, year: s.year })) : [],
      listening,
      timeLeft: roundTimer.timeLeft,
      totalTime: ROUND_SECONDS,
      winTarget,
      previewUrl, // TV is the speaker — title stays hidden until reveal
      reveal: phase === 'reveal' && song ? { year: song.year, title: song.title, artist: song.artist, flag: song.flag, genre: song.genre } : null,
      winnerName: winner?.name ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, isHost, phase, participants, listening, roundTimer.timeLeft, previewUrl, song, winner]);

  // Non-host → apply incoming snapshots.
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('ohrwurm-state', (data) => {
      const s = (data as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      setParticipants(s.participants as Participant[]);
      setTurn(s.turn as number);
      setSong(s.song as Song | null);
      setPlacement(s.placement as number | null);
      setCounter(s.counter as PendingCounter | null);
      setCounteringId(s.counteringId as string | null);
      setResolution(s.resolution as RoundResolution | null);
      setFlipped(s.flipped as boolean);
      setSwapUsed(s.swapUsed as boolean);
      setBonusClaimed(s.bonusClaimed as boolean);
      setBonusDecided(s.bonusDecided as boolean);
      setWinTarget(s.winTarget as number);
      setGenre(s.genre as string | null);
      setWinner(s.winner as Participant | null);
      setPreviewUrl(s.previewUrl as string | null);
      setSpotifyUri(s.spotifyUri as string | null);
      setListening(s.listening as boolean);
      setPlaceElapsedMs(s.placeElapsedMs as number | null);
      setTvConnected(s.tvConnected as boolean);
    });
  }, [online, isHost]);

  // Offline TV bridge (party mode / TV-room channel). Online TV uses the
  // 'tv-state' broadcast above on the game-room channel.
  useTVGameBridge('ohrwurm', {
    phase,
    players: participants.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.timeline.length, hooks: p.hooks })),
    activeId: active?.id ?? null,
    activeName: active?.name ?? '',
    timeline: active ? active.timeline.map((s) => ({ id: s.id, year: s.year })) : [],
    listening,
    timeLeft: roundTimer.timeLeft,
    totalTime: ROUND_SECONDS,
    winTarget,
    previewUrl,
    reveal: phase === 'reveal' && song ? { year: song.year, title: song.title, artist: song.artist, flag: song.flag, genre: song.genre } : null,
    winnerName: winner?.name ?? null,
  }, [phase, turn, listening, roundTimer.timeLeft, participants]);

  // =========================================================================
  // Render
  // =========================================================================
  if (phase === 'setup') {
    if (isOnline && !isHost) {
      return <OhrwurmWaiting roomCode={online!.roomCode} />;
    }
    const onlineRoster: SetupPlayer[] | undefined = isOnline
      ? online!.players.map((p, i) => ({
          id: p.id,
          name: p.name,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
          avatar: (p.name?.trim().slice(0, 1) || '?').toUpperCase(),
        }))
      : undefined;
    return <OhrwurmSetup onStart={handleStart} haptics={haptics} initialPlayers={onlineRoster} lockRoster={isOnline} />;
  }

  // Bonus-Bestätigung nur, wenn vorab angesagt UND die Karte gewonnen wurde.
  const bonusOpen = phase === 'reveal' && !!resolution?.bonusEligible && bonusClaimed && !bonusDecided;
  // Angesagt, aber Karte nicht gewonnen → Bonus verfällt (Hinweis).
  const bonusForfeited = phase === 'reveal' && bonusClaimed && !resolution?.bonusEligible;

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col font-game"
      style={{ background: OW.bg, color: OW.text }}
    >
      <style>{OW_STYLE}</style>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(255,46,136,0.12)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/games')} className="p-2 -ml-2" style={{ color: OW.dim }} aria-label="Zurück">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
          <span className="text-sm font-black tracking-[0.2em] uppercase ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</span>
        </div>
        <div className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: OW.surface, color: OW.accent }}>
          Ziel {winTarget}
        </div>
      </div>

      {/* Spotify-Status (sichtbar im Premium-Modus). Autorisierung ist schnell —
          ok = Premium aktiv (Like/Playlist + Volle-Länge-Link nach dem Reveal),
          preview = 30s-Vorschau mit Grund. Kein Connect-Button mehr. */}
      {spotifyStatus && (() => {
        const ok = spotifyStatus === 'ok';
        const connecting = spotifyStatus === 'connecting';
        const reason = spotifyStatus.startsWith('preview:') ? spotifyStatus.slice('preview:'.length) : '';
        return (
          <div className="relative z-10 px-4 py-1.5 text-[11px] font-bold flex items-center justify-center gap-2 flex-wrap"
            style={
              ok
                ? { background: 'rgba(29,185,84,0.14)', color: '#1DB954' }
                : connecting
                  ? { background: 'rgba(255,210,63,0.12)', color: OW.accent }
                  : { background: 'rgba(255,46,136,0.12)', color: OW.primary }
            }>
            <span className="flex items-center gap-1.5">
              {ok
                ? '✓ Spotify · voller Song nach Auflösung (im Spiel: Vorschau)'
                : connecting
                  ? '⏳ Spotify…'
                  : '⚠ Spotify: ' + (reason || 'nicht verfügbar') + ' — nur Vorschau'}
            </span>
          </div>
        );
      })()}

      {/* Scoreboard */}
      <Scoreboard participants={participants} activeId={active?.id} winTarget={winTarget} />

      {/* Verborgener Audio-Player (30s-Vorschau) — kein Titel/Interpret sichtbar */}
      <audio
        ref={audioRef}
        src={previewUrl ?? undefined}
        preload="none"
        loop
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
        onEnded={() => setIsAudioPlaying(false)}
        className="hidden"
        aria-hidden="true"
      />

      {/* Phase content */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-6">
        {/* Online: block input on devices that aren't the acting player right now. */}
        {isOnline && (() => {
          const canInteract = phase === 'counter'
            ? true // every player decides about countering from their own row
            : phase === 'counterPlace'
              ? myId === counteringId
              : (phase === 'draw' || phase === 'place' || phase === 'reveal')
                ? iAmActive
                : true;
          if (canInteract) return null;
          return (
            <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(22,16,31,0.55)', backdropFilter: 'blur(1px)' }}>
              <div className="px-5 py-3 rounded-2xl text-center" style={{ background: OW.surface, border: `1px solid ${OW.primary}` }}>
                <p className="text-sm font-bold" style={{ color: OW.text }}>{active ? `${active.name} ist dran…` : 'Warten…'}</p>
                <p className="text-[11px] mt-0.5" style={{ color: OW.dim }}>{tvConnected ? 'Schau auf den TV' : 'Gleich bist du dran'}</p>
              </div>
            </div>
          );
        })()}
        <AnimatePresence mode="wait">
          {/* ---- DRAW: verborgen in der App anhören (30s) + 60s-Timer ---- */}
          {phase === 'draw' && song && active && (
            <motion.div key="draw" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
              <PhaseBanner
                tone="primary"
                kicker={`${active.name} ist dran`}
                title="Anhören & einordnen"
                sub="Song läuft verborgen — 60s Zeit. In den ersten 10s + Titel & Interpret = Speed-Bonus."
              />

              {(previewLoading || previewUrl || spotifyUri) ? (
                <MysteryPlayer
                  loading={previewLoading && !spotifyUri}
                  hasPreview={!!previewUrl || !!spotifyUri}
                  isPlaying={isAudioPlaying}
                  started={listening}
                  timeLeft={roundTimer.timeLeft}
                  total={ROUND_SECONDS}
                  speedActive={listening && (ROUND_SECONDS - roundTimer.timeLeft) < 10}
                  onPlay={pressPlay}
                />
              ) : (
                /* Fallback: kein Clip & keine Spotify-URI → manueller Start, KEIN QR
                   (QR würde beim Raten den Titel verraten — gibt es erst im Reveal). */
                <div className="flex flex-col items-center gap-4 text-center">
                  {!listening ? (
                    <>
                      <p className="text-sm max-w-xs" style={{ color: OW.dim }}>
                        Kein Hörclip verfügbar — Jahr schätzen oder Karte tauschen.
                      </p>
                      <button onClick={() => act('listen', {}, beginListening)}
                        className="px-6 h-12 rounded-2xl font-black flex items-center gap-2"
                        style={{ background: OW.primary, color: OW.bg }}>
                        60s starten
                      </button>
                    </>
                  ) : (
                    <div className="font-mono font-black text-3xl tabular-nums"
                      style={{ color: roundTimer.timeLeft <= 10 ? '#ff5d73' : OW.text }}>
                      {roundTimer.timeLeft}s
                    </div>
                  )}
                </div>
              )}

              {/* Aktionen erst nach Start sichtbar */}
              {listening && (
                <div className="flex flex-col gap-3 w-full max-w-sm">
                  {/* Sekundär-Aktionen — filigrane Chips, OBERHALB des Primär-Buttons */}
                  <div role="group" aria-label="Aktionen" className="flex items-stretch gap-2 w-full">
                    <ActionChip
                      icon={RotateCcw} label="Nochmal"
                      ariaLabel="Song noch einmal von vorn hören"
                      onClick={replayAudio}
                    />
                    <ActionChip
                      icon={Sparkles} label={bonusClaimed ? 'Bonus ✓' : 'Bonus'} tone="accent" toggle active={bonusClaimed}
                      ariaLabel="Titel und Interpret ansagen für Bonus"
                      onClick={() => { void haptics.select(); act('toggleBonus', {}, () => setBonusClaimed((v) => !v)); }}
                    />
                    <ActionChip
                      icon={Repeat} label={swapUsed ? 'Getauscht' : 'Tauschen'} tone="secondary"
                      cost={swapUsed ? undefined : '1 🎣'}
                      disabled={swapUsed || active.hooks < 1}
                      ariaLabel={swapUsed ? 'Tausch bereits genutzt' : active.hooks < 1 ? 'Tauschen nicht möglich — kein 🎣 übrig' : 'Song unbekannt — Karte tauschen für 1 🎣'}
                      onClick={() => {
                        if (swapUsed) { flash('Tausch verbraucht'); return; }
                        if (active.hooks < 1) { flash('Kein 🎣 — kannst nicht tauschen'); return; }
                        act('swap', {}, handleSwap);
                      }}
                    />
                  </div>
                  {/* Ein großer Primär-Button */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { void haptics.light(); act('toPlace', {}, () => setPhase('place')); }}
                    className="w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                    style={{ background: OW.primary, color: OW.bg, boxShadow: `0 10px 30px ${OW.primary}40` }}>
                    In Timeline einordnen <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- PLACE: aktive Person ordnet ein ---- */}
          {phase === 'place' && song && active && (
            <motion.div key="place" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="accent" kicker={`${active.name}s Timeline`} title="Wohin gehört der Song?"
                sub="Tippe die Lücke, in der das Erscheinungsjahr liegt." />
              <div className="flex items-center justify-center gap-3">
                <MysteryChip />
                {listening && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono font-black"
                    style={{
                      background: OW.surface,
                      color: roundTimer.timeLeft <= 10 ? '#ff5d73' : (ROUND_SECONDS - roundTimer.timeLeft) < 10 ? OW.accent : OW.text,
                    }}>
                    {roundTimer.timeLeft}s
                    {(ROUND_SECONDS - roundTimer.timeLeft) < 10 && <Zap className="w-3.5 h-3.5" style={{ color: OW.accent }} />}
                  </div>
                )}
              </div>
              <TimelinePlacer timeline={active.timeline} onSelect={(slot) => act('place', { slot }, () => handlePlace(slot))} accent={active.color} />
            </motion.div>
          )}

          {/* ---- COUNTER: Konter-Fenster ---- */}
          {phase === 'counter' && active && (
            <motion.div key="counter" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="secondary" kicker="Konter-Fenster" title="Wer will kontern?"
                sub={`${active.name} hat platziert. Mit 1 🎣 kannst du anfechten und die Karte ggf. klauen.`} />
              <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
                {participants.map((p, i) => {
                  if (i === turn) return null;
                  // Online: you can only counter as yourself.
                  const mine = !isOnline || p.id === myId;
                  const canCounter = p.hooks >= 1 && mine;
                  return (
                    <button key={p.id} onClick={() => canCounter && act('chooseCounter', { pid: p.id }, () => handleChooseCounter(p.id))} disabled={!canCounter}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all disabled:opacity-35"
                      style={{ background: OW.surface, border: `1px solid ${canCounter ? p.color : 'transparent'}` }}>
                      <Avatar p={p} />
                      <span className="flex-1 font-bold">{p.name}</span>
                      <span className="text-sm font-mono" style={{ color: OW.secondary }}>{p.hooks} 🎣</span>
                      {canCounter && <Fish className="w-4 h-4" style={{ color: OW.secondary }} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => act('noCounter', {}, handleNoCounter)}
                className="mx-auto mt-2 px-8 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>
                Niemand kontert — auflösen
              </button>
            </motion.div>
          )}

          {/* ---- COUNTER PLACE ---- */}
          {phase === 'counterPlace' && active && counteringId && (
            <motion.div key="cplace" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="secondary"
                kicker={`${participants.find((p) => p.id === counteringId)?.name} kontert`}
                title="Karte neu platzieren"
                sub={`In ${active.name}s Timeline — wo gehört der Song wirklich hin?`} />
              <MysteryChip />
              <TimelinePlacer timeline={active.timeline} onSelect={(slot) => act('commitCounter', { slot }, () => handleCommitCounter(slot))}
                accent={participants.find((p) => p.id === counteringId)?.color ?? OW.secondary} />
            </motion.div>
          )}

          {/* ---- REVEAL ---- */}
          {phase === 'reveal' && song && active && resolution && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
              <RevealCard song={song} flipped={flipped} />
              <ResolutionSummary
                resolution={resolution} active={active} counter={counter} participants={participants}
              />
              {/* Aktionen NACH der Auflösung — filigrane Chip-Leiste über „Weiter".
                  QR immer; „Volle Länge" öffnet den Track DIREKT in Spotify (Deep-Link),
                  sobald eine URI vorliegt; Like/Playlist nur bei autorisierter Bridge. */}
              <div role="group" aria-label="Aktionen" className="flex items-stretch gap-2 w-full max-w-sm">
                {spotifyUri && (
                  <ActionChip
                    icon={ExternalLink} label="Volle Länge" tone="spotify"
                    ariaLabel="Ganzen Song direkt in Spotify öffnen"
                    onClick={() => {
                      void haptics.light();
                      const deep = spotifyTrackDeepLink(spotifyUri);
                      const web = spotifyTrackUrl(spotifyUri);
                      window.open(deep || web, '_system');
                    }}
                  />
                )}
                {spotifyBridgeRef.current && spotifyUri && (
                  <>
                  <ActionChip
                    icon={Heart} label="Like" busy={likeBusy}
                    ariaLabel="Song zu Lieblingssongs hinzufügen"
                    onClick={() => {
                      if (likeBusy) return;
                      void haptics.light(); setLikeBusy(true);
                      // Promise.resolve fängt den Fall ab, dass die Methode fehlt
                      // (?. → undefined) — sonst würde .then werfen und busy hängenbleiben.
                      Promise.resolve(spotifyBridgeRef.current?.saveTrack?.(spotifyUri))
                        .then((r) => flash(r?.ok ? '❤️ Zu Lieblingssongs' : 'Like fehlgeschlagen' + (r ? ' (' + r.detail + ')' : '')))
                        .catch(() => flash('Like fehlgeschlagen'))
                        .finally(() => setLikeBusy(false));
                    }}
                  />
                  <ActionChip
                    icon={Plus} label="Playlist" tone="spotify" busy={playlistBusy}
                    ariaLabel="Song zur OHRWURM-Playlist hinzufügen"
                    onClick={() => {
                      if (playlistBusy) return;
                      void haptics.light(); setPlaylistBusy(true);
                      Promise.resolve(spotifyBridgeRef.current?.addToPlaylist?.(spotifyUri))
                        .then((r) => flash(r?.ok ? '🎵 In OHRWURM-Playlist' : 'Playlist fehlgeschlagen' + (r ? ' (' + r.detail + ')' : '')))
                        .catch(() => flash('Playlist fehlgeschlagen'))
                        .finally(() => setPlaylistBusy(false));
                    }}
                  />
                  </>
                )}
                <ActionChip
                  icon={QrCode} label="QR-Code"
                  ariaLabel="QR-Code zum Scannen anzeigen"
                  onClick={() => { void haptics.light(); setQrOpen(true); }}
                />
              </div>
              {bonusOpen ? (
                <div className="w-full max-w-sm rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: OW.surface, border: `1px solid ${OW.accent}`, boxShadow: speedEligible ? `0 0 26px ${OW.accent}55` : 'none' }}>
                  <p className="text-sm font-bold text-center" style={{ color: OW.accent }}>
                    {speedEligible ? <Zap className="inline w-4 h-4 mr-1" fill={OW.accent} /> : <Sparkles className="inline w-4 h-4 mr-1" />}
                    {speedEligible && <span className="font-black">BLITZ! </span>}
                    Hat {active.name} Titel <span className="opacity-70">&</span> Interpret richtig angesagt?
                  </p>
                  <p className="text-[11px] text-center -mt-1" style={{ color: OW.dim }}>
                    {speedEligible
                      ? 'Innerhalb 10s platziert — beides korrekt = +2 🎣 Speed-Bonus!'
                      : 'Auflösung steht oben — die Gruppe bestätigt. Beides korrekt = +1 🎣 Bonus.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => act('bonus', { earned: true }, () => handleBonus(true))} className="flex-1 h-12 rounded-xl font-black" style={{ background: OW.accent, color: OW.bg }}>
                      Ja · +{speedEligible ? 2 : 1} 🎣
                    </button>
                    <button onClick={() => act('bonus', { earned: false }, () => handleBonus(false))} className="flex-1 h-12 rounded-xl font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>Nein</button>
                  </div>
                </div>
              ) : (
                <>
                  {bonusForfeited && (
                    <p className="text-[11px] text-center -mt-2" style={{ color: OW.dim }}>
                      Bonus verfällt — Karte nicht gewonnen.
                    </p>
                  )}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => act('continue', {}, handleContinue)}
                    className="w-full max-w-sm h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                    style={{ background: OW.primary, color: OW.bg, boxShadow: `0 10px 30px ${OW.primary}40` }}>
                    Weiter <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {/* ---- GAME OVER ---- */}
          {phase === 'gameOver' && winner && (
            <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-5 py-8 max-w-lg mx-auto w-full">
              <Confetti fire particles={120} />
              <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(255,210,63,0.12)', border: `1px solid ${OW.accent}` }}>
                  <Trophy className="w-8 h-8" style={{ color: OW.accent }} />
                </div>
              </motion.div>
              <h2 className="text-3xl font-black ow-glow-pink" style={{ color: OW.primary }}>Spielende!</h2>
              <div className="text-lg font-bold" style={{ color: OW.secondary }}>{winner.name} gewinnt mit {winner.timeline.length} Hits! 🎉</div>
              <div className="w-full space-y-2">
                {[...participants].sort((a, b) => b.timeline.length - a.timeline.length).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: OW.surface }}>
                    <span className="text-sm font-bold w-5" style={{ color: OW.dim }}>#{i + 1}</span>
                    <Avatar p={p} />
                    <span className="flex-1 font-semibold truncate">{p.name}</span>
                    <span className="font-bold" style={{ color: OW.secondary }}>{p.timeline.length} Hits</span>
                    <span className="text-sm font-mono" style={{ color: OW.accent }}>{p.hooks} 🎣</span>
                  </div>
                ))}
              </div>
              <div className="w-full space-y-3 mt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl h-14 font-black"
                  style={{ background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg }}>
                  <RotateCcw className="w-4 h-4" /> Nochmal
                </motion.button>
                <button onClick={() => navigate('/games')} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ border: '1px solid rgba(255,255,255,0.1)', color: OW.dim }}>
                  Anderes Spiel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl"
            style={{ background: OW.elevated, color: OW.text, border: `1px solid ${OW.secondary}` }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR-Overlay — immer per QR-Chip erreichbar (zum Scannen/Abspielen auf Spotify) */}
      <AnimatePresence>
        {qrOpen && song && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
            onClick={() => setQrOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-4"
            >
              <QrCard song={song} />
              <button
                onClick={() => setQrOpen(false)}
                className="px-6 py-2.5 rounded-full text-sm font-bold"
                style={{ background: OW.surface, color: OW.text, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Schließen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Sub-Komponenten
// ===========================================================================

function Avatar({ p, size = 32 }: { p: Pick<Participant, 'color' | 'avatar' | 'type'>; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-black text-white shrink-0 relative"
      style={{ width: size, height: size, background: p.color, fontSize: size * 0.42 }}>
      {p.avatar}
      {p.type === 'group' && (
        <Users className="absolute -bottom-1 -right-1 w-3 h-3 p-[1px] rounded-full" style={{ background: OW.bg, color: p.color }} />
      )}
    </div>
  );
}

function Scoreboard({ participants, activeId, winTarget }: { participants: Participant[]; activeId?: string; winTarget: number }) {
  return (
    <div className="relative z-10 flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {participants.map((p) => {
        const isActive = p.id === activeId;
        return (
          <div key={p.id}
            className="shrink-0 flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-all"
            style={{
              background: OW.surface,
              border: `1.5px solid ${isActive ? p.color : 'transparent'}`,
              boxShadow: isActive ? `0 0 18px ${p.color}40` : 'none',
            }}>
            <Avatar p={p} size={30} />
            <div className="leading-tight">
              <div className="text-xs font-bold max-w-[88px] truncate">{p.name}</div>
              <div className="text-[11px] font-mono" style={{ color: OW.dim }}>
                <span style={{ color: OW.secondary }}>{p.timeline.length}</span>/{winTarget} · {p.hooks} 🎣
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhaseBanner({ tone, kicker, title, sub }: { tone: 'primary' | 'secondary' | 'accent'; kicker: string; title: string; sub: string }) {
  const color = tone === 'primary' ? OW.primary : tone === 'secondary' ? OW.secondary : OW.accent;
  return (
    <div className="text-center max-w-md mx-auto">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-1.5" style={{ color }}>{kicker}</p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{title}</h2>
      <p className="text-sm" style={{ color: OW.dim }}>{sub}</p>
    </div>
  );
}

// Filigraner Sekundär-Aktions-Chip (Icon über Mini-Label). Visuell zurückgenommen,
// aber Tap-Target ≥ 52px. Genau EIN großer Primär-Button pro Screen; alles Weitere
// landet in einer Chip-Leiste oberhalb davon.
type ChipTone = 'default' | 'accent' | 'secondary' | 'spotify';

function chipToneStyle(tone: ChipTone, active: boolean): React.CSSProperties {
  if (active) {
    return {
      background: `${OW.accent}1f`, color: OW.accent, border: `1.5px solid ${OW.accent}`,
      boxShadow: `0 0 18px ${OW.accent}40, inset 0 1px 0 ${OW.accent}22`,
    };
  }
  switch (tone) {
    case 'secondary':
      return { background: 'rgba(38,224,196,0.10)', color: OW.secondary, border: '1.5px solid rgba(38,224,196,0.28)' };
    case 'spotify':
      return { background: 'rgba(29,185,84,0.14)', color: '#1DB954', border: '1.5px solid rgba(29,185,84,0.40)' };
    default:
      return { background: OW.surface, color: OW.dim, border: '1.5px solid transparent' };
  }
}

function ActionChip({
  icon: Icon, label, tone = 'default', toggle = false, active = false, busy = false, cost, disabled = false, onClick, ariaLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: ChipTone;
  /** Ist der Chip ein An/Aus-Schalter? Steuert aria-pressed (entkoppelt vom Ton). */
  toggle?: boolean;
  active?: boolean;
  busy?: boolean;
  cost?: string;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={toggle ? active : undefined}
      aria-disabled={disabled || undefined}
      aria-busy={busy || undefined}
      aria-label={ariaLabel ?? label}
      className={cn(
        'ow-chip relative flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl min-h-[52px] px-2 py-2',
        'font-bold transition-[background,border-color,box-shadow,opacity,color] duration-200',
        disabled && 'opacity-30',
      )}
      style={chipToneStyle(tone, active)}
    >
      {busy ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Icon className="w-[18px] h-[18px]" />}
      <span className="text-[10px] font-bold leading-none tracking-[0.04em] whitespace-nowrap">{label}</span>
      {cost && (
        <span
          className="absolute top-0.5 right-1 text-[9px] font-mono font-black leading-none px-1 py-0.5 rounded-full"
          style={{ background: OW.bg, color: tone === 'secondary' ? OW.secondary : OW.dim }}
        >
          {cost}
        </span>
      )}
    </motion.button>
  );
}

/** Mystery-Chip — repräsentiert die unbekannte (noch nicht aufgedeckte) Karte. */
function MysteryChip() {
  return (
    <div className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: OW.surface, border: `1px dashed ${OW.primary}` }}>
      <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
      <span className="font-black text-lg" style={{ color: OW.primary }}>?</span>
      <span className="text-xs font-bold" style={{ color: OW.dim }}>Jahr unbekannt</span>
    </div>
  );
}

/** Vorderseite der Karte: QR-Code + Logo (Spec §2.2). */
function QrCard({ song }: { song: Song }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-[20px] blur-2xl opacity-40" style={{ background: OW.primary }} />
      <div className="relative w-[230px] rounded-[20px] p-5 flex flex-col items-center gap-4"
        style={{ background: OW.elevated, boxShadow: '0 18px 50px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5" style={{ color: OW.primary }} />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: OW.dim }}>OHRWURM</span>
        </div>
        <div className="bg-white p-3 rounded-2xl">
          <QRCodeSVG value={song.qrPayload} size={158} level="M" fgColor="#16101f" bgColor="#ffffff" />
        </div>
        <a href={song.qrPayload} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: OW.secondary }}>
          <ExternalLink className="w-3.5 h-3.5" /> Auf Spotify öffnen
        </a>
      </div>
    </div>
  );
}

/** Auflösungs-Karte: Jahr groß + Titel + Künstler + Flagge (Spec §2.2). */
function RevealCard({ song, flipped }: { song: Song; flipped: boolean }) {
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.7, ease: [0.4, 0.7, 0.3, 1.1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-[230px] h-[300px]"
      >
        {/* Rückseite (sichtbar nach Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-3"
          style={{ background: `linear-gradient(160deg, ${OW.elevated}, ${OW.surface})`, border: `1px solid ${OW.primary}`, boxShadow: '0 18px 50px rgba(0,0,0,.5)' }}>
          <span className="text-[11px] font-black tracking-[0.25em] uppercase" style={{ color: OW.dim }}>Erscheinungsjahr</span>
          <span className="text-6xl font-black ow-glow-pink leading-none" style={{ color: OW.primary }}>{song.year}</span>
          <div className="mt-2">
            <h3 className="text-xl font-black leading-tight">{song.title}</h3>
            <p className="text-sm font-semibold mt-1" style={{ color: OW.dim }}>
              {song.artist} <span className="ml-1">{song.flag}</span>
            </p>
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: OW.bg, color: OW.accent }}>{song.genre}</span>
        </div>
        {/* Vorderseite (QR-Platzhalter, sichtbar vor Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] flex items-center justify-center"
          style={{ background: OW.elevated, border: '1px solid rgba(255,255,255,0.06)', transform: 'rotateY(180deg)' }}>
          <Music2 className="w-12 h-12" style={{ color: OW.primary }} />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Era-Farbe: bildet das Jahr auf ein chronologisches Spektrum ab — alt = kühl
 * (Teal) → Gold → neu = warm (Pink), exakt die Marken-Trias in zeitlicher
 * Reihenfolge. So liest sich der Zeitstrahl als Verlauf der Jahrzehnte.
 */
function eraColor(year: number): string {
  const t = Math.max(0, Math.min(1, (year - 1955) / 70)); // 1955..2025
  const hue = t < 0.5
    ? 174 + (46 - 174) * (t / 0.5)                 // Teal → Gold
    : (46 - 76 * ((t - 0.5) / 0.5) + 360) % 360;   // Gold → Pink
  return `hsl(${hue.toFixed(0)} 85% 62%)`;
}

/**
 * Horizontale Timeline mit antippbaren Slots — als leuchtender Zeitstrahl:
 * durchscheinender Glow-Thread, Era-Farbspektrum, gestaffelt einfliegende
 * Premium-Karten und magnetische Drop-Zonen. `prefers-reduced-motion`-aware.
 */
function TimelinePlacer({ timeline, onSelect, accent }: { timeline: Song[]; onSelect: (slot: number) => void; accent: string }) {
  const reduce = useReducedMotion();

  const itemVar = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.92 },
    show: (i: number) => reduce
      ? { opacity: 1, transition: { delay: i * 0.03 } }
      : { opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 320, damping: 26 } },
  };

  let pos = 0;

  const slot = (i: number, label: string) => (
    <motion.button key={`slot-${i}`} onClick={() => onSelect(i)}
      custom={pos++} variants={itemVar}
      whileHover={reduce ? undefined : { scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.9 }}
      className="relative z-10 shrink-0 w-[60px] h-[136px] rounded-2xl flex flex-col items-center justify-center gap-2 snap-center"
      style={{
        background: `linear-gradient(180deg, ${accent}1f, ${accent}05)`,
        border: `2px dashed ${accent}`,
        backdropFilter: 'blur(2px)',
      }}>
      <motion.span className="grid place-items-center w-9 h-9 rounded-full"
        style={{ background: `${accent}26`, border: `1px solid ${accent}66` }}
        animate={reduce ? undefined : { boxShadow: [`0 0 0px ${accent}00`, `0 0 16px ${accent}cc`, `0 0 0px ${accent}00`] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <Plus className="w-5 h-5" style={{ color: accent }} />
      </motion.span>
      <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight text-center px-1" style={{ color: OW.dim }}>{label}</span>
    </motion.button>
  );

  const card = (s: Song) => {
    const c = eraColor(s.year);
    return (
      <motion.div key={s.id}
        custom={pos++} variants={itemVar}
        whileHover={reduce ? undefined : { y: -8, scale: 1.04 }}
        transition={reduce ? undefined : { type: 'spring', stiffness: 400, damping: 24 }}
        className="relative z-10 shrink-0 w-[108px] h-[136px] rounded-2xl p-3 flex flex-col justify-between overflow-hidden snap-center"
        style={{
          background: 'linear-gradient(165deg, #2b2046 0%, #1b1430 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 10px 26px -14px ${c}`,
        }}>
        {/* Era-Leiste oben */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
        {/* weicher Era-Glow */}
        <div aria-hidden className="absolute -top-7 -right-7 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ background: c, opacity: 0.2 }} />
        {/* Jahr als Neon-Text */}
        <span className="relative text-[27px] leading-none font-black tabular-nums"
          style={{ color: c, textShadow: `0 0 18px ${c}66` }}>{s.year}</span>
        {/* Titel + Interpret */}
        <div className="relative leading-tight">
          <div className="text-[11px] font-bold line-clamp-2 text-white">{s.title}</div>
          <div className="text-[10px] truncate flex items-center gap-1.5" style={{ color: OW.dim }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
            <span className="truncate">{s.artist} {s.flag}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const items: React.ReactNode[] = [];
  items.push(slot(0, timeline.length ? 'früher' : 'hier'));
  timeline.forEach((s, i) => {
    items.push(card(s));
    const isLast = i === timeline.length - 1;
    items.push(slot(i + 1, isLast ? 'später' : 'dazwischen'));
  });

  return (
    <div className="overflow-x-auto pb-3 no-scrollbar">
      <motion.div
        className="relative flex gap-3 items-center px-1 w-max min-w-full snap-x"
        initial="hidden" animate="show">
        {/* durchscheinender Glow-Thread (Karten decken ihn, Slots lassen ihn durchglühen) */}
        <div aria-hidden className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-[3px] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #26E0C4aa 15%, #FFD23Faa 50%, #FF2E88aa 85%, transparent)' }} />
        {items}
      </motion.div>
    </div>
  );
}

/** Textuelle Zusammenfassung der Auflösung. */
function ResolutionSummary({ resolution, active, counter, participants }: {
  resolution: RoundResolution; active: Participant; counter: PendingCounter | null; participants: Participant[];
}) {
  const winnerName = resolution.winnerId
    ? participants.find((p) => p.id === resolution.winnerId)?.name ?? '—'
    : null;
  const counterName = counter ? participants.find((p) => p.id === counter.participantId)?.name : null;

  let headline: string;
  let tone: string;
  if (!resolution.winnerId) {
    headline = 'Daneben — Karte zurück auf den Stapel ✗';
    tone = OW.primary;
  } else if (resolution.winnerId === active.id) {
    headline = counter && !resolution.activeCorrect
      ? `${active.name} behält die Karte ✓`
      : `${active.name} lag richtig ✓`;
    tone = OW.secondary;
  } else {
    headline = `${winnerName} kontert erfolgreich — klaut die Karte und bekommt den 🎣 zurück`;
    tone = OW.secondary;
  }

  return (
    <div className="w-full max-w-sm rounded-2xl px-4 py-3 text-center" style={{ background: OW.surface }}>
      <p className="font-black" style={{ color: tone }}>{headline}</p>
      <div className="mt-1.5 flex items-center justify-center gap-3 text-xs" style={{ color: OW.dim }}>
        <span>{active.name}: {resolution.activeCorrect ? 'richtig' : 'falsch'}</span>
        {counter && counterName && (
          <span>· {counterName}: {resolution.counterCorrect ? 'richtig' : 'falsch'}</span>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Setup-Screen
// ===========================================================================
interface SetupProps {
  onStart: (cfg: OhrwurmConfig, players: SetupPlayer[]) => void;
  haptics: ReturnType<typeof useHaptics>;
  /** Online mode: seed the roster from the room and lock it. */
  initialPlayers?: SetupPlayer[];
  lockRoster?: boolean;
}

function OhrwurmSetup({ onStart, haptics, initialPlayers, lockRoster = false }: SetupProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const [winTarget, setWinTarget] = useState(10);
  const [genre, setGenre] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackMode>('preview');
  const [players, setPlayers] = useState<SetupPlayer[]>(
    initialPlayers && initialPlayers.length >= 2
      ? initialPlayers
      : [
          { id: 'p-1', name: 'Du', color: PLAYER_COLORS[0], avatar: 'D' },
          { id: 'p-2', name: 'Spieler 2', color: PLAYER_COLORS[1], avatar: '2' },
        ],
  );
  // Tastatur-Sichtbarkeit (Native): fixe Start-CTA ausblenden, damit das
  // fokussierte Namensfeld nicht verdeckt wird — gleicher Event wie NativeShell.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const h = (e: Event) => setKeyboardVisible(!!(e as CustomEvent).detail?.visible);
    window.addEventListener('capacitor:keyboard', h);
    return () => window.removeEventListener('capacitor:keyboard', h);
  }, []);

  const MIN = 2, MAX = 4; // Spec §2.1: 2–4 Teilnehmer
  const addPlayer = () => {
    if (players.length >= MAX) return;
    const idx = players.length;
    void haptics.select();
    const id = `p-${idx + 1}-${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name: `${mode === 'group' ? 'Gruppe' : 'Spieler'} ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: String(idx + 1) }]);
  };
  const removePlayer = (id: string) => setPlayers((prev) => (prev.length > MIN ? prev.filter((p) => p.id !== id) : prev));
  const renamePlayer = (id: string, name: string) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p)));

  const importNames = (names: string[]) => {
    setPlayers((prev) => {
      const kept = prev.filter((p) => p.name.trim() && !/^(Spieler|Gruppe) \d+$/.test(p.name.trim()) && p.name.trim() !== 'Du');
      const merged = [...kept];
      for (const n of names) {
        if (merged.length >= MAX) break;
        const idx = merged.length;
        merged.push({ id: `imp-${idx}-${n}`, name: n, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: (n.trim().slice(0, 1) || '?').toUpperCase() });
      }
      while (merged.length < MIN) {
        const idx = merged.length;
        merged.push({ id: `p-${idx + 1}`, name: `Spieler ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: String(idx + 1) });
      }
      return merged;
    });
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const start = () => {
    if (!canStart) return;
    void haptics.celebrate();
    onStart({ mode, winTarget, genre, playback }, players);
  };

  const TARGETS = [
    { v: 6, label: 'Schnell', desc: '6 Hits' },
    { v: 10, label: 'Klassik', desc: '10 Hits' },
    { v: 15, label: 'Marathon', desc: '15 Hits' },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden pb-40 font-game" style={{ background: OW.bg, color: OW.text }}>
      <style>{OW_STYLE}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[110px]" style={{ background: 'rgba(255,46,136,0.14)' }} />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full blur-[120px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/games')} className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: OW.dim }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
        </button>

        {/* Hero */}
        <section className="mb-9">
          <p className="font-black tracking-[0.25em] text-[11px] uppercase mb-2" style={{ color: OW.secondary }}>Musik-Quiz</p>
          <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-3 ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</h1>
          <p className="text-sm max-w-[320px]" style={{ color: OW.dim }}>
            QR scannen, Song hören, ins richtige Jahr einordnen. Wer zuerst {winTarget} Hits sammelt, gewinnt. 🎣 sind deine Joker.
          </p>
        </section>

        {/* Teilnehmer — einheitlicher Spieler-Block, IMMER ganz oben (1. Sektion) */}
        <section className="mb-8">
          <PlayerSetup
            players={players}
            onAdd={lockRoster ? () => {} : addPlayer}
            onRemove={lockRoster ? () => {} : removePlayer}
            onRename={lockRoster ? () => {} : renamePlayer}
            onImportNames={lockRoster ? undefined : importNames}
            min={lockRoster ? players.length : MIN}
            max={lockRoster ? players.length : MAX}
            accent={OW.primary}
            label={lockRoster ? 'Im Raum' : (mode === 'group' ? 'Gruppen' : 'Spieler')}
            maxNameLength={16}
          />
        </section>

        {/* Modus */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Modus</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'solo', label: 'Einzeln', desc: 'Jeder für sich', icon: <User className="w-5 h-5" /> },
              { id: 'group', label: 'Gruppen', desc: 'Generationen-Teams', icon: <Users className="w-5 h-5" /> },
            ] as const).map((m) => {
              const activeMode = mode === m.id;
              return (
                <button key={m.id} onClick={() => { void haptics.select(); setMode(m.id); }}
                  className="rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                  style={{ background: OW.surface, border: `2px solid ${activeMode ? OW.primary : 'transparent'}`, boxShadow: activeMode ? `0 0 20px ${OW.primary}33` : 'none' }}>
                  <div className="mb-2" style={{ color: activeMode ? OW.primary : OW.dim }}>{m.icon}</div>
                  <div className="font-black">{m.label}</div>
                  <div className="text-[11px]" style={{ color: OW.dim }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Spielziel */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Spielziel</h3>
          <div className="grid grid-cols-3 gap-3">
            {TARGETS.map((t) => {
              const activeT = winTarget === t.v;
              return (
                <button key={t.v} onClick={() => { void haptics.select(); setWinTarget(t.v); }}
                  className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                  style={{ background: OW.surface, border: `2px solid ${activeT ? OW.accent : 'transparent'}` }}>
                  <div className="text-2xl font-black" style={{ color: activeT ? OW.accent : OW.text }}>{t.v}</div>
                  <div className="text-[11px] font-bold mt-0.5">{t.label}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Genre-Filter */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Genre <span className="opacity-50 normal-case tracking-normal">(optional)</span></h3>
          <div className="flex flex-wrap gap-2">
            <GenrePill label="Alle" active={genre === null} onClick={() => { void haptics.select(); setGenre(null); }} />
            {OHRWURM_GENRES.map((g) => (
              <GenrePill key={g} label={g} active={genre === g} onClick={() => { void haptics.select(); setGenre(g); }} />
            ))}
          </div>
        </section>

        {/* Wiedergabe */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Wiedergabe</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'preview', label: 'Vorschau', desc: '30s, verdeckt — überall' },
              { id: 'spotify', label: 'Spotify Premium', desc: 'Vollversion, verdeckt — App + Premium' },
            ] as const).map((m) => {
              const activeP = playback === m.id;
              const dimmed = m.id === 'spotify' && !spotifyModePossible();
              return (
                <button key={m.id} disabled={dimmed}
                  onClick={() => { if (dimmed) return; void haptics.select(); setPlayback(m.id); }}
                  className="rounded-2xl p-4 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={{ background: OW.surface, border: `2px solid ${activeP ? OW.secondary : 'transparent'}`, opacity: dimmed ? 0.5 : 1 }}>
                  <div className="font-black" style={{ color: activeP ? OW.secondary : OW.text }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: OW.dim }}>{dimmed ? 'Nur in der App' : m.desc}</div>
                </button>
              );
            })}
          </div>
          {playback === 'spotify' && (
            <p className="text-[11px] mt-2" style={{ color: OW.dim }}>
              Braucht Spotify Premium + installierte Spotify-App (nur native). Sonst läuft automatisch die 30s-Vorschau.
            </p>
          )}
        </section>

      </main>

      {/* Start CTA — bei offener Tastatur ausblenden, damit das Namensfeld frei bleibt */}
      {!keyboardVisible && (
        <div className="fixed bottom-6 inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
          <motion.button onClick={start} disabled={!canStart} whileTap={canStart ? { scale: 0.97 } : {}}
            className="w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all"
            style={canStart
              ? { background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg, boxShadow: `0 20px 40px ${OW.primary}40` }
              : { background: OW.surface, color: OW.dim }}>
            {canStart ? <>Spiel starten <Crown className="w-5 h-5" /></> : `Mindestens ${MIN} ${mode === 'group' ? 'Gruppen' : 'Spieler'}`}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function GenrePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
      style={{ background: active ? OW.secondary : OW.surface, color: active ? OW.bg : OW.dim, border: `1px solid ${active ? OW.secondary : 'transparent'}` }}>
      {label}
    </button>
  );
}

/** Online guests wait here until the host starts the game (first state arrives). */
function OhrwurmWaiting({ roomCode }: { roomCode: string }) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-8 text-center font-game" style={{ background: OW.bg, color: OW.text }}>
      <style>{OW_STYLE}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(255,46,136,0.12)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(255,46,136,0.12)', border: `1px solid ${OW.primary}` }}>
        <Music2 className="w-8 h-8" style={{ color: OW.primary }} />
      </div>
      <h1 className="relative text-3xl font-black ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</h1>
      <div className="relative flex items-center gap-2 text-sm font-bold" style={{ color: OW.secondary }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Warte auf den Host…
      </div>
      <p className="relative text-xs" style={{ color: OW.dim }}>
        Raum <span className="font-mono font-black tracking-widest" style={{ color: OW.accent }}>{roomCode}</span> · das Spiel startet gleich
      </p>
    </div>
  );
}
