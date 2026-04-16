import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import type { Conflict } from "@/hooks/useBookingConflicts";
import { ConflictBadge } from "./ConflictBadge";

const HOUR_START = 8;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayHeader(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { weekday: "short", day: "2-digit" });
}

interface Props {
  anchorDate: Date;          // any date within the target week
  bookingsByDate: Record<string, MarketplaceBooking[]>;
  conflicts: Map<string, Conflict[]>;
  onSelectBooking: (b: MarketplaceBooking) => void;
  onCreateBooking: (dateISO: string, time?: string) => void;
  durationLookup?: Map<string, number>; // service_id -> minutes
}

export function WeekView({
  anchorDate, bookingsByDate, conflicts, onSelectBooking, onCreateBooking, durationLookup,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "de";
  const weekStart = useMemo(() => getWeekStart(anchorDate), [anchorDate]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.08] bg-white/[0.02] sticky top-0 z-10">
        <div className="p-2 text-[10px] text-slate-500 uppercase font-bold text-center">
          {t("agency.calendar.week.time", "Uhr")}
        </div>
        {days.map((d) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={d.toISOString()} className="p-2 text-center border-l border-white/[0.05]">
              <div className={cn("text-xs font-bold", isToday ? "text-violet-300" : "text-slate-300")}>
                {formatDayHeader(d, lang)}
              </div>
              {isToday && <div className="text-[9px] text-violet-400 font-bold uppercase">{t("agency.calendar.today", "Heute")}</div>}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {/* Hour column */}
        <div>
          {HOURS.map((h) => (
            <div key={h} className="h-14 p-1 text-[10px] text-slate-500 font-mono text-right pr-2 border-b border-white/[0.04]">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((d) => {
          const key = dateKey(d);
          const dayBookings = bookingsByDate[key] ?? [];
          return (
            <div key={d.toISOString()} className="relative border-l border-white/[0.05]">
              {/* Hour slots (clickable to create) */}
              {HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => onCreateBooking(key, `${String(h).padStart(2, "0")}:00`)}
                  className="block w-full h-14 border-b border-white/[0.04] hover:bg-violet-500/5 cursor-pointer transition-colors"
                  aria-label={`${key} ${h}:00`}
                />
              ))}

              {/* Bookings overlay */}
              {dayBookings.map((b) => {
                if (!b.booking_time) return null;
                const [hh, mm] = b.booking_time.split(":").map(Number);
                if (Number.isNaN(hh)) return null;
                if (hh < HOUR_START || hh > HOUR_END) return null;
                const topPx = (hh - HOUR_START) * 56 + (mm / 60) * 56;
                const durationMinutes = durationLookup?.get(b.service_id as string) ?? 60;
                const heightPx = Math.max(32, (durationMinutes / 60) * 56);
                const bookingConflicts = conflicts.get(b.id) ?? [];

                return (
                  <button
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onSelectBooking(b); }}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-1.5 py-1 text-left transition-all cursor-pointer overflow-hidden",
                      "bg-gradient-to-br from-violet-500/40 to-pink-500/30 border border-violet-400/50 text-white",
                      "hover:from-violet-500/60 hover:to-pink-500/50 hover:z-20 hover:shadow-lg",
                      bookingConflicts.length > 0 && "ring-2 ring-red-500/60",
                    )}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                  >
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono font-bold">{b.booking_time.slice(0, 5)}</div>
                        <div className="text-[11px] font-semibold truncate">{b.service_title}</div>
                        <div className="text-[10px] text-white/70 truncate">{b.customer_name}</div>
                      </div>
                      {bookingConflicts.length > 0 && <ConflictBadge conflicts={bookingConflicts} size="sm" />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
