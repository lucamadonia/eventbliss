/**
 * NativeEventSchedule — "Zeitplan" tab for the Event Dashboard.
 * Vertical timeline with animated connecting lines, stagger reveal,
 * expand-on-tap activity cards, day selector, and Add Activity FAB.
 */
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  User,
  X,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem, duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NativeEventScheduleProps {
  eventSlug: string;
}

type ActivityCategory =
  | "food"
  | "activity"
  | "transport"
  | "party"
  | "sightseeing"
  | "accommodation"
  | "relaxation"
  | "other";

interface Activity {
  id: string;
  time: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  duration: string;
  cost: string | null;
  location?: string;
  emoji: string;
  responsible?: string;
}

interface DayTab {
  label: string;
  date: string; // ISO
  activities: Activity[];
}

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_META: Record<ActivityCategory, { icon: string; color: string }> = {
  food:          { icon: "\uD83C\uDF55", color: "from-orange-500 to-amber-400" },
  activity:      { icon: "\uD83C\uDFAF", color: "from-violet-500 to-purple-500" },
  transport:     { icon: "\uD83D\uDE90", color: "from-blue-500 to-cyan-400" },
  party:         { icon: "\uD83C\uDF89", color: "from-pink-500 to-rose-400" },
  sightseeing:   { icon: "\uD83D\uDDFA", color: "from-emerald-500 to-teal-400" },
  accommodation: { icon: "\uD83C\uDFE8", color: "from-indigo-500 to-blue-400" },
  relaxation:    { icon: "\uD83D\uDC86", color: "from-cyan-400 to-sky-300" },
  other:         { icon: "\uD83D\uDCCC", color: "from-gray-500 to-slate-400" },
};

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string }[] = [
  { value: "food", label: "Essen & Trinken" },
  { value: "activity", label: "Aktivitaet" },
  { value: "transport", label: "Transport" },
  { value: "party", label: "Party" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "accommodation", label: "Unterkunft" },
  { value: "relaxation", label: "Entspannung" },
  { value: "other", label: "Sonstiges" },
];

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ACTIVITIES: Activity[] = [
  { id: "1", time: "10:00", title: "Fruehstueck im Hotel", category: "food", duration: "1h", cost: null, location: "Hotel Adlon, Berlin", emoji: "\uD83C\uDF73", responsible: "Lisa", description: "Gemeinsames Fruehstueck am grossen Tisch im Wintergarten." },
  { id: "2", time: "12:00", title: "Escape Room Adventure", category: "activity", duration: "2h", cost: "25\u20AC/P", location: "Exit Games Berlin", emoji: "\uD83D\uDD10", responsible: "Max", description: "Raum: 'Das verlorene Labor'. Schwierigkeitsgrad 4/5!" },
  { id: "3", time: "14:30", title: "Cocktail Workshop", category: "activity", duration: "2h", cost: "39\u20AC/P", location: "Mixology Bar", emoji: "\uD83C\uDF78", description: "Lernt eure eigenen Signature-Cocktails zu mixen." },
  { id: "4", time: "17:00", title: "Hotel Check-in & Umziehen", category: "accommodation", duration: "1h", cost: null, location: "Hotel Adlon", emoji: "\uD83C\uDFE8", description: "Zimmer beziehen und fuer den Abend fertig machen." },
  { id: "5", time: "19:00", title: "Dinner im Steakhaus", category: "food", duration: "2h", cost: "45\u20AC/P", location: "Block House", emoji: "\uD83E\uDD69", responsible: "Tom", description: "Tisch fuer 12 Personen ist reserviert. Dresscode: Smart Casual." },
  { id: "6", time: "22:00", title: "Club & Party", category: "party", duration: "open", cost: "20\u20AC Eintritt", location: "Berghain", emoji: "\uD83C\uDF89", responsible: "Anna", description: "Gaesteliste ist organisiert. Treffpunkt am Eingang." },
];

const MOCK_DAYS: DayTab[] = [
  { label: "Fr 15.05", date: "2026-05-15", activities: MOCK_ACTIVITIES },
  { label: "Sa 16.05", date: "2026-05-16", activities: [] },
  { label: "So 17.05", date: "2026-05-17", activities: [] },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const timelineLineVariant = {
  initial: { scaleY: 0, originY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: duration.dramatic, ease: ease.out, delay: 0.15 },
  },
};

const dotVariant = {
  initial: { scale: 0, opacity: 0 },
  animate: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { ...spring.bouncy, delay: 0.2 + i * 0.08 },
  }),
};

const cardVariant = {
  initial: { opacity: 0, x: 24, scale: 0.95 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...spring.soft, delay: 0.25 + i * 0.08 },
  }),
};

const timeVariant = {
  initial: { opacity: 0, x: -12 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...spring.snappy, delay: 0.2 + i * 0.08 },
  }),
};

const expandVariant = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { ...spring.soft, opacity: { duration: duration.quick } } },
  exit: { height: 0, opacity: 0, transition: { duration: duration.quick, ease: ease.in } },
};

const fabVariant = {
  initial: { scale: 0, rotate: -90 },
  animate: { scale: 1, rotate: 0, transition: { ...spring.bouncy, delay: 0.5 } },
};

const overlayVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.quick } },
  exit: { opacity: 0, transition: { duration: duration.instant } },
};

const formVariant = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: spring.slow },
  exit: { y: "100%", opacity: 0, transition: { duration: duration.smooth, ease: ease.in } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NativeEventSchedule({ eventSlug }: NativeEventScheduleProps) {
  const haptics = useHaptics();
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("12:00");
  const [formCategory, setFormCategory] = useState<ActivityCategory>("activity");
  const [formNotes, setFormNotes] = useState("");

  const days = MOCK_DAYS;
  const activities = useMemo(() => days[selectedDay]?.activities ?? [], [selectedDay]);

  const toggleExpand = useCallback(
    (id: string) => {
      haptics.light();
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [haptics],
  );

  const handleDaySelect = useCallback(
    (idx: number) => {
      haptics.light();
      setSelectedDay(idx);
      setExpandedId(null);
    },
    [haptics],
  );

  const handleAddActivity = useCallback(() => {
    haptics.medium();
    // In production, this would dispatch to the store / API
    setShowForm(false);
    setFormTitle("");
    setFormTime("12:00");
    setFormCategory("activity");
    setFormNotes("");
  }, [haptics]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* ------- Day Selector ------- */}
      {days.length > 1 && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 overflow-x-auto no-scrollbar">
          {days.map((day, idx) => {
            const active = idx === selectedDay;
            return (
              <button
                key={day.date}
                onClick={() => handleDaySelect(idx)}
                className="relative shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="day-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25"
                    transition={spring.snappy}
                  />
                )}
                <span className={cn("relative z-10", active ? "text-white" : "text-muted-foreground")}>
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ------- Timeline ------- */}
      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-4">
        {activities.length === 0 ? (
          /* ---------- Empty State ---------- */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.soft}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
              <Calendar className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Noch keine Aktivitaeten geplant</p>
              <p className="text-sm text-muted-foreground mt-1">Plane den perfekten Ablauf fuer euer Event</p>
            </div>
            <button
              onClick={() => { haptics.medium(); setShowForm(true); }}
              className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 active:scale-95 transition-transform"
            >
              Aktivitaet hinzufuegen
            </button>
          </motion.div>
        ) : (
          /* ---------- Activity Timeline ---------- */
          <div className="relative">
            {/* Vertical connecting line */}
            <motion.div
              variants={timelineLineVariant}
              initial="initial"
              animate="animate"
              className="absolute left-[54px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-violet-500 via-purple-500 to-cyan-500 rounded-full"
              style={{ transformOrigin: "top" }}
            />

            {/* Activity rows */}
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="flex flex-col gap-1"
            >
              {activities.map((act, i) => {
                const isExpanded = expandedId === act.id;
                const catMeta = CATEGORY_META[act.category];

                return (
                  <div key={act.id} className="relative flex items-start gap-0">
                    {/* Time */}
                    <motion.div
                      custom={i}
                      variants={timeVariant}
                      initial="initial"
                      animate="animate"
                      className="w-[42px] shrink-0 pt-3 text-right"
                    >
                      <span className="text-sm font-bold text-foreground font-mono tracking-tight">
                        {act.time}
                      </span>
                    </motion.div>

                    {/* Dot */}
                    <motion.div
                      custom={i}
                      variants={dotVariant}
                      initial="initial"
                      animate="animate"
                      className="relative shrink-0 w-[26px] flex justify-center pt-3.5 z-10"
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full bg-gradient-to-br shadow-lg",
                          catMeta.color,
                          isExpanded && "ring-2 ring-white/50 ring-offset-2 ring-offset-background",
                        )}
                      />
                    </motion.div>

                    {/* Card */}
                    <motion.div
                      custom={i}
                      variants={cardVariant}
                      initial="initial"
                      animate="animate"
                      className="flex-1 min-w-0 pb-3"
                    >
                      <motion.button
                        onClick={() => toggleExpand(act.id)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left rounded-2xl p-3.5 border transition-colors",
                          isExpanded
                            ? "bg-card/90 border-violet-500/30 shadow-lg shadow-violet-500/10"
                            : "bg-card/60 border-border/50 hover:border-violet-500/20",
                        )}
                      >
                        {/* Top row */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br text-lg shrink-0",
                              catMeta.color,
                            )}
                          >
                            {act.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-foreground truncate">
                              {act.title}
                            </p>
                            {act.description && !isExpanded && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {act.description}
                              </p>
                            )}
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={spring.snappy}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 text-[11px] font-medium">
                            <Clock className="w-3 h-3" />
                            {act.duration}
                          </span>
                          {act.cost && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-medium">
                              {act.cost}
                            </span>
                          )}
                          {act.responsible && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-[11px] font-medium">
                              <User className="w-3 h-3" />
                              {act.responsible}
                            </span>
                          )}
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              variants={expandVariant}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-border/40 space-y-2.5">
                                {act.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {act.description}
                                  </p>
                                )}
                                {act.location && (
                                  <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(act.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                  >
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="underline underline-offset-2">{act.location}</span>
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>

      {/* ------- FAB ------- */}
      <motion.button
        variants={fabVariant}
        initial="initial"
        animate="animate"
        whileTap={{ scale: 0.9 }}
        onClick={() => { haptics.medium(); setShowForm(true); }}
        className="fixed bottom-24 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 shadow-xl shadow-violet-600/40"
        style={{
          boxShadow: "0 0 24px rgba(139,92,246,0.4), 0 8px 32px rgba(139,92,246,0.25)",
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* ------- Add Activity Form (bottom sheet) ------- */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              variants={formVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card border-t border-border/50 p-5 pb-8 safe-bottom max-h-[80vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-border/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Aktivitaet hinzufuegen</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="z.B. Escape Room, Abendessen..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Kategorie
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const active = formCategory === opt.value;
                      const meta = CATEGORY_META[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { haptics.light(); setFormCategory(opt.value); }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                            active
                              ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                              : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border",
                          )}
                        >
                          <span>{meta.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Notizen
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optionale Details..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleAddActivity}
                  disabled={!formTitle.trim()}
                  className={cn(
                    "w-full py-3 rounded-2xl text-sm font-bold transition-all",
                    formTitle.trim()
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30 active:scale-[0.98]"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed",
                  )}
                >
                  Hinzufuegen
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
