import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  time?: string;
  type: "bachelor" | "corporate" | "birthday" | "trip" | "wedding" | "other";
  status: "active" | "planning" | "completed";
  location?: string;
  teamCount?: number;
}

const typeColors: Record<string, string> = {
  bachelor: "bg-violet-500",
  corporate: "bg-cyan-500",
  birthday: "bg-emerald-500",
  trip: "bg-amber-500",
  wedding: "bg-pink-500",
  other: "bg-slate-500",
};

const typeBadgeColors: Record<string, string> = {
  bachelor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  corporate: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  birthday: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  trip: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  wedding: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  planning: "Planung",
  completed: "Fertig",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  planning: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  completed: "bg-white/10 text-white/50 border-white/20",
};

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const mockCalendarEvents: CalendarEvent[] = [
  { id: "1", name: "Hochzeit Mueller", date: "2026-03-15", endDate: "2026-03-16", time: "14:00", type: "wedding", status: "active", location: "Schloss Neuschwanstein", teamCount: 5 },
  { id: "2", name: "Firmenfeier SAP", date: "2026-03-22", time: "18:00", type: "corporate", status: "active", location: "SAP Arena", teamCount: 8 },
  { id: "3", name: "JGA Hamburg", date: "2026-03-28", endDate: "2026-03-29", time: "10:00", type: "bachelor", status: "active", location: "Hamburg", teamCount: 3 },
  { id: "4", name: "Geburtstag 50er", date: "2026-04-10", time: "19:00", type: "birthday", status: "planning", location: "Restaurant Adler", teamCount: 2 },
  { id: "5", name: "Konferenz 2026", date: "2026-04-15", endDate: "2026-04-17", time: "09:00", type: "corporate", status: "planning", location: "Messe Berlin", teamCount: 6 },
  { id: "6", name: "Sommerfest", date: "2026-03-28", time: "15:00", type: "other", status: "planning", location: "Stadtpark", teamCount: 4 },
  { id: "7", name: "Team Retreat", date: "2026-03-30", time: "08:00", type: "trip", status: "active", location: "Schwarzwald", teamCount: 10 },
  { id: "8", name: "Produktlaunch", date: "2026-03-28", time: "11:00", type: "corporate", status: "active", location: "Hauptbuero", teamCount: 3 },
  { id: "9", name: "Charity Gala", date: "2026-03-28", time: "20:00", type: "other", status: "planning", location: "Grand Hotel", teamCount: 7 },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function AgencyCalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    mockCalendarEvents.forEach((ev) => {
      const start = new Date(ev.date);
      const end = ev.endDate ? new Date(ev.endDate) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    });
    return map;
  }, []);

  const selectedDateStr = selectedDay
    ? formatDate(year, month, selectedDay)
    : null;
  const selectedEvents = selectedDateStr ? eventsByDate[selectedDateStr] || [] : [];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Calendar Grid */}
      <GlassCard className="p-5" hoverGlow>
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-slate-50">
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const dateStr = formatDate(year, month, day);
            const isToday = dateStr === todayStr;
            const isSelected = day === selectedDay;
            const events = eventsByDate[dateStr] || [];
            const isPast =
              new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "aspect-square p-1 rounded-xl text-left flex flex-col transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-violet-500/20 border border-violet-500/40"
                    : "hover:bg-white/[0.04] border border-transparent",
                  isPast && !isSelected && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto",
                    isToday && "bg-violet-500 text-white",
                    !isToday && isSelected && "text-violet-300",
                    !isToday && !isSelected && "text-slate-300"
                  )}
                >
                  {day}
                </span>
                {events.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn("w-1.5 h-1.5 rounded-full", typeColors[ev.type])}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[8px] text-slate-500">+{events.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Day Detail Panel */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {selectedDay && (
            <motion.div
              key={`${year}-${month}-${selectedDay}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard className="p-5" gradient>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-50">{selectedDay}. {MONTHS[month]}</p>
                    <p className="text-xs text-slate-500">{selectedEvents.length} Events</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Neu
                  </Button>
                </div>

                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Keine Events an diesem Tag
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-8 rounded-full shrink-0", typeColors[ev.type])} />
                            <div>
                              <p className="text-sm font-medium text-slate-50">{ev.name}</p>
                              {ev.time && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {ev.time}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[ev.status])}>
                            {statusLabels[ev.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 ml-4">
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </span>
                          )}
                          {ev.teamCount && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {ev.teamCount}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer">
                            <ExternalLink className="w-3 h-3" />
                            Oeffnen
                          </button>
                          <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">
                            <Plus className="w-3 h-3" />
                            Aufgabe
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
