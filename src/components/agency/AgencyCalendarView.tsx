import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
  slug: string | null;
}

const typeColors: Record<string, string> = {
  bachelor: "bg-violet-500",
  corporate: "bg-cyan-500",
  birthday: "bg-emerald-500",
  trip: "bg-amber-500",
  wedding: "bg-pink-500",
  other: "bg-slate-500",
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
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, name, event_date, event_type, status, slug")
        .eq("created_by", user!.id);
      if (!cancelled) {
        const mapped: CalendarEvent[] = (data ?? [])
          .filter((e: any) => e.event_date)
          .map((e: any) => ({
            id: e.id,
            name: e.name || "Unnamed Event",
            date: e.event_date,
            type: e.event_type || "other",
            status: e.status || "planning",
            slug: e.slug ?? null,
          }));
        setEvents(mapped);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      const d = new Date(ev.date);
      const key = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const selectedDateStr = selectedDay ? formatDate(year, month, selectedDay) : null;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <GlassCard className="p-5" hoverGlow>
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-slate-50">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
            const dateStr = formatDate(year, month, day);
            const isToday = dateStr === todayStr;
            const isSelected = day === selectedDay;
            const dayEvents = eventsByDate[dateStr] || [];
            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "aspect-square p-1 rounded-xl text-left flex flex-col transition-all duration-200 cursor-pointer",
                  isSelected ? "bg-violet-500/20 border border-violet-500/40" : "hover:bg-white/[0.04] border border-transparent",
                  isPast && !isSelected && "opacity-50"
                )}
              >
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto",
                  isToday && "bg-violet-500 text-white",
                  !isToday && isSelected && "text-violet-300",
                  !isToday && !isSelected && "text-slate-300"
                )}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} className={cn("w-1.5 h-1.5 rounded-full", typeColors[ev.type] || typeColors.other)} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-slate-500">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

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
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Neu
                  </Button>
                </div>

                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Keine Events an diesem Tag</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-8 rounded-full shrink-0", typeColors[ev.type] || typeColors.other)} />
                            <div>
                              <p className="text-sm font-medium text-slate-50">{ev.name}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {ev.type}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[ev.status] || statusColors.planning)}>
                            {statusLabels[ev.status] || ev.status}
                          </Badge>
                        </div>
                        {ev.slug && (
                          <div className="ml-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/e/${ev.slug}/dashboard`)}
                              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Event öffnen
                            </button>
                          </div>
                        )}
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
