/**
 * creator-view — der Token-Zugang zum persoenlichen Influencer-Bereich.
 *
 * WARUM UEBERHAUPT EINE FUNCTION: `influencer_directory` hat bewusst KEINE
 * oeffentliche Leseregel. Es sind Kontaktdaten von Privatpersonen; wer den
 * Tabellennamen kennt, soll nicht die Liste lesen koennen. Der Client kommt
 * deshalb nicht direkt an die Zeile, sondern nur hier vorbei.
 *
 * WAS HERAUSGEHT, IST BEWUSST WENIG: Handle, Name, Sprache, der aktive Deal
 * und die Aufgaben. NICHT: die Vertriebsnotizen, die Bewertung des
 * Erstkontakts, die E-Mail-Adresse, der Verlauf. Ein Token, der einmal in
 * einem geteilten Chat landet, soll nicht das halbe CRM oeffnen.
 *
 * SCHREIBEN DARF ER GENAU EINES: einen Nachweis-Link zu einer eigenen Aufgabe
 * einreichen. Freigeben nicht — das bleibt im Adminbereich, sonst genehmigt
 * sich der Influencer selbst. Dieselbe Trennung steht in der RLS-Regel der
 * Tabelle.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) =>
  console.log(`[CREATOR-VIEW] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";

    // Kein Token, keine Auskunft. Und keine Fehlermeldung, die verraet, ob es
    // den Token gibt — die Antwort ist in beiden Faellen dieselbe.
    if (!token || token.length < 8) return json({ creator: null }, 200);

    const { data: creator, error } = await supabase
      .from("influencer_directory")
      .select("id, handle, display_name, language")
      .eq("invite_token", token)
      .maybeSingle();

    if (error) {
      console.error("lookup failed", error.message);
      return json({ creator: null }, 200);
    }
    if (!creator) return json({ creator: null }, 200);

    /* ── Einreichen ──────────────────────────────────────────────── */
    if (body.submit) {
      const taskId = Number(body.submit.taskId);
      const proofUrl = typeof body.submit.proofUrl === "string" ? body.submit.proofUrl.trim() : "";

      if (!Number.isFinite(taskId) || !proofUrl) {
        return json({ error: "Aufgabe oder Link fehlt." }, 400);
      }
      // Nur http(s). Ein "javascript:"-Link waere ein Einfallstor, und der
      // Adminbereich zeigt diese Links als anklickbaren Knopf an.
      if (!/^https?:\/\//i.test(proofUrl)) {
        return json({ error: "Bitte einen vollständigen Link mit https:// angeben." }, 400);
      }

      // Die Aufgabe MUSS diesem Influencer gehoeren. Ohne diese Bedingung
      // koennte ein gueltiger Token fremde Aufgaben beschreiben.
      const { error: updateError } = await supabase
        .from("influencer_deliverables")
        .update({
          proof_url: proofUrl,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .eq("influencer_id", creator.id)
        // Was schon freigegeben ist, bleibt freigegeben.
        .neq("status", "approved");

      if (updateError) {
        console.error("submit failed", updateError.message);
        return json({ error: "Konnte nicht gespeichert werden." }, 500);
      }

      // Auch das gehoert in den Verlauf: es passiert ohne Zutun des Teams.
      await supabase.from("influencer_activity").insert({
        influencer_id: creator.id,
        action: "proof_submitted",
        details: { taskId, proofUrl },
      });
      log("proof submitted", { influencer: creator.id, task: taskId });
      return json({ ok: true });
    }

    /* ── Ansehen ─────────────────────────────────────────────────── */
    const { data: deal } = await supabase
      .from("influencer_deals")
      .select("reward_kinds, trial_months, unlimited, commission_rate, ends_at, voucher_id")
      .eq("influencer_id", creator.id)
      .eq("status", "active")
      .maybeSingle();

    let voucherCode: string | null = null;
    if (deal?.voucher_id) {
      const { data: voucher } = await supabase
        .from("vouchers")
        .select("code, is_active")
        .eq("id", deal.voucher_id)
        .maybeSingle();
      // Ein abgeschalteter Gutschein wird nicht mehr gezeigt — sonst tippt
      // jemand einen Code ab, der nicht mehr geht.
      if (voucher?.is_active) voucherCode = voucher.code as string;
    }

    /*
      Das Briefing — mit AUSDRUECKLICHER Feldliste.

      Die Liste spiegelt PORTAL_FIELDS aus src/lib/influencer-briefing.ts.
      Sie ist eine Positivliste: ein spaeter ergaenztes Feld ist damit
      automatisch intern, bis es hier bewusst eingetragen wird.
      `internal_notes` steht nicht darin und darf nie darin stehen.
    */
    const { data: briefing } = await supabase
      .from("influencer_briefings")
      .select(
        "headline, core_message, tone, dos, donts, mention_handles, hashtags, " +
        "link_url, discount_code, discount_note, disclosure_required, " +
        "disclosure_text, approval_required, publish_from, publish_until, extra"
      )
      .eq("influencer_id", creator.id)
      .maybeSingle();

    /*
      ALLE Briefing-Vorlagen, nicht nur das eigene Briefing.

      Wer angeschrieben wird, soll sehen koennen, was ueberhaupt moeglich ist,
      bevor etwas vereinbart ist. Dieselbe Positivliste wie oben — die internen
      Vermerke der Vorlagen bleiben ebenso draussen.
    */
    const { data: templates } = await supabase
      .from("influencer_briefing_templates")
      .select(
        "id, name, headline, core_message, tone, dos, donts, mention_handles, " +
        "hashtags, link_url, disclosure_required, disclosure_text, extra"
      )
      .order("name");

    // Materialien als zeitlich begrenzte Links — der Bucket ist privat.
    const { data: assetRows } = await supabase
      .from("influencer_briefing_assets")
      .select("id, file_name, storage_path, mime_type, size_bytes")
      .eq("influencer_id", creator.id)
      .order("created_at", { ascending: false });

    const assets: { id: number; file_name: string; url: string | null }[] = [];
    for (const a of assetRows ?? []) {
      const { data: signed } = await supabase.storage
        .from("influencer-assets")
        .createSignedUrl(a.storage_path, 600);
      assets.push({ id: a.id, file_name: a.file_name, url: signed?.signedUrl ?? null });
    }

    const { data: tasks } = await supabase
      .from("influencer_deliverables")
      .select("id, kind, title, due_at, status, proof_url")
      .eq("influencer_id", creator.id)
      .order("due_at", { ascending: true });

    return json({
      creator: {
        handle: creator.handle,
        display_name: creator.display_name,
        language: creator.language,
        deal: deal
          ? {
              reward_kinds: deal.reward_kinds ?? [],
              trial_months: deal.trial_months,
              unlimited: deal.unlimited,
              commission_rate: deal.commission_rate,
              ends_at: deal.ends_at,
              voucher_code: voucherCode,
            }
          : null,
        briefing: briefing ?? null,
        templates: templates ?? [],
        assets,
        tasks: tasks ?? [],
      },
    });
  } catch (e) {
    console.error("unhandled", e instanceof Error ? e.message : String(e));
    return json({ creator: null }, 200);
  }
});
