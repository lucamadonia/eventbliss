import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    // Validate slug format (alphanumeric with hyphens, reasonable length)
    if (!/^[a-z0-9-]{3,100}$/.test(slug)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid slug format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching event by slug");

    // Check if caller is authenticated and is a participant/organizer
    let isAuthorized = false;
    let userId: string | null = null;
    
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Get event data
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (eventError) {
      console.error("Error fetching event");
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

    // Check if user is authorized (event creator or participant)
    if (userId) {
      // Check if user is the event creator
      if (event.created_by === userId) {
        isAuthorized = true;
      } else {
        // Check if user is a participant
        const { data: participant } = await supabase
          .from("participants")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (participant) {
          isAuthorized = true;
        }
      }
    }

    // Get participants - filter sensitive fields based on authorization
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, name, email, role, status, avatar_url, can_access_dashboard, dashboard_permissions, invite_token, invite_sent_at, invite_claimed_at, user_id")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });

    if (participantsError) {
      console.error("Error fetching participants");
    }

    // Filter sensitive data for unauthorized users
    type ParticipantData = {
      id: string;
      name: string;
      email?: string | null;
      role: string;
      status: string;
      avatar_url?: string | null;
      can_access_dashboard?: boolean | null;
      dashboard_permissions?: unknown;
      invite_token?: string | null;
      invite_sent_at?: string | null;
      invite_claimed_at?: string | null;
      user_id?: string | null;
    };
    
    let safeParticipants: ParticipantData[] = participants || [];
    if (!isAuthorized) {
      safeParticipants = safeParticipants.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        status: p.status,
        avatar_url: p.avatar_url,
        // Exclude sensitive fields: email, invite_token, user_id, dashboard_permissions for unauthorized users
      }));
    }

    // Get response count
    const { count: responseCount, error: countError } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    if (countError) {
      console.error("Error counting responses");
    }

    // Check if form is locked
    const settings = event.settings || {};
    const isFormLocked = settings.form_locked === true;
    const lockedBlock = settings.locked_block;

    // Check if event creator has premium
    let creatorIsPremium = false;
    if (event.created_by) {
      const { data: premiumCheck } = await supabase.rpc("is_premium", { _user_id: event.created_by });
      creatorIsPremium = premiumCheck === true;
    }

    console.log("Event found, participants:", safeParticipants?.length || 0, "creator_premium:", creatorIsPremium);

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
          creator_is_premium: creatorIsPremium,
        },
        participants: safeParticipants,
        response_count: responseCount || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-event");
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
