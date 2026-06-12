/**
 * Terms of Service — marketplace terms plus app-specific sections (in-app
 * purchases, EU withdrawal, user content, availability). Content lives in
 * `legal.terms.*`. Available unprefixed (UI language) and language-prefixed.
 */
import { useTranslation } from "react-i18next";
import {
  Activity,
  Ban,
  Bell,
  Calendar,
  CalendarX,
  CheckCircle2,
  Copyright,
  CreditCard,
  FileText,
  Gavel,
  Handshake,
  RotateCcw,
  Scale,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Ticket,
  Undo2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { LegalLayout, LegalSectionCard, type LegalIcon } from "@/components/legal/LegalLayout";
import { SITE_URL, staticPagePath, staticHreflangs } from "@/lib/legal-routes";
import { HTML_LANG_BY_LANG, LOCALE_BY_LANG, isRtl, toSeoLang } from "@/lib/seo-routes";
import NotFound from "@/pages/NotFound";

const GRADIENT = "from-emerald-500 to-cyan-500";
const HREFLANGS = staticHreflangs("terms");

const SECTIONS: { key: string; icon: LegalIcon; accent?: boolean }[] = [
  { key: "acceptance", icon: CheckCircle2 },
  { key: "services", icon: FileText },
  { key: "booking_process", icon: Calendar },
  { key: "payment_methods", icon: Wallet },
  { key: "payment", icon: CreditCard },
  { key: "inAppPurchases", icon: Smartphone },
  { key: "aiCredits", icon: Sparkles },
  { key: "withdrawal", icon: Undo2 },
  { key: "cancellation_refund", icon: RotateCcw },
  { key: "marketplaceCancellation", icon: CalendarX },
  { key: "vouchers", icon: Ticket },
  { key: "off_platform_bypass", icon: ShieldAlert },
  { key: "affiliate", icon: Handshake },
  { key: "userContent", icon: Copyright },
  { key: "prohibited", icon: XCircle },
  { key: "suspension", icon: Ban },
  { key: "availability_sla", icon: Activity },
  { key: "liability", icon: Scale },
  { key: "changes", icon: Bell },
  { key: "governingLaw", icon: Gavel, accent: true },
];

const Terms = () => {
  const { t, i18n } = useTranslation();
  const { lang: urlLang, invalid } = useUrlLanguage();
  const effectiveLang = urlLang ?? toSeoLang(i18n.language) ?? "en";

  useSEO({
    title: t("legal.terms.meta.title"),
    description: t("legal.terms.meta.description"),
    canonical: `${SITE_URL}${staticPagePath("terms", urlLang)}`,
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

  return (
    <LegalLayout
      title={t("legal.terms.title")}
      icon={FileText}
      gradient={GRADIENT}
      lastUpdatedLabel={t("legal.terms.lastUpdated")}
      lastUpdatedDate={t("legal.terms.lastUpdatedDate")}
      intro={t("legal.terms.intro")}
      tocTitle={t("legal.terms.toc")}
      toc={SECTIONS.map((s) => ({ id: s.key, label: t(`legal.terms.${s.key}.title`) }))}
    >
      {SECTIONS.map((section, index) => (
        <LegalSectionCard
          key={section.key}
          id={section.key}
          index={index + 1}
          icon={section.icon}
          title={t(`legal.terms.${section.key}.title`)}
          gradient={GRADIENT}
          variant={section.accent ? "accent" : "default"}
        >
          <p className="text-muted-foreground whitespace-pre-line">
            {t(`legal.terms.${section.key}.content`)}
          </p>
        </LegalSectionCard>
      ))}
    </LegalLayout>
  );
};

export default Terms;
