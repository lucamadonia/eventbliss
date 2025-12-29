import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: "Slug is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching event:", slug);

    // Get event data
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      throw new Error("Failed to fetch event");
    }

    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: "Event not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get participants with all access fields
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, name, email, role, status, avatar_url, can_access_dashboard, dashboard_permissions, invite_token, invite_sent_at, invite_claimed_at, user_id")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
    }

    // Get response count
    const { count: responseCount, error: countError } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    if (countError) {
      console.error("Error counting responses:", countError);
    }

    // Check if form is locked
    const settings = event.settings || {};
    const isFormLocked = settings.form_locked === true;
    const lockedBlock = settings.locked_block;

    console.log("Event found:", event.name, "Participants:", participants?.length);

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: event.id,
          slug: event.slug,
          name: event.name,
          access_code: event.access_code,
          honoree_name: event.honoree_name,
          event_type: event.event_type,
          event_date: event.event_date,
          description: event.description,
          status: event.status,
          locale: event.locale,
          currency: event.currency,
          timezone: event.timezone,
          theme: event.theme,
          settings: event.settings,
          survey_deadline: event.survey_deadline,
          is_form_locked: isFormLocked,
          locked_block: lockedBlock,
        },
        participants: participants || [],
        response_count: responseCount || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-event:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
