/** A seat played on another member's device (🔁 guest, `controlled_by` on the server). */
export interface PartyGuestSeat {
  id: string;
  name: string;
  avatar: string;
  color: string;
  /** player_id of the controlling device (the host). */
  controlledBy: string;
}

/** Server-verified account membership, separate from self-declared presence. */
export interface PartyRoomAccess {
  code: string;
  hostId: string;
  hostPlays: boolean;
  premium: boolean;
  /** Active, non-banned seats (accounts and guests). Guests have no presence. */
  memberIds: string[];
  /** Guest seats among memberIds. Missing = no guests (pre-guest servers). */
  guests?: PartyGuestSeat[];
  /** Server's current match (party.current_match_id); scopes matchParticipantIds. */
  matchId?: string | null;
  /** Participants of that match per server; shrinks on kick 'match_only'. Null/absent = unknown. */
  matchParticipantIds?: string[] | null;
  refresh: () => Promise<PartyRoomAccess>;
  start: (gameId: string, participantIds: string[]) => Promise<string>;
}
