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
    const { event_id, settings, survey_deadline, status, locked_block } = body;

    if (!event_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Event ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Updating event settings for:", event_id);

    // Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("settings")
      .eq("id", event_id)
      .single();

    if (fetchError || !event) {
      console.error("Event not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Merge settings
    const currentSettings = (event.settings as Record<string, unknown>) || {};
    const newSettings = settings ? { ...currentSettings, ...settings } : currentSettings;

    // Handle locked_block specially
    if (locked_block !== undefined) {
      newSettings.locked_block = locked_block;
      if (locked_block) {
        newSettings.form_locked = true;
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      settings: newSettings,
      updated_at: new Date().toISOString(),
    };

    if (survey_deadline !== undefined) {
      updateData.survey_deadline = survey_deadline;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", event_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Event updated successfully");

    return new Response(
      JSON.stringify({ success: true, event: updatedEvent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-event-settings:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
