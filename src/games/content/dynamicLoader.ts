/**
 * dynamicLoader — holt im Admin gepflegte Zusatzinhalte (`game_content`) für
 * Bombe, Tabu, Stirnraten und Ohne Worte.
 *
 * Der Grundstock jedes Spiels steckt in der App. Was hier geladen wird, kommt
 * DAZU (zusammengeführt in `db-extras.ts` bzw. `pantomime-words.ts`) — es
 * ersetzt nie etwas. Daraus folgt das Offline-Verhalten:
 *  - Ohne Netz und ohne gespeicherten Stand gibt es schlicht keine
 *    Zusatzinhalte; das Spiel läuft mit dem Grundstock.
 *  - Der gespeicherte Stand auf dem Gerät läuft NIE ab. Wer einmal online
 *    gespielt hat, behält die Zusatzinhalte auch nach Wochen ohne Netz.
 *  - Ist der Stand älter als fünf Minuten, wird beim Öffnen des Spiels kurz
 *    auf einen frischen gewartet — Änderungen aus dem Admin sind dann schon in
 *    diesem Spiel da.
 *  - Streng je Sprache: Ein nur deutsch gepflegter Eintrag erscheint nicht in
 *    einem englischen Spiel.
 */
import { supabase } from "@/integrations/supabase/client";

/** Eine Zeile aus `game_content`, auf die aktive Sprache reduziert. */
export interface ExtraRow {
  data: Record<string, unknown>;
  difficulty: string | null;
  category: string | null;
}

const REFRESH_AFTER = 5 * 60 * 1000;
const FETCH_TIMEOUT = 3500;
const STALE_WAIT = 1200;

interface ExtraCache { rows: ExtraRow[]; ts: number }

function extraKey(gameId: string, type: string, lang: string) {
  return `eb.gx.${gameId}.${type}.${lang}`;
}

function readExtraCache(key: string): ExtraCache | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const e = JSON.parse(raw) as ExtraCache;
    return Array.isArray(e?.rows) && typeof e.ts === 'number' ? e : null;
  } catch { return null; }
}

const inflight = new Map<string, Promise<ExtraRow[] | null>>();

/** Holt frisch aus der Datenbank. `null` = nicht erreichbar (Speicher bleibt, wie er ist). */
function refreshExtraRows(gameId: string, contentType: string, lang: string): Promise<ExtraRow[] | null> {
  const key = extraKey(gameId, contentType, lang);
  const running = inflight.get(key);
  if (running) return running;

  const run = (async (): Promise<ExtraRow[] | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `game_content` fehlt in den generierten Typen
      const { data, error } = await (supabase.from as any)("game_content")
        .select("content, difficulty, category")
        .eq("game_id", gameId)
        .eq("content_type", contentType)
        .eq("is_active", true)
        .abortSignal(ctrl.signal);
      if (error || !Array.isArray(data)) return null;

      const rows: ExtraRow[] = [];
      for (const row of data) {
        const localized = row?.content?.[lang];
        if (!localized || typeof localized !== 'object') continue;
        rows.push({ data: localized, difficulty: row.difficulty ?? null, category: row.category ?? null });
      }
      // Auch ein leeres Ergebnis wird gespeichert: Was im Admin deaktiviert
      // wurde, muss auf dem Gerät wieder verschwinden.
      try { localStorage.setItem(key, JSON.stringify({ rows, ts: Date.now() })); } catch { /* voll */ }
      return rows;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();

  inflight.set(key, run);
  return run;
}

/**
 * Zusatzinhalte eines Spiels in der angegebenen Sprache. Wirft nie und hängt
 * nie länger als das Zeitlimit — offline kommt der gespeicherte Stand zurück
 * oder eine leere Liste.
 */
export async function loadExtraRows(gameId: string, contentType: string, lang: string): Promise<ExtraRow[]> {
  const cached = readExtraCache(extraKey(gameId, contentType, lang));
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline) return cached?.rows ?? [];
  if (!cached) return (await refreshExtraRows(gameId, contentType, lang)) ?? [];
  if (Date.now() - cached.ts <= REFRESH_AFTER) return cached.rows;

  // Stand ist älter: kurz auf den frischen warten, damit Änderungen aus dem
  // Admin schon bei diesem Spielstart da sind. Dauert es länger, wird mit dem
  // gespeicherten Stand gespielt; der frische landet im Speicher fürs nächste Mal.
  const fresh = refreshExtraRows(gameId, contentType, lang);
  const patience = new Promise<null>((resolve) => setTimeout(() => resolve(null), STALE_WAIT));
  return (await Promise.race([fresh, patience])) ?? cached.rows;
}
