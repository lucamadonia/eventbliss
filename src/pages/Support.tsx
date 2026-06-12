/**
 * Help & Support — contact channels, FAQ accordion (with FAQPage JSON-LD)
 * and links to the legal pages. This is the page App Store Connect's
 * per-locale support URLs point to (`/support`, `/de/support`, …).
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Clock, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  SITE_URL,
  staticPagePath,
  staticHreflangs,
  type StaticPage,
} from "@/lib/legal-routes";
import { HTML_LANG_BY_LANG, LOCALE_BY_LANG, isRtl, toSeoLang } from "@/lib/seo-routes";
import { isWeb } from "@/lib/platform";
import NotFound from "@/pages/NotFound";

const GRADIENT = "from-purple-500 to-blue-500";
const HREFLANGS = staticHreflangs("support");
const SUPPORT_EMAIL = "support@event-bliss.com";

const FAQ_KEYS = [
  "createEvent",
  "joinCode",
  "premiumBuy",
  "premiumRestore",
  "premiumCancelApp",
  "premiumCancelWeb",
  "deleteAccount",
  "exportData",
  "bookings",
  "games",
] as const;

const LEGAL_LINKS: { page: StaticPage; titleKey: string }[] = [
  { page: "privacy", titleKey: "legal.privacy.title" },
  { page: "terms", titleKey: "legal.terms.title" },
  { page: "imprint", titleKey: "legal.imprint.title" },
  { page: "disclaimer", titleKey: "legal.disclaimer.title" },
];

const Support = () => {
  const { t, i18n } = useTranslation();
  const [chatLoaded, setChatLoaded] = useState(false);
  const { lang: urlLang, invalid } = useUrlLanguage();
  const effectiveLang = urlLang ?? toSeoLang(i18n.language) ?? "en";

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map((key) => ({
        "@type": "Question",
        name: t(`support.faq.items.${key}.q`),
        acceptedAnswer: {
          "@type": "Answer",
          text: t(`support.faq.items.${key}.a`),
        },
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );

  useSEO({
    title: t("support.meta.title"),
    description: t("support.meta.description"),
    canonical: `${SITE_URL}${staticPagePath("support", urlLang)}`,
    locale: LOCALE_BY_LANG[effectiveLang],
    hreflangs: HREFLANGS,
    jsonLd,
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
      title={t("support.title")}
      icon={LifeBuoy}
      gradient={GRADIENT}
      intro={t("support.subtitle")}
    >
      {/* Contact */}
      <section id="contact" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-5">{t("support.contact.title")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${GRADIENT} flex items-center justify-center`}
              >
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{t("support.contact.emailCard.title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t("support.contact.emailCard.desc")}
            </p>
            <Button asChild>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("support.contact.emailCard.cta")}
              </a>
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${GRADIENT} flex items-center justify-center`}
              >
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{SUPPORT_EMAIL}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("support.contact.responseTime")}</p>
          </div>
        </div>
      </section>

      {/* Live chat (web only — external embeds stay out of the native app) */}
      {isWeb() && (
        <section id="chat" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${GRADIENT} flex items-center justify-center`}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">{t("support.chat.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">{t("support.chat.subtitle")}</p>
          {/* Two-click embed: the third-party iframe (Chatbase, USA) only loads
              after an explicit user action — no third-party requests before. */}
          {chatLoaded ? (
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/-tb0zOeB5bTQRv79MIEPy"
                title={t("support.chat.title")}
                width="100%"
                style={{ height: "100%", minHeight: 700 }}
                frameBorder="0"
                allow="microphone"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 flex flex-col items-center text-center gap-4">
              <Button onClick={() => setChatLoaded(true)} className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {t("support.chat.load")}
              </Button>
              <p className="text-xs text-muted-foreground max-w-md">
                {t("support.chat.privacyHint")}{" "}
                <Link to={staticPagePath("privacy", urlLang)} className="underline hover:text-primary">
                  {t("legal.privacy.title")}
                </Link>
              </p>
            </div>
          )}
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-5">{t("support.faq.title")}</h2>
        <Accordion
          type="single"
          collapsible
          className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-5"
        >
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key} className="border-border/50 last:border-b-0">
              <AccordionTrigger className="text-start text-base hover:no-underline hover:text-primary">
                {t(`support.faq.items.${key}.q`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line text-[15px] leading-relaxed">
                {t(`support.faq.items.${key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Legal links */}
      <section id="legal" className="scroll-mt-24">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground/80 font-semibold mb-3">
          {t("support.legalLinks.title")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {LEGAL_LINKS.map(({ page, titleKey }) => (
            <Button key={page} asChild variant="outline" size="sm">
              <Link to={staticPagePath(page, urlLang)}>{t(titleKey)}</Link>
            </Button>
          ))}
        </div>
      </section>
    </LegalLayout>
  );
};

export default Support;
