import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Music2, Pause, Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useGameEnd } from '../social/useGameEnd';
import { clearReportContext, getReportContext, setReportContext } from '../ui/useReportContext';
import { useBackGuard } from '@/lib/back-guard';
import { GameStage, StageAction, StageHeader, StagePanel } from '../ui/GameStage';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { getPlayerColor } from '../ui/PlayerAvatars';
import { serverClock } from '../party/scene-clock';
import { abortControllerGame, leaveControllerParty } from '../party/controller-session';
import { useInitialRoster } from '../ui/useInitialRoster';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { OHRWURM_GENRES } from '../ohrwurm/ohrwurm-content';
import { usePreviewLoader } from '../ohrwurm/usePreviewLoader';
import { useTvPresence } from '../ohrwurm/useTvPresence';
import { ConfirmExitDialog, useConfirmExit } from '../ui/useConfirmExit';
import { clearSnapshot, loadSnapshot, saveSnapshot } from '../ui/useGameSnapshot';
import type { Song } from '../ohrwurm/ohrwurm-engine';
import { loadHitBuzzerDeck } from './song-pool';
import {
  acceptBuzz, advanceRound, createMatch, DEFAULT_CONFIG, extendAnswerDeadline, judgeBuzz, pauseListening, removePlayer,
  replaceBrokenClip, resumeListening, revealRound, startListening, undoJudgement, updateElapsed, voidBuzz,
  type HitConfig, type HitPlayer, type HitState,
} from './engine';
import { hitText } from './strings';

const id = () => crypto.randomUUID();

interface HitSnapshot {
  state: HitState;
  song: Song;
  deck: Song[];
  roundStart: HitState | null;
  roster: (PlayerSetupPlayer & { avatar?: string })[];
  config: HitConfig;
  teamMode: boolean;
  teams: Record<string, string>;
}

export default function HitBuzzerGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const text = hitText(i18n.language);
  const haptics = useHaptics();
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedMatchRef = useRef<string | null>(null);
  const isHost = !online || online.isHost;
  const inParty = new URLSearchParams(location.search).get('party') === 'true';
  const controllerParty = !!online && inParty;
  const [tvConnected] = useTvPresence(online);
  const initialRoster = useInitialRoster({ onlinePlayers: online?.players, min: 2 });
  const [roster, setRoster] = useState<(PlayerSetupPlayer & { avatar?: string })[]>(() => initialRoster?.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar }))
    ?? [{ id: 'p1', name: '' }, { id: 'p2', name: '' }]);
  const [teamMode, setTeamMode] = useState(false);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<HitConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<HitState | null>(null);
  const stateRef = useRef<HitState | null>(null);
  const deckRef = useRef<Song[]>([]);
  const songRef = useRef<Song | null>(null);
  const roundStartRef = useRef<HitState | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawIdRef = useRef(0);
  const seenActions = useRef(new Set<string>());
  const lastDecisionRef = useRef<HitState | null>(null);
  const resolvingRef = useRef(false);
  const audioBlockedRef = useRef(false);
  const answerDisconnectRef = useRef<{ roundId: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [now, setNow] = useState(serverClock.now());
  const [restoreDone, setRestoreDone] = useState(false);
  const leaveGame = useCallback(() => {
    if (controllerParty && stateRef.current?.phase !== 'finished') {
      if (isHost) void abortControllerGame().catch(() => {});
      else void leaveControllerParty(false).then(() => navigate('/party')).catch(() => {});
      return;
    }
    navigate(controllerParty ? '/party/controllers' : inParty ? '/party' : '/games');
  }, [controllerParty, inParty, isHost, navigate]);
  const exit = useConfirmExit(leaveGame);
  useBackGuard(() => {
    if ((!stateRef.current && !controllerParty) || stateRef.current?.phase === 'finished') return false;
    if (exit.open) { exit.cancel(); return true; }
    exit.request();
    return true;
  });

  const flash = useCallback((message: string) => setError(message), []);
  const { previewUrl, previewLoading, loadPreview } = usePreviewLoader(drawIdRef, flash);
  const commit = useCallback((next: HitState | null) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    if (online) return;
    const saved = loadSnapshot<HitSnapshot>('hitbuzzer');
    if (saved?.state && saved.song && Array.isArray(saved.deck) && Array.isArray(saved.roster)
      && saved.config && saved.teams && saved.state.phase !== 'finished') {
      let recovered = saved.state;
      if (['listening', 'paused', 'answering'].includes(recovered.phase)) {
        if (saved.roundStart?.roundId !== recovered.roundId) {
          clearSnapshot('hitbuzzer');
          setRestoreDone(true);
          return;
        }
        recovered = replaceBrokenClip(recovered, saved.roundStart, id());
      }
      deckRef.current = saved.deck;
      roundStartRef.current = null;
      songRef.current = saved.song;
      setSong(saved.song);
      setRoster(saved.roster);
      setConfig(saved.config);
      setTeamMode(saved.teamMode);
      setTeams(saved.teams);
      commit(recovered);
      void loadPreview(saved.song, ++drawIdRef.current);
    }
    setRestoreDone(true);
  }, [online, commit, loadPreview]);

  useEffect(() => {
    if (online || !restoreDone) return;
    if (!state || state.phase === 'finished' || !song) { clearSnapshot('hitbuzzer'); return; }
    saveSnapshot<HitSnapshot>('hitbuzzer', {
      state, song, deck: deckRef.current, roundStart: roundStartRef.current,
      roster, config, teamMode, teams,
    });
  }, [online, restoreDone, state, song, roster, config, teamMode, teams]);

  // The room roster is authoritative in online play. A local party roster is
  // copied once while setup is untouched; manual edits then stay intact.
  const importedRef = useRef(false);
  useEffect(() => {
    if (state || !initialRoster?.length || importedRef.current) return;
    if (!online && roster.some(p => p.name.trim())) { importedRef.current = true; return; }
    setRoster(initialRoster.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar })));
    importedRef.current = true;
  }, [initialRoster, online, roster, state]);

  const prepareSong = useCallback((cards: Song[]) => {
    const next = cards.pop() ?? null;
    deckRef.current = cards;
    songRef.current = next;
    setSong(next);
    setError(next ? null : text.noSongs);
    audioRef.current?.pause();
    if (next) void loadPreview(next, ++drawIdRef.current);
  }, [loadPreview, text.noSongs]);

  useEffect(() => {
    if (isHost && song) {
      setReportContext({ gameId: 'hitbuzzer', contentId: song.id, label: `${song.artist} — ${song.title} (${song.year})` });
    } else if (getReportContext()?.gameId === 'hitbuzzer') {
      clearReportContext();
    }
    return () => {
      if (getReportContext()?.gameId === 'hitbuzzer') clearReportContext();
    };
  }, [isHost, song]);

  const startMatch = useCallback(async () => {
    if (!isHost || busy) return;
    const entrants = (online ? online.players : roster).filter(p => p.name.trim());
    if (entrants.length < 2) { setError(text.needPlayers); return; }
    setBusy(true); setError(null);
    try {
      const deck = await loadHitBuzzerDeck();
      const filtered = config.genre ? deck.filter(s => s.genre === config.genre) : deck;
      if (filtered.length === 0) { setError(text.noSongs); return; }
      const players = entrants.map((p, index) => ({
        id: p.id, name: p.name.trim(), color: p.color || getPlayerColor(index), avatar: p.avatar || p.name.trim().charAt(0),
        teamId: teamMode ? (teams[p.id] || (index % 2 ? 'B' : 'A')) : p.id,
      }));
      seenActions.current.clear();
      lastDecisionRef.current = null;
      commit(createMatch(players, { ...config, rounds: Math.min(config.rounds, filtered.length) }, id(), id()));
      // Prefer the already prepared chart previews; resolver-only songs remain
      // available later in the same shuffled deck.
      prepareSong([...filtered.filter(s => !s.previewUrl), ...filtered.filter(s => !!s.previewUrl)]);
    } catch { setError(text.loadFailed); }
    finally { setBusy(false); }
  }, [isHost, busy, online, roster, text, config, teamMode, teams, commit, prepareSong]);

  const startAudio = useCallback(async () => {
    if (!isHost || stateRef.current?.phase !== 'loading' || !previewUrl || !audioRef.current) return;
    setError(null);
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      const current = stateRef.current;
      if (current?.phase === 'loading') {
        const next = startListening(current);
        roundStartRef.current = next;
        commit(next);
      }
    } catch { setError(text.audioFailed); }
  }, [isHost, previewUrl, commit, text.audioFailed]);

  const pauseAudio = useCallback(() => {
    const current = stateRef.current;
    if (!isHost || !current) return;
    audioRef.current?.pause();
    commit(pauseListening(current));
  }, [isHost, commit]);

  const resumeAudio = useCallback(async () => {
    const current = stateRef.current;
    if (!isHost || current?.phase !== 'paused' || online?.isConnected === false) return;
    try {
      if (audioRef.current) await audioRef.current.play();
      commit(resumeListening(current));
      setError(null);
    } catch { setError(text.audioFailed); }
  }, [isHost, online?.isConnected, commit, text.audioFailed]);

  const endSong = useCallback(() => {
    const current = stateRef.current;
    const card = songRef.current;
    if (!isHost || !current || !card) return;
    audioRef.current?.pause();
    commit(revealRound(current, card.artist, card.title));
  }, [isHost, commit]);

  const handleAudioError = useCallback(() => {
    const current = stateRef.current;
    if (!isHost || !current || current.phase === 'loading') { setError(text.audioFailed); return; }
    const roundStart = roundStartRef.current;
    if (!roundStart) { setError(text.audioFailed); return; }
    const replacement = replaceBrokenClip(current, roundStart, id());
    if (replacement === current) { setError(text.audioFailed); return; }
    audioRef.current?.pause();
    lastDecisionRef.current = null;
    if (deckRef.current.length === 0) {
      commit({ ...replacement, phase: 'finished', revision: replacement.revision + 1 });
      setError(text.noSongs);
    } else {
      commit(replacement);
      prepareSong(deckRef.current);
    }
  }, [isHost, text.audioFailed, text.noSongs, commit, prepareSong]);

  const buzz = useCallback((playerId: string, roundId: string) => {
    const current = stateRef.current;
    if (!isHost || !current || audioRef.current?.paused) return;
    const elapsed = updateElapsed(current, (audioRef.current?.currentTime ?? 0) * 1000);
    const next = acceptBuzz(elapsed, playerId, roundId, serverClock.now());
    if (next.phase !== 'answering') return;
    audioRef.current?.pause();
    lastDecisionRef.current = null;
    commit(next);
    void haptics.medium();
  }, [isHost, commit, haptics]);

  const requestBuzz = useCallback((playerId: string) => {
    if (!state || state.phase !== 'listening' || online?.isConnected === false || pending) return;
    haptics.light();
    if (online && !online.isHost) {
      setPending(playerId);
      online.broadcast('hitbuzzer-action', { type: 'buzz', playerId, roundId: state.roundId, matchId: state.matchId, actionId: id() });
      window.setTimeout(() => setPending(null), 1500);
    } else buzz(playerId, state.roundId);
  }, [state, online, pending, buzz, haptics]);

  const resumeAfter = useCallback(async (next: HitState) => {
    if (next.phase !== 'listening') { commit(next); return; }
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    audioBlockedRef.current = false;
    try {
      if (audioRef.current) await audioRef.current.play();
      commit(next);
    } catch { audioBlockedRef.current = true; setError(text.audioFailed); }
    finally { resolvingRef.current = false; }
  }, [commit, text.audioFailed]);

  const judge = useCallback((correct: boolean) => {
    const current = stateRef.current;
    const card = songRef.current;
    if (!isHost || !current || !card || current.phase !== 'answering' || resolvingRef.current) return;
    lastDecisionRef.current = current;
    const next = judgeBuzz(current, correct, card.artist, card.title);
    void resumeAfter(next);
    if (correct) void haptics.success(); else void haptics.warning();
  }, [isHost, resumeAfter, haptics]);

  const voidClaim = useCallback(() => {
    const current = stateRef.current;
    if (!isHost || !current || resolvingRef.current) return;
    void resumeAfter(voidBuzz(current));
  }, [isHost, resumeAfter]);

  const nextRound = useCallback(() => {
    const current = stateRef.current;
    if (!isHost || !current) return;
    const next = advanceRound(current, id());
    lastDecisionRef.current = null;
    commit(next);
    if (next.phase === 'loading') prepareSong(deckRef.current);
  }, [isHost, commit, prepareSong]);

  const undo = useCallback(() => {
    const current = stateRef.current;
    const before = lastDecisionRef.current;
    if (!isHost || !current || !before || resolvingRef.current) return;
    const restored = undoJudgement(current, before, serverClock.now());
    if (restored === current) return;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = before.elapsedMs / 1000;
    lastDecisionRef.current = null;
    setError(null);
    commit(restored);
  }, [isHost, commit]);

  const skipSong = useCallback(() => {
    if (!isHost || stateRef.current?.phase !== 'loading') return;
    if (deckRef.current.length === 0) { commit({ ...stateRef.current, phase: 'finished', revision: stateRef.current.revision + 1 }); return; }
    prepareSong(deckRef.current);
  }, [isHost, prepareSong, commit]);

  const resetMatch = useCallback(() => {
    if (!isHost || stateRef.current?.phase !== 'finished') return;
    const matchId = stateRef.current.matchId;
    audioRef.current?.pause();
    if (online) online.broadcast('hitbuzzer-state', { state: null, matchId });
    commit(null);
    setSong(null);
    songRef.current = null;
    setError(null);
  }, [isHost, online, commit]);

  // Signed room transport attaches __senderId. The host verifies that the
  // sender owns the claimed seat, including a controlled Joystick guest.
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('hitbuzzer-action', data => {
      if (data.type !== 'buzz' || typeof data.playerId !== 'string' || typeof data.__senderId !== 'string'
        || typeof data.actionId !== 'string' || typeof data.roundId !== 'string') return;
      const sender = data.__senderId;
      const authorized = data.playerId === sender || online.players.some(p => p.id === data.playerId && p.controlledBy === sender);
      const current = stateRef.current;
      if (!authorized || !current || data.matchId !== current.matchId || seenActions.current.has(data.actionId)) return;
      seenActions.current.add(data.actionId);
      buzz(data.playerId, data.roundId);
    });
  }, [online, buzz]);

  useEffect(() => {
    if (!online?.isHost || !state) return;
    online.broadcast('hitbuzzer-state', { state });
  }, [online, state]);
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('hitbuzzer-sync-request', data => {
      if (typeof data.__senderId !== 'string' || !online.players.some(p => p.id === data.__senderId)) return;
      if (stateRef.current) online.broadcast('hitbuzzer-state', { state: stateRef.current });
    });
  }, [online]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('hitbuzzer-state', data => {
      if (data.__senderId !== online.hostPlayerId) return;
      if (data.state === null && data.matchId === stateRef.current?.matchId && stateRef.current?.phase === 'finished') {
        commit(null);
        return;
      }
      const incoming = data.state as HitState | undefined;
      if (!incoming || !Array.isArray(incoming.players) || typeof incoming.revision !== 'number'
        || typeof incoming.matchId !== 'string' || typeof incoming.roundId !== 'string') return;
      const current = stateRef.current;
      if (current && incoming.matchId === current.matchId && (incoming.revision < current.revision
        || (incoming.revision === current.revision && incoming.elapsedMs < current.elapsedMs))) return;
      commit(incoming);
      setPending(null);
    });
  }, [online, commit]);
  useEffect(() => {
    if (!online || online.isHost || online.isConnected === false) return;
    online.broadcast('hitbuzzer-sync-request', { actionId: id() });
  }, [online, online?.isConnected]);

  useEffect(() => {
    if (!online?.isHost || !state || !online.removedPlayerIds?.length) return;
    let next = stateRef.current;
    for (const playerId of online.removedPlayerIds) if (next) next = removePlayer(next, playerId);
    if (next && next !== stateRef.current) {
      if (stateRef.current?.phase === 'answering' && next.phase === 'listening') void resumeAfter(next);
      else commit(next);
    }
  }, [online, state, commit, resumeAfter]);

  useEffect(() => {
    if (isHost && online?.isConnected === false && stateRef.current?.phase === 'listening') pauseAudio();
  }, [isHost, online?.isConnected, state?.phase, pauseAudio]);

  useEffect(() => {
    if (!online?.isHost) return;
    const current = stateRef.current;
    if (online.isConnected === false) {
      if (current?.phase === 'answering' && !answerDisconnectRef.current) {
        answerDisconnectRef.current = { roundId: current.roundId, at: serverClock.now() };
      }
      return;
    }
    const interruption = answerDisconnectRef.current;
    answerDisconnectRef.current = null;
    if (interruption && current?.roundId === interruption.roundId) {
      const extended = extendAnswerDeadline(current, serverClock.now() - interruption.at);
      if (extended !== current) commit(extended);
    }
  }, [online?.isHost, online?.isConnected, state?.phase, commit]);

  useEffect(() => {
    if (!isHost || !stateRef.current) return;
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (!current || online?.isConnected === false) return;
      if (current.phase === 'listening' && audioRef.current && !audioRef.current.paused) {
        const next = updateElapsed(current, Math.floor(audioRef.current.currentTime) * 1000);
        if (next.elapsedMs >= 30_000) endSong();
        else if (next !== current) commit(next);
      } else if (current.phase === 'answering' && current.claim && !resolvingRef.current && !audioBlockedRef.current && serverClock.now() >= current.claim.expiresAt) {
        const card = songRef.current;
        if (card) { lastDecisionRef.current = current; void resumeAfter(judgeBuzz(current, false, card.artist, card.title)); }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [isHost, state?.matchId, online?.isConnected, endSong, commit, resumeAfter]);

  useEffect(() => {
    if (state?.phase !== 'answering') return;
    const timer = window.setInterval(() => setNow(serverClock.now()), 200);
    return () => window.clearInterval(timer);
  }, [state?.phase]);

  const localIds = useMemo(() => state?.players.filter(p => !online || localSeats(online).includes(p.id)).map(p => p.id) ?? [], [state?.players, online]);
  const acceptedClaimRef = useRef<string | null>(null);
  useEffect(() => {
    if (isHost || state?.phase !== 'answering' || !state.claim || !localIds.includes(state.claim.playerId)) return;
    const claimKey = `${state.matchId}:${state.roundId}:${state.claim.playerId}`;
    if (acceptedClaimRef.current === claimKey) return;
    acceptedClaimRef.current = claimKey;
    haptics.medium();
  }, [isHost, state, localIds, haptics]);
  const claimPlayer = state?.players.find(p => p.id === state.claim?.playerId);
  const remaining = Math.max(0, 30 - Math.floor((state?.elapsedMs ?? 0) / 1000));
  const answerLeft = state?.claim ? Math.max(0, Math.ceil((state.claim.expiresAt - now) / 1000)) : 0;
  const teamMatch = useMemo(() => !!state?.players.some((p, index, players) => players.findIndex(other => other.teamId === p.teamId) !== index), [state?.players]);
  const ranked = useMemo(() => (teamMatch
    ? [...new Map((state?.players ?? []).map(p => [p.teamId, { ...p, id: p.teamId, name: `${text.team} ${p.teamId}`, avatar: p.teamId }])).values()]
    : [...(state?.players ?? [])]).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), [state?.players, teamMatch, text.team]);
  useEffect(() => {
    if (state?.phase !== 'finished' || state.players.length < 2 || recordedMatchRef.current === state.matchId) return;
    recordedMatchRef.current = state.matchId;
    // Controller-party completion writes every account's result in one server
    // transaction. Guest phones have no local party session, so skip here too.
    if (online && new URLSearchParams(window.location.search).get('party') === 'true') return;
    const player = online ? state.players.find(p => p.id === online.myPlayerId)
      : [...state.players].sort((a, b) => b.score - a.score)[0];
    if (player) void recordEnd('hitbuzzer', player.score, player.score === Math.max(...state.players.map(p => p.score)));
  }, [state, online, recordEnd]);
  const tvState = useMemo(() => ({
    phase: state?.phase === 'finished' ? 'gameOver' : state?.phase === 'result' ? 'reveal' : state?.phase ?? 'setup',
    round: state?.round ?? 0, totalRounds: state?.config.rounds ?? 15,
    timeLeft: remaining, elapsedMs: state?.elapsedMs ?? 0, players: ranked,
    previewUrl: state && state.phase !== 'finished' ? previewUrl : null,
    partyScoresById: Object.fromEntries((state?.players ?? []).map(p => [p.id, p.score])),
    teams: teamMatch ? [...new Set(state?.players.map(p => p.teamId) ?? [])].map(teamId => ({
      score: state?.players.find(p => p.teamId === teamId)?.score ?? 0,
      players: state?.players.filter(p => p.teamId === teamId).map(p => p.name) ?? [],
    })) : undefined,
    buzzedName: claimPlayer?.name ?? null,
    reveal: state?.phase === 'result' || state?.phase === 'finished'
      ? state.reveal && { ...state.reveal, winnerId: teamMatch ? state.players.find(p => p.id === state.reveal?.winnerId)?.teamId ?? null : state.reveal.winnerId }
      : null,
  }), [state, remaining, previewUrl, claimPlayer?.name, ranked, teamMatch]);
  const tvBridge = useTVGameBridge('hitbuzzer', tvState, [tvState], isHost);
  const tvSpeaker = online ? tvConnected : !!tvBridge?.isActive && tvBridge.lastTvReadyAt > 0 && Date.now() - tvBridge.lastTvReadyAt < 45_000;
  useEffect(() => {
    if (online?.isHost) {
      const { partyScoresById: _partyScoresById, ...publicTvState } = tvState;
      online.broadcast('tv-state', { game: 'hitbuzzer', ...publicTvState });
    }
  }, [online, tvState]);

  return (
    <GameStage gameId="hitbuzzer" className="min-h-[100dvh] bg-[#060810] text-white">
      {isHost && <audio ref={audioRef} src={previewUrl ?? undefined} muted={tvSpeaker} preload="auto" onEnded={endSong} onError={handleAudioError} />}
      <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-5 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6">
        <button type="button" onClick={() => state?.phase === 'finished' ? leaveGame() : state || controllerParty ? exit.request() : leaveGame()} className="flex min-h-11 w-fit items-center gap-2 rounded-full px-3 text-sm text-[#b3a8c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff]"><ArrowLeft className="h-4 w-4" />{controllerParty ? state?.phase === 'finished' ? t('partyPlay.backToLobby') : t(isHost ? 'partyControllers.abort' : 'partyControllers.leave') : inParty ? t('partyPlay.backToLobby') : text.back}</button>
        <ConfirmExitDialog {...exit.dialogProps} accent="#df8eff" title={controllerParty ? t(isHost ? 'partyControllers.abort' : 'partyControllers.leave') : undefined} />
        <StageHeader title={text.name} eyebrow={text.eyebrow} subtitle={state ? `${text.round} ${state.round} / ${state.config.rounds}` : text.tagline} progress={state ? { value: state.round, total: state.config.rounds } : undefined} />
        {error && <p role="alert" className="rounded-2xl border border-[#ff6b98]/40 bg-[#ff6b98]/10 p-4 text-sm text-[#ffd2df]">{error}</p>}

        {!state && isHost && <>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#16101f]">
            <img src="/images/games/hit-buzzer.webp" alt="" className="h-48 w-full object-cover object-center sm:h-56" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#16101f] to-transparent" />
          </div>
          <StagePanel className="space-y-5 p-5">
            <PlayerSetup players={online ? online.players.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, readOnly: true })) : roster} locked={!!online} onAdd={() => setRoster(p => [...p, { id: id(), name: '' }])}
              onRemove={playerId => setRoster(p => p.filter(x => x.id !== playerId))}
              onRename={(playerId, name) => setRoster(p => p.map(x => x.id === playerId ? { ...x, name } : x))}
              min={2} max={20} accent="#df8eff" />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-[#b3a8c9]">{text.goal}
                <select value={config.targetScore ?? 0} onChange={e => setConfig(c => ({ ...c, targetScore: Number(e.target.value) || null }))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#16101f] px-3 text-white">
                  <option value={0}>{text.roundGoal}</option><option value={500}>500 {text.points}</option><option value={750}>750 {text.points}</option><option value={1000}>1000 {text.points}</option>
                </select>
              </label>
              <label className="text-sm text-[#b3a8c9]">{text.rounds}
                <input type="number" min={5} max={30} value={config.rounds} onChange={e => setConfig(c => ({ ...c, rounds: Math.max(5, Math.min(30, Number(e.target.value) || 15)) }))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#16101f] px-3 text-white" />
              </label>
              <label className="text-sm text-[#b3a8c9]">{text.genre}
                <select value={config.genre ?? ''} onChange={e => setConfig(c => ({ ...c, genre: e.target.value || null }))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#16101f] px-3 text-white">
                  <option value="">{text.allGenres}</option>{OHRWURM_GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                </select>
              </label>
              <label className="text-sm text-[#b3a8c9]">{text.answerTime}
                <select value={config.answerSeconds} onChange={e => setConfig(c => ({ ...c, answerSeconds: Number(e.target.value) }))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#16101f] px-3 text-white">
                  {[5, 8, 12].map(n => <option key={n} value={n}>{n} s</option>)}
                </select>
              </label>
              <label className="text-sm text-[#b3a8c9]">{text.penalty}
                <select value={config.penalty} onChange={e => setConfig(c => ({ ...c, penalty: Number(e.target.value) }))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#16101f] px-3 text-white">
                  {[0, 10, 20, 30].map(n => <option key={n} value={n}>−{n}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#16101f] px-3 text-sm text-[#b3a8c9]">
                <input type="checkbox" checked={config.constantPoints} onChange={e => setConfig(c => ({ ...c, constantPoints: e.target.checked }))} className="size-5 accent-[#df8eff]" />{text.constantPoints}
              </label>
            </div>
            <label className="flex min-h-12 items-center gap-3 text-sm"><input type="checkbox" checked={teamMode} onChange={e => setTeamMode(e.target.checked)} className="size-5 accent-[#df8eff]" />{text.teams}</label>
            {teamMode && <div className="grid gap-2">{(online ? online.players : roster).map((p, index) => <label key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#16101f] px-4 py-2 text-sm"><span>{p.name || text.player}</span><select value={teams[p.id] || (index % 2 ? 'B' : 'A')} onChange={e => setTeams(x => ({ ...x, [p.id]: e.target.value }))} className="min-h-11 rounded-xl bg-[#0d0915] px-3"><option value="A">{text.team} A</option><option value="B">{text.team} B</option></select></label>)}</div>}
            <StageAction onClick={() => void startMatch()} disabled={busy} className="w-full"><Play className="h-5 w-5" />{busy ? text.loading : text.start}</StageAction>
          </StagePanel>
        </>}

        {!state && !isHost && <StagePanel className="p-8 text-center text-[#b3a8c9]">{text.waitHost}</StagePanel>}

        {state && <>
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0d0915] px-5 py-4">
            <span className="flex items-center gap-2 font-game font-bold"><Music2 className="h-5 w-5 text-[#df8eff]" />{state.phase === 'loading' ? text.prepare : state.phase === 'listening' ? text.listen : state.phase === 'paused' ? t('games.connectionPaused') : state.phase === 'answering' ? text.answer : state.phase === 'result' ? text.reveal : text.finished}</span>
            <span className="font-game text-2xl font-black tabular-nums text-[#8ff5ff]">{state.phase === 'answering' ? `${answerLeft}s` : state.phase === 'listening' ? `${remaining}s` : ''}</span>
          </div>

          {state.phase === 'loading' && <StagePanel className="space-y-4 p-6 text-center">
            <Volume2 className="mx-auto h-10 w-10 text-[#df8eff]" />
            <p className="text-[#b3a8c9]">{isHost ? previewLoading ? text.findPreview : previewUrl ? text.readyPreview : text.missingPreview : text.waitHost}</p>
            {isHost && <div className="flex flex-col gap-3 sm:flex-row"><StageAction onClick={() => void startAudio()} disabled={!previewUrl} className="w-full sm:flex-1"><Play className="h-5 w-5" />{text.playClip}</StageAction><StageAction variant="secondary" onClick={skipSong} className="w-full sm:flex-1"><SkipForward className="h-5 w-5" />{text.skip}</StageAction></div>}
          </StagePanel>}

          {(state.phase === 'listening' || state.phase === 'paused' || state.phase === 'answering') && <StagePanel className="space-y-5 p-5 text-center">
            {state.phase === 'answering' && <p role="status" className="text-xl font-black text-[#8ff5ff]">{claimPlayer?.name || text.player} — {text.yourAnswer}</p>}
            <div className={`grid gap-3 ${localIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {state.players.filter(p => localIds.includes(p.id)).map(p => <button key={p.id} type="button" onClick={() => requestBuzz(p.id)} disabled={state.phase !== 'listening' || p.locked || !!pending || online?.isConnected === false}
                aria-label={`${text.buzz}: ${p.name}`} className="group flex min-h-32 flex-col items-center justify-center gap-2 rounded-[28px] border border-[#df8eff]/35 bg-[#16101f] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform active:scale-[0.97] enabled:hover:border-[#df8eff] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff]">
                <span className="grid h-16 w-16 place-items-center rounded-full border-[6px] border-[#8ff5ff] bg-[#ff2e88] text-2xl font-black shadow-[0_0_30px_rgba(255,46,136,0.38)]">{p.locked ? '×' : '!'}</span>
                <span className="font-game font-bold">{p.name}</span><span className="text-xs text-[#b3a8c9]">{p.locked ? text.locked : pending === p.id ? text.sent : text.buzz} · {p.score} {text.points}</span>
              </button>)}
            </div>
            {localIds.length === 0 && <p className="text-[#b3a8c9]">{text.watch}</p>}
            {isHost && state.phase === 'listening' && <StageAction variant="secondary" onClick={pauseAudio} className="w-full"><Pause className="h-5 w-5" />{t('games.play.pause')}</StageAction>}
            {isHost && state.phase === 'listening' && lastDecisionRef.current?.roundId === state.roundId && <StageAction variant="ghost" onClick={undo} className="w-full"><RotateCcw className="h-4 w-4" />{t('partyPlay.undo')}</StageAction>}
            {isHost && state.phase === 'paused' && <StageAction onClick={() => void resumeAudio()} disabled={online?.isConnected === false} className="w-full"><Play className="h-5 w-5" />{t('games.play.resume')}</StageAction>}
            {state.phase === 'answering' && isHost && <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              <StageAction onClick={() => judge(true)} className="min-h-14 px-2 text-xs sm:text-sm">{text.correct}</StageAction>
              <StageAction variant="danger" onClick={() => judge(false)} className="min-h-14 px-2 text-xs sm:text-sm">{text.wrong}</StageAction>
              <StageAction variant="secondary" onClick={voidClaim} className="min-h-14 px-2 text-xs sm:text-sm">{text.void}</StageAction>
            </div>}
          </StagePanel>}

          {(state.phase === 'result' || state.phase === 'finished') && <StagePanel className="space-y-5 p-6 text-center">
            {state.reveal && <><p className="text-sm uppercase tracking-[0.2em] text-[#df8eff]">{text.songReveal}</p><p className="font-game text-3xl font-black">{state.reveal.title}</p><p className="text-lg text-[#b3a8c9]">{state.reveal.artist}</p>{state.reveal.winnerId && <p className="text-[#8ff5ff]">{state.players.find(p => p.id === state.reveal?.winnerId)?.name} +{state.reveal.delta}</p>}</>}
            {state.phase === 'finished' && <p className="font-game text-2xl font-black text-[#df8eff]">{text.winner}: {ranked.filter(p => p.score === ranked[0]?.score).map(p => p.name).join(', ')}</p>}
            {isHost && (state.phase === 'result' ? <StageAction onClick={nextRound} className="w-full"><SkipForward className="h-5 w-5" />{state.round >= state.config.rounds || (state.config.targetScore !== null && state.players.some(p => p.score >= state.config.targetScore!)) ? text.showResult : text.next}</StageAction>
              : <StageAction onClick={resetMatch} className="w-full"><RotateCcw className="h-5 w-5" />{text.again}</StageAction>)}
            {isHost && state.phase === 'result' && lastDecisionRef.current?.roundId === state.roundId && <StageAction variant="secondary" onClick={undo} className="w-full"><RotateCcw className="h-4 w-4" />{t('partyPlay.undo')}</StageAction>}
          </StagePanel>}
          {state.phase === 'finished' && <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />}

          <StagePanel className="p-4"><h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#b3a8c9]">{text.standings}</h2><ol className="space-y-2">{ranked.map((p, index) => <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#16101f] px-4 py-3"><span className="w-6 text-[#b3a8c9]">{index + 1}.</span><span className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-[#060810]" style={{ background: p.color }}>{p.avatar}</span><span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span><span className="font-game font-black tabular-nums text-[#8ff5ff]">{p.score}</span></li>)}</ol></StagePanel>
        </>}
      </main>
    </GameStage>
  );
}
