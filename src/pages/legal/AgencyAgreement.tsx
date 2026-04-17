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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const AgencyAgreement = () => {
  const { t } = useTranslation();

  // Standard sections (neutral/informative)
  const standardSections = [
    { icon: FileText, key: "preamble" },
    { icon: CheckCircle2, key: "platformServices" },
    { icon: ClipboardList, key: "agencyDuties" },
    { icon: CreditCard, key: "platformFee" },
    { icon: CreditCard, key: "paymentModes" },
  ];

  // Critical sections (warn-styled — exclusivity, cancellations)
  const criticalSections = [
    { icon: ShieldCheck, key: "exclusivity" },
    { icon: AlertTriangle, key: "cancellationRates" },
  ];

  // Remaining sections
  const closingSections = [
    { icon: Users, key: "qualityCriteria" },
    { icon: Scale, key: "liability" },
    { icon: Lock, key: "dataProtection" },
    { icon: Calendar, key: "termTermination" },
    { icon: Gavel, key: "finalProvisions" },
  ];

  // Exclusivity sub-clauses
  const exclusivityClauses = ["period", "prohibition", "dataPurpose", "penalty", "audit"];

  // Cancellation sub-clauses
  const cancellationClauses = ["window", "warning", "suspension", "exceptions"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={eventBlissLogo} alt="EventBliss Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Link>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {t("legal.agency_agreement.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("legal.agency_agreement.lastUpdated")}: April 2026
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-4">
            {t("legal.agency_agreement.intro")}
          </p>
          <p className="text-sm text-muted-foreground mb-8 italic">
            {t("legal.agency_agreement.parties")}
          </p>

          <div className="space-y-8">
            {/* Sections 1-5: standard */}
            {standardSections.map((section, index) => (
              <section
                key={section.key}
                className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {index + 1}. {t(`legal.agency_agreement.${section.key}.title`)}
                  </h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {t(`legal.agency_agreement.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* Section 6: EXKLUSIVITÄT UND UMGEHUNGSSCHUTZ — red/amber warn styling */}
            <section className="p-6 rounded-2xl bg-gradient-to-br from-red-950/40 to-amber-950/30 border-2 border-red-500/40 shadow-lg shadow-red-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-red-200">
                  6. {t("legal.agency_agreement.exclusivity.title")}
                </h2>
              </div>
              <p className="text-amber-100/90 mb-6 font-medium whitespace-pre-line">
                {t("legal.agency_agreement.exclusivity.leadIn")}
              </p>
              <div className="space-y-4">
                {exclusivityClauses.map((clause, idx) => (
                  <div
                    key={clause}
                    className="p-4 rounded-xl bg-black/30 border border-red-500/20"
                  >
                    <h3 className="text-red-200 font-semibold mb-2">
                      6.{idx + 1} {t(`legal.agency_agreement.exclusivity.${clause}.title`)}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line text-sm">
                      {t(`legal.agency_agreement.exclusivity.${clause}.content`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 7: Stornoquoten — amber warn styling */}
            <section className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-amber-200">
                  7. {t("legal.agency_agreement.cancellationRates.title")}
                </h2>
              </div>
              <p className="text-amber-100/90 mb-6 font-medium whitespace-pre-line">
                {t("legal.agency_agreement.cancellationRates.leadIn")}
              </p>
              <div className="space-y-4">
                {cancellationClauses.map((clause, idx) => (
                  <div
                    key={clause}
                    className="p-4 rounded-xl bg-black/30 border border-amber-500/20"
                  >
                    <h3 className="text-amber-200 font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      7.{idx + 1}{" "}
                      {t(`legal.agency_agreement.cancellationRates.${clause}.title`)}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line text-sm">
                      {t(`legal.agency_agreement.cancellationRates.${clause}.content`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Sections 8-12: standard */}
            {closingSections.map((section, index) => (
              <section
                key={section.key}
                className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {index + 8}. {t(`legal.agency_agreement.${section.key}.title`)}
                  </h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {t(`legal.agency_agreement.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* Compliance contact */}
            <section className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-violet-400" />
                <h2 className="text-xl font-semibold">
                  {t("legal.agency_agreement.compliance.title")}
                </h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {t("legal.agency_agreement.compliance.content")}
              </p>
              <p className="text-violet-300 font-mono mt-4 text-sm">
                compliance@event-bliss.com
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 MYFAMBLISS GROUP LTD. {t("legal.agency_agreement.rightsReserved")}</p>
        </div>
      </footer>
    </div>
  );
};

export default AgencyAgreement;
