/**
 * ActivityEN — English-language SEO/GEO landing page at /activities/[slug].
 * Mirrors src/pages/IdeaActivity.tsx but in English with stag-do terminology.
 */
import { useMemo, useEffect } from "react";
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
import { CATEGORY_FRAMEWORKS_EN, getCitiesForActivityEn } from "@/lib/activity-content-en";
import { getActivityLabel, getCategoryLabel } from "@/lib/activity-labels-i18n";

const SITE_URL = "https://event-bliss.com";

function buildJsonLd(activity: ActivityItem) {
  const url = `${SITE_URL}/activities/${activity.value}`;
  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS_EN[activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];
  const label = getActivityLabel(activity.value, activity.label, "en");
  const la = { ...activity, label };
  const catLabel = getCategoryLabel(activity.category, cat.label, "en");

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${label} for a Stag Do — Ideas, Costs & Top Cities`,
      description: framework.introFor(la),
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og/ideen-${activity.value}.svg`,
      inLanguage: "en-GB",
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
        `${label} stag do`,
        `${label} stag party`,
        `${label} group activity`,
        `${label} costs`,
      ].join(", "),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-intro", ".speakable-facts"],
      },
      translationOfWork: {
        "@type": "Article",
        url: `${SITE_URL}/ideen/${activity.value}`,
        inLanguage: "de-DE",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${label} for stag do groups`,
      description: framework.introFor(la),
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
      "@type": "HowTo",
      name: `How to plan ${label} for a stag do`,
      description: `Step-by-step: organising ${label} as a stag activity.`,
      totalTime: spec.duration,
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: "EUR",
        value: `${spec.costFrom}–${spec.costTo}`,
      },
      step: [
        {
          "@type": "HowToStep",
          name: "Define group and budget",
          text: `Set headcount (ideally ${spec.groupSize}) and per-person budget (typically €${spec.costFrom}–€${spec.costTo}).`,
        },
        {
          "@type": "HowToStep",
          name: "Pick city and operator",
          text: `${label} is available in many European cities. Best operators in London, Berlin, Prague, Amsterdam, Barcelona and other stag hubs.`,
        },
        {
          "@type": "HowToStep",
          name: "Book the date",
          text: spec.weatherDependent
            ? "Keep a weatherproof indoor alternative bookable. 4–8 weeks lead time in peak season."
            : "Booking 2–6 weeks ahead secures the best slots.",
        },
        {
          "@type": "HowToStep",
          name: "Invite the crew and plan",
          text: "Create an event in EventBliss in 30 seconds, invite by code, split programme + costs.",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: framework.faqs(la).map((faq) => ({
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
        { "@type": "ListItem", position: 2, name: "Stag Activities", item: `${SITE_URL}/activities/${activity.value}` },
        { "@type": "ListItem", position: 3, name: catLabel, item: `${SITE_URL}/activities/${activity.value}` },
        { "@type": "ListItem", position: 4, name: label, item: url },
      ],
    },
  ];
}

export default function ActivityEN() {
  const { slug } = useParams<{ slug: string }>();
  const prefersReducedMotion = useReducedMotion();

  const activity = useMemo(() => (slug ? getActivityBySlug(slug) : undefined), [slug]);
  const cities = useMemo(
    () => (activity ? getCitiesForActivityEn(activity.value) : []),
    [activity]
  );

  const sameCategoryActivities = useMemo(() => {
    if (!activity) return [];
    return ACTIVITIES_LIBRARY.filter(
      (a) => a.category === activity.category && a.value !== activity.value
    ).slice(0, 8);
  }, [activity]);

  // hreflang to German counterpart
  useEffect(() => {
    if (!activity) return;
    const head = document.head;
    const links: HTMLLinkElement[] = [];

    const addHreflang = (lang: string, href: string) => {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", lang);
      link.setAttribute("href", href);
      link.setAttribute("data-activity-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    };

    addHreflang("en", `${SITE_URL}/activities/${activity.value}`);
    addHreflang("en-GB", `${SITE_URL}/activities/${activity.value}`);
    addHreflang("en-US", `${SITE_URL}/activities/${activity.value}`);
    addHreflang("de", `${SITE_URL}/ideen/${activity.value}`);
    addHreflang("de-DE", `${SITE_URL}/ideen/${activity.value}`);
    addHreflang("x-default", `${SITE_URL}/activities/${activity.value}`);

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [activity]);

  useSEO(
    activity
      ? {
          title: `${label} for a Stag Do — Ideas, Costs & Top Cities | EventBliss`,
          description: `${label} as a stag activity: cost per person, ideal group size, best cities in Europe. Step-by-step planning with EventBliss.`,
          canonical: `${SITE_URL}/activities/${activity.value}`,
          ogImage: `${SITE_URL}/og/ideen-${activity.value}.svg`,
          ogType: "article",
          locale: "en_GB",
          keywords: `${label} stag do, ${label} stag party, ${label} group activity, ${label} costs, ${label} planning`,
          jsonLd: buildJsonLd(activity),
        }
      : {
          title: "Activity not found | EventBliss",
          description: "This activity page does not exist. Browse our 176 stag activities.",
        }
  );

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  const spec = getActivitySpec(activity);
  const framework = CATEGORY_FRAMEWORKS_EN[activity.category];
  const cat = ACTIVITY_CATEGORIES[activity.category];
  const label = getActivityLabel(activity.value, activity.label, "en");
  const la = { ...activity, label };
  const catLabel = getCategoryLabel(activity.category, cat.label, "en");

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
              {cat.emoji} {catLabel}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              <AuroraText as="span">{label}</AuroraText>
              <span className="block text-2xl md:text-3xl mt-4 text-muted-foreground font-normal">
                as a stag-do activity
              </span>
            </h1>

            <p className="speakable-intro text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {framework.introFor(la)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/create">
                <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
                  Plan a stag with {label}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </GradientButton>
              </Link>
            </div>

            <div className="mt-6">
              <Link
                to={`/ideen/${activity.value}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                Auf Deutsch lesen
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FACTS GRID */}
      <section className="py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              {label} facts
            </h2>
          </ScrollReveal>

          <div className="speakable-facts grid grid-cols-2 md:grid-cols-4 gap-4">
            <FactCard
              icon={<Wallet className="w-5 h-5" />}
              label="Cost per person"
              value={`€${spec.costFrom}–€${spec.costTo}`}
            />
            <FactCard
              icon={<Users className="w-5 h-5" />}
              label="Group size"
              value={spec.groupSize}
            />
            <FactCard
              icon={<Clock className="w-5 h-5" />}
              label="Duration"
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
              ? "⚠️ Weather-dependent — keep indoor backup plan"
              : "✓ Weather-independent — no backup needed"}
            {" · "}
            Difficulty:{" "}
            {spec.difficulty === "low"
              ? "Easy (any level)"
              : spec.difficulty === "medium"
                ? "Medium"
                : "Challenging"}
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
                  When does {label} work?
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
                  Who is it for?
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
                Budgeting {label}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {framework.costExplain}
              </p>
              <div className="mt-6 pt-6 border-t border-border/40">
                <Link to="/jga/kalkulator">
                  <GradientButton variant="outline" size="md" icon={<Sparkles className="w-4 h-4" />}>
                    Use the full stag-do budget calculator
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
                  Top cities for <AuroraText>{label}</AuroraText>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  These {cities.length} European stag-do cities feature {label}
                  {" "}prominently in their top-activity set:
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((c, i) => (
                <ScrollReveal key={c.slug} delay={i * 0.04}>
                  <Link to={`/stag-do/${c.slug}`}>
                    <GlassCard variant="hover" padding="md">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.vibe}</p>
                      <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                        View city guide <ArrowRight className="w-3 h-3" />
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
                Common mistakes with {label}
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
              FAQ — {label}
            </h2>
          </ScrollReveal>

          <Accordion type="single" collapsible className="space-y-3">
            {framework.faqs(la).map((faq, i) => (
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
            Plan a stag with <AuroraText>{label}</AuroraText>
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create an event in EventBliss in 30 seconds, invite your crew, vote on activities, split costs — all in one app.
          </p>
          <Link to="/create">
            <GradientButton size="lg" icon={<PartyPopper className="w-5 h-5" />}>
              Create event now
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
                More {catLabel} activities
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sameCategoryActivities.map((a) => (
                <Link
                  key={a.value}
                  to={`/activities/${a.value}`}
                  className="block p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/50 hover:bg-card/60 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{a.emoji}</div>
                  <div className="text-sm font-medium">{getActivityLabel(a.value, a.label, "en")}</div>
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
