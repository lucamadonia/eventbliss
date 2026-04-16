import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserCog, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgencyGuidesList, useAssignGuideToBooking } from "@/hooks/useAgencyEarnings";

const UNASSIGNED = "__unassigned__";

interface Props {
  bookingId: string;
  agencyId: string;
  currentGuideId?: string | null;
  compact?: boolean;
}

export function BookingGuideAssign({ bookingId, agencyId, currentGuideId, compact }: Props) {
  const { t } = useTranslation();
  const { data: guides = [], isLoading } = useAgencyGuidesList(agencyId);
  const assign = useAssignGuideToBooking();

  const handleChange = (value: string) => {
    const nextGuideId = value === UNASSIGNED ? null : value;
    assign.mutate(
      { bookingId, guideId: nextGuideId },
      {
        onSuccess: () => {
          toast.success(nextGuideId
            ? t("bookingsManager.guideAssigned", "Guide zugewiesen")
            : t("bookingsManager.guideUnassigned", "Zuweisung entfernt"));
        },
        onError: (err: Error) => {
          toast.error(`${t("common.error", "Fehler")}: ${err.message}`);
        },
      },
    );
  };

  const currentValue = currentGuideId ?? UNASSIGNED;
  const currentGuide = guides.find((g) => g.id === currentGuideId);

  if (isLoading && guides.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[11px] text-slate-500", compact ? "" : "px-2")}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {t("bookingsManager.guideLoading", "Lade Guides…")}
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[11px] text-slate-500", compact ? "" : "px-2")}>
        <UserCog className="w-3 h-3" />
        {t("bookingsManager.noGuides", "Keine Guides — füge welche im Guides-Modul hinzu")}
      </div>
    );
  }

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={assign.isPending}>
      <SelectTrigger className={cn(
        "bg-white/[0.04] border-white/[0.08] text-xs cursor-pointer",
        compact ? "h-8 w-[160px]" : "h-9 w-[200px]",
        currentGuideId ? "text-slate-200" : "text-slate-500",
      )}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {assign.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          ) : currentGuide ? (
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
          ) : (
            <UserCog className="w-3 h-3 shrink-0" />
          )}
          <SelectValue placeholder={t("bookingsManager.guidePlaceholder", "Guide zuweisen")}>
            {currentGuide ? currentGuide.name : t("bookingsManager.guidePlaceholder", "Guide zuweisen")}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED} className="cursor-pointer">
          <span className="text-slate-400">— {t("bookingsManager.guideNone", "kein Guide")} —</span>
        </SelectItem>
        {guides.map((g) => (
          <SelectItem key={g.id} value={g.id} className="cursor-pointer">
            {g.name}
            {g.email && <span className="text-slate-500 text-[10px] ml-1.5">({g.email})</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
