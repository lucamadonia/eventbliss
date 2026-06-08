/**
 * JgaCity — SEO-Landingpage je Stadt ("/jga/[stadt]"). Long-Tail-Akquise
 * für High-Intent-Keywords wie "JGA Berlin", "Junggesellenabschied Hamburg".
 * Inhalte aus src/lib/jga-cities.ts, Aktivitäten aus activities-library.ts.
 *
 * Hat seine eigene Hero/Footer-Komposition mit der Landing-Designsprache
 * (Aurora, GlassCard, GradientButton), damit Style-Konsistenz erhalten bleibt.
 */
import { useEffect, useMemo } from "react";
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
import { JGA_CITIES, getCityBySlug, type JgaCity } from "@/lib/jga-cities";
import { jgaHreflangs } from "@/lib/seo-routes";
import { ACTIVITIES_LIBRARY, ACTIVITY_CATEGORIES } from "@/lib/activities-library";

const SITE_URL = "https://event-bliss.com";

function buildJsonLd(city: JgaCity) {
  const url = `${SITE_URL}/jga/${city.slug}`;
  const wikidataRef = city.wikidataId
    ? `https://www.wikidata.org/wiki/${city.wikidataId}`
    : undefined;

  return [
    // 1. Article — primary content type (GEO-friendly: AI engines prefer Article over generic Webpage)
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `JGA ${city.name} — Ideen, Aktivitäten & Planung`,
      description: city.intro,
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/jga-${city.slug}.svg`,
      inLanguage: "de-DE",
      isAccessibleForFree: true,
      datePublished: "2026-05-17",
      dateModified: "2026-05-17",
      author: {
        "@type": "Organization",
        name: "EventBliss",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
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
          addressCountry: city.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: city.coordinates.lat,
          longitude: city.coordinates.lng,
        },
      },
      keywords: [
        `JGA ${city.name}`,
        `Junggesellenabschied ${city.name}`,
        `Bachelor Party ${city.name}`,
        `JGA Ideen ${city.name}`,
        ...city.topActivitySlugs,
      ].join(", "),
      // SpeakableSpecification — tells AI voice search what to read aloud
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", ".speakable-intro"],
      },
    },

    // 2. TouristDestination — explicit travel-context entity
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: `JGA ${city.name}`,
      description: city.intro,
      url,
      image: `${SITE_URL}/og/jga-${city.slug}.svg`,
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
        "Bachelor Party",
        "Bachelorette Party",
        "Group Travel",
        "Junggesellenabschied",
        "Stag Do",
        "Hen Do",
      ],
      includesAttraction: city.neighborhoods.map((n) => ({
        "@type": "TouristAttraction",
        name: n.name,
        description: n.tagline,
      })),
    },

    // 3. FAQPage — direct ranking + AI Overview ingestion
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

    // 4. BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EventBliss", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "JGA-Städte",
          item: `${SITE_URL}/jga/kalkulator`,
        },
        { "@type": "ListItem", position: 3, name: `JGA ${city.name}`, item: url },
      ],
    },
  ];
}

export default function JgaCity() {
  const { stadt } = useParams<{ stadt: string }>();
  const prefersReducedMotion = useReducedMotion();

  const city = useMemo(() => (stadt ? getCityBySlug(stadt) : undefined), [stadt]);

  const topActivities = useMemo(() => {
    if (!city) return [];
    return city.topActivitySlugs
      .map((slug) => ACTIVITIES_LIBRARY.find((a) => a.value === slug))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [city]);

  const otherCities = useMemo(
    () => (city ? JGA_CITIES.filter((c) => c.slug !== city.slug).slice(0, 6) : []),
    [city]
  );

  // hreflang injection — point crawlers to every translated equivalent of this
  // city (de/en + the 7 intl languages + Arabic where content exists).
  useEffect(() => {
    if (!city) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    for (const { hreflang, href } of jgaHreflangs(city.slug, SITE_URL)) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", hreflang);
      link.setAttribute("href", href);
      link.setAttribute("data-jga-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    }
    return () => links.forEach((l) => l.remove());
  }, [city]);

  useSEO(
    city
      ? {
          title: `JGA ${city.name} — Ideen, Aktivitäten & Planung | EventBliss`,
          description: `Junggesellenabschied ${city.nameLocative}: ${topActivities.length}+ Aktivitäten, beste Viertel, Budgetplanung, Insider-Tipps. Plant euren JGA in Minuten mit der EventBliss-App.`,
          canonical: `${SITE_URL}/jga/${city.slug}`,
          ogImage: `${SITE_URL}/og/jga-${city.slug}.svg`,
          ogType: "article",
          locale: "de_DE",
          htmlLang: "de-DE",
          dir: "ltr",
          keywords: `JGA ${city.name}, Junggesellenabschied ${city.name}, JGA Ideen ${city.name}, Bachelor Party ${city.name}, Junggesellinnenabschied ${city.name}`,
          jsonLd: buildJsonLd(city),
        }
      : {
          title: "JGA-Stadt nicht gefunden | EventBliss",
          description: "Diese JGA-Stadt-Seite existiert nicht. Stöbere durch unsere Top-Städte.",
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
              JGA <AuroraText as="span">{city.name}</AuroraText>
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
                  JGA {city.nameLocative} planen
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
              <Link to="/games">
                <GradientButton size="lg" variant="outline" icon={<Gamepad2 className="w-5 h-5" />}>
                  24+ Party-Spiele anschauen
                </GradientButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Ab 4 Personen
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> {city.budget.weekend}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {city.bestSeasons[0]}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTRO BODY */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">
              Warum ein JGA {city.nameLocative}?
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
                Top-Aktivitäten <AuroraText>{city.nameLocative}</AuroraText>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Diese {topActivities.length} Aktivitäten funktionieren in {city.name} für
                JGA-Gruppen von 6 bis 20 Personen — kombiniert sie nach Wetter, Budget und Stimmung.
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

          <div className="mt-12 text-center">
            <Link to="/ideas">
              <GradientButton variant="outline" size="md">
                Alle {ACTIVITIES_LIBRARY.length}+ Aktivitäten ansehen
                <ArrowRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-center">
              Wo geht ihr aus {city.nameLocative}?
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Die richtigen Stadtteile entscheiden über euren JGA-Abend. Hier die
              wichtigsten {city.neighborhoods.length} Viertel auf einen Blick.
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
                  Budget für JGA {city.nameLocative}
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Wochenende:</strong> {city.budget.weekend}
                  </li>
                  <li>
                    <strong className="text-foreground">Aktivität:</strong> {city.budget.activity}
                  </li>
                  <li>
                    <strong className="text-foreground">Party-Abend:</strong> {city.budget.party}
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-6">
                  Mit EventBliss splittet ihr alle Kosten automatisch — keine "Wer schuldet wem
                  was"-Diskussionen mehr.
                </p>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlassCard padding="lg" variant="glow">
                <Sun className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-display font-bold mb-4">
                  Wann ist die beste Zeit?
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  {city.bestSeasons.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-6">
                  Plant 8–12 Wochen Vorlauf für Hochsaison-Termine — Unterkünfte und beliebte
                  Aktivitäten sind sonst ausgebucht.
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
                Insider-Tipps {city.nameLocative}
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
              Häufige Fragen zum JGA {city.nameLocative}
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
            Bereit für euren JGA <AuroraText>{city.nameLocative}</AuroraText>?
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            In 30 Sekunden Event erstellen, Crew per Code einladen, Aktivitäten abstimmen,
            Spiele spielen, Kosten splitten — alles in einer App. Gratis starten.
          </p>
          <Link to="/create">
            <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
              JGA {city.nameLocative} jetzt planen
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
              JGA in einer anderen Stadt?
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                to={`/jga/${c.slug}`}
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
