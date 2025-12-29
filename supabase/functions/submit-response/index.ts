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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const {
      event_id,
      participant,
      attendance,
      duration_pref,
      date_blocks,
      partial_days,
      budget,
      destination,
      de_city,
      travel_pref,
      preferences,
      fitness_level,
      alcohol,
      restrictions,
      suggestions,
      group_code,
    } = body;

    console.log("Submitting response for event:", event_id, "participant:", participant);

    // Validate required fields
    if (!event_id || !participant || !attendance) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch event to validate access code
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, access_code, settings")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        JSON.stringify({ success: false, error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate group code
    if (event.access_code && group_code !== event.access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Ungültiger Gruppencode" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if form is locked
    const settings = event.settings as Record<string, unknown> || {};
    if (settings.form_locked === true) {
      return new Response(
        JSON.stringify({ success: false, error: "Das Formular ist geschlossen" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if participant already submitted - upsert logic
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id")
      .eq("event_id", event_id)
      .eq("participant", participant)
      .maybeSingle();

    // Normalize budget/destination - can be string or array
    const budgetChoices = Array.isArray(budget) ? budget : (budget ? [budget] : []);
    const destinationChoices = Array.isArray(destination) ? destination : (destination ? [destination] : []);
    const primaryBudget = budgetChoices[0] || "150-250";
    const primaryDestination = destinationChoices[0] || "either";

    const responseData = {
      event_id,
      participant,
      attendance,
      duration_pref: duration_pref || "either",
      date_blocks: date_blocks || [],
      partial_days: partial_days || null,
      budget: primaryBudget,
      destination: primaryDestination,
      de_city: de_city || null,
      travel_pref: travel_pref || "either",
      preferences: preferences || [],
      fitness_level: fitness_level || "normal",
      alcohol: alcohol || null,
      restrictions: restrictions || null,
      suggestions: suggestions || null,
      meta: {
        budget_choices: budgetChoices,
        destination_choices: destinationChoices,
      },
    };

    let result;
    if (existingResponse) {
      // Update existing response
      result = await supabase
        .from("responses")
        .update(responseData)
        .eq("id", existingResponse.id)
        .select()
        .single();
      console.log("Updated existing response:", existingResponse.id);
    } else {
      // Insert new response
      result = await supabase
        .from("responses")
        .insert(responseData)
        .select()
        .single();
      console.log("Inserted new response");
    }

    if (result.error) {
      console.error("Error saving response:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update participant status if they exist
    const statusMap: Record<string, string> = {
      yes: "confirmed",
      maybe: "maybe",
      no: "declined",
    };

    await supabase
      .from("participants")
      .update({ 
        status: statusMap[attendance] || "confirmed",
        response_id: result.data.id 
      })
      .eq("event_id", event_id)
      .eq("name", participant);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: result.data,
        updated: !!existingResponse 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-response:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
