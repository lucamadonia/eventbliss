import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  CreditCard,
  Scale,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Users,
  Lock,
  Gavel,
  ClipboardList,
  Clock,
  Stamp,
  Euro,
  TrendingDown,
  MapPin,
  Building2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const AgencyAgreement = () => {
  const { t } = useTranslation();

  const standardSections = [
    { icon: FileText, key: "preamble" },
    { icon: CheckCircle2, key: "platformServices" },
    { icon: ClipboardList, key: "agencyDuties" },
    { icon: CreditCard, key: "platformFee" },
    { icon: CreditCard, key: "paymentModes" },
  ];

  const closingSections = [
    { icon: Users, key: "qualityCriteria" },
    { icon: Scale, key: "liability" },
    { icon: Lock, key: "dataProtection" },
    { icon: Calendar, key: "termTermination" },
    { icon: Gavel, key: "finalProvisions" },
  ];

  const exclusivityClauses = ["period", "prohibition", "dataPurpose", "penalty", "audit"];
  const cancellationClauses = ["window", "warning", "suspension", "exceptions"];

  // Key numbers shown as a hero strip
  const keyNumbers = [
    { label: "Plattformgebühr", value: "10%", sub: "alle Buchungen", icon: Euro, tone: "violet" },
    { label: "Exklusivität", value: "18", sub: "Monate Sperrfrist", icon: Clock, tone: "cyan" },
    { label: "Warnschwelle", value: "15%", sub: "Stornorate / 30 Tage", icon: TrendingDown, tone: "amber" },
    { label: "Sperrschwelle", value: "20%", sub: "Stornorate / 30 Tage", icon: AlertTriangle, tone: "red" },
    { label: "Vertragsstrafe", value: "2× + 10k€", sub: "pro Vorfall", icon: Gavel, tone: "red" },
  ];

  // TOC entries
  const toc = [
    { num: "1", key: "preamble", label: "Präambel" },
    { num: "2", key: "platformServices", label: "Plattform-Leistungen" },
    { num: "3", key: "agencyDuties", label: "Pflichten der Agentur" },
    { num: "4", key: "platformFee", label: "Plattformgebühr" },
    { num: "5", key: "paymentModes", label: "Zahlungsarten" },
    { num: "6", key: "exclusivity", label: "Exklusivität & Umgehungsschutz", warn: true },
    { num: "7", key: "cancellationRates", label: "Stornoquote", warn: true },
    { num: "8", key: "qualityCriteria", label: "Qualitätskriterien" },
    { num: "9", key: "liability", label: "Haftung" },
    { num: "10", key: "dataProtection", label: "Datenschutz" },
    { num: "11", key: "termTermination", label: "Laufzeit & Kündigung" },
    { num: "12", key: "finalProvisions", label: "Schlussbestimmungen" },
  ];

  const toneClass = (tone: string) =>
    tone === "red"
      ? "from-red-500 to-orange-500 text-red-100"
      : tone === "amber"
      ? "from-amber-500 to-yellow-500 text-amber-100"
      : tone === "cyan"
      ? "from-cyan-500 to-blue-500 text-cyan-100"
      : "from-violet-500 to-fuchsia-500 text-violet-100";

  return (
    <div className="min-h-screen bg-[#0a0612] text-foreground">
      {/* Animated backdrop gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-3xl opacity-25"
             style={{ background: "radial-gradient(circle, rgba(207,150,255,0.4), transparent 60%)" }} />
        <div className="absolute -bottom-1/3 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl opacity-20"
             style={{ background: "radial-gradient(circle, rgba(0,227,253,0.3), transparent 60%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <Link to="/" className="flex items-center gap-3">
            <img src={eventBlissLogo} alt="EventBliss Logo" className="h-9 w-auto" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => typeof window !== "undefined" && window.print()}
              className="hidden sm:inline-flex text-slate-300 hover:text-white print:hidden"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Drucken
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                {t("common.back")}
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-10 sm:py-16 max-w-6xl">
        {/* ============ DOKUMENT-HERO ============ */}
        <section className="relative mb-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#1a1326]/80 via-[#14101f]/80 to-[#1a1326]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Seal watermark */}
          <div className="absolute -top-12 -right-12 opacity-[0.08] pointer-events-none">
            <Stamp className="w-64 h-64 text-violet-300" strokeWidth={1} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-violet-500/20 text-violet-200 border border-violet-400/30">
                <Stamp className="w-3 h-3" /> Partner Agreement
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-white/5 text-slate-300 border border-white/10">
                v2026-04 · DE
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-['Be_Vietnam_Pro'] tracking-tight bg-gradient-to-br from-white via-slate-200 to-violet-200 bg-clip-text text-transparent mb-3">
              {t("legal.agency_agreement.title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("legal.agency_agreement.lastUpdated")}: April 2026 · Stand April 2026
            </p>
          </div>

          {/* Parties panel */}
          <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-300 mb-3">
                <Building2 className="w-3.5 h-3.5" /> Plattform-Betreiberin
              </div>
              <p className="text-sm font-bold text-white leading-snug">MYFAMBLISS GROUP LTD</p>
              <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Gladstonos 12-14, 8046 Paphos, Cyprus
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Registriert im Handelsregister der Republik Zypern
              </p>
              <p className="text-[11px] italic text-slate-500 mt-2 leading-relaxed">
                „EventBliss" ist eine Marke und ein Produkt der MYFAMBLISS GROUP LTD.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 border-dashed">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-3">
                <Users className="w-3.5 h-3.5" /> Vertragspartner / Agentur
              </div>
              <p className="text-sm font-bold text-white/80 leading-snug">
                Die registrierte Event-Dienstleistungs-Agentur
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Akzeptanz durch Aktivierung des Agentur-Profils auf EventBliss.
              </p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Name, Anschrift und USt-ID der Agentur werden bei Registrierung erfasst und sind Bestandteil dieses Vertrages.
              </p>
            </div>
          </div>

          {/* Intro + parties text from i18n */}
          <div className="relative mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-slate-300 leading-relaxed">
              {t("legal.agency_agreement.intro")}
            </p>
            <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">
              {t("legal.agency_agreement.parties")}
            </p>
          </div>
        </section>

        {/* ============ KEY NUMBERS ============ */}
        <section className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3 font-semibold">
            Kennzahlen auf einen Blick
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {keyNumbers.map((k) => (
              <div
                key={k.label}
                className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${toneClass(k.tone)} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity`} />
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${toneClass(k.tone)} flex items-center justify-center mb-2.5 opacity-80`}>
                    <k.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{k.label}</div>
                  <div className="text-2xl font-black text-white mt-1 leading-none tracking-tight">{k.value}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ LAYOUT: TOC sidebar + Content ============ */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* TOC */}
          <aside className="hidden lg:block print:hidden">
            <nav className="sticky top-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                Inhaltsverzeichnis
              </div>
              <ol className="space-y-2">
                {toc.map((entry) => (
                  <li key={entry.num}>
                    <a
                      href={`#sec-${entry.key}`}
                      className={`flex items-start gap-2 text-xs leading-tight py-1 transition-colors ${
                        entry.warn ? "text-amber-300 hover:text-amber-200" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        entry.warn ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-slate-400"
                      }`}>
                        {entry.num}
                      </span>
                      <span>{entry.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-6">
            {/* Sections 1-5: standard */}
            {standardSections.map((section, index) => (
              <section
                key={section.key}
                id={`sec-${section.key}`}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm scroll-mt-24"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-sm font-black text-white">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-violet-300/70 font-semibold mb-1">
                      <section.icon className="w-3 h-3" /> Standard-Klausel
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {t(`legal.agency_agreement.${section.key}.title`)}
                    </h2>
                  </div>
                </div>
                <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed pl-0 sm:pl-14">
                  {t(`legal.agency_agreement.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* ============ SECTION 6: EXCLUSIVITY (critical) ============ */}
            <section
              id="sec-exclusivity"
              className="relative rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl shadow-red-500/10 scroll-mt-24"
            >
              {/* Severity stripe */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
              <div className="p-6 bg-gradient-to-br from-red-950/60 via-red-950/40 to-amber-950/30">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-red-300 font-bold mb-2">
                  <AlertTriangle className="w-3 h-3" /> Kritische Klausel · Vertragsstrafe bewehrt
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[10px] uppercase tracking-widest text-red-300/80 font-semibold">
                      Abschnitt 6
                    </div>
                    <h2 className="text-2xl font-black text-red-100 leading-tight">
                      {t("legal.agency_agreement.exclusivity.title")}
                    </h2>
                  </div>
                </div>
                <p className="text-amber-100/95 font-medium whitespace-pre-line text-sm leading-relaxed mb-5 p-4 rounded-xl bg-black/40 border border-red-500/30">
                  {t("legal.agency_agreement.exclusivity.leadIn")}
                </p>

                {/* Visual: 18-month exclusivity timeline */}
                <div className="mb-5 p-4 rounded-xl bg-black/30 border border-red-500/20">
                  <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-red-200 mb-2">
                    <span>ERSTKONTAKT</span>
                    <span>18 MONATE EXKLUSIVITÄT</span>
                    <span>ENDE</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-red-950 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-red-300/80 mt-2">
                    <span>Buchungsanfrage</span>
                    <span>Nur über Plattform buchbar</span>
                    <span>Frei</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {exclusivityClauses.map((clause, idx) => (
                    <div
                      key={clause}
                      className="p-4 rounded-xl bg-black/40 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-md bg-red-500/25 text-red-200 text-[11px] font-black flex items-center justify-center">
                          6.{idx + 1}
                        </span>
                        <h3 className="text-red-100 font-bold text-sm leading-tight">
                          {t(`legal.agency_agreement.exclusivity.${clause}.title`)}
                        </h3>
                      </div>
                      <p className="text-red-50/90 whitespace-pre-line text-[13px] leading-relaxed pl-9">
                        {t(`legal.agency_agreement.exclusivity.${clause}.content`)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Penalty highlight card */}
                <div className="mt-5 p-5 rounded-xl bg-gradient-to-br from-red-600/30 to-orange-600/20 border-2 border-red-400/40">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-red-200 font-bold mb-3">
                    <Gavel className="w-3 h-3" /> Vertragsstrafe bei Verstoß
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-black/30">
                      <div className="text-3xl font-black text-white">2×</div>
                      <div className="text-[11px] text-red-200 mt-1">Buchungswert (min. 500 €)</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30">
                      <div className="text-3xl font-black text-white">+ 10.000 €</div>
                      <div className="text-[11px] text-red-200 mt-1">Pauschale je Vorfall</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ============ SECTION 7: CANCELLATION RATES ============ */}
            <section
              id="sec-cancellationRates"
              className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 scroll-mt-24"
            >
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
              <div className="p-6 bg-gradient-to-br from-amber-950/50 via-amber-950/30 to-yellow-950/20">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-300 font-bold mb-2">
                  <AlertTriangle className="w-3 h-3" /> Qualitäts-Schwellwerte · Sperrung möglich
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[10px] uppercase tracking-widest text-amber-300/80 font-semibold">
                      Abschnitt 7
                    </div>
                    <h2 className="text-2xl font-black text-amber-100 leading-tight">
                      {t("legal.agency_agreement.cancellationRates.title")}
                    </h2>
                  </div>
                </div>
                <p className="text-amber-100/95 font-medium whitespace-pre-line text-sm leading-relaxed mb-5 p-4 rounded-xl bg-black/40 border border-amber-500/30">
                  {t("legal.agency_agreement.cancellationRates.leadIn")}
                </p>

                {/* Risk matrix visual */}
                <div className="mb-5 grid grid-cols-3 gap-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">OK</div>
                    <div className="text-2xl font-black text-emerald-100 mt-1">≤ 15%</div>
                    <div className="text-[10px] text-emerald-200/70 mt-1">Normaler Betrieb</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">WARNING</div>
                    <div className="text-2xl font-black text-amber-100 mt-1">&gt; 15%</div>
                    <div className="text-[10px] text-amber-200/70 mt-1">Pflicht-Gespräch 14 T.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-red-300 font-bold">CRITICAL</div>
                    <div className="text-2xl font-black text-red-100 mt-1">&gt; 20%</div>
                    <div className="text-[10px] text-red-200/70 mt-1">Sperrung nach 7 T.</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {cancellationClauses.map((clause, idx) => (
                    <div
                      key={clause}
                      className="p-4 rounded-xl bg-black/40 border border-amber-500/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-md bg-amber-500/25 text-amber-200 text-[11px] font-black flex items-center justify-center">
                          7.{idx + 1}
                        </span>
                        <h3 className="text-amber-100 font-bold text-sm leading-tight flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {t(`legal.agency_agreement.cancellationRates.${clause}.title`)}
                        </h3>
                      </div>
                      <p className="text-amber-50/90 whitespace-pre-line text-[13px] leading-relaxed pl-9">
                        {t(`legal.agency_agreement.cancellationRates.${clause}.content`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sections 8-12: standard */}
            {closingSections.map((section, index) => (
              <section
                key={section.key}
                id={`sec-${section.key}`}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm scroll-mt-24"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-sm font-black text-white">{index + 8}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-violet-300/70 font-semibold mb-1">
                      <section.icon className="w-3 h-3" /> Standard-Klausel
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {t(`legal.agency_agreement.${section.key}.title`)}
                    </h2>
                  </div>
                </div>
                <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed pl-0 sm:pl-14">
                  {t(`legal.agency_agreement.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* ============ COMPLIANCE CONTACT ============ */}
            <section className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/15 via-cyan-600/10 to-violet-600/15 border border-violet-400/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {t("legal.agency_agreement.compliance.title")}
                </h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                {t("legal.agency_agreement.compliance.content")}
              </p>
              <a
                href="mailto:compliance@event-bliss.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-400/40 font-mono text-sm text-violet-200 hover:text-white hover:bg-violet-500/25 transition-colors"
              >
                compliance@event-bliss.com
              </a>
            </section>

            {/* ============ SIGNATURE / ACCEPTANCE BLOCK ============ */}
            <section className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-2 border-dashed border-white/20 overflow-hidden">
              <div className="absolute -bottom-6 -right-6 opacity-[0.08] pointer-events-none">
                <Stamp className="w-48 h-48 text-violet-300" strokeWidth={1} />
              </div>
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-4">
                  Annahme & Unterzeichnung
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Mit Aktivierung des Agentur-Profils auf EventBliss bestätigt die Agentur rechtsverbindlich, diesen Vertrag in der vorliegenden Fassung gelesen, verstanden und akzeptiert zu haben. Die Akzeptanz wird elektronisch dokumentiert und ersetzt eine handschriftliche Unterschrift im Sinne der elektronischen Signaturregelungen der EU (eIDAS).
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="pt-8 border-t-2 border-slate-500/50">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                      Für die Plattform
                    </div>
                    <div className="font-mono text-sm text-slate-300 mt-1">MYFAMBLISS GROUP LTD</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Paphos, Cyprus</div>
                  </div>
                  <div className="pt-8 border-t-2 border-slate-500/50">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                      Für die Agentur
                    </div>
                    <div className="font-mono text-sm text-slate-300 mt-1">
                      [Elektronische Akzeptanz bei Onboarding]
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Datum, Rechtsverbindlicher Vertreter</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-black/30 py-8 mt-16 print:hidden">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500 max-w-6xl">
          <p>© 2026 MYFAMBLISS GROUP LTD · Gladstonos 12-14, 8046 Paphos, Cyprus · {t("legal.agency_agreement.rightsReserved")}</p>
          <p className="mt-1 text-slate-600">
            Dieses Dokument ist rechtlich bindend in seiner deutschen Fassung. Vertragssprache Deutsch.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AgencyAgreement;
