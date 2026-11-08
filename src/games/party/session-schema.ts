/**
 * session-schema.ts — Datenform der Party-Sitzung und ihre Migration.
 *
 * Die Sitzung lebt in localStorage (`eventbliss_party_session`) und ueberlebt
 * App-Updates. Genau da liegt die Gefahr: Wer waehrend einer laufenden Party
 * ein Update bekommt, haette bei einem strengen Parser ploetzlich keine
 * Mitspieler und keine Punkte mehr. Deshalb wird ein alter Blob NIE verworfen,
 * sondern Feld fuer Feld ergaenzt — fehlende Felder bekommen Standardwerte.
 *
 * Reine Datenlogik ohne React und ohne localStorage — dadurch direkt testbar.
 */

/** Aktuelle Schema-Fassung. Erhoehen, sobald Felder ihre Bedeutung aendern. */
export const PARTY_SCHEMA_VERSION = 3;

/** Obergrenze der Mitspieler — deckt sich mit der Laenge der Farbpalette. */
export const MAX_PARTY_PLAYERS = 12;

export const PLAYER_COLORS = [
  "#df8eff", "#ff6b98", "#8ff5ff", "#f9ca24", "#00b894",
  "#6c5ce7", "#fd79a8", "#e17055", "#0984e3", "#a29bfe",
  "#ff7675", "#55efc4",
] as const;

/** Order matters: the first 12 are the historic index-based defaults. Mirrors the server CHECK list. */
export const PLAYER_AVATARS = [
  "🎉", "🔥", "⭐", "🎯", "🚀", "💎", "🌟", "🎪",
  "🎲", "🎸", "🎨", "🦄",
  "🦊", "🐼", "🐯", "🐸", "🐙", "🦁", "🐨", "🐵",
  "🦉", "🐳", "🍕", "👑",
];

export const PLAYER_NAME_MAX = 24;

export const isPlayerAvatar = (value: unknown): value is string =>
  typeof value === "string" && PLAYER_AVATARS.includes(value);

/** Lowercase palette colour or null — the server stores colours lowercase. */
export function playerColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const color = value.toLowerCase();
  return (PLAYER_COLORS as readonly string[]).includes(color) ? color : null;
}

/** Trimmed name within 1–24 characters (code points, so emoji count once), else null. */
export function playerName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  const length = [...name].length;
  return length >= 1 && length <= PLAYER_NAME_MAX ? name : null;
}

// ── Typen ──────────────────────────────────────────────────────────

export interface PartyPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  /** Summe der PLATZIERUNGSPUNKTE, nicht der Rohpunkte aus den Spielen. */
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
}

export interface GameHistoryEntry {
  matchId?: string;
  gameId: string;
  gameName: string;
  /** Leer bei einem Pausenspiel (`scored: false`). */
  winnerId: string;
  winnerName: string;
  /** Rohpunkte aus dem Spiel, nach Spieler-ID. */
  scores: Record<string, number>;
  /** Vergebene Platzierungspunkte, nach Spieler-ID. Leer bei Pausenspiel. */
  points: Record<string, number>;
  /** false = Pausenspiel: zaehlt als Runde, veraendert die Tabelle nicht. */
  scored: boolean;
  playedAt: number;
}

export interface PartySession {
  playMode?: 'local' | 'controllers';
  roomCode?: string;
  id: string;
  players: PartyPlayer[];
  /** Departed members remain in history without occupying a game slot or visible standing. */
  archivedPlayers?: PartyPlayer[];
  tvCode: string;
  currentGameId: string | null;
  gameHistory: GameHistoryEntry[];
  isActive: boolean;
  createdAt: number;
  /** Geplante Spielreihenfolge (Registry-Kennungen). */
  playlist: string[];
  /** Index des laufenden Eintrags in `playlist`. */
  playlistIndex: number;
  /** true, solange die Playlist abgearbeitet wird. */
  playlistActive: boolean;
  schemaVersion: number;
}

export interface GameEndResult {
  gameId: string;
  gameName: string;
  /**
   * Rohpunkte nach Spieler-ID. Die Schluessel bestimmen, WER mitgespielt hat:
   * Party-Spieler, die hier fehlen, bekommen weder Punkte noch eine gezaehlte
   * Runde.
   */
  scores: Record<string, number>;
  /** false = Pausenspiel. Fehlt der Wert, gilt das Spiel als gewertet. */
  scored?: boolean;
}

// ── Erzeugen ───────────────────────────────────────────────────────

const TV_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTvCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += TV_CODE_ALPHABET[Math.floor(Math.random() * TV_CODE_ALPHABET.length)];
  }
  return code;
}

export function createPartySession(id: string): PartySession {
  return {
    id,
    playMode: 'local',
    players: [],
    tvCode: generateTvCode(),
    currentGameId: null,
    gameHistory: [],
    isActive: true,
    createdAt: Date.now(),
    playlist: [],
    playlistIndex: 0,
    playlistActive: false,
    schemaVersion: PARTY_SCHEMA_VERSION,
  };
}

/** `look` comes from the server; invalid or missing values fall back to the index. */
export function createPartyPlayer(id: string, name: string, index: number, look: { avatar?: unknown; color?: unknown } = {}): PartyPlayer {
  return {
    id,
    name,
    color: playerColor(look.color) ?? PLAYER_COLORS[index % PLAYER_COLORS.length],
    avatar: isPlayerAvatar(look.avatar) ? look.avatar : PLAYER_AVATARS[index % PLAYER_AVATARS.length],
    totalScore: 0,
    gamesPlayed: 0,
    gamesWon: 0,
  };
}

// ── Migration ──────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/** Zahlen-Map bereinigen: nur endliche Zahlen ueberleben. */
function asScoreMap(value: unknown): Record<string, number> {
  const source = asRecord(value);
  if (!source) return {};
  const map: Record<string, number> = {};
  for (const key of Object.keys(source)) {
    const entry = source[key];
    if (typeof entry === "number" && Number.isFinite(entry)) map[key] = entry;
  }
  return map;
}

function migratePlayer(value: unknown, index: number): PartyPlayer | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asString(raw.id, "");
  const name = asString(raw.name, "");
  if (!id || !name) return null;
  return {
    id,
    name,
    color: asString(raw.color, PLAYER_COLORS[index % PLAYER_COLORS.length]),
    avatar: asString(raw.avatar, PLAYER_AVATARS[index % PLAYER_AVATARS.length]),
    totalScore: asNumber(raw.totalScore, 0),
    gamesPlayed: asNumber(raw.gamesPlayed, 0),
    gamesWon: asNumber(raw.gamesWon, 0),
  };
}

function migrateHistoryEntry(value: unknown): GameHistoryEntry | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const gameId = asString(raw.gameId, "");
  if (!gameId) return null;
  return {
    gameId,
    gameName: asString(raw.gameName, gameId),
    ...(typeof raw.matchId === 'string' ? { matchId: raw.matchId } : {}),
    winnerId: asString(raw.winnerId, ""),
    winnerName: asString(raw.winnerName, ""),
    scores: asScoreMap(raw.scores),
    // Fassung 1 kannte weder Platzierungspunkte noch Pausenspiele: Alles, was
    // damals in der Historie stand, war ein gewertetes Spiel.
    points: asScoreMap(raw.points),
    scored: typeof raw.scored === "boolean" ? raw.scored : true,
    playedAt: asNumber(raw.playedAt, 0),
  };
}

/**
 * Macht aus einem beliebigen gespeicherten Blob eine gueltige `PartySession`.
 *
 * Gibt `null` zurueck, wenn der Blob keine Sitzung ist oder die Sitzung
 * beendet wurde (`isActive !== true`) — genau wie der bisherige Loader.
 * Alles andere wird repariert statt weggeworfen.
 */
export function migratePartySession(value: unknown): PartySession | null {
  const raw = asRecord(value);
  if (!raw) return null;
  if (raw.isActive !== true) return null;

  const id = asString(raw.id, "");
  if (!id) return null;

  const players = Array.isArray(raw.players)
    ? (raw.players.map(migratePlayer).filter(Boolean) as PartyPlayer[])
    : [];

  const gameHistory = Array.isArray(raw.gameHistory)
    ? (raw.gameHistory.map(migrateHistoryEntry).filter(Boolean) as GameHistoryEntry[])
    : [];

  const playlist = Array.isArray(raw.playlist)
    ? raw.playlist.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];

  const playlistIndex = Math.min(
    Math.max(0, Math.floor(asNumber(raw.playlistIndex, 0))),
    playlist.length
  );

  return {
    id,
    playMode: raw.playMode === 'controllers' ? 'controllers' : 'local',
    ...(typeof raw.roomCode === 'string' ? { roomCode: raw.roomCode } : {}),
    players,
    ...(Array.isArray(raw.archivedPlayers) ? { archivedPlayers: raw.archivedPlayers.map(migratePlayer).filter((player): player is PartyPlayer => !!player && !players.some(active => active.id === player.id)) } : {}),
    tvCode: asString(raw.tvCode, generateTvCode()),
    currentGameId: typeof raw.currentGameId === "string" ? raw.currentGameId : null,
    gameHistory,
    isActive: true,
    createdAt: asNumber(raw.createdAt, Date.now()),
    playlist,
    playlistIndex,
    playlistActive: raw.playlistActive === true && playlistIndex < playlist.length,
    schemaVersion: PARTY_SCHEMA_VERSION,
  };
}

/** First symbol and colour nobody uses yet; duplicates are allowed once all are taken. */
export function suggestPlayerLook(taken: readonly { avatar?: string; color?: string }[]): { avatar: string; color: string } {
  const avatars = new Set(taken.map(p => p.avatar));
  const colors = new Set(taken.map(p => p.color?.toLowerCase()));
  return {
    avatar: PLAYER_AVATARS.find(a => !avatars.has(a)) ?? PLAYER_AVATARS[taken.length % PLAYER_AVATARS.length],
    color: PLAYER_COLORS.find(c => !colors.has(c)) ?? PLAYER_COLORS[taken.length % PLAYER_COLORS.length],
  };
}
