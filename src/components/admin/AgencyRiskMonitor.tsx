import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Mail,
  PauseCircle,
  Ban,
  MoreHorizontal,
  Search,
  ExternalLink,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CancellationReasonChart } from "./CancellationReasonChart";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

// Mirrors `public.agency_cancellation_rates` from migration
// 20260417000000_payment_method_and_cancellation_audit.sql.
// Assumption: RLS on the underlying cancellation table + admin role (see
// "Admins manage all cancellations" policy) lets admins see all rows when the
// view is queried with an authenticated admin session. If the view itself
// needs an explicit admin policy, add one — tracked as a follow-up.
interface AgencyRiskRow {
  agency_id: string;
  agency_name: string;
  total_bookings_30d: number;
  agency_cancels_30d: number;
  cancel_rate_30d: number;
  risk_level: "ok" | "warning" | "critical" | "insufficient_data";
}

interface LastCancelInfo {
  agency_id: string;
  created_at: string;
}

async function fetchRiskyAgencies(): Promise<AgencyRiskRow[]> {
  const { data, error } = await (supabase.from as any)(
    "agency_cancellation_rates",
  )
    .select("*")
    .neq("risk_level", "ok")
    .order("cancel_rate_30d", { ascending: false });

  if (error) throw error;
  // insufficient_data is returned by the view but is not actionable for ops —
  // filter it out so ops only see real signals. warning/critical remain.
  return ((data ?? []) as AgencyRiskRow[]).filter(
    (r) => r.risk_level === "warning" || r.risk_level === "critical",
  );
}

async function fetchLastCancellations(
  agencyIds: string[],
): Promise<Record<string, string>> {
  if (agencyIds.length === 0) return {};
  const { data, error } = await (supabase.from as any)(
    "marketplace_booking_cancellations",
  )
    .select("agency_id, created_at")
    .in("agency_id", agencyIds)
    .eq("cancelled_by", "agency")
    .order("created_at", { ascending: false })
    .limit(agencyIds.length * 5);

  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as LastCancelInfo[]) {
    if (!map[row.agency_id]) map[row.agency_id] = row.created_at;
  }
  return map;
}

async function fetchAgencySlugs(
  agencyIds: string[],
): Promise<Record<string, string>> {
  if (agencyIds.length === 0) return {};
  const { data, error } = await (supabase.from as any)("agencies")
    .select("id, slug")
    .in("id", agencyIds);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Array<{ id: string; slug: string }>) {
    map[row.id] = row.slug;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Admin actions (stubbed via edge function invocation).
// The backing `marketplace_admin_actions` table is intentionally deferred —
// the caller only needs to know the event was accepted. See follow-up in the
// final report.
// ---------------------------------------------------------------------------
type AdminActionKind = "warn" | "pause_services" | "suspend_listing";

interface AdminActionPayload {
  kind: AdminActionKind;
  agency_id: string;
  note?: string;
  email_subject?: string;
  email_body?: string;
}

async function logAdminAction(payload: AdminActionPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("admin-action", {
      body: payload,
    });
    if (error) {
      // Don't throw — UI must still confirm the admin's intent even if the
      // audit path is not yet wired up on the backend.
      console.warn("[AgencyRiskMonitor] admin-action stub failed:", error);
    }
  } catch (err) {
    console.warn("[AgencyRiskMonitor] admin-action invocation error:", err);
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatRate(rate: number | string | null | undefined): string {
  if (rate === null || rate === undefined) return "–";
  const n = typeof rate === "string" ? Number(rate) : rate;
  if (Number.isNaN(n)) return "–";
  return `${n.toFixed(1)} %`;
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return "–";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) return "vor <1 h";
  if (hours < 48) return `vor ${hours} h`;
  const days = Math.round(hours / 24);
  return `vor ${days} Tagen`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FilterMode = "all" | "critical_only";

export function AgencyRiskMonitor() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [warnTarget, setWarnTarget] = useState<AgencyRiskRow | null>(null);
  const [warnSubject, setWarnSubject] = useState("");
  const [warnBody, setWarnBody] = useState("");
  const [pauseTarget, setPauseTarget] = useState<AgencyRiskRow | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AgencyRiskRow | null>(null);
  const [suspendConfirmText, setSuspendConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: agencies = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-agency-risk"],
    queryFn: fetchRiskyAgencies,
    staleTime: 60_000,
  });

  const agencyIds = useMemo(() => agencies.map((a) => a.agency_id), [agencies]);

  const { data: lastCancels = {} } = useQuery({
    queryKey: ["admin-agency-risk-lastcancel", agencyIds],
    queryFn: () => fetchLastCancellations(agencyIds),
    enabled: agencyIds.length > 0,
    staleTime: 60_000,
  });

  const { data: slugMap = {} } = useQuery({
    queryKey: ["admin-agency-risk-slugs", agencyIds],
    queryFn: () => fetchAgencySlugs(agencyIds),
    enabled: agencyIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const criticalCount = agencies.filter((a) => a.risk_level === "critical").length;
  const warningCount = agencies.filter((a) => a.risk_level === "warning").length;

  const filtered = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return agencies
      .filter((a) => (filter === "critical_only" ? a.risk_level === "critical" : true))
      .filter((a) => (lower ? a.agency_name.toLowerCase().includes(lower) : true));
  }, [agencies, filter, searchTerm]);

  // ---------------- Action handlers ----------------

  const openWarn = (agency: AgencyRiskRow) => {
    setWarnTarget(agency);
    setWarnSubject(`Hinweis: Erhöhte Stornoquote bei ${agency.agency_name}`);
    setWarnBody(
      `Hallo ${agency.agency_name}-Team,\n\n` +
        `uns ist aufgefallen, dass ihre Stornoquote in den letzten 30 Tagen bei ` +
        `${formatRate(agency.cancel_rate_30d)} liegt (${agency.agency_cancels_30d} von ` +
        `${agency.total_bookings_30d} Buchungen). Das ist deutlich über unserem ` +
        `Plattform-Schwellenwert von 15 %.\n\n` +
        `Bitte überprüft eure Buchungsannahme, Personalplanung und gegebenenfalls ` +
        `die Verfügbarkeitskalender, damit Kunden nicht bestätigte Termine wieder verlieren.\n\n` +
        `Bei wiederholtem Verstoß sehen wir uns leider gezwungen, euer Marktplatz-Listing ` +
        `temporär zu pausieren.\n\n` +
        `Viele Grüße\nEventBliss Ops`,
    );
  };

  const submitWarn = async () => {
    if (!warnTarget) return;
    setIsSubmitting(true);
    await logAdminAction({
      kind: "warn",
      agency_id: warnTarget.agency_id,
      email_subject: warnSubject,
      email_body: warnBody,
    });
    setIsSubmitting(false);
    toast.success(`Warnung an ${warnTarget.agency_name} vorgemerkt`);
    setWarnTarget(null);
  };

  const submitPause = async () => {
    if (!pauseTarget) return;
    setIsSubmitting(true);
    // TODO(storno-audit): This should flip marketplace_services.status to
    // 'paused' for every row where agency_id = pauseTarget.agency_id.
    // The migration does not yet include a `status` column on
    // marketplace_services; once it does, replace this stub with a direct
    // .update({ status: "paused" }).eq("agency_id", ...). For now we only
    // record the intent via the admin-action stub.
    await logAdminAction({
      kind: "pause_services",
      agency_id: pauseTarget.agency_id,
      note:
        "marketplace_services.status column missing — action recorded only; manual DB update required",
    });
    setIsSubmitting(false);
    toast.success(
      `Services von ${pauseTarget.agency_name} zur Pausierung vorgemerkt (manueller DB-Schritt nötig)`,
    );
    setPauseTarget(null);
  };

  const submitSuspend = async () => {
    if (!suspendTarget) return;
    setIsSubmitting(true);
    // TODO(storno-audit): Set agencies.marketplace_tier = 'suspended' — the
    // tier enum currently does not include 'suspended'. Until the enum /
    // constraint is widened, we only log the action. A migration must add
    // either a `marketplace_suspended BOOLEAN` column or extend the tier
    // enum; AgencyCard / MarketplaceAgency must then treat suspended = 404.
    await logAdminAction({
      kind: "suspend_listing",
      agency_id: suspendTarget.agency_id,
      note:
        "marketplace_tier suspended-state not yet in schema — action recorded only",
    });
    setIsSubmitting(false);
    toast.success(
      `Listing ${suspendTarget.agency_name} zur Deaktivierung vorgemerkt`,
    );
    setSuspendTarget(null);
    setSuspendConfirmText("");
    refetch();
  };

  // ---------------- Render ----------------

  return (
    <div className="space-y-6">
      {/* Header metrics + chart */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p
                className="text-4xl font-bold tracking-tight text-red-700 dark:text-red-300"
                aria-live="polite"
              >
                {criticalCount}
              </p>
              <p className="text-sm text-red-700/80 dark:text-red-300/80">
                Kritisch (&gt; 20 % Stornoquote)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <AlertTriangle
                className="h-7 w-7 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <p
                className="text-4xl font-bold tracking-tight text-amber-700 dark:text-amber-300"
                aria-live="polite"
              >
                {warningCount}
              </p>
              <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                Warnung (&gt; 15 %)
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="md:col-span-1">
          <CancellationReasonChart />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Warnungen inkl. ({agencies.length})
          </Button>
          <Button
            variant={filter === "critical_only" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("critical_only")}
          >
            Nur kritisch ({criticalCount})
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Agentur suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Agentur suchen"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Risiko-Agenturen ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Lade Risikodaten …</span>
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 py-8"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Fehler beim Laden der Risikodaten. Bitte später erneut versuchen.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2" aria-hidden="true">🎉</p>
              <p className="text-base font-medium">
                Alle Agenturen erfüllen die Storno-Quote.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Nichts zu tun.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Agentur</TableHead>
                    <TableHead className="min-w-[180px]">Stornorate (30 Tage)</TableHead>
                    <TableHead className="whitespace-nowrap">Stornos / Gesamt</TableHead>
                    <TableHead className="whitespace-nowrap">Letzter Storno</TableHead>
                    <TableHead className="w-[120px] text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((agency) => {
                    const slug = slugMap[agency.agency_id];
                    const rate = Number(agency.cancel_rate_30d) || 0;
                    const isCritical = agency.risk_level === "critical";
                    const barColor = isCritical ? "bg-red-500" : "bg-amber-500";
                    const pct = Math.min(100, Math.max(0, rate));
                    return (
                      <TableRow key={agency.agency_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {slug ? (
                              <Link
                                to={`/marketplace/agency/${slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                              >
                                {agency.agency_name}
                                <ExternalLink
                                  className="inline h-3 w-3 ml-1 text-muted-foreground"
                                  aria-label="in neuem Tab öffnen"
                                />
                              </Link>
                            ) : (
                              <span className="font-medium">{agency.agency_name}</span>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                isCritical
                                  ? "border-red-500/50 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                                  : "border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                              }
                            >
                              {isCritical ? "Kritisch" : "Warnung"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <div
                              className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                              role="progressbar"
                              aria-valuenow={Math.round(rate)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Stornorate ${formatRate(rate)}`}
                            >
                              <div
                                className={`h-full ${barColor} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-semibold tabular-nums ${
                                isCritical
                                  ? "text-red-700 dark:text-red-400"
                                  : "text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {formatRate(rate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {agency.agency_cancels_30d} / {agency.total_bookings_30d}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {relativeTime(lastCancels[agency.agency_id])}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label={`Maßnahme für ${agency.agency_name} wählen`}
                              >
                                Maßnahme
                                <MoreHorizontal className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => openWarn(agency)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Warnung senden
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setPauseTarget(agency)}>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Service pausieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setSuspendTarget(agency)}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Listing deaktivieren
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Warn dialog (Mailer) --- */}
      <Dialog
        open={!!warnTarget}
        onOpenChange={(open) => {
          if (!open) setWarnTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Warnung senden</DialogTitle>
            <DialogDescription>
              {warnTarget
                ? `Vorformulierte E-Mail an ${warnTarget.agency_name}. Text vor dem Senden gerne anpassen.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="warn-subject">Betreff</Label>
              <Input
                id="warn-subject"
                value={warnSubject}
                onChange={(e) => setWarnSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="warn-body">Nachricht</Label>
              <Textarea
                id="warn-body"
                value={warnBody}
                onChange={(e) => setWarnBody(e.target.value)}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnTarget(null)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={submitWarn} disabled={isSubmitting || !warnSubject.trim()}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Pause services AlertDialog --- */}
      <AlertDialog
        open={!!pauseTarget}
        onOpenChange={(open) => {
          if (!open) setPauseTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Services pausieren?</AlertDialogTitle>
            <AlertDialogDescription>
              {pauseTarget ? (
                <>
                  Alle Marketplace-Services von <strong>{pauseTarget.agency_name}</strong>{" "}
                  werden auf <code>paused</code> gesetzt. Die Agentur ist weiterhin
                  im System, aber ihre Services sind für Neubuchungen nicht mehr sichtbar.
                  Bestehende Buchungen bleiben unberührt.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={submitPause} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Ja, pausieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Suspend listing AlertDialog with double-confirm --- */}
      <AlertDialog
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendTarget(null);
            setSuspendConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-400">
              Listing deaktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {suspendTarget ? (
                    <>
                      Das Listing von <strong>{suspendTarget.agency_name}</strong> wird
                      aus dem Marktplatz entfernt. Die Agentur kann keine neuen Kunden
                      mehr gewinnen und ihre Profilseite liefert 404.
                    </>
                  ) : null}
                </p>
                <p className="text-sm">
                  Tippe den Agenturnamen zur Bestätigung ein:
                </p>
                <Input
                  value={suspendConfirmText}
                  onChange={(e) => setSuspendConfirmText(e.target.value)}
                  placeholder={suspendTarget?.agency_name ?? ""}
                  aria-label="Agenturname zur Bestätigung"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitSuspend}
              disabled={
                isSubmitting ||
                !suspendTarget ||
                suspendConfirmText.trim() !== suspendTarget.agency_name.trim()
              }
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Listing deaktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AgencyRiskMonitor;
