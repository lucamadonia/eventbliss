import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/audio/speech";

interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voice, language, speed } = await req.json() as TTSRequest;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text ist erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit text length to prevent abuse (max ~2000 chars)
    if (text.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Text zu lang (max 2000 Zeichen)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      console.error("MISTRAL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TTS-Service nicht konfiguriert" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Mistral Voxtral TTS API
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voxtral-mini-tts-2603",
        input: text,
        voice: voice || "c69964a6-ab8b-4f8a-9465-ec0925096ec8",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mistral TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "TTS-Generierung fehlgeschlagen" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream audio back to client
    const audioData = await response.arrayBuffer();

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Voxtral TTS error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
