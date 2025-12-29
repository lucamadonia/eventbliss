import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Link2, FileWarning, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const Disclaimer = () => {
  const { t } = useTranslation();

  const sections = [
    { icon: FileWarning, key: "general" },
    { icon: Link2, key: "externalLinks" },
    { icon: Globe, key: "availability" },
    { icon: Shield, key: "limitation" },
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {t("legal.disclaimer.title")}
            </h1>
            <p className="text-muted-foreground">{t("legal.disclaimer.lastUpdated")}: January 2025</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8">
            <p className="text-muted-foreground">
              {t("legal.disclaimer.intro")}
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={section.key} className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {index + 1}. {t(`legal.disclaimer.${section.key}.title`)}
                  </h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {t(`legal.disclaimer.${section.key}.content`)}
                </p>
              </section>
            ))}

            {/* Contact */}
            <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <h2 className="text-xl font-semibold mb-4">{t("legal.disclaimer.contact.title")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("legal.disclaimer.contact.content")}
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>MYFAMBLISS GROUP LTD</p>
                <p>Gladstonos 12-14, 8042 Paphos, Cyprus</p>
                <p>
                  <a href="mailto:legal@eventbliss.app" className="text-primary hover:underline">
                    legal@eventbliss.app
                  </a>
                </p>
              </div>
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

export default Disclaimer;
