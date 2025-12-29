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
    const url = new URL(req.url);
    const eventId = url.searchParams.get("event_id");

    if (!eventId) {
      return new Response(
        JSON.stringify({ success: false, error: "Event ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all responses for the event
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch responses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate aggregated statistics
    const stats = {
      total_responses: responses.length,
      attendance: {
        yes: responses.filter(r => r.attendance === "yes").length,
        maybe: responses.filter(r => r.attendance === "maybe").length,
        no: responses.filter(r => r.attendance === "no").length,
      },
      date_blocks: {} as Record<string, { yes: number; maybe: number; total: number }>,
      budgets: {} as Record<string, number>,
      destinations: {} as Record<string, number>,
      activities: {} as Record<string, number>,
      fitness_levels: {} as Record<string, number>,
    };

    // Aggregate date blocks
    responses.forEach(r => {
      if (r.attendance === "yes" || r.attendance === "maybe") {
        (r.date_blocks || []).forEach((block: string) => {
          if (!stats.date_blocks[block]) {
            stats.date_blocks[block] = { yes: 0, maybe: 0, total: 0 };
          }
          if (r.attendance === "yes") {
            stats.date_blocks[block].yes++;
          } else {
            stats.date_blocks[block].maybe++;
          }
          stats.date_blocks[block].total++;
        });
      }
    });

    // Aggregate budgets (support multi-select from meta)
    responses.forEach(r => {
      if (r.attendance !== "no") {
        const meta = r.meta as Record<string, unknown> || {};
        const budgetChoices = (meta.budget_choices as string[]) || (r.budget ? [r.budget] : []);
        budgetChoices.forEach((b: string) => {
          stats.budgets[b] = (stats.budgets[b] || 0) + 1;
        });
      }
    });

    // Aggregate destinations (support multi-select from meta)
    responses.forEach(r => {
      if (r.attendance !== "no") {
        const meta = r.meta as Record<string, unknown> || {};
        const destChoices = (meta.destination_choices as string[]) || (r.destination ? [r.destination] : []);
        destChoices.forEach((d: string) => {
          stats.destinations[d] = (stats.destinations[d] || 0) + 1;
        });
      }
    });

    // Aggregate activities
    responses.forEach(r => {
      if (r.attendance !== "no") {
        (r.preferences || []).forEach((pref: string) => {
          stats.activities[pref] = (stats.activities[pref] || 0) + 1;
        });
      }
    });

    // Aggregate fitness levels
    responses.forEach(r => {
      if (r.fitness_level && r.attendance !== "no") {
        stats.fitness_levels[r.fitness_level] = (stats.fitness_levels[r.fitness_level] || 0) + 1;
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        responses,
        stats 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-responses:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
