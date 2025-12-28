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

    const { access_code } = await req.json();

    if (!access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Access code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Looking for event with code:", access_code.toUpperCase());

    // Find event by access code
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, slug, name, honoree_name, event_type, event_date, status")
      .eq("access_code", access_code.toUpperCase())
      .maybeSingle();

    if (eventError) {
      console.error("Error finding event:", eventError);
      throw new Error("Failed to find event");
    }

    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid access code" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found event:", event.slug);

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          slug: event.slug,
          name: event.name,
          honoree_name: event.honoree_name,
          event_type: event.event_type,
          event_date: event.event_date,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in join-event:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
