import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MarketplaceAgency from "./MarketplaceAgency";
import { MarketplaceThemeProvider, resolveTheme } from "@/lib/marketplaceThemes";

const SUPPORTED_LANGS = new Set(["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"]);

/**
 * Iframe-friendly public agency page.
 * Route: /embed/agency/:slug?theme=dark|light|classic|epic|party|adventure
 *
 * Renders the existing MarketplaceAgency component but hides the global
 * app chrome (nav/footer) via a root class so host websites can embed it
 * cleanly. Theme param selects a MarketplaceTheme that propagates via context.
 */
export default function AgencyEmbed() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const { i18n } = useTranslation();
  const themeId = params.get("theme") ?? "dark";
  const showAppHeader = params.get("header") === "1";
  const lang = params.get("lang");

  // Apply language change if valid lang param is passed
  useEffect(() => {
    if (lang && SUPPORTED_LANGS.has(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("embed-mode");
    body.classList.add("embed-mode");
    if (!showAppHeader) body.classList.add("embed-hide-chrome");
    const previousBg = body.style.backgroundColor;
    body.style.backgroundColor = resolveTheme(themeId).colors.bg;
    return () => {
      html.classList.remove("embed-mode");
      body.classList.remove("embed-mode", "embed-hide-chrome");
      body.style.backgroundColor = previousBg;
    };
  }, [themeId, showAppHeader]);

  return (
    <>
      <style>{`
        /* Hide global app chrome only when embed-hide-chrome flag is set */
        .embed-hide-chrome .landing-header,
        .embed-hide-chrome .landing-footer,
        .embed-hide-chrome .mobile-bottom-nav,
        .embed-hide-chrome footer[role="contentinfo"],
        .embed-hide-chrome header[role="banner"] {
          display: none !important;
        }
        /* Always collapse top padding so embed content starts at the top */
        .embed-mode main, .embed-mode > #root > div > main { padding-top: 0 !important; }
        .embed-mode { min-height: 100vh; }
      `}</style>
      <MarketplaceThemeProvider themeId={themeId}>
        <div data-agency-slug={slug} data-embed-mode="true" data-theme={themeId}>
          <MarketplaceAgency />
        </div>
      </MarketplaceThemeProvider>
    </>
  );
}
