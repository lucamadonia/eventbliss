import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ClaimRequest {
  token: string;
  user_id: string;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, user_id }: ClaimRequest = await req.json();

    if (!token || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Token und User ID sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Claiming invite for user");

    // Find participant with this invite token
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, name, invite_claimed_at, event_id")
      .eq("invite_token", token)
      .single();

    if (participantError || !participant) {
      console.log("Participant not found:", participantError);
      return new Response(
        JSON.stringify({ success: false, error: "Einladungslink ungültig" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already claimed by a different user
    if (participant.invite_claimed_at) {
      console.log("Invite already claimed");
      return new Response(
        JSON.stringify({ success: false, error: "Diese Einladung wurde bereits angenommen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update participant with user_id and mark as claimed
    const { error: updateError } = await supabase
      .from("participants")
      .update({
        user_id: user_id,
        invite_claimed_at: new Date().toISOString(),
        can_access_dashboard: true,
        status: "confirmed",
      })
      .eq("id", participant.id);

    if (updateError) {
      console.error("Error updating participant:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Fehler beim Aktivieren des Zugangs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invite claimed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dashboard-Zugang aktiviert",
        participant_id: participant.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error claiming invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
