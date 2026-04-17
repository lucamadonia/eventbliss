import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ChevronUp, ChevronDown, Check, Upload, Plus } from "lucide-react";
import AkquiseImportDialog from "./AkquiseImportDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useBulkUpdateStatus, useAddToCampaign } from "@/hooks/useOutreachPipeline";
import { useOutreachCampaigns } from "@/hooks/useOutreachCampaigns";

interface Props {
  onOpenAgency: (id: number) => void;
}

interface AgencyRow {
  id: number;
  name: string;
  city: string;
  email: string;
  outreach_status: string;
  priority: string;
  last_outreach_at: string | null;
}

const STATUSES = ["all", "none", "contacted", "follow_up_1", "follow_up_2", "responded", "interested", "onboarded", "rejected"];
const PRIORITIES_FILTER = ["all", "urgent", "high", "normal", "low"];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-400",
  high: "text-amber-400",
  normal: "text-blue-400",
  low: "text-slate-400",
};

type SortField = "name" | "city" | "email" | "outreach_status" | "priority" | "last_outreach_at";
type SortDir = "asc" | "desc";

export default function AkquiseAgencyTable({ onOpenAgency }: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCity, setFilterCity] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [limit, setLimit] = useState(50);

  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("Deutschland");
  const qc = useQueryClient();

  const bulkUpdate = useBulkUpdateStatus();
  const addToCampaign = useAddToCampaign();
  const { data: campaigns = [] } = useOutreachCampaigns();
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  const handleManualAdd = async () => {
    if (!newName || !newEmail || !newCity) return;
    await (supabase.from as any)("agency_directory").insert({
      name: newName, email: newEmail, city: newCity, country: newCountry,
      country_code: "DE", outreach_status: "new", priority: "normal", status: "active",
    });
    setNewName(""); setNewEmail(""); setNewCity(""); setShowAddForm(false);
    qc.invalidateQueries({ queryKey: ["agency-directory-table"] });
    qc.invalidateQueries({ queryKey: ["outreach-pipeline"] });
  };

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["agency-directory-table", limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_directory")
        .select("id, name, city, email, outreach_status, priority, last_outreach_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AgencyRow[];
    },
  });

  const filtered = useMemo(() => {
    let result = agencies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") result = result.filter((a) => (a.outreach_status || "none") === filterStatus);
    if (filterPriority !== "all") result = result.filter((a) => a.priority === filterPriority);
    if (filterCity) result = result.filter((a) => a.city.toLowerCase().includes(filterCity.toLowerCase()));
    return result;
  }, [agencies, searchQuery, filterStatus, filterPriority, filterCity]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = (a[sortField] || "") as string;
      const valB = (b[sortField] || "") as string;
      const cmp = valA.localeCompare(valB);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((a) => a.id)));
  };

  const selectedIds = Array.from(selected);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 cursor-pointer hover:text-foreground select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Action bar: Add + Import */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm" className="gap-1.5 border-white/10">
          <Plus className="w-4 h-4" /> Manuell hinzufügen
        </Button>
        <Button onClick={() => setShowImport(true)} variant="outline" size="sm" className="gap-1.5 border-white/10">
          <Upload className="w-4 h-4" /> CSV / JSON Import
        </Button>
        <Badge className="bg-white/5 text-muted-foreground border-0 ml-auto">{agencies.length} Agenturen</Badge>
      </div>

      {/* Manual add form (inline) */}
      {showAddForm && (
        <Card className="p-4 border-white/10 bg-white/[0.02] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Name *" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white/[0.04] border-white/10" />
            <Input placeholder="E-Mail *" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-white/[0.04] border-white/10" />
            <Input placeholder="Stadt *" value={newCity} onChange={(e) => setNewCity(e.target.value)} className="bg-white/[0.04] border-white/10" />
            <Input placeholder="Land" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="bg-white/[0.04] border-white/10" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleManualAdd} disabled={!newName || !newEmail || !newCity} size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 font-bold">
              <Plus className="w-4 h-4 mr-1" /> Hinzufügen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      {/* Import dialog */}
      {showImport && (
        <AkquiseImportDialog
          onClose={() => setShowImport(false)}
          onImported={() => { qc.invalidateQueries({ queryKey: ["agency-directory-table"] }); qc.invalidateQueries({ queryKey: ["outreach-pipeline"] }); }}
        />
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.akquise.searchTable", "Name, Stadt oder Email suchen...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "Alle Status" : s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 bg-white/[0.04] border-white/10"><SelectValue placeholder="Priorität" /></SelectTrigger>
          <SelectContent>
            {PRIORITIES_FILTER.map((p) => <SelectItem key={p} value={p}>{p === "all" ? "Alle Prioritäten" : p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Stadt"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="w-32 bg-white/[0.04] border-white/10"
        />
      </div>

      {/* Table */}
      <Card className="border-white/10 bg-white/[0.04] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-3 py-2 w-10">
                <button onClick={toggleSelectAll} className={cn("w-4 h-4 rounded border flex items-center justify-center", selected.size === sorted.length && sorted.length > 0 ? "bg-purple-600 border-purple-600" : "border-white/20")}>
                  {selected.size === sorted.length && sorted.length > 0 && <Check className="w-3 h-3 text-white" />}
                </button>
              </th>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="city">Stadt</SortHeader>
              <SortHeader field="email">Email</SortHeader>
              <SortHeader field="outreach_status">Status</SortHeader>
              <SortHeader field="priority">Priorität</SortHeader>
              <SortHeader field="last_outreach_at">Letzte Aktion</SortHeader>
            </tr>
          </thead>
          <tbody>
            {sorted.map((agency) => (
              <tr key={agency.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggleSelect(agency.id)}
                    className={cn("w-4 h-4 rounded border flex items-center justify-center", selected.has(agency.id) ? "bg-purple-600 border-purple-600" : "border-white/20")}
                  >
                    {selected.has(agency.id) && <Check className="w-3 h-3 text-white" />}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => onOpenAgency(agency.id)} className="text-foreground hover:text-purple-400 font-medium text-left">
                    {agency.name}
                  </button>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{agency.city}</td>
                <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{agency.email}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-xs border-white/10">{agency.outreach_status || "none"}</Badge>
                </td>
                <td className={cn("px-3 py-2 text-xs font-medium", PRIORITY_COLORS[agency.priority] || "text-blue-400")}>
                  {agency.priority}
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {agency.last_outreach_at ? new Date(agency.last_outreach_at).toLocaleDateString("de-DE") : "-"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  {isLoading ? "Laden..." : t("admin.akquise.noResults", "Keine Ergebnisse")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Load more */}
      {agencies.length >= limit && (
        <div className="text-center">
          <Button variant="outline" className="border-white/10" onClick={() => setLimit((l) => l + 50)}>
            {t("admin.akquise.loadMore", "Mehr laden")}
          </Button>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <Card className="px-4 py-3 border-white/15 bg-[#070012]/95 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
            <span className="text-sm font-semibold text-foreground">{selected.size} ausgewählt</span>

            <Select onValueChange={(v) => { bulkUpdate.mutate({ directoryIds: selectedIds, newStatus: v }); setSelected(new Set()); }}>
              <SelectTrigger className="w-36 h-8 text-xs bg-white/[0.04] border-white/10"><SelectValue placeholder="Status ändern" /></SelectTrigger>
              <SelectContent>
                {STATUSES.filter((s) => s !== "all").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => { bulkUpdate.mutate({ directoryIds: selectedIds, newStatus: v }); setSelected(new Set()); }}>
              <SelectTrigger className="w-36 h-8 text-xs bg-white/[0.04] border-white/10"><SelectValue placeholder="Priorität" /></SelectTrigger>
              <SelectContent>
                {["urgent", "high", "normal", "low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            {activeCampaigns.length > 0 && (
              <Select onValueChange={(v) => { addToCampaign.mutate({ directoryIds: selectedIds, campaignId: v }); setSelected(new Set()); }}>
                <SelectTrigger className="w-40 h-8 text-xs bg-white/[0.04] border-white/10"><SelectValue placeholder="Zur Kampagne" /></SelectTrigger>
                <SelectContent>
                  {activeCampaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelected(new Set())}>
              Auswahl aufheben
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
