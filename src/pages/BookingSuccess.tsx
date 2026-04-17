import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useInView,
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
  ArrowRight,
  Mail,
  Building2,
  PartyPopper,
  Star,
  ChevronLeft,
  HourglassIcon,
  XCircle,
  AlertCircle,
  Ban,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// -------------------------------------------------------------------
// Data
// -------------------------------------------------------------------

interface BookingDetails {
  id: string;
  booking_number: string;
  status: string;
  booking_date: string;
  booking_time: string;
  participant_count: number;
  total_price_cents: number;
  customer_name: string;
  customer_email: string;
  currency: string;
  service_id: string;
  agency_id: string;
  service_title?: string;
  service_slug?: string;
  service_cover?: string | null;
  service_category?: string;
  agency_name?: string;
  agency_city?: string | null;
  agency_slug?: string;
}

function useBookingDetails(bookingId: string | null) {
  return useQuery({
    queryKey: ["booking-success", bookingId],
    enabled: !!bookingId,
    queryFn: async (): Promise<BookingDetails | null> => {
      if (!bookingId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: booking, error } = await (supabase.from as any)("marketplace_bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("customer_id", user.id)
        .single();
      if (error) throw error;
      if (!booking) return null;

      // Service + translation
      const [{ data: service }, { data: translations }] = await Promise.all([
        (supabase.from as any)("marketplace_services")
          .select("slug, category, cover_image_url")
          .eq("id", booking.service_id)
          .single(),
        (supabase.from as any)("marketplace_service_translations")
          .select("title, locale")
          .eq("service_id", booking.service_id)
          .in("locale", ["de", "en"]),
      ]);

      const serviceTitle =
        (translations || []).find((t: any) => t.locale === "de")?.title
        || (translations || [])[0]?.title
        || "Dein Service";

      const { data: agency } = await (supabase.from as any)("agencies")
        .select("name, city, slug")
        .eq("id", booking.agency_id)
        .single();

      return {
        ...booking,
        service_title: serviceTitle,
        service_slug: service?.slug,
        service_cover: service?.cover_image_url ?? null,
        service_category: service?.category,
        agency_name: agency?.name,
        agency_city: agency?.city,
        agency_slug: agency?.slug,
      } as BookingDetails;
    },
    staleTime: 60_000,
  });
}

// -------------------------------------------------------------------
// Confetti burst — upgraded cinema-grade
// -------------------------------------------------------------------

const CONFETTI_COLORS = [
  "#cf96ff", "#00e3fd", "#ff7350", "#ffd700",
  "#f0abfc", "#84cc16", "#facc15", "#22d3ee",
];
const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐", "💫", "🌟", "🪩"];

type PieceShape = "rect" | "emoji" | "star" | "coin";
interface ConfettiPiece {
  id: number;
  // vw/vh spawn
  x: number;
  y: number;
  // destination
  tx: number;
  ty: number;
  // physics / visuals
  rotate: number;
  scale: number;
  color: string;
  emoji: string | null;
  shape: PieceShape;
  delay: number;
  duration: number;
  spin: number;
}

interface ConfettiBurstProps {
  count?: number;
  origin?: { x: number; y: number }; // vw / vh
  /** direction: 0 = omnidirectional, -1 = up-right, +1 = up-left, used for corner bursts */
  angleBias?: number;
  spread?: number; // max travel in vw
  delayBase?: number;
}

function ConfettiBurst({
  count = 120,
  origin = { x: 50, y: 35 },
  angleBias = 0,
  spread = 55,
  delayBase = 0,
}: ConfettiBurstProps) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      // Angle: if angleBias non-zero, bias direction
      const baseAngle = angleBias === 0
        ? Math.random() * Math.PI * 2
        : (-Math.PI / 2) + angleBias * (Math.PI / 3) + (Math.random() - 0.5) * (Math.PI / 1.4);
      const distance = spread * (0.3 + Math.random() * 0.9);
      const tx = origin.x + Math.cos(baseAngle) * distance;
      const ty = origin.y + Math.sin(baseAngle) * distance * 0.6;

      const roll = Math.random();
      let shape: PieceShape = "rect";
      if (roll > 0.75) shape = "emoji";
      else if (roll > 0.55) shape = "star";
      else if (roll > 0.45) shape = "coin";

      return {
        id: i,
        x: origin.x + (Math.random() - 0.5) * 4,
        y: origin.y + (Math.random() - 0.5) * 4,
        tx,
        ty,
        rotate: Math.random() * 900 - 450,
        scale: 0.5 + Math.random() * 1.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        emoji: shape === "emoji"
          ? CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]
          : null,
        shape,
        delay: delayBase + Math.random() * 0.5,
        duration: 2.4 + Math.random() * 2.6,
        spin: (Math.random() - 0.5) * 8,
      };
    });
  }, [count, origin.x, origin.y, angleBias, spread, delayBase]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p) => {
        // simulate gravity via easing + extra downward pull at the end
        const finalY = Math.min(p.ty + 70, 110);
        return (
          <motion.div
            key={p.id}
            className="absolute will-change-transform"
            initial={{
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              opacity: 0,
              rotate: 0,
              scale: 0,
            }}
            animate={{
              left: [`${p.x}vw`, `${p.tx}vw`, `${p.tx + p.spin}vw`],
              top: [`${p.y}vh`, `${p.ty}vh`, `${finalY}vh`],
              opacity: [0, 1, 1, 0],
              rotate: [0, p.rotate * 0.6, p.rotate],
              scale: [0, p.scale, p.scale * 0.9],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.22, 0.9, 0.35, 1],
              times: [0, 0.2, 1],
              opacity: { duration: p.duration, delay: p.delay, times: [0, 0.08, 0.82, 1] },
            }}
          >
            {p.shape === "emoji" && p.emoji ? (
              <span style={{ fontSize: `${p.scale * 22}px`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
                {p.emoji}
              </span>
            ) : p.shape === "star" ? (
              <svg
                width={p.scale * 16}
                height={p.scale * 16}
                viewBox="0 0 24 24"
                fill={p.color}
                style={{ filter: `drop-shadow(0 0 8px ${p.color})` }}
              >
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 16.8 5.7 21.4 8 14 2 9.4h7.6z" />
              </svg>
            ) : p.shape === "coin" ? (
              <span
                className="inline-block rounded-full"
                style={{
                  width: `${p.scale * 12}px`,
                  height: `${p.scale * 12}px`,
                  background: "radial-gradient(circle at 35% 30%, #fff4a8, #ffd700 55%, #b8860b)",
                  boxShadow: "0 0 14px rgba(255,215,0,0.7), inset 0 -2px 4px rgba(0,0,0,0.3)",
                }}
              />
            ) : (
              <span
                className="inline-block"
                style={{
                  width: `${p.scale * 10}px`,
                  height: `${p.scale * 14}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 10px ${p.color}99`,
                  borderRadius: "2px",
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// Floating sparkle background
// -------------------------------------------------------------------

function FloatingSparkles({ disabled }: { disabled: boolean }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 4,
      })),
    [],
  );
  if (disabled) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ top: `${s.top}%`, left: `${s.left}%` }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -30, -60],
            scale: [0.5, 1, 0.5],
          }}
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
// Film-grain SVG overlay (inline turbulence)
// -------------------------------------------------------------------

function FilmGrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.06] mix-blend-overlay print:hidden"
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise-film">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-film)" />
      </svg>
    </div>
  );
}

// -------------------------------------------------------------------
// Animated SVG Check (stroke-draw) with expanding rings
// -------------------------------------------------------------------

function HeroCheck({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        {/* Soft radial vignette */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl -z-10"
          style={{ background: "radial-gradient(circle, #cf96ff 0%, transparent 70%)" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: reduced ? 0.6 : [0, 0.9, 0.55], scale: reduced ? 1 : [0.6, 1.4, 1] }}
          transition={{ duration: reduced ? 0.4 : 2.2, ease: "easeOut" }}
        />

        {/* Expanding ring waves — 3 waves */}
        {!reduced && [0, 0.35, 0.7].map((d, i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-violet-300/60"
            initial={{ opacity: 0.7, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{
              duration: 1.8,
              delay: 0.3 + d,
              ease: "easeOut",
              repeat: 1,
              repeatDelay: 0.6,
            }}
          />
        ))}

        {/* Gradient disc */}
        <motion.div
          className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl shadow-violet-500/50"
          style={{
            background: "conic-gradient(from 180deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6)",
          }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
        >
          {/* Inner dark disc for contrast */}
          <div className="absolute inset-[3px] rounded-full bg-[#120b1e] flex items-center justify-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="checkGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e9d5ff" />
                  <stop offset="55%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#fcd34d" />
                </linearGradient>
              </defs>
              <motion.path
                d="M20 38 L32 50 L54 24"
                stroke="url(#checkGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: reduced ? 0.25 : 0.75, delay: reduced ? 0 : 0.5, ease: [0.65, 0, 0.35, 1] },
                  opacity: { duration: 0.2, delay: reduced ? 0 : 0.5 },
                }}
              />
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Animated number counter (for countdown)
// -------------------------------------------------------------------

function AnimatedNumber({ target, duration = 1.4, reduced }: { target: number; duration?: number; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = String(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [target, duration, reduced]);
  return (
    <span
      ref={ref}
      className="text-3xl font-black text-white drop-shadow-[0_0_14px_rgba(255,215,0,0.55)] tabular-nums"
      style={{ fontVariationSettings: '"wght" 900' }}
    >
      0
    </span>
  );
}

// -------------------------------------------------------------------
// Letter-stagger headline with shimmer sweep
// -------------------------------------------------------------------

function StaggerHeadline({ text, reduced }: { text: string; reduced: boolean }) {
  const letters = useMemo(() => Array.from(text), [text]);
  return (
    <h1 className="relative inline-block">
      <span className="sr-only">{text}</span>
      <span className="relative text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent" aria-hidden>
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ y: reduced ? 0 : 40, opacity: 0, rotateX: reduced ? 0 : -70 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{
              delay: reduced ? 0 : 0.55 + i * 0.055,
              type: "spring",
              stiffness: 400,
              damping: 22,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        ))}
      </span>
      {/* Shimmer sweep */}
      {!reduced && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.85) 50%, transparent 80%)",
            WebkitMaskImage:
              "linear-gradient(90deg, #000 0%, #000 100%)",
            mixBlendMode: "overlay",
          }}
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: "120%", opacity: [0, 1, 0] }}
          transition={{ delay: 1.3, duration: 1.1, ease: "easeInOut" }}
        />
      )}
    </h1>
  );
}

// -------------------------------------------------------------------
// Tilt card with mouse-parallax (desktop) / idle float (mobile)
// -------------------------------------------------------------------

function TiltCard({
  children,
  reduced,
  className = "",
}: {
  children: React.ReactNode;
  reduced: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 140, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 140, damping: 18 });
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse), (max-width: 640px)");
    setIsCoarse(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Idle float for mobile/coarse pointers
  useEffect(() => {
    if (!isCoarse || reduced) return;
    let t = 0;
    let raf = 0;
    const loop = () => {
      t += 0.012;
      rawX.set(Math.sin(t) * 0.22);
      rawY.set(Math.cos(t * 0.8) * 0.18);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isCoarse, reduced, rawX, rawY]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isCoarse || reduced) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rawX.set(px);
    rawY.set(py);
  }
  function handleMouseLeave() {
    if (isCoarse || reduced) return;
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// -------------------------------------------------------------------
// Magnetic button wrapper (primary CTA)
// -------------------------------------------------------------------

function MagneticWrap({
  children,
  reduced,
}: {
  children: React.ReactNode;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 18 });
  const sy = useSpring(my, { stiffness: 200, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    mx.set(Math.max(-12, Math.min(12, dx * 0.12)));
    my.set(Math.max(-8, Math.min(8, dy * 0.12)));
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function getStatusMeta(status: string) {
  switch (status) {
    case "confirmed":
      return { label: "Bestätigt", sub: "Alles fix — deine Buchung ist bestätigt.", colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30", icon: CheckCircle2 };
    case "pending_confirmation":
      return { label: "Wartet auf Bestätigung", sub: "Die Agentur bestätigt deine Buchung in Kürze.", colorClass: "bg-amber-500/20 text-amber-300 border-amber-400/30", icon: HourglassIcon };
    case "reserved":
      return { label: "Reserviert", sub: "Dein Slot ist reserviert.", colorClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30", icon: AlertCircle };
    case "completed":
      return { label: "Abgeschlossen", sub: "Event war — schön gewesen!", colorClass: "bg-violet-500/20 text-violet-300 border-violet-400/30", icon: Star };
    case "cancelled_by_customer":
      return { label: "Storniert", sub: "Du hast diese Buchung storniert.", colorClass: "bg-red-500/20 text-red-300 border-red-400/30", icon: XCircle };
    case "cancelled_by_agency":
      return { label: "Von Agentur storniert", sub: "Die Agentur hat die Buchung storniert.", colorClass: "bg-red-500/20 text-red-300 border-red-400/30", icon: Ban };
    case "refunded":
      return { label: "Erstattet", sub: "Die Buchung wurde erstattet.", colorClass: "bg-slate-500/20 text-slate-300 border-slate-400/30", icon: XCircle };
    default:
      return { label: status, sub: "", colorClass: "bg-white/10 text-slate-300 border-white/20", icon: AlertCircle };
  }
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / 86400000);
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

function buildIcsFile(b: BookingDetails): string {
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

// -------------------------------------------------------------------
// Page
// -------------------------------------------------------------------

// Demo fixture — activated via ?demo=1. Lets team preview the page without
// a real booking + without authentication. Never returned from the DB.
const DEMO_BOOKING: BookingDetails = {
  id: "demo-00000000-0000-0000-0000-000000000000",
  booking_number: "EB-2026-00042",
  status: "confirmed",
  booking_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  booking_time: "14:30",
  participant_count: 8,
  total_price_cents: 34500,
  customer_name: "Rebecca Musterfrau",
  customer_email: "rebecca@fambliss.de",
  currency: "EUR",
  service_id: "demo-service",
  agency_id: "demo-agency",
  service_title: "Wildwasser-Rafting Schwarzwald",
  service_slug: "wildwasser-rafting-schwarzwald",
  service_cover: null,
  service_category: "sport",
  agency_name: "FAMBLISS",
  agency_city: "Freiburg",
  agency_slug: "fambliss",
};

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("booking");
  const isDemo = params.get("demo") === "1";
  const live = useBookingDetails(isDemo ? null : bookingId);
  const booking: BookingDetails | null = isDemo ? DEMO_BOOKING : (live.data ?? null);
  const isLoading = isDemo ? false : live.isLoading;
  const error = isDemo ? null : live.error;
  const reduced = !!useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showSecondBurst, setShowSecondBurst] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    setIsSmall(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Stop confetti after ~6s; second burst at 0.9s
  useEffect(() => {
    if (reduced) {
      setShowConfetti(false);
      return;
    }
    const t1 = setTimeout(() => setShowSecondBurst(true), 900);
    const t2 = setTimeout(() => setShowConfetti(false), 6200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  const handleDownloadIcs = () => {
    if (!booking) return;
    const ics = buildIcsFile(booking);
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
    const shareUrl = `${window.location.origin}/booking/${booking.booking_number}`;
    const text = `Ich hab grade ${booking.service_title} bei ${booking.agency_name} gebucht! 🎉`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Meine EventBliss Buchung",
          text,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link kopiert: " + shareUrl);
      }
    } catch {
      /* user cancelled */
    }
  };

  // Scroll-reveal ref for timeline
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInView = useInView(timelineRef, { once: true, amount: 0.3 });

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    );
  }

  // Error / not found
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Buchung nicht gefunden</h1>
          <p className="text-slate-400">
            Wir konnten deine Buchung nicht laden. Schau in deinen Buchungen nach.
          </p>
          <Button
            onClick={() => navigate("/my-bookings")}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Zu meinen Buchungen
          </Button>
        </div>
      </div>
    );
  }

  const dayCount = daysUntil(booking.booking_date);
  const excitementCopy =
    dayCount <= 0
      ? "Es geht los! 🚀"
      : dayCount === 1
      ? "Nur noch 1 Tag! Bist du bereit? 🔥"
      : dayCount <= 7
      ? `Nur noch ${dayCount} Tage — die Vorfreude steigt! ⚡`
      : dayCount <= 30
      ? `Noch ${dayCount} Tage Vorfreude 💫`
      : `In ${dayCount} Tagen ist es soweit 🌟`;

  const confettiCount = reduced ? 0 : isSmall ? 50 : 120;
  const cornerCount = reduced ? 0 : isSmall ? 25 : 55;
  const isPending = booking.status === "pending_confirmation";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0612] text-white">
      {/* Dark vignette fade-in */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[2] print:hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.45) 85%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        aria-hidden
      />

      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden print:hidden">
        <motion.div
          className="absolute -top-1/3 -left-1/3 w-[140vw] h-[140vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(207,150,255,0.18), rgba(0,0,0,0) 60%)",
          }}
          animate={reduced ? {} : { scale: [1, 1.08, 1], rotate: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/3 w-[140vw] h-[140vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(0,227,253,0.14), rgba(0,0,0,0) 60%)",
          }}
          animate={reduced ? {} : { scale: [1, 1.1, 1], rotate: [0, -40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-[70vw] h-[70vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.08), rgba(0,0,0,0) 60%)",
          }}
          animate={reduced ? {} : { scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <FloatingSparkles disabled={reduced} />
      <FilmGrainOverlay />

      <AnimatePresence>
        {showConfetti && confettiCount > 0 && (
          <>
            <ConfettiBurst count={confettiCount} origin={{ x: 50, y: 32 }} spread={60} />
            {showSecondBurst && (
              <>
                <ConfettiBurst
                  count={cornerCount}
                  origin={{ x: 6, y: 100 }}
                  angleBias={-1}
                  spread={65}
                  delayBase={0}
                />
                <ConfettiBurst
                  count={cornerCount}
                  origin={{ x: 94, y: 100 }}
                  angleBias={1}
                  spread={65}
                  delayBase={0.08}
                />
              </>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Back link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 1.8 }}
          onClick={() => navigate("/my-bookings")}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors print:hidden"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Zu meinen Buchungen
        </motion.button>

        {/* Hero check (SVG draw + expanding rings) */}
        <HeroCheck reduced={reduced} />

        {/* Title (letter stagger + shimmer sweep) */}
        <motion.div
          className="text-center mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.4 }}
        >
          <StaggerHeadline text="Gebucht!" reduced={reduced} />
          <motion.p
            className="text-slate-300 mt-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 1.1 }}
          >
            <PartyPopper className="inline w-4 h-4 mr-1 text-amber-400" />
            {excitementCopy}
          </motion.p>
        </motion.div>

        {/* Booking number pill + status */}
        <motion.div
          className="flex flex-col items-center gap-2 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduced ? 0 : 1.2 }}
        >
          <Badge className="px-4 py-1.5 bg-white/5 backdrop-blur-xl border border-white/10 text-slate-200 font-mono text-xs shadow-lg">
            Buchung #{booking.booking_number}
          </Badge>
          {(() => {
            const meta = getStatusMeta(booking.status);
            const StatusIcon = meta.icon;
            return (
              <motion.div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-xl text-xs font-bold ${meta.colorClass}`}
                animate={
                  isPending && !reduced
                    ? {
                        opacity: [0.75, 1, 0.75],
                        boxShadow: [
                          "0 0 0px rgba(251,191,36,0)",
                          "0 0 18px rgba(251,191,36,0.45)",
                          "0 0 0px rgba(251,191,36,0)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <StatusIcon className="w-3 h-3" />
                {meta.label}
              </motion.div>
            );
          })()}
        </motion.div>

        {/* Service hero card — with parallax tilt */}
        <TiltCard reduced={reduced} className="mb-5">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 1.25 }}
          >
            {/* Cover */}
            <div
              className="h-40 sm:h-52 w-full relative"
              style={{
                background: booking.service_cover
                  ? `url(${booking.service_cover}) center/cover`
                  : "linear-gradient(135deg, rgba(207,150,255,0.4), rgba(31,31,41,0.8), rgba(0,227,253,0.3))",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Light specular sweep */}
              {!reduced && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                  }}
                  initial={{ x: "-130%" }}
                  animate={{ x: "130%" }}
                  transition={{ delay: 1.6, duration: 1.4, ease: "easeInOut" }}
                />
              )}

              {booking.service_category && (
                <Badge className="absolute top-4 left-4 bg-violet-500/20 text-violet-200 border-violet-400/30 backdrop-blur-md">
                  {booking.service_category}
                </Badge>
              )}
              {/* Countdown ribbon — animated number */}
              {dayCount > 0 && (
                <div className="absolute bottom-4 right-4 flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-white/60">
                    noch
                  </span>
                  <AnimatedNumber target={dayCount} reduced={reduced} />
                  <span className="text-[10px] uppercase tracking-wider text-white/60">
                    Tag{dayCount !== 1 ? "e" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-black leading-tight mb-4">
                {booking.service_title}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <DetailTile icon={Calendar} label="Datum" value={formatLongDate(booking.booking_date)} />
                <DetailTile icon={Clock} label="Uhrzeit" value={booking.booking_time?.slice(0, 5) || "—"} />
                <DetailTile icon={Users} label="Personen" value={`${booking.participant_count}`} />
                <DetailTile
                  icon={Sparkles}
                  label="Gesamt"
                  value={`${formatPrice(booking.total_price_cents)} €`}
                  highlight
                />
              </div>
            </div>
          </motion.div>
        </TiltCard>

        {/* Agency card */}
        <motion.div
          className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 sm:p-5 mb-5 flex items-center gap-4 cursor-pointer hover:border-violet-400/40 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 1.4 }}
          whileHover={reduced ? {} : { scale: 1.01 }}
          onClick={() =>
            booking.agency_slug && navigate(`/marketplace/agency/${booking.agency_slug}`)
          }
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Gebucht bei
            </p>
            <p className="font-bold text-white truncate">{booking.agency_name}</p>
            {booking.agency_city && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.agency_city}
              </p>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </motion.div>

        {/* Next steps timeline (scroll-reveal + line draw) */}
        <motion.div
          ref={timelineRef}
          className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={timelineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Was jetzt passiert
          </h3>

          {/* Connecting vertical line that draws in */}
          <div className="relative">
            <motion.span
              className="absolute left-4 top-4 bottom-4 w-[2px] origin-top pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(139,92,246,0.6), rgba(236,72,153,0.5), rgba(245,158,11,0.5))",
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={timelineInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              aria-hidden
            />
            <div className="space-y-3 relative">
              <TimelineStep
                step={1}
                icon={Mail}
                title="Bestätigungs-Mail"
                desc={`Checke dein Postfach (${booking.customer_email}) — Bestätigung ist unterwegs.`}
                delay={0.15}
                show={timelineInView}
                reduced={reduced}
              />
              <TimelineStep
                step={2}
                icon={Building2}
                title={`${booking.agency_name ?? "Die Agency"} meldet sich`}
                desc="Mit letzten Details oder Rückfragen zu deinem Event."
                delay={0.3}
                show={timelineInView}
                reduced={reduced}
              />
              <TimelineStep
                step={3}
                icon={PartyPopper}
                title="Der große Tag"
                desc={formatLongDate(booking.booking_date) + " — wir drücken die Daumen!"}
                delay={0.45}
                show={timelineInView}
                reduced={reduced}
              />
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-4 print:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 1.9 }}
        >
          <Button
            onClick={handleDownloadIcs}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white h-11 gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Kalender</span>
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white h-11 gap-2"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white h-11 gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Teilen</span>
          </Button>
        </motion.div>

        {/* Primary CTA — magnetic + gradient sweep */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 2 }}
          className="print:hidden"
        >
          <MagneticWrap reduced={reduced}>
            <div className="relative group">
              <Button
                onClick={() => navigate("/my-bookings")}
                className="relative w-full h-12 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 hover:opacity-95 text-white font-bold text-base shadow-lg shadow-violet-500/30 gap-2 overflow-hidden"
              >
                {/* Shimmer sweep on hover */}
                <span
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
                    transform: "translateX(-120%)",
                    animation: "btn-sweep 1.1s ease-in-out infinite",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Alle meine Buchungen
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
              <style>{`
                @keyframes btn-sweep {
                  0% { transform: translateX(-120%); }
                  100% { transform: translateX(120%); }
                }
              `}</style>
            </div>
          </MagneticWrap>
        </motion.div>

        {/* Footer quote */}
        <motion.p
          className="text-center text-xs text-slate-500 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 2.3 }}
        >
          Made with <span className="text-pink-400">♥</span> — EventBliss
        </motion.p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

function DetailTile({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border ${
        highlight
          ? "bg-amber-500/10 border-amber-400/30"
          : "bg-white/[0.02] border-white/10"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
        <Icon className={`w-3 h-3 ${highlight ? "text-amber-400" : ""}`} />
        {label}
      </div>
      <p
        className={`text-sm font-bold ${
          highlight ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TimelineStep({
  step,
  icon: Icon,
  title,
  desc,
  delay,
  show,
  reduced,
}: {
  step: number;
  icon: any;
  title: string;
  desc: string;
  delay: number;
  show: boolean;
  reduced: boolean;
}) {
  return (
    <motion.div
      className="flex items-start gap-3 relative"
      initial={{ opacity: 0, x: -12 }}
      animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 20 }}
    >
      <motion.div
        className="relative shrink-0"
        initial={{ scale: 0 }}
        animate={show ? { scale: 1 } : { scale: 0 }}
        transition={{
          delay: delay + 0.05,
          type: "spring",
          stiffness: 500,
          damping: 14,
        }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-pink-500/40 border border-violet-400/50 flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-3.5 h-3.5 text-violet-100" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[9px] font-black text-black flex items-center justify-center shadow-md shadow-amber-500/50"
          initial={{ scale: 0, rotate: -90 }}
          animate={show ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{
            delay: delay + 0.2,
            type: "spring",
            stiffness: 600,
            damping: 12,
          }}
        >
          {step}
        </motion.div>
        {!reduced && show && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-400/50 pointer-events-none"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, delay: delay + 0.15 }}
          />
        )}
      </motion.div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}
