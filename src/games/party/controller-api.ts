import { supabase } from '@/integrations/supabase/client';

export interface ControllerMember {
  user_id: string;
  player_id: string;
  name: string;
  is_host: boolean;
}
export interface ControllerPartyData {
  party: {
    created_at?: string;
    id: string; code: string; revision: number; host_user_id: string; host_player_id: string;
    host_plays: boolean; premium: boolean; status: 'lobby' | 'playing' | 'finished';
    playlist: string[]; current_match_id: string | null; current_game_id: string | null;
  };
  members: ControllerMember[];
  past_members?: ControllerMember[];
  results: { match_id: string; game_id: string; scores: Record<string, number>; scored: boolean; created_at: string }[];
}
export type ControllerAction = 'create' | 'join' | 'read' | 'start' | 'finish' | 'playlist' | 'end' | 'leave' | 'abort';

export async function controllerRequest(action: ControllerAction, code: string | null, payload: Record<string, unknown> = {}): Promise<ControllerPartyData> {
  // The migration adds this RPC; keep the generated client types unchanged until deployed.
  const { data, error } = await supabase.rpc('controller_party_request' as never, {
    action, code, payload,
  } as never);
  if (error) throw new Error(error.message);
  const result = data as unknown as ControllerPartyData;
  if (!result?.party || !Array.isArray(result.members) || !Array.isArray(result.results)) throw new Error('Invalid party response');
  return result;
}
