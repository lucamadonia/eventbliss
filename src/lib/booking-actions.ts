/**
 * booking-actions — shared calendar-export & share helpers for bookings.
 *
 * Used by BookingSuccess, PublicBooking and the BookingActionsMenu in
 * MyBookings. Native-safe: blob downloads and navigator.share are dead in
 * the WKWebView, so on native we write the ICS to the app cache and hand it
 * to the native share sheet (@capacitor/filesystem + @capacitor/share).
 */
import { toast } from "sonner";
import { isNative, getBaseUrl } from "@/lib/platform";

export interface IcsBooking {
  id: string;
  booking_number: string;
  /** Secret capability token — appended as ?t= so foreign/shared opens work. */
  public_token?: string;
  service_title?: string;
  agency_name?: string;
  agency_city?: string | null;
  booking_date: string;
  booking_time?: string | null;
}

/**
 * Public ticket page URL for a booking (production URL on native).
 * Appends the secret `?t=` token so the recipient (anon / non-owner) can
 * actually open the page — booking_number alone is enumerable. A
 * `tokenOverride` wins over `b.public_token` (used by PublicBooking, whose
 * RPC payload intentionally omits the token).
 */
export function getBookingShareUrl(
  b: Pick<IcsBooking, "booking_number" | "public_token">,
  tokenOverride?: string,
): string {
  const token = tokenOverride ?? b.public_token;
  return `${getBaseUrl()}/booking/${b.booking_number}${token ? `?t=${token}` : ""}`;
}

export function buildIcsFile(b: IcsBooking): string {
  const dt = new Date(`${b.booking_date}T${b.booking_time || "10:00"}`);
  const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd = new Date(dt.getTime() + 2 * 60 * 60 * 1000) // +2h default
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventBliss//Marketplace//DE",
    "BEGIN:VEVENT",
    `UID:${b.id}@event-bliss.com`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${b.service_title ?? "EventBliss Buchung"}`,
    `DESCRIPTION:Buchung ${b.booking_number} bei ${b.agency_name ?? "EventBliss"} — Wir freuen uns auf dich!`,
    `LOCATION:${b.agency_city ?? ""}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Calendar export. Native: ICS → app cache → native share sheet (offers
 * "Add to Calendar"). Web: classic blob download.
 */
export async function exportBookingToCalendar(b: IcsBooking): Promise<void> {
  const ics = buildIcsFile(b);
  if (isNative()) {
    try {
      const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
      ]);
      const file = await Filesystem.writeFile({
        path: `eventbliss-${b.booking_number}.ics`,
        data: ics,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({ title: "EventBliss Buchung", files: [file.uri] });
    } catch (err) {
      if (!String(err).toLowerCase().includes("cancel")) {
        toast.error("Kalender-Export fehlgeschlagen");
      }
    }
    return;
  }
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eventbliss-${b.booking_number}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Kalender-Datei heruntergeladen");
}

/**
 * Share the public ticket page. Native: native share sheet (includes
 * WhatsApp, Mail, …). Web: navigator.share → clipboard fallback.
 */
export async function shareBooking(
  b: IcsBooking,
  text?: string,
  title = "Meine EventBliss Buchung",
  tokenOverride?: string,
): Promise<void> {
  // window.location.origin would be capacitor://localhost in the app
  const shareUrl = getBookingShareUrl(b, tokenOverride);
  const shareText =
    text ??
    `Ich hab grade ${b.service_title ?? "ein Event"} bei ${b.agency_name ?? "EventBliss"} gebucht! 🎉`;
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text: shareText, url: shareUrl });
    } catch {
      /* user cancelled */
    }
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link kopiert: " + shareUrl);
    }
  } catch {
    /* user cancelled */
  }
}

/**
 * Direct WhatsApp share via wa.me deep link. On native this opens the
 * WhatsApp app (external URL leaves the WebView), on web WhatsApp Web.
 */
export function shareBookingViaWhatsApp(
  b: IcsBooking,
  text: string,
  tokenOverride?: string,
): void {
  const shareUrl = getBookingShareUrl(b, tokenOverride);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
  window.open(waUrl, "_blank");
}
