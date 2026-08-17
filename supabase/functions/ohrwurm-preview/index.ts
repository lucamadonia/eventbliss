import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// OHRWURM — Song-Vorschau-Proxy.
// Löst Künstler+Titel über die kostenlose iTunes Search API zu einer
// 30-Sekunden-Vorschau (previewUrl) auf. Server-seitig, damit kein CORS-
// Problem entsteht und die Matching-Logik gekapselt bleibt. Kein User-Login
// nötig (öffentliches Spiel) — der Anon-Key der Supabase-Invoke reicht.
//
// WICHTIG — warum hier mehr steht als ein einzelner fetch():
// Findet dieser Endpunkt nichts, läuft die Spielrunde STUMM: der Spieler muss
// blind raten und verliert die Karte. Zwei Ursachen dafür waren real:
//  1. `limit=1` + fest verdrahtetes `country=DE` — war der Top-Treffer eine
//     Live-Version, ein Karaoke-Cover oder im DE-Store ohne Vorschau, gab es
//     keinen zweiten Versuch. Jetzt: mehrere Treffer prüfen, dann ohne Land,
//     dann lockerer Titel-Suchlauf mit Künstler-Abgleich.
//  2. iTunes drosselt bei ~20 Anfragen/Minute PRO IP — und alle Nutzer teilen
//     sich die Egress-IP der Edge-Runtime. Die Drossel wurde als „nichts
//     gefunden" getarnt (HTTP 200 mit previewUrl:null), also konnte der Client
//     nicht zwischen „Song gibt's nicht" und „gerade gedrosselt" unterscheiden.
//     Jetzt liefert die Antwort ein `reason`, und der Client wiederholt nur
//     dann — und cached nur echte Fehltreffer negativ.

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
  /** Gesetzt, wenn KEIN Treffer wegen eines Upstream-Problems (Drossel/Ausfall)
   *  zustande kam. Fehlt das Feld bei previewUrl===null, gibt es den Song
   *  wirklich nicht — nur dann darf der Client negativ cachen. */
  reason?: string;
}

interface ItunesHit {
  previewUrl?: string;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
}

// --- Isolate-Cache --------------------------------------------------------
// Lebt nur so lange wie die Instanz, ist aber genau dort wirksam, wo es zählt:
// eine Spielrunde feuert dieselben Songs bei Tausch/Rematch mehrfach an.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // Treffer
const MISS_TTL_MS = 30 * 60 * 1000;      // echte Fehltreffer kürzer halten
const cache = new Map<string, { hit: ItunesHit | null; at: number }>();

function cacheGet(key: string): { hit: ItunesHit | null } | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  const ttl = e.hit ? CACHE_TTL_MS : MISS_TTL_MS;
  if (Date.now() - e.at > ttl) { cache.delete(key); return undefined; }
  return { hit: e.hit };
}

function cacheSet(key: string, hit: ItunesHit | null) {
  // Simple Deckelung, damit ein langlebiges Isolate nicht unbegrenzt wächst.
  if (cache.size > 500) cache.clear();
  cache.set(key, { hit, at: Date.now() });
}

/** Kleinschreibung, Diakritika und Sonderzeichen weg — für den Künstlerabgleich. */
function norm(s: string): string {
  return s
    .toLowerCase()
    // Umlaute/ß zuerst ausschreiben — NFD allein macht aus "ö" ein "o", was für
    // deutsche Künstlernamen ("Nena" vs "Növa") zu grob wäre.
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Immer die volle Trefferliste zurückgeben — der Aufrufer entscheidet, welcher
// Treffer zählt (Schritt 3 muss zusätzlich den Künstler gegenprüfen und darf
// dafür nicht auf den erstbesten Vorschau-Treffer reduziert werden).
type SearchOutcome =
  | { kind: "ok"; results: ItunesHit[] }
  | { kind: "error"; status: number };

/** Erster Treffer, der überhaupt eine Vorschau hat. */
function firstPlayable(results: ItunesHit[]): ItunesHit | undefined {
  return results.find((r) => !!r.previewUrl);
}

async function search(term: string, country: string | null, limit: number): Promise<SearchOutcome> {
  const params: Record<string, string> = { term, media: "music", entity: "song", limit: String(limit) };
  if (country) params.country = country;
  const url = "https://itunes.apple.com/search?" + new URLSearchParams(params).toString();

  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": "eventbliss-ohrwurm" } });
  } catch (_e) {
    return { kind: "error", status: 0 };
  }
  if (!res.ok) return { kind: "error", status: res.status };

  let data: { results?: ItunesHit[] };
  try {
    data = await res.json() as { results?: ItunesHit[] };
  } catch (_e) {
    return { kind: "error", status: 0 };
  }

  return { kind: "ok", results: data.results ?? [] };
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

  const respond = (hit: ItunesHit | null, reason?: string) =>
    json(
      hit
        ? {
            previewUrl: hit.previewUrl ?? null,
            trackName: hit.trackName,
            artistName: hit.artistName,
            artworkUrl: hit.artworkUrl100,
          }
        : reason
          ? { previewUrl: null, reason }
          : { previewUrl: null },
    );

  try {
    const { artist, title, country } = (await req.json().catch(() => ({}))) as PreviewRequest;
    if (!artist || !title) {
      return json({ error: "artist und title sind erforderlich" }, 400);
    }

    const market = (country || "DE").toUpperCase();
    const key = `${norm(artist)}|${norm(title)}|${market}`;

    const cached = cacheGet(key);
    if (cached) return respond(cached.hit);

    const term = `${artist} ${title}`.trim();
    let lastError: number | null = null;

    // 1) Künstler + Titel im Zielmarkt.
    const a = await search(term, market, 5);
    if (a.kind === "error") lastError = a.status;
    else {
      const hit = firstPlayable(a.results);
      if (hit) { cacheSet(key, hit); return respond(hit); }
    }

    // 2) Ohne Marktbeschränkung — viele Titel sind im DE-Store nicht lizenziert.
    const b = await search(term, null, 5);
    if (b.kind === "error") lastError = b.status;
    else {
      const hit = firstPlayable(b.results);
      if (hit) { cacheSet(key, hit); return respond(hit); }
    }

    // 3) Nur der Titel, dafür breit — mit Künstler-Gegenprobe über die GANZE
    //    Liste. Ohne die Probe würden wir womöglich einen fremden Song
    //    ausliefern, und ein falscher Song ist schlimmer als gar kein Ton:
    //    er führt beim Einordnen zur falschen Jahreszahl.
    const c = await search(title.trim(), null, 25);
    if (c.kind === "error") lastError = c.status;
    else {
      const wanted = norm(artist);
      const match = c.results.find((x) => {
        if (!x.previewUrl || !x.artistName) return false;
        const got = norm(x.artistName);
        return got === wanted || got.includes(wanted) || wanted.includes(got);
      });
      if (match) { cacheSet(key, match); return respond(match); }
    }

    // Kein Treffer. War unterwegs ein Upstream-Fehler? Dann NICHT negativ
    // cachen und dem Client den Grund nennen, damit er es erneut versucht.
    if (lastError !== null) return respond(null, `itunes_${lastError}`);

    cacheSet(key, null);
    return respond(null);
  } catch (_e) {
    // Unerwarteter Fehler ist immer transient behandelbar — kein negativer Cache.
    return respond(null, "internal");
  }
});
