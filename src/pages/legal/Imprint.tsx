import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const Imprint = () => {
  const { t } = useTranslation();

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
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
          {t("legal.imprint.title")}
        </h1>

        <div className="space-y-8">
          {/* Company Information */}
          <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t("legal.imprint.company")}</h2>
            </div>
            <p className="text-lg font-medium mb-2">MYFAMBLISS GROUP LTD</p>
            <p className="text-muted-foreground">
              {t("legal.imprint.registeredCompany")}
            </p>
          </section>

          {/* Address */}
          <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t("legal.imprint.address")}</h2>
            </div>
            <address className="not-italic text-muted-foreground">
              <p>Gladstonos 12-14</p>
              <p>8042 Paphos</p>
              <p>Cyprus</p>
            </address>
          </section>

          {/* Contact */}
          <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t("legal.imprint.contact")}</h2>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+35799980583" className="hover:text-foreground transition-colors">
                  +357 99 980 583
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@eventbliss.app" className="hover:text-foreground transition-colors">
                  info@eventbliss.app
                </a>
              </p>
            </div>
          </section>

          {/* Responsible for Content */}
          <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h2 className="text-xl font-semibold mb-4">{t("legal.imprint.responsibleContent")}</h2>
            <p className="text-muted-foreground">MYFAMBLISS GROUP LTD</p>
            <p className="text-muted-foreground">Gladstonos 12-14, 8042 Paphos, Cyprus</p>
          </section>

          {/* EU Dispute Resolution */}
          <section className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h2 className="text-xl font-semibold mb-4">{t("legal.imprint.disputeResolution")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("legal.imprint.disputeText")}
            </p>
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </section>
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

export default Imprint;
