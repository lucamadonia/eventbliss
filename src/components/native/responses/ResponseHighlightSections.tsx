/**
 * ResponseHighlightSections — prominent standalone sections for
 * Suggestions, Restrictions, and Partial Availability.
 * Always expanded, no accordion — designed for immediate visibility.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MessageSquare, AlertTriangle, CalendarDays } from "lucide-react";
import { spring, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { type ResponseRow, getInitials, getAvatarColor } from "./responseHelpers";

// ─── Shared Entry Card ───────────────────────────────────────────

function EntryCard({
  name, text, accentBg, index,
}: {
  name: string;
  text: string;
  accentBg: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.soft, delay: index * 0.05 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border border-border",
        accentBg,
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm",
        getAvatarColor(name),
      )}>
        <span className="text-[10px] font-bold text-white">{getInitials(name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{name}</p>
        <p className="text-xs text-foreground/80 leading-relaxed mt-0.5 whitespace-pre-line">{text}</p>
      </div>
    </motion.div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────

function HighlightSection({
  icon: Icon,
  gradient,
  title,
  count,
  children,
}: {
  icon: typeof MessageSquare;
  gradient: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", gradient)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">{title}</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-foreground/10 text-muted-foreground tabular-nums">
          {t("nativeResponses.sections.entries", { count })}
        </span>
      </div>

      {/* Entries */}
      <div className="px-4 pb-4 space-y-2">
        {children}
      </div>
    </motion.div>
  );
}

// ─── Suggestions Section ─────────────────────────────────────────

export function SuggestionsSection({ responses }: { responses: ResponseRow[] }) {
  const { t } = useTranslation();

  const entries = useMemo(
    () => responses.filter((r) => r.suggestions && r.suggestions.trim().length > 0),
    [responses],
  );

  if (entries.length === 0) return null;

  return (
    <HighlightSection
      icon={MessageSquare}
      gradient="from-amber-500 to-orange-600"
      title={t("nativeResponses.sections.suggestions")}
      count={entries.length}
    >
      {entries.map((r, i) => (
        <EntryCard
          key={r.id}
          name={r.participant}
          text={r.suggestions!}
          accentBg="bg-amber-500/[0.04]"
          index={i}
        />
      ))}
    </HighlightSection>
  );
}

// ─── Restrictions Section ────────────────────────────────────────

const SKIP_RESTRICTIONS = new Set(["keine", "nein", "no", "none", "-", "n/a", "na", "nichts"]);

export function RestrictionsSection({ responses }: { responses: ResponseRow[] }) {
  const { t } = useTranslation();

  const entries = useMemo(
    () => responses.filter((r) => {
      if (!r.restrictions || !r.restrictions.trim()) return false;
      return !SKIP_RESTRICTIONS.has(r.restrictions.trim().toLowerCase());
    }),
    [responses],
  );

  if (entries.length === 0) return null;

  return (
    <HighlightSection
      icon={AlertTriangle}
      gradient="from-red-500 to-rose-600"
      title={t("nativeResponses.sections.restrictions")}
      count={entries.length}
    >
      {entries.map((r, i) => (
        <EntryCard
          key={r.id}
          name={r.participant}
          text={r.restrictions!}
          accentBg="bg-red-500/[0.04]"
          index={i}
        />
      ))}
    </HighlightSection>
  );
}

// ─── Partial Availability Section ────────────────────────────────

export function PartialAvailabilitySection({ responses }: { responses: ResponseRow[] }) {
  const { t } = useTranslation();

  const entries = useMemo(
    () => responses.filter((r) => r.partial_days && r.partial_days.trim().length > 0),
    [responses],
  );

  if (entries.length === 0) return null;

  return (
    <HighlightSection
      icon={CalendarDays}
      gradient="from-cyan-500 to-blue-600"
      title={t("nativeResponses.sections.partialAvailability")}
      count={entries.length}
    >
      {entries.map((r, i) => (
        <EntryCard
          key={r.id}
          name={r.participant}
          text={r.partial_days!}
          accentBg="bg-cyan-500/[0.04]"
          index={i}
        />
      ))}
    </HighlightSection>
  );
}
