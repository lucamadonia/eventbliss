/**
 * tv-lobby-state.ts — was der Fernseher im Wartebereich zeigt.
 *
 * Der Wartebereich reist als optionales Feld `lobby` im bestehenden
 * `tv-state`-Broadcast. Das Telefon des Gastgebers baut ihn mit einer der drei
 * Funktionen unten; der Fernseher prueft ihn mit `parseTVLobbyState`, bevor er
 * ihn anzeigt — die Leitung ist eine Systemgrenze.
 *
 * Fehlt das Feld (altes Telefon), leitet `legacyLobbyState` aus der
 * Realtime-Anwesenheit einen Ersatz ab, damit der Fernseher nie leer bleibt.
 *
 * Reine Datenlogik ohne React — dadurch direkt testbar.
 */
import type { ControllerPartyData } from '@/games/party/controller-api';
import type { PartySession } from '@/games/party/session-schema';
import { PLAYER_AVATARS, PLAYER_COLORS } from '@/games/party/session-schema';
import type { RoomPlayer } from '@/games/multiplayer/room-types';
import { roomGameAvailability } from '@/games/multiplayer/room-availability';
import { controllerGameAvailability, sittingOutNames } from '@/games/party/party-availability';
import { gameAvailability, type GameAvailability, type GameUnavailableReason } from '@/lib/playable-games';

/**
 * `gameAvailability` fuer das naechste Spiel, in Leitungsform — dieselben
 * Felder, ergaenzt um die Namen der aussetzenden 🔁-Gaeste. Der Fernseher
 * baut daraus mit `availabilityChip` denselben Hinweis wie die Handys.
 */
export type TVNextGameAvailability = Pick<GameAvailability, 'plannable' | 'startable' | 'reason' | 'activePlayers' | 'sittingOut' | 'missingPlayers' | 'reasonParams'> & {
  sittingOutNames: string[];
};

export interface TVLobbyPlayer { id: string; name: string; avatar: string; color: string; seat: 'phone' | 'host-device'; ready: boolean; connected: boolean; isHost: boolean; hostPlays?: boolean }
export interface TVLobbyState {
  mode: 'controller-party' | 'local-party' | 'online-room';
  code: string;               // shown as text under the QR
  tvCode?: string;            // pairing code may differ from the phone-join code
  joinUrl: string | null;     // QR target; null for local-party (no phone join)
  players: TVLobbyPlayer[];
  /** `unavailableReason`: already localised by the phone (from `gameAvailability`), shown subtly on the TV. */
  nextGame: { id: string; name: string; minPlayers: number; maxPlayers: number; unavailableReason?: string; availability?: TVNextGameAvailability } | null;
  readyMissing: number;       // how many active players are not ready yet
  gamesPlanned: number;
}

/**
 * Felder, um die ein anderer Strang `ControllerMember` gerade erweitert. Bis
 * das Schema ueberall angekommen ist, sind sie hier optional und fallen auf
 * die bisherige index-basierte Zuordnung zurueck.
 */
interface ControllerMemberExtras {
  user_id?: string | null;
  avatar?: string;
  color?: string;
  controlled_by?: string | null;
  pending_claim?: boolean;
  banned?: boolean;
}

const trimBase = (baseUrl: string) => baseUrl.replace(/\/+$/, '');
const avatarAt = (index: number) => PLAYER_AVATARS[index % PLAYER_AVATARS.length];
const colorAt = (index: number) => PLAYER_COLORS[index % PLAYER_COLORS.length];
const nonEmpty = (value: unknown, fallback: string) => (typeof value === 'string' && value.length > 0 ? value : fallback);

/** Wer im naechsten Spiel mitzaehlt: ein Gastgeber, der nicht mitspielt, nicht. */
export function isActiveLobbyPlayer(player: TVLobbyPlayer): boolean {
  return !(player.isHost && player.hostPlays === false);
}

/**
 * Wer den Start noch aufhaelt: nur mitspielende 📱-Spieler. Der Host startet
 * selbst, Gaeste am Host-Handy haben keinen eigenen Bereit-Knopf.
 */
export function countReadyMissing(players: TVLobbyPlayer[]): number {
  return players.filter((p) => isActiveLobbyPlayer(p) && p.seat === 'phone' && !p.isHost && !p.ready).length;
}

/** Duenner Adapter: keine eigene Regel, nur die Felder fuer die Leitung. */
function toWire(a: GameAvailability, names: string[]): TVNextGameAvailability {
  return {
    plannable: a.plannable,
    startable: a.startable,
    reason: a.reason,
    activePlayers: a.activePlayers,
    sittingOut: a.sittingOut,
    missingPlayers: a.missingPlayers,
    ...(a.reasonParams ? { reasonParams: a.reasonParams } : {}),
    sittingOutNames: a.sittingOut > 0 ? names : [],
  };
}

function withAvailability(nextGame: TVLobbyState['nextGame'], compute: (gameId: string) => TVNextGameAvailability): TVLobbyState['nextGame'] {
  return nextGame ? { ...nextGame, availability: compute(nextGame.id) } : null;
}

export function controllerLobbyState(args: {
  data: ControllerPartyData;
  presence: { id: string; isReady: boolean }[];
  baseUrl: string;
  nextGame: TVLobbyState['nextGame'];
  gamesPlanned: number;
}): TVLobbyState {
  const { data, presence, baseUrl, nextGame, gamesPlanned } = args;
  const hostPlays = data.party.host_plays !== false;
  const presenceById = new Map(presence.map((p) => [p.id, p]));
  const players = data.members
    .map((member, index) => ({ member: member as typeof member & ControllerMemberExtras, index }))
    .filter(({ member }) => !member.banned)
    .map(({ member, index }): TVLobbyPlayer => {
      const guest = member.controlled_by != null;
      const seen = presenceById.get(member.player_id) ?? (member.user_id ? presenceById.get(member.user_id) : undefined);
      // Der Gastgeber sendet diesen Zustand selbst — er ist also verbunden und
      // startet das Spiel, ein Bereit-Haken waere fuer ihn ohne Bedeutung.
      // Gaeste sitzen am Handy des Gastgebers und sind damit genauso da.
      const local = guest || member.is_host;
      return {
        id: member.player_id,
        name: member.name,
        avatar: nonEmpty(member.avatar, avatarAt(index)),
        color: nonEmpty(member.color, colorAt(index)),
        seat: guest ? 'host-device' : 'phone',
        ready: local || !!seen?.isReady,
        connected: local || !!seen,
        isHost: member.is_host,
        ...(member.is_host ? { hostPlays } : {}),
      };
    });
  return {
    mode: 'controller-party',
    code: data.party.code,
    tvCode: data.party.tv_code || data.party.code,
    joinUrl: `${trimBase(baseUrl)}/party/join/${data.party.code}`,
    players,
    nextGame: withAvailability(nextGame, (id) => toWire(controllerGameAvailability(id, data), sittingOutNames(id, data))),
    readyMissing: countReadyMissing(players),
    gamesPlanned: Math.max(0, gamesPlanned),
  };
}

export function localLobbyState(args: { session: PartySession; code: string; nextGame: TVLobbyState['nextGame']; hostPremium?: boolean }): TVLobbyState {
  const { session, code, nextGame, hostPremium = true } = args;
  const players = session.players.map((p, index): TVLobbyPlayer => ({
    id: p.id,
    name: p.name,
    avatar: nonEmpty(p.avatar, avatarAt(index)),
    color: nonEmpty(p.color, colorAt(index)),
    seat: 'host-device',
    ready: true,
    connected: true,
    isHost: false,
  }));
  return {
    mode: 'local-party',
    code,
    joinUrl: null,
    players,
    // Am lokalen Abend sitzen alle am einen Handy und niemand setzt aus.
    nextGame: withAvailability(nextGame, (id) => toWire(gameAvailability(id, {
      mode: 'local-party', phonePlayers: 0, guestPlayers: players.length, hostPlays: false, hostPremium,
    }), [])),
    readyMissing: 0,
    gamesPlanned: session.playlist.length,
  };
}

export function onlineRoomLobbyState(args: { roomCode: string; players: RoomPlayer[]; hostId: string; baseUrl: string; nextGame: TVLobbyState['nextGame']; hostPremium?: boolean }): TVLobbyState {
  const { roomCode, hostId, baseUrl, nextGame, hostPremium = false } = args;
  const players = args.players.map((p, index): TVLobbyPlayer => {
    const isHost = p.id === hostId || p.isHost;
    const guest = !!p.controlledBy && !isHost;
    return {
      id: p.id,
      name: p.name,
      avatar: nonEmpty(p.avatar, avatarAt(index)),
      color: nonEmpty(p.color, colorAt(index)),
      seat: guest ? 'host-device' : 'phone',
      ready: guest || !!p.isReady,
      connected: true,
      isHost,
      ...(isHost ? { hostPlays: true } : {}),
    };
  });
  return {
    mode: 'online-room',
    code: roomCode,
    joinUrl: `${trimBase(baseUrl)}/games?room=${roomCode}`,
    players,
    nextGame: withAvailability(nextGame, (id) => toWire(
      roomGameAvailability(id, args.players, hostId, { controllerParty: false, hostPremium }),
      args.players.filter((p) => p.controlledBy).map((p) => p.name),
    )),
    readyMissing: countReadyMissing(players),
    gamesPlanned: nextGame ? 1 : 0,
  };
}

/**
 * Ersatz fuer Telefone, die noch kein `lobby` senden. Ohne Anwesenheit und
 * ohne Joystick-Code ist der Code nicht beitretbar (Offline-TV) — dann gibt es
 * auch keinen QR, statt eines falschen.
 */
export function legacyLobbyState(args: {
  code: string;
  presence: { id: string; name: string; avatar: string; color: string; isReady: boolean }[];
  controllerJoinCode: string | null;
  baseUrl: string;
}): TVLobbyState {
  const { code, presence, controllerJoinCode, baseUrl } = args;
  const players = presence.map((p, index): TVLobbyPlayer => ({
    id: p.id,
    name: p.name,
    avatar: nonEmpty(p.avatar, avatarAt(index)),
    color: nonEmpty(p.color, colorAt(index)),
    seat: 'phone',
    ready: !!p.isReady,
    connected: true,
    isHost: false,
  }));
  const base = { players, nextGame: null, readyMissing: countReadyMissing(players), gamesPlanned: 0 };
  if (controllerJoinCode) {
    return { ...base, mode: 'controller-party', code: controllerJoinCode, joinUrl: `${trimBase(baseUrl)}/party/join/${controllerJoinCode}` };
  }
  if (players.length > 0) {
    return { ...base, mode: 'online-room', code, joinUrl: `${trimBase(baseUrl)}/games?room=${code}` };
  }
  return { ...base, mode: 'local-party', code, joinUrl: null };
}

// ── Leitung → Fernseher ─────────────────────────────────────────────

const MODES = new Set<TVLobbyState['mode']>(['controller-party', 'local-party', 'online-room']);
const MAX_WIRE_PLAYERS = 24;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
const asCount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
const asText = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

/** Nur http(s)-Links landen im QR — nie `javascript:` o. ae. von der Leitung. */
function safeJoinUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function parsePlayer(value: unknown, index: number): TVLobbyPlayer | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asText(raw.id, 128);
  const name = asText(raw.name, 40).trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    avatar: nonEmpty(asText(raw.avatar, 16), avatarAt(index)),
    color: /^#[0-9a-fA-F]{3,8}$/.test(String(raw.color)) ? String(raw.color) : colorAt(index),
    seat: raw.seat === 'host-device' ? 'host-device' : 'phone',
    ready: raw.ready === true,
    connected: raw.connected !== false,
    isHost: raw.isHost === true,
    ...(typeof raw.hostPlays === 'boolean' ? { hostPlays: raw.hostPlays } : {}),
  };
}

export function parseTVLobbyState(value: unknown): TVLobbyState | null {
  const raw = asRecord(value);
  if (!raw || !MODES.has(raw.mode as TVLobbyState['mode'])) return null;
  const mode = raw.mode as TVLobbyState['mode'];
  const players = (Array.isArray(raw.players) ? raw.players : [])
    .slice(0, MAX_WIRE_PLAYERS)
    .map(parsePlayer)
    .filter((p): p is TVLobbyPlayer => !!p);
  const game = asRecord(raw.nextGame);
  const availability = parseAvailability(game?.availability);
  const nextGame = game && typeof game.id === 'string' && typeof game.name === 'string'
    ? {
      id: asText(game.id, 64), name: asText(game.name, 60), minPlayers: asCount(game.minPlayers), maxPlayers: asCount(game.maxPlayers),
      ...(typeof game.unavailableReason === 'string' && game.unavailableReason.trim() ? { unavailableReason: asText(game.unavailableReason.trim(), 120) } : {}),
      ...(availability ? { availability } : {}),
    }
    : null;
  return {
    mode,
    code: asText(raw.code, 16),
    ...(typeof raw.tvCode === 'string' && raw.tvCode ? { tvCode: asText(raw.tvCode, 16) } : {}),
    joinUrl: mode === 'local-party' ? null : safeJoinUrl(raw.joinUrl),
    players,
    nextGame,
    // Aus der Liste nachgerechnet statt der Leitung geglaubt: Zahl und Karten
    // duerfen sich auf dem Fernseher nie widersprechen.
    readyMissing: countReadyMissing(players),
    gamesPlanned: asCount(raw.gamesPlanned),
  };
}

const REASONS = new Set<GameUnavailableReason>(['too_few', 'too_many', 'premium', 'guests_sit_out_too_few', 'unknown_game']);

function parseAvailability(value: unknown): TVNextGameAvailability | null {
  const raw = asRecord(value);
  if (!raw || typeof raw.startable !== 'boolean') return null;
  const startable = raw.startable;
  const reason = startable ? null : REASONS.has(raw.reason as GameUnavailableReason) ? raw.reason as GameUnavailableReason : 'unknown_game';
  const params = asRecord(raw.reasonParams);
  const reasonParams = params
    ? Object.fromEntries(Object.entries(params).filter(([k, v]) => /^\w{1,16}$/.test(k) && typeof v === 'number' && Number.isFinite(v)).slice(0, 8)) as Record<string, number>
    : undefined;
  return {
    startable,
    plannable: startable || raw.plannable === true,
    reason,
    activePlayers: asCount(raw.activePlayers),
    sittingOut: asCount(raw.sittingOut),
    missingPlayers: asCount(raw.missingPlayers),
    ...(reasonParams ? { reasonParams } : {}),
    sittingOutNames: (Array.isArray(raw.sittingOutNames) ? raw.sittingOutNames : [])
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0).slice(0, 12).map((n) => n.trim().slice(0, 40)),
  };
}

// ── Ableitungen fuer die Anzeige ────────────────────────────────────

export type NextGameAvailability = GameAvailability & { sittingOutNames: string[] };

/**
 * Das Urteil fuer das naechste Spiel. Mit `availability` vom Telefon gilt die
 * eine Regel (`gameAvailability`); nur alte Telefone ohne das Feld fallen auf
 * min/max der Leitung zurueck — in derselben Form, damit der Fernseher
 * immer `availabilityChip` benutzen kann.
 */
export function nextGameAvailability(state: TVLobbyState): NextGameAvailability | null {
  const game = state.nextGame;
  if (!game) return null;
  if (game.availability) return { ...game.availability, selectable: game.availability.startable };
  const activePlayers = state.players.filter(isActiveLobbyPlayer).length;
  const base = { activePlayers, sittingOut: 0, sittingOutNames: [] as string[] };
  if (game.minPlayers > 0 && activePlayers < game.minPlayers) {
    return { ...base, plannable: true, startable: false, selectable: false, reason: 'too_few', missingPlayers: game.minPlayers - activePlayers, reasonParams: { min: game.minPlayers, count: activePlayers } };
  }
  if (game.maxPlayers > 0 && activePlayers > game.maxPlayers) {
    return { ...base, plannable: false, startable: false, selectable: false, reason: 'too_many', missingPlayers: 0, reasonParams: { max: game.maxPlayers, count: activePlayers } };
  }
  return { ...base, plannable: true, startable: true, selectable: true, reason: null, missingPlayers: 0 };
}

export interface LobbyPlayerDiff {
  joined: TVLobbyPlayer[];
  left: TVLobbyPlayer[];
  /** Plaetze, die vom Host-Handy auf ein eigenes Handy gewechselt sind (🔁→📱). */
  seatClaimed: TVLobbyPlayer[];
  profileChanged: TVLobbyPlayer[];
  becameReady: TVLobbyPlayer[];
}

export function diffLobbyPlayers(prev: TVLobbyPlayer[], next: TVLobbyPlayer[]): LobbyPlayerDiff {
  const before = new Map(prev.map((p) => [p.id, p]));
  const after = new Set(next.map((p) => p.id));
  const diff: LobbyPlayerDiff = { joined: [], left: [], seatClaimed: [], profileChanged: [], becameReady: [] };
  for (const p of next) {
    const old = before.get(p.id);
    if (!old) { diff.joined.push(p); continue; }
    if (old.seat === 'host-device' && p.seat === 'phone') diff.seatClaimed.push(p);
    if (old.name !== p.name || old.avatar !== p.avatar || old.color !== p.color) diff.profileChanged.push(p);
    if (!old.ready && p.ready) diff.becameReady.push(p);
  }
  for (const p of prev) if (!after.has(p.id)) diff.left.push(p);
  return diff;
}
