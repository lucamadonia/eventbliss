import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import type { Conflict } from "@/hooks/useBookingConflicts";
import { BookingCard } from "./BookingCard";
import { UserCog, Package } from "lucide-react";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type GroupMode = "guide" | "service";

interface Props {
  anchorDate: Date;
  bookings: MarketplaceBooking[];           // all filtered bookings
  conflicts: Map<string, Conflict[]>;
  guides: Array<{ id: string; name: string }>;
  services: Array<{ id: string; title: string }>;
  onSelectBooking: (b: MarketplaceBooking) => void;
  groupMode: GroupMode;
  onGroupModeChange: (m: GroupMode) => void;
}

export function ResourceView({
  anchorDate, bookings, conflicts, guides, services, onSelectBooking, groupMode, onGroupModeChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "de";
  const weekStart = useMemo(() => getWeekStart(anchorDate), [anchorDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Rows
  const resources = useMemo(() => {
    if (groupMode === "guide") {
      const rows = guides.map((g) => ({ id: g.id, label: g.name }));
      rows.push({ id: "__unassigned__", label: t("agency.calendar.resource.unassigned", "Ohne Guide") });
      return rows;
    }
    return services.map((s) => ({ id: s.id, label: s.title }));
  }, [groupMode, guides, services, t]);

  // Cell lookup
  const cellMap = useMemo(() => {
    const m = new Map<string, MarketplaceBooking[]>();
    bookings.forEach((b) => {
      const key = dateKey(new Date(b.booking_date));
      const resId = groupMode === "guide"
        ? ((b as unknown as { assigned_guide_id?: string | null }).assigned_guide_id ?? "__unassigned__")
        : (b.service_id as string);
      const k = `${resId}|${key}`;
      const list = m.get(k) ?? [];
      list.push(b);
      m.set(k, list);
    });
    return m;
  }, [bookings, groupMode]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Mode switcher */}
      <div className="p-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">{t("agency.calendar.resource.groupBy", "Gruppieren nach")}:</span>
        <button
          onClick={() => onGroupModeChange("guide")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
            groupMode === "guide"
              ? "bg-violet-500/25 text-violet-200"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]",
          )}
        >
          <UserCog className="w-3.5 h-3.5" />
          {t("agency.calendar.resource.byGuide", "Guide")}
        </button>
        <button
          onClick={() => onGroupModeChange("service")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
            groupMode === "service"
              ? "bg-violet-500/25 text-violet-200"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]",
          )}
        >
          <Package className="w-3.5 h-3.5" />
          {t("agency.calendar.resource.byService", "Service")}
        </button>
      </div>

      {/* Grid header */}
      <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-white/[0.08] bg-white/[0.02] sticky top-0 z-10">
        <div className="p-2 text-[10px] text-slate-500 uppercase font-bold">
          {groupMode === "guide"
            ? t("agency.calendar.resource.guide", "Guide")
            : t("agency.calendar.resource.service", "Service")}
        </div>
        {days.map((d) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={d.toISOString()} className={cn("p-2 text-center text-[11px] font-semibold border-l border-white/[0.05]", isToday ? "text-violet-300" : "text-slate-400")}>
              {d.toLocaleDateString(lang, { weekday: "short" })}
              <div className="text-[10px] text-slate-500 font-normal">
                {d.toLocaleDateString(lang, { day: "2-digit", month: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid rows */}
      <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
        {resources.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            {groupMode === "guide"
              ? t("agency.calendar.resource.noGuides", "Noch keine Guides — füge welche im Guides-Modul hinzu")
              : t("agency.calendar.resource.noServices", "Noch keine Services")}
          </div>
        ) : (
          resources.map((res) => (
            <div key={res.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-white/[0.04]">
              <div className="p-2 text-xs font-semibold text-slate-200 bg-white/[0.01] flex items-center truncate">
                {res.label}
              </div>
              {days.map((d) => {
                const bookingsInCell = cellMap.get(`${res.id}|${dateKey(d)}`) ?? [];
                return (
                  <div key={d.toISOString()} className="p-1 border-l border-white/[0.05] min-h-[72px] space-y-1">
                    {bookingsInCell
                      .sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || ""))
                      .map((b) => (
                        <BookingCard
                          key={b.id}
                          booking={b}
                          conflicts={conflicts.get(b.id)}
                          onClick={() => onSelectBooking(b)}
                          compact
                        />
                      ))}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
