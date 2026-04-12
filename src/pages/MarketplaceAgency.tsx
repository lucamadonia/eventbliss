import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Star, ShieldCheck, Calendar, Users, TrendingUp,
  Mail, Phone, Globe, ChevronRight, ExternalLink,
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

const MOCK_AGENCY = {
  name: "Berlin Events GmbH",
  slug: "berlin-events",
  city: "Berlin",
  tier: "professional",
  verified: true,
  description:
    "Seit 2020 organisieren wir unvergessliche Events in Berlin. Von Cocktail Workshops bis hin zu kompletten Eventpaketen — wir machen euren Anlass zu etwas Besonderem.",
  email: "info@berlin-events.de",
  phone: "+49 30 123456",
  website: "www.berlin-events.de",
  serviceCount: 12,
  totalBookings: 523,
  avgRating: 4.8,
  since: 2020,
};

const MOCK_SERVICES = [
  { slug: "cocktail-workshop-berlin", title: "Cocktail Workshop Berlin", category: "Workshop", price: 3900, priceType: "pro Person", rating: 4.8, reviews: 47 },
  { slug: "gin-tasting-berlin", title: "Gin Tasting Berlin", category: "Workshop", price: 4500, priceType: "pro Person", rating: 4.7, reviews: 32 },
  { slug: "barkeeper-show", title: "Barkeeper Show", category: "Entertainment", price: 29900, priceType: "Pauschal", rating: 4.9, reviews: 18 },
  { slug: "event-catering-basic", title: "Event Catering Basic", category: "Catering", price: 2500, priceType: "pro Person", rating: 4.6, reviews: 55 },
  { slug: "cocktail-kurs-premium", title: "Cocktail Kurs Premium", category: "Workshop", price: 5900, priceType: "pro Person", rating: 4.9, reviews: 21 },
  { slug: "team-event-paket", title: "Team-Event Paket", category: "Workshop", price: 49900, priceType: "Pauschal", rating: 4.7, reviews: 14 },
];

const MOCK_REVIEWS = [
  { name: "Sarah M.", service: "Cocktail Workshop Berlin", rating: 5, date: "2026-03-15", comment: "Absolut genial! Der Barkeeper war super unterhaltsam und die Cocktails haben fantastisch geschmeckt." },
  { name: "Markus R.", service: "Gin Tasting Berlin", rating: 5, date: "2026-03-10", comment: "Sehr informativ und unterhaltsam. Top Organisation!" },
  { name: "Tom K.", service: "Cocktail Workshop Berlin", rating: 5, date: "2026-03-02", comment: "Perfekt fuer unseren JGA! Alle hatten mega Spass." },
  { name: "Anna B.", service: "Barkeeper Show", rating: 5, date: "2026-02-25", comment: "Die Show war das Highlight unserer Firmenfeier. Absolute Empfehlung!" },
];

const TIER_BADGES: Record<string, { label: string; color: string; partnerLabel: string }> = {
  starter: { label: "Starter", color: "text-gray-400 bg-gray-400/10", partnerLabel: "Standard" },
  professional: { label: "Professional", color: "text-[#cf96ff] bg-[#cf96ff]/10", partnerLabel: "Pro Partner" },
  enterprise: { label: "Enterprise", color: "text-amber-400 bg-amber-400/10", partnerLabel: "Enterprise Partner" },
  premium: { label: "Premium", color: "text-[#00e3fd] bg-[#00e3fd]/10", partnerLabel: "Premium Partner" },
};

const TIER_BENEFITS: Record<string, string[]> = {
  professional: [
    "Verifizierte Agentur",
    "Priorisiert in der Suche",
    "Eigene Profilseite",
  ],
  enterprise: [
    "Verifizierte Agentur",
    "Priorisiert in der Suche",
    "Eigene Profilseite",
    "KI-Empfehlung",
    "Auto-Featured",
    "Premium Support",
  ],
};

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
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

function StatCard({
  icon: Icon, value, label, delay,
}: { icon: React.ElementType; value: string; label: string; delay: number }) {
  return (
    <motion.div
      className={`flex-1 min-w-[120px] p-4 rounded-2xl ${C.high} border ${C.border}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Icon size={20} className="text-[#cf96ff] mb-2" />
      <div className="text-xl font-black font-['Plus_Jakarta_Sans']">{value}</div>
      <div className="text-xs text-gray-500 font-['Be_Vietnam_Pro'] mt-0.5">{label}</div>
    </motion.div>
  );
}

export default function MarketplaceAgency() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const a = MOCK_AGENCY;
  const tierBadge = TIER_BADGES[a.tier] ?? TIER_BADGES.starter;

  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      {/* Header Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className={`absolute inset-0 ${
          a.tier === "enterprise"
            ? "bg-gradient-to-br from-amber-400/30 via-[#1f1f29] to-amber-600/15"
            : a.tier === "professional"
            ? "bg-gradient-to-br from-[#cf96ff]/30 via-[#1f1f29] to-[#cf96ff]/10"
            : "bg-gradient-to-br from-[#cf96ff]/25 via-[#1f1f29] to-[#00e3fd]/15"
        }`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
      </div>

      {/* Agency Info Overlay */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-end gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-3xl font-black font-['Plus_Jakarta_Sans'] shadow-xl shadow-[#cf96ff]/20 border-4 border-[#0d0d15]">
            {a.name.charAt(0)}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans']">{a.name}</h1>
              {(a.tier === "professional" || a.tier === "enterprise") && (
                <ShieldCheck size={22} className="text-[#00e3fd]" />
              )}
              {a.tier === "professional" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-['Be_Vietnam_Pro'] bg-[#cf96ff]/15 text-[#cf96ff] border border-[#cf96ff]/20">
                  Pro Partner &#10003;
                </span>
              )}
              {a.tier === "enterprise" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-['Be_Vietnam_Pro'] bg-amber-400/15 text-amber-400 border border-amber-400/20">
                  Enterprise Partner &#10003;
                </span>
              )}
              {a.tier === "starter" && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] ${tierBadge.color}`}>
                  {tierBadge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400 font-['Be_Vietnam_Pro']">
              <MapPin size={14} className="text-gray-500" />
              {a.city}
            </div>
          </div>
        </motion.div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-['Be_Vietnam_Pro'] mt-6">
          <button onClick={() => navigate("/marketplace")} className="hover:text-[#cf96ff] transition-colors">
            Marketplace
          </button>
          <ChevronRight size={14} />
          <span className="text-white/70">{a.name}</span>
        </nav>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          <StatCard icon={TrendingUp} value={String(a.serviceCount)} label="Services" delay={0.1} />
          <StatCard icon={Users} value={`${a.totalBookings}+`} label="Buchungen" delay={0.15} />
          <StatCard icon={Star} value={`${a.avgRating}\u2605`} label="Bewertung" delay={0.2} />
          <StatCard icon={Calendar} value={`Seit ${a.since}`} label="Aktiv seit" delay={0.25} />
          <StatCard
            icon={ShieldCheck}
            value={(a.tier === "professional" || a.tier === "enterprise") ? "\u2713" : "\u2014"}
            label={(a.tier === "professional" || a.tier === "enterprise") ? "Verifiziert" : "Standard"}
            delay={0.3}
          />
        </div>

        {/* Tier-Vorteile */}
        {(a.tier === "professional" || a.tier === "enterprise") && TIER_BENEFITS[a.tier] && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <h2 className="text-lg font-black font-['Plus_Jakarta_Sans'] mb-3">Tier-Vorteile</h2>
            <div className="flex flex-wrap gap-2">
              {TIER_BENEFITS[a.tier]!.map((benefit) => (
                <span
                  key={benefit}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] border ${
                    a.tier === "enterprise"
                      ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                      : "bg-[#cf96ff]/10 text-[#cf96ff] border-[#cf96ff]/20"
                  }`}
                >
                  <ShieldCheck size={12} />
                  {benefit}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Ueber uns */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mb-3">Ueber uns</h2>
          <p className="text-gray-300 leading-relaxed font-['Be_Vietnam_Pro'] text-sm max-w-3xl">{a.description}</p>
        </motion.section>

        {/* Services */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_SERVICES.map((svc, i) => (
              <motion.button
                key={svc.slug}
                onClick={() => navigate(`/marketplace/service/${svc.slug}`)}
                className={`text-left p-4 rounded-2xl ${C.high} border ${C.border} hover:border-[#cf96ff]/20 transition-all group`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                whileHover={{ y: -2 }}
              >
                {/* Image Placeholder */}
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[#cf96ff]/10 via-[#1f1f29] to-[#00e3fd]/10 mb-3 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-['Be_Vietnam_Pro']">
                    {svc.category}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cf96ff]/10 text-[#cf96ff] font-semibold font-['Be_Vietnam_Pro']">
                    {svc.category}
                  </span>
                </div>
                <h3 className="font-bold font-['Plus_Jakarta_Sans'] text-sm group-hover:text-[#cf96ff] transition-colors">
                  {svc.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={svc.rating} size={12} />
                    <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">({svc.reviews})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-['Plus_Jakarta_Sans']">{formatPrice(svc.price)} €</span>
                    <span className="text-[10px] text-gray-500 font-['Be_Vietnam_Pro'] ml-1">{svc.priceType}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Bewertungen */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mb-4">Bewertungen</h2>
          <div className="space-y-4">
            {MOCK_REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                className={`p-4 rounded-2xl ${C.high} border ${C.border}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} size={12} />
                      <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">{review.service}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-300 font-['Be_Vietnam_Pro'] leading-relaxed">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Kontakt */}
        <motion.section
          className="mt-10 pb-16"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mb-4">Kontakt</h2>
          <div className={`p-5 rounded-2xl ${C.high} border ${C.border} space-y-3 max-w-md`}>
            <a
              href={`mailto:${a.email}`}
              className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#cf96ff] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                <Mail size={16} className="text-[#cf96ff]" />
              </div>
              {a.email}
            </a>
            <a
              href={`tel:${a.phone}`}
              className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#00e3fd] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                <Phone size={16} className="text-[#00e3fd]" />
              </div>
              {a.phone}
            </a>
            <a
              href={`https://${a.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#ff7350] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                <Globe size={16} className="text-[#ff7350]" />
              </div>
              {a.website}
              <ExternalLink size={12} className="text-gray-500 ml-auto" />
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
