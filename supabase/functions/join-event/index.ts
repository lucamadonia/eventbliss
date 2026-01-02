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
    const access_code = typeof rawBody.access_code === 'string' 
      ? rawBody.access_code.trim().slice(0, 20) 
      : null;

    if (!access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Access code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate access code format (alphanumeric only)
    if (!/^[A-Z0-9]{4,10}$/i.test(access_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid access code format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Looking for event with access code");

    // Find event by access code
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, slug, name, honoree_name, event_type, event_date, status")
      .eq("access_code", access_code.toUpperCase())
      .maybeSingle();

    if (eventError) {
      console.error("Error finding event");
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

    console.log("Found event by access code");

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
    console.error("Error in join-event");
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
