import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, MapPin, Share2, Heart, ShieldCheck,
  ChevronRight, Check, AlertTriangle, Minus, Plus, Calendar,
} from "lucide-react";

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

const MOCK = {
  title: "Cocktail Workshop Berlin",
  category: "workshop",
  price: 3900,
  priceType: "per_person" as const,
  city: "Berlin",
  rating: 4.8,
  reviews: 47,
  bookings: 182,
  duration: 120,
  description:
    "Erlebt einen unvergesslichen Abend und lernt die Kunst des Cocktail-Mixens! Unser professioneller Barkeeper fuehrt euch durch die Welt der Spirituosen und zeigt euch, wie ihr klassische und kreative Cocktails perfekt zubereitet. Ideal fuer JGA, Geburtstage oder Teamevents.",
  includes: [
    "3 Cocktails pro Person",
    "Alle Zutaten & Equipment",
    "Professioneller Barkeeper",
    "Rezeptkarten zum Mitnehmen",
    "Snacks & Wasser",
  ],
  requirements: ["Mindestalter 18 Jahre", "Bequeme Kleidung empfohlen"],
  cancellationPolicy: "moderate" as const,
  agencyName: "Berlin Events GmbH",
  agencySlug: "berlin-events",
  agencyTier: "professional",
  agencyCity: "Berlin",
  mockReviews: [
    { name: "Sarah M.", rating: 5, date: "2026-03-15", comment: "Absolut genial! Der Barkeeper war super unterhaltsam und die Cocktails haben fantastisch geschmeckt." },
    { name: "Tom K.", rating: 5, date: "2026-03-02", comment: "Perfekt fuer unseren JGA! Alle hatten mega Spass." },
    { name: "Lisa W.", rating: 4, date: "2026-02-18", comment: "Tolle Location und netter Barkeeper. Ein Cocktail mehr waere super gewesen." },
    { name: "Max P.", rating: 5, date: "2026-02-01", comment: "Haben es fuer ein Teamevent gebucht — kam super an bei allen!" },
  ],
};

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

const TIME_SLOTS = [
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

export default function MarketplaceService() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("beschreibung");
  const [participants, setParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [liked, setLiked] = useState(false);

  const s = MOCK;

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    s.mockReviews.forEach((r) => { counts[r.rating - 1]++; });
    return counts;
  }, [s.mockReviews]);

  const totalPrice = useMemo(() => {
    if (s.priceType === "per_person") return s.price * participants;
    return s.price;
  }, [s.price, s.priceType, participants]);

  const cancellation = CANCELLATION[s.cancellationPolicy] ?? CANCELLATION.moderate;

  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      {/* Hero */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
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
              <StarRating rating={s.rating} />
              <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">
                {s.rating} ({s.reviews} Bewertungen)
              </span>
            </div>
            <span className="text-sm text-gray-500 font-['Be_Vietnam_Pro']">{s.bookings} Buchungen</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-2xl font-black font-['Plus_Jakarta_Sans'] text-white">
              {formatPrice(s.price)} €
            </span>
            <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">
              {PRICE_TYPE_LABELS[s.priceType] ?? s.priceType}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {s.duration > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-['Be_Vietnam_Pro'] bg-[#1f1f29] border border-[#484750]/10">
                <Clock size={14} className="text-[#00e3fd]" /> {s.duration} Min
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-['Be_Vietnam_Pro'] bg-[#1f1f29] border border-[#484750]/10">
              <MapPin size={14} className="text-[#ff7350]" /> {s.city}
            </span>
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
                  <p className="text-gray-300 leading-relaxed font-['Be_Vietnam_Pro'] text-sm">{s.description}</p>
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
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <RatingBar key={stars} stars={stars} count={ratingBreakdown[stars - 1]} total={s.mockReviews.length} />
                    ))}
                  </div>
                  <div className="space-y-4 pt-2">
                    {s.mockReviews.map((review, i) => (
                      <motion.div
                        key={i}
                        className={`p-4 rounded-2xl ${C.high} ${C.border} border`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-sm font-bold font-['Plus_Jakarta_Sans']">
                            {review.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm font-['Plus_Jakarta_Sans']">{review.name}</span>
                              <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">
                                {new Date(review.date).toLocaleDateString("de-DE")}
                              </span>
                            </div>
                            <StarRating rating={review.rating} size={12} />
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-300 font-['Be_Vietnam_Pro'] leading-relaxed">{review.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "agentur" && (
                <motion.div
                  className={`p-5 rounded-2xl ${C.high} border ${
                    s.agencyTier === "enterprise"
                      ? "border-amber-400/40 shadow-lg shadow-amber-400/10"
                      : C.border
                  }`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-xl font-bold font-['Plus_Jakarta_Sans']">
                      {s.agencyName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-['Plus_Jakarta_Sans'] text-lg">{s.agencyName}</h3>
                        {(s.agencyTier === "professional" || s.agencyTier === "enterprise") && (
                          <ShieldCheck size={18} className="text-[#00e3fd]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro']">{s.agencyCity}</span>
                        {s.agencyTier === "professional" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['Be_Vietnam_Pro'] bg-[#cf96ff]/15 text-[#cf96ff]">
                            Pro &#10003;
                          </span>
                        )}
                        {s.agencyTier === "enterprise" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['Be_Vietnam_Pro'] bg-amber-400/15 text-amber-400">
                            Enterprise &#10003;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/marketplace/agency/${s.agencySlug}`)}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold font-['Be_Vietnam_Pro'] bg-[#13131b] border border-[#484750]/10 hover:border-[#cf96ff]/30 transition-colors"
                  >
                    Profil ansehen
                  </button>
                  <button
                    onClick={() => navigate(`/marketplace/agency/${s.agencySlug}`)}
                    className="mt-2 w-full py-2 rounded-xl text-xs font-['Be_Vietnam_Pro'] text-[#cf96ff] hover:text-white transition-colors"
                  >
                    Alle Services dieser Agentur &rarr;
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right Column — Booking Card (Desktop) */}
        <motion.aside
          className="hidden lg:block w-[380px] shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="sticky top-24 bg-[#1f1f29]/80 backdrop-blur-xl border border-[#484750]/10 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-3xl font-black font-['Plus_Jakarta_Sans']">{formatPrice(s.price)} €</span>
              <span className="text-sm text-gray-400 font-['Be_Vietnam_Pro'] ml-2">
                {PRICE_TYPE_LABELS[s.priceType]}
              </span>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-gray-500 font-['Be_Vietnam_Pro'] mb-1.5">Datum waehlen</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                <option value="">Zeit waehlen...</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t} Uhr</option>
                ))}
              </select>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-xs text-gray-500 font-['Be_Vietnam_Pro'] mb-1.5">Teilnehmer</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setParticipants((p) => Math.max(1, p - 1))}
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
                  onClick={() => setParticipants((p) => Math.min(50, p + 1))}
                  className="w-10 h-10 rounded-xl bg-[#13131b] border border-[#484750]/10 flex items-center justify-center hover:border-[#cf96ff]/30 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

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
            {(s.agencyTier === "professional" || s.agencyTier === "enterprise") && (
              <div className="flex items-center gap-1.5 text-xs font-['Be_Vietnam_Pro'] text-[#00e3fd]">
                <ShieldCheck size={14} />
                <span>Verifizierte Agentur</span>
              </div>
            )}

            {/* Enterprise Partner Badge */}
            {s.agencyTier === "enterprise" && (
              <div className="px-3 py-2 rounded-xl text-center text-xs font-semibold font-['Be_Vietnam_Pro'] bg-amber-400/10 text-amber-400 border border-amber-400/20">
                Enterprise Partner
              </div>
            )}

            {/* Book Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-bold font-['Plus_Jakarta_Sans'] text-sm bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] shadow-lg shadow-[#cf96ff]/20"
            >
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
            {s.priceType === "per_person" ? `${participants} Pers.` : PRICE_TYPE_LABELS[s.priceType]}
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
            className="px-6 py-2.5 rounded-xl font-bold font-['Plus_Jakarta_Sans'] text-sm bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15]"
          >
            Buchen
          </motion.button>
        </div>
      </div>

      {/* Bottom spacer for mobile bar */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
