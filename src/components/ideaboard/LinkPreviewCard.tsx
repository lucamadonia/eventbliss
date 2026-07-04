/**
 * LinkPreviewCard — a clean, robust preview for link/embed pins.
 * Most sites block being iframed (X-Frame-Options / CSP frame-ancestors), so
 * instead of a broken sandboxed iframe we render a favicon + hostname + title
 * card that opens the URL. On native we use @capacitor/browser; on web a new
 * tab. Pinterest URLs get a subtle "Pinterest" affordance.
 */
import { useTranslation } from "react-i18next";
import { ExternalLink, Link2 } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { cn } from "@/lib/utils";

export function faviconFor(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isPinterest(url: string): boolean {
  try {
    return /(?:^|\.)pinterest\.[a-z.]+$|(?:^|\.)pin\.it$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Open a URL in the in-app browser on native, falling back to a new tab. */
export async function openExternal(url: string): Promise<void> {
  try {
    await Browser.open({ url });
  } catch {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
    }
  }
}

interface LinkPreviewCardProps {
  url: string;
  title?: string | null;
  /** "compact" for the grid card, "full" for the detail sheet. */
  variant?: "compact" | "full";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function LinkPreviewCard({
  url,
  title,
  variant = "compact",
  className,
  onClick,
}: LinkPreviewCardProps) {
  const { t } = useTranslation();
  const favicon = faviconFor(url);
  const host = hostFor(url);
  const pinterest = isPinterest(url);
  const full = variant === "full";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        void openExternal(url);
      }}
      className={cn(
        "flex w-full items-center gap-3 text-left",
        full ? "rounded-2xl bg-white/5 px-4 py-3.5" : "px-4 py-4",
        className,
      )}
    >
      {favicon ? (
        <img
          src={favicon}
          alt=""
          className={cn("shrink-0 rounded-lg bg-white/10", full ? "h-10 w-10" : "h-9 w-9")}
        />
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-white/10",
            full ? "h-10 w-10" : "h-9 w-9",
          )}
        >
          <Link2 className="h-4 w-4 text-white/70" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{title || host}</p>
        <p className="truncate text-xs text-white/50">
          {pinterest ? t("ideaBoard.openOnPinterest", "Auf Pinterest öffnen") : host}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-white/40" />
    </button>
  );
}
