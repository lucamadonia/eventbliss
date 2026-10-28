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
import { parseActivitiesExtended, parseDayPlan, parseTripIdeas, type ParsedActivity, type ParsedTimeBlock } from "@/lib/ai-response-parser";

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
  activity?: ParsedActivity;
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
  if (TIPS_PATTERN.test(lower) || emoji === "💡" || emoji === "🔥") return { kind: "tips" };
  if (BUDGET_PATTERN.test(lower) || emoji === "💰") return { kind: "budget" };
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
    sections: sections.filter((section) => section.body && section.body.replace(/[*#\s]/g, "").length > 0),
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
    // If the model emits unmatched emphasis, show clean text instead of raw markers.
    .split("\n")
    .map((line) => ((line.match(/\*\*/g) || []).length % 2 ? line.replace(/\*\*/g, "") : line))
    .join("\n")
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
  timeBlocks?: ParsedTimeBlock[];
  dayName?: string;
  onAddTimeBlock?: (block: ParsedTimeBlock, dayName: string) => void;
  onAddToPlanner?: (activity: ParsedActivity) => void;
}

function SectionCard({ section, index, services, participantCount, city, onBookService, timeBlocks, dayName, onAddTimeBlock, onAddToPlanner }: SectionCardProps) {
  const { t } = useTranslation();
  const style = SECTION_STYLES[section.kind];
  const cleaned = useMemo(() => cleanBodyMarkdown(section.body), [section.body]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {section.kind === "day" && (
        <div className="absolute -left-3 sm:-left-4 top-6 z-10 hidden sm:flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#baa8ef]/30 bg-[#251e3b] text-xs font-semibold text-[#d7c7ff]">
            {section.dayNumber ?? "•"}
          </div>
        </div>
      )}

      <GlassCard className="relative overflow-hidden rounded-[24px] border border-border/70 bg-card/80 p-0 shadow-none">
        <div className="relative p-5 md:p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50 text-2xl">
              {section.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {style.label && (
                <Badge variant="outline" className="mb-1.5 border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.kind === "day" ? t("dashboard.ai.dayLabel", "Tag") : section.kind === "tips" ? t("dashboard.ai.tipsLabel", "Tipps") : style.label}{section.kind === "day" && section.dayNumber ? ` ${section.dayNumber}` : ""}
                </Badge>
              )}
              <h3 className="text-lg font-semibold leading-tight text-foreground md:text-xl">
                {section.title}
              </h3>
            </div>
          </div>

          {/* Body — budget gets visualizer, everything else markdown */}
          {timeBlocks && timeBlocks.length > 0 ? (
            <div className="space-y-2 border-l border-primary/25 pl-4">
              {timeBlocks.map((block, blockIndex) => (
                <div key={`${block.time}-${blockIndex}`} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-start gap-3">
                    <span className="min-w-12 pt-0.5 text-xs font-semibold tabular-nums text-primary">{block.time}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{block.title}</p>
                      {block.description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{block.description}</p>}
                    </div>
                    {onAddTimeBlock && <button type="button" onClick={() => onAddTimeBlock(block, dayName || section.title)} className="shrink-0 rounded-full border border-primary/25 bg-primary/10 p-2 text-primary" aria-label={t("dashboard.ai.addToPlanner", "Zum Zeitplan hinzufügen")}><Calendar className="h-4 w-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          ) : section.kind === "budget" ? (
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

          {onAddToPlanner && section.kind === "other" && cleaned && (
            <button
              type="button"
              onClick={() => onAddToPlanner(section.activity ?? { emoji: section.emoji, title: section.title, category: "activity", duration: "", cost: "", fitness: "normal", description: cleaned, rawSection: `${section.title}\n${section.body}` })}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
            >
              <Calendar className="h-4 w-4" />{t("dashboard.ai.addToPlanner", "Zum Zeitplan hinzufügen")}
            </button>
          )}

          {/* Inline services */}
          {services.length > 0 && section.kind !== "budget" && (
            <div className="mt-5 pt-5 border-t border-border">
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
              <div className="grid gap-2.5 sm:grid-cols-2">
                {services.map((svc, i) => {
                  const Icon = svc.icon;
                  return (
                    <motion.button
                      key={svc.slug}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      onClick={() => onBookService(svc.slug)}
                      className="group/svc relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-foreground/25 hover:bg-muted"
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover/svc:opacity-[0.08] transition-opacity bg-gradient-to-br",
                        svc.gradient,
                      )} />
                      <div className="relative flex min-w-0 items-center gap-3 p-3">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          {svc.coverUrl ? <img src={svc.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Icon className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{svc.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="truncate">{svc.agency}</span>
                            {svc.reviewCount > 0 && svc.rating > 0 && <><span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" /><Star className="h-2.5 w-2.5 flex-shrink-0 fill-amber-400 text-amber-400" /><span>{svc.rating.toFixed(1)}</span></>}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-primary">{svc.pricePerPerson > 0 ? `${svc.pricePerPerson} €${svc.priceType === "per_person" ? ` ${t("dashboard.ai.perPerson", "pro Person")}` : ""}` : t("dashboard.ai.priceOnRequest", "Preis auf Anfrage")}</div>
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
  onAddTimeBlock?: (block: ParsedTimeBlock, dayName: string) => void;
  onAddToPlanner?: (activity: ParsedActivity) => void;
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
  onAddTimeBlock,
  onAddToPlanner,
}: EpicNarrativeResponseProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackImpressions, trackClick } = useServiceAdTracker();
  const [copiedAll, setCopiedAll] = useState(false);

  // Clean the city label before anything else — "de_city" → null, "de_berlin" → "Berlin"
  const displayCity = useMemo(() => cleanDestinationLabel(city), [city]);

  const parsedDays = useMemo(() => requestType === "day_plan" ? parseDayPlan(response).days : [], [requestType, response]);
  const { intro, sections } = useMemo(() => {
    if (requestType === "day_plan" && parsedDays.length > 0) {
      const plan = parseDayPlan(response);
      return {
        intro: plan.intro,
        sections: parsedDays.map((day, index): NarrativeSection => ({
          emoji: day.emoji || "📅",
          title: day.title || day.dayName,
          body: day.timeBlocks.map((block) => `${block.time} ${block.title} ${block.description} ${block.location}`).join("\n"),
          kind: "day",
          dayNumber: index + 1,
        })),
      };
    }
    if (requestType === "activities" || requestType === "recommend_services") {
      const parsed = parseActivitiesExtended(response);
      if (parsed.activities.length > 0) return {
        intro: parsed.intro,
        sections: parsed.activities.map((activity): NarrativeSection => ({
          emoji: activity.emoji || "✨",
          title: activity.title,
          body: [activity.description, activity.duration && `Dauer: ${activity.duration}`, activity.cost && `Kosten: ${activity.cost}`, activity.location && `Ort: ${activity.location}`].filter(Boolean).join("\n"),
          kind: "other",
          activity,
        })),
      };
    }
    if (requestType === "trip_ideas") {
      const parsed = parseTripIdeas(response);
      if (parsed.ideas.length > 0) return {
        intro: parsed.intro,
        sections: parsed.ideas.map((idea): NarrativeSection => ({
          emoji: idea.emoji || "📍",
          title: idea.title,
          body: [idea.destination, idea.description, idea.cost, ...idea.highlights].filter(Boolean).join("\n\n"),
          kind: "other",
        })),
      };
    }
    return parseNarrative(response);
  }, [requestType, response, parsedDays]);

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
    onAddAllToPlanner?.();
  };

  return (
    <div className="relative space-y-5">
      {/* ───── Hero header ───── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-border bg-card"
      >
        <div className="relative p-5 md:p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("dashboard.ai.recommendations", "AI-Empfehlungen")}
              </div>
              <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
                {eventName || t("dashboard.ai.yourEvent", "Dein Event-Plan")}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {displayCity && (
              <Badge variant="outline" className="border-border bg-muted/40 text-xs text-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                {displayCity}
              </Badge>
            )}
            {participantCount ? (
              <Badge variant="outline" className="border-border bg-muted/40 text-xs text-foreground">
                👥 {participantCount} {t("dashboard.overview.participants", "Teilnehmer")}
              </Badge>
            ) : null}
            {budget && (
              <Badge variant="outline" className="border-border bg-muted/40 text-xs text-foreground">
                <Wallet className="w-3 h-3 mr-1" />
                {budget}
              </Badge>
            )}
            {sections.length > 0 && (
              <Badge variant="outline" className="border-border bg-muted/40 text-xs text-foreground">
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
            timeBlocks={section.kind === "day" ? parsedDays[sections.slice(0, i + 1).filter((item) => item.kind === "day").length - 1]?.timeBlocks : undefined}
            dayName={section.title}
            onAddTimeBlock={onAddTimeBlock}
            onAddToPlanner={requestType === "activities" || requestType === "recommend_services" ? onAddToPlanner : undefined}
          />
        ))}
      </div>

      {/* ───── Aggregated services CTA (shows services NOT already inline) ───── */}
      {remainingServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-[24px] border border-border bg-card"
        >
          <div className="relative p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
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
                    className="group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted"
                  >
                    <div className={cn(
                      "absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity bg-gradient-to-br",
                      svc.gradient,
                    )} />
                    <div className="relative flex items-center justify-between mb-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-muted">
                        {svc.coverUrl ? <img src={svc.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Icon className="h-5 w-5 text-primary" />}
                      </div>
                      {svc.reviewCount > 0 && svc.rating > 0 && <Badge className="bg-muted text-muted-foreground text-[10px] border-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                        {svc.rating.toFixed(1)}
                      </Badge>}
                    </div>
                    <div className="relative">
                      <div className="font-black text-foreground text-base mb-0.5 truncate">{svc.title}</div>
                      <div className="text-xs text-muted-foreground mb-3 truncate">{svc.agency}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <span className="text-base font-semibold text-foreground">{svc.pricePerPerson > 0 ? `${svc.pricePerPerson} €` : t("dashboard.ai.priceOnRequest", "Preis auf Anfrage")}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {svc.pricePerPerson > 0 && svc.priceType === "per_person"
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

      {!aggregate.isLoading && aggregate.services.length === 0 && (
        <div className="flex items-start gap-3 rounded-[24px] border border-border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShoppingBag className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">{t("dashboard.ai.noMatchingServices", "Noch keine passenden buchbaren Angebote")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("dashboard.ai.noMatchingServicesDesc", "Entdecke weitere Erlebnisse im Marketplace oder verfeinere deinen Entwurf.")}</p>
            <button type="button" onClick={() => navigate("/marketplace")} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">{t("dashboard.ai.exploreMore", "Alle Services entdecken")} <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      {/* ───── Footer actions ───── */}
      <div className="relative flex flex-wrap items-center gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          {t("common.share", "Teilen")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
          {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {t("dashboard.ai.copyAll", "Alles kopieren")}
        </Button>
        {onAddAllToPlanner && requestType === "day_plan" && parsedDays.some((day) => day.timeBlocks.length > 0) && (
          <Button size="sm" onClick={handleAddAll} className="gap-1.5 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {t("dashboard.ai.addAllToPlanner", "Plan in Zeitplan übernehmen")}
          </Button>
        )}
        <Button size="sm" onClick={() => navigate("/marketplace")} className="gap-1.5 font-semibold">
          <Flame className="w-3.5 h-3.5" />
          {t("dashboard.ai.exploreMore", "Alle Services entdecken")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
