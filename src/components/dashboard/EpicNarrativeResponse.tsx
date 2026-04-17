import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles, Copy, Check, Share2, Calendar, Wallet, MapPin,
  ArrowRight, Star, ShoppingBag, Flame,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useContextualServices, type ContextualService } from "@/hooks/useContextualServices";
import { useServiceAdTracker } from "@/hooks/useServiceAdTracker";
import BudgetVisualizer from "./BudgetVisualizer";
import ConfettiBurst from "./motion/ConfettiBurst";

// ---------------------------------------------------------------------------
// Section parsing
// ---------------------------------------------------------------------------

type SectionKind = "theme" | "day" | "budget" | "tips" | "closing" | "other";

interface NarrativeSection {
  emoji: string;
  title: string;
  body: string;
  kind: SectionKind;
  dayNumber?: number;
}

const DAY_PATTERN = /\b(?:day|tag|dia|día|giorno|dag|dzień|gün|يوم)\s*(\d+)\b/i;
const BUDGET_PATTERN = /\b(?:budget|buget|bütçe|ميزانية|kosten|cost|preço|costo|coût|przegląd)\b/i;
const TIPS_PATTERN = /\b(?:tipps?|tips?|consigl|conseil|consejo|porad|sugest|ipuç|نصائح)\b/i;
const THEME_PATTERN = /\b(?:theme|thema|tema|thème|motyw|konu|موضوع|vibe|mood|atmosphär)\b/i;

function extractEmoji(line: string): { emoji: string; rest: string } {
  const match = line.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}\u{1F000}-\u{1FFFF}]+)\s*/u);
  if (match) return { emoji: match[1], rest: line.slice(match[0].length) };
  return { emoji: "✨", rest: line };
}

function classifySection(title: string, emoji: string): { kind: SectionKind; dayNumber?: number } {
  const lower = title.toLowerCase();
  const dayMatch = lower.match(DAY_PATTERN);
  if (dayMatch) return { kind: "day", dayNumber: parseInt(dayMatch[1], 10) };
  if (BUDGET_PATTERN.test(lower) || emoji === "💰") return { kind: "budget" };
  if (TIPS_PATTERN.test(lower) || emoji === "💡" || emoji === "🔥") return { kind: "tips" };
  if (THEME_PATTERN.test(lower) || emoji === "🎉" || emoji === "✨") return { kind: "theme" };
  return { kind: "other" };
}

function parseNarrative(text: string): {
  intro: string;
  sections: NarrativeSection[];
} {
  if (!text) return { intro: "", sections: [] };

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+\*\s+\*\*/g, "\n- **")
    .replace(/\n?(#{1,3}\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}]+[^\n]+)/gu, "\n$1")
    .replace(/\n?([\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*\n?\*\*[^*\n]+\*\*)/gu, "\n$1")
    .replace(/\n{3,}/g, "\n\n");

  const lines = normalized.split("\n");
  const sections: NarrativeSection[] = [];
  let current: NarrativeSection | null = null;
  const introLines: string[] = [];
  let foundFirst = false;

  const isHeaderLine = (l: string): { emoji: string; title: string } | null => {
    const stripped = l.trim();
    if (!stripped) return null;
    const h = stripped.match(/^#{1,3}\s+([\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Presentation}\p{Extended_Pictographic}\s]*)\s*(.+)/u);
    if (h) {
      const { emoji, rest } = extractEmoji(h[1] + " " + h[2]);
      return { emoji, title: rest.replace(/\*\*/g, "").trim() };
    }
    const bold = stripped.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}])\s*\*\*\s*(.+?)\s*\*\*:?$/u);
    if (bold) return { emoji: bold[1], title: bold[2].trim() };
    if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]$/u.test(stripped)) {
      return { emoji: stripped, title: "" };
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hdr = isHeaderLine(line);

    if (hdr && !hdr.title && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      const titleMatch = next.match(/^\*\*\s*(.+?)\s*\*\*:?$/);
      if (titleMatch) {
        if (current) sections.push(current);
        const { kind, dayNumber } = classifySection(titleMatch[1], hdr.emoji);
        current = { emoji: hdr.emoji, title: titleMatch[1], body: "", kind, dayNumber };
        foundFirst = true;
        i++;
        continue;
      }
    }

    if (hdr && hdr.title) {
      if (current) sections.push(current);
      const { kind, dayNumber } = classifySection(hdr.title, hdr.emoji);
      current = { emoji: hdr.emoji, title: hdr.title, body: "", kind, dayNumber };
      foundFirst = true;
      continue;
    }

    if (/^[-=*]{3,}$/.test(line.trim())) continue;

    if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else if (!foundFirst) {
      introLines.push(line);
    }
  }

  if (current) sections.push(current);

  sections.forEach((s) => {
    s.body = s.body.replace(/\n{3,}/g, "\n\n").trim();
  });

  return {
    intro: introLines.join("\n").trim(),
    sections,
  };
}

// ---------------------------------------------------------------------------
// Section styles
// ---------------------------------------------------------------------------

const SECTION_STYLES: Record<SectionKind, { accent: string; glow: string; iconBg: string; label?: string; spotlightRgb: string }> = {
  theme:   { accent: "from-fuchsia-500 via-pink-500 to-rose-500",    glow: "shadow-pink-500/30",    iconBg: "from-fuchsia-500 to-pink-600",    label: "Vibe",   spotlightRgb: "236,72,153" },
  day:     { accent: "from-purple-600 via-indigo-500 to-cyan-500",    glow: "shadow-indigo-500/30",  iconBg: "from-purple-600 to-indigo-600",   label: "Day",    spotlightRgb: "139,92,246" },
  budget:  { accent: "from-emerald-500 via-teal-500 to-cyan-500",     glow: "shadow-emerald-500/30", iconBg: "from-emerald-500 to-teal-600",    label: "Budget", spotlightRgb: "16,185,129" },
  tips:    { accent: "from-amber-400 via-orange-500 to-red-500",      glow: "shadow-amber-500/30",   iconBg: "from-amber-500 to-orange-600",    label: "Tips",   spotlightRgb: "245,158,11" },
  closing: { accent: "from-slate-500 via-slate-600 to-slate-700",     glow: "shadow-slate-500/20",   iconBg: "from-slate-600 to-slate-800",                       spotlightRgb: "148,163,184" },
  other:   { accent: "from-violet-500 via-purple-500 to-pink-500",    glow: "shadow-purple-500/30",  iconBg: "from-violet-600 to-purple-600",                     spotlightRgb: "168,85,247" },
};

function cleanBodyMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    // Any " - **Label:** text" inline → break onto its own line
    .replace(/\s+-\s+\*\*([^*\n]+\*\*)/g, "\n- **$1")
    // " * **Label:** text" inline → proper bullet
    .replace(/\s+\*\s+\*\*/g, "\n- **")
    // Line starting with "* **" → bullet with bold
    .replace(/^\*\s+\*\*/gm, "- **")
    // Line starting with "* " → plain bullet
    .replace(/^\*\s+(?!\*)/gm, "- ")
    // Close any unclosed bold at line end
    .replace(/\*\*([^*\n]+)$/gm, "**$1**")
    // Break long paragraphs where a bold label appears mid-paragraph after a period
    .replace(/([.!?])\s+\*\*([^*]+?)\*\*/g, "$1\n\n**$2**")
    // Ensure "**HH:MM Uhr – Title**" blocks sit on their own line
    .replace(/([^\n])\s+\*\*(\d{1,2}[:.]?\d{0,2}\s*Uhr)/g, "$1\n\n**$2")
    // Strip trailing orphan ** markers
    .replace(/\*\*\s*$/gm, "")
    // Remove any remaining "lonely" ** with nothing between
    .replace(/\*\*\s*\*\*/g, "")
    // Collapse blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cleans up survey destination values like "de_berlin" → "Berlin" */
function cleanDestinationLabel(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/^(?:de|en|es|fr|it|nl|pl|pt|tr|ar)_/i, "");
  if (!stripped || stripped.toLowerCase() === "city" || stripped.toLowerCase() === "either") {
    return null;
  }
  return stripped
    .split(/[_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const markdownComponents = {
  h1: ({ children }: any) => <h3 className="text-lg font-black text-foreground mt-4 mb-2">{children}</h3>,
  h2: ({ children }: any) => <h3 className="text-base font-bold text-foreground mt-4 mb-2">{children}</h3>,
  h3: ({ children }: any) => <h4 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h4>,
  strong: ({ children }: any) => <strong className="text-foreground font-bold">{children}</strong>,
  ul: ({ children }: any) => <ul className="space-y-1.5 my-2 pl-5 list-disc marker:text-primary/70">{children}</ul>,
  ol: ({ children }: any) => <ol className="space-y-1.5 my-2 pl-5 list-decimal marker:text-primary/70">{children}</ol>,
  li: ({ children }: any) => <li className="text-muted-foreground/95 leading-relaxed">{children}</li>,
  p:  ({ children }: any) => <p className="text-muted-foreground/95 mb-2.5 leading-relaxed">{children}</p>,
  hr: () => <hr className="my-4 border-border/40" />,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary/50 pl-4 my-3 italic text-muted-foreground/80">{children}</blockquote>,
  code: ({ children }: any) => <code className="px-1.5 py-0.5 rounded bg-muted/50 text-primary font-mono text-xs">{children}</code>,
};

// ---------------------------------------------------------------------------
// Section card with spotlight + inline services
// ---------------------------------------------------------------------------

interface SectionCardProps {
  section: NarrativeSection;
  index: number;
  services: ContextualService[];
  participantCount?: number;
  city?: string;
  onBookService: (slug: string) => void;
}

function SectionCard({ section, index, services, participantCount, city, onBookService }: SectionCardProps) {
  const { t } = useTranslation();
  const style = SECTION_STYLES[section.kind];
  const [mouse, setMouse] = useState({ x: 50, y: 50, active: false });
  const cleaned = useMemo(() => cleanBodyMarkdown(section.body), [section.body]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y, active: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {section.kind === "day" && (
        <div className="absolute -left-3 sm:-left-4 top-6 z-10 hidden sm:flex items-center justify-center">
          <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-xs shadow-lg ai-pulse-ring", style.iconBg, style.glow)}>
            {section.dayNumber ?? "•"}
          </div>
        </div>
      )}

      <GlassCard
        className={cn(
          "relative overflow-hidden p-0 border-white/10 hover:border-white/20 transition-all shadow-xl",
          style.glow,
        )}
        onMouseMove={handleMove as any}
        onMouseLeave={() => setMouse((m) => ({ ...m, active: false }))}
      >
        <div className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", style.accent)} />

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: mouse.active ? 1 : 0,
            background: `radial-gradient(400px circle at ${mouse.x}% ${mouse.y}%, rgba(${style.spotlightRgb}, 0.12), transparent 60%)`,
          }}
        />

        <div className={cn(
          "absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none bg-gradient-to-br",
          style.accent,
        )} />

        <div className="relative p-5 md:p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn(
              "flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl md:text-4xl shadow-lg",
              style.iconBg,
              style.glow,
            )}>
              {section.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {style.label && (
                <Badge className={cn(
                  "mb-1.5 text-[10px] font-bold uppercase tracking-widest border-0 text-white bg-gradient-to-r",
                  style.accent,
                )}>
                  {style.label}{section.kind === "day" && section.dayNumber ? ` ${section.dayNumber}` : ""}
                </Badge>
              )}
              <h3 className="text-xl md:text-2xl font-black leading-tight text-foreground">
                {section.title}
              </h3>
            </div>
          </div>

          {/* Body — budget gets visualizer, everything else markdown */}
          {section.kind === "budget" ? (
            <>
              <BudgetVisualizer body={section.body} participantCount={participantCount} />
              {/* Still show any free-form tail below the visualizer */}
            </>
          ) : cleaned ? (
            <div className="prose prose-sm md:prose-base prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {cleaned}
              </ReactMarkdown>
            </div>
          ) : null}

          {/* Inline services */}
          {services.length > 0 && section.kind !== "budget" && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                  {city
                    ? t("dashboard.ai.bookableIn", "Direkt buchbar in {{city}}", { city })
                    : t("dashboard.ai.bookableHere", "Direkt buchbar")}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {services.map((svc, i) => {
                  const Icon = svc.icon;
                  return (
                    <motion.button
                      key={svc.slug}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      onClick={() => onBookService(svc.slug)}
                      className="group/svc relative text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 transition-all overflow-hidden"
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover/svc:opacity-[0.08] transition-opacity bg-gradient-to-br",
                        svc.gradient,
                      )} />
                      <div className="relative p-3 flex items-center gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
                          svc.gradient,
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-foreground truncate">{svc.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="truncate">{svc.agency}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                            <span>{svc.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-foreground">{svc.pricePerPerson}€</div>
                          <div className="text-[10px] text-muted-foreground -mt-0.5">
                            {svc.priceType === "per_person"
                              ? t("dashboard.ai.perPerson", "pro Person")
                              : ""}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover/svc:text-foreground group-hover/svc:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface EpicNarrativeResponseProps {
  response: string;
  eventName?: string;
  eventId?: string;              // user's EventBliss event — used for ad-attribution linkage
  requestType?: string;          // AI request type — used for ad-attribution log
  participantCount?: number;
  budget?: string;
  city?: string;
  eventType?: string;
  onAddAllToPlanner?: () => void;
}

export const EpicNarrativeResponse = ({
  response,
  eventName,
  eventId,
  requestType,
  participantCount,
  budget,
  city,
  eventType,
  onAddAllToPlanner,
}: EpicNarrativeResponseProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackImpressions, trackClick } = useServiceAdTracker();
  const [copiedAll, setCopiedAll] = useState(false);
  const [heroBurst, setHeroBurst] = useState(true);
  const [ctaBurst, setCtaBurst] = useState(false);

  // Clean the city label before anything else — "de_city" → null, "de_berlin" → "Berlin"
  const displayCity = useMemo(() => cleanDestinationLabel(city), [city]);

  const { intro, sections } = useMemo(() => parseNarrative(response), [response]);

  // Real services per section + an aggregate query across the full text.
  // Also scan the raw response text for city mentions (Freiburg, Berlin, etc.)
  // so the hook catches agencies even when survey destination_pref was garbage.
  const sectionTextBlobs = useMemo(
    () => sections.map((s) => `${s.title}\n${s.body}`),
    [sections],
  );
  const aggregateBlob = useMemo(() => sectionTextBlobs.join("\n\n") + "\n" + response, [sectionTextBlobs, response]);

  // City for service lookup — prefer the cleaned display city, but fall back to
  // scanning the response body for a German city name (so Fambliss-Freiburg
  // gets matched even when destination_pref is "de_city").
  const serviceCity = useMemo(() => {
    if (displayCity) return displayCity;
    // Quick heuristic: look for a capitalized city name near "in" or "aus" in the response
    const m = response.match(/\bin\s+([A-ZÄÖÜ][a-zäöüß]{3,})\b/);
    return m ? m[1] : undefined;
  }, [displayCity, response]);

  // Enterprise-only: only paying agencies appear in AI recommendations.
  const aggregate = useContextualServices({
    text: aggregateBlob,
    city: serviceCity,
    eventType,
    limit: 12,
  });

  // Distribute aggregate matches across sections by keyword overlap
  const servicesPerSection = useMemo(() => {
    if (aggregate.services.length === 0) return sections.map(() => [] as ContextualService[]);

    return sections.map((section) => {
      if (section.kind === "budget" || section.kind === "closing") return [];
      const text = `${section.title} ${section.body}`.toLowerCase();
      // Pick services whose category matches one of the section's implied categories
      const scored = aggregate.services.map((svc) => {
        let score = 0;
        if (text.includes(svc.category)) score += 2;
        // Fuzzy match: check if any word of the service title shows in the section body
        const titleWords = svc.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        for (const w of titleWords) {
          if (text.includes(w)) score += 1;
        }
        return { svc, score };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

      return scored.slice(0, 2).map((x) => x.svc);
    });
  }, [sections, aggregate.services]);

  // Track services already shown inline — bottom bar shows the complement
  const shownSlugs = useMemo(() => {
    const set = new Set<string>();
    servicesPerSection.flat().forEach((s) => set.add(s.slug));
    return set;
  }, [servicesPerSection]);

  const remainingServices = useMemo(
    () => aggregate.services.filter((s) => !shownSlugs.has(s.slug)),
    [aggregate.services, shownSlugs],
  );

  // ───── Impression tracking ─────
  const excerpt = useMemo(() => response.slice(0, 500), [response]);

  // Inline-section impressions: one batch per section, with correct sectionTitle
  useEffect(() => {
    if (servicesPerSection.length === 0) return;
    sections.forEach((section, i) => {
      const svcs = servicesPerSection[i];
      if (!svcs || svcs.length === 0) return;
      trackImpressions(svcs, {
        requestType,
        eventId,
        sourceLocation: "inline_section",
        sectionTitle: section.title,
        responseExcerpt: excerpt,
        cityHint: displayCity || serviceCity || undefined,
        eventTypeHint: eventType,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, servicesPerSection, requestType, eventId, excerpt]);

  // Aggregated bottom-bar impressions
  useEffect(() => {
    if (remainingServices.length === 0) return;
    trackImpressions(remainingServices.slice(0, 6), {
      requestType,
      eventId,
      sourceLocation: "aggregate_bottom",
      responseExcerpt: excerpt,
      cityHint: displayCity || serviceCity || undefined,
      eventTypeHint: eventType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingServices, requestType, eventId, excerpt]);

  // Book click handler factory — accepts the service object so we can log
  // full attribution (service_id, agency_id, match meta) before navigating.
  const makeBookHandler = (service: ContextualService, sourceLocation: "inline_section" | "aggregate_bottom", sectionTitle?: string) => async () => {
    const ctx = {
      requestType,
      eventId,
      sourceLocation,
      sectionTitle,
      cityHint: displayCity || serviceCity || undefined,
      eventTypeHint: eventType,
    };
    // Fire-and-forget: don't block navigation if tracking fails
    trackClick(service, ctx).catch(() => {});
    navigate(`/marketplace/service/${service.slug}`);
  };

  // Legacy signature kept for call sites that only have a slug; resolves the
  // service object from aggregate and forwards to the tracked handler.
  const handleBookService = (slug: string) => {
    const svc = aggregate.services.find((s) => s.slug === slug);
    if (svc) {
      makeBookHandler(svc, "aggregate_bottom")();
      return;
    }
    navigate(`/marketplace/service/${slug}`);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(response);
    setCopiedAll(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleShare = async () => {
    const title = eventName ? `${eventName} — ${t("dashboard.ai.recommendations", "AI-Empfehlungen")}` : t("dashboard.ai.recommendations", "AI-Empfehlungen");
    try {
      if (navigator.share) {
        await navigator.share({ title, text: response });
      } else {
        await navigator.clipboard.writeText(response);
        toast.success(t("common.copied"));
      }
    } catch {
      /* user canceled */
    }
  };

  const handleAddAll = () => {
    if (!onAddAllToPlanner) {
      navigate("/marketplace");
      return;
    }
    onAddAllToPlanner();
    setCtaBurst(false);
    setTimeout(() => setCtaBurst(true), 40);
    toast.success(t("dashboard.ai.batchAddSuccess", "Alle Aktivitäten wurden deinem Event-Planer hinzugefügt"));
  };

  // Fire hero confetti only once when the response first loads
  useEffect(() => {
    setHeroBurst(false);
    const t = setTimeout(() => setHeroBurst(true), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <div className="relative space-y-5">
      {/* ───── Hero header ───── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/15"
      >
        <ConfettiBurst trigger={heroBurst} origin="top-right" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-amber-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.35),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(168,85,247,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative p-5 md:p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 opacity-50 blur-md -z-10" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-300 mb-0.5">
                {t("dashboard.ai.recommendations", "AI-Empfehlungen")}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                {eventName || t("dashboard.ai.yourEvent", "Dein Event-Plan")}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {displayCity && (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white/90 text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {displayCity}
              </Badge>
            )}
            {participantCount ? (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white/90 text-xs">
                👥 {participantCount} {t("dashboard.overview.participants", "Teilnehmer")}
              </Badge>
            ) : null}
            {budget && (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white/90 text-xs">
                <Wallet className="w-3 h-3 mr-1" />
                {budget}
              </Badge>
            )}
            {sections.length > 0 && (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white text-xs">
                {sections.length} {t("dashboard.ai.sections", "Abschnitte")}
              </Badge>
            )}
            {/* Intentionally no "ads" / "partner agency" badge — recommendations
                should feel organic and integrated into the AI response. */}
          </div>

          {intro && (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {cleanBodyMarkdown(intro)}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>

      {/* ───── Section timeline ───── */}
      <div className="relative space-y-4 sm:pl-8">
        {sections.some((s) => s.kind === "day") && (
          <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-purple-600/40 via-indigo-500/40 to-cyan-500/0 hidden sm:block" />
        )}

        {sections.map((section, i) => (
          <SectionCard
            key={i}
            section={section}
            index={i}
            services={servicesPerSection[i] || []}
            participantCount={participantCount}
            city={displayCity || serviceCity || undefined}
            onBookService={handleBookService}
          />
        ))}
      </div>

      {/* ───── Aggregated services CTA (shows services NOT already inline) ───── */}
      {remainingServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/15"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-500/15 to-cyan-500/20" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-foreground">
                  {t("dashboard.ai.readyToBook", "Bereit zum Buchen")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.ai.matchedPartners", "Diese Partner-Agenturen passen zu deinem Plan")}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {remainingServices.slice(0, 6).map((svc, i) => {
                const Icon = svc.icon;
                return (
                  <motion.button
                    key={svc.slug}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    onClick={() => handleBookService(svc.slug)}
                    className="group relative text-left rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 hover:-translate-y-0.5 transition-all overflow-hidden p-4"
                  >
                    <div className={cn(
                      "absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity bg-gradient-to-br",
                      svc.gradient,
                    )} />
                    <div className="relative flex items-center justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
                        svc.gradient,
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <Badge className="bg-white/10 text-white/80 text-[10px] border-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                        {svc.rating.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="relative">
                      <div className="font-black text-foreground text-base mb-0.5 truncate">{svc.title}</div>
                      <div className="text-xs text-muted-foreground mb-3 truncate">{svc.agency}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div>
                          <span className="text-xl font-black text-foreground">{svc.pricePerPerson}€</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {svc.priceType === "per_person"
                              ? `/${t("dashboard.ai.perPerson", "pro Person").replace(/^pro\s*/i, "")}`
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-foreground group-hover:gap-2 transition-all">
                          {t("dashboard.ai.bookableHere", "Direkt buchbar")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ───── Footer actions ───── */}
      <div className="relative flex flex-wrap items-center gap-2 justify-end pt-2">
        <ConfettiBurst trigger={ctaBurst} origin="center" />
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          {t("common.share", "Teilen")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
          {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {t("dashboard.ai.copyAll", "Alles kopieren")}
        </Button>
        {onAddAllToPlanner && (
          <Button size="sm" onClick={handleAddAll} className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform">
            <Calendar className="w-3.5 h-3.5" />
            {t("dashboard.ai.addAllToPlanner", "Alle zum Planer")}
          </Button>
        )}
        <Button size="sm" onClick={() => navigate("/marketplace")} className="gap-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-0 font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform liquid-shimmer">
          <Flame className="w-3.5 h-3.5" />
          {t("dashboard.ai.exploreMore", "Alle Services entdecken")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
