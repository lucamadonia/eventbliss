/**
 * StagDoCity — English-language SEO/GEO landing page at /stag-do/[city].
 *
 * Targets UK / Ireland / US / AU and English-speaking expat audiences. Each
 * page cross-links to its German counterpart via hreflang and a visible
 * language switch. Content from src/lib/stag-do-cities.ts.
 */
import { useMemo, useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Wallet,
  Sun,
  Lightbulb,
  ArrowRight,
  Gamepad2,
  PartyPopper,
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
import { STAG_DO_CITIES, getStagDoCityBySlug, type StagDoCity } from "@/lib/stag-do-cities";
import { ACTIVITIES_LIBRARY, ACTIVITY_CATEGORIES } from "@/lib/activities-library";
import { getActivityLabel, getCategoryLabel } from "@/lib/activity-labels-i18n";

const SITE_URL = "https://event-bliss.com";

function buildJsonLd(city: StagDoCity) {
  const url = `${SITE_URL}/stag-do/${city.slug}`;
  const jgaUrl = `${SITE_URL}/jga/${city.jgaCity.slug}`;
  const wikidataRef = city.jgaCity.wikidataId
    ? `https://www.wikidata.org/wiki/${city.jgaCity.wikidataId}`
    : undefined;

  return [
    // Article in English
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Stag Do in ${city.name} — Activities, Bars, Budget`,
      description: city.intro,
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/stag-do-${city.slug}.svg`,
      inLanguage: "en-GB",
      isAccessibleForFree: true,
      datePublished: "2026-05-17",
      dateModified: "2026-05-17",
      author: {
        "@type": "Organization",
        name: "EventBliss",
        url: SITE_URL,
      },
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
          addressCountry: city.jgaCity.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: city.jgaCity.coordinates.lat,
          longitude: city.jgaCity.coordinates.lng,
        },
      },
      keywords: [
        `stag do ${city.name}`,
        `${city.name} stag party`,
        `${city.name} stag weekend`,
        `bachelor party ${city.name}`,
        `${city.name} stag activities`,
      ].join(", "),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-intro"],
      },
      // Cross-language version
      translationOfWork: {
        "@type": "Article",
        url: jgaUrl,
        inLanguage: "de-DE",
      },
    },
    // TouristDestination
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: `Stag Do ${city.name}`,
      description: city.intro,
      url,
      image: `${SITE_URL}/og/stag-do-${city.slug}.svg`,
      ...(wikidataRef ? { sameAs: wikidataRef } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.region,
        addressCountry: city.jgaCity.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.jgaCity.coordinates.lat,
        longitude: city.jgaCity.coordinates.lng,
      },
      touristType: ["Stag Do", "Stag Party", "Hen Do", "Bachelor Party", "Group Travel"],
      includesAttraction: city.neighborhoods.map((n) => ({
        "@type": "TouristAttraction",
        name: n.name,
        description: n.tagline,
      })),
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: city.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EventBliss", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Stag Do Guides", item: `${SITE_URL}/stag-do/${city.slug}` },
        { "@type": "ListItem", position: 3, name: `Stag Do ${city.name}`, item: url },
      ],
    },
  ];
}

export default function StagDoCity() {
  const { city: citySlug } = useParams<{ city: string }>();
  const prefersReducedMotion = useReducedMotion();

  const city = useMemo(() => (citySlug ? getStagDoCityBySlug(citySlug) : undefined), [citySlug]);

  const topActivities = useMemo(() => {
    if (!city) return [];
    return city.topActivitySlugs
      .map((slug) => ACTIVITIES_LIBRARY.find((a) => a.value === slug))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [city]);

  const otherCities = useMemo(
    () => (city ? STAG_DO_CITIES.filter((c) => c.slug !== city.slug) : []),
    [city]
  );

  // hreflang link injection — point search engines to the German counterpart
  useEffect(() => {
    if (!city) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];

    const addHreflang = (lang: string, href: string) => {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", lang);
      link.setAttribute("href", href);
      link.setAttribute("data-stagdo-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    };

    addHreflang("en", `${SITE_URL}/stag-do/${city.slug}`);
    addHreflang("en-GB", `${SITE_URL}/stag-do/${city.slug}`);
    addHreflang("en-US", `${SITE_URL}/stag-do/${city.slug}`);
    addHreflang("de", `${SITE_URL}/jga/${city.jgaCity.slug}`);
    addHreflang("de-DE", `${SITE_URL}/jga/${city.jgaCity.slug}`);
    addHreflang("x-default", `${SITE_URL}/stag-do/${city.slug}`);

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [city]);

  useSEO(
    city
      ? {
          title: `Stag Do in ${city.name} — Activities, Bars & Budget | EventBliss`,
          description: `Stag do in ${city.name}: ${topActivities.length}+ activities, best neighbourhoods, budget breakdown, insider tips. Plan your stag weekend in minutes with EventBliss.`,
          canonical: `${SITE_URL}/stag-do/${city.slug}`,
          ogImage: `${SITE_URL}/og/stag-do-${city.slug}.svg`,
          ogType: "article",
          locale: "en_GB",
          keywords: `stag do ${city.name}, ${city.name} stag party, ${city.name} stag weekend, bachelor party ${city.name}, ${city.name} stag activities, hen do ${city.name}`,
          jsonLd: buildJsonLd(city),
        }
      : {
          title: "Stag do city not found | EventBliss",
          description: "This stag do city page does not exist. Browse our top destinations.",
        }
  );

  if (!city) {
    return <Navigate to="/" replace />;
  }

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
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              {city.region} · {city.countryName}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Stag Do in <AuroraText as="span">{city.name}</AuroraText>
              <span className="block text-2xl md:text-3xl mt-4 text-muted-foreground font-normal">
                {city.vibe}
              </span>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {city.intro}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
                  Plan your stag in {city.name}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
              <Link to="/games">
                <GradientButton size="lg" variant="outline" icon={<Gamepad2 className="w-5 h-5" />}>
                  Browse 24+ party games
                </GradientButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Best for 6+ people
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> {city.budget.weekend}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {city.bestSeasons[0]}
              </span>
            </div>

            {/* Language switch to German JGA equivalent */}
            <div className="mt-6">
              <Link
                to={`/jga/${city.jgaCity.slug}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                Auf Deutsch: JGA {city.jgaCity.name}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTRO BODY */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">
              Why a stag do in {city.name}?
            </h2>
            <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
              {city.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* TOP ACTIVITIES */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Top activities for a stag do in{" "}
                <AuroraText>{city.name}</AuroraText>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These {topActivities.length} activities work in {city.name} for stag groups
                from 6 to 20 — mix them by weather, budget, and mood.
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
                        {cat.emoji} {getCategoryLabel(activity.category, cat.label, "en")}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{getActivityLabel(activity.value, activity.label, "en")}</h3>
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activity.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-center">
              Where to go out in {city.name}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Picking the right neighbourhood makes or breaks your stag night. Here are the
              {" "}
              {city.neighborhoods.length} essentials.
            </p>
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
      <section className="py-16 bg-card/20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal>
              <GlassCard padding="lg" variant="glow">
                <Wallet className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">
                  Stag do budget for {city.name}
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Weekend:</strong> {city.budget.weekend}
                  </li>
                  <li>
                    <strong className="text-foreground">Activity:</strong>{" "}
                    {city.budget.activity}
                  </li>
                  <li>
                    <strong className="text-foreground">Party night:</strong>{" "}
                    {city.budget.party}
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-6">
                  EventBliss splits all your stag-do costs automatically — no
                  "who-owes-who" arguments at the end.
                </p>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlassCard padding="lg" variant="glow">
                <Sun className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">When to go</h3>
                <ul className="space-y-3 text-muted-foreground">
                  {city.bestSeasons.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-6">
                  Plan 8–12 weeks ahead for high-season dates — accommodation and popular
                  activities sell out otherwise.
                </p>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* INSIDER TIPS */}
      <section className="py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-8 justify-center">
              <Lightbulb className="w-8 h-8 text-warning" />
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Insider tips for {city.name}
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {city.insiderTips.map((tip, idx) => (
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

      {/* FAQ */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
              Frequently asked — stag do in {city.name}
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
            Ready for your stag do in{" "}
            <AuroraText>{city.name}</AuroraText>?
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create an event in 30 seconds, invite your crew with a code, vote on
            activities, play games, split costs — all in one app. Free to start.
          </p>
          <Link to="/create">
            <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
              Start planning {city.name} stag do
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
              Other stag do cities
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                to={`/stag-do/${c.slug}`}
                className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center font-medium"
              >
                <MapPin className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
