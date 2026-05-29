/**
 * newsletter-send-confirm — sends the Double-Opt-In confirmation mail to a
 * subscriber. Called from `NewsletterForm.tsx` right after the row is
 * inserted with a fresh `confirmation_token`.
 *
 * Localized templates for de / en / es / fr / it / pt / nl / pl / tr.
 *
 * GDPR Art. 7(1) / § 7 Abs. 2 Nr. 3 UWG — the user must actively click the
 * link in this mail before any marketing is sent.
 */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SITE_URL = "https://event-bliss.com";
const FROM_NAME = "EventBliss";
const FROM_ADDR = Deno.env.get("SMTP_FROM") ?? "noreply@event-bliss.com";

type Lang = "de" | "en" | "es" | "fr" | "it" | "pt" | "nl" | "pl" | "tr";

const TEMPLATES: Record<Lang, { subject: string; greeting: string; body: string; cta: string; ignore: string; signature: string }> = {
  de: {
    subject: "Bitte bestätige deine Newsletter-Anmeldung",
    greeting: "Hi 👋",
    body: "danke für deine Anmeldung beim EventBliss-Newsletter! Bitte bestätige deine E-Mail-Adresse mit einem Klick auf den Button — erst dann erhältst du unsere Updates.",
    cta: "E-Mail-Adresse bestätigen",
    ignore: "Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail einfach — ohne Bestätigung passiert nichts.",
    signature: "Dein EventBliss-Team",
  },
  en: {
    subject: "Please confirm your newsletter subscription",
    greeting: "Hi 👋",
    body: "thanks for signing up for the EventBliss newsletter! Please confirm your email address by clicking the button below — we won't send anything until you do.",
    cta: "Confirm email address",
    ignore: "Didn't sign up? Just ignore this email — nothing happens without your confirmation.",
    signature: "The EventBliss Team",
  },
  es: {
    subject: "Confirma tu suscripción al boletín",
    greeting: "Hola 👋",
    body: "gracias por suscribirte al boletín de EventBliss. Confirma tu correo haciendo clic en el botón — no enviaremos nada hasta que confirmes.",
    cta: "Confirmar correo",
    ignore: "¿No te suscribiste? Simplemente ignora este correo — sin confirmación no pasa nada.",
    signature: "El equipo de EventBliss",
  },
  fr: {
    subject: "Confirme ton inscription à la newsletter",
    greeting: "Salut 👋",
    body: "merci de t'être inscrit à la newsletter EventBliss. Confirme ton adresse e-mail en cliquant sur le bouton — rien ne sera envoyé avant confirmation.",
    cta: "Confirmer l'e-mail",
    ignore: "Tu ne t'es pas inscrit ? Ignore simplement cet e-mail — sans confirmation, rien ne se passe.",
    signature: "L'équipe EventBliss",
  },
  it: {
    subject: "Conferma la tua iscrizione alla newsletter",
    greeting: "Ciao 👋",
    body: "grazie per esserti iscritto alla newsletter di EventBliss. Conferma la tua email cliccando sul pulsante — non invieremo nulla finché non confermi.",
    cta: "Conferma email",
    ignore: "Non ti sei iscritto? Ignora questa email — senza conferma non succede nulla.",
    signature: "Il team EventBliss",
  },
  pt: {
    subject: "Confirma a tua inscrição na newsletter",
    greeting: "Olá 👋",
    body: "obrigado por te inscreveres na newsletter da EventBliss. Confirma o teu email clicando no botão — não enviaremos nada até confirmares.",
    cta: "Confirmar email",
    ignore: "Não te inscreveste? Ignora simplesmente este email — sem confirmação não acontece nada.",
    signature: "A equipa EventBliss",
  },
  nl: {
    subject: "Bevestig je nieuwsbrief-aanmelding",
    greeting: "Hoi 👋",
    body: "bedankt voor je aanmelding voor de EventBliss-nieuwsbrief. Bevestig je e-mailadres met een klik op de knop — we sturen pas iets na bevestiging.",
    cta: "E-mail bevestigen",
    ignore: "Niet aangemeld? Negeer deze e-mail rustig — zonder bevestiging gebeurt er niets.",
    signature: "Het EventBliss-team",
  },
  pl: {
    subject: "Potwierdź zapis do newslettera",
    greeting: "Cześć 👋",
    body: "dziękujemy za zapis do newslettera EventBliss. Potwierdź adres e-mail klikając przycisk — bez potwierdzenia nic nie wyślemy.",
    cta: "Potwierdź adres e-mail",
    ignore: "Nie zapisywałeś się? Po prostu zignoruj tę wiadomość — bez potwierdzenia nic się nie dzieje.",
    signature: "Zespół EventBliss",
  },
  tr: {
    subject: "Bülten kaydını onayla",
    greeting: "Merhaba 👋",
    body: "EventBliss bültenine kaydolduğun için teşekkürler! Lütfen aşağıdaki butona tıklayarak e-posta adresini onayla — onaylamadan hiçbir şey göndermeyeceğiz.",
    cta: "E-postayı onayla",
    ignore: "Kaydolmadın mı? Bu e-postayı görmezden gel — onay olmadan hiçbir şey olmaz.",
    signature: "EventBliss ekibi",
  },
};

function buildHtml(lang: Lang, confirmUrl: string): string {
  const t = TEMPLATES[lang] ?? TEMPLATES.en;
  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px 32px;">
        <tr><td>
          <div style="font-size:14px;letter-spacing:6px;color:#8B5CF6;text-transform:uppercase;margin-bottom:12px;">EventBliss</div>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;background:linear-gradient(135deg,#8B5CF6,#EC4899,#06B6D4);-webkit-background-clip:text;background-clip:text;color:transparent;">${escapeHtml(t.subject)}</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;opacity:.9;">${escapeHtml(t.greeting)},</p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;opacity:.85;">${escapeHtml(t.body)}</p>
          <p style="margin:0 0 28px;">
            <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;text-decoration:none;font-weight:600;border-radius:12px;">${escapeHtml(t.cta)}</a>
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;opacity:.6;">${escapeHtml(t.ignore)}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;opacity:.85;">${escapeHtml(t.signature)}</p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 16px;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">MYFAMBLISS GROUP LTD · Gladstonos 12–14 · 8046 Paphos · Cyprus<br>
          <a href="${SITE_URL}/legal/privacy" style="color:#94a3b8;">${SITE_URL}/legal/privacy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText(lang: Lang, confirmUrl: string): string {
  const t = TEMPLATES[lang] ?? TEMPLATES.en;
  return `${t.greeting},\n\n${t.body}\n\n${t.cta}: ${confirmUrl}\n\n${t.ignore}\n\n${t.signature}\n\n---\nMYFAMBLISS GROUP LTD · Gladstonos 12–14 · 8046 Paphos · Cyprus\n${SITE_URL}/legal/privacy`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const token = String(body?.token ?? "");
    const lang: Lang = (TEMPLATES[body?.locale as Lang] ? body.locale : "de") as Lang;

    if (!email || !token || token.length < 32) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const confirmUrl = `${SITE_URL}/api/newsletter-confirm?token=${encodeURIComponent(token)}`;
    const t = TEMPLATES[lang];

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Number(Deno.env.get("SMTP_PORT") ?? "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("[newsletter-send-confirm] SMTP env not configured");
      return new Response(JSON.stringify({ error: "smtp_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    });

    await client.send({
      from: `${FROM_NAME} <${FROM_ADDR}>`,
      to: email,
      subject: t.subject,
      content: buildText(lang, confirmUrl),
      html: buildHtml(lang, confirmUrl),
    });
    await client.close();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[newsletter-send-confirm] error", err);
    return new Response(JSON.stringify({ error: "send_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
