/**
 * Agentur-Demoseite — der Link aus dem Akquise-Anschreiben.
 *
 * Zweck: Eine Agentur, die eine Mail bekommen hat, soll in dreissig Sekunden
 * sehen, WIE sie in der App aussieht — mit ihrem eigenen Namen, ihrer Stadt,
 * ihrem Text. Nicht: eine Verkaufsseite lesen.
 *
 * Deshalb ist das hier ausdruecklich NICHT AgencyPricing.tsx. Dort stehen
 * Tarife und Betraege; das Akquise-Briefing verbietet beides in der Ansprache
 * (kein Preis, keine Laufzeit, keine Mengenversprechen, keine Feature-Liste).
 * Diese Seite zeigt drei Dinge: das eigene Profil, den Weg, auf dem eine
 * Anfrage entsteht, und wohin die Zusammenarbeit fuehren kann.
 *
 * PERSONALISIERUNG: `/agencies/<invite_token>` liest die Zeile aus
 * `agency_directory` — dieselbe Herkunft, die `AgencyApply` schon fuer das
 * Vorbefuellen nutzt. Ohne Token ist es die allgemeine Fassung; nichts bricht,
 * wenn der Token unbekannt ist.
 *
 * ZEHN SPRACHEN: das Verzeichnis fuehrt Agenturen in neun Laendern — Englisch
 * fuer alle waere fuer die Mehrheit die Fremdsprache. Texte in
 * agency-demo-copy.ts und agency-demo-stages.ts, Rueckfall auf Englisch (NICHT
 * auf Deutsch wie im Rest der App). Personalisierte Seiten stehen auf noindex:
 * der Name einer noch nicht gelisteten Agentur gehoert nicht in eine
 * Suchmaschine.
 */
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight, Bot, Building2, CalendarCheck, CalendarDays, Check, Globe, Mail,
  MapPin, Phone, Send, Sparkles, Star, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { agencyDemoCopy } from "@/lib/agency-demo-copy";
import { agencyDemoStages, type StageCopy } from "@/lib/agency-demo-stages";
import {
  HTML_LANG_BY_LANG, isRtl, LANG_LABEL, LOCALE_BY_LANG, SEO_LANGS, toSeoLang,
  type SeoLang,
} from "@/lib/seo-routes";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const SITE = "https://event-bliss.com";

interface DirectoryAgency {
  id: number;
  name: string;
  city: string;
  country: string;
  website: string | null;
  phone: string | null;
  description: string | null;
}

export default function AgencyDemo() {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { lang: urlLang } = useUrlLanguage();
  const lang: SeoLang = urlLang ?? toSeoLang(i18n.language) ?? "en";
  const copy = agencyDemoCopy(lang);
  const stages = agencyDemoStages(lang);

  const [agency, setAgency] = useState<DirectoryAgency | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      // Dieselbe Abfrage wie in AgencyApply: oeffentlich lesbar, per Token.
      const { data } = await (supabase.from as any)("agency_directory")
        .select("id, name, city, country, website, phone, description")
        .eq("invite_token", token)
        .maybeSingle();
      if (!cancelled && data) setAgency(data as DirectoryAgency);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const suffix = token ? `/agencies/${token}` : "/agencies";
  useSEO({
    title: copy.metaTitle,
    description: copy.metaDescription,
    canonical: `${SITE}${token ? `/${lang}${suffix}` : "/agencies"}`,
    locale: LOCALE_BY_LANG[lang],
    htmlLang: HTML_LANG_BY_LANG[lang],
    dir: isRtl(lang) ? "rtl" : "ltr",
    // Ohne Token gehoert die Seite in den Index — mit Token nicht.
    ...(token
      ? { robots: "noindex,follow" }
      : {
          hreflangs: [
            ...SEO_LANGS.map((l) => ({ hreflang: l, href: `${SITE}/${l}/agencies` })),
            { hreflang: "x-default", href: `${SITE}/agencies` },
          ],
        }),
  });

  const city = agency?.city;
  const applyHref = token ? `/agency-apply?invite=${encodeURIComponent(token)}` : "/agency-apply";

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      {/* Kopf — bewusst schmal: das hier ist kein Portal, sondern ein Brief. */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={eventBlissLogo} alt="EventBliss" className="h-9 w-auto" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/*
              Sprachwahl. Der Maillink traegt die Sprache des Landes; das hier
              ist der Ausweg, wenn wir danebenliegen — eine Agentur in Bruessel
              kann franzoesisch oder niederlaendisch arbeiten, das Land verraet
              es nicht.
            */}
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => navigate(`/${e.target.value}${suffix}`)}
              className="bg-white/5 border border-white/15 rounded-lg text-sm px-2 py-1.5 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              {SEO_LANGS.map((l) => (
                <option key={l} value={l} className="bg-[#12121c] text-white">
                  {LANG_LABEL[l]}
                </option>
              ))}
            </select>
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hidden sm:inline-flex">
              <a href="https://event-bliss.com" target="_blank" rel="noreferrer">{copy.ctaSecondary}</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Aufschlag ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pt-14 pb-10 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge className="bg-white/10 text-white/80 border-white/15 hover:bg-white/10">
              {copy.eyebrow}
            </Badge>
            <h1 className="mt-5 text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">
              {copy.headline(agency?.name)}
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/70 leading-relaxed">
              {copy.lead(city)}
            </p>
          </motion.div>
        </section>

        {/* ── Die Vorschau: das Profil und die Anfrage ─────────────── */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/*
              Das Profil im Telefonrahmen. Der Rahmen ist keine Spielerei: er
              sagt ohne ein Wort, WO die Agentur steht — in der Hand der Gruppe,
              nicht auf einer Website. Genau deshalb tragen die drei Stufen
              weiter unten denselben Rahmen.
            */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                  {copy.previewTitle}
                </h2>
                <span className="text-xs text-white/40">{copy.previewHint}</span>
              </div>

              <PhoneFrame>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <MapPin className="h-3.5 w-3.5" />
                  {city ?? "Hamburg"}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-tight truncate">{agency?.name ?? copy.yourAgency}</p>
                      <p className="text-xs text-white/50 truncate">
                        {[city, agency?.country].filter(Boolean).join(" · ") || copy.yourCity}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-white/70 leading-relaxed line-clamp-4">
                    {agency?.description?.trim() || copy.previewFallbackDescription(city ?? "Hamburg")}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-white/45">
                    {agency?.phone && (
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{agency.phone}</span>
                    )}
                    {agency?.website && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                        <Globe className="h-3 w-3" />{agency.website.replace(/^https?:\/\//, "")}
                      </span>
                    )}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90" size="sm">
                    <Send className="h-4 w-4 me-2" />
                    {copy.previewRequestButton}
                  </Button>
                </div>
              </PhoneFrame>
            </motion.div>

            {/* Die Anfrage — der eigentliche Gegenstand des Gespraechs. */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
            >
              <h2 className="text-xl font-bold">{copy.requestTitle}</h2>
              <p className="mt-1 text-sm text-white/50">{copy.requestHint}</p>

              <dl className="mt-6 space-y-3">
                {copy.requestFields.map((f, i) => {
                  const icons = [Sparkles, CalendarDays, Users, Wallet, Mail];
                  const Icon = icons[i] ?? Sparkles;
                  return (
                    <div key={f.label} className="flex items-start gap-3 rounded-xl bg-black/30 px-4 py-3">
                      <Icon className="mt-0.5 h-4 w-4 text-white/35" />
                      <div className="min-w-0">
                        <dt className="text-xs uppercase tracking-wide text-white/40">{f.label}</dt>
                        <dd className="text-sm text-white/85">{f.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </motion.div>
          </div>
        </section>

        {/* ── Der Ablauf ───────────────────────────────────────────── */}
        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-bold">{copy.stepsTitle}</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {copy.steps.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-white/10 bg-black/25 p-6">
                  <span className="text-4xl font-black text-white/10">{i + 1}</span>
                  <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/65 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hintergrund und Bedingungen ──────────────────────────── */}
        <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold">{copy.factsTitle}</h2>
            <ul className="mt-4 space-y-3">
              {copy.facts.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-bold">{copy.termsTitle}</h2>
            <ul className="mt-4 space-y-3">
              {copy.terms.map((t) => (
                <li key={t} className="flex gap-3 text-sm text-white/80">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-white/45 leading-relaxed">{copy.termsFootnote}</p>
          </div>
        </section>

        {/* ── Die drei Stufen ──────────────────────────────────────── */}
        <StagesSection stages={stages} />

        {/* ── Einladung ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-black">{copy.ctaTitle(agency?.name)}</h2>
            <p className="mt-4 max-w-2xl text-white/70 leading-relaxed">{copy.ctaBody}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                <Link to={applyHref}>
                  {copy.ctaButton}
                  <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent hover:bg-white/10">
                <a href="mailto:svitlana@event-bliss.com">svitlana@event-bliss.com</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8 text-sm text-white/45 space-y-3">
          <p className="font-semibold text-white/70">{copy.contactTitle}</p>
          <p className="max-w-2xl leading-relaxed">{copy.contactBody}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/legal/agency-agreement" className="hover:text-white">{copy.agreementLabel}</Link>
            <Link to="/legal/imprint" className="hover:text-white">{copy.imprintLabel}</Link>
            <Link to="/legal/privacy" className="hover:text-white">{copy.privacyLabel}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Der Telefonrahmen. Dreimal auf dieser Seite dasselbe Bild — Profil, Leistung,
 * KI-Antwort. Die Wiederholung ist die Aussage: es ist derselbe Bildschirm
 * derselben Gruppe, nur zu drei Zeitpunkten.
 */
function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[380px] rounded-[2.2rem] border border-white/15 bg-black/40 p-3 shadow-2xl ${className}`}>
      <div className="rounded-[1.7rem] bg-gradient-to-b from-[#151521] to-[#0d0d16] p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Die drei Stufen.
 *
 * Stufe 1 ist der Pilot. Stufe 2 und 3 sind AUSBLICK — sie tragen ein eigenes
 * Kennzeichen, und der Abschnitt endet mit dem Satz, dass nichts davon
 * Voraussetzung ist. Kein Termin, keine Zusage: eine Agentur soll aus dieser
 * Seite keinen Anspruch ableiten koennen.
 *
 * Die Beispielkarten holen ABSICHTLICH keine Daten. Eine echte Leistung mit
 * echtem Preis auf dieser Seite waere das Angebot einer fremden Agentur.
 */
function StagesSection({ stages: s }: { stages: StageCopy }) {
  return (
    <section className="border-t border-white/10 bg-white/[0.02]">
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold">{s.sectionTitle}</h2>
        <p className="mt-3 max-w-2xl text-white/65 leading-relaxed">{s.sectionLead}</p>

        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          {/* Stufe 1 — was der Pilot heute ist */}
          <StageColumn index={1} badge={s.nowBadge} badgeTone="now" title={s.stage1Title} body={s.stage1Body}>
            <PhoneFrame className="max-w-[300px]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="h-2.5 w-24 rounded bg-white/25" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded bg-white/10" />
                  <div className="h-2 w-4/5 rounded bg-white/10" />
                </div>
                <div className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-1.5 text-xs font-semibold">
                  <Send className="h-3 w-3" />
                </div>
              </div>
            </PhoneFrame>
          </StageColumn>

          {/* Stufe 2 — buchbare Leistung */}
          <StageColumn index={2} badge={s.laterBadge} badgeTone="later" title={s.stage2Title} body={s.stage2Body}>
            <PhoneFrame className="max-w-[300px]">
              <ServiceCardMock s={s} />
            </PhoneFrame>
          </StageColumn>

          {/* Stufe 3 — Empfehlung unter der KI-Antwort */}
          <StageColumn index={3} badge={s.laterBadge} badgeTone="later" title={s.stage3Title} body={s.stage3Body}>
            <PhoneFrame className="max-w-[300px]">
              <div className="space-y-3">
                <div className="ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-purple-600/30 px-3 py-2 text-xs text-white/90">
                  {s.aiPrompt}
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-es-sm bg-white/[0.06] px-3 py-2 text-xs text-white/75 leading-relaxed">
                    {s.aiAnswer}
                  </div>
                </div>
                <div className="relative">
                  <Badge className="absolute -top-2 start-2 z-10 bg-emerald-500/90 text-black text-[10px] border-0 hover:bg-emerald-500/90">
                    {s.recommendedLabel}
                  </Badge>
                  <ServiceCardMock s={s} compact />
                </div>
              </div>
            </PhoneFrame>
          </StageColumn>
        </div>

        <p className="mt-10 text-sm text-white/45">{s.noCondition}</p>
      </div>
    </section>
  );
}

function StageColumn({
  index, badge, badgeTone, title, body, children,
}: {
  index: number;
  badge: string;
  badgeTone: "now" | "later";
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-white/15">{index}</span>
        <Badge
          className={
            badgeTone === "now"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15"
              : "bg-white/[0.06] text-white/55 border-white/15 hover:bg-white/[0.06]"
          }
        >
          {badge}
        </Badge>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-white/65 leading-relaxed">{body}</p>
      {children}
    </motion.div>
  );
}

/** Erfundene Leistung. Der Preis ist der Preis DER AGENTUR, keine Kondition von uns. */
function ServiceCardMock({ s, compact = false }: { s: StageCopy; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">{s.serviceTitle}</p>
        <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
          {s.exampleTag}
        </span>
      </div>

      {!compact && (
        <div className="flex items-center gap-1 text-amber-400">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3 fill-current" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-white/50">
        <span className="inline-flex items-center gap-1">
          <CalendarCheck className="h-3 w-3" />
          {s.availabilityLabel}
        </span>
        <span className="font-semibold text-white/80">{s.servicePrice}</span>
      </div>

      <div className="h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-xs font-semibold">
        {s.bookButton}
      </div>
    </div>
  );
}
