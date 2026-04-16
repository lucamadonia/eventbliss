import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import type { Conflict } from "@/hooks/useBookingConflicts";
import { ConflictBadge } from "./ConflictBadge";
import { Users } from "lucide-react";

const HOUR_START = 7;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT = 80; // px per hour

interface Props {
  date: Date;
  bookings: MarketplaceBooking[];       // bookings ONLY for this day
  conflicts: Map<string, Conflict[]>;
  onSelectBooking: (b: MarketplaceBooking) => void;
  onCreateBooking: (dateISO: string, time?: string) => void;
  durationLookup?: Map<string, number>;
}

interface PositionedBooking {
  booking: MarketplaceBooking;
  topPx: number;
  heightPx: number;
  column: number;       // 0-based, for side-by-side concurrent bookings
  columnCount: number;  // total columns this booking shares with
}

// Simple interval packing: greedy columns
function packBookings(bookings: MarketplaceBooking[], durationLookup?: Map<string, number>): PositionedBooking[] {
  const withRanges = bookings
    .map((b) => {
      if (!b.booking_time) return null;
      const [hh, mm] = b.booking_time.split(":").map(Number);
      if (Number.isNaN(hh)) return null;
      const start = hh + mm / 60;
      const duration = durationLookup?.get(b.service_id as string) ?? 60;
      const end = start + duration / 60;
      return { booking: b, start, end };
    })
    .filter((x): x is { booking: MarketplaceBooking; start: number; end: number } => x !== null)
    .sort((a, b) => a.start - b.start);

  // Sweep: assign columns
  const columns: Array<{ end: number }> = [];
  const positions: Array<{ col: number; start: number; end: number; booking: MarketplaceBooking }> = [];

  withRanges.forEach((item) => {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c].end <= item.start) {
        columns[c].end = item.end;
        positions.push({ col: c, start: item.start, end: item.end, booking: item.booking });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({ end: item.end });
      positions.push({ col: columns.length - 1, start: item.start, end: item.end, booking: item.booking });
    }
  });

  // Compute columnCount per booking (overlap group)
  return positions.map((p) => {
    let maxCol = p.col;
    positions.forEach((q) => {
      if (q === p) return;
      if (q.start < p.end && p.start < q.end) {
        maxCol = Math.max(maxCol, q.col);
      }
    });
    return {
      booking: p.booking,
      topPx: (p.start - HOUR_START) * SLOT_HEIGHT,
      heightPx: Math.max(40, (p.end - p.start) * SLOT_HEIGHT),
      column: p.col,
      columnCount: maxCol + 1,
    };
  });
}

export function DayView({ date, bookings, conflicts, onSelectBooking, onCreateBooking, durationLookup }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "de";
  const positioned = useMemo(() => packBookings(bookings, durationLookup), [bookings, durationLookup]);

  const dateIso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex items-baseline justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-50">
            {date.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h4>
          <p className="text-xs text-slate-500">
            {bookings.length} {bookings.length === 1 ? "Termin" : "Termine"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[64px_1fr] max-h-[calc(100vh-320px)] overflow-y-auto">
        {/* Hour column */}
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="p-1 text-[10px] text-slate-500 font-mono text-right pr-2 border-b border-white/[0.04]"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative border-l border-white/[0.05]">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => onCreateBooking(dateIso, `${String(h).padStart(2, "0")}:00`)}
              className="block w-full border-b border-white/[0.04] hover:bg-violet-500/5 cursor-pointer transition-colors"
              style={{ height: `${SLOT_HEIGHT}px` }}
              aria-label={`${h}:00`}
            >
              {/* Half-hour subdivider */}
              <div className="h-1/2 border-b border-white/[0.02]" />
            </button>
          ))}

          {positioned.map(({ booking, topPx, heightPx, column, columnCount }) => {
            const widthPct = 100 / columnCount;
            const leftPct = column * widthPct;
            const bookingConflicts = conflicts.get(booking.id) ?? [];
            return (
              <button
                key={booking.id}
                onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                className={cn(
                  "absolute rounded-lg px-2 py-1.5 text-left transition-all cursor-pointer overflow-hidden shadow-md",
                  "bg-gradient-to-br from-violet-500/50 to-pink-500/40 border border-violet-400/60 text-white",
                  "hover:from-violet-500/70 hover:to-pink-500/60 hover:z-20 hover:shadow-lg",
                  bookingConflicts.length > 0 && "ring-2 ring-red-500/60",
                )}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  left: `calc(${leftPct}% + 4px)`,
                  width: `calc(${widthPct}% - 8px)`,
                }}
              >
                <div className="flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-bold">{booking.booking_time?.slice(0, 5)}</div>
                    <div className="text-xs font-bold truncate">{booking.service_title}</div>
                    <div className="text-[11px] text-white/80 truncate">{booking.customer_name}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/70">
                      <Users className="w-2.5 h-2.5" />
                      <span>{booking.participant_count}</span>
                    </div>
                  </div>
                  {bookingConflicts.length > 0 && <ConflictBadge conflicts={bookingConflicts} size="sm" />}
                </div>
              </button>
            );
          })}

          {bookings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
              {t("agency.calendar.day.empty", "Keine Termine — klick auf einen Zeitslot um einen Termin anzulegen")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
