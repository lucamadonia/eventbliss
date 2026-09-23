import { useSyncExternalStore } from 'react';
import { gameRoomSession } from '@/games/multiplayer/useGameRoom';
import type { PartyRoomAccess } from '@/games/multiplayer/party-access';
import { replaceControllerPartySession } from '@/hooks/usePartySession';
import { createPartySession, createPartyPlayer, type PartySession } from './session-schema';
import { placementPoints } from './scoring';
import { controllerRequest, type ControllerPartyData } from './controller-api';
import { readControllerResults, writeControllerResults, type PendingControllerResult } from './controller-outbox';

interface ControllerState { data: ControllerPartyData | null; error: string | null; busy: boolean; pendingResults: number }
const empty: ControllerState = { data: null, error: null, busy: false, pendingResults: 0 };
let state = empty;
let accountId = '';
let poll: ReturnType<typeof setInterval> | undefined;
let refreshPending: Promise<ControllerPartyData> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const pendingResults = new Map<string, PendingControllerResult>();
let removeOnlineListener: (() => void) | undefined;
function publish(update: Partial<ControllerState>) { state = { ...state, ...update }; listeners.forEach(fn => fn()); }
export const getControllerState = () => state;
export const subscribeControllers = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useControllerParty() { return useSyncExternalStore(subscribeControllers, getControllerState, () => empty); }

/** Derive standings from unique server results, never from names or guest reports. */
export function controllerPartySession(data: ControllerPartyData): PartySession {
  const session = createPartySession(data.party.id);
  const createdAt = Date.parse(data.party.created_at ?? '');
  session.createdAt = Number.isFinite(createdAt) ? createdAt : 0;
  session.playMode = 'controllers'; session.roomCode = data.party.code; session.tvCode = data.party.code;
  session.playlist = data.party.playlist;
  session.playlistIndex = Math.min(data.results.length, session.playlist.length);
  session.playlistActive = session.playlistIndex < session.playlist.length;
  session.currentGameId = data.party.status === 'playing' ? data.party.current_game_id : null;
  session.players = data.members.filter(m => data.party.host_plays || !m.is_host).map((member, i) => createPartyPlayer(member.player_id, member.name, i));
  session.archivedPlayers = (data.past_members ?? []).filter(m => !session.players.some(p => p.id === m.player_id) && (data.party.host_plays || !m.is_host))
    .map((member, i) => createPartyPlayer(member.player_id, member.name, i + session.players.length));
  const standingsPlayers = [...session.players, ...session.archivedPlayers];
  const seen = new Set<string>();
  for (const result of data.results) {
    if (seen.has(result.match_id)) continue;
    seen.add(result.match_id);
    const points = result.scored ? placementPoints(result.scores) : {};
    const best = Math.max(...Object.values(result.scores));
    const winners = result.scored ? Object.keys(result.scores).filter(id => result.scores[id] === best) : [];
    for (const player of standingsPlayers) {
      if (!(player.id in result.scores)) continue;
      player.totalScore += points[player.id] ?? 0;
      player.gamesPlayed++;
      if (winners.includes(player.id)) player.gamesWon++;
    }
    session.gameHistory.push({ matchId: result.match_id, gameId: result.game_id, gameName: result.game_id,
      winnerId: winners[0] ?? '', winnerName: standingsPlayers.find(p => p.id === winners[0])?.name ?? '',
      scores: result.scores, points, scored: result.scored, playedAt: Date.parse(result.created_at) });
  }
  return session;
}
function accept(data: ControllerPartyData) {
  if (state.data?.party.id === data.party.id && state.data.party.revision > data.party.revision) return state.data;
  publish({ data, error: null });
  replaceControllerPartySession(controllerPartySession(data));
  gameRoomSession.configureParty(accessFor(data));
  return data;
}
function persistResults() {
  if (state.data) writeControllerResults(accountId, state.data.party.id, [...pendingResults.values()]);
  publish({ pendingResults: pendingResults.size });
}
function reconcileResults(data: ControllerPartyData) {
  for (const [id] of pendingResults) {
    if (data.results.some(result => result.match_id === id) || data.party.status !== 'playing' || data.party.current_match_id !== id) pendingResults.delete(id);
  }
  persistResults();
}
async function refresh(): Promise<ControllerPartyData> {
  if (refreshPending) return refreshPending;
  const code = state.data?.party.code;
  if (!code) throw new Error('No controller party');
  const current = generation;
  const task = controllerRequest('read', code).then(data => {
    if (current !== generation) throw new Error('Party changed');
    const accepted = accept(data);
    reconcileResults(accepted);
    const room = gameRoomSession.getSnapshot().room;
    // The write may have committed even when its HTTP acknowledgement was lost.
    if (accepted.party.host_user_id === accountId && accepted.party.status !== 'playing' && room?.roomCode === code && room.status === 'playing') gameRoomSession.finishPartyGame();
    return accepted;
  }).finally(() => { if (refreshPending === task) refreshPending = null; });
  refreshPending = task;
  return refreshPending;
}
function accessFor(data: ControllerPartyData): PartyRoomAccess {
  return { code: data.party.code, hostId: data.party.host_player_id, hostPlays: data.party.host_plays,
    premium: data.party.premium, memberIds: data.members.map(m => m.player_id),
    refresh: async () => accessFor(await refresh()),
    start: async (gameId, participantIds) => {
      const current = generation;
      const next = await controllerRequest('start', data.party.code, { game_id: gameId, participant_ids: participantIds });
      if (current !== generation) throw new Error('Party changed');
      accept(next);
      if (!next.party.current_match_id) throw new Error('Match not created');
      return next.party.current_match_id;
    },
  };
}
async function connect(data: ControllerPartyData, name: string, current: number) {
  if (current !== generation) return;
  accept(data);
  const host = data.party.host_user_id === accountId;
  pendingResults.clear();
  if (host) for (const result of readControllerResults(accountId, data.party.id)) pendingResults.set(result.match_id, result);
  reconcileResults(data);
  if (host) await gameRoomSession.createPartyRoom(data.party.code, name);
  else await gameRoomSession.joinRoom(data.party.code, name);
  if (current !== generation) return;
  try { localStorage.setItem(`controller_party:${accountId}`, data.party.code); } catch { /* optional */ }
  if (poll) clearInterval(poll);
  removeOnlineListener?.();
  if (typeof window !== 'undefined') {
    const retry = () => { if (current === generation) void refresh().then(() => flushResults()).catch(() => {}); };
    window.addEventListener('online', retry);
    removeOnlineListener = () => window.removeEventListener('online', retry);
  }
  poll = setInterval(() => {
    void refresh().then(() => flushResults()).catch(error => { if (current === generation) publish({ error: error instanceof Error ? error.message : String(error) }); });
  }, 4000);
  void flushResults();
}
async function run(task: () => Promise<void>) {
  const current = generation;
  publish({ busy: true, error: null });
  try { await task(); } catch (error) { if (current === generation) publish({ error: error instanceof Error ? error.message : String(error) }); throw error; }
  finally { if (current === generation) publish({ busy: false }); }
}
export async function openControllerParty(userId: string, name: string, code?: string, hostPlays = true) {
  if (state.busy) return;
  const current = ++generation;
  await run(async () => {
    accountId = userId;
    const playerId = await gameRoomSession.prepareAccountIdentity(userId);
    if (current !== generation) return;
    const data = await controllerRequest(code ? 'join' : 'create', code ?? null, { player_id: playerId, name, host_plays: hostPlays });
    if (current !== generation) return;
    await connect(data, name, current);
  });
}
export async function setControllerPlaylist(playlist: string[]) {
  if (!state.data) return;
  const current = generation, code = state.data.party.code;
  await run(async () => { const data = await controllerRequest('playlist', code, { playlist }); if (current === generation) accept(data); });
}
export async function startControllerGame(gameId: string) {
  await run(async () => {
    if (!await gameRoomSession.startGame(gameId)) throw new Error('partyControllers.notReady');
  });
}
export function recordControllerResult(gameId: string, scores: Record<string, number>, scored: boolean): boolean {
  const data = state.data;
  const room = gameRoomSession.getSnapshot();
  if (!data || data.party.host_user_id !== accountId || !room.room || room.room.status !== 'playing') return false;
  const matchId = room.room.sessionId;
  if (data.results.some(result => result.match_id === matchId)) return true;
  if (data.party.current_match_id !== matchId || data.party.current_game_id !== gameId || data.party.status !== 'playing') return false;
  const ids = room.room.participantIds;
  if (!ids.length || Object.keys(scores).length !== ids.length || ids.some(id => !Number.isFinite(scores[id]))) return false;
  if (!pendingResults.has(matchId)) pendingResults.set(matchId, { match_id: matchId, game_id: gameId, scores: { ...scores }, scored });
  persistResults();
  void flushResults();
  return true;
}
let flushingGeneration: number | null = null;
async function flushResults() {
  if (flushingGeneration === generation || !state.data || state.data.party.host_user_id !== accountId) return;
  const current = generation;
  flushingGeneration = current;
  const code = state.data.party.code;
  try {
    for (const [id, payload] of pendingResults) {
      const data = await controllerRequest('finish', code, { ...payload });
      if (current !== generation) return;
      pendingResults.delete(id); accept(data); persistResults();
      // A delayed acknowledgement must never close a later match after an abort.
      const activeRoom = gameRoomSession.getSnapshot().room;
      if (activeRoom?.status === 'playing' && activeRoom.sessionId === id) gameRoomSession.finishPartyGame();
    }
  } catch (error) { if (current === generation) publish({ error: error instanceof Error ? error.message : String(error) }); }
  finally { if (flushingGeneration === current) flushingGeneration = null; }
}
export async function abortControllerGame() {
  if (!state.data) return;
  const current = generation, code = state.data.party.code;
  await run(async () => {
    const data = await controllerRequest('abort', code);
    if (current !== generation) return;
    accept(data); reconcileResults(data);
    gameRoomSession.finishPartyGame();
  });
}
export async function leaveControllerParty(end = false) {
  await run(async () => {
    const current = generation;
    if (state.data) await controllerRequest(end ? 'end' : 'leave', state.data.party.code);
    if (current === generation) { pendingResults.clear(); persistResults(); stopControllerParty(); }
  });
}
export async function retryControllerConnection() {
  if (!state.data) return;
  const data = state.data, current = generation;
  const member = data.members.find(m => m.user_id === accountId);
  if (member) await run(() => connect(data, member.name, current));
}
export async function retryControllerResults() {
  await run(async () => { await refresh(); await flushResults(); });
}
export function stopControllerParty(error: string | null = null) {
  ++generation;
  refreshPending = null;
  removeOnlineListener?.(); removeOnlineListener = undefined;
  if (poll) clearInterval(poll);
  poll = undefined; pendingResults.clear();
  gameRoomSession.leaveRoom(); gameRoomSession.configureParty(null);
  try { localStorage.removeItem(`controller_party:${accountId}`); } catch { /* optional */ }
  replaceControllerPartySession(null); publish({ ...empty, error });
}
