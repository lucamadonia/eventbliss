/**
 * ResponseSubComponents — reusable sub-components for NativeResponsesTab.
 * AnimatedCounter, BarChart, Skeleton, EmptyState, DetailPill,
 * ResponseCard, CategoryCard, PreferencesChart.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  ChevronDown, Inbox, Heart, MessageSquare, AlertTriangle,
  CalendarDays, MapPin, DollarSign, Car, Dumbbell, Wine,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  type ResponseRow, type CategoryDef,
  ATTENDANCE_CONFIG, timeAgo, getInitials, getAvatarColor, countValues, translateValue,
} from "./responseHelpers";

// ─── AnimatedCounter ─────────────────────────────────────────────

export function AnimatedCounter({ value, duration: dur = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctrl = animate(prevValue.current, value, {
      duration: dur,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = Math.round(v).toString(); },
    });
    prevValue.current = value;
    return () => ctrl.stop();
  }, [value, dur]);

  return <span ref={ref}>0</span>;
}

// ─── BarChart ────────────────────────────────────────────────────

export function BarChart({
  data, maxValue, gradient,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  gradient: string;
}) {
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/80 truncate max-w-[70%]">{item.label}</span>
            <span className="text-muted-foreground font-medium tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-foreground/5 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
              initial={{ width: 0 }}
              animate={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              transition={{ ...spring.soft, delay: i * 0.06 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────

export function ResponsesSkeleton() {
  return (
    <motion.div className="space-y-4" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-4 space-y-2">
            <div className="h-4 w-10 rounded bg-foreground/10 animate-pulse" />
            <div className="h-7 w-14 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-16 rounded bg-foreground/10 animate-pulse" />
          </div>
        ))}
      </motion.div>
      {[1, 2, 3].map((i) => (
        <motion.div key={i} variants={staggerItem}
          className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-foreground/10 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-40 rounded bg-foreground/10 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <motion.div className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring.soft}>
      <motion.div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-6"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Inbox className="w-9 h-9 text-violet-400" />
      </motion.div>
      <h3 className="text-lg font-display font-bold text-foreground mb-2">
        {t("dashboard.responses.noResponses")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
        {t("dashboard.responses.noResponsesDesc")}
      </p>
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── DetailPill ──────────────────────────────────────────────────

export function DetailPill({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) {
  return (
    <div className="rounded-xl bg-foreground/5 px-3 py-2 space-y-0.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" /> {label}
      </p>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

// ─── ResponseCard ────────────────────────────────────────────────

export function ResponseCard({ response, index }: { response: ResponseRow; index: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const haptics = useHaptics();
  const att = ATTENDANCE_CONFIG[response.attendance as keyof typeof ATTENDANCE_CONFIG];
  const AttIcon = att?.icon;

  return (
    <motion.div variants={staggerItem} layout
      className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden">
      <motion.button className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }}
        onClick={() => { haptics.light(); setExpanded(!expanded); }}>
        <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg", getAvatarColor(response.participant))}>
          <span className="text-xs font-bold text-white">{getInitials(response.participant)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-display font-semibold text-foreground truncate">{response.participant}</p>
            {att && (
              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", att.bg, att.text, att.border)}>
                {AttIcon && <AttIcon className="w-2.5 h-2.5" />}
                {t(`nativeResponses.attendance.${att.i18nKey}`)}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {timeAgo(response.created_at, t)}
            {response.de_city && ` · ${response.de_city}`}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={spring.snappy}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={spring.snappy} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-2.5">
                <DetailPill label={t("dashboard.responses.columns.budget")} value={response.budget} icon={DollarSign} />
                <DetailPill label={t("dashboard.responses.columns.destination")} value={translateValue(response.destination, "destination", t)} icon={MapPin} />
                <DetailPill label={t("dashboard.responses.columns.duration")} value={translateValue(response.duration_pref, "duration_pref", t)} icon={CalendarDays} />
                <DetailPill label={t("dashboard.responses.columns.travel")} value={translateValue(response.travel_pref, "travel_pref", t)} icon={Car} />
                <DetailPill label={t("dashboard.responses.columns.fitness")} value={translateValue(response.fitness_level, "fitness_level", t)} icon={Dumbbell} />
                <DetailPill label={t("dashboard.responses.columns.alcohol")} value={translateValue(response.alcohol || "", "alcohol", t) || t("nativeResponses.noAnswer")} icon={Wine} />
              </div>

              {response.preferences?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {t("nativeResponses.preferences")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.preferences.map((pref, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {response.restrictions && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {t("dashboard.responses.columns.restrictions")}
                  </p>
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl px-3 py-2">{response.restrictions}</p>
                </div>
              )}

              {response.suggestions && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {t("dashboard.responses.columns.suggestions")}
                  </p>
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl px-3 py-2 italic">
                    &ldquo;{response.suggestions}&rdquo;
                  </p>
                </div>
              )}

              {response.date_blocks?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {t("nativeResponses.availableDates")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.date_blocks.map((d, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {response.partial_days && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {t("nativeResponses.sections.partialAvailability")}
                  </p>
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl px-3 py-2">{response.partial_days}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CategoryCard ────────────────────────────────────────────────

export function CategoryCard({ category, responses }: { category: CategoryDef; responses: ResponseRow[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();
  const Icon = category.icon;

  const values = responses.map((r) => {
    const val = r[category.key];
    return typeof val === "string" ? translateValue(val, category.key, t) : null;
  }).filter(Boolean) as string[];

  const counts = countValues(values);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  const maxVal = sorted.length > 0 ? sorted[0].value : 0;
  const topAnswer = sorted.length > 0 ? sorted[0].label : "---";

  if (sorted.length === 0) return null;

  return (
    <motion.div layout className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden">
      <motion.button className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }} onClick={() => { haptics.light(); setOpen(!open); }}>
        <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", category.gradient)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">
            {t(`nativeResponses.categories.${category.i18nKey}`)}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">Top: {topAnswer}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("nativeResponses.option", { count: sorted.length })}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={spring.snappy}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={spring.snappy} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              <BarChart data={sorted} maxValue={maxVal} gradient={category.gradient} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PreferencesChart ────────────────────────────────────────────

export function PreferencesChart({ responses }: { responses: ResponseRow[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();

  const allPrefs = responses.flatMap((r) => r.preferences || []);
  const counts = countValues(allPrefs);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  if (sorted.length === 0) return null;
  const maxVal = sorted[0].value;

  return (
    <motion.div layout className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden">
      <motion.button className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }} onClick={() => { haptics.light(); setOpen(!open); }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">
            {t("nativeResponses.activitiesAndPreferences")}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">Top: {sorted[0]?.label || "---"}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={spring.snappy}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={spring.snappy} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              <BarChart data={sorted.slice(0, 10)} maxValue={maxVal} gradient="from-rose-500 to-pink-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
