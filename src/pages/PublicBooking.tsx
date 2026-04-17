import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  animate,
} from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Share2,
  CalendarPlus,
  Building2,
  Star,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HourglassIcon,
  Printer,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublicBooking {
  booking_number: string;
  status: string;
  booking_date: string;
  booking_time: string;
  participant_count: number;
  customer_first_name: string;
  service_title: string;
  service_slug: string | null;
  service_category: string | null;
  service_cover: string | null;
  agency_name: string;
  agency_slug: string | null;
  agency_city: string | null;
  agency_country: string | null;
  created_at: string;
}

function usePublicBooking(bookingNumber: string | undefined) {
  return useQuery({
    queryKey: ["public-booking", bookingNumber],
    enabled: !!bookingNumber,
    queryFn: async (): Promise<PublicBooking | null> => {
      if (!bookingNumber) return null;
      const { data, error } = await (supabase as any).rpc("get_public_booking", {
        p_booking_number: bookingNumber,
      });
      if (error) throw error;
      return (data as PublicBooking) || null;
    },
    staleTime: 60_000,
  });
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatLongDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function buildIcs(b: PublicBooking): string {
  const dt = new Date(`${b.booking_date}T${b.booking_time || "10:00"}`);
  const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd = new Date(dt.getTime() + 2 * 60 * 60 * 1000)
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventBliss//Marketplace//DE",
    "BEGIN:VEVENT",
    `UID:${b.booking_number}@event-bliss.com`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${b.service_title}`,
    `DESCRIPTION:Buchung ${b.booking_number} bei ${b.agency_name}`,
    `LOCATION:${b.agency_city ?? ""}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

type StatusMeta = {
  label: string;
  sub: string;
  colorClass: string;
  icon: typeof CheckCircle2;
  // Status-tinted accents for the whole page
  glowA: string; // primary ambient blob color rgba
  glowB: string; // secondary ambient blob color rgba
  accent: string; // hex for chips / halos
};

function getStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "confirmed":
      return {
        label: "Bestätigt",
        sub: "Alles fix — deine Buchung ist bestätigt.",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
        icon: CheckCircle2,
        glowA: "rgba(52,211,153,0.22)",
        glowB: "rgba(207,150,255,0.16)",
        accent: "#34d399",
      };
    case "pending_confirmation":
      return {
        label: "Wartet auf Bestätigung",
        sub: "Die Agentur bestätigt deine Buchung in Kürze.",
        colorClass: "bg-amber-500/20 text-amber-300 border-amber-400/30",
        icon: HourglassIcon,
        glowA: "rgba(251,191,36,0.24)",
        glowB: "rgba(236,72,153,0.14)",
        accent: "#fbbf24",
      };
    case "reserved":
      return {
        label: "Reserviert",
        sub: "Dein Slot ist für dich reserviert.",
        colorClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
        icon: AlertCircle,
        glowA: "rgba(34,211,238,0.22)",
        glowB: "rgba(139,92,246,0.14)",
        accent: "#22d3ee",
      };
    case "completed":
      return {
        label: "Abgeschlossen",
        sub: "Event war — hoffentlich hattest du Spaß!",
        colorClass: "bg-violet-500/20 text-violet-300 border-violet-400/30",
        icon: Star,
        glowA: "rgba(167,139,250,0.22)",
        glowB: "rgba(251,191,36,0.12)",
        accent: "#a78bfa",
      };
    case "cancelled_by_customer":
      return {
        label: "Storniert",
        sub: "Diese Buchung wurde vom Kunden storniert.",
        colorClass: "bg-red-500/20 text-red-300 border-red-400/30",
        icon: XCircle,
        glowA: "rgba(248,113,113,0.2)",
        glowB: "rgba(100,116,139,0.12)",
        accent: "#f87171",
      };
    case "cancelled_by_agency":
      return {
        label: "Von Agentur storniert",
        sub: "Die Agentur hat die Buchung storniert.",
        colorClass: "bg-red-500/20 text-red-300 border-red-400/30",
        icon: Ban,
        glowA: "rgba(248,113,113,0.2)",
        glowB: "rgba(100,116,139,0.12)",
        accent: "#f87171",
      };
    case "refunded":
      return {
        label: "Erstattet",
        sub: "Die Buchung wurde erstattet.",
        colorClass: "bg-slate-500/20 text-slate-300 border-slate-400/30",
        icon: XCircle,
        glowA: "rgba(148,163,184,0.2)",
        glowB: "rgba(100,116,139,0.12)",
        accent: "#94a3b8",
      };
    default:
      return {
        label: status,
        sub: "",
        colorClass: "bg-white/10 text-slate-300 border-white/20",
        icon: AlertCircle,
        glowA: "rgba(207,150,255,0.16)",
        glowB: "rgba(0,227,253,0.12)",
        accent: "#cf96ff",
      };
  }
}

// -------------------------------------------------------------------
// Sparkle ambience
// -------------------------------------------------------------------

function Sparks({ count = 14, disabled }: { count?: number; disabled: boolean }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 8 + Math.random() * 14,
        delay: Math.random() * 3,
        duration: 5 + Math.random() * 4,
      })),
    [count],
  );
  if (disabled) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ top: `${s.top}%`, left: `${s.left}%` }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -40, -80], scale: [0.4, 1, 0.4] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <Sparkles
            style={{ width: s.size, height: s.size }}
            className="text-violet-300/40"
          />
        </motion.div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------------
// Film-grain overlay (shared visual language)
// -------------------------------------------------------------------

function FilmGrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.05] mix-blend-overlay print:hidden"
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="pb-noise-film">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pb-noise-film)" />
      </svg>
    </div>
  );
}

// -------------------------------------------------------------------
// Typewriter
// -------------------------------------------------------------------

function Typewriter({
  text,
  reduced,
  startDelay = 0.2,
  charDelay = 0.03,
  className = "",
}: {
  text: string;
  reduced: boolean;
  startDelay?: number;
  charDelay?: number;
  className?: string;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  if (reduced) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: startDelay + i * charDelay, duration: 0.22 }}
          className="inline-block"
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
      <motion.span
        className="inline-block w-[2px] h-3 align-middle ml-0.5 bg-current"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          delay: startDelay,
          duration: 0.6,
          repeat: Math.max(0, Math.ceil(chars.length * charDelay / 0.6)),
          ease: "linear",
        }}
        aria-hidden
      />
    </span>
  );
}

// -------------------------------------------------------------------
// Odometer digit rolling
// -------------------------------------------------------------------

function OdometerDigit({ digit }: { digit: string }) {
  const n = /^\d$/.test(digit) ? parseInt(digit, 10) : null;
  if (n === null) {
    return <span className="inline-block">{digit}</span>;
  }
  return (
    <span className="inline-block relative overflow-hidden align-baseline" style={{ width: "0.6em", height: "1em", lineHeight: 1 }}>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        animate={{ y: `-${n * 100}%` }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span key={d} className="block text-center" style={{ height: "1em", lineHeight: 1 }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Odometer({ value, reduced }: { value: number; reduced: boolean }) {
  const str = String(Math.max(0, Math.floor(value)));
  if (reduced) {
    return <span className="tabular-nums">{str}</span>;
  }
  return (
    <span className="inline-flex tabular-nums">
      {Array.from(str).map((d, i) => (
        <OdometerDigit key={`${i}-${d}`} digit={d} />
      ))}
    </span>
  );
}

// -------------------------------------------------------------------
// Animated strikethrough (for cancelled state)
// -------------------------------------------------------------------

function StrikeThrough({ show, reduced }: { show: boolean; reduced: boolean }) {
  return (
    <motion.span
      className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] rounded-full bg-red-400/80 origin-left"
      initial={{ scaleX: 0 }}
      animate={show ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ delay: reduced ? 0 : 0.6, duration: reduced ? 0.2 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    />
  );
}

// -------------------------------------------------------------------
// QR-stub placeholder (stylised "ticket" QR)
// -------------------------------------------------------------------

function QrStub({ bookingNumber }: { bookingNumber: string }) {
  // Generate a deterministic 8x8 matrix of filled cells from the booking number
  const cells = useMemo(() => {
    const seed = Array.from(bookingNumber).reduce((s, c) => s + c.charCodeAt(0), 0);
    const out: boolean[] = [];
    let x = seed || 1;
    for (let i = 0; i < 64; i++) {
      x = (x * 9301 + 49297) % 233280;
      out.push((x / 233280) > 0.48);
    }
    // Force 3 "finder" corner squares on (top-left, top-right, bottom-left)
    const corners = [
      [0, 0], [0, 1], [1, 0], [1, 1],
      [0, 6], [0, 7], [1, 6], [1, 7],
      [6, 0], [6, 1], [7, 0], [7, 1],
    ];
    corners.forEach(([r, c]) => { out[r * 8 + c] = true; });
    return out;
  }, [bookingNumber]);

  return (
    <div
      className="relative rounded-md bg-white/95 p-1.5 shadow-lg"
      title={`Buchung #${bookingNumber}`}
      aria-label={`Buchung #${bookingNumber}`}
    >
      <div className="grid grid-cols-8 gap-[1px]" style={{ width: 56, height: 56 }}>
        {cells.map((on, i) => (
          <div
            key={i}
            className={on ? "bg-black" : "bg-white"}
            style={{ width: 6, height: 6 }}
          />
        ))}
      </div>
      <div className="mt-1 text-[8px] font-mono text-black/80 text-center tracking-wider">
        #{bookingNumber}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Ripple button (share)
// -------------------------------------------------------------------

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function RippleShareButton({
  onClick,
  reduced,
}: {
  onClick: () => void | Promise<void>;
  reduced: boolean;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pulse, setPulse] = useState(0);

  function handle(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const id = Date.now();
    if (!reduced) {
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
      setPulse((p) => p + 1);
    }
    void onClick();
  }
  return (
    <motion.button
      key={pulse}
      onClick={handle}
      animate={reduced ? {} : { scale: [1, 1.06, 1] }}
      transition={{ duration: 0.35 }}
      className="col-span-2 sm:col-span-1 relative overflow-hidden bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white h-11 gap-2 shadow-lg shadow-violet-500/25 rounded-md inline-flex items-center justify-center text-sm font-medium"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{
            left: r.x,
            top: r.y,
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            animation: "pb-ripple 0.7s ease-out forwards",
          }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Teilen
      </span>
      <style>{`
        @keyframes pb-ripple {
          0%   { width: 10px; height: 10px; opacity: 0.5; }
          100% { width: 380px; height: 380px; opacity: 0; }
        }
      `}</style>
    </motion.button>
  );
}

// -------------------------------------------------------------------
// Floating orbit chips
// -------------------------------------------------------------------

function OrbitChips({
  items,
  reduced,
}: {
  items: Array<{ emoji: string; label: string }>;
  reduced: boolean;
}) {
  if (reduced) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {items.map((c, i) => {
        const dur = 18 + i * 3;
        // positions bias around corners/edges
        const positions = [
          { top: "4%", left: "6%" },
          { top: "10%", right: "6%" },
          { bottom: "8%", left: "8%" },
          { bottom: "12%", right: "4%" },
        ];
        const p = positions[i % positions.length];
        return (
          <motion.div
            key={i}
            className="absolute inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] text-slate-200 shadow-md"
            style={{ ...p }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.85, 0.85, 0],
              y: [0, -16, -8, -32],
              x: [0, i % 2 ? 10 : -10, 0, i % 2 ? 18 : -18],
              scale: [0.85, 1, 1, 0.9],
            }}
            transition={{
              duration: dur,
              delay: 0.8 + i * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.3, 0.75, 1],
            }}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// Perforated divider (ticket notch between header and body of hero card)
// -------------------------------------------------------------------

function Perforation() {
  return (
    <div className="relative h-5 -my-2 z-10">
      {/* Left notch */}
      <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0612] border border-white/10" />
      {/* Right notch */}
      <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0612] border border-white/10" />
      {/* Dotted line */}
      <span
        className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-0"
        style={{
          borderTop: "1.5px dashed rgba(255,255,255,0.18)",
        }}
      />
    </div>
  );
}

// -------------------------------------------------------------------
// Page
// -------------------------------------------------------------------

export default function PublicBookingPage() {
  const { number } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = usePublicBooking(number);
  const [now, setNow] = useState(Date.now());
  const reduced = !!useReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Smoothly animate the countdown number for the odometer
  const mvDay = useMotionValue(0);
  const springDay = useSpring(mvDay, { stiffness: 80, damping: 20 });
  const [liveDay, setLiveDay] = useState(0);
  useEffect(() => {
    const unsub = springDay.on("change", (v) => setLiveDay(Math.round(v)));
    return () => unsub();
  }, [springDay]);

  const handleDownloadIcs = () => {
    if (!booking) return;
    const ics = buildIcs(booking);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventbliss-${booking.booking_number}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kalender-Datei heruntergeladen");
  };

  const handleShare = async () => {
    if (!booking) return;
    const url = window.location.href;
    const text = `${booking.customer_first_name} hat ${booking.service_title} bei ${booking.agency_name} gebucht — sei dabei!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "EventBliss Buchung", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link kopiert");
      }
    } catch {
      /* cancelled */
    }
  };

  // Tilt motion values for the hero ticket
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, { stiffness: 120, damping: 18 });
  const tiltY = useSpring(rawY, { stiffness: 120, damping: 18 });
  const rotateY = useTransform(tiltX, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(tiltY, [-0.5, 0.5], [4, -4]);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle intro 3D flip on mount
    if (reduced) return;
    const c1 = animate(rawX, [0.5, 0], { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    const c2 = animate(rawY, [-0.25, 0], { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => {
      c1.stop();
      c2.stop();
    };
  }, [reduced, rawX, rawY]);

  const dayCount = useMemo(() => {
    if (!booking) return 0;
    return daysUntil(booking.booking_date);
  }, [booking, now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate the odometer value when dayCount changes
  useEffect(() => {
    if (reduced) {
      mvDay.set(dayCount);
      return;
    }
    const c = animate(mvDay, dayCount, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => c.stop();
  }, [dayCount, mvDay, reduced]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Buchung nicht gefunden</h1>
          <p className="text-slate-400 text-sm">
            Die Buchung #{number} existiert nicht oder wurde storniert.
          </p>
          <Button
            onClick={() => navigate("/marketplace")}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Zum Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(booking.status);
  const StatusIcon = statusMeta.icon;
  const isCancelled = ["cancelled_by_customer", "cancelled_by_agency", "refunded"].includes(booking.status);
  const isConfirmed = booking.status === "confirmed";
  const excitement =
    dayCount <= 0
      ? "Es geht los!"
      : dayCount === 1
      ? "Nur noch 1 Tag!"
      : dayCount <= 7
      ? `Nur noch ${dayCount} Tage`
      : `In ${dayCount} Tagen`;

  const orbitItems = [
    { emoji: "🎉", label: excitement },
    { emoji: "📍", label: booking.agency_city ?? "Event" },
    { emoji: "👥", label: `${booking.participant_count} Pers.` },
    { emoji: booking.service_category ? "✨" : "⭐", label: booking.service_category ?? "EventBliss" },
  ];

  // Ticket tilt mouse handlers
  function onTicketMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const r = ticketRef.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onTicketLeave() {
    if (reduced) return;
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0612] text-white print:bg-white print:text-black">
      {/* Status-tinted ambient gradient */}
      <div className="absolute inset-0 overflow-hidden print:hidden">
        <motion.div
          className="absolute -top-1/3 -left-1/3 w-[120vw] h-[120vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${statusMeta.glowA}, rgba(0,0,0,0) 60%)`,
          }}
          animate={reduced ? {} : { scale: [1, 1.08, 1], rotate: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/3 w-[120vw] h-[120vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${statusMeta.glowB}, rgba(0,0,0,0) 60%)`,
          }}
          animate={reduced ? {} : { scale: [1, 1.1, 1], rotate: [0, -30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Sparks disabled={reduced} />
      <FilmGrainOverlay />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Shared badge */}
        <motion.div
          className="text-center mb-6 print:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="bg-white/5 backdrop-blur-xl border-white/10 text-slate-300 gap-1.5">
            <Share2 className="w-3 h-3" />
            Geteilte Buchung
          </Badge>
        </motion.div>

        {/* Invitation-style header */}
        <motion.div
          className="text-center mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-slate-400 uppercase tracking-widest mb-2">
            <Typewriter
              text={`${booking.customer_first_name} freut sich auf`}
              reduced={reduced}
              startDelay={0.15}
              charDelay={0.03}
            />
          </p>
          {/* Big title with optional strike-through */}
          <div className="relative inline-block">
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: reduced ? 0 : 0.1 + (`${booking.customer_first_name} freut sich auf`.length * 0.03),
                type: "spring",
                stiffness: 220,
                damping: 22,
              }}
              className={`text-4xl sm:text-5xl font-black tracking-tight leading-tight ${
                isCancelled
                  ? "text-slate-300"
                  : "bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent"
              }`}
            >
              {booking.service_title}
            </motion.h1>
            <StrikeThrough show={isCancelled} reduced={reduced} />
          </div>

          {/* Status pill */}
          <motion.div
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl ${statusMeta.colorClass}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.6 }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{statusMeta.label}</span>
          </motion.div>
          {statusMeta.sub && (
            <p className="text-xs text-slate-400 mt-2">{statusMeta.sub}</p>
          )}
        </motion.div>

        {/* Hero ticket (boarding-pass feel) */}
        <motion.div
          ref={ticketRef}
          onMouseMove={onTicketMove}
          onMouseLeave={onTicketLeave}
          className="relative mb-5 print:mb-3"
          style={{
            perspective: 1200,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <OrbitChips items={orbitItems} reduced={reduced} />
          <motion.div
            className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden will-change-transform print:bg-white print:border-black/20 print:shadow-none"
            style={{
              rotateX: reduced ? 0 : rotateX,
              rotateY: reduced ? 0 : rotateY,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Paper-texture noise */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay print:hidden"
              aria-hidden
            >
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <filter id="ticket-noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#ticket-noise)" />
              </svg>
            </div>

            {/* Hero cover */}
            <div
              className="relative h-52 sm:h-64 w-full"
              style={{
                background: booking.service_cover
                  ? `url(${booking.service_cover}) center/cover`
                  : "linear-gradient(135deg, rgba(207,150,255,0.45), rgba(31,31,41,0.9), rgba(0,227,253,0.35))",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent print:hidden" />

              {booking.service_category && (
                <Badge className="absolute top-4 left-4 bg-violet-500/20 text-violet-200 border-violet-400/30 backdrop-blur-md">
                  {booking.service_category}
                </Badge>
              )}

              {/* Specular sweep */}
              {!reduced && (
                <motion.div
                  className="absolute inset-0 pointer-events-none print:hidden"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%)",
                  }}
                  initial={{ x: "-130%" }}
                  animate={{ x: "130%" }}
                  transition={{ delay: 1.1, duration: 1.4, ease: "easeInOut" }}
                />
              )}

              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 print:text-black/60">
                    {excitement}
                  </p>
                  <p className="text-lg font-bold text-white print:text-black">
                    {formatLongDate(booking.booking_date)}
                  </p>
                </div>
                {dayCount > 0 && isConfirmed && (
                  <motion.div
                    className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 print:bg-white print:text-black"
                    animate={reduced ? {} : {
                      boxShadow: [
                        `0 0 0 0 ${statusMeta.accent}00`,
                        `0 0 24px 0 ${statusMeta.accent}99`,
                        `0 0 0 0 ${statusMeta.accent}00`,
                      ],
                    }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-3xl font-black leading-none text-white print:text-black">
                      <Odometer value={liveDay || dayCount} reduced={reduced} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 print:text-black/60 mt-1">
                      Tag{dayCount !== 1 ? "e" : ""}
                    </span>
                  </motion.div>
                )}
                {dayCount > 0 && !isConfirmed && !isCancelled && (
                  <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 print:bg-white">
                    <span className="text-3xl font-black leading-none text-white print:text-black">
                      {dayCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 print:text-black/60 mt-1">
                      Tag{dayCount !== 1 ? "e" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Perforated divider */}
            <Perforation />

            {/* Body / ticket stub */}
            <div className="relative p-5 sm:p-6 flex gap-4 items-start print:p-4">
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile icon={Calendar} label="Datum" value={formatLongDate(booking.booking_date)} />
                  <InfoTile icon={Clock} label="Uhrzeit" value={booking.booking_time?.slice(0, 5) || "—"} />
                  <InfoTile icon={Users} label="Personen" value={`${booking.participant_count}`} />
                  <InfoTile icon={Star} label="Buchung" value={`#${booking.booking_number}`} mono />
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <QrStub bookingNumber={booking.booking_number} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Agency card */}
        <motion.div
          onClick={() =>
            booking.agency_slug && navigate(`/marketplace/agency/${booking.agency_slug}`)
          }
          className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 mb-5 flex items-center gap-4 cursor-pointer hover:border-violet-400/40 transition-colors print:bg-white print:border-black/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.55 }}
          whileHover={reduced ? {} : { scale: 1.01 }}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 print:text-black/60">
              Gebucht bei
            </p>
            <p className="font-bold text-white truncate print:text-black">{booking.agency_name}</p>
            {booking.agency_city && (
              <p className="text-xs text-slate-400 flex items-center gap-1 print:text-black/70">
                <MapPin className="w-3 h-3" />
                {booking.agency_city}
                {booking.agency_country && `, ${booking.agency_country}`}
              </p>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.65 }}
        >
          <Button
            onClick={handleDownloadIcs}
            variant="outline"
            disabled={isCancelled}
            className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white h-11 gap-2 disabled:opacity-40"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">In </span>Kalender
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white h-11 gap-2"
          >
            <Printer className="w-4 h-4" />
            PDF / Druck
          </Button>
          <RippleShareButton onClick={handleShare} reduced={reduced} />
        </motion.div>

        <motion.p
          className="text-center text-xs text-slate-500 mt-8 print:text-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.8 }}
        >
          Powered by <span className="text-violet-300 font-semibold print:text-black">EventBliss</span>
        </motion.p>
      </div>

      {/* Print-mode overrides */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .fixed, .absolute.inset-0 { display: none !important; }
          .shadow-2xl, .shadow-lg { box-shadow: none !important; }
          .backdrop-blur-xl, .backdrop-blur-md, .backdrop-blur-sm { backdrop-filter: none !important; }
        }
      `}</style>

      {/* AnimatePresence placeholder (kept for tree shape parity) */}
      <AnimatePresence>{null}</AnimatePresence>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl p-3 bg-white/[0.02] border border-white/10 print:bg-white print:border-black/20">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1 print:text-black/60">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className={`text-sm font-bold text-white ${mono ? "font-mono" : ""} print:text-black`}>
        {value}
      </p>
    </div>
  );
}
