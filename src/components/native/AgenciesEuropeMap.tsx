/**
 * AgenciesEuropeMap — interactive, animated SVG map of the 9 partner-agency
 * countries. Tap a country to filter the list (drives the section's
 * `selectedCountry` state). Pure SVG + framer-motion — no map token, works
 * offline in the native WebView. Geometry is generated from public-domain
 * Natural Earth data (see src/lib/europe-map-paths.ts).
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { EUROPE_VIEWBOX, COUNTRY_PATHS, COUNTRY_CENTROIDS } from "@/lib/europe-map-paths";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

const [VB_W, VB_H] = (() => {
  const p = EUROPE_VIEWBOX.split(" ").map(Number);
  return [p[2] || 1000, p[3] || 820];
})();

function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const ORDER = ["FR", "ES", "PT", "IT", "DE", "AT", "CH", "NL", "BE"];

interface AgenciesEuropeMapProps {
  /** ISO-2 code → agency count */
  counts: Record<string, number>;
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
  /** Localized country name resolver */
  countryLabel: (code: string) => string;
  /** Hint shown when nothing is selected */
  hint: string;
}

export function AgenciesEuropeMap({
  counts,
  selectedCountry,
  onSelectCountry,
  countryLabel,
  hint,
}: AgenciesEuropeMapProps) {
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const codes = useMemo(() => ORDER.filter((c) => COUNTRY_PATHS[c]), []);

  const handleSelect = (code: string) => {
    if (!counts[code]) return;
    haptics.select();
    onSelectCountry(selectedCountry === code ? null : code);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border bg-card/60 p-2">
      <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        {/* Ambient glow backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[45%] top-[35%] h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-[25%] top-[70%] h-1/3 w-1/3 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <svg
          viewBox={EUROPE_VIEWBOX}
          className="absolute inset-0 h-full w-full"
          role="group"
          aria-label="Europe map"
        >
          <defs>
            <filter id="agency-map-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {codes.map((code, i) => {
            const count = counts[code] ?? 0;
            const active = count > 0;
            const isSelected = selectedCountry === code;
            const isHovered = hovered === code;
            const dimmed = selectedCountry !== null && !isSelected;

            const fillOpacity = !active
              ? 0.08
              : isSelected
              ? 0.62
              : isHovered
              ? 0.4
              : dimmed
              ? 0.12
              : 0.2;

            return (
              <motion.path
                key={code}
                d={COUNTRY_PATHS[code]}
                fill={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                stroke={isSelected || isHovered ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isSelected ? 2.5 : 1.2}
                strokeLinejoin="round"
                filter={isSelected || isHovered ? "url(#agency-map-glow)" : undefined}
                initial={reduce ? false : { opacity: 0, fillOpacity: 0 }}
                animate={{ opacity: 1, fillOpacity }}
                transition={reduce ? { duration: 0 } : { delay: i * 0.04, duration: 0.4 }}
                onClick={() => handleSelect(code)}
                onMouseEnter={() => active && setHovered(code)}
                onMouseLeave={() => setHovered((h) => (h === code ? null : h))}
                role="button"
                tabIndex={active ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={`${countryLabel(code)}${active ? ` (${count})` : ""}`}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && active) {
                    e.preventDefault();
                    handleSelect(code);
                  }
                }}
                style={{ cursor: active ? "pointer" : "default", outline: "none" }}
              />
            );
          })}
        </svg>

        {/* Count badges anchored at each country's centroid */}
        {codes.map((code, i) => {
          const count = counts[code] ?? 0;
          if (!count) return null;
          const [cx, cy] = COUNTRY_CENTROIDS[code] ?? [0, 0];
          const isSelected = selectedCountry === code;
          const dimmed = selectedCountry !== null && !isSelected;
          return (
            <motion.button
              key={code}
              type="button"
              onClick={() => handleSelect(code)}
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              animate={{ opacity: dimmed ? 0.45 : 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { delay: 0.25 + i * 0.05, type: "spring", stiffness: 320, damping: 20 }}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums shadow-lg backdrop-blur-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/90 text-foreground border-border hover:border-primary/60",
              )}
              style={{ left: `${(cx / VB_W) * 100}%`, top: `${(cy / VB_H) * 100}%` }}
              aria-label={`${countryLabel(code)} (${count})`}
            >
              <span className="leading-none">{flagEmoji(code)}</span>
              <span>{count}</span>
            </motion.button>
          );
        })}

        {/* Selected-country pulse ring */}
        {selectedCountry && COUNTRY_CENTROIDS[selectedCountry] && !reduce && (
          <motion.div
            key={`pulse-${selectedCountry}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary pointer-events-none"
            style={{
              left: `${(COUNTRY_CENTROIDS[selectedCountry][0] / VB_W) * 100}%`,
              top: `${(COUNTRY_CENTROIDS[selectedCountry][1] / VB_H) * 100}%`,
              width: 44,
              height: 44,
            }}
            initial={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Footer: hint or selected summary */}
      <div className="flex items-center justify-center gap-1.5 px-2 pt-2 pb-1">
        <MapPin size={12} className="text-primary shrink-0" />
        <span className="text-[11px] text-muted-foreground text-center">
          {selectedCountry
            ? `${flagEmoji(selectedCountry)} ${countryLabel(selectedCountry)} · ${counts[selectedCountry] ?? 0}`
            : hint}
        </span>
      </div>
    </div>
  );
}
