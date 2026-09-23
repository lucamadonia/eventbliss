/** Server-verified account membership, separate from self-declared presence. */
export interface PartyRoomAccess {
  code: string;
  hostId: string;
  hostPlays: boolean;
  premium: boolean;
  memberIds: string[];
  refresh: () => Promise<PartyRoomAccess>;
  start: (gameId: string, participantIds: string[]) => Promise<string>;
}
