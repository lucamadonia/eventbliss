import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MarketplaceAgency from "./MarketplaceAgency";

const SUPPORTED_LANGS = new Set(["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"]);

/**
 * Iframe-friendly public agency page.
 * Route: /embed/agency/:slug?theme=light|dark
 *
 * Renders the existing MarketplaceAgency component but hides the global
 * app chrome (nav/footer) via a root class so host websites can embed it
 * cleanly. Theme param adjusts body background.
 */
export default function AgencyEmbed() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const { i18n } = useTranslation();
  const theme = params.get("theme") === "light" ? "light" : "dark";
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
    if (theme === "light") body.classList.add("embed-light");
    return () => {
      html.classList.remove("embed-mode");
      body.classList.remove("embed-mode", "embed-hide-chrome", "embed-light");
    };
  }, [theme, showAppHeader]);

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
        .embed-light { background: #fff !important; color: #111 !important; }
      `}</style>
      <div data-agency-slug={slug} data-embed-mode="true">
        <MarketplaceAgency />
      </div>
    </>
  );
}
