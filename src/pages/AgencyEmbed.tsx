import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import MarketplaceAgency from "./MarketplaceAgency";

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
  const theme = params.get("theme") === "light" ? "light" : "dark";

  useEffect(() => {
    const prev = document.body.className;
    document.documentElement.classList.add("embed-mode");
    document.body.classList.add("embed-mode");
    if (theme === "light") {
      document.body.classList.add("embed-light");
    }
    return () => {
      document.documentElement.classList.remove("embed-mode");
      document.body.className = prev;
    };
  }, [theme]);

  return (
    <>
      <style>{`
        /* Hide global app chrome in embed mode */
        .embed-mode .landing-header,
        .embed-mode .landing-footer,
        .embed-mode .mobile-bottom-nav,
        .embed-mode footer[role="contentinfo"],
        .embed-mode header[role="banner"] {
          display: none !important;
        }
        .embed-mode { min-height: 100vh; }
        .embed-light { background: #fff !important; color: #111 !important; }
      `}</style>
      <div data-agency-slug={slug} data-embed-mode="true">
        <MarketplaceAgency />
      </div>
    </>
  );
}
