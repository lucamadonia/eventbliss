import { publicRoundItem } from '../multiplayer/public-round-item';
import { validTimelineSlot } from './navigation';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameEnd } from '../social/useGameEnd';
import {
  buildDeck, createFreshMatch, resolveRound, insertSorted, hasWon,
  type Participant, type Phase, type PendingCounter, type RoundResolution, type Song,
} from './ohrwurm-engine';
import { dropOhrwurmPlayers } from './removal';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { useGameTimer } from '../engine/TimerSystem';
import { type SpotifyBridge, getSpotifyBridge, resolveSpotifyUri } from './playback';
import { loadExtraSongs } from './ohrwurm-extra-songs';
import { useTranslation } from 'react-i18next';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useBackGuard } from '@/lib/back-guard';
import { loadSnapshot, saveSnapshot, clearSnapshot } from '../ui/useGameSnapshot';
import { setReportContext } from '../ui/useReportContext';
import { useTvPresence } from './useTvPresence';
import { useInitialRoster } from '@/games/ui/useInitialRoster';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { usePreviewLoader } from './usePreviewLoader';
import { MAX_HOOKS, OW, OW_STYLE, PLAYER_COLORS, ROUND_SECONDS, SPEED_BONUS_MS, type OhrwurmConfig, type SetupPlayer } from './ohrwurm-theme';
import { Scoreboard } from './OhrwurmParts';
import { CounterPanel, CounterPlacePanel, DrawPanel, PlacePanel } from './OhrwurmTurnPanels';
import { GameOverPanel, LeaveDialog, OhrwurmToast, QrOverlay, RevealPanel, SpotifyStatusBar } from './OhrwurmRevealPanels';
import { PartyTurnRibbon } from '../ui/PartyTurnRibbon';
import { OhrwurmWaitStage } from './OhrwurmWaitStage';
import { OhrwurmSetup, OhrwurmWaiting } from './OhrwurmSetup';
import { authorizeOhrwurmAction, canCounterAs, ohrwurmActingSeat, ohrwurmAudioHere, ohrwurmBeatPhase, ohrwurmTvPlayers } from './guest-turns';
import { advanceOhrwurmTeamTurn, ohrwurmSeat } from './teams';

// ===========================================================================
// Haupt-Komponente
// ===========================================================================
export default function OhrwurmGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { i18n, t } = useTranslation();
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);

  // --- Online roles -------------------------------------------------------
  // Offline (no `online` prop) → this single device is effectively the host
  // and runs all game logic, exactly as before. Online → the room host owns
  // the authoritative state and broadcasts it; other devices mirror it and
  // send their inputs back as actions.
  const isOnline = !!online;
  const isHost = !online || online.isHost;
  /** Party roster can be split into teams without dropping anyone. */
  const partyRoster = useInitialRoster({ min: 2 });
  const myId = online?.myPlayerId ?? null;
  const gameTasks = usePausableTasks(online?.isConnected !== false);
  // Whether a TV is connected to the room (useTvPresence.ts). When a TV is
  // present it is the speaker; otherwise the active player's own phone plays the preview.
  const [tvConnected, setTvConnected] = useTvPresence(online);

  // Admin-gepflegte Songs (Tabelle ohrwurm_songs) für die aktuelle Sprache
  // zur statischen Liste zuschalten.
  useEffect(() => {
    void loadExtraSongs(i18n.language?.split('-')[0]);
  }, [i18n.language]);

  const [phase, setPhase] = useState<Phase>('setup');
  const [confirmExit, setConfirmExit] = useState(false); // "Spiel verlassen?"-Sicherheitsabfrage
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
  // Welche Vorschau-URL wurde bereits automatisch angespielt (siehe Nachzieh-Effect).
  const autoPlayedUrlRef = useRef<string | null>(null);
  // Zugriff auf die Rundenuhr aus Callbacks, die VOR ihrer Deklaration stehen
  // (beginTurn → handleTimeout → useGameTimer bilden einen Zirkel).
  const roundTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);
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
  // QR-Overlay sichtbar?
  const [qrOpen, setQrOpen] = useState(false);

  const active = participants[turn] ?? null;
  const activeSeatId = ohrwurmSeat(active);
  const counteringParticipant = participants.find((p) => p.id === counteringId);
  const counteringSeatId = ohrwurmSeat(counteringParticipant);
  // 🔁 guests on the host phone play their turn (and their counter) after an opaque handover (guest-turns.ts).
  const seats = useMemo(() => (online ? localSeats(online) : []), [online]);
  const handover = useSeatHandover(online, ohrwurmActingSeat(phase, activeSeatId, counteringSeatId));
  // All devices + TV switch together; listening → placing stays on one beat (the clock keeps running).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [ohrwurmBeatPhase(phase), active?.id, !!winner]);
  const actionCtx = useMemo(() => ({
    phase, activeId: active?.id, counteringId, participantIds: participants.map((p) => p.id),
    seatByParticipant: Object.fromEntries(participants.map((p) => [p.id, ohrwurmSeat(p) ?? p.id])),
    room: online?.players ?? [],
  }), [phase, active?.id, counteringId, participants, online?.players]);
  const ownedIds = useMemo(
    () => new Set(participants.flatMap((p) => p.timeline.map((s) => s.id))),
    [participants],
  );

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  const { previewUrl, setPreviewUrl, previewLoading, loadPreview } = usePreviewLoader(drawIdRef, flash);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); try { a.currentTime = 0; } catch { /* noop */ } }
    setIsAudioPlaying(false);
  }, []);


  // --- Stapel: oberste Karte ziehen, ggf. neu mischen (Spec §2.6) ---------
  // Robust gegen „kein Song": ziehe von oben (Ende) und überspringe Karten, die
  // bereits auf einer Timeline liegen (owned) — auch auf dem Nicht-Leer-Pfad.
  // Nach einem Konter kann eine zurückgelegte/geklaute Karte sonst doppelt im
  // Stapel landen; ein ge-„ownter" Top-Card-Treffer würde sonst als Mystery
  // gezogen, obwohl er schon sichtbar in einer Timeline steht. Ist der Stapel
  // (nach Filtern) leer, wird frisch gemischt — niemals `undefined` zurückgeben.
  const takeCard = useCallback((d: Song[], owned: Set<string>): { card: Song; rest: Song[] } => {
    const rest = d.slice();
    while (rest.length > 0) {
      const card = rest.pop()!;
      if (!owned.has(card.id)) return { card, rest };
    }
    // Stapel erschöpft (oder nur noch owned) → frisch aufbauen, owned filtern.
    // Sind ALLE Songs des Genres bereits vergeben (kleine Genres haben nur ~15-18
    // Songs, bei winTarget 10 und mehreren Spielern schnell erreicht), wäre die
    // gefilterte Liste leer und `fresh[fresh.length - 1]` === undefined →
    // beginTurn wirft beim Zugriff auf card.spotifyUri und der Draw-Screen bleibt
    // leer. Dann lieber ohne owned-Filter weiterspielen (Karte darf erneut kommen).
    let pool = buildDeck(genre).filter((s) => !owned.has(s.id));
    if (pool.length === 0) pool = buildDeck(genre);
    if (pool.length === 0) pool = buildDeck(null);
    return { card: pool[pool.length - 1], rest: pool.slice(0, -1) };
  }, [genre]);

  // --- Gezogene Karte vorbereiten (neue Runde UND Tausch) ------------------
  // Meldekontext mitführen (Song spielt nicht, weil ein Vorschau-Link tot ist —
  // ohne Song-ID wäre eine Meldung wertlos), Wiedergabe/Uhr zurücksetzen und
  // die Vorschau laden. Uhr über die Ref, weil `roundTimer` erst weiter unten
  // deklariert wird (useGameTimer braucht handleTimeout → beginTurn).
  const primeCard = useCallback((card: Song) => {
    setSong(card);
    setReportContext(card ? { gameId: "ohrwurm", contentId: card.id, label: `${card.artist} — ${card.title} (${card.year})` } : null);
    stopAudio();
    setListening(false);
    setPlaceElapsedMs(null);
    playStartedAtRef.current = null;
    roundTimerRef.current?.reset(ROUND_SECONDS);
    const myDraw = ++drawIdRef.current;
    void loadPreview(card, myDraw);
    // Gebackene URI SOFORT setzen — unabhängig davon, ob die Bridge schon
    // verbunden ist (sie verbindet async erst nach dem Spotify-Login; sonst
    // bliebe die erste Karte ohne URI → 30s-Vorschau trotz „verbunden").
    setSpotifyUri(card.spotifyUri ?? null);
    if (!card.spotifyUri && spotifyModeRef.current) {
      void resolveSpotifyUri(card).then((uri) => { if (drawIdRef.current === myDraw) setSpotifyUri(uri); });
    }
  }, [stopAudio, loadPreview]);

  // --- Neue Runde starten -------------------------------------------------
  const beginTurn = useCallback((parts: Participant[], d: Song[], idx: number) => {
    const nextParts = advanceOhrwurmTeamTurn(parts, idx);
    const owned = new Set(nextParts.flatMap((p) => p.timeline.map((s) => s.id)));
    const { card, rest } = takeCard(d, owned);
    setParticipants(nextParts);
    setDeck(rest);
    setTurn(idx);
    setPlacement(null);
    setCounter(null);
    setCounteringId(null);
    setResolution(null);
    setFlipped(false);
    setSwapUsed(false);
    setBonusClaimed(false);
    setBonusDecided(false);
    primeCard(card);
    setPhase('draw');
  }, [takeCard, primeCard]);

  // First start and rematch share exactly the same match initialization.
  const beginMatch = useCallback((roster: Omit<Participant, 'timeline' | 'hooks'>[], selectedGenre: string | null) => {
    gameTasks.clear();
    setWinner(null);
    recordedRef.current = false;
    const fresh = createFreshMatch(roster, buildDeck(selectedGenre));
    beginTurn(fresh.participants, fresh.deck, 0);
  }, [gameTasks, beginTurn]);

  // --- Spielstart ---------------------------------------------------------
  const handleStart = useCallback((cfg: OhrwurmConfig, players: SetupPlayer[]) => {
    if (!isHost) return;
    const roster: Omit<Participant, 'timeline' | 'hooks'>[] = (cfg.mode === 'group' ? cfg.teams ?? [] : players).map(p => ({
      ...p, type: cfg.mode === 'group' ? 'group' : 'player',
    }));
    if (roster.length < 2) return;
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
        if (!bridge) { setSpotifyStatus('preview:' + reason); flash(t('games.ohrwurm.spotifyFallback', { reason })); return; }
        spotifyBridgeRef.current = bridge;
        setSpotifyStatus('ok');
      });
    } else {
      setSpotifyStatus(null);
    }
    void haptics.celebrate();
    beginMatch(roster, cfg.genre);
  }, [isHost, beginMatch, haptics, flash, t]);

  // --- 60s-Timer: läuft ab → Karte verfällt, nächste Person ---------------
  const handleTimeout = useCallback(() => {
    // In online mode only the host runs the authoritative timeout; clients just
    // mirror the clock for display.
    if (online && !online.isHost) return;
    if (!song) return;
    stopAudio();
    setListening(false);
    void haptics.error();
    flash(t('games.ohrwurm.timeoutCardForfeited'));
    const nextIdx = (turn + 1) % participants.length;
    const newDeck = [song, ...deck]; // verfallene Karte zurück nach unten
    gameTasks.setTimeout(() => beginTurn(participants, newDeck, nextIdx), 650);
  }, [song, stopAudio, haptics, flash, turn, participants, deck, beginTurn, gameTasks]);

  const roundTimer = useGameTimer(ROUND_SECONDS, handleTimeout, online?.isConnected !== false && !handover.isPaused);
  // Ref nachziehen, damit beginTurn (steht weiter oben) die Uhr zurücksetzen kann.
  roundTimerRef.current = roundTimer;

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
    setSwapUsed(true);
    setBonusClaimed(false); // neue Karte → ggf. erneut Titel+Interpret ansagen
    primeCard(card); // neuer Song → Wiedergabe/Timer zurücksetzen, neue Vorschau laden
    flash(t('games.ohrwurm.cardSwapped'));
  }, [active, song, swapUsed, participants, deck, turn, takeCard, haptics, flash, primeCard, t]);

  // --- Phase 4: Auflösung -------------------------------------------------
  // useCallback mit vollständigen Deps: die Konter-Callbacks (handleCommitCounter
  // /handleNoCounter) hängen daran und würden sonst eine STALE-Version von
  // goReveal (mit altem song/active/timeline) einfangen → Konter resolved gegen
  // den falschen Song, die echte Karte bleibt halb-aufgelöst → nächste Runde
  // „kein Song". Mit stabilen Deps läuft die Auflösung immer gegen den aktuellen
  // Zustand. (Vor handlePlace deklariert, damit es in dessen Dep-Array steht.)
  const goReveal = useCallback((slotIndex: number, ct: PendingCounter | null) => {
    if (!active || !song) return;
    const res = resolveRound(active.id, active.timeline, { slotIndex }, ct, song);

    // Erfolgreicher Konter (Konterer gewinnt die Karte): eingesetzten 🎣
    // zurückgeben (Hitster: nur fehlgeschlagene Token sind verloren).
    const counterRefund = !!(ct && res.winnerId === ct.participantId);

    if (res.winnerId) {
      const winnerId = res.winnerId;
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === winnerId
            ? {
                ...p,
                timeline: insertSorted(p.timeline, song),
                hooks: counterRefund ? Math.min(MAX_HOOKS, p.hooks + 1) : p.hooks,
              }
            : p,
        ),
      );
    } else {
      // Niemand gewinnt → Karte zurück nach ganz unten. Den Deck-Mutate AUSSERHALB
      // des participants-Updaters halten (setState-in-updater kann mehrfach laufen
      // → song doppelt im Stapel). Idempotent: erst alle Vorkommen entfernen.
      setDeck((d) => [song, ...d.filter((s) => s.id !== song.id)]);
    }

    setCounter(ct);
    setResolution(res);
    setPhase('reveal');
    setFlipped(false);
    // Flip nach kurzem Moment
    gameTasks.setTimeout(() => setFlipped(true), 220);
    if (res.winnerId) void haptics.success(); else void haptics.warning();
  }, [active, song, haptics]);

  // --- Phase 2: Einordnen -------------------------------------------------
  const handlePlace = useCallback((slotIndex: number) => {
    if (!active || !validTimelineSlot(slotIndex, active.timeline.length)) return;
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
  }, [active, participants, turn, haptics, roundTimer, stopAudio, goReveal]);

  // --- Phase 3: Konter ----------------------------------------------------
  const handleChooseCounter = useCallback((pid: string) => {
    if (!participants.some(participant => participant.id === pid && participant.id !== active?.id && participant.hooks >= 1)) return;
    void haptics.medium();
    setCounteringId(pid);
    setPhase('counterPlace');
  }, [haptics, participants, active?.id]);

  const handleCommitCounter = useCallback((slotIndex: number) => {
    if (!counteringId || placement === null || !active || !validTimelineSlot(slotIndex, active.timeline.length)
      || !participants.some(participant => participant.id === counteringId && participant.hooks >= 1)) return;
    void haptics.medium();
    setParticipants((prev) => prev.map((p) => (p.id === counteringId ? { ...p, hooks: p.hooks - 1 } : p)));
    const ct: PendingCounter = { participantId: counteringId, slotIndex };
    goReveal(placement, ct);
  }, [counteringId, placement, haptics, goReveal, active, participants]);

  const handleNoCounter = useCallback(() => {
    if (placement === null) return;
    goReveal(placement, null);
  }, [placement, goReveal]);

  // --- Phase 5: Bonus -----------------------------------------------------
  // Speed-Bonus: innerhalb 10s platziert UND angesagt → +2 statt +1 🎣.
  const disconnectedAtRef = useRef<{ at: number; started: number | null } | null>(null);
  useEffect(() => {
    if (online?.isConnected === false) {
      disconnectedAtRef.current ??= { at: Date.now(), started: playStartedAtRef.current };
    } else if (disconnectedAtRef.current) {
      const paused = disconnectedAtRef.current;
      if (playStartedAtRef.current !== null && playStartedAtRef.current === paused.started) playStartedAtRef.current += Date.now() - paused.at;
      disconnectedAtRef.current = null;
    }
  }, [online?.isConnected]);

  const speedEligible = placeElapsedMs != null && placeElapsedMs <= SPEED_BONUS_MS && bonusClaimed;
  const handleBonus = useCallback((earned: boolean) => {
    setBonusDecided(true);
    if (earned && active) {
      const amount = speedEligible ? 2 : 1;
      void haptics.success();
      setParticipants((prev) => prev.map((p, i) =>
        i === turn ? { ...p, hooks: Math.min(MAX_HOOKS, p.hooks + amount) } : p));
      flash(speedEligible ? t('games.ohrwurm.flashSpeedBonus') : t('games.ohrwurm.flashBonus'));
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

  // --- Host: Kick/Leave mitten in der Partie (F13/F14/F19) ----------------
  useRemovedPlayers(online, (ids) => {
    const r = dropOhrwurmPlayers({ participants, turn, phase, counteringId, winTarget }, ids);
    if (!r) return;
    if (r.kind === 'restartTurn') {
      gameTasks.clear();
      beginTurn(r.participants, r.returnSong && song ? [song, ...deck.filter((s) => s.id !== song.id)] : deck, r.turn);
      return;
    }
    setParticipants(r.participants);
    setTurn(r.turn);
    if (r.kind === 'gameOver') { gameTasks.clear(); roundTimer.reset(ROUND_SECONDS); setWinner(r.participants.find((p) => p.id === r.winnerId) ?? null); setPhase('gameOver'); }
    if (r.kind === 'reopenCounter') { setCounteringId(null); setPhase('counter'); }
    if (r.kind === 'resolveNoCounter') { setCounteringId(null); if (placement !== null) goReveal(placement, null); }
  });

  // --- Stats beim Spielende -----------------------------------------------
  useEffect(() => {
    if (phase === 'gameOver' && winner && !recordedRef.current) {
      recordedRef.current = true;
      const participant = isOnline ? participants.find(p => p.id === myId || p.memberIds?.includes(myId ?? '')) : winner;
      if (participant) recordEnd('ohrwurm', participant.timeline.length, participant.id === winner.id);
    }
    if (phase === 'setup') recordedRef.current = false;
  }, [phase, winner, recordEnd, isOnline, participants, myId]);

  const resetGame = useCallback(() => {
    gameTasks.clear();
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

  // --- Nochmal spielen -----------------------------------------------------
  // Keep identities and settings; deal new start cards and reset every match resource.
  const rematch = useCallback(() => {
    if (!isHost) { online?.broadcast('ohrwurm-action', { type: 'again' }); return; }
    if (participants.length === 0) { resetGame(); return; }
    void haptics.celebrate();
    beginMatch(participants, genre);
  }, [online, isHost, participants, genre, beginMatch, haptics, resetGame]);

  // Beim Verlassen des Spiels Audio stoppen + Spotify-Verbindung lösen.
  useEffect(() => () => {
    const a = audioRef.current; if (a) a.pause();
    spotifyBridgeRef.current?.disconnect().catch(() => {});
  }, []);

  // =========================================================================
  // Online sync (host-authority) + TV bridge
  // =========================================================================
  const iAmActive = !isOnline || (!!activeSeatId && seats.includes(activeSeatId));
  // Which device makes sound: offline → this one; online → the TV if connected,
  // otherwise the active player's own phone.
  const audioDevice = ohrwurmAudioHere(isOnline, tvConnected, activeSeatId, seats);

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
    if (online?.isConnected === false) return;
    if (isOnline && type === 'back' && !authorizeOhrwurmAction({ type, ...payload }, myId, actionCtx)) return;
    if (isOnline && !isHost) { online!.broadcast('ohrwurm-action', { type, ...payload }); return; }
    run();
  }, [isOnline, isHost, online, myId, actionCtx]);

  // Press "play": start the shared clock + (only on the audio device) play sound.
  const pressPlay = useCallback(() => {
    // Die 60s-Uhr NIE ohne Ton starten. Vorher lief sie bedingungslos an und der
    // `!previewUrl`-Abbruch kam erst danach → Timer lief, Spieler hörte nichts,
    // musste blind raten und verlor die Karte über handleTimeout.
    // Spielt der TV den Ton (audioDevice=false), hat dieses Gerät bewusst keine
    // eigene Quelle — dann darf der Start natürlich trotzdem durch.
    if (audioDevice && !previewUrl) return;
    act('listen', {}, beginListening);
    if (!audioDevice) return;
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
    else { a.pause(); setIsAudioPlaying(false); }
  }, [act, beginListening, audioDevice, previewUrl]);

  // Kommt die Vorschau-URL erst NACH dem Start an (langsames Netz, Retry, oder
  // Start über den „60s starten"-Fallback-Button), spielt sie automatisch an.
  // Pro URL nur einmal — sonst würde ein bewusstes Pausieren sofort überschrieben.
  useEffect(() => {
    if (phase !== 'draw' || !listening || !audioDevice || !previewUrl) return;
    if (autoPlayedUrlRef.current === previewUrl) return;
    autoPlayedUrlRef.current = previewUrl;
    const a = audioRef.current;
    if (!a || !a.paused) return;
    a.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
  }, [phase, listening, audioDevice, previewUrl]);

  const navigateBack = useCallback((to: 'draw' | 'place' | 'counter') => {
    if (to === 'draw') setPhase('draw');
    if (to === 'place') {
      setPlacement(null);
      setPhase('place');
      if (listening) roundTimer.start();
    }
    if (to === 'counter') { setCounteringId(null); setPhase('counter'); }
  }, [listening, roundTimer.start]);

  // Host applies actions coming from remote clients.
  const applyAction = useCallback((data: Record<string, unknown>) => {
    // Turn, counter and back are checked per seat: a 🔁 guest acts through the device that plays it.
    if (online?.isConnected === false || !authorizeOhrwurmAction(data, data.__senderId, actionCtx)) return;
    if (data.type === 'again') { rematch(); return; }
    if (data.type === 'back') { navigateBack(data.to as 'draw' | 'place' | 'counter'); return; }
    switch (data.type) {
      case 'toPlace': setPhase('place'); break;
      case 'toggleBonus': setBonusClaimed((v) => !v); break;
      case 'listen': beginListening(); break;
      case 'swap': handleSwap(); break;
      case 'place': handlePlace(data.slot as number); break;
      case 'chooseCounter': handleChooseCounter(data.pid as string); break;
      case 'commitCounter': handleCommitCounter(data.slot as number); break;
      case 'noCounter': handleNoCounter(); break;
      case 'bonus': if (typeof data.earned === 'boolean') handleBonus(data.earned); break;
      case 'continue': handleContinue(); break;
      // Ein Schritt zurück innerhalb der Runde (noch nichts gewertet).
      default: break;
    }
  }, [rematch, actionCtx, beginListening, handleSwap, handlePlace, handleChooseCounter, handleCommitCounter, handleNoCounter, handleBonus, handleContinue, online?.isConnected, navigateBack]);

  // Header-Zurück: einen echten Schritt zurück, wo es gefahrlos ist (vor der
  // Wertung), sonst NICHT sofort das ganze Spiel verlassen, sondern nachfragen.
  // So wirft ein versehentlicher Tipp dich nicht mehr direkt in die Spieleliste.
  const handleHeaderBack = useCallback(() => {
    void haptics.light();
    // draw ← place: der häufigste Fall — man ist schon am Einordnen und merkt,
    // dass man vorher noch einen 🎣 einsetzen wollte (Tausch gibt es nur in
    // 'draw'). Die Uhr läuft hier noch, also nichts wiederherzustellen.
    if (phase === 'place') { act('back', { to: 'draw' }, () => navigateBack('draw')); return; }
    // place ← counter: Platzierung zurücknehmen und neu einordnen. Gefahrlos,
    // weil goReveal noch nicht gelaufen ist. handlePlace hatte die Uhr
    // pausiert — die muss wieder laufen, sonst hat die Runde keinen Zeitdruck.
    if (phase === 'counter') {
      act('back', { to: 'place' }, () => navigateBack('place'));
      return;
    }
    if (phase === 'counterPlace') { act('back', { to: 'counter' }, () => navigateBack('counter')); return; }
    // Ab 'reveal' bewusst gesperrt: ein Rückschritt würde die Auflösung verraten.
    setConfirmExit(true);
  }, [phase, act, haptics, navigateBack]);

  // Die native Zurück-Taste und der Floating-Button liegen ÜBER unserem eigenen
  // Pfeil — ohne diesen Guard verwarfen sie die komplette Partie, statt einen
  // Schritt zurückzugehen. Im Setup lassen wir sie bewusst durch: dort gibt es
  // noch nichts zu verlieren.
  useBackGuard(() => {
    if (phase === 'setup') return false;
    if (qrOpen) { setQrOpen(false); return true; }
    if (confirmExit) { setConfirmExit(false); return true; }
    handleHeaderBack();
    return true;
  });

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('ohrwurm-action', (data) => applyAction(data));
  }, [online, isHost, applyAction]);

  // The shared clock also restores the correct remaining time after reconnect.
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('ohrwurm-timer-state', { timeLeft: roundTimer.timeLeft, running: roundTimer.isRunning });
  }, [online, roundTimer.timeLeft, roundTimer.isRunning]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('ohrwurm-timer-state', data => {
      if (typeof data.timeLeft !== 'number') return;
      roundTimerRef.current?.reset(data.timeLeft);
      if (data.running) roundTimerRef.current?.start();
    });
  }, [online]);

  const latestOnlineSnapshot = useRef<Record<string, unknown> | null>(null);
  // Host → FULL authoritative snapshot, ONLY on real game-state changes.
  // (Deliberately NOT depending on roundTimer.timeLeft: re-sending the whole
  // snapshot every second would spam ~60 msgs/round and trigger a re-render
  // storm on every client. The live countdown rides in tv-state below.)
  useEffect(() => {
    if (!online || !isHost) return;
    const snapshot = {
      phase, participants, turn,
      song: publicRoundItem(song, phase === 'reveal' || phase === 'gameOver', ['year', 'title', 'artist', 'qrPayload', 'spotifyUri', 'flag', 'genre']),
      placement, counter, counteringId, resolution,
      flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre, winner,
      previewUrl, spotifyUri: phase === 'reveal' || phase === 'gameOver' ? spotifyUri : null, listening, placeElapsedMs, tvConnected, phaseStartsAt,
    };
    latestOnlineSnapshot.current = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
    online.broadcast('ohrwurm-state', { snapshot: latestOnlineSnapshot.current });
     
  }, [online, isHost, phase, participants, turn, song, placement, counter, counteringId, resolution, flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre, winner, previewUrl, spotifyUri, listening, placeElapsedMs, tvConnected, phaseStartsAt]);
  // A phone that enters after the Host's first broadcast needs the current
  // state immediately; otherwise it stays on the setup/wait screen forever.
  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('ohrwurm-state-request', () => {
      if (latestOnlineSnapshot.current) online.broadcast('ohrwurm-state', { snapshot: latestOnlineSnapshot.current });
      online.broadcast('ohrwurm-timer-state', { timeLeft: roundTimerRef.current?.timeLeft ?? ROUND_SECONDS,
        running: roundTimerRef.current?.isRunning ?? false });
    });
  }, [online, isHost]);

  // Public TV payload (spoiler-free): phase + shared start, avatars/colours, guest on the host phone.
  // The title stays hidden until the reveal; the TV is the speaker when connected.
  const tvPayload = {
    phase, phaseStartsAt, handover: handover.tv,
    players: ohrwurmTvPlayers(participants),
    teams: participants.some((p) => p.type === 'group')
      ? participants.map((p) => ({ id: p.id, name: p.name, score: p.timeline.length, players: p.memberNames ?? [p.name] }))
      : undefined,
    activeId: active?.id ?? null,
    activeName: active?.name ?? '',
    timeline: active ? active.timeline.map((s) => ({ id: s.id, year: s.year })) : [],
    listening,
    timeLeft: roundTimer.timeLeft,
    totalTime: ROUND_SECONDS,
    winTarget,
    previewUrl,
    reveal: phase === 'reveal' && song ? { year: song.year, title: song.title, artist: song.artist, flag: song.flag, genre: song.genre } : null,
    // Bonus verification: active player claimed Title+Artist and the group is
    // deciding yes/no — surface title+artist big on the TV so everyone checks.
    bonusPending: phase === 'reveal' && !!resolution?.bonusEligible && bonusClaimed && !bonusDecided,
    winnerName: winner?.name ?? null,
  };
  const tvKey = `${handover.tv?.playerId ?? ''}:${handover.tv?.progress?.phase ?? ''}`;

  // Host → TV state on the game-room channel. Carries the live countdown, so it
  // updates per second — but ONLY the TV consumes it, so no client re-render storm.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'ohrwurm', ...tvPayload });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, isHost, phase, phaseStartsAt, participants, listening, roundTimer.timeLeft, previewUrl, song, winner, resolution, bonusClaimed, bonusDecided, tvKey]);

  // Einen Snapshot in den lokalen State übernehmen. Zwei Aufrufer: der
  // Online-Client (Host-Broadcast) und die Wiederherstellung nach Navigation.
  const applySnapshot = useCallback((s: Record<string, unknown>) => {
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
      receivePhaseStart(s.phaseStartsAt);
      // Nur im gespeicherten Stand enthalten: der Stapel. Der Online-Snapshot
      // lässt ihn bewusst weg (Host zieht die Karten, Clients brauchen ihn
      // nicht) — beim Fortsetzen offline ist er dagegen zwingend, sonst kann
      // die nächste Runde keine Karte mehr ziehen.
      if (Array.isArray(s.deck)) setDeck(s.deck as Song[]);
      if (typeof s.timeLeft === 'number' && Number.isFinite(s.timeLeft)) {
        roundTimerRef.current?.reset(Math.max(0, Math.min(ROUND_SECONDS, s.timeLeft)));
        if (s.timerRunning === true) roundTimerRef.current?.start();
      }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Non-host → apply incoming snapshots.
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('ohrwurm-state', (data) => {
      const s = (data as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      applySnapshot(s);
    });
  }, [online, isHost, applySnapshot]);
  useEffect(() => {
    if (!online || isHost || phase !== 'setup' || online.isConnected === false) return;
    const request = () => online.broadcast('ohrwurm-state-request', { match: online.roomCode });
    request();
    const retry = window.setInterval(request, 2000);
    return () => window.clearInterval(retry);
  }, [online, isHost, phase, online?.isConnected]);

  // --- Spielstand über Navigation hinweg retten --------------------------
  // Nur offline: online besitzt der Host die Wahrheit, ein lokal gespeicherter
  // Stand würde beim Wiedereintritt gegen den Host-Snapshot arbeiten.
  const restoredRef = useRef(false);

  useEffect(() => {
    if (isOnline || restoredRef.current) return;
    restoredRef.current = true;
    const snap = loadSnapshot<Record<string, unknown>>('ohrwurm');
    // Nur eine wirklich laufende Partie zurückholen — ein gespeichertes 'setup'
    // oder 'gameOver' hat keinen Wert.
    if (snap && snap.phase && snap.phase !== 'setup' && snap.phase !== 'gameOver') {
      applySnapshot(snap);
    }
  }, [isOnline, applySnapshot]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') { clearSnapshot('ohrwurm'); return; }
    if (!restoredRef.current) return; // vor der Wiederherstellung nichts überschreiben
    saveSnapshot('ohrwurm', {
      phase, participants, turn, song, placement, counter, counteringId, resolution,
      flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre, winner,
      previewUrl, spotifyUri, listening, placeElapsedMs, tvConnected,
      deck, // offline zwingend — siehe applySnapshot
      timeLeft: roundTimer.timeLeft,
      timerRunning: roundTimer.isRunning,
    });
  }, [isOnline, phase, participants, turn, song, placement, counter, counteringId,
      resolution, flipped, swapUsed, bonusClaimed, bonusDecided, winTarget, genre,
      winner, previewUrl, spotifyUri, listening, placeElapsedMs, tvConnected, deck, roundTimer.timeLeft, roundTimer.isRunning]);

  // Offline TV bridge (party mode / TV-room channel). Online TV uses the
  // 'tv-state' broadcast above on the game-room channel.
  useTVGameBridge('ohrwurm', {
    ...tvPayload,
    partyScoresById: Object.fromEntries(participants.flatMap((participant) =>
      (participant.memberIds?.length ? participant.memberIds : [participant.id]).map((id) => [id, participant.timeline.length]))),
  },
    [phase, phaseStartsAt, turn, listening, roundTimer.timeLeft, participants, resolution, bonusClaimed, bonusDecided, tvKey], isHost);

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
          // Party: the player's own colour and symbol, the same on phone and TV.
          color: p.color || PLAYER_COLORS[i % PLAYER_COLORS.length],
          avatar: p.avatar || (p.name?.trim().slice(0, 1) || '?').toUpperCase(),
        }))
      : partyRoster?.map((p, i) => ({
          id: p.id,
          name: p.name,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
          avatar: p.avatar,
        }));
    return <OhrwurmSetup onStart={handleStart} haptics={haptics} initialPlayers={onlineRoster} lockRoster={isOnline} />;
  }

  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen

  // Bonus-Bestätigung nur, wenn vorab angesagt UND die Karte gewonnen wurde.
  const bonusOpen = phase === 'reveal' && !!resolution?.bonusEligible && bonusClaimed && !bonusDecided;
  // Angesagt, aber Karte nicht gewonnen → Bonus verfällt (Hinweis).
  const bonusForfeited = phase === 'reveal' && bonusClaimed && !resolution?.bonusEligible;

  // Online: who holds the turn right now, and may this device act? (counter: every device for its own seats)
  const actingSeat = view === 'counterPlace' ? counteringParticipant ?? null : active;
  const canInteract = !isOnline || view === 'counter' || view === 'gameOver'
    || (view === 'counterPlace' ? !!counteringSeatId && seats.includes(counteringSeatId) : iAmActive);
  const ribbonLine = view === 'counterPlace'
    ? t('games.ohrwurm.partyCounterLine', 'Setz deinen Konter auf den Zeitstrahl.')
    : view === 'reveal' ? undefined : t('games.ohrwurm.partyYourTurnLine', 'Hör rein und ordne den Song ein.');

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col font-game"
      style={{ background: OW.bg, color: OW.text }}
      data-phase={view}
    >
      <style>{OW_STYLE}</style>{blocker}
      {/* Ambient glows — the acting player's colour lights the stage (design §9.1). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[130px]"
          style={{ background: isOnline && canInteract && actingSeat ? `${actingSeat.color}2e` : 'rgba(255,46,136,0.12)', transition: 'background 260ms' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleHeaderBack} className="grid h-11 w-11 place-items-center -ms-2" style={{ color: OW.dim }} aria-label={t('games.ohrwurm.back')}>
          <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" />
        </button>
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
          <span className="text-sm font-black tracking-[0.2em] uppercase ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</span>
        </div>
        <div className="px-3 py-1 rounded-full text-[12px] font-bold tabular-nums" style={{ background: OW.surface, color: OW.accent }}>
          {t('games.ohrwurm.target', { count: winTarget })}
        </div>
      </div>

      {confirmExit && (
        <LeaveDialog onStay={() => setConfirmExit(false)} onLeave={() => { clearSnapshot('ohrwurm'); setConfirmExit(false); navigate('/games'); }} />
      )}
      {spotifyStatus && <SpotifyStatusBar spotifyStatus={spotifyStatus} />}

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
        onError={() => {
          // Abgelaufene iTunes-CDN-URL oder Decode-Fehler: vorher passierte
          // hier gar nichts und die Runde blieb wortlos stumm. Jetzt in den
          // ehrlichen Fallback wechseln, damit der Spieler es merkt.
          if (!previewUrl) return;
          setIsAudioPlaying(false);
          setPreviewUrl(null);
          flash(t('games.ohrwurm.previewFailed'));
        }}
        className="hidden"
        aria-hidden="true"
      />

      {/* Phase content */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-6">
        {/* Party: whose turn it is, on top of the stage (design §9.2). */}
        {isOnline && canInteract && actingSeat && view !== 'counter' && view !== 'gameOver' && (
          <PartyTurnRibbon className="mt-2" player={actingSeat} kind="me" line={ribbonLine} />
        )}
        {/* Online: block input on devices that aren't the acting player right now — a calm stage, not a spinner. */}
        {isOnline && !canInteract && (
          <div className="absolute inset-0 z-30 flex items-start justify-center px-4 pb-6 pt-2" style={{ background: OW.bg }}>
            {actingSeat ? (
              <OhrwurmWaitStage acting={actingSeat} mine={participants.find((p) => p.id === myId || p.memberIds?.includes(myId ?? ''))}
                line={tvConnected ? t('games.ohrwurm.watchTV') : t('games.ohrwurm.yourTurnSoon')} />
            ) : (
              <p className="px-5 py-3 rounded-2xl text-sm font-bold" style={{ background: OW.surface }}>{t('games.ohrwurm.waiting')}</p>
            )}
          </div>
        )}
        <AnimatePresence mode="wait">
          {/* ---- DRAW: verborgen in der App anhören (30s) + 60s-Timer ---- */}
          {view === 'draw' && song && active && (
            <DrawPanel key="draw" active={active} previewLoading={previewLoading} previewUrl={previewUrl} isAudioPlaying={isAudioPlaying}
              listening={listening} timeLeft={roundTimer.timeLeft} bonusClaimed={bonusClaimed} swapUsed={swapUsed}
              onPlay={pressPlay} onStartSilent={() => act('listen', {}, beginListening)} onReplay={replayAudio}
              onToggleBonus={() => { void haptics.select(); act('toggleBonus', {}, () => setBonusClaimed((v) => !v)); }}
              onSwap={() => {
                if (swapUsed) { flash(t('games.ohrwurm.flashSwapUsed')); return; }
                if (active.hooks < 1) { flash(t('games.ohrwurm.flashNoHooks')); return; }
                act('swap', {}, handleSwap);
              }}
              onToPlace={() => { void haptics.light(); act('toPlace', {}, () => setPhase('place')); }} />
          )}

          {/* ---- PLACE: aktive Person ordnet ein ---- */}
          {view === 'place' && song && active && (
            <PlacePanel key="place" active={active} listening={listening} timeLeft={roundTimer.timeLeft}
              onPlace={(slot) => act('place', { slot }, () => handlePlace(slot))} />
          )}

          {/* ---- COUNTER: Konter-Fenster ---- */}
          {view === 'counter' && active && (
            <CounterPanel key="counter" active={active} participants={participants} turn={turn}
              mayCounter={(id) => canCounterAs(ohrwurmSeat(participants.find((p) => p.id === id)) ?? id, activeSeatId, isOnline ? seats : null) && id !== active.id}
              onChoose={(pid) => act('chooseCounter', { pid }, () => handleChooseCounter(pid))}
              onNoCounter={() => act('noCounter', {}, handleNoCounter)} />
          )}

          {/* ---- COUNTER PLACE ---- */}
          {view === 'counterPlace' && active && counteringId && (
            <CounterPlacePanel key="cplace" active={active} participants={participants} counteringId={counteringId}
              onCommit={(slot) => act('commitCounter', { slot }, () => handleCommitCounter(slot))} />
          )}

          {/* ---- REVEAL ---- */}
          {view === 'reveal' && song && active && resolution && (
            <RevealPanel key="reveal" song={song} flipped={flipped} resolution={resolution} active={active} counter={counter}
              participants={participants} spotifyUri={spotifyUri} bridge={spotifyBridgeRef.current} haptics={haptics} flash={flash}
              bonusOpen={bonusOpen} bonusForfeited={bonusForfeited} speedEligible={speedEligible} onQr={() => setQrOpen(true)}
              onBonus={(earned) => act('bonus', { earned }, () => handleBonus(earned))}
              onContinue={() => act('continue', {}, handleContinue)} />
          )}

          {/* ---- GAME OVER ---- */}
          {view === 'gameOver' && winner && (
            <GameOverPanel key="over" participants={participants} winner={winner} achievements={newAchievements}
              onDismissAchievements={clearAchievements} onRematch={rematch} onOtherGame={() => navigate('/games')} />
          )}
        </AnimatePresence>
      </div>

      <OhrwurmToast toast={toast} />
      <QrOverlay qrOpen={qrOpen} song={song} onClose={() => setQrOpen(false)} />
    </div>
  );
}
