import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple validation helpers
function isValidString(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.length <= maxLength;
}

function isValidArray(value: unknown, maxItems = 50): value is unknown[] {
  return Array.isArray(value) && value.length <= maxItems;
}

function sanitizeString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

function sanitizeStringArray(value: unknown, maxItems = 50, maxLength = 200): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map(item => item.trim().slice(0, maxLength));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = body as Record<string, unknown>;

    // Validate and sanitize required fields
    const event_id = sanitizeString(rawBody.event_id, 100);
    const participant = sanitizeString(rawBody.participant, 200);
    const attendance = sanitizeString(rawBody.attendance, 20);
    const group_code = sanitizeString(rawBody.group_code, 20);

    // Validate UUID format for event_id
    if (!event_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid event ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!participant || participant.length < 1) {
      return new Response(
        JSON.stringify({ success: false, error: "Participant name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!attendance || !['yes', 'no', 'maybe'].includes(attendance)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid attendance value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing survey response for event");

    // Sanitize optional fields
    const duration_pref = sanitizeString(rawBody.duration_pref, 50);
    const date_blocks = sanitizeStringArray(rawBody.date_blocks, 100, 50);
    const partial_days = sanitizeString(rawBody.partial_days, 200);
    const budget = rawBody.budget;
    const destination = rawBody.destination;
    const de_city = sanitizeString(rawBody.de_city, 100);
    const travel_pref = sanitizeString(rawBody.travel_pref, 50);
    const preferences = sanitizeStringArray(rawBody.preferences, 30, 100);
    const fitness_level = sanitizeString(rawBody.fitness_level, 50);
    const alcohol = sanitizeString(rawBody.alcohol, 50);
    const restrictions = sanitizeString(rawBody.restrictions, 1000);
    const suggestions = sanitizeString(rawBody.suggestions, 2000);

    // Fetch event to validate access code
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, access_code, settings")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("Event not found");
      return new Response(
        JSON.stringify({ success: false, error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate group code
    if (event.access_code && group_code !== event.access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid group code" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if form is locked
    const settings = event.settings as Record<string, unknown> || {};
    if (settings.form_locked === true) {
      return new Response(
        JSON.stringify({ success: false, error: "Form is closed" }),
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

    // Normalize budget/destination/duration - can be string or array
    const budgetChoices = Array.isArray(budget) 
      ? sanitizeStringArray(budget, 10, 50) 
      : (typeof budget === 'string' ? [budget.slice(0, 50)] : []);
    const destinationChoices = Array.isArray(destination) 
      ? sanitizeStringArray(destination, 10, 100) 
      : (typeof destination === 'string' ? [destination.slice(0, 100)] : []);
    const durationChoices = Array.isArray(duration_pref) 
      ? sanitizeStringArray(duration_pref as unknown[], 10, 50) 
      : (duration_pref ? [duration_pref] : []);
    
    const primaryBudget = budgetChoices[0] || "150-250";
    const primaryDestination = destinationChoices[0] || "either";
    const primaryDuration = durationChoices[0] || "either";

    const responseData = {
      event_id,
      participant,
      attendance,
      duration_pref: primaryDuration,
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
        duration_choices: durationChoices,
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
      console.log("Updated existing response");
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
      console.error("Error saving response");
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
    console.error("Error in submit-response");
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
