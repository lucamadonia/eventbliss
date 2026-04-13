import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatICalDate(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function mapBookingStatus(status: string): string {
  switch (status) {
    case "confirmed":
    case "completed":
    case "in_progress":
      return "CONFIRMED";
    case "pending_payment":
    case "pending_confirmation":
      return "TENTATIVE";
    case "cancelled_by_customer":
    case "cancelled_by_agency":
    case "refunded":
    case "no_show":
      return "CANCELLED";
    default:
      return "TENTATIVE";
  }
}

function formatNow(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const h = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate token format (hex, 64 chars)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return new Response("Invalid token format", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Look up token
    const { data: calToken, error: tokenError } = await supabase
      .from("calendar_tokens")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError || !calToken) {
      return new Response("Invalid or expired token", {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Update last_accessed_at
    await supabase
      .from("calendar_tokens")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", calToken.id);

    // Check If-Modified-Since for efficient polling
    const ifModifiedSince = req.headers.get("If-Modified-Since");
    if (ifModifiedSince && calToken.last_accessed_at) {
      const clientDate = new Date(ifModifiedSince).getTime();
      const lastAccess = new Date(calToken.last_accessed_at).getTime();
      // If client already has data from after last access, return 304
      if (clientDate >= lastAccess) {
        return new Response(null, {
          status: 304,
          headers: corsHeaders,
        });
      }
    }

    // Build booking query
    let bookingsQuery = supabase
      .from("marketplace_bookings")
      .select("*")
      .eq("agency_id", calToken.agency_id)
      .order("booking_date", { ascending: true });

    // Scope: confirmed_only filters to confirmed/completed/in_progress
    if (calToken.scope === "confirmed_only") {
      bookingsQuery = bookingsQuery.in("status", [
        "confirmed",
        "in_progress",
        "completed",
      ]);
    }

    // Guide personal scope: filter by assigned guide
    // (guide_id references agency_members, used for personal calendar of a team member)
    // For now we fetch all bookings for the agency since bookings don't have a guide_id field
    // In the future, when guide assignment is added, this would filter by guide

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError.message);
      return new Response("Failed to fetch bookings", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Fetch service details for all bookings
    const serviceIds = [
      ...new Set((bookings || []).map((b: Record<string, unknown>) => b.service_id as string)),
    ];

    let servicesMap: Record<string, { title: string; duration_minutes: number; location_city: string | null; location_address: string | null }> = {};

    if (serviceIds.length > 0) {
      // Fetch services
      const { data: services } = await supabase
        .from("marketplace_services")
        .select("id, duration_minutes, location_city, location_address")
        .in("id", serviceIds);

      // Fetch translations (DE first, fallback to any)
      const { data: translations } = await supabase
        .from("marketplace_service_translations")
        .select("service_id, title, locale")
        .in("service_id", serviceIds);

      for (const svc of services || []) {
        const deTrans = (translations || []).find(
          (t: Record<string, unknown>) => t.service_id === svc.id && t.locale === "de"
        );
        const anyTrans = (translations || []).find(
          (t: Record<string, unknown>) => t.service_id === svc.id
        );
        const trans = deTrans || anyTrans;
        servicesMap[svc.id] = {
          title: trans?.title || "Buchung",
          duration_minutes: svc.duration_minutes || 60,
          location_city: svc.location_city,
          location_address: svc.location_address,
        };
      }
    }

    // Generate VCALENDAR
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventBliss//Booking Calendar//DE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:EventBliss Buchungen",
      "X-WR-TIMEZONE:Europe/Berlin",
    ];

    const dtstamp = formatNow();

    for (const booking of bookings || []) {
      const svc = servicesMap[booking.service_id as string] || {
        title: "Buchung",
        duration_minutes: 60,
        location_city: null,
        location_address: null,
      };

      const dtStart = formatICalDate(
        booking.booking_date as string,
        booking.booking_time as string
      );
      const endTime = addMinutesToTime(
        booking.booking_time as string,
        svc.duration_minutes
      );
      const dtEnd = formatICalDate(booking.booking_date as string, endTime);

      const summary = `${svc.title} - ${booking.customer_name}`;

      const descriptionParts: string[] = [
        `${booking.participant_count} Teilnehmer`,
      ];
      if (booking.customer_email) descriptionParts.push(booking.customer_email as string);
      if (booking.customer_phone) descriptionParts.push(booking.customer_phone as string);
      if (booking.customer_notes) descriptionParts.push(booking.customer_notes as string);

      const locationParts: string[] = [];
      if (svc.location_city) locationParts.push(svc.location_city);
      if (svc.location_address) locationParts.push(svc.location_address);

      const icalStatus = mapBookingStatus(booking.status as string);

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${booking.id}@eventbliss`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${escapeICalText(summary)}`);
      lines.push(
        `DESCRIPTION:${escapeICalText(descriptionParts.join("\n"))}`
      );

      if (locationParts.length > 0) {
        lines.push(
          `LOCATION:${escapeICalText(locationParts.join(", "))}`
        );
      }

      lines.push(`STATUS:${icalStatus}`);

      // VALARM: 1 hour before
      lines.push("BEGIN:VALARM");
      lines.push("TRIGGER:-PT1H");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeICalText(summary)} in 1 Stunde`);
      lines.push("END:VALARM");

      // VALARM: 24 hours before
      lines.push("BEGIN:VALARM");
      lines.push("TRIGGER:-PT24H");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeICalText(summary)} morgen`);
      lines.push("END:VALARM");

      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icalContent = lines.join("\r\n");

    return new Response(icalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="eventbliss-bookings.ics"',
        "Last-Modified": new Date().toUTCString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in ical-feed:", errorMessage);
    return new Response("Internal server error", {
      status: 500,
      headers: getCorsHeaders(req),
    });
  }
});
