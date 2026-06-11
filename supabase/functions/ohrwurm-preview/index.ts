import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// OHRWURM — Song-Vorschau-Proxy.
// Löst Künstler+Titel über die kostenlose iTunes Search API zu einer
// 30-Sekunden-Vorschau (previewUrl) auf. Server-seitig, damit kein CORS-
// Problem entsteht und die Matching-Logik gekapselt bleibt. Kein User-Login
// nötig (öffentliches Spiel) — der Anon-Key der Supabase-Invoke reicht.

interface PreviewRequest {
  artist?: string;
  title?: string;
  country?: string;
}

interface PreviewResponse {
  previewUrl: string | null;
  trackName?: string;
  artistName?: string;
  artworkUrl?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: PreviewResponse | { error: string }, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { artist, title, country } = (await req.json().catch(() => ({}))) as PreviewRequest;
    if (!artist || !title) {
      return json({ error: "artist und title sind erforderlich" }, 400);
    }

    const term = `${artist} ${title}`.trim();
    const url =
      "https://itunes.apple.com/search?" +
      new URLSearchParams({
        term,
        media: "music",
        entity: "song",
        limit: "1",
        country: (country || "DE").toUpperCase(),
      }).toString();

    const res = await fetch(url, { headers: { "User-Agent": "eventbliss-ohrwurm" } });
    if (!res.ok) {
      // iTunes nicht erreichbar / Rate-Limit → kein Treffer, Client nutzt Fallback.
      return json({ previewUrl: null });
    }

    const data = await res.json() as {
      results?: Array<{
        previewUrl?: string;
        trackName?: string;
        artistName?: string;
        artworkUrl100?: string;
      }>;
    };

    const hit = data.results?.[0];
    if (!hit?.previewUrl) {
      return json({ previewUrl: null });
    }

    return json({
      previewUrl: hit.previewUrl,
      trackName: hit.trackName,
      artistName: hit.artistName,
      artworkUrl: hit.artworkUrl100,
    });
  } catch (_e) {
    return json({ previewUrl: null });
  }
});
