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

    if (!eventId || !/^[0-9a-f-]{36}$/.test(eventId)) {
      return new Response(
        JSON.stringify({ error: "Valid event_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify event exists
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

    // AuthZ: members/organizer, OR anyone if the organizer made the expenses
    // tab publicly visible (opt-in share).
    const userId = await getUserId(req, supabase);
    const _ok =
      (await isEventMember(supabase, eventId, userId)) ||
      (await isEventOrganizer(supabase, eventId, userId)) ||
      (await eventTabIsPublic(supabase, eventId, ["expenses"]));
    if (!_ok) {
      return unauthorized(corsHeaders);
    }

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (expensesError) throw expensesError;

    // Fetch expense shares
    const expenseIds = (expenses || []).map((e: any) => e.id);
    let shares: any[] = [];
    if (expenseIds.length > 0) {
      const { data: sharesData, error: sharesError } = await supabase
        .from("expense_shares")
        .select("*")
        .in("expense_id", expenseIds);

      if (sharesError) throw sharesError;
      shares = sharesData || [];
    }

    // Fetch planned activities with costs
    const { data: activities, error: activitiesError } = await supabase
      .from("schedule_activities")
      .select("id, title, estimated_cost, currency, category, day_date")
      .eq("event_id", eventId)
      .not("estimated_cost", "is", null);

    if (activitiesError) throw activitiesError;

    return new Response(
      JSON.stringify({
        expenses: expenses || [],
        shares: shares,
        activities: activities || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-expenses");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
