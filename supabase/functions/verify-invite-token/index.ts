import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface VerifyRequest {
  token: string;
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

    const { token }: VerifyRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token ist erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying invite token");

    // Find participant with this invite token
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(`
        id,
        name,
        invite_token,
        invite_claimed_at,
        can_access_dashboard,
        event_id,
        events!participants_event_id_fkey (
          name,
          slug
        )
      `)
      .eq("invite_token", token)
      .single();

    if (participantError || !participant) {
      console.log("Participant not found:", participantError);
      return new Response(
        JSON.stringify({ success: false, error: "Einladungslink ungültig oder abgelaufen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventData = participant.events as unknown as { name: string; slug: string } | null;

    // Check if already claimed
    const alreadyClaimed = !!participant.invite_claimed_at;

    console.log("Invite verified, already claimed:", alreadyClaimed);

    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          participant_id: participant.id,
          participant_name: participant.name,
          event_name: eventData?.name || "Event",
          event_slug: eventData?.slug || "",
          already_claimed: alreadyClaimed,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
