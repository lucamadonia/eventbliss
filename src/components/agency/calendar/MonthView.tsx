import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import type { Conflict } from "@/hooks/useBookingConflicts";
import { ConflictBadge } from "./ConflictBadge";
import { BookingCard } from "./BookingCard";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

interface Props {
  year: number;
  month: number;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  bookingsByDate: Record<string, MarketplaceBooking[]>;
  conflicts: Map<string, Conflict[]>;
  onSelectBooking: (b: MarketplaceBooking) => void;
  onCreateBooking: (dateISO: string) => void;
}

export function MonthView({
  year, month, selectedDay, onSelectDay,
  bookingsByDate, conflicts, onSelectBooking, onCreateBooking,
}: Props) {
  const { t } = useTranslation();
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDay, daysInMonth]);

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Max bookings on any day for density scaling
  const maxPerDay = useMemo(() => {
    let m = 0;
    Object.values(bookingsByDate).forEach((arr) => { if (arr.length > m) m = arr.length; });
    return m;
  }, [bookingsByDate]);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedKey = selectedDay ? dateKey(selectedDay) : null;
  const selectedBookings = selectedKey ? bookingsByDate[selectedKey] ?? [] : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* Grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const key = dateKey(day);
            const dayBookings = bookingsByDate[key] ?? [];
            const density = maxPerDay > 0 ? dayBookings.length / maxPerDay : 0;
            const isToday = key === todayKey;
            const isSelected = selectedDay === day;
            const hasConflict = dayBookings.some((b) => (conflicts.get(b.id)?.length ?? 0) > 0);

            return (
              <button
                key={idx}
                onClick={() => onSelectDay(day)}
                onDoubleClick={() => onCreateBooking(key)}
                className={cn(
                  "aspect-square p-1.5 rounded-xl text-left flex flex-col transition-all cursor-pointer relative overflow-hidden border",
                  isSelected ? "border-violet-500/50 bg-violet-500/10" :
                    hasConflict ? "border-red-500/30 hover:border-red-500/60" :
                      "border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04]",
                )}
                title={t("agency.calendar.month.doubleClickHint", "Doppelklick für neuen Termin")}
              >
                {/* Density heatmap */}
                {density > 0 && !isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(180deg, transparent 40%, rgba(139,92,246,${0.08 + density * 0.18}) 100%)`,
                    }}
                  />
                )}
                <div className="relative flex items-center justify-between mb-0.5">
                  <span
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday && "bg-violet-500 text-white font-bold",
                      !isToday && isSelected && "text-violet-300",
                      !isToday && !isSelected && "text-slate-300",
                    )}
                  >
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[9px] font-bold text-violet-300 bg-violet-500/15 rounded-full px-1.5 py-0">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                <div className="relative flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "text-[9px] truncate rounded px-1 py-0.5 bg-white/[0.06] text-white/80 border",
                        conflicts.get(b.id)?.length ? "border-red-500/40" : "border-white/[0.05]",
                      )}
                    >
                      {b.booking_time?.slice(0, 5)} · {b.customer_name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-[8px] text-slate-500">+{dayBookings.length - 2} weitere</div>
                  )}
                </div>
                {hasConflict && (
                  <div className="absolute top-1 right-1">
                    <ConflictBadge conflicts={dayBookings.flatMap((b) => conflicts.get(b.id) ?? [])} size="sm" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div>
        {selectedDay ? (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="font-bold text-slate-50">
                {selectedDay}. {new Date(year, month).toLocaleDateString("de-DE", { month: "long" })}
              </h4>
              <span className="text-xs text-slate-500">
                {selectedBookings.length} {selectedBookings.length === 1 ? "Termin" : "Termine"}
              </span>
            </div>
            {selectedBookings.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                {t("agency.calendar.month.noBookings", "Keine Termine an diesem Tag.")}
              </div>
            ) : (
              <div className="space-y-2">
                {selectedBookings
                  .sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || ""))
                  .map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      conflicts={conflicts.get(b.id)}
                      onClick={() => onSelectBooking(b)}
                    />
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 text-center text-xs text-slate-500">
            {t("agency.calendar.month.selectDay", "Wähle einen Tag für Details — Doppelklick für neuen Termin")}
          </div>
        )}
      </div>
    </div>
  );
}
