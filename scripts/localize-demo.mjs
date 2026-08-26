/**
 * Stellt das Demo-Ereignis auf eine andere Sprache um.
 *
 *   node scripts/localize-demo.mjs en
 *
 * Braucht EB_EMAIL und EB_PASS — als Umgebungsvariable oder in .env. Das
 * Skript enthaelt keine Zugangsdaten und legt auch kein Konto an.
 *
 * WOZU: Der Aufnahmelauf schaltet nur die Oberflaeche um. Die Eintraege im
 * Ereignis blieben deutsch, weshalb in den englischen Store-Bildern
 * "Welcome-BBQ an der Finca" unter englischen Reitern steht. Dieses Skript
 * setzt den Inhalt passend zur Sprache, bevor aufgenommen wird.
 *
 * EIN EREIGNIS, NICHT ZEHN. Zehn Demo-Ereignisse waeren zehn Slugs, zehn
 * Datensaetze und zehn Gelegenheiten, dass eines veraltet. Stattdessen wird
 * dasselbe Ereignis vor jeder Sprache umgeschrieben — und am Ende des Laufs
 * wieder auf Deutsch gestellt.
 *
 * ABGLEICH UEBER UHRZEIT UND BETRAG, nicht ueber den Text: nach der ersten
 * Umstellung gibt es den deutschen Text nicht mehr. Ein Textabgleich haette
 * genau einmal funktioniert und danach stillschweigend nichts mehr getan.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { demoContent } from "./demo-content.mjs";

function readEnvFile() {
  try {
    return Object.fromEntries(
      readFileSync(".env", "utf8")
        .split("\n")
        .filter((l) => l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

/** Uhrzeiten kommen als "14:00:00" zurueck, geschluesselt ist "14:00". */
const hhmm = (t) => String(t ?? "").slice(0, 5);

export async function localizeDemo(lang, { quiet = false } = {}) {
  const env = readEnvFile();
  const URL = env.VITE_SUPABASE_URL;
  const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const EMAIL = process.env.EB_EMAIL || env.EB_EMAIL;
  const PASS = process.env.EB_PASS || env.EB_PASS;

  if (!URL || !KEY) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY fehlen in .env");
  if (!EMAIL || !PASS) {
    throw new Error(
      "EB_EMAIL/EB_PASS fehlen. Entweder in .env eintragen oder beim Aufruf mitgeben:\n" +
        `  EB_EMAIL=... EB_PASS=... node scripts/localize-demo.mjs ${lang}`,
    );
  }

  const content = demoContent(lang);

  let ref;
  try {
    ref = JSON.parse(readFileSync("appstore/_demo-event.json", "utf8"));
  } catch {
    throw new Error("appstore/_demo-event.json fehlt — bitte zuerst 'node scripts/_seed.mjs' ausfuehren.");
  }
  if (!ref?.id) throw new Error("keine Ereignis-Kennung in appstore/_demo-event.json");

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const { error: aerr } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (aerr) throw new Error(`Anmeldung fehlgeschlagen: ${aerr.message}`);

  const log = (...a) => {
    if (!quiet) console.log(...a);
  };

  /* ── Das Ereignis selbst ──────────────────────────────────────── */
  {
    const { error } = await sb
      .from("events")
      .update({ name: content.name, description: content.description, locale: lang })
      .eq("id", ref.id);
    if (error) throw new Error(`events: ${error.message}`);
    log(`  Ereignis: ${content.name}`);
  }

  /* ── Programmpunkte, ueber die Uhrzeit ───────────────────────── */
  {
    const { data, error } = await sb
      .from("schedule_activities")
      .select("id, start_time, title")
      .eq("event_id", ref.id);
    if (error) throw new Error(`schedule_activities lesen: ${error.message}`);

    let hit = 0;
    for (const row of data ?? []) {
      const title = content.schedule[hhmm(row.start_time)];
      if (!title) {
        // Kein Abbruch: ein zusaetzlicher Punkt im Ereignis ist kein Fehler,
        // er bleibt eben stehen. Gemeldet wird er trotzdem.
        log(`  ! Programmpunkt ${hhmm(row.start_time)} ohne Uebersetzung: ${row.title}`);
        continue;
      }
      const { error: uerr } = await sb.from("schedule_activities").update({ title }).eq("id", row.id);
      if (uerr) throw new Error(`schedule_activities schreiben: ${uerr.message}`);
      hit++;
    }
    log(`  Programm: ${hit}/${Object.keys(content.schedule).length}`);
  }

  /* ── Ausgaben, ueber den Betrag ──────────────────────────────── */
  {
    const { data, error } = await sb
      .from("expenses")
      .select("id, amount, description")
      .eq("event_id", ref.id);
    if (error) throw new Error(`expenses lesen: ${error.message}`);

    let hit = 0;
    for (const row of data ?? []) {
      const description = content.expenses[Number(row.amount)];
      if (!description) {
        log(`  ! Ausgabe ueber ${row.amount} ohne Uebersetzung: ${row.description}`);
        continue;
      }
      const { error: uerr } = await sb.from("expenses").update({ description }).eq("id", row.id);
      if (uerr) throw new Error(`expenses schreiben: ${uerr.message}`);
      hit++;
    }
    log(`  Ausgaben: ${hit}/${Object.keys(content.expenses).length}`);
  }

  return content;
}

/* Direktaufruf von der Kommandozeile. */
if (process.argv[1]?.endsWith("localize-demo.mjs")) {
  const lang = process.argv[2];
  if (!lang) {
    console.error("Aufruf: node scripts/localize-demo.mjs <sprache>");
    process.exit(1);
  }
  console.log(`Demo-Ereignis auf "${lang}" umstellen …`);
  try {
    await localizeDemo(lang);
    console.log("fertig.");
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
