/**
 * Shared layout for the legal pages (Privacy, Terms, Disclaimer, Imprint) and
 * the Support page: app header with language switcher + print button, gradient
 * hero with last-updated badge, sticky table of contents on large screens and
 * a print-friendly document body (print pattern from AgencyAgreement.tsx).
 */
import type { ComponentType, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, Printer, type LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

export type LegalIcon = ComponentType<LucideProps>;

export interface LegalTocEntry {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  /** Page h1. */
  title: string;
  /** Hero icon. */
  icon: LegalIcon;
  /** Tailwind gradient stops for the hero icon tile, e.g. "from-purple-500 to-blue-500". */
  gradient: string;
  /** Localized "Last updated" label — rendered as a badge with the date. */
  lastUpdatedLabel?: string;
  lastUpdatedDate?: string;
  /** Lead paragraph under the hero. */
  intro?: string;
  /** Sticky table of contents (anchors must exist as section ids). */
  toc?: LegalTocEntry[];
  /** Heading above the TOC ("Contents"). */
  tocTitle?: string;
  children: ReactNode;
}

export const LegalLayout = ({
  title,
  icon: Icon,
  gradient,
  lastUpdatedLabel,
  lastUpdatedDate,
  intro,
  toc,
  tocTitle,
  children,
}: LegalLayoutProps) => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm print:hidden">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={eventBlissLogo} alt="EventBliss Logo" className="h-10 w-auto" />
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => typeof window !== "undefined" && window.print()}
              className="hidden sm:inline-flex"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{t("common.back")}</span>
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12 lg:py-16 max-w-6xl">
        {/* Hero */}
        <div className="flex items-start gap-4 sm:gap-5 mb-6">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg print:hidden`}
          >
            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent print:text-black leading-tight">
              {title}
            </h1>
            {lastUpdatedDate && (
              <Badge
                variant="secondary"
                className="mt-2 gap-1.5 font-normal text-muted-foreground print:border print:border-black/20"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                {lastUpdatedLabel ? `${lastUpdatedLabel}: ` : ""}
                {lastUpdatedDate}
              </Badge>
            )}
          </div>
        </div>

        {intro && (
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl whitespace-pre-line">
            {intro}
          </p>
        )}

        {/* Body: sticky TOC + document */}
        <div className={toc?.length ? "grid lg:grid-cols-[220px_1fr] gap-10 items-start" : ""}>
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block sticky top-24 print:hidden" aria-label={tocTitle}>
              {tocTitle && (
                <div className="text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold mb-3">
                  {tocTitle}
                </div>
              )}
              <nav className="space-y-0.5 border-s border-border/60">
                {toc.map((entry, i) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className="block ps-3 -ms-px border-s border-transparent py-1 text-sm text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors leading-snug"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground/60 me-1.5">
                      {i + 1}.
                    </span>
                    {entry.label}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          <div className="min-w-0 space-y-8 print:space-y-6">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-8 mt-16 print:hidden">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {year} MYFAMBLISS GROUP LTD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

interface LegalSectionCardProps {
  id: string;
  /** 1-based section number shown before the title (omit to hide). */
  index?: number;
  icon: LegalIcon;
  title: string;
  gradient: string;
  /** Accent variant for highlighted closing sections. */
  variant?: "default" | "accent";
  children: ReactNode;
}

/** Numbered content card with gradient icon tile — shared section markup. */
export const LegalSectionCard = ({
  id,
  index,
  icon: Icon,
  title,
  gradient,
  variant = "default",
  children,
}: LegalSectionCardProps) => (
  <section
    id={id}
    className={`scroll-mt-24 p-6 rounded-2xl backdrop-blur-sm border print:break-inside-avoid print:rounded-none print:border-black/15 print:bg-transparent print:p-4 ${
      variant === "accent"
        ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-primary/20"
        : "bg-card/50 border-border/50"
    }`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center print:hidden`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-semibold print:text-black">
        {typeof index === "number" ? `${index}. ` : ""}
        {title}
      </h2>
    </div>
    {children}
  </section>
);
