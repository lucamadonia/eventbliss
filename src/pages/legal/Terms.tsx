import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, XCircle, CreditCard, Scale, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const Terms = () => {
  const { t } = useTranslation();

  const sections = [
    { icon: CheckCircle2, key: "acceptance" },
    { icon: FileText, key: "services" },
    { icon: CreditCard, key: "payment" },
    { icon: XCircle, key: "prohibited" },
    { icon: Scale, key: "liability" },
    { icon: Bell, key: "changes" },
  ];

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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {t("legal.terms.title")}
            </h1>
            <p className="text-muted-foreground">{t("legal.terms.lastUpdated")}: January 2025</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            {t("legal.terms.intro")}
          </p>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={section.key} className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {index + 1}. {t(`legal.terms.${section.key}.title`)}
                  </h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {t(`legal.terms.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* Governing Law */}
            <section className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold">{t("legal.terms.governingLaw.title")}</h2>
              </div>
              <p className="text-muted-foreground">
                {t("legal.terms.governingLaw.content")}
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 MYFAMBLISS GROUP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
