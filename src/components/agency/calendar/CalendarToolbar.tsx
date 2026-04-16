import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Plus, Download, Printer,
  CalendarDays, CalendarRange, Calendar as CalendarIcon, LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ViewMode = "month" | "week" | "day" | "resource";

const VIEW_TABS: Array<{ id: ViewMode; labelKey: string; defaultLabel: string; icon: typeof CalendarIcon }> = [
  { id: "month", labelKey: "agency.calendar.view.month", defaultLabel: "Monat", icon: CalendarIcon },
  { id: "week", labelKey: "agency.calendar.view.week", defaultLabel: "Woche", icon: CalendarRange },
  { id: "day", labelKey: "agency.calendar.view.day", defaultLabel: "Tag", icon: CalendarDays },
  { id: "resource", labelKey: "agency.calendar.view.resource", defaultLabel: "Ressource", icon: LayoutGrid },
];

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  title: string;                    // e.g. "Oktober 2026" or "Week 42 · 16. Okt"
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onExportICal: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onNewBooking: () => void;
  bookingCount: number;
}

export function CalendarToolbar({
  view, onViewChange, title, onPrev, onNext, onToday,
  onExportICal, onExportCSV, onPrint, onNewBooking, bookingCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
      {/* Left: title + nav */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev} className="h-8 w-8 p-0" aria-label="previous">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-[200px]">
          <div className="text-lg font-bold text-slate-50 leading-tight">{title}</div>
          <div className="text-xs text-slate-500">
            {bookingCount} {bookingCount === 1
              ? t("agency.calendar.bookingSingular", "Buchung")
              : t("agency.calendar.bookingPlural", "Buchungen")}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onNext} className="h-8 w-8 p-0" aria-label="next">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="h-8 text-xs ml-1">
          {t("agency.calendar.today", "Heute")}
        </Button>
      </div>

      {/* Right: view tabs + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View tabs */}
        <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  active
                    ? "bg-violet-500/25 text-violet-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-300",
                )}
                aria-pressed={active}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(tab.labelKey, tab.defaultLabel)}</span>
              </button>
            );
          })}
        </div>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              {t("agency.calendar.export", "Export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("agency.calendar.exportLabel", "Export / Drucken")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportICal} className="cursor-pointer">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" />
              {t("agency.calendar.exportICal", "iCal (.ics)")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
              <Download className="w-3.5 h-3.5 mr-2" />
              {t("agency.calendar.exportCSV", "CSV")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
              <Printer className="w-3.5 h-3.5 mr-2" />
              {t("agency.calendar.print", "Drucken / PDF")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New booking */}
        <Button
          size="sm"
          onClick={onNewBooking}
          className="h-8 text-xs bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90 text-white border-0 gap-1.5 shadow-lg shadow-pink-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("agency.calendar.newBooking", "Neuer Termin")}
        </Button>
      </div>
    </div>
  );
}
