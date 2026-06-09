/**
 * ActivityIntl — multilingual activity landing page handling ES/FR/IT/PT/NL/PL/TR.
 * Routes:
 *   • /actividades/:slug   (Spanish)
 *   • /activites/:slug     (French)
 *   • /attivita/:slug      (Italian)
 *   • /atividades/:slug    (Portuguese)
 *   • /activiteiten/:slug  (Dutch)
 *   • /atrakcje/:slug      (Polish)
 *   • /aktiviteler/:slug   (Turkish)
 */
import { useMemo, useEffect } from "react";
import { Navigate, useParams, useLocation, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Wallet,
  Users,
  Clock,
  Cloud,
  Activity as ActivityIcon,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  PartyPopper,
  Sparkles,
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
  ACTIVITIES_LIBRARY,
  ACTIVITY_CATEGORIES,
  type ActivityItem,
} from "@/lib/activities-library";
import { getActivitySpec, getActivityBySlug } from "@/lib/activity-content";
import {
  ACTIVITY_LANG_META,
  CATEGORY_FRAMEWORKS_INTL,
  localizeSpecValue,
  type ActivityIntlLang,
} from "@/lib/activity-content-intl";
import { getActivityLabel, getCategoryLabel } from "@/lib/activity-labels-i18n";
import { JGA_CITIES } from "@/lib/jga-cities";

const SITE_URL = "https://event-bliss.com";

// Map activity language → matching city-page path prefix
const CITY_PATH_BY_LANG: Record<ActivityIntlLang, string> = {
  es: "/despedida/",
  fr: "/evg/",
  it: "/addio/",
  pt: "/despedida-de-solteiro/",
  nl: "/vrijgezellenfeest/",
  pl: "/wieczor-kawalerski/",
  tr: "/bekarliga-veda/",
  ar: "/wadaa-azubiya/",
};

// Map DE city slug → anglicised slug used by all non-DE city routes
const DE_TO_EN_SLUG: Record<string, string> = {
  muenchen: "munich",
  koeln: "cologne",
  duesseldorf: "dusseldorf",
  wien: "vienna",
  zuerich: "zurich",
  nuernberg: "nuremberg",
  krakau: "krakow",
  prag: "prague",
  lissabon: "lisbon",
  rom: "rome",
  mailand: "milan",
  florenz: "florence",
  warschau: "warsaw",
  athen: "athens",
  kopenhagen: "copenhagen",
  bukarest: "bucharest",
  bruessel: "brussels",
  nizza: "nice",
};

function citySlugForLang(deSlug: string): string {
  return DE_TO_EN_SLUG[deSlug] ?? deSlug;
}

function detectLang(pathname: string): ActivityIntlLang | null {
  if (pathname.startsWith("/actividades/")) return "es";
  if (pathname.startsWith("/activites/")) return "fr";
  if (pathname.startsWith("/attivita/")) return "it";
  if (pathname.startsWith("/atividades/")) return "pt";
  if (pathname.startsWith("/activiteiten/")) return "nl";
  if (pathname.startsWith("/atrakcje/")) return "pl";
  if (pathname.startsWith("/aktiviteler/")) return "tr";
  if (pathname.startsWith("/anshita/")) return "ar";
  return null;
}

function buildJsonLd(activity: ActivityItem, lang: ActivityIntlLang, url: string) {
  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS_INTL[lang][activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];
  const meta = ACTIVITY_LANG_META[lang];
  const label = getActivityLabel(activity.value, activity.label, lang);
  const catLabel = getCategoryLabel(activity.category, cat.label, lang);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.titleTpl(label),
      description: framework.introFor(activity),
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/ideen-${activity.value}.svg`,
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
      articleSection: catLabel,
      keywords: [
        label,
        meta.label,
        `${label} ${meta.label}`,
      ].join(", "),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-intro", ".speakable-facts"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${label} — ${meta.label}`,
      description: framework.introFor(activity),
      url,
      provider: { "@type": "Organization", name: "EventBliss", url: SITE_URL },
      areaServed: { "@type": "Place", name: "Europe" },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: spec.costFrom.toString(),
        highPrice: spec.costTo.toString(),
        priceCurrency: "EUR",
        offerCount: "176",
      },
      category: catLabel,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: framework.faqs(activity).map((faq) => ({
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
        { "@type": "ListItem", position: 3, name: label, item: url },
      ],
    },
  ];
}

export default function ActivityIntl() {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const prefersReducedMotion = useReducedMotion();

  const lang = detectLang(location.pathname);
  const meta = lang ? ACTIVITY_LANG_META[lang] : null;

  const activity = useMemo(
    () => (params.slug ? getActivityBySlug(params.slug) : undefined),
    [params.slug]
  );

  // hreflang injection — cross-link to all 9 language versions
  useEffect(() => {
    if (!activity || !lang) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    const slug = activity.value;
    const all: Array<{ l: string; href: string }> = [
      { l: "de", href: `${SITE_URL}/ideen/${slug}` },
      { l: "de-DE", href: `${SITE_URL}/ideen/${slug}` },
      { l: "en", href: `${SITE_URL}/activities/${slug}` },
      { l: "en-GB", href: `${SITE_URL}/activities/${slug}` },
      { l: "es", href: `${SITE_URL}/actividades/${slug}` },
      { l: "es-ES", href: `${SITE_URL}/actividades/${slug}` },
      { l: "fr", href: `${SITE_URL}/activites/${slug}` },
      { l: "fr-FR", href: `${SITE_URL}/activites/${slug}` },
      { l: "it", href: `${SITE_URL}/attivita/${slug}` },
      { l: "it-IT", href: `${SITE_URL}/attivita/${slug}` },
      { l: "pt", href: `${SITE_URL}/atividades/${slug}` },
      { l: "pt-PT", href: `${SITE_URL}/atividades/${slug}` },
      { l: "nl", href: `${SITE_URL}/activiteiten/${slug}` },
      { l: "nl-NL", href: `${SITE_URL}/activiteiten/${slug}` },
      { l: "pl", href: `${SITE_URL}/atrakcje/${slug}` },
      { l: "pl-PL", href: `${SITE_URL}/atrakcje/${slug}` },
      { l: "tr", href: `${SITE_URL}/aktiviteler/${slug}` },
      { l: "ar", href: `${SITE_URL}/anshita/${slug}` },
      { l: "tr-TR", href: `${SITE_URL}/aktiviteler/${slug}` },
      { l: "x-default", href: `${SITE_URL}/activities/${slug}` },
    ];

    for (const { l, href } of all) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", l);
      link.setAttribute("href", href);
      link.setAttribute("data-activity-intl-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    }

    return () => {
      links.forEach((x) => x.remove());
    };
  }, [activity, lang]);

  // Cross-links to other languages for visible switcher
  const langLinks = activity
    ? [
        { lang: "de", url: `/ideen/${activity.value}`, label: "Deutsch" },
        { lang: "en", url: `/activities/${activity.value}`, label: "English" },
        { lang: "es", url: `/actividades/${activity.value}`, label: "Español" },
        { lang: "fr", url: `/activites/${activity.value}`, label: "Français" },
        { lang: "it", url: `/attivita/${activity.value}`, label: "Italiano" },
        { lang: "pt", url: `/atividades/${activity.value}`, label: "Português" },
        { lang: "nl", url: `/activiteiten/${activity.value}`, label: "Nederlands" },
        { lang: "pl", url: `/atrakcje/${activity.value}`, label: "Polski" },
        { lang: "tr", url: `/aktiviteler/${activity.value}`, label: "Türkçe" },
      ].filter((l) => l.lang !== lang)
    : [];

  const topCities = useMemo(() => {
    if (!activity) return [];
    return JGA_CITIES.filter((c) => c.topActivitySlugs.includes(activity.value)).slice(0, 6);
  }, [activity]);

  const url = activity && meta ? `${SITE_URL}${meta.path}${activity.value}` : SITE_URL;

  useSEO(
    activity && lang && meta
      ? {
          title: meta.titleTpl(getActivityLabel(activity.value, activity.label, lang)),
          description: meta.descriptionTpl(getActivityLabel(activity.value, activity.label, lang)),
          canonical: url,
          ogImage: `${SITE_URL}/og/ideen-${activity.value}.svg`,
          ogType: "article",
          locale: meta.locale,
          htmlLang: meta.htmlLang,
          dir: lang === "ar" ? "rtl" : "ltr",
          keywords: `${getActivityLabel(activity.value, activity.label, lang)}, ${meta.label}`,
          jsonLd: buildJsonLd(activity, lang, url),
        }
      : {
          title: `${meta?.label ?? "Activity"} — EventBliss`,
          description: meta?.descriptionTpl("") ?? "",
        }
  );

  if (!activity || !lang || !meta) {
    return <Navigate to="/" replace />;
  }

  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS_INTL[lang][activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];
  const label = getActivityLabel(activity.value, activity.label, lang);
  const catLabel = getCategoryLabel(activity.category, cat.label, lang);

  // Same-category cross-links
  const sameCategoryActivities = ACTIVITIES_LIBRARY.filter(
    (a) => a.category === activity.category && a.value !== activity.value
  ).slice(0, 8);

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <AuroraBackground
          className="absolute inset-0 -z-0"
          intensity="normal"
          spotlight
          grain
        />
        <div className="container max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-8xl mb-6" aria-hidden>
              {activity.emoji}
            </div>

            <Badge className="mb-6 px-4 py-2 text-sm" variant="secondary">
              {cat.emoji} {catLabel}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              <AuroraText as="span">{label}</AuroraText>
              <span className="block text-2xl md:text-3xl mt-4 text-muted-foreground font-normal">
                {meta.activityFor}
              </span>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {framework.introFor(activity)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
                  {meta.ctaButton}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {langLinks.slice(0, 6).map((l) => (
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

      {/* FACTS */}
      <section className="py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              {meta.factsHeader(label)}
            </h2>
          </ScrollReveal>

          <div className="speakable-facts grid grid-cols-2 md:grid-cols-4 gap-4">
            <FactCard
              icon={<Wallet className="w-5 h-5" />}
              label={meta.factsLabels.cost}
              value={`€${spec.costFrom}–€${spec.costTo}`}
            />
            <FactCard
              icon={<Users className="w-5 h-5" />}
              label={meta.factsLabels.group}
              value={localizeSpecValue(spec.groupSize, lang)}
            />
            <FactCard
              icon={<Clock className="w-5 h-5" />}
              label={meta.factsLabels.duration}
              value={localizeSpecValue(spec.duration, lang)}
            />
            <FactCard
              icon={<Cloud className="w-5 h-5" />}
              label={meta.factsLabels.setting}
              value={meta.setting[spec.setting]}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground mt-6">
            {spec.weatherDependent ? meta.weatherDep : meta.weatherInd}
            {" · "}
            {meta.difficultyLabel}: {meta.difficulty[spec.difficulty]}
          </div>
        </div>
      </section>

      {/* WHEN + WHO */}
      <section className="py-12 bg-card/20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollReveal>
              <GlassCard padding="lg">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <ActivityIcon className="w-6 h-6 text-primary" />
                  {meta.whenHeader(label)}
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  {framework.whenSection.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlassCard padding="lg">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  {meta.whoHeader}
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  {framework.whoSection.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* COST FRAMEWORK */}
      <section className="py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <GlassCard padding="lg" variant="glow">
              <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                {meta.costHeader(label)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {framework.costExplain}
              </p>
              <div className="mt-6 pt-6 border-t border-border/40">
                <Link to="/jga/kalkulator">
                  <GradientButton variant="outline" size="md" icon={<Sparkles className="w-4 h-4" />}>
                    {meta.calcLink}
                  </GradientButton>
                </Link>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* CITIES */}
      {topCities.length > 0 && (
        <section className="py-12 bg-card/20">
          <div className="container max-w-5xl mx-auto px-4">
            <ScrollReveal>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  {meta.citiesHeader(label)}
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCities.map((c, i) => (
                <ScrollReveal key={c.slug} delay={i * 0.04}>
                  <Link to={`${CITY_PATH_BY_LANG[lang]}${citySlugForLang(c.slug)}`}>
                    <GlassCard variant="hover" padding="md">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.vibe}</p>
                      <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                        {meta.cityCtaLabel} <ArrowRight className="w-3 h-3" />
                      </div>
                    </GlassCard>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMMON MISTAKES */}
      <section className="py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-8 justify-center">
              <AlertTriangle className="w-8 h-8 text-warning" />
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                {meta.mistakesHeader(label)}
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {framework.commonMistakes.map((mistake, i) => (
              <ScrollReveal key={i} delay={i * 0.04}>
                <GlassCard variant="hover" padding="md">
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold text-sm">
                      !
                    </div>
                    <p className="text-foreground leading-relaxed pt-0.5">{mistake}</p>
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              {meta.faqHeader(label)}
            </h2>
          </ScrollReveal>

          <Accordion type="single" collapsible className="space-y-3">
            {framework.faqs(activity).map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
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
            {meta.ctaHeader(label)}
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

      {/* RELATED ACTIVITIES */}
      {sameCategoryActivities.length > 0 && (
        <section className="py-12">
          <div className="container max-w-5xl mx-auto px-4">
            <ScrollReveal>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
                {meta.relatedHeader(catLabel)}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sameCategoryActivities.map((a) => (
                <Link
                  key={a.value}
                  to={`${meta.path}${a.value}`}
                  className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{a.emoji}</div>
                  <div className="text-sm font-medium">{getActivityLabel(a.value, a.label, lang)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <LandingFooter />
    </div>
  );
}

function FactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-card/60 border border-border/40 p-4 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-2">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="font-semibold text-sm md:text-base">{value}</p>
    </div>
  );
}
