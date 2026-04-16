import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface CalendarFilterState {
  service: string;      // "all" or service_id
  guide: string;        // "all" | "unassigned" | guide_id
  status: string;       // "all" | booking_status
}

interface Props {
  filters: CalendarFilterState;
  onChange: (next: CalendarFilterState) => void;
  services: Array<{ id: string; title: string }>;
  guides: Array<{ id: string; name: string }>;
}

export function CalendarFilters({ filters, onChange, services, guides }: Props) {
  const { t } = useTranslation();

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "all", label: t("agency.calendar.filter.statusAll", "Alle Status") },
    { value: "pending_confirmation", label: t("agency.calendar.filter.pending", "Ausstehend") },
    { value: "confirmed", label: t("agency.calendar.filter.confirmed", "Bestätigt") },
    { value: "completed", label: t("agency.calendar.filter.completed", "Abgeschlossen") },
    { value: "cancelled_by_customer", label: t("agency.calendar.filter.cancelled", "Storniert") },
  ];

  const activeFilterCount = [filters.service, filters.guide, filters.status].filter((v) => v !== "all").length;
  const clearAll = () =>
    onChange({ service: "all", guide: "all", status: "all" });

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <Select value={filters.service} onValueChange={(v) => onChange({ ...filters, service: v })}>
        <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs bg-white/[0.04] border-white/[0.08]">
          <SelectValue placeholder={t("agency.calendar.filter.service", "Service")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("agency.calendar.filter.serviceAll", "Alle Services")}</SelectItem>
          {services.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.guide} onValueChange={(v) => onChange({ ...filters, guide: v })}>
        <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs bg-white/[0.04] border-white/[0.08]">
          <SelectValue placeholder={t("agency.calendar.filter.guide", "Guide")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("agency.calendar.filter.guideAll", "Alle Guides")}</SelectItem>
          <SelectItem value="unassigned">{t("agency.calendar.filter.guideUnassigned", "Ohne Guide")}</SelectItem>
          {guides.map((g) => (
            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
        <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs bg-white/[0.04] border-white/[0.08]">
          <SelectValue placeholder={t("agency.calendar.filter.status", "Status")} />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 text-xs text-slate-400 hover:text-slate-200 gap-1.5"
        >
          <X className="w-3 h-3" />
          {t("agency.calendar.filter.clear", "Filter zurücksetzen")}
          <Badge variant="outline" className="ml-1 h-4 text-[9px]">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
