/**
 * newsletter-confirm — Double-Opt-In landing endpoint.
 *
 * Flow:
 *   1. User submits email → newsletter_subscribers row created with
 *      `confirmed_at = NULL` and a `confirmation_token` generated.
 *   2. Welcome email sent containing
 *      https://event-bliss.com/api/newsletter-confirm?token=…
 *   3. This Edge Function validates the token and sets `confirmed_at`.
 *
 * GDPR Art. 6(1)(a) + Art. 7(1) — provides the audit trail that proves
 * informed consent for newsletter marketing.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const PUBLIC_BASE = "https://event-bliss.com";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || token.length < 32) {
      return htmlResponse(buildPage("Bestätigung fehlgeschlagen", "Der Bestätigungs-Link ist ungültig oder unvollständig."), 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("id, email, confirmed_at")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (error || !data) {
      return htmlResponse(buildPage("Bestätigung fehlgeschlagen", "Der Bestätigungs-Link ist nicht mehr gültig. Bitte melde dich erneut an."), 404);
    }

    if (data.confirmed_at) {
      return htmlResponse(buildPage("Bereits bestätigt ✅", `Deine E-Mail ${data.email} ist bereits aktiv. Du erhältst unseren Newsletter.`), 200);
    }

    const { error: updateError } = await admin
      .from("newsletter_subscribers")
      .update({
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("[newsletter-confirm] update failed", updateError);
      return htmlResponse(buildPage("Bestätigung fehlgeschlagen", "Bitte versuche es später erneut oder kontaktiere uns: privacy@event-bliss.com"), 500);
    }

    return htmlResponse(buildPage("Newsletter aktiviert 🎉", `Vielen Dank! Deine E-Mail ${data.email} ist nun bestätigt. Du erhältst unsere Updates ab sofort.`), 200);
  } catch (err) {
    console.error("[newsletter-confirm] unexpected error", err);
    return htmlResponse(buildPage("Fehler", "Ein technischer Fehler ist aufgetreten."), 500);
  }

  function htmlResponse(html: string, status: number): Response {
    return new Response(html, {
      status,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function buildPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${escapeHtml(title)} — EventBliss</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #fff; margin: 0; min-height: 100vh; display: grid; place-items: center; }
    .card { max-width: 540px; padding: 3rem 2rem; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; }
    h1 { margin: 0 0 1rem; background: linear-gradient(135deg, #8B5CF6, #EC4899, #06B6D4); -webkit-background-clip: text; background-clip: text; color: transparent; }
    p { margin: 0 0 1.5rem; line-height: 1.6; opacity: 0.85; }
    a { color: #06B6D4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="${PUBLIC_BASE}/">← Zurück zu EventBliss</a></p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}
