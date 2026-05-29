/**
 * IdeaActivity — SEO/GEO-Landingpage je Aktivität ("/ideen/[slug]").
 *
 * Jede der 183 Aktivitäten erhält eine individuelle Page mit
 *   • aktivitäts-spezifischem Title + H1
 *   • kategorie-spezifischem Framework-Content
 *   • Cross-Links zu Städten, die die Aktivität führen
 *   • generierter FAQ mit Aktivitäts-Variable
 *   • vollständigem JSON-LD (Article + Service + FAQPage + HowTo + Speakable)
 */
import { useMemo } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Wallet,
  Users,
  Clock,
  Cloud,
  Activity as ActivityIcon,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  PartyPopper,
  Sparkles,
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
import {
  CATEGORY_FRAMEWORKS,
  getActivityBySlug,
  getActivitySpec,
  getCitiesForActivity,
} from "@/lib/activity-content";

const SITE_URL = "https://event-bliss.com";

function buildJsonLd(activity: ActivityItem) {
  const url = `${SITE_URL}/ideen/${activity.value}`;
  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS[activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];

  return [
    // Article — Hauptcontent-Entity
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${activity.label} für JGA — Ideen, Kosten & Top-Städte`,
      description: framework.introFor(activity),
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/ideen-${activity.value}.svg`,
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
      articleSection: cat.label,
      keywords: [
        `${activity.label} JGA`,
        `${activity.label} Junggesellenabschied`,
        `${activity.label} Gruppe`,
        `${activity.label} Kosten`,
        `${activity.label} Ideen`,
      ].join(", "),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-intro", ".speakable-facts"],
      },
    },

    // Service — Aktivität als buchbarer Service
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${activity.label} für JGA-Gruppen`,
      description: framework.introFor(activity),
      url,
      provider: {
        "@type": "Organization",
        name: "EventBliss",
        url: SITE_URL,
      },
      areaServed: { "@type": "Place", name: "DACH + Europa" },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: spec.costFrom.toString(),
        highPrice: spec.costTo.toString(),
        priceCurrency: "EUR",
        offerCount: "183",
      },
      category: cat.label,
    },

    // HowTo — Wie plant man diese Aktivität
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `${activity.label} für JGA planen`,
      description: `Schritt-für-Schritt: ${activity.label} als JGA-Aktivität organisieren.`,
      totalTime: spec.duration,
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: "EUR",
        value: `${spec.costFrom}–${spec.costTo}`,
      },
      step: [
        {
          "@type": "HowToStep",
          name: "Gruppe und Budget klären",
          text: `Anzahl der Personen festlegen (optimal ${spec.groupSize}) und Budget pro Person kalkulieren (typisch ${spec.costFrom}–${spec.costTo} €).`,
        },
        {
          "@type": "HowToStep",
          name: "Stadt und Anbieter wählen",
          text: `${activity.label} ist in vielen DACH- und EU-Städten verfügbar. Beste Anbieter in Berlin, Hamburg, München, Prag und weiteren JGA-Hochburgen.`,
        },
        {
          "@type": "HowToStep",
          name: "Termin buchen",
          text: spec.weatherDependent
            ? "Wetterunabhängige Indoor-Alternative parallel buchbar halten. 4–8 Wochen Vorlauf zur Hauptsaison."
            : "Buchung 2–6 Wochen vor dem Termin sichert beste Slots.",
        },
        {
          "@type": "HowToStep",
          name: "Crew einladen und planen",
          text: "Mit EventBliss in 30 Sekunden ein Event erstellen, Crew per Code einladen, Programm + Kosten teilen.",
        },
      ],
    },

    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: framework.faqs(activity).map((faq) => ({
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
        { "@type": "ListItem", position: 2, name: "JGA-Ideen", item: `${SITE_URL}/ideas` },
        { "@type": "ListItem", position: 3, name: cat.label, item: `${SITE_URL}/ideas` },
        { "@type": "ListItem", position: 4, name: activity.label, item: url },
      ],
    },
  ];
}

export default function IdeaActivity() {
  const { slug } = useParams<{ slug: string }>();
  const prefersReducedMotion = useReducedMotion();

  const activity = useMemo(() => (slug ? getActivityBySlug(slug) : undefined), [slug]);
  const cities = useMemo(
    () => (activity ? getCitiesForActivity(activity.value) : []),
    [activity]
  );

  // Other activities from the same category for cross-linking
  const sameCategoryActivities = useMemo(() => {
    if (!activity) return [];
    return ACTIVITIES_LIBRARY.filter(
      (a) => a.category === activity.category && a.value !== activity.value
    ).slice(0, 8);
  }, [activity]);

  useSEO(
    activity
      ? {
          title: `${activity.label} für JGA — Ideen, Kosten & Top-Städte | EventBliss`,
          description: `${activity.label} als JGA-Aktivität: Kosten pro Person, ideale Gruppengröße, beste Städte in Deutschland und Europa. Schritt-für-Schritt Planung mit EventBliss.`,
          canonical: `${SITE_URL}/ideen/${activity.value}`,
          ogImage: `${SITE_URL}/og/ideen-${activity.value}.svg`,
          ogType: "article",
          locale: "de_DE",
          keywords: `${activity.label} JGA, ${activity.label} Junggesellenabschied, ${activity.label} Gruppe, ${activity.label} Ideen, ${activity.label} Kosten, ${activity.label} planen`,
          jsonLd: buildJsonLd(activity),
        }
      : {
          title: "Aktivität nicht gefunden | EventBliss",
          description: "Diese Aktivitäts-Seite existiert nicht. Stöbere durch unsere 183 JGA-Ideen.",
        }
  );

  if (!activity) {
    return <Navigate to="/ideas" replace />;
  }

  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS[activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];

  return (
    <div className="min-h-screen bg-background">
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
              {cat.emoji} {cat.label}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              <AuroraText as="span">{activity.label}</AuroraText>
              <span className="block text-2xl md:text-3xl mt-4 text-muted-foreground font-normal">
                als JGA-Aktivität
              </span>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {framework.introFor(activity)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
                  Event mit {activity.label} planen
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
            </div>

            {spec.flavor && (
              <p className="text-sm text-muted-foreground mt-8 max-w-2xl mx-auto italic">
                {spec.flavor}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* FACTS GRID */}
      <section className="py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              Fakten zu {activity.label}
            </h2>
          </ScrollReveal>

          <div className="speakable-facts grid grid-cols-2 md:grid-cols-4 gap-4">
            <FactCard
              icon={<Wallet className="w-5 h-5" />}
              label="Kosten pro Person"
              value={`${spec.costFrom}–${spec.costTo} €`}
            />
            <FactCard
              icon={<Users className="w-5 h-5" />}
              label="Gruppengröße"
              value={spec.groupSize}
            />
            <FactCard
              icon={<Clock className="w-5 h-5" />}
              label="Dauer"
              value={spec.duration}
            />
            <FactCard
              icon={<Cloud className="w-5 h-5" />}
              label="Setting"
              value={
                spec.setting === "indoor"
                  ? "Indoor"
                  : spec.setting === "outdoor"
                    ? "Outdoor"
                    : "Indoor + Outdoor"
              }
            />
          </div>

          <div className="text-center text-sm text-muted-foreground mt-6">
            {spec.weatherDependent
              ? "⚠️ Wetterabhängig — Indoor-Backup-Plan einplanen"
              : "✓ Wetterunabhängig — kein Backup-Plan nötig"}
            {" · "}
            Schwierigkeit:{" "}
            {spec.difficulty === "low"
              ? "Einfach (alle Levels)"
              : spec.difficulty === "medium"
                ? "Mittel"
                : "Anspruchsvoll"}
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
                  Wann lohnt sich {activity.label}?
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
                  Für welche Crews?
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
                So kalkulierst du {activity.label}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {framework.costExplain}
              </p>
              <div className="mt-6 pt-6 border-t border-border/40">
                <Link to="/jga/kalkulator">
                  <GradientButton variant="outline" size="md" icon={<Sparkles className="w-4 h-4" />}>
                    Gesamtes JGA-Budget berechnen
                  </GradientButton>
                </Link>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* CITIES */}
      {cities.length > 0 && (
        <section className="py-12 bg-card/20">
          <div className="container max-w-5xl mx-auto px-4">
            <ScrollReveal>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  Top-Städte für <AuroraText>{activity.label}</AuroraText>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Diese {cities.length} JGA-Städte führen {activity.label} prominent in
                  ihrem Top-Aktivitäten-Set:
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((c, i) => (
                <ScrollReveal key={c.slug} delay={i * 0.04}>
                  <Link to={`/jga/${c.slug}`}>
                    <GlassCard variant="hover" padding="md">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.vibe}</p>
                      <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                        Stadt-Guide ansehen <ArrowRight className="w-3 h-3" />
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
                Häufige Fehler bei {activity.label}
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
              Häufige Fragen zu {activity.label}
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
            JGA mit <AuroraText>{activity.label}</AuroraText> planen
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Mit EventBliss in 30 Sekunden Event erstellen, Crew per Code einladen,
            Aktivitäten abstimmen, Kosten splitten — alles in einer App.
          </p>
          <Link to="/create">
            <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
              Jetzt Event erstellen
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
                Weitere {cat.label}-Aktivitäten
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sameCategoryActivities.map((a) => (
                <Link
                  key={a.value}
                  to={`/ideen/${a.value}`}
                  className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{a.emoji}</div>
                  <div className="text-sm font-medium">{a.label}</div>
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
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-semibold text-sm md:text-base">{value}</p>
    </div>
  );
}
