/**
 * NativeServiceDetailScreen — native mobile service detail + booking.
 * Full-bleed hero, tab sections, sticky booking bar.
 */
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, Clock, MapPin, ShieldCheck, Heart, Share2,
  Check, AlertTriangle, Minus, Plus, Calendar, Loader2, ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMarketplaceServiceBySlug, useCreateBooking } from "@/hooks/useMarketplaceServices";
import { useServiceAvailability } from "@/hooks/useServiceAvailability";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  workshop: "Workshop",
  catering: "Catering",
  entertainment: "Entertainment",
  location: "Location",
  decoration: "Dekoration",
  music: "Musik",
  photography: "Foto",
  venue: "Venue",
  wellness: "Wellness",
  sport: "Sport",
  deko: "Deko",
  transport: "Transport",
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_person: "pro Person",
  flat_rate: "Pauschal",
  per_hour: "pro Stunde",
  custom: "Individuell",
};

const CANCELLATION: Record<string, { label: string; color: string }> = {
  flexible: { label: "Flexibel", color: "text-emerald-400 bg-emerald-400/10" },
  moderate: { label: "Moderat", color: "text-amber-400 bg-amber-400/10" },
  strict: { label: "Strikt", color: "text-red-400 bg-red-400/10" },
};

const TIME_SLOTS_FALLBACK = [
  "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

type Tab = "info" | "includes" | "reviews" | "agency";

function formatPrice(cents: number) {
  return (cents / 100).toFixed(0);
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted"}
        />
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="h-full bg-background animate-pulse">
      <div className="h-56 bg-muted" />
      <div className="px-5 pt-4 space-y-3">
        <div className="h-7 w-3/4 bg-muted rounded-lg" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="flex gap-2 mt-3">
          <div className="h-7 w-20 bg-muted rounded-full" />
          <div className="h-7 w-24 bg-muted rounded-full" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function NativeServiceDetailScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [participants, setParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [liked, setLiked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);

  const { data: s, isLoading, isError } = useMarketplaceServiceBySlug(slug);
  const createBooking = useCreateBooking();

  const now = new Date();
  const availYear = selectedDate ? parseInt(selectedDate.slice(0, 4), 10) : now.getFullYear();
  const availMonth = selectedDate ? parseInt(selectedDate.slice(5, 7), 10) - 1 : now.getMonth();
  const { data: availabilityMap } = useServiceAvailability(s?.id, availYear, availMonth);

  const timeSlots = useMemo(() => {
    if (!selectedDate || !availabilityMap) return TIME_SLOTS_FALLBACK;
    const daySlots = availabilityMap.get(selectedDate);
    if (!daySlots?.length) return TIME_SLOTS_FALLBACK;
    return daySlots.filter((t: any) => t.available).map((t: any) => t.start);
  }, [selectedDate, availabilityMap]);

  const totalPrice = useMemo(() => {
    if (!s) return 0;
    return s.price_type === "per_person" ? s.price_cents * participants : s.price_cents;
  }, [s, participants]);

  const searchParams = new URLSearchParams(window.location.search);
  const eventId = searchParams.get("event_id");

  const handleBook = async () => {
    if (!s) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!selectedDate || !selectedTime) {
      const { toast } = await import("sonner");
      toast.error("Bitte wähle Datum und Uhrzeit.");
      return;
    }

    setIsBooking(true);
    haptics.medium();
    try {
      const result = await createBooking.mutateAsync({
        serviceId: s.id,
        agencyId: s.agency_id,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        participantCount: participants,
        unitPriceCents: s.price_cents,
        totalPriceCents: totalPrice,
        customerName: user.user_metadata?.full_name || user.email || "",
        customerEmail: user.email || "",
        autoConfirm: s.auto_confirm,
        eventId: eventId || undefined,
      });

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result?.id) {
        navigate(`/booking-success?booking=${result.id}`);
      } else {
        navigate("/my-bookings");
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !s) {
    return (
      <div className="h-full bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-display font-bold text-foreground">Service nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">Dieser Service ist nicht mehr verfügbar.</p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Zum Marketplace
          </button>
        </div>
      </div>
    );
  }

  const cancellation = CANCELLATION[s.cancellation_policy] ?? CANCELLATION.moderate;
  const agencyCity = (s as any).agency_city || s.location_city || "";
  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: t("marketplaceService.description", "Beschreibung") },
    { key: "includes", label: t("marketplaceService.includes", "Inklusive") },
    { key: "reviews", label: t("marketplaceService.reviews", "Bewertungen") },
    { key: "agency", label: t("marketplaceService.agency", "Agentur") },
  ];

  return (
    <div className="relative h-full bg-background overflow-y-auto native-scroll">
      {/* Hero */}
      <div className="relative h-56 w-full overflow-hidden">
        {s.cover_image_url ? (
          <img
            src={s.cover_image_url}
            alt={s.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-background to-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 safe-top flex items-center justify-between px-4 pt-3">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>

          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              <Share2 size={16} className="text-white" />
            </button>
            <button
              onClick={() => { setLiked(!liked); haptics.light(); }}
              className={cn(
                "w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center",
                liked ? "bg-pink-500/40" : "bg-black/30",
              )}
            >
              <Heart size={16} className={cn("text-white", liked && "fill-white")} />
            </button>
          </div>
        </div>

        {/* Category badge */}
        <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md text-xs font-semibold text-primary border border-primary/30">
          {CATEGORY_LABELS[s.category] ?? s.category}
        </span>
      </div>

      {/* Main content */}
      <div className="px-5 pt-4 pb-28">
        {/* Title + Price */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
        >
          <h1 className="text-xl font-display font-bold text-foreground leading-tight">
            {s.title}
          </h1>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {formatPrice(s.price_cents)} €
            </span>
            <span className="text-xs text-muted-foreground">
              {PRICE_TYPE_LABELS[s.price_type] ?? s.price_type}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <StarRating rating={s.avg_rating} size={13} />
              <span className="text-xs text-muted-foreground ml-0.5">
                {s.avg_rating} ({s.review_count})
              </span>
            </div>
            {(s.duration_minutes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} /> {s.duration_minutes} Min
              </span>
            )}
            {(s.location_city || agencyCity) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} /> {s.location_city || agencyCity}
              </span>
            )}
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", cancellation.color)}>
              Stornierung: {cancellation.label}
            </span>
            {(s.agency_tier === "professional" || s.agency_tier === "enterprise") && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                <ShieldCheck size={11} /> Verifiziert
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[11px] text-muted-foreground bg-muted">
              {s.booking_count}x gebucht
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); haptics.select(); }}
              className={cn(
                "relative px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors",
                activeTab === tab.key ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="native-service-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            {activeTab === "info" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description || s.short_description || "Keine Beschreibung verfügbar."}
                </p>
                {s.requirements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-display font-semibold text-foreground mb-2">Hinweise</h3>
                    <ul className="space-y-1.5">
                      {s.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "includes" && (
              <ul className="space-y-2">
                {s.includes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Details verfügbar.</p>
                ) : (
                  s.includes.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2 text-xs"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))
                )}
              </ul>
            )}

            {activeTab === "reviews" && (
              <div>
                {s.review_count > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground">{s.avg_rating}</span>
                    <div>
                      <StarRating rating={s.avg_rating} size={16} />
                      <span className="text-xs text-muted-foreground">{s.review_count} Bewertungen</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star size={28} className="text-muted mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Noch keine Bewertungen.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "agency" && (
              <motion.div
                className="p-4 rounded-2xl border border-border bg-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  {s.agency_logo ? (
                    <img
                      src={s.agency_logo}
                      alt={s.agency_name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-base font-bold text-white">
                      {s.agency_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-semibold text-sm text-foreground truncate">
                        {s.agency_name}
                      </span>
                      {(s.agency_tier === "professional" || s.agency_tier === "enterprise") && (
                        <ShieldCheck size={14} className="text-primary shrink-0" />
                      )}
                    </div>
                    {agencyCity && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {agencyCity}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/marketplace/agency/${s.agency_slug}`)}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-foreground/[0.06] border border-border text-foreground flex items-center justify-center gap-1"
                >
                  Profil ansehen <ChevronRight size={13} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Inline booking section */}
        <motion.div
          className="mt-8 p-4 rounded-2xl border border-border bg-card space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.soft, delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-sm text-foreground">Jetzt buchen</h3>

          {/* Date */}
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Datum</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Uhrzeit</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary/40 appearance-none"
            >
              <option value="">Zeit wählen...</option>
              {timeSlots.map((t: string) => (
                <option key={t} value={t}>{t} Uhr</option>
              ))}
            </select>
          </div>

          {/* Participants */}
          {s.price_type === "per_person" && (
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Teilnehmer</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setParticipants((p) => Math.max(s.min_participants || 1, p - 1))}
                  className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold text-foreground">{participants}</span>
                  <span className="text-[11px] text-muted-foreground ml-1">
                    {participants === 1 ? "Person" : "Personen"}
                  </span>
                </div>
                <button
                  onClick={() => setParticipants((p) => Math.min(s.max_participants || 50, p + 1))}
                  className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Gesamt</span>
            <span className="text-lg font-bold text-foreground tabular-nums">{formatPrice(totalPrice)} €</span>
          </div>
        </motion.div>
      </div>

      {/* Fixed bottom booking bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border px-5 py-3 safe-bottom flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-base font-bold text-foreground tabular-nums">{formatPrice(totalPrice)} €</span>
          <span className="text-[11px] text-muted-foreground ml-1.5">
            {s.price_type === "per_person"
              ? `${participants} Pers.`
              : (PRICE_TYPE_LABELS[s.price_type] ?? "")}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBook}
          disabled={isBooking}
          className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 disabled:opacity-60 flex items-center gap-2"
        >
          {isBooking && <Loader2 size={14} className="animate-spin" />}
          {t("marketplace.bookNow", "Jetzt buchen")}
        </motion.button>
      </div>
    </div>
  );
}
