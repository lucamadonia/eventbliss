import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, MapPin, Share2, Heart, ShieldCheck,
  ChevronRight, Check, AlertTriangle, Minus, Plus, Calendar,
  Loader2,
} from "lucide-react";
import { useMarketplaceServiceBySlug, useCreateBooking } from "@/hooks/useMarketplaceServices";
import { useServiceAvailability } from "@/hooks/useServiceAvailability";
import { supabase } from "@/integrations/supabase/client";

// Design tokens
const C = {
  surface: "bg-[#0d0d15]",
  high: "bg-[#1f1f29]",
  low: "bg-[#13131b]",
  primary: "#cf96ff",
  secondary: "#00e3fd",
  tertiary: "#ff7350",
  border: "border-[#484750]/10",
} as const;

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_person: "pro Person",
  flat: "Pauschal",
  per_hour: "pro Stunde",
};

const CATEGORY_LABELS: Record<string, string> = {
  workshop: "Workshop",
  catering: "Catering",
  entertainment: "Entertainment",
  location: "Location",
  decoration: "Dekoration",
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

type Tab = "beschreibung" | "inklusive" | "bewertungen" | "agentur";

const TABS: { key: Tab; label: string }[] = [
  { key: "beschreibung", label: "Beschreibung" },
  { key: "inklusive", label: "Inklusive" },
  { key: "bewertungen", label: "Bewertungen" },
  { key: "agentur", label: "Agentur" },
];

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-8 font-['Be_Vietnam_Pro']">{stars}&#9733;</span>
      <div className="flex-1 h-2 rounded-full bg-[#13131b] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#cf96ff] to-[#00e3fd]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: stars * 0.05 }}
        />
      </div>
      <span className="text-sm text-gray-500 w-8 text-right font-['Be_Vietnam_Pro']">{count}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function ServiceSkeleton() {
  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      {/* Hero skeleton */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#cf96ff]/10 via-[#1f1f29] to-[#00e3fd]/10 animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-8">
        {/* Left */}
        <div className="flex-1 space-y-4">
          <div className="h-10 w-3/4 rounded-xl bg-[#1f1f29] animate-pulse" />
          <div className="h-5 w-1/2 rounded-lg bg-[#1f1f29] animate-pulse" />
          <div className="h-8 w-40 rounded-lg bg-[#1f1f29] animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-8 w-24 rounded-full bg-[#1f1f29] animate-pulse" />
            <div className="h-8 w-24 rounded-full bg-[#1f1f29] animate-pulse" />
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded bg-[#1f1f29] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#1f1f29] animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-[#1f1f29] animate-pulse" />
          </div>
        </div>
        {/* Right */}
        <div className="hidden lg:block w-[380px] shrink-0">
          <div className="h-[480px] rounded-2xl bg-[#1f1f29] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not Found
// ---------------------------------------------------------------------------

function ServiceNotFound() {
  const navigate = useNavigate();
  return (
    <div className={`min-h-screen ${C.surface} text-white flex items-center justify-center`}>
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans']">Service nicht gefunden</h1>
        <p className="text-gray-400 font-['Be_Vietnam_Pro']">
          Dieser Service existiert nicht oder ist nicht mehr verfügbar.
        </p>
        <button
          onClick={() => navigate("/marketplace")}
          className="mt-4 px-6 py-3 rounded-xl font-semibold font-['Be_Vietnam_Pro'] bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15]"
        >
          Zurück zum Marketplace
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MarketplaceServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("beschreibung");
  const [participants, setParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [liked, setLiked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const { data: s, isLoading, isError } = useMarketplaceServiceBySlug(slug);
  const createBooking = useCreateBooking();

  // Availability: derive year/month from selectedDate or current month
  const now = new Date();
  const availYear = selectedDate ? parseInt(selectedDate.slice(0, 4), 10) : now.getFullYear();
  const availMonth = selectedDate ? parseInt(selectedDate.slice(5, 7), 10) - 1 : now.getMonth();
  const { data: availabilityMap } = useServiceAvailability(s?.id, availYear, availMonth);

  // Compute time slots from availability data or fallback
  const timeSlots = useMemo(() => {
    if (!selectedDate || !availabilityMap) return TIME_SLOTS_FALLBACK;
    const daySlots = availabilityMap.get(selectedDate);
    if (!daySlots?.length) return TIME_SLOTS_FALLBACK;
    return daySlots.filter((t: any) => t.available).map((t: any) => t.start);
  }, [selectedDate, availabilityMap]);

  const ratingBreakdown = useMemo(() => {
    // No live reviews yet - show empty breakdown based on avg_rating
    if (!s) return [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    // Approximate distribution from avg rating and review count
    if (s.review_count > 0) {
      const avg = Math.round(s.avg_rating);
      counts[avg - 1] = s.review_count;
    }
    return counts;
  }, [s]);

  const totalPrice = useMemo(() => {
    if (!s) return 0;
    if (s.price_type === "per_person") return s.price_cents * participants;
    return s.price_cents;
  }, [s, participants]);

  // Read event_id from URL search params (when booking from event dashboard)
  const searchParams = new URLSearchParams(window.location.search);
  const eventId = searchParams.get("event_id");

  // Handle booking
  const handleBook = async () => {
    if (!s) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!selectedDate || !selectedTime) {
      const { toast } = await import("sonner");
      toast.error("Bitte wähle ein Datum und eine Uhrzeit.");
      return;
    }

    setIsBooking(true);
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

      // Redirect to Stripe Checkout if URL is available
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (eventId) {
        navigate(`/event/${eventId}`);
      } else {
        navigate("/marketplace/bookings");
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <ServiceSkeleton />;
  if (isError || !s) return <ServiceNotFound />;

  const cancellation = CANCELLATION[s.cancellation_policy] ?? CANCELLATION.moderate;
  const agencyCity = (s as any).agency_city || s.location_city || "";

  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      {/* Hero */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {s.cover_image_url ? (
          <img
            src={s.cover_image_url}
            alt={s.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-[#cf96ff]/30 via-[#1f1f29] to-[#00e3fd]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
        <motion.div
          className="absolute top-4 left-4 md:top-6 md:left-8 px-3 py-1.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] bg-[#cf96ff]/20 text-[#cf96ff] backdrop-blur-sm border border-[#cf96ff]/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {CATEGORY_LABELS[s.category] ?? s.category}
        </motion.div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-['Be_Vietnam_Pro']">
          <button onClick={() => navigate("/marketplace")} className="hover:text-[#cf96ff] transition-colors">
            Marketplace
          </button>
          <ChevronRight size={14} />
          <span className="text-gray-400">{CATEGORY_LABELS[s.category] ?? s.category}</span>
          <ChevronRight size={14} />
          <span className="text-white/70 truncate">{s.title}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] leading-tight">{s.title}</h1>

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <StarRating rating={s.avg_rating} />
              <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">
                {s.avg_rating} ({s.review_count} Bewertungen)
              </span>
            </div>
            <span className="text-sm text-gray-500 font-['Be_Vietnam_Pro']">{s.booking_count} Buchungen</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-2xl font-black font-['Plus_Jakarta_Sans'] text-white">
              {formatPrice(s.price_cents)} €
            </span>
            <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">
              {PRICE_TYPE_LABELS[s.price_type] ?? s.price_type}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {(s.duration_minutes ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-['Be_Vietnam_Pro'] bg-[#1f1f29] border border-[#484750]/10">
                <Clock size={14} className="text-[#00e3fd]" /> {s.duration_minutes} Min
              </span>
            )}
            {(s.location_city || agencyCity) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-['Be_Vietnam_Pro'] bg-[#1f1f29] border border-[#484750]/10">
                <MapPin size={14} className="text-[#ff7350]" /> {s.location_city || agencyCity}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 border-b border-[#484750]/10 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-4 py-3 text-sm font-semibold font-['Be_Vietnam_Pro'] whitespace-nowrap transition-colors ${
                  activeTab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
                {activeTab === t.key && (
                  <motion.div
                    layoutId="service-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              {activeTab === "beschreibung" && (
                <div className="space-y-6">
                  <p className="text-gray-300 leading-relaxed font-['Be_Vietnam_Pro'] text-sm">
                    {s.description || s.short_description || "Keine Beschreibung verfügbar."}
                  </p>
                  {s.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] mb-3">Hinweise</h3>
                      <ul className="space-y-2">
                        {s.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400 font-['Be_Vietnam_Pro']">
                            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "inklusive" && (
                <ul className="space-y-3">
                  {s.includes.length === 0 && (
                    <p className="text-gray-500 font-['Be_Vietnam_Pro'] text-sm">Keine Details verfügbar.</p>
                  )}
                  {s.includes.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro']"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              )}

              {activeTab === "bewertungen" && (
                <div className="space-y-6">
                  {s.review_count > 0 ? (
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <RatingBar key={stars} stars={stars} count={ratingBreakdown[stars - 1]} total={s.review_count} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 font-['Be_Vietnam_Pro'] text-sm">
                      Noch keine Bewertungen für diesen Service.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "agentur" && (
                <motion.div
                  className={`p-5 rounded-2xl ${C.high} border ${
                    s.agency_tier === "enterprise"
                      ? "border-amber-400/40 shadow-lg shadow-amber-400/10"
                      : C.border
                  }`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-4">
                    {s.agency_logo ? (
                      <img
                        src={s.agency_logo}
                        alt={s.agency_name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-xl font-bold font-['Plus_Jakarta_Sans']">
                        {s.agency_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-['Plus_Jakarta_Sans'] text-lg">{s.agency_name}</h3>
                        {(s.agency_tier === "professional" || s.agency_tier === "enterprise") && (
                          <ShieldCheck size={18} className="text-[#00e3fd]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">{agencyCity}</span>
                        {s.agency_tier === "professional" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['Be_Vietnam_Pro'] bg-[#cf96ff]/15 text-[#cf96ff]">
                            Pro &#10003;
                          </span>
                        )}
                        {s.agency_tier === "enterprise" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['Be_Vietnam_Pro'] bg-amber-400/15 text-amber-400">
                            Enterprise &#10003;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/marketplace/agency/${s.agency_slug}`)}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold font-['Be_Vietnam_Pro'] bg-[#13131b] border border-[#484750]/10 hover:border-[#cf96ff]/30 transition-colors"
                  >
                    Profil ansehen
                  </button>
                  <button
                    onClick={() => navigate(`/marketplace/agency/${s.agency_slug}`)}
                    className="mt-2 w-full py-2 rounded-xl text-xs font-['Be_Vietnam_Pro'] text-[#cf96ff] hover:text-white transition-colors"
                  >
                    Alle Services dieser Agentur &rarr;
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right Column - Booking Card (Desktop) */}
        <motion.aside
          className="hidden lg:block w-[380px] shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="sticky top-24 bg-[#1f1f29]/80 backdrop-blur-xl border border-[#484750]/10 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-3xl font-black font-['Plus_Jakarta_Sans']">{formatPrice(s.price_cents)} €</span>
              <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro'] ml-2">
                {PRICE_TYPE_LABELS[s.price_type]}
              </span>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-gray-500 font-['Be_Vietnam_Pro'] mb-1.5">Datum wählen</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#13131b] border border-[#484750]/10 text-sm font-['Be_Vietnam_Pro'] text-white focus:outline-none focus:border-[#cf96ff]/40 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs text-gray-500 font-['Be_Vietnam_Pro'] mb-1.5">Uhrzeit</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#13131b] border border-[#484750]/10 text-sm font-['Be_Vietnam_Pro'] text-white focus:outline-none focus:border-[#cf96ff]/40 transition-colors appearance-none"
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
                <label className="block text-xs text-gray-500 font-['Be_Vietnam_Pro'] mb-1.5">Teilnehmer</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setParticipants((p) => Math.max(s.min_participants || 1, p - 1))}
                    className="w-10 h-10 rounded-xl bg-[#13131b] border border-[#484750]/10 flex items-center justify-center hover:border-[#cf96ff]/30 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-bold font-['Plus_Jakarta_Sans']">{participants}</span>
                    <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro'] ml-1.5">
                      {participants === 1 ? "Person" : "Personen"}
                    </span>
                  </div>
                  <button
                    onClick={() => setParticipants((p) => Math.min(s.max_participants || 50, p + 1))}
                    className="w-10 h-10 rounded-xl bg-[#13131b] border border-[#484750]/10 flex items-center justify-center hover:border-[#cf96ff]/30 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-[#484750]/10">
              <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">Gesamt</span>
              <span className="text-2xl font-black font-['Plus_Jakarta_Sans']">{formatPrice(totalPrice)} €</span>
            </div>

            {/* Cancellation */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] ${cancellation.color}`}>
              Stornierung: {cancellation.label}
            </div>

            {/* Verified Agency Badge */}
            {(s.agency_tier === "professional" || s.agency_tier === "enterprise") && (
              <div className="flex items-center gap-1.5 text-xs font-['Be_Vietnam_Pro'] text-[#00e3fd]">
                <ShieldCheck size={14} />
                <span>Verifizierte Agentur</span>
              </div>
            )}

            {/* Enterprise Partner Badge */}
            {s.agency_tier === "enterprise" && (
              <div className="px-3 py-2 rounded-xl text-center text-xs font-semibold font-['Be_Vietnam_Pro'] bg-amber-400/10 text-amber-400 border border-amber-400/20">
                Enterprise Partner
              </div>
            )}

            {/* Book Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBook}
              disabled={isBooking}
              className="w-full py-3.5 rounded-xl font-bold font-['Plus_Jakarta_Sans'] text-sm bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] shadow-lg shadow-[#cf96ff]/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isBooking && <Loader2 size={16} className="animate-spin" />}
              Jetzt buchen
            </motion.button>

            {/* Share / Favorite */}
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl text-sm font-['Be_Vietnam_Pro'] bg-[#13131b] border border-[#484750]/10 hover:border-[#cf96ff]/30 transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} /> Teilen
              </button>
              <button
                onClick={() => setLiked(!liked)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-['Be_Vietnam_Pro'] border transition-colors flex items-center justify-center gap-2 ${
                  liked
                    ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
                    : "bg-[#13131b] border-[#484750]/10 hover:border-pink-500/30"
                }`}
              >
                <Heart size={16} className={liked ? "fill-current" : ""} />
                {liked ? "Gespeichert" : "Merken"}
              </button>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* Mobile Fixed Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1f1f29]/95 backdrop-blur-xl border-t border-[#484750]/10 px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-lg font-black font-['Plus_Jakarta_Sans']">{formatPrice(totalPrice)} €</span>
          <span className="text-xs text-gray-400 font-['Be_Vietnam_Pro'] ml-1.5">
            {s.price_type === "per_person" ? `${participants} Pers.` : PRICE_TYPE_LABELS[s.price_type]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
              liked ? "bg-pink-500/10 border-pink-500/30 text-pink-400" : "bg-[#13131b] border-[#484750]/10"
            }`}
          >
            <Heart size={18} className={liked ? "fill-current" : ""} />
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBook}
            disabled={isBooking}
            className="px-6 py-2.5 rounded-xl font-bold font-['Plus_Jakarta_Sans'] text-sm bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] disabled:opacity-60 flex items-center gap-2"
          >
            {isBooking && <Loader2 size={14} className="animate-spin" />}
            Buchen
          </motion.button>
        </div>
      </div>

      {/* Bottom spacer for mobile bar */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
