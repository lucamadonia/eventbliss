import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { NewsletterForm } from "./NewsletterForm";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

export function LandingFooter() {
  const { t } = useTranslation();

  const productLinks = [
    { label: t("landing.footer.features"), href: "#features" },
    { label: t("landing.footer.solutions"), href: "#solutions" },
  ];

  const partnerLinks = [
    { label: t("landing.footer.becomePartner"), href: "/partner-apply" },
    { label: t("landing.footer.partnerPortal"), href: "/partner-portal" },
  ];

  const legalLinks = [
    { label: t("landing.footer.imprint"), href: "/legal/imprint" },
    { label: t("landing.footer.privacy"), href: "/legal/privacy" },
    { label: t("landing.footer.terms"), href: "/legal/terms" },
    { label: t("landing.footer.disclaimer"), href: "/legal/disclaimer" },
  ];

  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-block mb-6">
              <img
                src={eventBlissLogo}
                alt="EventBliss"
                className="h-32 md:h-40 lg:h-48 w-auto"
              />
            </a>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("landing.footer.tagline")}
            </p>
            
            <div className="mb-6">
              <h4 className="font-display font-semibold mb-4">
                {t("newsletter.title")}
              </h4>
              <NewsletterForm variant="stacked" className="max-w-sm" />
            </div>
          </div>

          {/* Product & Partner Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">
              {t("landing.footer.product")}
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <h4 className="font-display font-semibold mb-4 mt-8">
              {t("landing.footer.partner")}
            </h4>
            <ul className="space-y-3">
              {partnerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-display font-semibold mb-4 mt-8">
              {t("landing.footer.legal")}
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">
              {t("landing.footer.contact")}
            </h4>
            <div className="space-y-4">
              <p className="font-medium text-foreground">
                {t("landing.footer.company")}
              </p>
              
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{t("landing.footer.address")}</span>
              </div>
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 shrink-0" />
                <a
                  href="tel:+35799980583"
                  className="hover:text-foreground transition-colors"
                >
                  {t("landing.footer.phone")}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 shrink-0" />
                <a
                  href="mailto:info@eventbliss.app"
                  className="hover:text-foreground transition-colors"
                >
                  info@eventbliss.app
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            {t("landing.footer.copyright")}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> in Cyprus
          </p>
        </div>
      </div>
    </footer>
  );
}