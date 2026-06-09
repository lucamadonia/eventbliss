/**
 * IntlCity — multilingual ES/FR/IT landing page for /despedida/:ciudad,
 * /evg/:ville, /addio/:citta. Detects language from URL pathname.
 *
 * Base data from JGA_CITIES (neighborhoods, budget, coords),
 * language-specific content from src/lib/intl-cities.ts.
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
  PartyPopper,
  Gamepad2,
  Users,
  Calendar,
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
  getIntlCity,
  getAllIntlSlugs,
  getJgaCityByEnSlug,
  LANG_META,
  type IntlLang,
  type IntlPageLang,
} from "@/lib/intl-cities";
import { getIntlAr } from "@/lib/intl-cities-ar";
import { jgaHreflangs, isRtl } from "@/lib/seo-routes";
import { getActivityLabel, getCategoryLabel } from "@/lib/activity-labels-i18n";
import type { ActivityIntlLang } from "@/lib/activity-content-intl";
import { ACTIVITIES_LIBRARY, ACTIVITY_CATEGORIES } from "@/lib/activities-library";

const SITE_URL = "https://event-bliss.com";

function detectLang(pathname: string): IntlPageLang {
  if (pathname.startsWith("/despedida-de-solteiro/")) return "pt";
  if (pathname.startsWith("/despedida/")) return "es";
  if (pathname.startsWith("/evg/")) return "fr";
  if (pathname.startsWith("/addio/")) return "it";
  if (pathname.startsWith("/vrijgezellenfeest/")) return "nl";
  if (pathname.startsWith("/wieczor-kawalerski/")) return "pl";
  if (pathname.startsWith("/bekarliga-veda/")) return "tr";
  if (pathname.startsWith("/wadaa-azubiya/")) return "ar";
  return "it";
}

function buildJsonLd(args: {
  city: ReturnType<typeof getJgaCityByEnSlug>;
  slug: string;
  lang: IntlPageLang;
  url: string;
  intro: string;
  faqs: Array<{ q: string; a: string }>;
}) {
  const { city, slug, lang, url, intro, faqs } = args;
  if (!city) return [];

  const meta = LANG_META[lang];
  const wikidataRef = city.wikidataId
    ? `https://www.wikidata.org/wiki/${city.wikidataId}`
    : undefined;

  const altLinks = (
    [
      { lang: "de", url: `${SITE_URL}/jga/${city.slug}` },
      { lang: "en", url: `${SITE_URL}/stag-do/${slug}` },
      { lang: "es", url: `${SITE_URL}/despedida/${slug}` },
      { lang: "fr", url: `${SITE_URL}/evg/${slug}` },
      { lang: "it", url: `${SITE_URL}/addio/${slug}` },
      { lang: "pt", url: `${SITE_URL}/despedida-de-solteiro/${slug}` },
      { lang: "nl", url: `${SITE_URL}/vrijgezellenfeest/${slug}` },
      { lang: "pl", url: `${SITE_URL}/wieczor-kawalerski/${slug}` },
      { lang: "tr", url: `${SITE_URL}/bekarliga-veda/${slug}` },
    ] as const
  ).filter((a) => a.lang !== lang);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.titleTpl(city.name),
      description: intro,
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/jga-${city.slug}.svg`,
      inLanguage: meta.htmlLang,
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
      workTranslation: altLinks.map((a) => ({
        "@type": "Article",
        url: a.url,
        inLanguage: a.lang,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: `${meta.label} ${city.name}`,
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
      touristType: [
        LANG_META[lang].label,
        "Bachelor Party",
        "Stag Do",
        "Group Travel",
      ],
      includesAttraction: city.neighborhoods.map((n) => ({
        "@type": "TouristAttraction",
        name: n.name,
        description: n.tagline,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EventBliss", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: meta.label, item: url },
        { "@type": "ListItem", position: 3, name: `${meta.label} ${city.name}`, item: url },
      ],
    },
  ];
}

export default function IntlCity() {
  const location = useLocation();
  const params = useParams<{
    ciudad?: string;
    ville?: string;
    citta?: string;
    cidade?: string;
    stad?: string;
    miasto?: string;
    sehir?: string;
    city?: string;
  }>();
  const prefersReducedMotion = useReducedMotion();

  const lang: IntlLang = detectLang(location.pathname);
  const meta = LANG_META[lang];
  const slug =
    params.ciudad ??
    params.ville ??
    params.citta ??
    params.cidade ??
    params.stad ??
    params.miasto ??
    params.sehir ??
    params.city;

  const entry = useMemo(() => (slug ? getIntlCity(slug) : undefined), [slug]);
  const city = useMemo(() => (slug ? getJgaCityByEnSlug(slug) : undefined), [slug]);

  const copy = useMemo(
    () =>
      entry
        ? lang === "ar"
          ? getIntlAr(entry.slug)
          : entry[lang as IntlLang]
        : undefined,
    [entry, lang]
  );

  const topActivities = useMemo(() => {
    if (!city) return [];
    return city.topActivitySlugs
      .map((s) => ACTIVITIES_LIBRARY.find((a) => a.value === s))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [city]);

  const otherCities = useMemo(() => {
    if (!entry) return [];
    return getAllIntlSlugs()
      .filter((s) => s !== entry.slug)
      .slice(0, 8);
  }, [entry]);

  // hreflang injection — derived from the central route map (only languages
  // that actually have a translated page for this city, incl. Arabic).
  useEffect(() => {
    if (!city) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    for (const { hreflang, href } of jgaHreflangs(city.slug, SITE_URL)) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", hreflang);
      link.setAttribute("href", href);
      link.setAttribute("data-intl-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    }
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [city]);

  const url = entry && city ? `${SITE_URL}${meta.path}${entry.slug}` : SITE_URL;

  useSEO(
    entry && city && copy
      ? {
          title: meta.titleTpl(city.name),
          description: meta.descriptionTpl(city.name),
          canonical: url,
          ogImage: `${SITE_URL}/og/jga-${city.slug}.svg`,
          ogType: "article",
          locale: meta.locale,
          htmlLang: meta.htmlLang,
          dir: isRtl(lang) ? "rtl" : "ltr",
          keywords: [
            `${meta.label} ${city.name}`,
            `${city.name} ${meta.label.toLowerCase()}`,
          ].join(", "),
          jsonLd: buildJsonLd({ city, slug: entry.slug, lang, url, intro: copy.intro, faqs: copy.faqs }),
        }
      : {
          title: `${meta.label} — EventBliss`,
          description: meta.descriptionTpl(""),
        }
  );

  if (!entry || !city || !copy) {
    return <Navigate to="/" replace />;
  }

  const langLinks: Array<{ lang: string; url: string; label: string }> = [
    { lang: "de", url: `/jga/${city.slug}`, label: "Deutsch" },
    { lang: "en", url: `/stag-do/${entry.slug}`, label: "English" },
    { lang: "es", url: `/despedida/${entry.slug}`, label: "Español" },
    { lang: "fr", url: `/evg/${entry.slug}`, label: "Français" },
    { lang: "it", url: `/addio/${entry.slug}`, label: "Italiano" },
    { lang: "pt", url: `/despedida-de-solteiro/${entry.slug}`, label: "Português" },
    { lang: "nl", url: `/vrijgezellenfeest/${entry.slug}`, label: "Nederlands" },
    { lang: "pl", url: `/wieczor-kawalerski/${entry.slug}`, label: "Polski" },
    { lang: "tr", url: `/bekarliga-veda/${entry.slug}`, label: "Türkçe" },
    { lang: "ar", url: `/wadaa-azubiya/${entry.slug}`, label: "العربية" },
  ].filter((l) => l.lang !== lang && (l.lang !== "ar" || Boolean(getIntlAr(entry.slug))));

  return (
    <div className="min-h-screen bg-background" dir={isRtl(lang) ? "rtl" : "ltr"}>
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
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              {city.region} · {meta.label}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              {meta.h1Prefix} <AuroraText as="span">{city.name}</AuroraText>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {copy.intro}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
                  {meta.plan}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
              <Link to="/games">
                <GradientButton size="lg" variant="outline" icon={<Gamepad2 className="w-5 h-5" />}>
                  {meta.games}
                </GradientButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 6+
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
              {langLinks.map((l) => (
                <Link
                  key={l.lang}
                  to={l.url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOP ACTIVITIES */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {meta.activitiesHeader(city.name)}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topActivities.map((activity, idx) => {
              const cat = ACTIVITY_CATEGORIES[activity.category];
              const actLang = lang as ActivityIntlLang;
              return (
                <ScrollReveal key={activity.value} delay={idx * 0.04}>
                  <GlassCard variant="hover" padding="md" className="h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl" aria-hidden>
                        {activity.emoji}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cat.emoji} {getCategoryLabel(activity.category, cat.label, actLang)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{getActivityLabel(activity.value, activity.label, actLang)}</h3>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              {meta.neighborhoodsHeader}
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
                <h3 className="text-2xl font-display font-bold mb-4">{meta.budgetHeader}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>{city.budget.weekend}</li>
                  <li>{city.budget.activity}</li>
                  <li>{city.budget.party}</li>
                </ul>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlassCard padding="lg" variant="glow">
                <Sun className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">{meta.seasonHeader}</h3>
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

      {/* INSIDER TIP */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <GlassCard padding="lg" variant="glow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">{meta.tipsHeader}</h3>
                  <p className="text-foreground leading-relaxed text-lg">{copy.tip}</p>
                </div>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              {meta.faqHeader}
            </h2>
          </ScrollReveal>

          <Accordion type="single" collapsible className="space-y-3">
            {copy.faqs.map((faq, idx) => (
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

      {/* CTA */}
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
            {meta.ctaHeader(city.name)}
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">{meta.ctaText}</p>
          <Link to="/create">
            <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
              {meta.ctaButton}
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
              {meta.otherCities}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherCities.map((slug) => {
              const otherCity = getJgaCityByEnSlug(slug);
              if (!otherCity) return null;
              return (
                <Link
                  key={slug}
                  to={`${meta.path}${slug}`}
                  className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center font-medium"
                >
                  <MapPin className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                  {otherCity.name}
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
