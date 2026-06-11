import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// OHRWURM — Spotify-Track-Resolver (für den Premium-Vollversion-Modus).
// Löst Künstler+Titel über die Spotify Web API (Client-Credentials) zu einer
// Track-URI auf, die das native App-Remote-Plugin abspielt. Secrets:
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (Supabase function secrets).
// Ohne Secrets / ohne Treffer → { uri: null } → Client nutzt 30s-Vorschau.

interface TrackRequest {
  artist?: string;
  title?: string;
  market?: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string | null> {
  const id = Deno.env.get("SPOTIFY_CLIENT_ID");
  const secret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.value;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${id}:${secret}`),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { artist, title, market } = (await req.json().catch(() => ({}))) as TrackRequest;
    if (!artist || !title) return json({ error: "artist und title sind erforderlich" }, 400);

    const token = await getAppToken();
    if (!token) return json({ uri: null, reason: "no_credentials" });

    const mkt = (market || "DE").toUpperCase();

    let lastBody = "";
    const search = async (q: string, withMarket: boolean) => {
      const params: Record<string, string> = { q, type: "track", limit: "1" };
      if (withMarket) params.market = mkt;
      const url = "https://api.spotify.com/v1/search?" + new URLSearchParams(params).toString();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        lastBody = (await res.text().catch(() => "")).slice(0, 300);
        return { ok: false, status: res.status, hit: undefined as undefined | { uri?: string; name?: string; artists?: Array<{ name?: string }> } };
      }
      const data = await res.json() as {
        tracks?: { items?: Array<{ uri?: string; name?: string; artists?: Array<{ name?: string }> }> };
      };
      return { ok: true, status: 200, hit: data.tracks?.items?.[0] };
    };

    // 1) mit Markt, 2) ohne Markt, 3) lockere Freitext-Suche.
    let r = await search(`track:${title} artist:${artist}`, true);
    if (!r.ok) r = await search(`track:${title} artist:${artist}`, false);
    if (r.ok && !r.hit?.uri) r = await search(`${artist} ${title}`, false);

    if (!r.ok) return json({ uri: null, reason: `search_${r.status}`, detail: lastBody });
    const hit = r.hit;
    if (!hit?.uri) return json({ uri: null, reason: "no_hit" });

    return json({ uri: hit.uri, name: hit.name, artist: hit.artists?.[0]?.name });
  } catch (_e) {
    return json({ uri: null });
  }
});
