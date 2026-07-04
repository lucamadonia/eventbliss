/**
 * MoodboardPrint — a print-only rendering of the whole Ideenboard.
 * Hidden on screen (display:none), shown only when printing via a scoped
 * `@media print` stylesheet that hides the rest of the app. This gives a clean,
 * light, document-style moodboard that the browser / iOS WebView can "Save as
 * PDF". Pure inline styles so nothing depends on the neon app theme.
 */
import { useTranslation } from "react-i18next";
import type { BoardPin } from "@/hooks/useIdeaBoard";
import { CATEGORY_META } from "./categories";
import { PIN_CATEGORIES } from "@/hooks/useIdeaBoard";

interface MoodboardPrintProps {
  title: string;
  eventName: string;
  pins: BoardPin[];
}

/** Scoped print CSS: only `.moodboard-print` prints; it is hidden otherwise. */
const PRINT_CSS = `
.moodboard-print { display: none; }
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden; }
  .moodboard-print, .moodboard-print * { visibility: visible; }
  .moodboard-print {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: #ffffff;
    color: #1a1523;
  }
  .moodboard-print img { break-inside: avoid; }
  .mb-cat { break-inside: avoid; }
}
`;

export function MoodboardPrint({ title, eventName, pins }: MoodboardPrintProps) {
  const { t } = useTranslation();

  // Group by category, preserving the canonical category order.
  const groups = PIN_CATEGORIES.map((cat) => ({
    cat,
    pins: pins.filter((p) => p.category === cat),
  })).filter((g) => g.pins.length > 0);

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div
        className="moodboard-print"
        style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}
      >
        {/* Cover header */}
        <div style={{ borderBottom: "2px solid #1a1523", paddingBottom: "12px", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", color: "#7a7488" }}>
            {eventName}
          </div>
          <div style={{ fontSize: "30px", fontWeight: 800, margin: "4px 0 2px", color: "#1a1523" }}>
            {title}
          </div>
          <div style={{ fontSize: "13px", color: "#7a7488" }}>
            {t("ideaBoard.pinCount", "{{count}} Ideen", { count: pins.length })}
          </div>
        </div>

        {groups.length === 0 && (
          <p style={{ color: "#7a7488", fontSize: "14px" }}>
            {t("ideaBoard.emptyTitle", "Noch keine Ideen")}
          </p>
        )}

        {groups.map(({ cat, pins: catPins }) => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
          const label = t(`ideaBoard.categories.${cat}`, meta.label);
          const links = catPins.filter((p) => (p.kind === "link" || p.kind === "embed") && p.url);
          const images = catPins.filter((p) => p.kind === "image" && p.imageUrl);
          const notes = catPins.filter((p) => p.kind === "note" && (p.title || p.note));

          return (
            <div key={cat} className="mb-cat" style={{ marginBottom: "26px" }}>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1a1523",
                  margin: "0 0 12px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #e6e2ee",
                }}
              >
                {meta.emoji} {label}
              </h2>

              {/* Images grid */}
              {images.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: notes.length || links.length ? "12px" : 0,
                  }}
                >
                  {images.map((p) => (
                    <div key={p.id} style={{ breakInside: "avoid" }}>
                      <img
                        src={p.imageUrl}
                        alt={p.title ?? label}
                        style={{
                          width: "100%",
                          height: "130px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #e6e2ee",
                        }}
                      />
                      {p.title && (
                        <div style={{ fontSize: "11px", color: "#4a4458", marginTop: "3px" }}>
                          {p.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Note cards */}
              {notes.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                    marginBottom: links.length ? "12px" : 0,
                  }}
                >
                  {notes.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        breakInside: "avoid",
                        border: "1px solid #e6e2ee",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        background: "#faf9fc",
                      }}
                    >
                      {p.title && (
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1523", marginBottom: "3px" }}>
                          {p.title}
                        </div>
                      )}
                      {p.note && (
                        <div style={{ fontSize: "12px", color: "#4a4458", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                          {p.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Links list */}
              {links.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {links.map((p) => (
                    <li
                      key={p.id}
                      style={{ fontSize: "12px", color: "#4a4458", padding: "3px 0", breakInside: "avoid" }}
                    >
                      <span style={{ fontWeight: 600, color: "#1a1523" }}>
                        {p.title || hostFor(p.url!)}
                      </span>
                      {" — "}
                      <span style={{ color: "#7a7488" }}>{p.url}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
