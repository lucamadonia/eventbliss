import { useSyncExternalStore } from 'react';
import { gameRoomSession } from '@/games/multiplayer/useGameRoom';
import type { PartyRoomAccess } from '@/games/multiplayer/party-access';
import { replaceControllerPartySession } from '@/hooks/usePartySession';
import { createPartySession, createPartyPlayer, type PartySession } from './session-schema';
import { placementPoints } from './scoring';
import { controllerRequest, type ControllerMember, type ControllerPartyData, type KickMode } from './controller-api';
import { controllerErrorCode } from './controller-errors';
import { serverClock } from './scene-clock';
import { setPartyTraceDevice } from './party-trace';
import { sceneLocalTime } from './scene-schedule';
import { chainedFinale, clearPartyScene, planPartyScene, showPartyScene, type PartyScene } from './party-scene';
import { readControllerResults, writeControllerResults, type PendingControllerResult } from './controller-outbox';

/** The account lost its seat: kicked, banned or the party is gone for it. */
export interface ControllerRemoval {
  code: string; banned: boolean;
  /** Seat went back to the Host's device (B08). */
  recalled?: boolean;
  /** The same account took its seat over on another phone (B06). */
  movedDevice?: boolean;
}
interface ControllerState {
  data: ControllerPartyData | null; error: string | null; busy: boolean; pendingResults: number;
  /** Fresh join through an invitation or code: show "Wer bist du?" / profile first. */
  onboarding: boolean;
  removed: ControllerRemoval | null;
  /** B13: joined a full party without a seat; only a guest seat can be claimed. */
  seatless: boolean;
}
const empty: ControllerState = { data: null, error: null, busy: false, pendingResults: 0, onboarding: false, removed: null, seatless: false };
export interface PlayerProfile { name: string; avatar: string; color: string }
let state = empty;
let accountId = '';
/** This device's room identity; a seat with another id belongs to the account's other phone. */
let devicePlayerId = '';
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
  const active = data.members.filter(m => !m.banned);
  session.players = active.filter(m => data.party.host_plays || !m.is_host).map((member, i) => createPartyPlayer(member.player_id, member.name, i, member));
  session.archivedPlayers = [...(data.past_members ?? []), ...data.members.filter(m => m.banned)]
    .filter(m => !session.players.some(p => p.id === m.player_id) && (data.party.host_plays || !m.is_host))
    .map((member, i) => createPartyPlayer(member.player_id, member.name, i + session.players.length, member));
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
/** Banned seats for "Sperre aufheben": the server lists them in past_members (members only holds active seats). */
export function bannedMembers(data: ControllerPartyData): ControllerMember[] {
  return [...data.members, ...(data.past_members ?? [])].filter((m, i, all) => m.banned && all.findIndex(o => o.player_id === m.player_id) === i);
}
/** The caller's own seat (phone seat bound to this account), if any. */
export function ownMember(data: ControllerPartyData | null, userId = accountId): ControllerMember | null {
  return data?.members.find(m => m.user_id === userId && !m.banned) ?? null;
}
function accept(data: ControllerPartyData) {
  if (state.data?.party.id === data.party.id && state.data.party.revision > data.party.revision) return state.data;
  // A pending claimer may have no active seat yet and still reads the party.
  if (accountId && !ownMember(data) && !data.members.some(m => m.pending_claim_mine)) {
    const banned = [...data.members, ...(data.past_members ?? [])].some(m => m.user_id === accountId && m.banned);
    stopControllerParty(null, { code: data.party.code, banned });
    throw new Error('removed');
  }
  const mine = ownMember(data);
  if (mine && devicePlayerId && mine.player_id !== devicePlayerId) {
    // B06: this account now plays on another phone; this one steps aside.
    stopControllerParty(null, { code: data.party.code, banned: false, movedDevice: true });
    throw new Error('removed');
  }
  publish({ data, error: null });
  flushQueuedProfile(data);
  // A finished party never changes again: no more polling.
  if (data.party.status === 'finished' && poll) { clearInterval(poll); poll = undefined; }
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
  const task = controllerRequest('read', code).catch(error => {
    const reason = controllerErrorCode(error instanceof Error ? error.message : String(error));
    // A kicked or banned account can no longer read the party: leave cleanly instead of polling forever.
    if (current === generation && (reason === 'removed' || reason === 'banned' || reason === 'recalled')) {
      stopControllerParty(null, { code, banned: reason === 'banned', recalled: reason === 'recalled' });
    }
    throw error;
  }).then(data => {
    if (current !== generation) throw new Error('Party changed');
    const accepted = accept(data);
    reconcileResults(accepted);
    const room = gameRoomSession.getSnapshot().room;
    // The write may have committed even when its HTTP acknowledgement was lost.
    if (accepted.party.host_user_id === accountId && accepted.party.status !== 'playing' && room?.roomCode === code && room.status === 'playing') endMatchTogether(room.sessionId);
    return accepted;
  }).finally(() => { if (refreshPending === task) refreshPending = null; });
  refreshPending = task;
  return refreshPending;
}
function accessFor(data: ControllerPartyData): PartyRoomAccess {
  return { code: data.party.code, hostId: data.party.host_player_id, hostPlays: data.party.host_plays,
    premium: data.party.premium, memberIds: data.members.filter(m => !m.banned).map(m => m.player_id),
    guests: data.members.filter(m => !m.banned && m.controlled_by != null)
      .map(m => ({ id: m.player_id, name: m.name, avatar: m.avatar, color: m.color, controlledBy: m.controlled_by! })),
    matchId: data.party.current_match_id,
    matchParticipantIds: Array.isArray(data.party.participant_ids) ? data.party.participant_ids : null,
    // Each seat's own symbol and colour for its room presence (no initials, no random colours).
    looks: Object.fromEntries(data.members.filter(m => !m.banned).map(m => [m.player_id, { avatar: m.avatar, color: m.color }])),
    refresh: async () => accessFor(await refresh()),
    start: async (gameId, participantIds) => {
      const current = generation;
      const next = await controllerRequest('start', data.party.code, { game_id: gameId, participant_ids: participantIds });
      if (current !== generation) throw new Error('Party changed');
      accept(next); announcePartyChange(next);
      if (!next.party.current_match_id) throw new Error('Match not created');
      return next.party.current_match_id;
    },
  };
}
/**
 * T01–T03/T19 within a second: whoever changes seats or profiles tells the
 * room right away; everyone else refreshes instead of waiting for the poll.
 */
let removePartyChanged: (() => void) | undefined;
function announcePartyChange(data: ControllerPartyData) {
  gameRoomSession.broadcast('party-changed', { revision: data.party.revision });
}
/**
 * Refresh until the snapshot has at least `revision`. A poll that is already
 * in flight may carry the older state; it must not swallow the newer change
 * (that kept the Host — and with it the TV — waiting for the next poll).
 */
export async function refreshAtLeast(revision: number, attempts = 3): Promise<void> {
  for (let i = 0; i < attempts && state.data && state.data.party.revision < revision; i++) {
    const pending = refreshPending;
    if (pending) { await pending.catch(() => {}); continue; }
    await refresh();
  }
}
function listenForPartyChanges() {
  removePartyChanged?.();
  removePartyChanged = gameRoomSession.onBroadcast('party-changed', message => {
    const revision = typeof message?.revision === 'number' ? message.revision : (state.data?.party.revision ?? 0) + 1;
    void refreshAtLeast(revision).catch(() => { /* the poll retries */ });
  });
}
async function connect(data: ControllerPartyData, name: string, current: number) {
  if (current !== generation) return;
  accept(data);
  publish({ seatless: false });
  listenForPartyChanges();
  const host = data.party.host_user_id === accountId;
  setPartyTraceDevice(host ? 'host' : 'phone');
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
  if (state.data?.party.status !== 'finished') poll = setInterval(() => {
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
export interface OpenOptions { resume?: boolean; avatar?: string; color?: string }
export async function openControllerParty(userId: string, name: string, code?: string, hostPlays = true, options: OpenOptions = {}) {
  if (state.busy) return;
  const current = ++generation;
  publish({ removed: null, onboarding: false });
  await run(async () => {
    accountId = userId;
    const playerId = await gameRoomSession.prepareAccountIdentity(userId);
    devicePlayerId = playerId;
    if (current !== generation) return;
    const look = { ...(options.avatar ? { avatar: options.avatar } : {}), ...(options.color ? { color: options.color } : {}) };
    const data = await controllerRequest(code ? 'join' : 'create', code ?? null, { player_id: playerId, name, host_plays: hostPlays, ...look });
    if (current !== generation) return;
    if (data.seated === false) {
      // B13: full party, but guest seats are free → "Wer bist du?" before any seat exists.
      joinName = name;
      publish({ data, onboarding: true, seatless: true });
      return;
    }
    publish({ onboarding: !!code && !options.resume && data.party.host_user_id !== userId });
    await connect(data, ownMember(data, userId)?.name ?? name, current);
  });
}
/**
 * B06 before joining by invitation: does this account already have a seat in
 * that party on ANOTHER phone? Then the user is asked „Auf dieses Handy wechseln?“.
 */
export type SeatStatus = 'none' | 'here' | 'elsewhere';
/**
 * Before joining by invitation: does this account already hold a seat in that
 * party? 'here' = on this phone (B07: re-scanned QR → resume, never "Wer bist
 * du?"), 'elsewhere' = on another phone (B06: ask to switch).
 */
export async function controllerSeatStatus(userId: string, code: string): Promise<SeatStatus> {
  try {
    const playerId = await gameRoomSession.prepareAccountIdentity(userId);
    const data = await controllerRequest('read', code);
    const mine = ownMember(data, userId);
    if (!mine) return data.members.some(m => m.pending_claim_mine) ? 'here' : 'none';
    return mine.player_id === playerId ? 'here' : 'elsewhere';
  } catch { return 'none'; }
}
export async function controllerSeatElsewhere(userId: string, code: string): Promise<boolean> {
  return (await controllerSeatStatus(userId, code)) === 'elsewhere';
}
/** "Wer bist du?" and the first profile are done (or skipped). */
export function finishControllerOnboarding() { publish({ onboarding: false }); }
export function dismissControllerRemoval() { publish({ removed: null, error: null }); }

type SeatAction = 'add_guest' | 'remove_guest' | 'claim' | 'release' | 'profile' | 'kick' | 'unban';
let joinName = '';
async function partyAction(action: SeatAction, payload: Record<string, unknown>): Promise<ControllerPartyData | null> {
  if (!state.data) throw new Error('No controller party');
  const current = generation, code = state.data.party.code;
  let result: ControllerPartyData | null = null;
  if (state.seatless) {
    // Only a claim can give a seatless phone a seat; then it connects like a normal join.
    if (action !== 'claim') throw new Error('party_full');
    await run(async () => {
      const data = await controllerRequest('claim', code, { ...payload, controller_id: devicePlayerId });
      if (current !== generation) return;
      await connect(data, ownMember(data)?.name ?? joinName, current);
      result = state.data;
      announcePartyChange(data);
    });
    return result;
  }
  await run(async () => {
    const data = await controllerRequest(action, code, payload);
    if (current === generation) { result = accept(data); announcePartyChange(data); }
  });
  return result;
}
/** Host: a player without a phone, played on the Host's device. */
export const addControllerGuest = (profile: PlayerProfile) => partyAction('add_guest', { ...profile });
export const removeControllerGuest = (playerId: string) => partyAction('remove_guest', { player_id: playerId });
/** Take over a guest seat; during a match the server only marks it (`pending_claim`). */
export const claimControllerSeat = (playerId: string, profile: Partial<PlayerProfile> = {}) => partyAction('claim', { player_id: playerId, ...profile });
/** Hand a phone seat back to the Host's device ("Das bin ich nicht" / Host takes it back). */
export const releaseControllerSeat = (playerId: string) => partyAction('release', { player_id: playerId });
export const updateControllerProfile = (playerId: string, profile: PlayerProfile) => partyAction('profile', { player_id: playerId, ...profile });
/**
 * A late joiner picks name/symbol/colour while a game runs; profiles are
 * lobby-only on the server, so it is sent as soon as the party is back in the lobby.
 */
let queuedProfile: { playerId: string; profile: PlayerProfile } | null = null;
export function queueControllerProfile(playerId: string, profile: PlayerProfile) { queuedProfile = { playerId, profile }; }
function flushQueuedProfile(data: ControllerPartyData) {
  if (!queuedProfile || data.party.status !== 'lobby') return;
  const { playerId, profile } = queuedProfile;
  queuedProfile = null;
  if (!data.members.some(m => m.player_id === playerId)) return;
  void controllerRequest('profile', data.party.code, { player_id: playerId, ...profile })
    .then(next => { accept(next); announcePartyChange(next); }).catch(() => { /* keep the old profile */ });
}
export async function kickControllerPlayer(playerId: string, mode: KickMode) {
  const data = await partyAction('kick', { player_id: playerId, mode });
  // A removed phone leaves at once via the signed room packet instead of on its next poll.
  // The match goes on at once without this seat (F05), whatever the mode.
  if (data) gameRoomSession.dropParticipant(playerId);
  if (data && mode !== 'match_only') gameRoomSession.kickPlayer(playerId);
  return data;
}
export const unbanControllerPlayer = (playerId: string) => partyAction('unban', { player_id: playerId });
/**
 * "Das bin ich nicht": give the seat back to the Host's device, then join
 * again with a fresh seat so "Wer bist du?" can be answered anew.
 */
export async function releaseOwnControllerSeat() {
  const data = state.data, me = ownMember(data);
  if (!data || !me || me.is_host) return;
  const userId = accountId, code = data.party.code;
  await run(async () => { await controllerRequest('release', code, { player_id: me.player_id }); });
  await openControllerParty(userId, me.name, code);
}
/** Refresh after a lost race (seat_taken) so the list is current. */
export async function refreshControllerParty() { if (state.data) await refresh().catch(() => {}); }
export async function setControllerPlaylist(playlist: string[]) {
  if (!state.data) return;
  const current = generation, code = state.data.party.code;
  // Players see the planned games at once (teaser, "1 Spiel geplant"), not on their next poll.
  await run(async () => { const data = await controllerRequest('playlist', code, { playlist }); if (current === generation) { accept(data); announcePartyChange(data); } });
}
/** Host: show a scene here and send it to every phone (and, via the coordinator, the TV) right away. */
function announceScene(scene: PartyScene) {
  showPartyScene(scene);
  gameRoomSession.broadcast('party-scene', { scene, serverNow: new Date(serverClock.now()).toISOString() });
}
/**
 * Game start (T05): the countdown scene goes out BEFORE the start RPC, so all
 * devices count 3-2-1 together and enter the game at the same "Los!" instead
 * of whenever their next poll arrives. A failed start cancels the scene.
 */
export async function startControllerGame(gameId: string) {
  const scene = planPartyScene('game-start', { gameId });
  announceScene(scene);
  try {
    await run(async () => {
      if (!await gameRoomSession.startGame(gameId)) throw new Error('partyControllers.notReady');
    });
  } catch (error) {
    clearPartyScene(scene.sceneId);
    gameRoomSession.broadcast('party-scene', { cancel: scene.sceneId });
    throw error;
  }
}
/**
 * Match end (T11/T14): announce the return to the lobby, then close the room
 * at the scene's start so every device switches at the same moment.
 */
const endingMatches = new Set<string>();
function endMatchTogether(matchId: string): PartyScene | null {
  if (endingMatches.has(matchId)) return null;
  endingMatches.add(matchId);
  const scene = planPartyScene('round-end', { matchKey: matchId });
  announceScene(scene);
  const current = generation;
  setTimeout(() => {
    endingMatches.delete(matchId);
    const room = gameRoomSession.getSnapshot().room;
    if (current === generation && room?.status === 'playing' && room.sessionId === matchId) gameRoomSession.finishPartyGame();
  }, Math.max(0, sceneLocalTime(scene.startsAt) - Date.now()));
  return scene;
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
      pendingResults.delete(id); accept(data); persistResults(); announcePartyChange(data);
      // A delayed acknowledgement must never close a later match after an abort.
      const activeRoom = gameRoomSession.getSnapshot().room;
      if (activeRoom?.status === 'playing' && activeRoom.sessionId === id) endMatchTogether(id);
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
    accept(data); reconcileResults(data); announcePartyChange(data);
    const room = gameRoomSession.getSnapshot().room;
    if (room?.status === 'playing') endMatchTogether(room.sessionId);
  });
}
/**
 * D04/T16: the Host ends the party but stays in it — every device (and the
 * TV, via the lobby feed with view 'finale') moves to the closing screen with
 * the final standings. Leaving afterwards is `closeControllerParty`.
 */
export async function endControllerParty() {
  if (!state.data) return;
  const current = generation, code = state.data.party.code;
  await run(async () => {
    const data = await controllerRequest('end', code);
    if (current !== generation) return;
    accept(data);
    announcePartyChange(data);
    // Ended mid-game: everyone leaves the match together, then lands on the closing screen.
    // Otherwise the finale scene lets every phone celebrate in sync with the TV podium (T16).
    const room = gameRoomSession.getSnapshot().room;
    const roundEnd = room?.status === 'playing' ? endMatchTogether(room.sessionId) : null;
    if (!roundEnd) { announceScene(planPartyScene('finale')); return; }
    // Mid-game: the finale is chained right after the round-end moment (one scene store,
    // so it is announced once the round-end scene has fired on every device).
    const finale = chainedFinale(roundEnd);
    setTimeout(() => { if (current === generation) announceScene(finale); }, Math.max(0, sceneLocalTime(roundEnd.startsAt) - Date.now()) + 50);
  });
}
/** Leave a finished party on this device only (nothing left to tell the server). */
export function closeControllerParty() {
  pendingResults.clear(); persistResults(); stopControllerParty();
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
  const member = ownMember(data);
  if (!member) return;
  // A phone rebuilds its channel even when it still looks joined; the Host recreates the room.
  if (data.party.host_user_id !== accountId && gameRoomSession.getSnapshot().room?.roomCode === data.party.code) await run(() => gameRoomSession.reconnect());
  else await run(() => connect(data, member.name, current));
}
export async function retryControllerResults() {
  await run(async () => { await refresh(); await flushResults(); });
}
export function stopControllerParty(error: string | null = null, removed: ControllerRemoval | null = null) {
  ++generation;
  refreshPending = null;
  removeOnlineListener?.(); removeOnlineListener = undefined;
  if (poll) clearInterval(poll);
  poll = undefined; pendingResults.clear();
  gameRoomSession.leaveRoom(); gameRoomSession.configureParty(null);
  try { localStorage.removeItem(`controller_party:${accountId}`); } catch { /* optional */ }
  serverClock.reset(); clearPartyScene(); queuedProfile = null;
  // A round-end still pending from this party must not block the next one with the same match id.
  endingMatches.clear();
  removePartyChanged?.(); removePartyChanged = undefined;
  replaceControllerPartySession(null); publish({ ...empty, error, removed });
}
