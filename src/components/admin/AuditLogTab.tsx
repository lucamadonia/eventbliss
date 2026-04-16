import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Scroll, Search, RefreshCw, User, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  "create": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "update": "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  "delete": "bg-red-500/15 text-red-500 border-red-500/30",
  "toggle": "bg-violet-500/15 text-violet-500 border-violet-500/30",
  "approve": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "reject": "bg-red-500/15 text-red-500 border-red-500/30",
  "ban": "bg-red-500/15 text-red-500 border-red-500/30",
  "promote": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "override": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "rollout": "bg-violet-500/15 text-violet-500 border-violet-500/30",
};

function actionBadgeClass(action: string) {
  const verb = action.split(".").pop() || "";
  for (const key of Object.keys(ACTION_COLORS)) {
    if (verb.includes(key)) return ACTION_COLORS[key];
  }
  return "bg-slate-500/15 text-slate-500 border-slate-500/30";
}

export default function AuditLogTab() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [limit] = useState(100);

  const load = async () => {
    setIsLoading(true);
    let query = supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (targetFilter !== "all") {
      query = query.eq("target_type", targetFilter);
    }
    const { data, error } = await query;
    if (error) console.error(error);
    setEntries((data as AuditEntry[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [targetFilter]);

  const filtered = entries.filter((e) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      e.action.toLowerCase().includes(s) ||
      (e.admin_email ?? "").toLowerCase().includes(s) ||
      (e.target_id ?? "").toLowerCase().includes(s)
    );
  });

  const uniqueTargets = Array.from(new Set(entries.map((e) => e.target_type).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black mb-1">{t("admin.audit.title", "Audit Log")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.audit.subtitle", "Chronologische Aufzeichnung aller Admin-Aktionen — wer hat wann was geändert.")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.audit.searchPlaceholder", "Aktion, E-Mail oder Target-ID …")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("admin.audit.targetFilter", "Target-Typ")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.audit.allTargets", "Alle Targets")}</SelectItem>
            {uniqueTargets.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          {t("admin.audit.refresh", "Aktualisieren")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Scroll className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {entries.length === 0
                ? t("admin.audit.empty", "Noch keine Admin-Aktionen protokolliert")
                : t("admin.audit.noResults", "Keine Einträge für deinen Filter")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filtered.map((e) => (
              <div key={e.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("font-mono text-[11px] shrink-0", actionBadgeClass(e.action))}>
                    {e.action}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm min-w-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate" title={e.admin_email ?? ""}>{e.admin_email || "—"}</span>
                  </div>
                  {e.target_type && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="font-mono">{e.target_type}</span>
                      {e.target_id && (
                        <span className="font-mono truncate max-w-[160px]" title={e.target_id}>
                          : {e.target_id.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {e.metadata && Object.keys(e.metadata).length > 0 && (
                  <div className="mt-2 ml-[196px] max-w-full">
                    <pre className="text-[11px] font-mono text-muted-foreground bg-muted/30 rounded-md p-2 overflow-x-auto">
                      {JSON.stringify(e.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === limit && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {t("admin.audit.limitReached", "Zeige die letzten {{limit}} Einträge — ältere über Supabase direkt abfragen.", { limit })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
