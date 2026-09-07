export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isPremium: boolean;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  players: RoomPlayer[];
  gameId: string;
  status: 'lobby' | 'playing' | 'finished';
  settings: Record<string, unknown>;
  sessionId: string;
  participantIds: string[];
}

export type RoomConnection = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
export type RoomData = Record<string, unknown>;
export type RoomListener = (data: RoomData) => void;
export interface RoomSnapshot {
  room: GameRoom | null;
  players: RoomPlayer[];
  connection: RoomConnection;
  error: string | null;
  myPlayerId: string;
}

export interface SavedRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  playerId: string;
  timestamp: number;
}

export function getSavedRoom(): SavedRoom | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem('eventbliss_active_room') || localStorage.getItem('eventbliss_active_room') || 'null') as SavedRoom | null;
    return saved && /^[A-Z2-9]{6}$/.test(saved.roomCode) && Date.now() - saved.timestamp < 2 * 60 * 60 * 1000 ? saved : null;
  } catch { return null; }
}

export function getRoomHistory(): SavedRoom[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('eventbliss_room_history') || '[]');
    return Array.isArray(value) ? value.filter((r: SavedRoom) => r && typeof r.roomCode === 'string' && Date.now() - r.timestamp < 86400000).slice(0, 10) : [];
  } catch { return []; }
}

export function rememberRoom(room: GameRoom, playerId: string): void {
  try {
    const saved: SavedRoom = { roomCode: room.roomCode, gameId: room.gameId, hostId: room.hostId, playerId, timestamp: Date.now() };
    localStorage.setItem('eventbliss_active_room', JSON.stringify(saved));
    sessionStorage.setItem('eventbliss_active_room', JSON.stringify(saved));
    localStorage.setItem('eventbliss_room_history', JSON.stringify([saved, ...getRoomHistory().filter(r => r.roomCode !== room.roomCode)].slice(0, 10)));
  } catch { /* Storage is optional. */ }
}

export function removeFromRoomHistory(roomCode: string): void {
  try {
    localStorage.setItem('eventbliss_room_history', JSON.stringify(getRoomHistory().filter(r => r.roomCode !== roomCode)));
    if (getSavedRoom()?.roomCode === roomCode) { localStorage.removeItem('eventbliss_active_room'); sessionStorage.removeItem('eventbliss_active_room'); }
  } catch { /* Storage is optional. */ }
}
