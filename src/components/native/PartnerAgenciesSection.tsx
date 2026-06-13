/**
 * PartnerAgenciesSection — collapsed-by-default partner agencies list for the
 * native marketplace screen.
 *
 * Data: curated static agencies (agencies-data) merged with active DB agencies
 * (public RLS read on `agencies`, is_active = true). Agencies that have at
 * least one approved marketplace service deep-link to their bookable profile
 * (/marketplace/agency/:slug); all others expand inline with the existing
 * call / email / website contact actions (AgencyCityPanel look).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, ChevronDown, ChevronRight, Phone, Mail, Globe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AGENCIES as STATIC_AGENCIES, COUNTRIES as STATIC_COUNTRIES } from "@/lib/agencies-data";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────
interface PartnerAgency {
  key: string;
  name: string;
  city: string;
  country: string;       // display name
  countryCode: string;   // ISO-2 (or "OTHER")
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  slug: string | null;        // DB agencies only
  bookable: boolean;          // ≥1 approved marketplace service
}

// ─── Country helpers ─────────────────────────────────────────────
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Deutschland: "DE", Germany: "DE",
  "Österreich": "AT", Austria: "AT",
  Schweiz: "CH", Switzerland: "CH",
  Niederlande: "NL", Netherlands: "NL",
  Belgien: "BE", Belgium: "BE",
  Frankreich: "FR", France: "FR",
  Spanien: "ES", Spain: "ES",
  Italien: "IT", Italy: "IT",
  Portugal: "PT",
  Polen: "PL", Poland: "PL",
  "Türkei": "TR", Turkey: "TR",
};

function toCountryCode(country: string): string {
  if (/^[A-Za-z]{2}$/.test(country)) return country.toUpperCase();
  return COUNTRY_NAME_TO_CODE[country] || "OTHER";
}

function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── DB agencies (public read) + approved-service counts ─────────
function usePartnerDbAgencies() {
  return useQuery({
    queryKey: ["partner-agencies"],
    queryFn: async (): Promise<PartnerAgency[]> => {
      try {
        const [agenciesRes, servicesRes] = await Promise.all([
          (supabase.from as any)("agencies")
            .select("id, name, slug, logo_url, email, phone, website, city, country")
            .eq("is_active", true),
          (supabase.from as any)("marketplace_services")
            .select("agency_id")
            .eq("status", "approved"),
        ]);
        if (agenciesRes.error || !agenciesRes.data) return [];

        const approvedCount = new Map<string, number>();
        for (const s of servicesRes.data ?? []) {
          approvedCount.set(s.agency_id, (approvedCount.get(s.agency_id) ?? 0) + 1);
        }

        return (agenciesRes.data as any[]).map((a): PartnerAgency => {
          const code = toCountryCode(a.country || "");
          return {
            key: `db-${a.id}`,
            name: a.name,
            city: a.city || "",
            country: STATIC_COUNTRIES[code]?.name || a.country || "",
            countryCode: code,
            email: a.email || null,
            phone: a.phone || null,
            website: a.website || null,
            logoUrl: a.logo_url || null,
            slug: a.slug || null,
            bookable: !!a.slug && (approvedCount.get(a.id) ?? 0) > 0,
          };
        });
      } catch {
        // RLS / network failure → static list still renders
        return [];
      }
    },
  });
}

// ─── Agency row ──────────────────────────────────────────────────
function AgencyRow({ agency }: { agency: PartnerAgency }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [expanded, setExpanded] = useState(false);

  const onTap = () => {
    haptics.light();
    if (agency.bookable && agency.slug) {
      navigate(`/marketplace/agency/${agency.slug}`);
    } else {
      setExpanded((v) => !v);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={onTap} className="w-full flex items-center gap-3 px-3 py-2.5 text-start">
        {/* Logo circle / initials */}
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
          {agency.logoUrl ? (
            <img
              src={agency.logoUrl}
              alt={agency.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="text-[11px] font-bold text-primary">{initials(agency.name)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{agency.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {flagEmoji(agency.countryCode)} {agency.city}
          </p>
        </div>

        {agency.bookable ? (
          <span className="shrink-0 flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
              {t("marketplace.partnerAgencies.bookable", "Buchbar")}
            </span>
            <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" />
          </span>
        ) : (
          <ChevronDown
            size={14}
            className={cn("shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        )}
      </button>

      {/* Inline contact actions (AgencyCityPanel look) */}
      <AnimatePresence initial={false}>
        {expanded && !agency.bookable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 pt-0.5">
              {agency.phone && (
                <a
                  href={`tel:${agency.phone}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-violet-500/15 hover:text-violet-300 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {t("marketplace.partnerAgencies.call", "Anrufen")}
                </a>
              )}
              {agency.email && (
                <a
                  href={`mailto:${agency.email}?subject=${encodeURIComponent(`Anfrage - ${agency.name}`)}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  {t("marketplace.partnerAgencies.email", "E-Mail")}
                </a>
              )}
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  {t("marketplace.partnerAgencies.website", "Website")}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Filter chips (same look as the marketplace category pills) ──
const CHIP_BASE = "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all";
const CHIP_ACTIVE = "bg-primary/20 text-primary border border-primary/40";
const CHIP_INACTIVE = "bg-foreground/[0.06] text-muted-foreground border border-transparent";

// ─── Section ─────────────────────────────────────────────────────
export function PartnerAgenciesSection({ cityFilter }: { cityFilter?: string }) {
  const { t, i18n } = useTranslation();
  const haptics = useHaptics();
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const { data: dbAgencies } = usePartnerDbAgencies();

  // Localized country names via Intl.DisplayNames; falls back to English,
  // then to the raw data value (old WebViews without DisplayNames support).
  const countryName = useMemo(() => {
    let primary: Intl.DisplayNames | null = null;
    let english: Intl.DisplayNames | null = null;
    try {
      primary = new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      primary = null;
    }
    try {
      english = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      english = null;
    }
    return (code: string, fallback: string): string => {
      if (!/^[A-Z]{2}$/.test(code)) return fallback;
      try {
        const name = primary?.of(code);
        if (name && name !== code) return name;
      } catch { /* unsupported code */ }
      try {
        const name = english?.of(code);
        if (name && name !== code) return name;
      } catch { /* unsupported code */ }
      return fallback;
    };
  }, [i18n.language]);

  const agencies = useMemo<PartnerAgency[]>(() => {
    const db = dbAgencies ?? [];
    const dbNames = new Set(db.map((a) => a.name.toLowerCase()));
    const statics: PartnerAgency[] = STATIC_AGENCIES
      .filter((a) => !dbNames.has(a.name.toLowerCase()))
      .map((a) => ({
        key: `static-${a.id}`,
        name: a.name,
        city: a.city,
        country: a.country,
        countryCode: a.countryCode,
        email: a.email || null,
        phone: a.phone || null,
        website: a.website || null,
        logoUrl: null,
        slug: null,
        bookable: false,
      }));

    let all = [...db, ...statics];
    const city = cityFilter?.trim().toLowerCase();
    if (city) {
      all = all.filter((a) => a.city.toLowerCase().includes(city));
    }
    return all;
  }, [dbAgencies, cityFilter]);

  // Country chips: every country present, sorted by agency count desc
  const countryChips = useMemo(() => {
    const counts = new Map<string, { code: string; fallback: string; count: number }>();
    for (const a of agencies) {
      const existing = counts.get(a.countryCode);
      if (existing) existing.count++;
      else counts.set(a.countryCode, { code: a.countryCode, fallback: a.country, count: 1 });
    }
    return [...counts.values()]
      .map((c) => ({ code: c.code, count: c.count, label: countryName(c.code, c.fallback) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [agencies, countryName]);

  // City chips: cities of the selected country only, alphabetical
  const cityChips = useMemo(() => {
    if (!selectedCountry) return [];
    const cities = new Set<string>();
    for (const a of agencies) {
      if (a.countryCode === selectedCountry && a.city) cities.add(a.city);
    }
    return [...cities].sort((a, b) => a.localeCompare(b));
  }, [agencies, selectedCountry]);

  const selectCountry = (code: string | null) => {
    haptics.select();
    setSelectedCountry(code);
    setSelectedCity(null); // country change resets the city selection
  };

  const selectCity = (city: string | null) => {
    haptics.select();
    setSelectedCity(city);
  };

  // Cascade filter (applied on top of the screen-wide cityFilter prefilter)
  const visibleAgencies = useMemo(() => {
    let list = agencies;
    if (selectedCountry) list = list.filter((a) => a.countryCode === selectedCountry);
    if (selectedCity) list = list.filter((a) => a.city === selectedCity);
    return list;
  }, [agencies, selectedCountry, selectedCity]);

  // Group by country, bookable agencies first within each group
  const groups = useMemo(() => {
    const byCountry = new Map<string, { code: string; name: string; agencies: PartnerAgency[] }>();
    for (const a of visibleAgencies) {
      const existing = byCountry.get(a.countryCode);
      if (existing) existing.agencies.push(a);
      else byCountry.set(a.countryCode, { code: a.countryCode, name: a.country, agencies: [a] });
    }
    const list = [...byCountry.values()];
    list.sort((a, b) => a.name.localeCompare(b.name));
    for (const g of list) {
      g.agencies.sort(
        (a, b) => (b.bookable ? 1 : 0) - (a.bookable ? 1 : 0) || a.name.localeCompare(b.name),
      );
    }
    return list;
  }, [visibleAgencies]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-5 mt-6"
    >
      {/* Collapsed header row */}
      <button
        onClick={() => { setOpen((v) => !v); haptics.light(); }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-foreground/[0.06] border border-border"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Building2 size={15} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground truncate">
            {t("marketplace.partnerAgencies.title", "Partner-Agenturen")}
          </span>
          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold tabular-nums">
            {agencies.length}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {/* Expandable list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Country → city filter cascade */}
            {countryChips.length > 0 && (
              <div
                role="group"
                aria-label={t("marketplace.partnerAgencies.country", "Land")}
                className="flex gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar"
              >
                <button
                  onClick={() => selectCountry(null)}
                  className={cn(CHIP_BASE, selectedCountry === null ? CHIP_ACTIVE : CHIP_INACTIVE)}
                >
                  {t("marketplace.partnerAgencies.allCountries", "Alle Länder")}
                </button>
                {countryChips.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => selectCountry(c.code)}
                    className={cn(CHIP_BASE, selectedCountry === c.code ? CHIP_ACTIVE : CHIP_INACTIVE)}
                  >
                    {flagEmoji(c.code)} {c.label}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence initial={false}>
              {selectedCountry && cityChips.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    role="group"
                    aria-label={t("marketplace.partnerAgencies.city", "Stadt")}
                    className="flex gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar"
                  >
                    <button
                      onClick={() => selectCity(null)}
                      className={cn(CHIP_BASE, selectedCity === null ? CHIP_ACTIVE : CHIP_INACTIVE)}
                    >
                      {t("marketplace.partnerAgencies.allCities", "Alle Städte")}
                    </button>
                    {cityChips.map((city) => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className={cn(CHIP_BASE, selectedCity === city ? CHIP_ACTIVE : CHIP_INACTIVE)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {groups.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                {t("marketplace.partnerAgencies.empty", "Keine Partner-Agenturen für diese Stadt")}
              </p>
            ) : (
              <div className="pb-1">
                {groups.map((group) => (
                  <div key={group.code}>
                    <div className="flex items-center gap-1.5 px-1 pt-3 pb-1.5">
                      <span className="text-sm leading-none">{flagEmoji(group.code)}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {countryName(group.code, group.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        ({group.agencies.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.agencies.map((agency) => (
                        <AgencyRow key={agency.key} agency={agency} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
