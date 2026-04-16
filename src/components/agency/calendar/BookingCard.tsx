import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConflictBadge } from "./ConflictBadge";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import type { Conflict } from "@/hooks/useBookingConflicts";

export interface BookingLike extends MarketplaceBooking {
  assigned_guide_id?: string | null;
  assigned_guide_name?: string | null;
  is_manual?: boolean | null;
}

const statusTint: Record<string, string> = {
  pending_confirmation: "from-cyan-500/25 to-cyan-600/10 border-cyan-500/40",
  confirmed: "from-emerald-500/25 to-emerald-600/10 border-emerald-500/40",
  completed: "from-violet-500/20 to-violet-600/5 border-violet-500/30",
  cancelled_by_customer: "from-red-500/15 to-red-600/5 border-red-500/30",
  cancelled_by_agency: "from-red-500/15 to-red-600/5 border-red-500/30",
  pending_payment: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
};

interface Props {
  booking: BookingLike;
  conflicts?: Conflict[];
  onClick?: () => void;
  compact?: boolean;
  showTime?: boolean;
  className?: string;
}

export function BookingCard({ booking, conflicts, onClick, compact, showTime = true, className }: Props) {
  const tint = statusTint[booking.status] ?? statusTint.pending_confirmation;
  const hasConflicts = conflicts && conflicts.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-lg bg-gradient-to-br border backdrop-blur-sm transition-all cursor-pointer",
        "hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
        tint,
        hasConflicts && "ring-2 ring-red-500/60",
        compact ? "p-1.5" : "p-2.5",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {showTime && (
            <div className="flex items-center gap-1 text-[10px] text-white/60 font-mono font-bold mb-0.5">
              <Clock className="w-3 h-3" />
              {booking.booking_time?.slice(0, 5)}
            </div>
          )}
          <div className={cn(
            "font-semibold text-white truncate leading-tight",
            compact ? "text-[11px]" : "text-xs",
          )}>
            {booking.service_title || "Service"}
          </div>
          <div className={cn(
            "text-white/70 truncate leading-tight mt-0.5",
            compact ? "text-[10px]" : "text-[11px]",
          )}>
            {booking.customer_name}
          </div>
          {!compact && (
            <div className="flex items-center gap-2 mt-1 text-[10px] text-white/55">
              <span className="flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                {booking.participant_count}
              </span>
              {booking.assigned_guide_name && (
                <span className="truncate" title={booking.assigned_guide_name}>
                  · {booking.assigned_guide_name}
                </span>
              )}
              {booking.is_manual && (
                <span className="text-[9px] px-1 py-0 rounded bg-white/10 text-white/80 font-bold">MANUAL</span>
              )}
            </div>
          )}
        </div>
        {hasConflicts && <ConflictBadge conflicts={conflicts} size="sm" />}
      </div>
    </button>
  );
}
