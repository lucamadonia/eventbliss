import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useBulkUpdateStatus } from "@/hooks/useOutreachPipeline";

interface Props {
  onOpenAgency: (id: number) => void;
}

const COLUMNS = [
  { status: "none", label: "Neu", color: "bg-slate-500" },
  { status: "contacted", label: "Kontaktiert", color: "bg-blue-500" },
  { status: "follow_up_1", label: "Follow-Up 1", color: "bg-cyan-500" },
  { status: "follow_up_2", label: "Follow-Up 2", color: "bg-teal-500" },
  { status: "responded", label: "Geantwortet", color: "bg-emerald-500" },
  { status: "interested", label: "Interessiert", color: "bg-amber-500" },
  { status: "onboarded", label: "Onboarded", color: "bg-green-500" },
] as const;

const REJECTED_COL = { status: "rejected", label: "Abgelehnt", color: "bg-red-500" };

const ALL_STATUSES = [...COLUMNS.map((c) => c.status), REJECTED_COL.status];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-blue-500",
  low: "bg-slate-500",
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function AkquisePipelineKanban({ onOpenAgency }: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const bulkUpdate = useBulkUpdateStatus();

  const { data: allAgencies = [] } = useQuery({
    queryKey: ["agency-directory-kanban"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_directory")
        .select("id, name, city, country, outreach_status, priority, last_outreach_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as { id: number; name: string; city: string; country: string; outreach_status: string; priority: string; last_outreach_at: string | null }[];
    },
  });

  const filtered = useMemo(() => {
    return allAgencies.filter((a) => {
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCity && !a.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterPriority !== "all" && a.priority !== filterPriority) return false;
      return true;
    });
  }, [allAgencies, searchQuery, filterCity, filterPriority]);

  const byStatus = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const col of [...COLUMNS, REJECTED_COL]) {
      map[col.status] = [];
    }
    for (const agency of filtered) {
      const status = agency.outreach_status || "none";
      if (!map[status]) map[status] = [];
      map[status].push(agency);
    }
    // Limit 20 per column
    for (const key of Object.keys(map)) {
      map[key] = map[key].slice(0, 20);
    }
    return map;
  }, [filtered]);

  const [showRejected, setShowRejected] = useState(false);

  const handleMoveStatus = (agencyId: number, newStatus: string) => {
    bulkUpdate.mutate({ directoryIds: [agencyId], newStatus });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.akquise.searchName", "Name suchen...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10"
          />
        </div>
        <Input
          placeholder={t("admin.akquise.filterCity", "Stadt")}
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="w-40 bg-white/[0.04] border-white/10"
        />
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/10">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">Hoch</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Niedrig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="min-w-[220px] flex-shrink-0 md:flex-1">
            {/* Column header */}
            <div className="mb-2">
              <div className={cn("h-1 rounded-full mb-2", col.color)} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(`admin.akquise.col_${col.status}`, col.label)}
                </span>
                <Badge variant="outline" className="text-xs border-white/10">
                  {(byStatus[col.status] || []).length}
                </Badge>
              </div>
            </div>
            {/* Cards */}
            <div className="space-y-2">
              {(byStatus[col.status] || []).map((agency) => (
                <AgencyKanbanCard
                  key={agency.id}
                  agency={agency}
                  currentStatus={col.status}
                  onClick={() => onOpenAgency(agency.id)}
                  onMoveStatus={handleMoveStatus}
                />
              ))}
              {(byStatus[col.status] || []).length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-white/10 rounded-lg">
                  {t("admin.akquise.emptyColumn", "Leer")}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Collapsed rejected column */}
        <div className="min-w-[180px] flex-shrink-0">
          <div className="mb-2">
            <div className={cn("h-1 rounded-full mb-2", REJECTED_COL.color)} />
            <button
              onClick={() => setShowRejected(!showRejected)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              {t("admin.akquise.col_rejected", "Abgelehnt")}
              <Badge variant="outline" className="text-xs border-white/10">
                {(byStatus["rejected"] || []).length}
              </Badge>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showRejected && "rotate-180")} />
            </button>
          </div>
          {showRejected && (
            <div className="space-y-2">
              {(byStatus["rejected"] || []).map((agency) => (
                <AgencyKanbanCard
                  key={agency.id}
                  agency={agency}
                  currentStatus="rejected"
                  onClick={() => onOpenAgency(agency.id)}
                  onMoveStatus={handleMoveStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AgencyKanbanCard({
  agency,
  currentStatus,
  onClick,
  onMoveStatus,
}: {
  agency: { id: number; name: string; city: string; priority: string; last_outreach_at: string | null };
  currentStatus: string;
  onClick: () => void;
  onMoveStatus: (id: number, status: string) => void;
}) {
  return (
    <Card
      className="p-3 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_COLORS[agency.priority] || "bg-blue-500")} />
            <span className="text-sm font-semibold text-foreground truncate">{agency.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">{agency.city}</div>
          {agency.last_outreach_at && (
            <div className="text-[10px] text-muted-foreground mt-1">
              {relativeTime(agency.last_outreach_at)}
            </div>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={currentStatus}
            onValueChange={(val) => onMoveStatus(agency.id, val)}
          >
            <SelectTrigger className="w-6 h-6 p-0 border-0 bg-transparent [&>svg]:w-3 [&>svg]:h-3">
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.filter((s) => s !== currentStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "none" ? "Neu" : s === "follow_up_1" ? "Follow-Up 1" : s === "follow_up_2" ? "Follow-Up 2" : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
