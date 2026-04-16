import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Search, AlertTriangle, Sparkles } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type DateRangePreset = "all" | "today" | "this-week" | "this-month" | "upcoming" | "past";

export interface CalendarFilterState {
  service: string;           // "all" or service_id
  guide: string;             // "all" | "unassigned" | guide_id
  status: string;            // "all" | booking_status
  source: string;            // "all" | "marketplace" | "manual"
  dateRange: DateRangePreset; // date filter chip
  customerSearch: string;    // free text
  onlyConflicts: boolean;    // show only bookings with conflicts
}

export const DEFAULT_FILTERS: CalendarFilterState = {
  service: "all",
  guide: "all",
  status: "all",
  source: "all",
  dateRange: "all",
  customerSearch: "",
  onlyConflicts: false,
};

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

  const sourceOptions: Array<{ value: string; label: string }> = [
    { value: "all", label: t("agency.calendar.filter.sourceAll", "Alle Quellen") },
    { value: "marketplace", label: t("agency.calendar.filter.sourceMarketplace", "Marketplace") },
    { value: "manual", label: t("agency.calendar.filter.sourceManual", "Manuell") },
  ];

  const dateRangePresets: Array<{ value: DateRangePreset; label: string }> = [
    { value: "all", label: t("agency.calendar.filter.dateAll", "Alle") },
    { value: "today", label: t("agency.calendar.filter.dateToday", "Heute") },
    { value: "this-week", label: t("agency.calendar.filter.dateWeek", "Woche") },
    { value: "this-month", label: t("agency.calendar.filter.dateMonth", "Monat") },
    { value: "upcoming", label: t("agency.calendar.filter.dateUpcoming", "Kommend") },
    { value: "past", label: t("agency.calendar.filter.datePast", "Vergangen") },
  ];

  const activeFilterCount = [
    filters.service !== "all",
    filters.guide !== "all",
    filters.status !== "all",
    filters.source !== "all",
    filters.dateRange !== "all",
    filters.customerSearch.length > 0,
    filters.onlyConflicts,
  ].filter(Boolean).length;

  const clearAll = () => onChange(DEFAULT_FILTERS);

  return (
    <div className="space-y-2 no-print">
      {/* Date range presets */}
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5 w-fit">
        {dateRangePresets.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange({ ...filters, dateRange: p.value })}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer",
              filters.dateRange === p.value
                ? "bg-violet-500/25 text-violet-200"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Dropdowns + search + toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.service} onValueChange={(v) => onChange({ ...filters, service: v })}>
          <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs bg-white/[0.04] border-white/[0.08] text-slate-200">
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
          <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs bg-white/[0.04] border-white/[0.08] text-slate-200">
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
          <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs bg-white/[0.04] border-white/[0.08] text-slate-200">
            <SelectValue placeholder={t("agency.calendar.filter.status", "Status")} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.source} onValueChange={(v) => onChange({ ...filters, source: v })}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs bg-white/[0.04] border-white/[0.08] text-slate-200">
            <SelectValue placeholder={t("agency.calendar.filter.source", "Quelle")} />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Customer search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <Input
            value={filters.customerSearch}
            onChange={(e) => onChange({ ...filters, customerSearch: e.target.value })}
            placeholder={t("agency.calendar.filter.customerPlaceholder", "Kunde / E-Mail / Nr.")}
            className="h-8 pl-7 pr-2 text-xs w-[180px] bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-500"
          />
        </div>

        {/* Only-conflicts toggle */}
        <button
          onClick={() => onChange({ ...filters, onlyConflicts: !filters.onlyConflicts })}
          className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-md border transition-colors cursor-pointer",
            filters.onlyConflicts
              ? "bg-red-500/20 border-red-500/50 text-red-300"
              : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200",
          )}
          title={t("agency.calendar.filter.onlyConflicts", "Nur Konflikte anzeigen")}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("agency.calendar.filter.conflictsOnly", "Nur Konflikte")}</span>
        </button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs text-slate-400 hover:text-slate-200 gap-1.5"
          >
            <X className="w-3 h-3" />
            {t("agency.calendar.filter.clear", "Filter zurücksetzen")}
            <Badge variant="outline" className="ml-1 h-4 text-[9px]">{activeFilterCount}</Badge>
          </Button>
        )}

        {activeFilterCount === 0 && (
          <span className="text-[10px] text-slate-500 flex items-center gap-1 ml-auto">
            <Sparkles className="w-3 h-3" />
            {t("agency.calendar.filter.allShown", "Keine Filter aktiv — alle Buchungen sichtbar")}
          </span>
        )}
      </div>
    </div>
  );
}
