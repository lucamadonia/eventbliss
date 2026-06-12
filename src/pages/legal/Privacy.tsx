/**
 * Privacy Policy — full GDPR notice, data-driven via the SECTIONS config.
 * Content lives in `legal.privacy.*` (en = fallback master, de = legal
 * reference). Available unprefixed (/legal/privacy, UI language) and
 * language-prefixed (/de/legal/privacy …) for App Store Connect per-locale
 * privacy URLs.
 */
import { useTranslation } from "react-i18next";
import {
  Archive,
  Baby,
  Bell,
  Building2,
  Cookie,
  CreditCard,
  Database,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  Scale,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSEO } from "@/hooks/useSEO";
import { useUrlLanguage } from "@/hooks/useUrlLanguage";
import { LegalLayout, LegalSectionCard, type LegalIcon } from "@/components/legal/LegalLayout";
import { SITE_URL, staticPagePath, staticHreflangs } from "@/lib/legal-routes";
import { HTML_LANG_BY_LANG, LOCALE_BY_LANG, isRtl, toSeoLang } from "@/lib/seo-routes";
import NotFound from "@/pages/NotFound";

const GRADIENT = "from-purple-500 to-blue-500";
const HREFLANGS = staticHreflangs("privacy");

type SectionType =
  | "text"
  | "list"
  | "labeledList"
  | "purposeList"
  | "table"
  | "controller"
  | "rights"
  | "contact";

interface SectionConfig {
  id: string;
  icon: LegalIcon;
  type: SectionType;
  /** Item keys for list-like section types. */
  items?: string[];
}

const DATA_CATEGORY_ITEMS = [
  "account",
  "content",
  "payment",
  "receipts",
  "usage",
  "device",
  "location",
  "voice",
];

const PURPOSE_ITEMS = ["service", "payments", "ai", "push", "security", "legal"];

const PROCESSOR_ROWS = [
  "supabase",
  "vercel",
  "stripe",
  "apple",
  "google",
  "revenuecat",
  "openai",
  "openrouter",
  "mistral",
  "spotify",
  "mapbox",
  "chatbase",
];

const RETENTION_ITEMS = ["account", "events", "payments", "logs"];

const RIGHTS_ITEMS = [
  "access",
  "rectification",
  "erasure",
  "restriction",
  "portability",
  "objection",
  "withdraw",
];

const SECTIONS: SectionConfig[] = [
  { id: "summary", icon: Sparkles, type: "list" },
  { id: "controller", icon: Building2, type: "controller" },
  { id: "dataCategories", icon: Database, type: "labeledList", items: DATA_CATEGORY_ITEMS },
  { id: "purposes", icon: Scale, type: "purposeList", items: PURPOSE_ITEMS },
  { id: "processors", icon: Share2, type: "table", items: PROCESSOR_ROWS },
  { id: "transfers", icon: Globe, type: "text" },
  { id: "retention", icon: Archive, type: "labeledList", items: RETENTION_ITEMS },
  { id: "cookies", icon: Cookie, type: "text" },
  { id: "push", icon: Bell, type: "text" },
  { id: "purchases", icon: CreditCard, type: "text" },
  { id: "deletion", icon: Trash2, type: "text" },
  { id: "rights", icon: UserCheck, type: "rights", items: RIGHTS_ITEMS },
  { id: "children", icon: Baby, type: "text" },
  { id: "security", icon: Lock, type: "text" },
  { id: "changes", icon: RefreshCw, type: "text" },
  { id: "contact", icon: Mail, type: "contact" },
];

const PROCESSOR_COLS = ["name", "purpose", "location", "safeguards"] as const;

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const { lang: urlLang, invalid } = useUrlLanguage();
  const effectiveLang = urlLang ?? toSeoLang(i18n.language) ?? "en";

  useSEO({
    title: t("legal.privacy.meta.title"),
    description: t("legal.privacy.meta.description"),
    canonical: `${SITE_URL}${staticPagePath("privacy", urlLang)}`,
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

  const p = (key: string) => t(`legal.privacy.${key}`);

  const renderBody = (section: SectionConfig) => {
    switch (section.type) {
      case "list": {
        const items = t(`legal.privacy.${section.id}.items`, {
          returnObjects: true,
        });
        return (
          <ul className="space-y-2.5">
            {(Array.isArray(items) ? (items as string[]) : []).map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      }

      case "controller":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">
              {p("controller.content")}
            </p>
            {/* Company data — language-invariant, hardcoded by design */}
            <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm print:break-inside-avoid">
              <p className="font-semibold text-foreground">MYFAMBLISS GROUP LTD</p>
              <p className="text-muted-foreground">Gladstonos 12-14, 8046 Paphos, Cyprus</p>
              <p className="text-muted-foreground font-mono text-xs mt-1.5">
                Reg. No. HE 473088 · VAT ID CY60165018Q
              </p>
              <p className="mt-1.5">
                <a href="mailto:info@event-bliss.com" className="text-primary hover:underline">
                  info@event-bliss.com
                </a>
              </p>
            </div>
          </>
        );

      case "labeledList":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">
              {p(`${section.id}.intro`)}
            </p>
            <dl className="space-y-3">
              {section.items?.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border/50 bg-background/30 p-4 print:break-inside-avoid"
                >
                  <dt className="font-medium text-foreground mb-1">
                    {p(`${section.id}.items.${item}.label`)}
                  </dt>
                  <dd className="text-sm text-muted-foreground whitespace-pre-line">
                    {p(`${section.id}.items.${item}.desc`)}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        );

      case "purposeList":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">{p("purposes.intro")}</p>
            <div className="space-y-3">
              {section.items?.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border/50 bg-background/30 p-4 print:break-inside-avoid"
                >
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {p(`purposes.items.${item}.purpose`)}
                  </p>
                  <p className="mt-2 text-xs font-medium text-primary/90">
                    {p(`purposes.items.${item}.basis`)}
                  </p>
                </div>
              ))}
            </div>
          </>
        );

      case "table":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">
              {p("processors.intro")}
            </p>
            {/* Desktop: real table */}
            <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/40 hover:bg-background/40">
                    {PROCESSOR_COLS.map((col) => (
                      <TableHead key={col} className="text-xs uppercase tracking-wide">
                        {p(`processors.cols.${col}`)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items?.map((row) => (
                    <TableRow key={row} className="print:break-inside-avoid">
                      <TableCell className="font-medium align-top whitespace-nowrap">
                        {p(`processors.rows.${row}.name`)}
                      </TableCell>
                      <TableCell className="align-top text-muted-foreground text-sm">
                        {p(`processors.rows.${row}.purpose`)}
                      </TableCell>
                      <TableCell className="align-top text-muted-foreground text-sm whitespace-nowrap">
                        {p(`processors.rows.${row}.location`)}
                      </TableCell>
                      <TableCell className="align-top text-muted-foreground text-sm">
                        {p(`processors.rows.${row}.safeguards`)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-3">
              {section.items?.map((row) => (
                <div
                  key={row}
                  className="rounded-xl border border-border/50 bg-background/30 p-4 print:break-inside-avoid"
                >
                  <p className="font-medium text-foreground">{p(`processors.rows.${row}.name`)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p(`processors.rows.${row}.purpose`)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/90">
                    <span>
                      <span className="font-semibold">{p("processors.cols.location")}: </span>
                      {p(`processors.rows.${row}.location`)}
                    </span>
                    <span>
                      <span className="font-semibold">{p("processors.cols.safeguards")}: </span>
                      {p(`processors.rows.${row}.safeguards`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case "rights":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">{p("rights.intro")}</p>
            <dl className="space-y-3 mb-5">
              {section.items?.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border/50 bg-background/30 p-4 print:break-inside-avoid"
                >
                  <dt className="font-medium text-foreground mb-1">
                    {p(`rights.items.${item}.label`)}
                  </dt>
                  <dd className="text-sm text-muted-foreground whitespace-pre-line">
                    {p(`rights.items.${item}.desc`)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 print:break-inside-avoid">
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {p("rights.complaint")}
              </p>
            </div>
          </>
        );

      case "contact":
        return (
          <>
            <p className="text-muted-foreground whitespace-pre-line mb-4">{p("contact.content")}</p>
            <a
              href="mailto:info@event-bliss.com"
              className="text-primary hover:underline font-medium"
            >
              info@event-bliss.com
            </a>
          </>
        );

      case "text":
      default:
        return (
          <p className="text-muted-foreground whitespace-pre-line">{p(`${section.id}.content`)}</p>
        );
    }
  };

  return (
    <LegalLayout
      title={p("title")}
      icon={Shield}
      gradient={GRADIENT}
      lastUpdatedLabel={p("lastUpdated")}
      lastUpdatedDate={p("lastUpdatedDate")}
      intro={p("intro")}
      tocTitle={p("toc")}
      toc={SECTIONS.map((s) => ({ id: s.id, label: p(`${s.id}.title`) }))}
    >
      {SECTIONS.map((section, index) => (
        <LegalSectionCard
          key={section.id}
          id={section.id}
          index={index + 1}
          icon={section.icon}
          title={p(`${section.id}.title`)}
          gradient={GRADIENT}
          variant={section.type === "contact" ? "accent" : "default"}
        >
          {renderBody(section)}
        </LegalSectionCard>
      ))}
    </LegalLayout>
  );
};

export default Privacy;
