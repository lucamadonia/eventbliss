/**
 * Imprint — company details for MYFAMBLISS GROUP LTD (language-invariant data
 * hardcoded by design, labels via `legal.imprint.*`). Available unprefixed
 * (UI language) and language-prefixed.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Building2,
  FileBadge,
  Globe,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  Scale,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { LegalLayout, LegalSectionCard } from "@/components/legal/LegalLayout";
import { SITE_URL, staticPagePath, staticHreflangs } from "@/lib/legal-routes";
import { HTML_LANG_BY_LANG, LOCALE_BY_LANG, isRtl, toSeoLang } from "@/lib/seo-routes";
import NotFound from "@/pages/NotFound";

const GRADIENT = "from-blue-500 to-indigo-500";
const HREFLANGS = staticHreflangs("imprint");

const Imprint = () => {
  const { t, i18n } = useTranslation();
  const { lang: urlLang, invalid } = useUrlLanguage();
  const effectiveLang = urlLang ?? toSeoLang(i18n.language) ?? "en";

  useSEO({
    title: t("legal.imprint.meta.title"),
    description: t("legal.imprint.meta.description"),
    canonical: `${SITE_URL}${staticPagePath("imprint", urlLang)}`,
    locale: LOCALE_BY_LANG[effectiveLang],
    hreflangs: HREFLANGS,
    ...(urlLang
      ? {
          htmlLang: HTML_LANG_BY_LANG[urlLang],
          dir: isRtl(urlLang) ? ("rtl" as const) : ("ltr" as const),
        }
      : {}),
  });

  if (invalid) return <NotFound />;

  const toc = [
    { id: "company", label: t("legal.imprint.company") },
    { id: "address", label: t("legal.imprint.address") },
    { id: "contact", label: t("legal.imprint.contact") },
    { id: "responsible", label: t("legal.imprint.responsibleContent") },
    { id: "dispute", label: t("legal.imprint.disputeResolution") },
    { id: "support", label: t("support.title") },
  ];

  return (
    <LegalLayout
      title={t("legal.imprint.title")}
      icon={Building2}
      gradient={GRADIENT}
      tocTitle={t("legal.imprint.toc")}
      toc={toc}
    >
      {/* Company Information */}
      <LegalSectionCard
        id="company"
        icon={Building2}
        title={t("legal.imprint.company")}
        gradient={GRADIENT}
      >
        <p className="text-lg font-medium mb-2">MYFAMBLISS GROUP LTD</p>
        <p className="text-sm text-muted-foreground mb-4">{t("legal.imprint.brandNote")}</p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold">
              {t("legal.imprint.regNoLabel")}
            </dt>
            <dd className="text-foreground font-mono">HE 473088</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold">
              {t("legal.imprint.vatLabel")}
            </dt>
            <dd className="text-foreground font-mono">CY60165018Q</dd>
          </div>
        </dl>
        <p className="text-muted-foreground mt-4">{t("legal.imprint.registeredCompany")}</p>
      </LegalSectionCard>

      {/* Address */}
      <LegalSectionCard
        id="address"
        icon={MapPin}
        title={t("legal.imprint.address")}
        gradient={GRADIENT}
      >
        <address className="not-italic text-muted-foreground">
          <p>Gladstonos 12-14</p>
          <p>8046 Paphos</p>
          <p>Cyprus</p>
        </address>
      </LegalSectionCard>

      {/* Contact */}
      <LegalSectionCard
        id="contact"
        icon={Phone}
        title={t("legal.imprint.contact")}
        gradient={GRADIENT}
      >
        <div className="space-y-2 text-muted-foreground">
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <a href="tel:+35799980583" className="hover:text-foreground transition-colors">
              +357 99 980 583
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:info@event-bliss.com"
              className="hover:text-foreground transition-colors"
            >
              info@event-bliss.com
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <a
              href="https://www.mfg.cy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              www.mfg.cy
            </a>
          </p>
        </div>
      </LegalSectionCard>

      {/* Responsible for Content */}
      <LegalSectionCard
        id="responsible"
        icon={UserCheck}
        title={t("legal.imprint.responsibleContent")}
        gradient={GRADIENT}
      >
        <p className="text-muted-foreground mb-3">{t("legal.imprint.responsiblePerson")}</p>
        <p className="text-muted-foreground">MYFAMBLISS GROUP LTD</p>
        <p className="text-muted-foreground">Gladstonos 12-14, 8046 Paphos, Cyprus</p>
        <p className="text-xs text-muted-foreground/80 font-mono mt-1 flex items-center gap-1.5">
          <FileBadge className="w-3 h-3" />
          HE 473088 · VAT ID CY60165018Q
        </p>
      </LegalSectionCard>

      {/* Dispute Resolution */}
      <LegalSectionCard
        id="dispute"
        icon={Scale}
        title={t("legal.imprint.disputeResolution")}
        gradient={GRADIENT}
      >
        <p className="text-muted-foreground whitespace-pre-line">{t("legal.imprint.odrText")}</p>
      </LegalSectionCard>

      {/* Help & Support */}
      <LegalSectionCard
        id="support"
        icon={LifeBuoy}
        title={t("support.title")}
        gradient={GRADIENT}
        variant="accent"
      >
        <p className="text-muted-foreground mb-4">{t("legal.imprint.supportLink")}</p>
        <Button asChild variant="outline" className="print:hidden">
          <Link to={staticPagePath("support", urlLang)} className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4" />
            {t("support.title")}
          </Link>
        </Button>
      </LegalSectionCard>
    </LegalLayout>
  );
};

export default Imprint;
