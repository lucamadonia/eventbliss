/**
 * Disclaimer — platform role, third-party services, user events and AI
 * content. Content lives in `legal.disclaimer.*`. Available unprefixed
 * (UI language) and language-prefixed.
 */
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Bot,
  FileWarning,
  Globe,
  Link2,
  Mail,
  Plug,
  Shield,
  Users,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { LegalLayout, LegalSectionCard, type LegalIcon } from "@/components/legal/LegalLayout";
import { SITE_URL, staticPagePath, staticHreflangs } from "@/lib/legal-routes";
import { HTML_LANG_BY_LANG, LOCALE_BY_LANG, isRtl, toSeoLang } from "@/lib/seo-routes";
import NotFound from "@/pages/NotFound";

const GRADIENT = "from-amber-500 to-orange-500";
const HREFLANGS = staticHreflangs("disclaimer");

const SECTIONS: { key: string; icon: LegalIcon }[] = [
  { key: "general", icon: FileWarning },
  { key: "thirdPartyServices", icon: Plug },
  { key: "userEvents", icon: Users },
  { key: "aiContent", icon: Bot },
  { key: "externalLinks", icon: Link2 },
  { key: "availability", icon: Globe },
  { key: "limitation", icon: Shield },
];

const Disclaimer = () => {
  const { t, i18n } = useTranslation();
  const { lang: urlLang, invalid } = useUrlLanguage();
  const effectiveLang = urlLang ?? toSeoLang(i18n.language) ?? "en";

  useSEO({
    title: t("legal.disclaimer.meta.title"),
    description: t("legal.disclaimer.meta.description"),
    canonical: `${SITE_URL}${staticPagePath("disclaimer", urlLang)}`,
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
    ...SECTIONS.map((s) => ({ id: s.key, label: t(`legal.disclaimer.${s.key}.title`) })),
    { id: "contact", label: t("legal.disclaimer.contact.title") },
  ];

  return (
    <LegalLayout
      title={t("legal.disclaimer.title")}
      icon={AlertTriangle}
      gradient={GRADIENT}
      lastUpdatedLabel={t("legal.disclaimer.lastUpdated")}
      lastUpdatedDate={t("legal.disclaimer.lastUpdatedDate")}
      intro={t("legal.disclaimer.intro")}
      tocTitle={t("legal.disclaimer.toc")}
      toc={toc}
    >
      {SECTIONS.map((section, index) => (
        <LegalSectionCard
          key={section.key}
          id={section.key}
          index={index + 1}
          icon={section.icon}
          title={t(`legal.disclaimer.${section.key}.title`)}
          gradient={GRADIENT}
        >
          <p className="text-muted-foreground whitespace-pre-line">
            {t(`legal.disclaimer.${section.key}.content`)}
          </p>
        </LegalSectionCard>
      ))}

      <LegalSectionCard
        id="contact"
        index={SECTIONS.length + 1}
        icon={Mail}
        title={t("legal.disclaimer.contact.title")}
        gradient={GRADIENT}
        variant="accent"
      >
        <p className="text-muted-foreground whitespace-pre-line mb-4">
          {t("legal.disclaimer.contact.content")}
        </p>
        <div className="space-y-1 text-muted-foreground text-sm">
          <p className="font-medium text-foreground">MYFAMBLISS GROUP LTD</p>
          <p>Gladstonos 12-14, 8046 Paphos, Cyprus</p>
          <p>
            <a href="mailto:info@event-bliss.com" className="text-primary hover:underline">
              info@event-bliss.com
            </a>
          </p>
        </div>
      </LegalSectionCard>
    </LegalLayout>
  );
};

export default Disclaimer;
