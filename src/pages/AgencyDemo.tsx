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
 * Diese Seite zeigt nur zwei Dinge: das eigene Profil und den Weg, auf dem eine
 * Anfrage entsteht. Alles andere ist Beiwerk.
 *
 * PERSONALISIERUNG: `/agencies/<invite_token>` liest die Zeile aus
 * `agency_directory` — dieselbe Herkunft, die `AgencyApply` schon fuer das
 * Vorbefuellen nutzt. Ohne Token ist es die allgemeine Fassung; nichts bricht,
 * wenn der Token unbekannt ist.
 *
 * INTERNATIONAL: Deutsch fuer /de und deutsche Oberflaechensprache, sonst
 * Englisch (siehe agency-demo-copy.ts). Personalisierte Seiten stehen auf
 * noindex — der Name einer noch nicht gelisteten Agentur gehoert nicht in eine
 * Suchmaschine.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight, Building2, CalendarDays, Check, Globe, Mail, MapPin,
  Phone, Send, Sparkles, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { agencyDemoCopy } from "@/lib/agency-demo-copy";
import { toSeoLang } from "@/lib/seo-routes";
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
  const { i18n } = useTranslation();
  const { lang: urlLang } = useUrlLanguage();
  const lang = urlLang ?? toSeoLang(i18n.language) ?? "en";
  const copy = agencyDemoCopy(lang);

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

  useSEO({
    title: copy.metaTitle,
    description: copy.metaDescription,
    canonical: `${SITE}/agencies`,
    // Eine Seite, die den Namen einer noch nicht gelisteten Agentur traegt,
    // gehoert nicht in den Index.
    ...(token ? { robots: "noindex,follow" } : {}),
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
          <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white">
            <a href="https://event-bliss.com" target="_blank" rel="noreferrer">{copy.ctaSecondary}</a>
          </Button>
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

        {/* ── Die Vorschau: links das Profil, rechts die Anfrage ────── */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/*
              Das Profil im Telefonrahmen. Der Rahmen ist keine Spielerei: er
              sagt ohne ein Wort, WO die Agentur steht — in der Hand der Gruppe,
              nicht auf einer Website.
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

              <div className="mx-auto max-w-[380px] rounded-[2.2rem] border border-white/15 bg-black/40 p-3 shadow-2xl">
                <div className="rounded-[1.7rem] bg-gradient-to-b from-[#151521] to-[#0d0d16] p-4 space-y-4">
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
                        <p className="font-bold leading-tight truncate">
                          {agency?.name ?? (lang === "de" ? "Eure Agentur" : "Your agency")}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {[city, agency?.country].filter(Boolean).join(" · ") ||
                            (lang === "de" ? "Eure Stadt" : "Your city")}
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
                      <Send className="h-4 w-4 mr-2" />
                      {copy.previewRequestButton}
                    </Button>
                  </div>
                </div>
              </div>
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

        {/* ── Einladung ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-black">{copy.ctaTitle(agency?.name)}</h2>
            <p className="mt-4 max-w-2xl text-white/70 leading-relaxed">{copy.ctaBody}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                <Link to={applyHref}>
                  {copy.ctaButton}
                  <ArrowRight className="h-4 w-4 ml-2" />
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
            <Link to="/legal/privacy" className="hover:text-white">Datenschutz / Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
