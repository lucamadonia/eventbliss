import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  Clock,
  Gavel,
  Bell,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgency } from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

// ---------------------------------------------------------------------------
// Agency party — data sources (in order): logged-in user's agency → URL query
// params → placeholder. This keeps the document self-identifying when the
// agency opens it from their dashboard or via a signed invitation link.
// ---------------------------------------------------------------------------

interface PartyData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  regNo?: string;
  vatId?: string;
  contactEmail?: string;
  contactName?: string;
  website?: string;
}

function useAgencyParty(): { party: PartyData | null; source: "session" | "query" | null } {
  const { user } = useAuth();
  const { agency } = useAgency();
  const [params] = useSearchParams();

  // 1. Session: logged-in agency member
  if (user && agency) {
    return {
      source: "session",
      party: {
        name: agency.name,
        contactName: (user as { user_metadata?: { full_name?: string } })?.user_metadata?.full_name || user.email || undefined,
        contactEmail: user.email ?? undefined,
      },
    };
  }

  // 2. Query params (signed invitation link)
  const q = {
    name: params.get("agency"),
    address: params.get("address"),
    city: params.get("city"),
    country: params.get("country"),
    regNo: params.get("regno") || params.get("regNo"),
    vatId: params.get("vat") || params.get("vatId"),
    contactEmail: params.get("email"),
    contactName: params.get("rep") || params.get("contact"),
    website: params.get("web") || params.get("website"),
  };
  if (q.name) {
    return {
      source: "query",
      party: {
        name: q.name,
        address: q.address ?? undefined,
        city: q.city ?? undefined,
        country: q.country ?? undefined,
        regNo: q.regNo ?? undefined,
        vatId: q.vatId ?? undefined,
        contactEmail: q.contactEmail ?? undefined,
        contactName: q.contactName ?? undefined,
        website: q.website ?? undefined,
      },
    };
  }

  return { party: null, source: null };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AgencyAgreement = () => {
  const { t } = useTranslation();
  const ui = (k: string) => t(`legal.agency_agreement.ui.${k}`);
  const { party: agencyParty, source: agencySource } = useAgencyParty();

  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const standardSections = [
    { key: "preamble" },
    { key: "platformServices" },
    { key: "agencyDuties" },
    { key: "platformFee" },
    { key: "paymentModes" },
  ];
  const closingSections = [
    { key: "qualityCriteria" },
    { key: "liability" },
    { key: "dataProtection" },
    { key: "termTermination" },
    { key: "finalProvisions" },
  ];
  const exclusivityClauses = ["period", "prohibition", "dataPurpose", "penalty", "audit"];
  const cancellationClauses = ["window", "warning", "suspension", "exceptions"];

  const toc = [
    { num: "1", key: "preamble", label: ui("tocPreamble") },
    { num: "2", key: "platformServices", label: ui("tocPlatformServices") },
    { num: "3", key: "agencyDuties", label: ui("tocAgencyDuties") },
    { num: "4", key: "platformFee", label: ui("tocPlatformFee") },
    { num: "5", key: "paymentModes", label: ui("tocPaymentModes") },
    { num: "6", key: "exclusivity", label: ui("tocExclusivity"), warn: true },
    { num: "7", key: "cancellationRates", label: ui("tocCancellationRates"), warn: true },
    { num: "8", key: "qualityCriteria", label: ui("tocQualityCriteria") },
    { num: "9", key: "liability", label: ui("tocLiability") },
    { num: "10", key: "dataProtection", label: ui("tocDataProtection") },
    { num: "11", key: "termTermination", label: ui("tocTermTermination") },
    { num: "12", key: "finalProvisions", label: ui("tocFinalProvisions") },
  ];

  return (
    <div className="min-h-screen bg-[#0a0612] text-white print:bg-white">
      {/* Outer page — kept dark, so the "paper" card stands out. In print,
          everything goes light for clean output. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-20 print:hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(207,150,255,0.25), transparent 60%), radial-gradient(ellipse at bottom, rgba(0,227,253,0.15), transparent 60%)",
        }}
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl print:hidden">
        <nav className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={eventBlissLogo} alt="EventBliss" className="h-9 w-auto" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => typeof window !== "undefined" && window.print()}
              className="hidden sm:inline-flex text-slate-300 hover:text-white"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              {ui("printButton")}
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

      {/* Paper document */}
      <main className="relative z-10 container mx-auto max-w-[920px] px-4 sm:px-6 py-8 sm:py-12 print:py-0 print:px-0 print:max-w-full">
        <article
          className="relative bg-[#fbf8f1] text-[#1a1410] rounded-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8),0_8px_24px_-12px_rgba(207,150,255,0.15)] print:shadow-none print:rounded-none overflow-hidden"
          style={{
            fontFamily:
              '"Source Serif 4","Source Serif Pro","Charter","Iowan Old Style","Palatino Linotype","Georgia",serif',
          }}
        >
          {/* Letterhead strip */}
          <div className="h-1.5 bg-gradient-to-r from-[#6b5b95] via-[#c8a27a] to-[#6b5b95] print:hidden" />

          <div className="px-8 sm:px-14 py-10 sm:py-14">
            {/* Letterhead */}
            <header className="border-b border-[#1a1410]/15 pb-8 mb-10">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b95] font-bold font-sans">
                    MYFAMBLISS GROUP LTD
                  </div>
                  <div className="text-[11px] text-[#1a1410]/60 mt-1 font-sans leading-snug">
                    Gladstonos 12-14 · 8046 Paphos · Cyprus<br />
                    Reg. No. HE 473088 · VAT ID CY60165018Q · www.mfg.cy
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#1a1410]/50 font-sans font-semibold">
                    {ui("partnerBadge")}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1410]/50 mt-1">
                    {ui("versionBadge")}
                  </div>
                </div>
              </div>
            </header>

            {/* Title */}
            <div className="text-center mb-10">
              <div className="text-[11px] uppercase tracking-[0.35em] text-[#6b5b95] font-bold font-sans mb-3">
                Agreement · Vertragsdokument
              </div>
              <h1 className="text-3xl sm:text-[2.65rem] font-bold leading-[1.1] text-[#1a1410] tracking-tight">
                {t("legal.agency_agreement.title")}
              </h1>
              <div className="mt-4 inline-flex items-center gap-3 text-xs text-[#1a1410]/60 font-sans">
                <span>{ui("asOfLabel")} {today}</span>
                <span className="w-1 h-1 rounded-full bg-[#1a1410]/30" />
                <span>{ui("lastUpdatedLabel")}: April 2026</span>
              </div>
            </div>

            {/* Parties */}
            <section className="mb-10 grid sm:grid-cols-2 gap-0 border border-[#1a1410]/15 rounded-lg overflow-hidden">
              <div className="p-6 border-b sm:border-b-0 sm:border-r border-[#1a1410]/15">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b95] font-bold font-sans mb-3">
                  {ui("platformLabel")} · Partei 1
                </div>
                <p className="font-bold text-[#1a1410] leading-snug">MYFAMBLISS GROUP LTD</p>
                <p className="text-sm text-[#1a1410]/75 mt-1 leading-relaxed">
                  Gladstonos 12-14<br />
                  8046 Paphos, Cyprus
                </p>
                <dl className="mt-3 text-[11px] font-sans space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1a1410]/55">Reg. No.</dt>
                    <dd className="font-mono text-[#1a1410]/90">HE 473088</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1a1410]/55">VAT ID</dt>
                    <dd className="font-mono text-[#1a1410]/90">CY60165018Q</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1a1410]/55">Website</dt>
                    <dd className="text-[#1a1410]/90">www.mfg.cy</dd>
                  </div>
                </dl>
                <p className="text-[10px] italic text-[#1a1410]/55 mt-3 leading-relaxed font-sans">
                  {ui("platformBrand")}
                </p>
              </div>
              <div className="p-6 relative">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c8a27a] font-bold font-sans mb-3">
                  {ui("agencyLabel")} · Partei 2
                </div>
                {agencyParty ? (
                  <>
                    <p className="font-bold text-[#1a1410] leading-snug">{agencyParty.name}</p>
                    {(agencyParty.address || agencyParty.city || agencyParty.country) && (
                      <p className="text-sm text-[#1a1410]/75 mt-1 leading-relaxed">
                        {agencyParty.address ?? "—"}<br />
                        {[agencyParty.city, agencyParty.country].filter(Boolean).join(", ") || "—"}
                      </p>
                    )}
                    <dl className="mt-3 text-[11px] font-sans space-y-0.5">
                      {agencyParty.regNo && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#1a1410]/55">Reg. No.</dt>
                          <dd className="font-mono text-[#1a1410]/90">{agencyParty.regNo}</dd>
                        </div>
                      )}
                      {agencyParty.vatId && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#1a1410]/55">VAT ID</dt>
                          <dd className="font-mono text-[#1a1410]/90">{agencyParty.vatId}</dd>
                        </div>
                      )}
                      {agencyParty.contactEmail && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#1a1410]/55">E-Mail</dt>
                          <dd className="text-[#1a1410]/90">{agencyParty.contactEmail}</dd>
                        </div>
                      )}
                      {agencyParty.contactName && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#1a1410]/55">Vertreter</dt>
                          <dd className="text-[#1a1410]/90">{agencyParty.contactName}</dd>
                        </div>
                      )}
                      {agencyParty.website && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#1a1410]/55">Website</dt>
                          <dd className="text-[#1a1410]/90">{agencyParty.website}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="text-[10px] italic text-[#1a1410]/55 mt-3 leading-relaxed font-sans">
                      Angaben {agencySource === "session" ? "aus der Agentur-Session" : "aus dem Vertragslink"} übernommen. Weitere Pflichtangaben werden bei Onboarding erfasst und Bestandteil dieses Vertrages.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#1a1410]/50 leading-snug italic">
                      [Agentur-Name wird bei Onboarding ausgefüllt]
                    </p>
                    <p className="text-sm text-[#1a1410]/50 mt-1 leading-relaxed italic">
                      Anschrift · Stadt, Land<br />
                      Handelsregister-Nr. · USt-IdNr.
                    </p>
                    <p className="text-[10px] italic text-[#1a1410]/55 mt-3 leading-relaxed font-sans">
                      Die verbindliche Identifikation der Agentur (Firmenname, Rechtsform, Anschrift, Handelsregister-Nummer, USt-IdNr., vertretungsberechtigte Person) erfolgt bei der Aktivierung des Agentur-Profils und ist integraler Bestandteil dieses Vertrages.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* Preamble text */}
            <div className="mb-10 text-[15px] leading-[1.75] text-[#1a1410]/85">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-[0.95] first-letter:text-[#6b5b95]">
                {t("legal.agency_agreement.intro")}
              </p>
              <p className="text-[13px] italic text-[#1a1410]/65 mt-4 leading-relaxed">
                {t("legal.agency_agreement.parties")}
              </p>
            </div>

            {/* TOC */}
            <section className="mb-10 p-5 rounded-lg bg-[#1a1410]/[0.035] border border-[#1a1410]/10 print:break-inside-avoid">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#1a1410]/60 font-bold font-sans mb-3">
                {ui("tocTitle")}
              </div>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {toc.map((entry) => (
                  <li key={entry.num}>
                    <a
                      href={`#sec-${entry.key}`}
                      className={`flex items-baseline gap-2 text-sm py-0.5 transition-colors ${
                        entry.warn
                          ? "text-[#a0432a] hover:text-[#7a321f] font-medium"
                          : "text-[#1a1410]/80 hover:text-[#1a1410]"
                      }`}
                    >
                      <span className="flex-shrink-0 w-6 text-right font-mono text-[11px] text-[#1a1410]/45">
                        §{entry.num}
                      </span>
                      <span className="flex-1">{entry.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            {/* Sections 1–5 */}
            <div className="space-y-10">
              {standardSections.map((section, index) => (
                <section
                  key={section.key}
                  id={`sec-${section.key}`}
                  className="scroll-mt-24 print:break-inside-avoid"
                >
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-mono text-[11px] text-[#6b5b95] font-bold tracking-wider uppercase pt-1 flex-shrink-0 w-12">
                      § {index + 1}
                    </span>
                    <h2 className="text-xl font-bold text-[#1a1410] tracking-tight flex-1">
                      {t(`legal.agency_agreement.${section.key}.title`)}
                    </h2>
                  </div>
                  <p className="text-[14.5px] text-[#1a1410]/85 whitespace-pre-line leading-[1.75] pl-0 sm:pl-16">
                    {t(`legal.agency_agreement.${section.key}.content`)}
                  </p>
                </section>
              ))}

              {/* § 6 — Exclusivity (subtle red-left-border) */}
              <section
                id="sec-exclusivity"
                className="scroll-mt-24 border-l-4 border-[#a0432a] pl-6 print:break-inside-avoid"
              >
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-mono text-[11px] text-[#a0432a] font-bold tracking-wider uppercase pt-1 flex-shrink-0 w-12">
                    § 6
                  </span>
                  <h2 className="text-xl font-bold text-[#1a1410] tracking-tight flex-1 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#a0432a] flex-shrink-0" />
                    {t("legal.agency_agreement.exclusivity.title")}
                  </h2>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#a0432a] font-bold font-sans mb-4 pl-0 sm:pl-16">
                  {ui("clauseCriticalExcl")}
                </div>
                <p className="text-[14px] text-[#1a1410]/85 italic mb-5 leading-[1.7] pl-0 sm:pl-16">
                  {t("legal.agency_agreement.exclusivity.leadIn")}
                </p>

                <div className="pl-0 sm:pl-16 space-y-5">
                  {exclusivityClauses.map((clause, idx) => (
                    <div key={clause}>
                      <h3 className="font-bold text-[#1a1410] mb-1.5 text-[15px]">
                        <span className="font-mono text-[11px] text-[#a0432a] mr-2">§ 6.{idx + 1}</span>
                        {t(`legal.agency_agreement.exclusivity.${clause}.title`)}
                      </h3>
                      <p className="text-[14px] text-[#1a1410]/85 whitespace-pre-line leading-[1.7]">
                        {t(`legal.agency_agreement.exclusivity.${clause}.content`)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Penalty emphasis */}
                <div className="mt-6 pl-0 sm:pl-16">
                  <div className="bg-[#a0432a]/5 border border-[#a0432a]/25 rounded-lg p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#a0432a] font-bold font-sans mb-3 flex items-center gap-2">
                      <Gavel className="w-3 h-3" /> {ui("penaltyHeader")}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-[#1a1410]">2×</div>
                        <div className="text-[11px] text-[#1a1410]/65 mt-0.5 font-sans">
                          {ui("penaltyDoubleLabel")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#1a1410]">+ 10.000 €</div>
                        <div className="text-[11px] text-[#1a1410]/65 mt-0.5 font-sans">
                          {ui("penaltyFlatLabel")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* § 7 — Cancellation rates */}
              <section
                id="sec-cancellationRates"
                className="scroll-mt-24 border-l-4 border-[#c8a27a] pl-6 print:break-inside-avoid"
              >
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-mono text-[11px] text-[#c8a27a] font-bold tracking-wider uppercase pt-1 flex-shrink-0 w-12">
                    § 7
                  </span>
                  <h2 className="text-xl font-bold text-[#1a1410] tracking-tight flex-1 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-[#c8a27a] flex-shrink-0" />
                    {t("legal.agency_agreement.cancellationRates.title")}
                  </h2>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c8a27a] font-bold font-sans mb-4 pl-0 sm:pl-16">
                  {ui("clauseCriticalCanc")}
                </div>
                <p className="text-[14px] text-[#1a1410]/85 italic mb-5 leading-[1.7] pl-0 sm:pl-16">
                  {t("legal.agency_agreement.cancellationRates.leadIn")}
                </p>

                {/* Threshold table */}
                <div className="pl-0 sm:pl-16 mb-6">
                  <table className="w-full text-sm border border-[#1a1410]/15 font-sans">
                    <thead className="bg-[#1a1410]/[0.04]">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-[#1a1410]/70 text-[11px] uppercase tracking-wider">Stornorate (30 T.)</th>
                        <th className="text-left px-3 py-2 font-semibold text-[#1a1410]/70 text-[11px] uppercase tracking-wider">Status</th>
                        <th className="text-left px-3 py-2 font-semibold text-[#1a1410]/70 text-[11px] uppercase tracking-wider">Konsequenz</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#1a1410]/10">
                        <td className="px-3 py-2 font-mono">≤ 15 %</td>
                        <td className="px-3 py-2 text-emerald-700 font-semibold">{ui("riskOk")}</td>
                        <td className="px-3 py-2 text-[#1a1410]/75">{ui("riskOkSub")}</td>
                      </tr>
                      <tr className="border-t border-[#1a1410]/10 bg-[#c8a27a]/5">
                        <td className="px-3 py-2 font-mono">&gt; 15 %</td>
                        <td className="px-3 py-2 text-[#8a6d3d] font-semibold">{ui("riskWarning")}</td>
                        <td className="px-3 py-2 text-[#1a1410]/75">{ui("riskWarningSub")}</td>
                      </tr>
                      <tr className="border-t border-[#1a1410]/10 bg-[#a0432a]/5">
                        <td className="px-3 py-2 font-mono">&gt; 20 %</td>
                        <td className="px-3 py-2 text-[#a0432a] font-semibold">{ui("riskCritical")}</td>
                        <td className="px-3 py-2 text-[#1a1410]/75">{ui("riskCriticalSub")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pl-0 sm:pl-16 space-y-5">
                  {cancellationClauses.map((clause, idx) => (
                    <div key={clause}>
                      <h3 className="font-bold text-[#1a1410] mb-1.5 text-[15px] flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#c8a27a]">§ 7.{idx + 1}</span>
                        <Clock className="w-3.5 h-3.5 text-[#c8a27a]/70" />
                        {t(`legal.agency_agreement.cancellationRates.${clause}.title`)}
                      </h3>
                      <p className="text-[14px] text-[#1a1410]/85 whitespace-pre-line leading-[1.7]">
                        {t(`legal.agency_agreement.cancellationRates.${clause}.content`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sections 8–12 */}
              {closingSections.map((section, index) => (
                <section
                  key={section.key}
                  id={`sec-${section.key}`}
                  className="scroll-mt-24 print:break-inside-avoid"
                >
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-mono text-[11px] text-[#6b5b95] font-bold tracking-wider uppercase pt-1 flex-shrink-0 w-12">
                      § {index + 8}
                    </span>
                    <h2 className="text-xl font-bold text-[#1a1410] tracking-tight flex-1">
                      {t(`legal.agency_agreement.${section.key}.title`)}
                    </h2>
                  </div>
                  <p className="text-[14.5px] text-[#1a1410]/85 whitespace-pre-line leading-[1.75] pl-0 sm:pl-16">
                    {t(`legal.agency_agreement.${section.key}.content`)}
                  </p>
                </section>
              ))}

              {/* Compliance */}
              <section className="border-t border-[#1a1410]/15 pt-8 print:break-inside-avoid">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] text-[#6b5b95] font-bold tracking-wider uppercase pt-1 flex-shrink-0 w-12">
                    <Bell className="w-4 h-4 inline" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#1a1410] mb-2">
                      {t("legal.agency_agreement.compliance.title")}
                    </h2>
                    <p className="text-[14px] text-[#1a1410]/85 leading-[1.7]">
                      {t("legal.agency_agreement.compliance.content")}
                    </p>
                    <p className="mt-3 font-mono text-[14px] text-[#6b5b95]">
                      compliance@event-bliss.com
                    </p>
                  </div>
                </div>
              </section>

              {/* Signature block */}
              <section
                id="sec-signatures"
                className="mt-12 pt-10 border-t-2 border-double border-[#1a1410]/25 print:break-inside-avoid"
              >
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#1a1410]/55 font-bold font-sans mb-6 text-center">
                  {ui("signatureHeading")}
                </div>
                <p className="text-[13px] text-[#1a1410]/75 leading-[1.7] mb-10 max-w-2xl mx-auto text-center italic">
                  {ui("signatureBody")}
                </p>
                <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
                  <div>
                    <div className="h-16 border-b border-[#1a1410]/40 flex items-end pb-1">
                      <span className="text-[#1a1410] font-bold">MYFAMBLISS GROUP LTD</span>
                    </div>
                    <div className="text-[10px] text-[#1a1410]/55 mt-2 font-sans uppercase tracking-wider">
                      {ui("signatureForPlatform")}
                    </div>
                    <div className="text-[11px] text-[#1a1410]/55 mt-0.5 font-sans">
                      Paphos, Cyprus · {today}
                    </div>
                    <div className="text-[10px] text-[#1a1410]/40 mt-3 font-sans italic">
                      Elektronisch signiert · eIDAS
                    </div>
                  </div>
                  <div>
                    <div className="h-16 border-b border-[#1a1410]/40 flex items-end pb-1">
                      {agencyParty ? (
                        <span className="text-[#1a1410] font-bold">{agencyParty.name}</span>
                      ) : (
                        <span className="text-[#1a1410]/35 italic">[Agentur]</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#1a1410]/55 mt-2 font-sans uppercase tracking-wider">
                      {ui("signatureForAgency")}
                    </div>
                    <div className="text-[11px] text-[#1a1410]/55 mt-0.5 font-sans">
                      {agencyParty?.contactName || ui("signatureDateRep")}
                      {agencyParty && <> · {today}</>}
                    </div>
                    <div className="text-[10px] text-[#1a1410]/40 mt-3 font-sans italic">
                      {agencyParty
                        ? "Elektronisch angenommen bei Onboarding · eIDAS"
                        : ui("signatureElectronic")}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Document footer */}
            <footer className="mt-14 pt-6 border-t border-[#1a1410]/15 text-center text-[11px] text-[#1a1410]/55 font-sans leading-relaxed">
              <p className="italic">{ui("footerBinding")}</p>
              <p className="mt-1">
                © 2026 MYFAMBLISS GROUP LTD · Gladstonos 12-14, 8046 Paphos, Cyprus · HE 473088 · CY60165018Q
              </p>
            </footer>
          </div>

          {/* Bottom edge accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#6b5b95] via-[#c8a27a] to-[#6b5b95] print:hidden" />
        </article>

        {/* Compliance quick access — below document, dark page again */}
        <div className="mt-6 text-center text-xs text-slate-400 print:hidden">
          <span className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            Verdacht auf Vertragsverstoß?&nbsp;
            <a
              href="mailto:compliance@event-bliss.com"
              className="text-violet-300 hover:text-violet-200 underline"
            >
              compliance@event-bliss.com
            </a>
          </span>
        </div>
      </main>
    </div>
  );
};

export default AgencyAgreement;
