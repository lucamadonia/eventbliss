import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Music2, Pause, Play, RotateCcw, SkipForward, Tv } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useGameEnd } from '../social/useGameEnd';
import { clearReportContext, getReportContext, setReportContext } from '../ui/useReportContext';
import { useBackGuard } from '@/lib/back-guard';
import { GameStage, StageAction, StageHeader, StagePanel } from '../ui/GameStage';
import type { PlayerSetupPlayer } from '../ui/PlayerSetup';
import { getPlayerColor } from '../ui/PlayerAvatars';
import { serverClock } from '../party/scene-clock';
import { abortControllerGame, leaveControllerParty } from '../party/controller-session';
import { useInitialRoster } from '../ui/useInitialRoster';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { usePreviewLoader } from '../ohrwurm/usePreviewLoader';
import { useTvPresence } from '../ohrwurm/useTvPresence';
import { ConfirmExitDialog, useConfirmExit } from '../ui/useConfirmExit';
import { clearSnapshot, loadSnapshot, saveSnapshot } from '../ui/useGameSnapshot';
import type { Song } from '../ohrwurm/ohrwurm-engine';
import { loadHitBuzzerDeck } from './song-pool';
import {
  acceptBuzz, advanceRound, ANSWER_NETWORK_GRACE_MS, canFinishAnswer, canJudgeClaim, createMatch, DEFAULT_CONFIG, extendAnswerDeadline, judgeBuzz, pauseListening, removePlayer,
  replaceBrokenClip, resumeListening, revealRound, reviewBuzz, startListening, undoJudgement, updateElapsed,
  type HitConfig, type HitPlayer, type HitState,
} from './engine';
import { playAnswerTick, unlockAnswerSound } from './answer-sound';
import { hitText } from './strings';
import { HitBuzzerSetup } from './HitBuzzerSetup';
import { HitBuzzerButton } from './HitBuzzerButton';
import { HitBuzzerRoundIntro } from './HitBuzzerRoundIntro';
import { HitBuzzerAnswerCheck } from './HitBuzzerAnswerCheck';
import { HitBuzzerAttempts, HitBuzzerRoundHistory } from './HitBuzzerRoundHistory';
import { roundFlowText } from './round-flow-copy';
import { HIT_TEAM_IDS, mergeEventPlayers, teamForPlayer } from './setup-roster';
import { canBuzzForSeat } from './buzz-access';

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
  teamCount?: number;
  teamNames?: Record<string, string>;
}

interface PrivateSolution { matchId: string; roundId: string; playerId: string; artist: string; title: string }

export default function HitBuzzerGame({ online, onOpenRules }: { online?: OnlineGameProps; onOpenRules: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const text = hitText(i18n.language);
  const flowText = roundFlowText(i18n.language);
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
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<HitConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<HitState | null>(null);
  const stateRef = useRef<HitState | null>(null);
  const deckRef = useRef<Song[]>([]);
  const songRef = useRef<Song | null>(null);
  const roundStartRef = useRef<HitState | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [privateSolution, setPrivateSolution] = useState<PrivateSolution | null>(null);
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
  const [showRulesOnTv, setShowRulesOnTv] = useState(false);
  const [audioStartFailed, setAudioStartFailed] = useState(false);
  const [now, setNow] = useState(serverClock.now());
  const [restoreDone, setRestoreDone] = useState(false);
  const leaveGame = useCallback(() => {
    if (!online) clearSnapshot('hitbuzzer');
    if (controllerParty && stateRef.current?.phase !== 'finished') {
      if (isHost) void abortControllerGame().catch(() => {});
      else void leaveControllerParty(false).then(() => navigate('/party')).catch(() => {});
      return;
    }
    navigate(controllerParty ? '/party/controllers' : inParty ? '/party' : '/games');
  }, [controllerParty, inParty, isHost, navigate, online]);
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
      if (['listening', 'paused', 'answering', 'reviewing'].includes(recovered.phase)) {
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
      setTeamCount(saved.teamCount ?? 2);
      setTeamNames(saved.teamNames ?? {});
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
      roster, config, teamMode, teams, teamCount, teamNames,
    });
  }, [online, restoreDone, state, song, roster, config, teamMode, teams, teamCount, teamNames]);

  // The room roster is authoritative in online play. A local party roster is
  // copied once while setup is untouched; manual edits then stay intact.
  const importedRef = useRef(false);
  useEffect(() => {
    if (!online && !restoreDone) return;
    if (state || !initialRoster?.length || importedRef.current) return;
    if (!online && roster.some(p => p.name.trim())) { importedRef.current = true; return; }
    setRoster(initialRoster.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar })));
    importedRef.current = true;
  }, [initialRoster, online, restoreDone, roster, state]);

  const importNames = useCallback((names: string[]) => {
    if (online) return;
    setRoster(previous => mergeEventPlayers(previous, names, id));
  }, [online]);

  const prepareSong = useCallback((cards: Song[]) => {
    const next = cards.pop() ?? null;
    deckRef.current = cards;
    songRef.current = next;
    setSong(next);
    setError(next ? null : text.noSongs);
    setAudioStartFailed(false);
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
    if (entrants.length < 2 || entrants.length !== (online ? online.players : roster).length) { setError(text.needPlayers); return; }
    const groupIds = HIT_TEAM_IDS.slice(0, teamCount);
    const memberTeam = (playerId: string, index: number) => teamForPlayer(playerId, index, teams, teamCount);
    if (teamMode && groupIds.some(teamId => !entrants.some((player, index) => memberTeam(player.id, index) === teamId)
      || !(teamNames[teamId] ?? `${text.team} ${teamId}`).trim())) { setError(t('games.ohrwurm.emptyTeam')); return; }
    setBusy(true); setError(null);
    try {
      const deck = await loadHitBuzzerDeck();
      const filtered = config.genre ? deck.filter(s => s.genre === config.genre) : deck;
      if (filtered.length === 0) { setError(text.noSongs); return; }
      const players = entrants.map((p, index) => ({
        id: p.id, name: p.name.trim(), color: p.color || getPlayerColor(index), avatar: p.avatar || p.name.trim().charAt(0),
        teamId: teamMode ? memberTeam(p.id, index) : p.id,
        teamName: teamMode ? (teamNames[memberTeam(p.id, index)] ?? `${text.team} ${memberTeam(p.id, index)}`).trim() : undefined,
      }));
      seenActions.current.clear();
      lastDecisionRef.current = null;
      commit(createMatch(players, { ...config, rounds: Math.min(config.rounds, filtered.length) }, id(), id()));
      // Prefer the already prepared chart previews; resolver-only songs remain
      // available later in the same shuffled deck.
      prepareSong([...filtered.filter(s => !s.previewUrl), ...filtered.filter(s => !!s.previewUrl)]);
    } catch { setError(text.loadFailed); }
    finally { setBusy(false); }
  }, [isHost, busy, online, roster, text, config, teamMode, teams, teamCount, teamNames, commit, prepareSong, t]);

  const startAudio = useCallback(async () => {
    if (!isHost || stateRef.current?.phase !== 'loading' || !previewUrl || !audioRef.current) return;
    setError(null);
    setAudioStartFailed(false);
    setShowRulesOnTv(false);
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      const current = stateRef.current;
      if (current?.phase === 'loading') {
        const next = startListening(current);
        roundStartRef.current = next;
        commit(next);
      }
    } catch { setAudioStartFailed(true); setError(text.audioFailed); }
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
    setPrivateSolution(null);
    lastDecisionRef.current = null;
    commit(next);
    void haptics.medium();
  }, [isHost, commit, haptics]);

  const requestBuzz = useCallback((playerId: string) => {
    if (!state || state.phase !== 'listening' || online?.isConnected === false || pending) return;
    unlockAnswerSound();
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

  const sendSolution = useCallback((current: HitState, playerId: string, recipient?: string) => {
    const card = songRef.current;
    if (!card || current.phase !== 'reviewing' || current.claim?.playerId !== playerId) return;
    const solution: PrivateSolution = { matchId: current.matchId, roundId: current.roundId, playerId, artist: card.artist, title: card.title };
    if (!online || localSeats(online).includes(playerId)) setPrivateSolution(solution);
    else online.broadcastTo?.(recipient ?? online.players.find(p => p.id === playerId)?.controlledBy ?? playerId, 'hitbuzzer-solution', solution);
  }, [online]);

  const finishSpokenAnswer = useCallback((playerId: string, roundId: string) => {
    const current = stateRef.current;
    if (!isHost || !current || !songRef.current || resolvingRef.current) return;
    if (online && !localSeats(online).includes(playerId) && !online.broadcastTo) return;
    const next = reviewBuzz(current, playerId, roundId, serverClock.now());
    if (next === current) return;
    commit(next);
    sendSolution(next, playerId);
  }, [isHost, online, commit, sendSolution]);

  const requestSolution = useCallback(() => {
    const current = stateRef.current;
    const playerId = current?.claim?.playerId;
    if (!current || !playerId || !canFinishAnswer(current, playerId, current.roundId, serverClock.now())
      || online?.isConnected === false || (online && !localSeats(online).includes(playerId))) return;
    if (online && !online.isHost) online.broadcast('hitbuzzer-action', { type: 'spoken', playerId, roundId: current.roundId,
      matchId: current.matchId, actionId: id() });
    else finishSpokenAnswer(playerId, current.roundId);
  }, [online, finishSpokenAnswer]);

  const judge = useCallback((correct: boolean, playerId: string, roundId: string) => {
    const current = stateRef.current;
    const card = songRef.current;
    if (!isHost || !current || !card || !canJudgeClaim(current, playerId, roundId, serverClock.now()) || resolvingRef.current) return;
    lastDecisionRef.current = current;
    setPrivateSolution(null);
    const next = judgeBuzz(current, correct, card.artist, card.title);
    void resumeAfter(next);
    if (correct) void haptics.success(); else void haptics.warning();
  }, [isHost, resumeAfter, haptics]);

  const requestJudgement = useCallback((correct: boolean) => {
    const current = stateRef.current;
    const playerId = current?.claim?.playerId;
    if (!current || !playerId || !privateSolution || privateSolution.matchId !== current.matchId
      || privateSolution.roundId !== current.roundId || privateSolution.playerId !== playerId
      || !canJudgeClaim(current, playerId, current.roundId, serverClock.now())
      || online?.isConnected === false) return;
    if (online && !online.isHost) {
      if (!localSeats(online).includes(playerId)) return;
      online.broadcast('hitbuzzer-action', { type: 'judge', playerId, roundId: current.roundId,
        matchId: current.matchId, correct, actionId: id() });
    } else judge(correct, playerId, current.roundId);
  }, [online, judge, privateSolution]);

  const nextRound = useCallback(() => {
    const current = stateRef.current;
    if (!isHost || !current) return;
    const next = advanceRound(current, id());
    lastDecisionRef.current = null;
    setShowRulesOnTv(false);
    setPrivateSolution(null);
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
    setPrivateSolution(null);
    commit(restored);
    if (restored.phase === 'reviewing') sendSolution(restored, restored.claim!.playerId);
  }, [isHost, commit, sendSolution]);

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
    setPrivateSolution(null);
    songRef.current = null;
    setShowRulesOnTv(false);
    setError(null);
  }, [isHost, online, commit]);

  // Signed room transport attaches __senderId. The host verifies that the
  // sender owns the claimed seat, including a controlled Joystick guest.
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('hitbuzzer-action', data => {
      if ((data.type !== 'buzz' && data.type !== 'spoken' && data.type !== 'judge') || typeof data.playerId !== 'string' || typeof data.__senderId !== 'string'
        || typeof data.actionId !== 'string' || typeof data.roundId !== 'string') return;
      const sender = data.__senderId;
      const authorized = canBuzzForSeat(online.players, sender, data.playerId);
      const current = stateRef.current;
      if (!authorized || !current || data.matchId !== current.matchId || seenActions.current.has(data.actionId)) return;
      seenActions.current.add(data.actionId);
      if (data.type === 'buzz') buzz(data.playerId, data.roundId);
      else if (data.type === 'spoken') finishSpokenAnswer(data.playerId, data.roundId);
      else if (typeof data.correct === 'boolean') judge(data.correct, data.playerId, data.roundId);
    });
  }, [online, buzz, finishSpokenAnswer, judge]);

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
    if (!online?.isHost) return;
    return online.onBroadcast('hitbuzzer-solution-request', data => {
      const current = stateRef.current;
      if (typeof data.__senderId !== 'string' || typeof data.playerId !== 'string' || !current
        || data.matchId !== current.matchId || data.roundId !== current.roundId
        || current.phase !== 'reviewing' || current.claim?.playerId !== data.playerId
        || !canBuzzForSeat(online.players, data.__senderId, data.playerId)) return;
      sendSolution(current, data.playerId, data.__senderId);
    });
  }, [online, sendSolution]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('hitbuzzer-solution', data => {
      const current = stateRef.current;
      if (data.__senderId !== online.hostPlayerId || !current || !current.claim
        || (current.phase !== 'answering' && current.phase !== 'reviewing')
        || data.matchId !== current.matchId || data.roundId !== current.roundId
        || data.playerId !== current.claim.playerId || !localSeats(online).includes(data.playerId)
        || typeof data.artist !== 'string' || typeof data.title !== 'string') return;
      setPrivateSolution({ matchId: current.matchId, roundId: current.roundId,
        playerId: data.playerId, artist: data.artist, title: data.title });
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
      if ((stateRef.current?.phase === 'answering' || stateRef.current?.phase === 'reviewing') && next.phase === 'listening') void resumeAfter(next);
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
      } else if (current.phase === 'answering' && current.claim && !resolvingRef.current && !audioBlockedRef.current
        && serverClock.now() >= current.claim.expiresAt + ANSWER_NETWORK_GRACE_MS) {
        const card = songRef.current;
        if (card) { lastDecisionRef.current = current; void resumeAfter(judgeBuzz(current, false, card.artist, card.title, true)); }
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
  useEffect(() => {
    setPrivateSolution(previous => previous && state && (state.phase === 'answering' || state.phase === 'reviewing')
      && previous.matchId === state.matchId && previous.roundId === state.roundId
      && previous.playerId === state.claim?.playerId ? previous : null);
  }, [state]);
  useEffect(() => {
    if (!online || online.isHost || online.isConnected === false || state?.phase !== 'reviewing' || !state.claim
      || !localIds.includes(state.claim.playerId)
      || (privateSolution?.matchId === state.matchId && privateSolution.roundId === state.roundId
        && privateSolution.playerId === state.claim.playerId)) return;
    const request = () => online.broadcast('hitbuzzer-solution-request', {
      matchId: state.matchId, roundId: state.roundId, playerId: state.claim!.playerId, actionId: id(),
    });
    request();
    const retry = window.setInterval(request, 2000);
    return () => window.clearInterval(retry);
  }, [online, state, localIds, privateSolution]);
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
  useEffect(() => {
    if (state?.phase !== 'answering' || !state.claim || answerLeft < 1
      || !localIds.includes(state.claim.playerId) || tvConnected) return;
    playAnswerTick(answerLeft <= 3);
    if (answerLeft <= 3) haptics.light();
  }, [state?.phase, state?.claim, answerLeft, localIds, tvConnected, haptics]);
  const teamMatch = useMemo(() => !!state?.players.some(player => !!player.teamName), [state?.players]);
  const ranked = useMemo(() => (teamMatch
    ? [...new Map((state?.players ?? []).map(p => [p.teamId, { ...p, id: p.teamId, name: p.teamName || `${text.team} ${p.teamId}`, avatar: p.teamId }])).values()]
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
    rulesOnTv: isHost && showRulesOnTv,
    partyScoresById: Object.fromEntries((state?.players ?? []).map(p => [p.id, p.score])),
    teams: teamMatch ? [...new Set(state?.players.map(p => p.teamId) ?? [])].map(teamId => ({
      name: state?.players.find(p => p.teamId === teamId)?.teamName ?? `${text.team} ${teamId}`,
      score: state?.players.find(p => p.teamId === teamId)?.score ?? 0,
      players: state?.players.filter(p => p.teamId === teamId).map(p => p.name) ?? [],
    })) : undefined,
    buzzedName: claimPlayer?.name ?? null,
    answerLeft: state?.phase === 'answering' ? answerLeft : null,
    answerDeadline: state?.claim?.expiresAt ?? null,
    answerSeconds: state?.config.answerSeconds ?? DEFAULT_CONFIG.answerSeconds,
    answerMode: state?.config.answerMode ?? DEFAULT_CONFIG.answerMode,
    lastAttempt: state?.attempts?.at(-1) ?? null,
    attempts: state?.phase === 'result' || state?.phase === 'finished' ? state.attempts ?? [] : [],
    reveal: state?.phase === 'result' || state?.phase === 'finished'
      ? state.reveal && { ...state.reveal, winnerId: teamMatch ? state.players.find(p => p.id === state.reveal?.winnerId)?.teamId ?? null : state.reveal.winnerId }
      : null,
  }), [state, remaining, previewUrl, isHost, showRulesOnTv, claimPlayer?.name, ranked, teamMatch, text.team, answerLeft]);
  const tvBridge = useTVGameBridge('hitbuzzer', tvState, [tvState], isHost);
  const tvSpeaker = online ? tvConnected : !!tvBridge?.isActive && tvBridge.lastTvReadyAt > 0 && Date.now() - tvBridge.lastTvReadyAt < 45_000;
  const toggleTvRules = useCallback(() => {
    if (!isHost || !tvSpeaker) return;
    if (!showRulesOnTv && stateRef.current?.phase === 'listening') pauseAudio();
    setShowRulesOnTv(value => !value);
  }, [isHost, tvSpeaker, showRulesOnTv, pauseAudio]);
  useEffect(() => {
    if (online?.isHost) {
      const { partyScoresById: _partyScoresById, ...publicTvState } = tvState;
      online.broadcast('tv-state', { game: 'hitbuzzer', ...publicTvState });
    }
  }, [online, tvState]);

  return (
    <GameStage gameId="hitbuzzer" className="min-h-[100dvh] bg-[#060810] text-white">
      {isHost && <audio ref={audioRef} src={previewUrl ?? undefined} muted={tvSpeaker} preload="auto" onEnded={endSong} onError={handleAudioError} />}
      <main className={`mx-auto flex min-h-[100dvh] flex-col gap-5 px-1 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 ${!state && isHost ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => state?.phase === 'finished' ? leaveGame() : state || controllerParty ? exit.request() : leaveGame()} className="flex min-h-11 w-fit items-center gap-2 rounded-full px-3 text-sm text-[#b3a8c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff]"><ArrowLeft className="h-4 w-4" />{controllerParty ? state?.phase === 'finished' ? t('partyPlay.backToLobby') : t(isHost ? 'partyControllers.abort' : 'partyControllers.leave') : inParty ? t('partyPlay.backToLobby') : text.back}</button>
          <div className="flex flex-wrap items-center gap-2">
            {state && <button type="button" disabled={state.phase === 'answering' || state.phase === 'reviewing'} onClick={() => { if (isHost && state.phase === 'listening') pauseAudio(); onOpenRules(); }} className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-[#16101f] px-3 text-xs font-bold text-white/85 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff]"><BookOpen className="h-4 w-4 text-[#df8eff]" aria-hidden="true" />{t('gameRules.howToPlay')}</button>}
            {isHost && tvSpeaker && <button type="button" aria-pressed={showRulesOnTv} disabled={state?.phase === 'answering' || state?.phase === 'reviewing'} onClick={toggleTvRules} className="flex min-h-11 items-center gap-2 rounded-full border border-[#8ff5ff]/30 bg-[#8ff5ff]/10 px-3 text-xs font-bold text-[#8ff5ff] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff]"><Tv className="h-4 w-4" aria-hidden="true" />{showRulesOnTv ? t('tv.remote.game') : `${t('tv.remote.rules')} · TV`}</button>}
          </div>
        </div>
        <ConfirmExitDialog {...exit.dialogProps} accent="#df8eff" title={controllerParty ? t(isHost ? 'partyControllers.abort' : 'partyControllers.leave') : undefined} />
        {(state || !isHost) && <StageHeader title={text.name} eyebrow={text.eyebrow} subtitle={state ? `${text.round} ${state.round} / ${state.config.rounds}` : text.tagline} progress={state ? { value: state.round, total: state.config.rounds } : undefined} />}
        {error && <p role="alert" className="rounded-2xl border border-[#ff6b98]/40 bg-[#ff6b98]/10 p-4 text-sm text-[#ffd2df]">{error}</p>}

        {!state && isHost && <HitBuzzerSetup text={text} config={config} setConfig={setConfig}
          players={online ? online.players.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, readOnly: true })) : roster}
          locked={!!online} onAdd={() => setRoster(p => [...p, { id: id(), name: '' }])}
          onRemove={playerId => setRoster(p => p.filter(x => x.id !== playerId))}
          onRename={(playerId, name) => setRoster(p => p.map(x => x.id === playerId ? { ...x, name } : x))}
          onImportNames={importNames}
          teamMode={teamMode} setTeamMode={setTeamMode} teams={teams} setTeams={setTeams}
          teamCount={teamCount} setTeamCount={setTeamCount} teamNames={teamNames} setTeamNames={setTeamNames}
          onStart={() => void startMatch()} onOpenRules={onOpenRules} busy={busy} />}

        {!state && !isHost && <StagePanel className="p-8 text-center text-[#b3a8c9]">{text.waitHost}</StagePanel>}

        {state && <>
          {state.phase !== 'loading' && <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0d0915] px-5 py-4">
            <span className="flex items-center gap-2 font-game font-bold"><Music2 className="h-5 w-5 text-[#df8eff]" />{state.phase === 'listening' ? text.listen : state.phase === 'paused' ? t('games.connectionPaused') : state.phase === 'answering' || state.phase === 'reviewing' ? text.answer : state.phase === 'result' ? text.reveal : text.finished}</span>
            <span className="font-game text-2xl font-black tabular-nums text-[#8ff5ff]">{state.phase === 'answering' ? `${answerLeft}s` : state.phase === 'listening' ? `${remaining}s` : ''}</span>
          </div>}

          {state.phase === 'loading' && <HitBuzzerRoundIntro round={state.round} total={state.config.rounds} isHost={isHost}
            loading={previewLoading} ready={!!previewUrl} failed={audioStartFailed}
            labels={{ round: text.round, startNow: flowText.startNow, otherSong: flowText.otherSong, ready: flowText.ready,
              finding: flowText.finding, unavailable: flowText.unavailable, waiting: flowText.waiting,
              challenge: flowText.challenge, promise: state.config.answerMode === 'title' ? flowText.modeTitleHint
                : state.config.answerMode === 'artist' ? flowText.modeArtistHint : flowText.modeBothHint }}
            onStart={() => void startAudio()} onReplace={skipSong} />}

          {(state.phase === 'listening' || state.phase === 'paused') && <StagePanel className="space-y-5 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#df8eff]">{state.config.answerMode === 'title' ? flowText.modeTitle
              : state.config.answerMode === 'artist' ? flowText.modeArtist : flowText.modeBoth}</p>
            <div className={`grid gap-3 ${localIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {state.players.filter(p => localIds.includes(p.id)).map(p => <HitBuzzerButton key={p.id} name={p.name} score={p.score} pointsLabel={text.points}
                buzzLabel={text.buzz} lockedLabel={text.locked} sentLabel={text.sent} answerLabel={text.answer} locked={p.locked} pending={pending === p.id}
                claimed={false}
                disabled={state.phase !== 'listening' || p.locked || !!pending || online?.isConnected === false}
                large={localIds.length === 1} onClick={() => requestBuzz(p.id)} />)}
            </div>
            {localIds.length === 0 && <p className="text-[#b3a8c9]">{text.watch}</p>}
            {isHost && state.phase === 'listening' && <StageAction variant="secondary" onClick={pauseAudio} className="w-full"><Pause className="h-5 w-5" />{t('games.play.pause')}</StageAction>}
            {isHost && state.phase === 'listening' && lastDecisionRef.current?.roundId === state.roundId && <StageAction variant="ghost" onClick={undo} className="w-full"><RotateCcw className="h-4 w-4" />{t('partyPlay.undo')}</StageAction>}
            {isHost && state.phase === 'paused' && <StageAction onClick={() => void resumeAudio()} disabled={online?.isConnected === false} className="w-full"><Play className="h-5 w-5" />{t('games.play.resume')}</StageAction>}
          </StagePanel>}

          {(state.phase === 'answering' || state.phase === 'reviewing') && <HitBuzzerAnswerCheck
            playerName={claimPlayer?.name || text.player} secondsLeft={answerLeft} totalSeconds={state.config.answerSeconds}
            phase={state.phase} mode={state.config.answerMode ?? DEFAULT_CONFIG.answerMode}
            solution={state.phase === 'reviewing' && privateSolution?.matchId === state.matchId
              && privateSolution.roundId === state.roundId && privateSolution.playerId === state.claim?.playerId ? privateSolution : null}
            isClaimant={!!state.claim && localIds.includes(state.claim.playerId) && online?.isConnected !== false}
            onSpoken={requestSolution}
            onCorrect={() => requestJudgement(true)} onWrong={() => requestJudgement(false)}
            labels={{ ...flowText, correct: text.correct, wrong: text.wrong }} />}

          {(state.phase === 'result' || state.phase === 'finished') && <StagePanel className="space-y-5 p-6 text-center">
            {state.reveal && <><p className="text-sm uppercase tracking-[0.2em] text-[#df8eff]">{text.songReveal}</p><p className="font-game text-3xl font-black">{state.reveal.title}</p><p className="text-lg text-[#b3a8c9]">{state.reveal.artist}</p>{state.reveal.winnerId && <p className="text-[#8ff5ff]">{state.players.find(p => p.id === state.reveal?.winnerId)?.name} +{state.reveal.delta}</p>}</>}
            {state.reveal && <HitBuzzerAttempts attempts={state.attempts ?? []} labels={{ round: text.round, history: flowText.history, correct: text.correct, wrong: text.wrong, timeout: flowText.timeout, noAttempts: flowText.noAttempts }} />}
            {state.phase === 'finished' && <p className="font-game text-2xl font-black text-[#df8eff]">{text.winner}: {ranked.filter(p => p.score === ranked[0]?.score).map(p => p.name).join(', ')}</p>}
            {isHost && (state.phase === 'result' ? <StageAction onClick={nextRound} className="w-full"><SkipForward className="h-5 w-5" />{state.round >= state.config.rounds || (state.config.targetScore !== null && state.players.some(p => p.score >= state.config.targetScore!)) ? text.showResult : text.next}</StageAction>
              : <StageAction onClick={resetMatch} className="w-full"><RotateCcw className="h-5 w-5" />{text.again}</StageAction>)}
            {isHost && state.phase === 'result' && lastDecisionRef.current?.roundId === state.roundId && <StageAction variant="secondary" onClick={undo} className="w-full"><RotateCcw className="h-4 w-4" />{t('partyPlay.undo')}</StageAction>}
          </StagePanel>}
          {state.phase === 'finished' && <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />}

          <StagePanel className="p-4"><h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#b3a8c9]">{text.standings}</h2><ol className="space-y-2">{ranked.map((p, index) => <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#16101f] px-4 py-3"><span className="w-6 text-[#b3a8c9]">{index + 1}.</span><span className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-[#060810]" style={{ background: p.color }}>{p.avatar}</span><span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span><span className="font-game font-black tabular-nums text-[#8ff5ff]">{p.score}</span></li>)}</ol></StagePanel>
          <HitBuzzerRoundHistory history={state.history ?? []} expanded={state.phase === 'finished'}
            labels={{ round: text.round, history: flowText.history, correct: text.correct, wrong: text.wrong, timeout: flowText.timeout, noAttempts: flowText.noAttempts }} />
        </>}
      </main>
    </GameStage>
  );
}
