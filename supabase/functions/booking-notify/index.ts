import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BOOKING-NOTIFY] ${step}${suffix}`);
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotifyType = "confirmation" | "reminder";

interface BookingRow {
  id: string;
  booking_number: string;
  service_id: string;
  agency_id: string;
  customer_id: string;
  event_id: string | null;
  status: string;
  booking_date: string;
  booking_time: string;
  participant_count: number;
  total_price_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

const CONFIRMATION_TEMPLATES: Record<string, {
  subject: (bookingNumber: string, serviceName: string) => string;
  body: (data: { bookingNumber: string; customerName: string; serviceName: string; agencyName: string; date: string; time: string; participants: number; totalEur: string }) => string;
}> = {
  de: {
    subject: (bn, svc) => `Buchungsbestätigung #${bn} — ${svc}`,
    body: (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;">Buchung bestätigt! 🎉</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Buchungsnummer: <strong style="color:#a855f7;">#${d.bookingNumber}</strong></p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
      Hallo <strong>${d.customerName}</strong>,<br><br>
      deine Buchung für <strong style="color:#ec4899;">${d.serviceName}</strong> bei <strong>${d.agencyName}</strong> wurde erfolgreich erstellt.
    </p>
    <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.25);border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#94a3b8;">Datum</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.date}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Uhrzeit</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.time}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Teilnehmer</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.participants}</td></tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.1);"><td style="padding:12px 0 0;color:#94a3b8;font-weight:700;">Gesamtpreis</td><td style="padding:12px 0 0;text-align:right;font-weight:900;font-size:20px;color:#10b981;">${d.totalEur} €</td></tr>
      </table>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Du erhältst eine Erinnerung 24 Stunden vor dem Termin. Bei Fragen kontaktiere direkt die Agentur oder antworte auf diese E-Mail.
    </p>
    <div style="text-align:center;">
      <a href="https://event-bliss.com/my-bookings" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Meine Buchungen ansehen</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · Zypern
  </p>
</div>
</body></html>`,
  },
  en: {
    subject: (bn, svc) => `Booking Confirmation #${bn} — ${svc}`,
    body: (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;">Booking Confirmed! 🎉</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Booking number: <strong style="color:#a855f7;">#${d.bookingNumber}</strong></p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
      Hi <strong>${d.customerName}</strong>,<br><br>
      your booking for <strong style="color:#ec4899;">${d.serviceName}</strong> with <strong>${d.agencyName}</strong> has been confirmed.
    </p>
    <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.25);border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.date}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Time</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.time}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Participants</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.participants}</td></tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.1);"><td style="padding:12px 0 0;color:#94a3b8;font-weight:700;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:900;font-size:20px;color:#10b981;">€${d.totalEur}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      You'll receive a reminder 24 hours before your booking. For questions, contact the agency directly or reply to this email.
    </p>
    <div style="text-align:center;">
      <a href="https://event-bliss.com/my-bookings" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">View My Bookings</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · Cyprus
  </p>
</div>
</body></html>`,
  },
};

const REMINDER_TEMPLATES: Record<string, {
  subject: (serviceName: string) => string;
  body: (data: { customerName: string; serviceName: string; agencyName: string; date: string; time: string; participants: number; bookingNumber: string }) => string;
}> = {
  de: {
    subject: (svc) => `Erinnerung: Morgen ist dein ${svc}-Termin! 🔔`,
    body: (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;">Morgen geht's los! 🔔</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
      Hallo <strong>${d.customerName}</strong>,<br><br>
      nur eine freundliche Erinnerung: Deine Buchung für <strong style="color:#ec4899;">${d.serviceName}</strong> bei <strong>${d.agencyName}</strong> ist <strong>morgen</strong>.
    </p>
    <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        <tr><td style="padding:6px 0;color:#94a3b8;">📅 Datum</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.date}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">🕐 Uhrzeit</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.time}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">👥 Teilnehmer</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.participants}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">📋 Buchungsnr.</td><td style="padding:6px 0;text-align:right;font-weight:700;">#${d.bookingNumber}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Viel Spaß morgen! 🎉</p>
    <div style="text-align:center;">
      <a href="https://event-bliss.com/my-bookings" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Buchung ansehen</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · Zypern
  </p>
</div>
</body></html>`,
  },
  en: {
    subject: (svc) => `Reminder: Your ${svc} is tomorrow! 🔔`,
    body: (d) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;">Tomorrow's the day! 🔔</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
      Hi <strong>${d.customerName}</strong>,<br><br>
      friendly reminder: your booking for <strong style="color:#ec4899;">${d.serviceName}</strong> with <strong>${d.agencyName}</strong> is <strong>tomorrow</strong>.
    </p>
    <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        <tr><td style="padding:6px 0;color:#94a3b8;">📅 Date</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.date}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">🕐 Time</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.time}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">👥 Participants</td><td style="padding:6px 0;text-align:right;font-weight:700;">${d.participants}</td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">📋 Booking #</td><td style="padding:6px 0;text-align:right;font-weight:700;">#${d.bookingNumber}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Have a great time tomorrow! 🎉</p>
    <div style="text-align:center;">
      <a href="https://event-bliss.com/my-bookings" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">View Booking</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · Cyprus
  </p>
</div>
</body></html>`,
  },
};

// ---------------------------------------------------------------------------
// SMTP helper
// ---------------------------------------------------------------------------

async function sendBookingEmail(to: string, subject: string, html: string) {
  const host = Deno.env.get("BOOKING_SMTP_HOST") ?? Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("BOOKING_SMTP_PORT") ?? Deno.env.get("SMTP_PORT") ?? "465");
  const user = Deno.env.get("BOOKING_SMTP_USER") ?? "booking@event-bliss.com";
  const pass = Deno.env.get("BOOKING_SMTP_PASSWORD");

  if (!host || !pass) throw new Error("Booking SMTP not configured");

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });

  await client.send({
    from: `EventBliss Bookings <${user}>`,
    to,
    subject,
    html,
  });

  await client.close();
}

// ---------------------------------------------------------------------------
// Service name resolver
// ---------------------------------------------------------------------------

async function getServiceTitle(
  supabase: ReturnType<typeof createClient>,
  serviceId: string,
  locale: string,
): Promise<string> {
  const localeSet = [locale, "de", "en"];
  const { data } = await (supabase as any).from("marketplace_service_translations")
    .select("locale, title")
    .eq("service_id", serviceId)
    .in("locale", localeSet);

  const priority = (l: string) => (l === locale ? 3 : l === "de" ? 2 : l === "en" ? 1 : 0);
  let best = "";
  let bestP = -1;
  for (const row of (data as Array<{ locale: string; title: string }>) ?? []) {
    const p = priority(row.locale);
    if (p > bestP) { best = row.title; bestP = p; }
  }
  return best || "Service";
}

async function getAgencyInfo(
  supabase: ReturnType<typeof createClient>,
  agencyId: string,
): Promise<{ name: string; email: string | null }> {
  const { data } = await (supabase as any).from("agencies").select("name, contact_email").eq("id", agencyId).single();
  const row = data as { name: string; contact_email: string | null } | null;
  return { name: row?.name ?? "Agentur", email: row?.contact_email ?? null };
}

// Agency notification template
function agencyNotificationHtml(d: {
  bookingNumber: string; customerName: string; customerEmail: string; customerPhone: string | null;
  serviceName: string; date: string; time: string; participants: number; totalEur: string; customerNotes: string | null;
}): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;">Neue Buchung eingegangen! 📬</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Buchungsnummer: <strong style="color:#10b981;">#${d.bookingNumber}</strong></p>
    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#94a3b8;">Service</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.serviceName}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Datum</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.date}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Uhrzeit</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.time}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Teilnehmer</td><td style="padding:8px 0;text-align:right;font-weight:700;">${d.participants}</td></tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.1);"><td style="padding:12px 0 0;color:#94a3b8;font-weight:700;">Umsatz</td><td style="padding:12px 0 0;text-align:right;font-weight:900;font-size:20px;color:#10b981;">${d.totalEur} €</td></tr>
      </table>
    </div>
    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#fff;">Kunde</h3>
    <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;margin:0 0 24px;">
      <tr><td style="padding:4px 0;color:#94a3b8;">Name</td><td style="padding:4px 0;text-align:right;font-weight:600;">${d.customerName}</td></tr>
      <tr><td style="padding:4px 0;color:#94a3b8;">E-Mail</td><td style="padding:4px 0;text-align:right;"><a href="mailto:${d.customerEmail}" style="color:#a855f7;text-decoration:none;">${d.customerEmail}</a></td></tr>
      ${d.customerPhone ? `<tr><td style="padding:4px 0;color:#94a3b8;">Telefon</td><td style="padding:4px 0;text-align:right;">${d.customerPhone}</td></tr>` : ""}
      ${d.customerNotes ? `<tr><td style="padding:4px 0;color:#94a3b8;">Notizen</td><td style="padding:4px 0;text-align:right;">${d.customerNotes}</td></tr>` : ""}
    </table>
    <div style="text-align:center;">
      <a href="https://event-bliss.com/agency/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Im Dashboard öffnen</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD
  </p>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const notifyType: NotifyType = body.type ?? "confirmation";

    // ───── CONFIRMATION: send for a single booking ─────
    if (notifyType === "confirmation") {
      const bookingId: string = body.booking_id;
      const locale: string = body.locale ?? "de";
      if (!bookingId) throw new Error("booking_id required");

      const { data: booking, error } = await (supabase as any)
        .from("marketplace_bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      if (error || !booking) throw new Error(`Booking ${bookingId} not found`);
      const b = booking as BookingRow;

      const serviceName = await getServiceTitle(supabase, b.service_id, locale);
      const agency = await getAgencyInfo(supabase, b.agency_id);

      const tpl = CONFIRMATION_TEMPLATES[locale] ?? CONFIRMATION_TEMPLATES.de;
      const subject = tpl.subject(b.booking_number, serviceName);
      const html = tpl.body({
        bookingNumber: b.booking_number,
        customerName: b.customer_name || b.customer_email,
        serviceName,
        agencyName: agency.name,
        date: b.booking_date,
        time: b.booking_time,
        participants: b.participant_count,
        totalEur: (b.total_price_cents / 100).toFixed(2),
      });

      // Send confirmation to customer
      await sendBookingEmail(b.customer_email, subject, html);
      log("Confirmation sent to customer", { bookingId, to: b.customer_email });

      // Send notification to agency (if they have a contact email)
      if (agency.email) {
        const agencySubject = `Neue Buchung #${b.booking_number} — ${serviceName}`;
        const agencyHtml = agencyNotificationHtml({
          bookingNumber: b.booking_number,
          customerName: b.customer_name || b.customer_email,
          customerEmail: b.customer_email,
          customerPhone: b.customer_phone,
          serviceName,
          date: b.booking_date,
          time: b.booking_time,
          participants: b.participant_count,
          totalEur: (b.total_price_cents / 100).toFixed(2),
          customerNotes: b.customer_notes,
        });
        try {
          await sendBookingEmail(agency.email, agencySubject, agencyHtml);
          log("Agency notification sent", { bookingId, to: agency.email });
        } catch (err) {
          log("Agency notification failed (non-blocking)", { error: String(err) });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───── REMINDER: send for all bookings tomorrow ─────
    if (notifyType === "reminder") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

      const { data: bookings } = await (supabase as any)
        .from("marketplace_bookings")
        .select("*")
        .eq("booking_date", dateStr)
        .in("status", ["confirmed", "pending_confirmation"]);

      const rows = (bookings as BookingRow[]) ?? [];
      let sent = 0;

      for (const b of rows) {
        try {
          const serviceName = await getServiceTitle(supabase, b.service_id, "de");
          const agency = await getAgencyInfo(supabase, b.agency_id);
          const agencyName = agency.name;

          const tpl = REMINDER_TEMPLATES.de; // default to German for reminders
          const subject = tpl.subject(serviceName);
          const html = tpl.body({
            customerName: b.customer_name || b.customer_email,
            serviceName,
            agencyName,
            date: b.booking_date,
            time: b.booking_time,
            participants: b.participant_count,
            bookingNumber: b.booking_number,
          });

          await sendBookingEmail(b.customer_email, subject, html);
          sent++;
          log("Reminder sent", { bookingId: b.id, to: b.customer_email, date: dateStr });
        } catch (err) {
          log("Reminder failed for booking", { bookingId: b.id, error: String(err) });
        }
      }

      return new Response(JSON.stringify({ success: true, sent, total: rows.length, date: dateStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
