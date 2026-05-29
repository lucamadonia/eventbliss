/**
 * HenDoCity — 9-language Hen Do landing page.
 * Routes (one per language):
 *   • /jga-frauen/:stadt          DE
 *   • /hen-do/:city                EN
 *   • /despedida-soltera/:ciudad   ES
 *   • /evjf/:ville                 FR
 *   • /addio-nubilato/:citta       IT
 *   • /despedida-de-solteira/:cidade  PT
 *   • /vrijgezellinnenfeest/:stad  NL
 *   • /wieczor-panienski/:miasto   PL
 *   • /kadin-bekarliga-veda/:sehir TR
 *
 * Language is detected from URL pattern. Per-city vibe + tip from
 * hen-do-overlay (DE/EN) or hen-do-overlay-intl (other 7 languages).
 */
import { useMemo, useEffect } from "react";
import { Navigate, useParams, useLocation, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Wallet,
  Sun,
  Lightbulb,
  ArrowRight,
  Heart,
  Sparkles,
  Calendar,
  Users,
  ChevronRight,
  Globe,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { AuroraText } from "@/components/ui/AuroraText";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useSEO } from "@/hooks/useSEO";
import {
  getHenDoCity,
  getAllHenDoCities,
  deSlugFromEn,
  enSlugFromDe,
} from "@/lib/hen-do-overlay";
import { HEN_DO_INTL, HEN_DO_LANG_META, type HenDoIntlLang } from "@/lib/hen-do-overlay-intl";
import { ACTIVITIES_LIBRARY, ACTIVITY_CATEGORIES } from "@/lib/activities-library";

const SITE_URL = "https://event-bliss.com";

type Lang = "de" | "en" | HenDoIntlLang;

const HEN_PATH_BY_LANG: Record<Lang, string> = {
  de: "/jga-frauen/",
  en: "/hen-do/",
  es: HEN_DO_LANG_META.es.path,
  fr: HEN_DO_LANG_META.fr.path,
  it: HEN_DO_LANG_META.it.path,
  pt: HEN_DO_LANG_META.pt.path,
  nl: HEN_DO_LANG_META.nl.path,
  pl: HEN_DO_LANG_META.pl.path,
  tr: HEN_DO_LANG_META.tr.path,
};

const HTML_LANG_BY_LANG: Record<Lang, string> = {
  de: "de-DE",
  en: "en-GB",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
};

const LOCALE_BY_LANG: Record<Lang, string> = {
  de: "de_DE",
  en: "en_GB",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  pt: "pt_PT",
  nl: "nl_NL",
  pl: "pl_PL",
  tr: "tr_TR",
};

const LANG_NAME: Record<Lang, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  tr: "Türkçe",
};

const COPY = {
  de: {
    backLabel: "JGA",
    title: (n: string) => `JGA-Frauen ${n}`,
    titlePrefix: "JGA für Frauen",
    introHead: (n: string) => `Warum ein Junggesellinnenabschied in ${n}?`,
    activitiesHead: "Top-Aktivitäten",
    neighborhoodsHead: "Wo geht ihr aus",
    budgetHead: "Budget",
    seasonHead: "Beste Reisezeit",
    tipsHead: "Insider-Tipps",
    faqHead: "Häufige Fragen",
    ctaHead: (n: string) => `Bereit für euren JGA in ${n}?`,
    ctaText: "In 30 Sekunden Event erstellen, Crew einladen, Aktivitäten abstimmen — alles in einer App.",
    ctaButton: "Event jetzt erstellen",
    plan: "JGA planen",
    games: "Party-Spiele anschauen",
    otherCities: "JGA in einer anderen Stadt?",
    langSwitch: "Read in English",
    badgeLabel: (region: string) => `${region} · Junggesellinnenabschied`,
  },
  en: {
    backLabel: "Hen Do",
    title: (n: string) => `Hen Do ${n}`,
    titlePrefix: "Hen Do",
    introHead: (n: string) => `Why a hen do in ${n}?`,
    activitiesHead: "Top activities",
    neighborhoodsHead: "Where to go out",
    budgetHead: "Budget",
    seasonHead: "Best time to go",
    tipsHead: "Insider tips",
    faqHead: "Frequently asked",
    ctaHead: (n: string) => `Ready for your hen do in ${n}?`,
    ctaText: "Create an event in 30 seconds, invite your crew, vote on activities — all in one app.",
    ctaButton: "Create event now",
    plan: "Plan your hen",
    games: "Browse party games",
    otherCities: "Hen do in another city?",
    langSwitch: "Auf Deutsch lesen",
    badgeLabel: (region: string) => `${region} · Hen Party`,
  },
  // 7 additional languages — derived from HEN_DO_LANG_META
  es: {
    backLabel: HEN_DO_LANG_META.es.label,
    title: (n: string) => `${HEN_DO_LANG_META.es.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.es.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.es.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.es.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.es.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.es.budgetHead,
    seasonHead: HEN_DO_LANG_META.es.seasonHead,
    tipsHead: HEN_DO_LANG_META.es.tipsHead,
    faqHead: HEN_DO_LANG_META.es.faqHead,
    ctaHead: HEN_DO_LANG_META.es.ctaHead,
    ctaText: HEN_DO_LANG_META.es.ctaText,
    ctaButton: HEN_DO_LANG_META.es.ctaButton,
    plan: HEN_DO_LANG_META.es.plan,
    games: HEN_DO_LANG_META.es.games,
    otherCities: HEN_DO_LANG_META.es.otherCities,
    langSwitch: HEN_DO_LANG_META.es.langSwitch,
    badgeLabel: HEN_DO_LANG_META.es.badgeLabel,
  },
  fr: {
    backLabel: HEN_DO_LANG_META.fr.label,
    title: (n: string) => `${HEN_DO_LANG_META.fr.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.fr.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.fr.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.fr.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.fr.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.fr.budgetHead,
    seasonHead: HEN_DO_LANG_META.fr.seasonHead,
    tipsHead: HEN_DO_LANG_META.fr.tipsHead,
    faqHead: HEN_DO_LANG_META.fr.faqHead,
    ctaHead: HEN_DO_LANG_META.fr.ctaHead,
    ctaText: HEN_DO_LANG_META.fr.ctaText,
    ctaButton: HEN_DO_LANG_META.fr.ctaButton,
    plan: HEN_DO_LANG_META.fr.plan,
    games: HEN_DO_LANG_META.fr.games,
    otherCities: HEN_DO_LANG_META.fr.otherCities,
    langSwitch: HEN_DO_LANG_META.fr.langSwitch,
    badgeLabel: HEN_DO_LANG_META.fr.badgeLabel,
  },
  it: {
    backLabel: HEN_DO_LANG_META.it.label,
    title: (n: string) => `${HEN_DO_LANG_META.it.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.it.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.it.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.it.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.it.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.it.budgetHead,
    seasonHead: HEN_DO_LANG_META.it.seasonHead,
    tipsHead: HEN_DO_LANG_META.it.tipsHead,
    faqHead: HEN_DO_LANG_META.it.faqHead,
    ctaHead: HEN_DO_LANG_META.it.ctaHead,
    ctaText: HEN_DO_LANG_META.it.ctaText,
    ctaButton: HEN_DO_LANG_META.it.ctaButton,
    plan: HEN_DO_LANG_META.it.plan,
    games: HEN_DO_LANG_META.it.games,
    otherCities: HEN_DO_LANG_META.it.otherCities,
    langSwitch: HEN_DO_LANG_META.it.langSwitch,
    badgeLabel: HEN_DO_LANG_META.it.badgeLabel,
  },
  pt: {
    backLabel: HEN_DO_LANG_META.pt.label,
    title: (n: string) => `${HEN_DO_LANG_META.pt.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.pt.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.pt.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.pt.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.pt.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.pt.budgetHead,
    seasonHead: HEN_DO_LANG_META.pt.seasonHead,
    tipsHead: HEN_DO_LANG_META.pt.tipsHead,
    faqHead: HEN_DO_LANG_META.pt.faqHead,
    ctaHead: HEN_DO_LANG_META.pt.ctaHead,
    ctaText: HEN_DO_LANG_META.pt.ctaText,
    ctaButton: HEN_DO_LANG_META.pt.ctaButton,
    plan: HEN_DO_LANG_META.pt.plan,
    games: HEN_DO_LANG_META.pt.games,
    otherCities: HEN_DO_LANG_META.pt.otherCities,
    langSwitch: HEN_DO_LANG_META.pt.langSwitch,
    badgeLabel: HEN_DO_LANG_META.pt.badgeLabel,
  },
  nl: {
    backLabel: HEN_DO_LANG_META.nl.label,
    title: (n: string) => `${HEN_DO_LANG_META.nl.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.nl.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.nl.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.nl.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.nl.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.nl.budgetHead,
    seasonHead: HEN_DO_LANG_META.nl.seasonHead,
    tipsHead: HEN_DO_LANG_META.nl.tipsHead,
    faqHead: HEN_DO_LANG_META.nl.faqHead,
    ctaHead: HEN_DO_LANG_META.nl.ctaHead,
    ctaText: HEN_DO_LANG_META.nl.ctaText,
    ctaButton: HEN_DO_LANG_META.nl.ctaButton,
    plan: HEN_DO_LANG_META.nl.plan,
    games: HEN_DO_LANG_META.nl.games,
    otherCities: HEN_DO_LANG_META.nl.otherCities,
    langSwitch: HEN_DO_LANG_META.nl.langSwitch,
    badgeLabel: HEN_DO_LANG_META.nl.badgeLabel,
  },
  pl: {
    backLabel: HEN_DO_LANG_META.pl.label,
    title: (n: string) => `${HEN_DO_LANG_META.pl.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.pl.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.pl.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.pl.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.pl.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.pl.budgetHead,
    seasonHead: HEN_DO_LANG_META.pl.seasonHead,
    tipsHead: HEN_DO_LANG_META.pl.tipsHead,
    faqHead: HEN_DO_LANG_META.pl.faqHead,
    ctaHead: HEN_DO_LANG_META.pl.ctaHead,
    ctaText: HEN_DO_LANG_META.pl.ctaText,
    ctaButton: HEN_DO_LANG_META.pl.ctaButton,
    plan: HEN_DO_LANG_META.pl.plan,
    games: HEN_DO_LANG_META.pl.games,
    otherCities: HEN_DO_LANG_META.pl.otherCities,
    langSwitch: HEN_DO_LANG_META.pl.langSwitch,
    badgeLabel: HEN_DO_LANG_META.pl.badgeLabel,
  },
  tr: {
    backLabel: HEN_DO_LANG_META.tr.label,
    title: (n: string) => `${HEN_DO_LANG_META.tr.label} ${n}`,
    titlePrefix: HEN_DO_LANG_META.tr.h1Prefix,
    introHead: (n: string) => `${HEN_DO_LANG_META.tr.h1Prefix} ${n}`,
    activitiesHead: HEN_DO_LANG_META.tr.activitiesHead,
    neighborhoodsHead: HEN_DO_LANG_META.tr.neighborhoodsHead,
    budgetHead: HEN_DO_LANG_META.tr.budgetHead,
    seasonHead: HEN_DO_LANG_META.tr.seasonHead,
    tipsHead: HEN_DO_LANG_META.tr.tipsHead,
    faqHead: HEN_DO_LANG_META.tr.faqHead,
    ctaHead: HEN_DO_LANG_META.tr.ctaHead,
    ctaText: HEN_DO_LANG_META.tr.ctaText,
    ctaButton: HEN_DO_LANG_META.tr.ctaButton,
    plan: HEN_DO_LANG_META.tr.plan,
    games: HEN_DO_LANG_META.tr.games,
    otherCities: HEN_DO_LANG_META.tr.otherCities,
    langSwitch: HEN_DO_LANG_META.tr.langSwitch,
    badgeLabel: HEN_DO_LANG_META.tr.badgeLabel,
  },
} as const;

function buildJsonLd(
  data: ReturnType<typeof getHenDoCity>,
  lang: Lang,
  url: string,
  altUrl: string,
) {
  if (!data) return [];
  const { city } = data;
  const wikidataRef = city.wikidataId
    ? `https://www.wikidata.org/wiki/${city.wikidataId}`
    : undefined;
  const inLang = HTML_LANG_BY_LANG[lang];
  // For intl langs use their introTpl, for de/en keep the originals
  const intro = lang === "de"
    ? `Junggesellinnenabschied ${city.nameLocative}: Spa, Cocktail-Workshops, Brunch und Bootstouren — die schönsten Hen-Do-Programme in ${city.name}.`
    : lang === "en"
      ? `Hen do in ${city.name}: spa, cocktail workshops, brunch and boat tours — the loveliest hen-party programmes in ${city.name}.`
      : HEN_DO_LANG_META[lang as HenDoIntlLang].introTpl(city.name, city.nameLocative);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: lang === "de"
        ? `Junggesellinnenabschied ${city.name} — Ideen & Programm`
        : `Hen Do in ${city.name} — Activities & Programme`,
      description: intro,
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/jga-${city.slug}.svg`,
      inLanguage: inLang,
      isAccessibleForFree: true,
      datePublished: "2026-05-18",
      dateModified: "2026-05-18",
      author: { "@type": "Organization", name: "EventBliss", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "MYFAMBLISS GROUP LTD",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
      },
      about: {
        "@type": "Place",
        name: city.name,
        ...(wikidataRef ? { sameAs: wikidataRef } : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: city.name,
          addressRegion: city.region,
          addressCountry: city.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: city.coordinates.lat,
          longitude: city.coordinates.lng,
        },
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-intro"],
      },
      translationOfWork: {
        "@type": "Article",
        url: altUrl,
        inLanguage: lang === "de" ? "en-GB" : "de-DE",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: `${COPY[lang].titlePrefix} ${city.name}`,
      description: intro,
      url,
      ...(wikidataRef ? { sameAs: wikidataRef } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.region,
        addressCountry: city.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
      },
      touristType: ["Hen Do", "Hen Party", "Bachelorette Party", "Group Travel", COPY[lang].backLabel],
      includesAttraction: city.neighborhoods.map((n) => ({
        "@type": "TouristAttraction",
        name: n.name,
        description: n.tagline,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EventBliss", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: COPY[lang].backLabel,
          item: url,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${COPY[lang].titlePrefix} ${city.name}`,
          item: url,
        },
      ],
    },
  ];
}

function detectLang(pathname: string): Lang {
  if (pathname.startsWith("/hen-do/")) return "en";
  if (pathname.startsWith("/despedida-soltera/")) return "es";
  if (pathname.startsWith("/evjf/")) return "fr";
  if (pathname.startsWith("/addio-nubilato/")) return "it";
  if (pathname.startsWith("/despedida-de-solteira/")) return "pt";
  if (pathname.startsWith("/vrijgezellinnenfeest/")) return "nl";
  if (pathname.startsWith("/wieczor-panienski/")) return "pl";
  if (pathname.startsWith("/kadin-bekarliga-veda/")) return "tr";
  return "de";
}

export default function HenDoCity() {
  const params = useParams<{
    stadt?: string;
    city?: string;
    ciudad?: string;
    ville?: string;
    citta?: string;
    cidade?: string;
    stad?: string;
    miasto?: string;
    sehir?: string;
  }>();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const lang: Lang = detectLang(location.pathname);
  const t = COPY[lang];

  // All non-DE languages use the anglicised slug; only DE uses the German slug.
  const rawSlug =
    params.stadt ?? params.city ?? params.ciudad ?? params.ville ?? params.citta ?? params.cidade ?? params.stad ?? params.miasto ?? params.sehir;
  const deSlug = useMemo(() => {
    if (!rawSlug) return undefined;
    return lang === "de" ? rawSlug.toLowerCase() : deSlugFromEn(rawSlug);
  }, [rawSlug, lang]);

  const data = useMemo(() => (deSlug ? getHenDoCity(deSlug) : undefined), [deSlug]);

  const topActivities = useMemo(() => {
    if (!data) return [];
    return data.overlay.topActivitySlugs
      .map((slug) => ACTIVITIES_LIBRARY.find((a) => a.value === slug))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [data]);

  const otherCities = useMemo(() => {
    if (!data) return [];
    return getAllHenDoCities()
      .filter((c) => c.city.slug !== data.city.slug)
      .slice(0, 8);
  }, [data]);

  // hreflang injection — all 9 languages
  useEffect(() => {
    if (!data) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    const enSlug = enSlugFromDe(data.city.slug);

    const add = (l: string, href: string) => {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", l);
      link.setAttribute("href", href);
      link.setAttribute("data-hen-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    };

    const allLangs: Lang[] = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr"];
    for (const l of allLangs) {
      const slug = l === "de" ? data.city.slug : enSlug;
      add(HTML_LANG_BY_LANG[l], `${SITE_URL}${HEN_PATH_BY_LANG[l]}${slug}`);
    }
    add("x-default", `${SITE_URL}/hen-do/${enSlug}`);

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [data]);

  const enSlug = data ? enSlugFromDe(data.city.slug) : "";
  const localSlug = lang === "de" ? data?.city.slug ?? "" : enSlug;
  const canonical = data ? `${SITE_URL}${HEN_PATH_BY_LANG[lang]}${localSlug}` : SITE_URL;
  // For altUrl, just point to EN by default (used in JSON-LD translationOfWork)
  const altUrl = data
    ? lang === "en"
      ? `${SITE_URL}/jga-frauen/${data.city.slug}`
      : `${SITE_URL}/hen-do/${enSlug}`
    : SITE_URL;

  // Resolve language-specific vibe + tip
  const localizedVibeTip = useMemo(() => {
    if (!data) return { vibe: "", tip: "" };
    if (lang === "de") return { vibe: data.overlay.vibeDe, tip: data.overlay.henTipDe };
    if (lang === "en") return { vibe: data.overlay.vibeEn, tip: data.overlay.henTipEn };
    const intl = HEN_DO_INTL[data.city.slug]?.[lang as HenDoIntlLang];
    return intl ?? { vibe: data.overlay.vibeEn, tip: data.overlay.henTipEn };
  }, [data, lang]);

  // Build language-aware title/description
  const seoTitle = data
    ? lang === "de"
      ? `Junggesellinnenabschied ${data.city.name} — Ideen & Spa-Programm | EventBliss`
      : lang === "en"
        ? `Hen Do in ${data.city.name} — Ideas, Spa & Cocktails | EventBliss`
        : HEN_DO_LANG_META[lang as HenDoIntlLang].titleTpl(data.city.name)
    : "";
  const seoDescription = data
    ? lang === "de"
      ? `JGA Frauen ${data.city.nameLocative}: Spa, Cocktail-Workshop, Brunch, Bootstour. ${localizedVibeTip.vibe}. Plant in Minuten mit EventBliss.`
      : lang === "en"
        ? `Hen do in ${data.city.name}: spa, cocktail workshop, brunch, boat tour. ${localizedVibeTip.vibe}. Plan in minutes with EventBliss.`
        : HEN_DO_LANG_META[lang as HenDoIntlLang].descriptionTpl(data.city.name)
    : "";

  useSEO(
    data
      ? {
          title: seoTitle,
          description: seoDescription,
          canonical,
          ogImage: `${SITE_URL}/og/jga-${data.city.slug}.svg`,
          ogType: "article",
          locale: LOCALE_BY_LANG[lang],
          keywords: `${COPY[lang].titlePrefix} ${data.city.name}, ${COPY[lang].backLabel} ${data.city.name}, bachelorette ${data.city.name}`,
          jsonLd: buildJsonLd(data, lang, canonical, altUrl),
        }
      : {
          title: lang === "de" ? "JGA-Stadt nicht gefunden | EventBliss" : "Hen do city not found | EventBliss",
          description: lang === "de"
            ? "Diese JGA-Frauen-Stadt-Seite existiert nicht."
            : "This hen do city page does not exist.",
        }
  );

  if (!data) {
    return <Navigate to="/" replace />;
  }

  const { city } = data;
  const vibe = localizedVibeTip.vibe;
  const henTip = localizedVibeTip.tip;
  const intro = lang === "de"
    ? `Junggesellinnenabschied ${city.nameLocative} — der ehrliche Hen-Do-Guide für die Mädels-Crew. Spa-Vormittag, Cocktail-Workshop am Nachmittag, Bar-Tour am Abend. Mit den besten Spots ${city.nameLocative} ohne Touri-Filter.`
    : lang === "en"
      ? `Hen do in ${city.name} — the honest hen-party guide for the girls. Spa morning, cocktail workshop afternoon, bar tour at night. With the best spots in ${city.name} no tourist filter.`
      : HEN_DO_LANG_META[lang as HenDoIntlLang].introTpl(city.name, city.nameLocative);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <AuroraBackground
          className="absolute inset-0 -z-0"
          intensity="normal"
          spotlight
          grain
        />
        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge className="mb-6 px-4 py-2 text-sm" variant="secondary">
              <Heart className="w-3.5 h-3.5 mr-1.5" />
              {t.badgeLabel(city.region)}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              {t.titlePrefix} <AuroraText as="span">{city.name}</AuroraText>
              <span className="block text-2xl md:text-3xl mt-4 text-muted-foreground font-normal">
                {vibe}
              </span>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {intro}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<Sparkles className="w-5 h-5" />}>
                  {t.plan}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
              <Link to="/games">
                <GradientButton size="lg" variant="outline" icon={<Heart className="w-5 h-5" />}>
                  {t.games}
                </GradientButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {lang === "de" ? "Ab 4 Personen" : "Best for 4+"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> {city.budget.weekend}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {city.bestSeasons[0]}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {(["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr"] as Lang[])
                .filter((l) => l !== lang)
                .map((l) => {
                  const slug = l === "de" ? data.city.slug : enSlug;
                  return (
                    <Link
                      key={l}
                      to={`${HEN_PATH_BY_LANG[l]}${slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {LANG_NAME[l]}
                    </Link>
                  );
                })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOP ACTIVITIES — hen-focused */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {t.activitiesHead} <AuroraText>{city.name}</AuroraText>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {lang === "de"
                  ? `Die ${topActivities.length} Hen-Do-Aktivitäten, die ${city.nameLocative} am besten funktionieren — Spa, Workshop, Wein, Cocktails.`
                  : `The ${topActivities.length} hen-do activities that work best in ${city.name} — spa, workshop, wine, cocktails.`}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topActivities.map((activity, idx) => {
              const cat = ACTIVITY_CATEGORIES[activity.category];
              return (
                <ScrollReveal key={activity.value} delay={idx * 0.04}>
                  <GlassCard variant="hover" padding="md" className="h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl" aria-hidden>
                        {activity.emoji}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cat.emoji} {cat.label}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{activity.label}</h3>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS (reused from base city) */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              {t.neighborhoodsHead}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {city.neighborhoods.map((n, idx) => (
              <ScrollReveal key={n.name} delay={idx * 0.05}>
                <GlassCard variant="hover" padding="md">
                  <h3 className="font-display font-semibold text-xl mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {n.name}
                  </h3>
                  <p className="text-muted-foreground">{n.tagline}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUDGET + SEASON */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal>
              <GlassCard padding="lg" variant="glow">
                <Wallet className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">{t.budgetHead}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      {lang === "de" ? "Wochenende:" : "Weekend:"}
                    </strong>{" "}
                    {city.budget.weekend}
                  </li>
                  <li>
                    <strong className="text-foreground">
                      {lang === "de" ? "Aktivität:" : "Activity:"}
                    </strong>{" "}
                    {city.budget.activity}
                  </li>
                  <li>
                    <strong className="text-foreground">
                      {lang === "de" ? "Abend:" : "Evening:"}
                    </strong>{" "}
                    {city.budget.party}
                  </li>
                </ul>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlassCard padding="lg" variant="glow">
                <Sun className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">{t.seasonHead}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  {city.bestSeasons.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* HEN-SPECIFIC TIP */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <GlassCard padding="lg" variant="glow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">
                    {lang === "de" ? "Hen-Insider-Tipp" : "Hen insider tip"}
                  </h3>
                  <p className="text-foreground leading-relaxed text-lg">{henTip}</p>
                </div>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* GENERAL CITY TIPS */}
      <section className="py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
              {t.tipsHead} {city.nameLocative}
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {city.insiderTips.slice(0, 3).map((tip, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.04}>
                <GlassCard variant="hover" padding="md">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-foreground leading-relaxed pt-1.5">{tip}</p>
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (from base city) */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              {t.faqHead}
            </h2>
          </ScrollReveal>

          <Accordion type="single" collapsible className="space-y-3">
            {city.faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-border/50 rounded-xl px-5 bg-card/40"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 relative overflow-hidden">
        <AuroraBackground className="absolute inset-0 -z-0" intensity="intense" grain />
        <div className="container max-w-3xl mx-auto px-4 relative z-10 text-center">
          <motion.h2
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            {t.ctaHead(city.name)}
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">{t.ctaText}</p>
          <Link to="/create">
            <GradientButton size="lg" icon={<Sparkles className="w-5 h-5" />}>
              {t.ctaButton}
              <ArrowRight className="w-5 h-5 ml-1" />
            </GradientButton>
          </Link>
        </div>
      </section>

      {/* OTHER CITIES */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              {t.otherCities}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherCities.map((other) => {
              const otherSlug = lang === "de" ? other.city.slug : enSlugFromDe(other.city.slug);
              const url = `${HEN_PATH_BY_LANG[lang]}${otherSlug}`;
              return (
                <Link
                  key={other.city.slug}
                  to={url}
                  className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center font-medium"
                >
                  <Heart className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                  {other.city.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
