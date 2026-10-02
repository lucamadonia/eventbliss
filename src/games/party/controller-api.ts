import { supabase } from '@/integrations/supabase/client';
import { serverClock } from './scene-clock';
import { normalizePartyData } from './controller-normalize';

export interface ControllerMember {
  /** null = guest seat played on the Host's device. */
  user_id: string | null;
  player_id: string;
  name: string;
  is_host: boolean;
  avatar: string;
  color: string;
  /** Host player_id for guest seats, null for phone seats. */
  controlled_by: string | null;
  /** A claim waits for the running match to end. */
  pending_claim: boolean;
  /** That pending claim is this caller's (only ever true for the claimer). */
  pending_claim_mine?: boolean;
  banned?: boolean;
}
export interface ControllerPartyData {
  party: {
    created_at?: string;
    id: string; code: string; revision: number; host_user_id: string; host_player_id: string;
    host_plays: boolean; premium: boolean; status: 'lobby' | 'playing' | 'finished';
    playlist: string[]; current_match_id: string | null; current_game_id: string | null;
    /** Oldest party protocol a client must speak (2 once guests exist). */
    min_client?: number;
    /** Participants of the running match (shrinks on kick 'match_only'); absent on old servers. */
    participant_ids?: string[] | null;
  };
  members: ControllerMember[];
  past_members?: ControllerMember[];
  results: { match_id: string; game_id: string; scores: Record<string, number>; scored: boolean; created_at: string }[];
  /** Server time for the scene clock (absent on old servers). */
  server_now?: string;
  /** false: joined a full party without a seat (B13); claim a guest seat next. */
  seated?: boolean;
}
export type ControllerAction = 'create' | 'join' | 'read' | 'start' | 'finish' | 'playlist' | 'end' | 'leave' | 'abort'
  | 'add_guest' | 'remove_guest' | 'claim' | 'release' | 'profile' | 'kick' | 'unban';
/** Party protocol this client speaks; compared with `party.min_client`. */
export const PARTY_CLIENT_VERSION = 2;
export const needsClientUpdate = (data: ControllerPartyData | null) => (data?.party.min_client ?? 0) > PARTY_CLIENT_VERSION;
export type KickMode = 'match_only' | 'party' | 'ban';

export async function controllerRequest(action: ControllerAction, code: string | null, payload: Record<string, unknown> = {}): Promise<ControllerPartyData> {
  const sentAt = Date.now();
  // The migration adds this RPC; keep the generated client types unchanged until deployed.
  const { data, error } = await supabase.rpc('controller_party_request' as never, {
    action, code, payload,
  } as never);
  if (error) throw new Error(error.message);
  // Old servers omit the party-play fields: normalize once at the boundary.
  const result = normalizePartyData(data);
  if (!result) throw new Error('Invalid party response');
  if (typeof result.server_now === 'string') serverClock.sample(result.server_now, sentAt, Date.now());
  return result;
}
