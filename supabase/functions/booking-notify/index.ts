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
  language: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Localized copy — confirmation + reminder, all 10 supported languages.
// Fallback chain: requested lang → en. Only the *strings* differ per language;
// the HTML structure is rendered once by renderBookingEmail() below so the
// reminder looks exactly as polished as the confirmation.
// ---------------------------------------------------------------------------

type Lang = "de" | "en" | "es" | "fr" | "it" | "nl" | "pt" | "pl" | "tr" | "ar";

interface ConfirmationCopy {
  subject: (bookingNumber: string, serviceName: string) => string;
  heading: string;
  bookingNumberLabel: string;
  intro: (customerName: string, serviceName: string, agencyName: string) => string;
  rowDate: string;
  rowTime: string;
  rowParticipants: string;
  rowTotal: string;
  note: string;
  cta: string;
}

interface ReminderCopy {
  subject: (serviceName: string) => string;
  heading: string;
  intro: (customerName: string, serviceName: string, agencyName: string) => string;
  rowDate: string;
  rowTime: string;
  rowParticipants: string;
  rowBookingNumber: string;
  closing: string;
  cta: string;
}

interface MailTexts {
  footerLocation: string; // "Cyprus" / "Zypern" …
  confirmation: ConfirmationCopy;
  reminder: ReminderCopy;
}

const MAIL_TEXTS: Record<Lang, MailTexts> = {
  de: {
    footerLocation: "Zypern",
    confirmation: {
      subject: (bn, svc) => `Buchungsbestätigung #${bn} — ${svc}`,
      heading: "Buchung bestätigt! 🎉",
      bookingNumberLabel: "Buchungsnummer",
      intro: (name, svc, ag) =>
        `Hallo <strong>${name}</strong>,<br><br>deine Buchung für <strong style="color:#ec4899;">${svc}</strong> bei <strong>${ag}</strong> wurde erfolgreich erstellt.`,
      rowDate: "Datum",
      rowTime: "Uhrzeit",
      rowParticipants: "Teilnehmer",
      rowTotal: "Gesamtpreis",
      note: "Du erhältst eine Erinnerung 24 Stunden vor dem Termin. Bei Fragen kontaktiere direkt die Agentur oder antworte auf diese E-Mail.",
      cta: "Meine Buchungen ansehen",
    },
    reminder: {
      subject: (svc) => `Erinnerung: Morgen ist dein ${svc}-Termin! 🔔`,
      heading: "Morgen geht's los! 🔔",
      intro: (name, svc, ag) =>
        `Hallo <strong>${name}</strong>,<br><br>nur eine freundliche Erinnerung: Deine Buchung für <strong style="color:#ec4899;">${svc}</strong> bei <strong>${ag}</strong> ist <strong>morgen</strong>.`,
      rowDate: "Datum",
      rowTime: "Uhrzeit",
      rowParticipants: "Teilnehmer",
      rowBookingNumber: "Buchungsnr.",
      closing: "Viel Spaß morgen! 🎉",
      cta: "Buchung ansehen",
    },
  },
  en: {
    footerLocation: "Cyprus",
    confirmation: {
      subject: (bn, svc) => `Booking Confirmation #${bn} — ${svc}`,
      heading: "Booking Confirmed! 🎉",
      bookingNumberLabel: "Booking number",
      intro: (name, svc, ag) =>
        `Hi <strong>${name}</strong>,<br><br>your booking for <strong style="color:#ec4899;">${svc}</strong> with <strong>${ag}</strong> has been confirmed.`,
      rowDate: "Date",
      rowTime: "Time",
      rowParticipants: "Participants",
      rowTotal: "Total",
      note: "You'll receive a reminder 24 hours before your booking. For questions, contact the agency directly or reply to this email.",
      cta: "View My Bookings",
    },
    reminder: {
      subject: (svc) => `Reminder: Your ${svc} is tomorrow! 🔔`,
      heading: "Tomorrow's the day! 🔔",
      intro: (name, svc, ag) =>
        `Hi <strong>${name}</strong>,<br><br>friendly reminder: your booking for <strong style="color:#ec4899;">${svc}</strong> with <strong>${ag}</strong> is <strong>tomorrow</strong>.`,
      rowDate: "Date",
      rowTime: "Time",
      rowParticipants: "Participants",
      rowBookingNumber: "Booking #",
      closing: "Have a great time tomorrow! 🎉",
      cta: "View Booking",
    },
  },
  es: {
    footerLocation: "Chipre",
    confirmation: {
      subject: (bn, svc) => `Confirmación de reserva #${bn} — ${svc}`,
      heading: "¡Reserva confirmada! 🎉",
      bookingNumberLabel: "Número de reserva",
      intro: (name, svc, ag) =>
        `Hola <strong>${name}</strong>,<br><br>tu reserva de <strong style="color:#ec4899;">${svc}</strong> con <strong>${ag}</strong> se ha confirmado correctamente.`,
      rowDate: "Fecha",
      rowTime: "Hora",
      rowParticipants: "Participantes",
      rowTotal: "Total",
      note: "Recibirás un recordatorio 24 horas antes de la cita. Si tienes preguntas, contacta directamente con la agencia o responde a este correo.",
      cta: "Ver mis reservas",
    },
    reminder: {
      subject: (svc) => `Recordatorio: ¡tu cita de ${svc} es mañana! 🔔`,
      heading: "¡Mañana es el día! 🔔",
      intro: (name, svc, ag) =>
        `Hola <strong>${name}</strong>,<br><br>un recordatorio amable: tu reserva de <strong style="color:#ec4899;">${svc}</strong> con <strong>${ag}</strong> es <strong>mañana</strong>.`,
      rowDate: "Fecha",
      rowTime: "Hora",
      rowParticipants: "Participantes",
      rowBookingNumber: "Reserva n.º",
      closing: "¡Que lo disfrutes mañana! 🎉",
      cta: "Ver reserva",
    },
  },
  fr: {
    footerLocation: "Chypre",
    confirmation: {
      subject: (bn, svc) => `Confirmation de réservation #${bn} — ${svc}`,
      heading: "Réservation confirmée ! 🎉",
      bookingNumberLabel: "Numéro de réservation",
      intro: (name, svc, ag) =>
        `Bonjour <strong>${name}</strong>,<br><br>ta réservation pour <strong style="color:#ec4899;">${svc}</strong> avec <strong>${ag}</strong> a bien été confirmée.`,
      rowDate: "Date",
      rowTime: "Heure",
      rowParticipants: "Participants",
      rowTotal: "Total",
      note: "Tu recevras un rappel 24 heures avant le rendez-vous. Pour toute question, contacte directement l'agence ou réponds à cet e-mail.",
      cta: "Voir mes réservations",
    },
    reminder: {
      subject: (svc) => `Rappel : ton rendez-vous ${svc} est demain ! 🔔`,
      heading: "C'est pour demain ! 🔔",
      intro: (name, svc, ag) =>
        `Bonjour <strong>${name}</strong>,<br><br>petit rappel amical : ta réservation pour <strong style="color:#ec4899;">${svc}</strong> avec <strong>${ag}</strong> est <strong>demain</strong>.`,
      rowDate: "Date",
      rowTime: "Heure",
      rowParticipants: "Participants",
      rowBookingNumber: "Réservation n°",
      closing: "Profite bien demain ! 🎉",
      cta: "Voir la réservation",
    },
  },
  it: {
    footerLocation: "Cipro",
    confirmation: {
      subject: (bn, svc) => `Conferma di prenotazione #${bn} — ${svc}`,
      heading: "Prenotazione confermata! 🎉",
      bookingNumberLabel: "Numero di prenotazione",
      intro: (name, svc, ag) =>
        `Ciao <strong>${name}</strong>,<br><br>la tua prenotazione per <strong style="color:#ec4899;">${svc}</strong> con <strong>${ag}</strong> è stata confermata con successo.`,
      rowDate: "Data",
      rowTime: "Ora",
      rowParticipants: "Partecipanti",
      rowTotal: "Totale",
      note: "Riceverai un promemoria 24 ore prima dell'appuntamento. Per domande, contatta direttamente l'agenzia o rispondi a questa email.",
      cta: "Vedi le mie prenotazioni",
    },
    reminder: {
      subject: (svc) => `Promemoria: il tuo appuntamento ${svc} è domani! 🔔`,
      heading: "Domani si parte! 🔔",
      intro: (name, svc, ag) =>
        `Ciao <strong>${name}</strong>,<br><br>solo un gentile promemoria: la tua prenotazione per <strong style="color:#ec4899;">${svc}</strong> con <strong>${ag}</strong> è <strong>domani</strong>.`,
      rowDate: "Data",
      rowTime: "Ora",
      rowParticipants: "Partecipanti",
      rowBookingNumber: "Prenotazione n.",
      closing: "Buon divertimento domani! 🎉",
      cta: "Vedi prenotazione",
    },
  },
  nl: {
    footerLocation: "Cyprus",
    confirmation: {
      subject: (bn, svc) => `Boekingsbevestiging #${bn} — ${svc}`,
      heading: "Boeking bevestigd! 🎉",
      bookingNumberLabel: "Boekingsnummer",
      intro: (name, svc, ag) =>
        `Hoi <strong>${name}</strong>,<br><br>je boeking voor <strong style="color:#ec4899;">${svc}</strong> bij <strong>${ag}</strong> is succesvol bevestigd.`,
      rowDate: "Datum",
      rowTime: "Tijd",
      rowParticipants: "Deelnemers",
      rowTotal: "Totaal",
      note: "Je ontvangt 24 uur voor de afspraak een herinnering. Heb je vragen? Neem direct contact op met het bureau of beantwoord deze e-mail.",
      cta: "Mijn boekingen bekijken",
    },
    reminder: {
      subject: (svc) => `Herinnering: je ${svc}-afspraak is morgen! 🔔`,
      heading: "Morgen is het zover! 🔔",
      intro: (name, svc, ag) =>
        `Hoi <strong>${name}</strong>,<br><br>een vriendelijke herinnering: je boeking voor <strong style="color:#ec4899;">${svc}</strong> bij <strong>${ag}</strong> is <strong>morgen</strong>.`,
      rowDate: "Datum",
      rowTime: "Tijd",
      rowParticipants: "Deelnemers",
      rowBookingNumber: "Boekingsnr.",
      closing: "Veel plezier morgen! 🎉",
      cta: "Boeking bekijken",
    },
  },
  pt: {
    footerLocation: "Chipre",
    confirmation: {
      subject: (bn, svc) => `Confirmação de reserva #${bn} — ${svc}`,
      heading: "Reserva confirmada! 🎉",
      bookingNumberLabel: "Número da reserva",
      intro: (name, svc, ag) =>
        `Olá <strong>${name}</strong>,<br><br>a tua reserva de <strong style="color:#ec4899;">${svc}</strong> com <strong>${ag}</strong> foi confirmada com sucesso.`,
      rowDate: "Data",
      rowTime: "Hora",
      rowParticipants: "Participantes",
      rowTotal: "Total",
      note: "Vais receber um lembrete 24 horas antes do compromisso. Se tiveres dúvidas, contacta diretamente a agência ou responde a este email.",
      cta: "Ver as minhas reservas",
    },
    reminder: {
      subject: (svc) => `Lembrete: o teu compromisso ${svc} é amanhã! 🔔`,
      heading: "Amanhã é o dia! 🔔",
      intro: (name, svc, ag) =>
        `Olá <strong>${name}</strong>,<br><br>apenas um lembrete amigável: a tua reserva de <strong style="color:#ec4899;">${svc}</strong> com <strong>${ag}</strong> é <strong>amanhã</strong>.`,
      rowDate: "Data",
      rowTime: "Hora",
      rowParticipants: "Participantes",
      rowBookingNumber: "Reserva n.º",
      closing: "Diverte-te amanhã! 🎉",
      cta: "Ver reserva",
    },
  },
  pl: {
    footerLocation: "Cypr",
    confirmation: {
      subject: (bn, svc) => `Potwierdzenie rezerwacji #${bn} — ${svc}`,
      heading: "Rezerwacja potwierdzona! 🎉",
      bookingNumberLabel: "Numer rezerwacji",
      intro: (name, svc, ag) =>
        `Cześć <strong>${name}</strong>,<br><br>Twoja rezerwacja na <strong style="color:#ec4899;">${svc}</strong> w <strong>${ag}</strong> została pomyślnie potwierdzona.`,
      rowDate: "Data",
      rowTime: "Godzina",
      rowParticipants: "Uczestnicy",
      rowTotal: "Łącznie",
      note: "Otrzymasz przypomnienie 24 godziny przed terminem. W razie pytań skontaktuj się bezpośrednio z agencją lub odpowiedz na tę wiadomość.",
      cta: "Zobacz moje rezerwacje",
    },
    reminder: {
      subject: (svc) => `Przypomnienie: jutro masz termin ${svc}! 🔔`,
      heading: "Już jutro! 🔔",
      intro: (name, svc, ag) =>
        `Cześć <strong>${name}</strong>,<br><br>przyjazne przypomnienie: Twoja rezerwacja na <strong style="color:#ec4899;">${svc}</strong> w <strong>${ag}</strong> jest <strong>jutro</strong>.`,
      rowDate: "Data",
      rowTime: "Godzina",
      rowParticipants: "Uczestnicy",
      rowBookingNumber: "Nr rezerwacji",
      closing: "Udanej zabawy jutro! 🎉",
      cta: "Zobacz rezerwację",
    },
  },
  tr: {
    footerLocation: "Kıbrıs",
    confirmation: {
      subject: (bn, svc) => `Rezervasyon Onayı #${bn} — ${svc}`,
      heading: "Rezervasyon onaylandı! 🎉",
      bookingNumberLabel: "Rezervasyon numarası",
      intro: (name, svc, ag) =>
        `Merhaba <strong>${name}</strong>,<br><br><strong>${ag}</strong> ile <strong style="color:#ec4899;">${svc}</strong> rezervasyonun başarıyla oluşturuldu.`,
      rowDate: "Tarih",
      rowTime: "Saat",
      rowParticipants: "Katılımcılar",
      rowTotal: "Toplam",
      note: "Randevudan 24 saat önce bir hatırlatma alacaksın. Soruların için doğrudan ajansla iletişime geç veya bu e-postayı yanıtla.",
      cta: "Rezervasyonlarımı gör",
    },
    reminder: {
      subject: (svc) => `Hatırlatma: ${svc} randevun yarın! 🔔`,
      heading: "Yarın büyük gün! 🔔",
      intro: (name, svc, ag) =>
        `Merhaba <strong>${name}</strong>,<br><br>dostça bir hatırlatma: <strong>${ag}</strong> ile <strong style="color:#ec4899;">${svc}</strong> rezervasyonun <strong>yarın</strong>.`,
      rowDate: "Tarih",
      rowTime: "Saat",
      rowParticipants: "Katılımcılar",
      rowBookingNumber: "Rezervasyon No.",
      closing: "Yarın iyi eğlenceler! 🎉",
      cta: "Rezervasyonu gör",
    },
  },
  ar: {
    footerLocation: "قبرص",
    confirmation: {
      subject: (bn, svc) => `تأكيد الحجز #${bn} — ${svc}`,
      heading: "تم تأكيد الحجز! 🎉",
      bookingNumberLabel: "رقم الحجز",
      intro: (name, svc, ag) =>
        `مرحباً <strong>${name}</strong>،<br><br>تم تأكيد حجزك لـ <strong style="color:#ec4899;">${svc}</strong> مع <strong>${ag}</strong> بنجاح.`,
      rowDate: "التاريخ",
      rowTime: "الوقت",
      rowParticipants: "المشاركون",
      rowTotal: "الإجمالي",
      note: "ستتلقى تذكيراً قبل الموعد بـ 24 ساعة. لأي استفسار، تواصل مباشرة مع الوكالة أو رد على هذا البريد الإلكتروني.",
      cta: "عرض حجوزاتي",
    },
    reminder: {
      subject: (svc) => `تذكير: موعد ${svc} غداً! 🔔`,
      heading: "غداً هو الموعد! 🔔",
      intro: (name, svc, ag) =>
        `مرحباً <strong>${name}</strong>،<br><br>تذكير ودي: حجزك لـ <strong style="color:#ec4899;">${svc}</strong> مع <strong>${ag}</strong> هو <strong>غداً</strong>.`,
      rowDate: "التاريخ",
      rowTime: "الوقت",
      rowParticipants: "المشاركون",
      rowBookingNumber: "رقم الحجز",
      closing: "نتمنى لك وقتاً ممتعاً غداً! 🎉",
      cta: "عرض الحجز",
    },
  },
};

function resolveLang(raw: string | null | undefined): Lang {
  const code = (raw ?? "").slice(0, 2).toLowerCase();
  return (code in MAIL_TEXTS) ? (code as Lang) : "en";
}

// ---------------------------------------------------------------------------
// Shared HTML/text rendering — ONE base template, parameterised by:
//   heading, intro, table rows, optional note/closing, CTA label + accent.
// Confirmation uses a purple/pink accent; reminder an amber/red accent.
// Returns { html, text } so we can always supply a plaintext alternative.
// ---------------------------------------------------------------------------

interface RenderInput {
  lang: Lang;
  dir: "ltr" | "rtl";
  heading: string;
  subline?: string; // e.g. "Booking number: #123"
  introHtml: string;
  rows: Array<{ label: string; value: string }>;
  totalRow?: { label: string; value: string };
  bodyAfterTable?: string; // note / closing paragraph
  ctaLabel: string;
  ctaUrl: string;
  accentFrom: string;
  accentTo: string;
  panelBg: string;
  panelBorder: string;
  footerLocation: string;
}

function stripTags(s: string): string {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

function renderBookingEmail(input: RenderInput): { html: string; text: string } {
  const align = input.dir === "rtl" ? "right" : "left";
  const valueAlign = input.dir === "rtl" ? "left" : "right";

  const rowsHtml = input.rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 0;color:#94a3b8;text-align:${align};">${r.label}</td><td style="padding:8px 0;text-align:${valueAlign};font-weight:700;">${r.value}</td></tr>`,
    )
    .join("");

  const totalHtml = input.totalRow
    ? `<tr style="border-top:1px solid rgba(255,255,255,0.1);"><td style="padding:12px 0 0;color:#94a3b8;font-weight:700;text-align:${align};">${input.totalRow.label}</td><td style="padding:12px 0 0;text-align:${valueAlign};font-weight:900;font-size:20px;color:#10b981;">${input.totalRow.value}</td></tr>`
    : "";

  const sublineHtml = input.subline
    ? `<p style="margin:0 0 24px;color:#94a3b8;font-size:14px;text-align:${align};">${input.subline}</p>`
    : "";

  const afterTableHtml = input.bodyAfterTable
    ? `<p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;text-align:${align};">${input.bodyAfterTable}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${input.lang}" dir="${input.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;" dir="${input.dir}">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:12px 24px;border-radius:16px;">
      <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;text-align:${align};">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;text-align:${align};">${input.heading}</h1>
    ${sublineHtml}
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;text-align:${align};">${input.introHtml}</p>
    <div style="background:${input.panelBg};border:1px solid ${input.panelBorder};border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;">
        ${rowsHtml}
        ${totalHtml}
      </table>
    </div>
    ${afterTableHtml}
    <div style="text-align:center;">
      <a href="${input.ctaUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${input.accentFrom},${input.accentTo});color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">${input.ctaLabel}</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:32px;font-size:12px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · ${input.footerLocation}
  </p>
</div>
</body></html>`;

  // Plaintext alternative — always sent alongside the HTML so denomailer
  // builds a clean multipart/alternative (no raw MIME, no quoted-printable
  // surfacing in clients that fail to parse the HTML part).
  const textLines = [
    "EventBliss",
    "",
    stripTags(input.heading),
    input.subline ? stripTags(input.subline) : "",
    "",
    stripTags(input.introHtml),
    "",
    ...input.rows.map((r) => `${stripTags(r.label)}: ${stripTags(r.value)}`),
    input.totalRow ? `${stripTags(input.totalRow.label)}: ${stripTags(input.totalRow.value)}` : "",
    "",
    input.bodyAfterTable ? stripTags(input.bodyAfterTable) : "",
    "",
    `${stripTags(input.ctaLabel)}: ${input.ctaUrl}`,
    "",
    `© ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · ${input.footerLocation}`,
  ].filter((l) => l !== "");

  return { html, text: textLines.join("\n") };
}

function buildConfirmation(
  lang: Lang,
  d: { bookingNumber: string; customerName: string; serviceName: string; agencyName: string; date: string; time: string; participants: number; totalEur: string },
): { subject: string; html: string; text: string } {
  const t = MAIL_TEXTS[lang].confirmation;
  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";
  const totalValue = lang === "de" ? `${d.totalEur} €` : `€${d.totalEur}`;

  const { html, text } = renderBookingEmail({
    lang,
    dir,
    heading: t.heading,
    subline: `${t.bookingNumberLabel}: <strong style="color:#a855f7;">#${d.bookingNumber}</strong>`,
    introHtml: t.intro(d.customerName, d.serviceName, d.agencyName),
    rows: [
      { label: t.rowDate, value: d.date },
      { label: t.rowTime, value: d.time },
      { label: t.rowParticipants, value: String(d.participants) },
    ],
    totalRow: { label: t.rowTotal, value: totalValue },
    bodyAfterTable: t.note,
    ctaLabel: t.cta,
    ctaUrl: "https://event-bliss.com/my-bookings",
    accentFrom: "#a855f7",
    accentTo: "#ec4899",
    panelBg: "rgba(168,85,247,0.1)",
    panelBorder: "rgba(168,85,247,0.25)",
    footerLocation: MAIL_TEXTS[lang].footerLocation,
  });

  return { subject: t.subject(d.bookingNumber, d.serviceName), html, text };
}

function buildReminder(
  lang: Lang,
  d: { bookingNumber: string; customerName: string; serviceName: string; agencyName: string; date: string; time: string; participants: number },
): { subject: string; html: string; text: string } {
  const t = MAIL_TEXTS[lang].reminder;
  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  const { html, text } = renderBookingEmail({
    lang,
    dir,
    heading: t.heading,
    introHtml: t.intro(d.customerName, d.serviceName, d.agencyName),
    rows: [
      { label: `📅 ${t.rowDate}`, value: d.date },
      { label: `🕐 ${t.rowTime}`, value: d.time },
      { label: `👥 ${t.rowParticipants}`, value: String(d.participants) },
      { label: `📋 ${t.rowBookingNumber}`, value: `#${d.bookingNumber}` },
    ],
    bodyAfterTable: t.closing,
    ctaLabel: t.cta,
    ctaUrl: "https://event-bliss.com/my-bookings",
    accentFrom: "#f59e0b",
    accentTo: "#ef4444",
    panelBg: "rgba(245,158,11,0.1)",
    panelBorder: "rgba(245,158,11,0.3)",
    footerLocation: MAIL_TEXTS[lang].footerLocation,
  });

  return { subject: t.subject(d.serviceName), html, text };
}

// ---------------------------------------------------------------------------
// SMTP helper — sends HTML + plaintext (multipart/alternative). No attachments
// (the ICS attachment was removed: it forced multipart/mixed which the
// ALL-INKL/Kasserver SMTP relay rebuilt incorrectly, leaking raw MIME headers
// into the rendered mail). Calendar export still lives in the booking screen.
// ---------------------------------------------------------------------------

async function sendBookingEmail(to: string, subject: string, html: string, text: string) {
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
    content: text, // plaintext alternative → forces clean multipart/alternative
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

// Agency notification template (internal, German — recipient is the agency)
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

function agencyNotificationText(d: {
  bookingNumber: string; customerName: string; customerEmail: string; customerPhone: string | null;
  serviceName: string; date: string; time: string; participants: number; totalEur: string; customerNotes: string | null;
}): string {
  return [
    "EventBliss — Neue Buchung eingegangen",
    `Buchungsnummer: #${d.bookingNumber}`,
    "",
    `Service: ${d.serviceName}`,
    `Datum: ${d.date}`,
    `Uhrzeit: ${d.time}`,
    `Teilnehmer: ${d.participants}`,
    `Umsatz: ${d.totalEur} €`,
    "",
    "Kunde:",
    `Name: ${d.customerName}`,
    `E-Mail: ${d.customerEmail}`,
    d.customerPhone ? `Telefon: ${d.customerPhone}` : "",
    d.customerNotes ? `Notizen: ${d.customerNotes}` : "",
    "",
    "Dashboard: https://event-bliss.com/agency/dashboard",
  ].filter((l) => l !== "").join("\n");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
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
      const requestLocale: string | undefined = body.locale;
      if (!bookingId) throw new Error("booking_id required");

      const { data: booking, error } = await (supabase as any)
        .from("marketplace_bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      if (error || !booking) throw new Error(`Booking ${bookingId} not found`);
      const b = booking as BookingRow;

      // Language precedence: logged booking.language → request locale → 'de'.
      const lang = resolveLang(b.language ?? requestLocale ?? "de");

      const serviceName = await getServiceTitle(supabase, b.service_id, lang);
      const agency = await getAgencyInfo(supabase, b.agency_id);

      const { subject, html, text } = buildConfirmation(lang, {
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
      await sendBookingEmail(b.customer_email, subject, html, text);
      log("Confirmation sent to customer", { bookingId, to: b.customer_email, lang });

      // Send notification to agency (if they have a contact email)
      if (agency.email) {
        const agencySubject = `Neue Buchung #${b.booking_number} — ${serviceName}`;
        const agencyData = {
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
        };
        try {
          await sendBookingEmail(
            agency.email,
            agencySubject,
            agencyNotificationHtml(agencyData),
            agencyNotificationText(agencyData),
          );
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
          // Use the language logged on the booking (fallback 'de'). The cron
          // job sends no locale, so per-booking language is the only signal.
          const lang = resolveLang(b.language ?? "de");
          const serviceName = await getServiceTitle(supabase, b.service_id, lang);
          const agency = await getAgencyInfo(supabase, b.agency_id);

          const { subject, html, text } = buildReminder(lang, {
            bookingNumber: b.booking_number,
            customerName: b.customer_name || b.customer_email,
            serviceName,
            agencyName: agency.name,
            date: b.booking_date,
            time: b.booking_time,
            participants: b.participant_count,
          });

          await sendBookingEmail(b.customer_email, subject, html, text);
          sent++;
          log("Reminder sent", { bookingId: b.id, to: b.customer_email, date: dateStr, lang });
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
