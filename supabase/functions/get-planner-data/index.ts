import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { serviceClient, getUserId, isEventMember, isEventOrganizer, eventTabIsPublic, unauthorized } from "../_shared/authz.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = serviceClient();

    const url = new URL(req.url);
    const eventId = url.searchParams.get("event_id");

    if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
      return new Response(
        JSON.stringify({ error: "Valid event_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AuthZ: members/organizer, OR anyone if the organizer made the schedule
    // publicly visible (opt-in share).
    const userId = await getUserId(req, supabase);
    const _ok =
      (await isEventMember(supabase, eventId, userId)) ||
      (await isEventOrganizer(supabase, eventId, userId)) ||
      (await eventTabIsPublic(supabase, eventId, ["planner", "schedule"]));
    if (!_ok) {
      return unauthorized(corsHeaders);
    }

    const { data: activities, error: activitiesError } = await supabase
      .from("schedule_activities")
      .select("*")
      .eq("event_id", eventId)
      .order("day_date", { ascending: true })
      .order("start_time", { ascending: true })
      .order("sort_order", { ascending: true });

    if (activitiesError) throw activitiesError;

    const activityIds = (activities || []).map((activity) => activity.id);
    let comments: unknown[] = [];

    if (activityIds.length > 0) {
      const { data: commentsData, error: commentsError } = await supabase
        .from("activity_comments")
        .select("*")
        .in("activity_id", activityIds)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      comments = commentsData || [];
    }

    return new Response(
      JSON.stringify({
        activities: activities || [],
        comments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-planner-data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
