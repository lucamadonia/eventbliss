import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, Clock, Calendar, FileDown, ThumbsUp,
  MessageSquare, Shield, ChevronRight, Building2, Loader2,
  AlertTriangle, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ────────────────────────────────────────────── */
interface TokenRecord {
  id: string;
  event_id: string;
  agency_id: string;
  token: string;
  client_name: string | null;
  client_email: string | null;
  permissions: {
    view_timeline?: boolean;
    view_budget_summary?: boolean;
    view_files?: boolean;
    approve_milestones?: boolean;
    [key: string]: unknown;
  };
  expires_at: string | null;
  is_active: boolean;
}

interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface EventData {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  slug: string | null;
}

interface BudgetCategory {
  category: string;
  planned: number;
  actual: number;
}

interface SharedFile {
  name: string;
  url: string;
  size: string;
  uploaded_at: string;
}

/* ─── Phase definitions ────────────────────────────────── */
const phases = [
  { key: "planning", label: "Planung" },
  { key: "pre_production", label: "Vorbereitung" },
  { key: "live", label: "Live" },
  { key: "complete", label: "Abgeschlossen" },
];

/* ─── Milestones (mock, keyed by phase) ─────────────── */
function getMilestones(eventDate: string | null) {
  const base = eventDate ? new Date(eventDate) : new Date();
  const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  const sub = (days: number) => { const d = new Date(base); d.setDate(d.getDate() - days); return d; };

  return [
    { label: "Konzept finalisiert", date: fmt(sub(90)), done: true, phase: "planning" },
    { label: "Vendor-Vertraege abgeschlossen", date: fmt(sub(60)), done: true, phase: "planning" },
    { label: "Gaesteliste bestaetigt", date: fmt(sub(30)), done: false, phase: "pre_production" },
    { label: "Run-of-Show freigegeben", date: fmt(sub(14)), done: false, phase: "pre_production" },
    { label: "Event-Tag", date: fmt(base), done: false, phase: "live" },
    { label: "Nachbereitung & Abrechnung", date: fmt(new Date(base.getTime() + 14 * 86400000)), done: false, phase: "complete" },
  ];
}

function detectPhase(milestones: ReturnType<typeof getMilestones>): number {
  const lastDone = milestones.reduce((acc, m, i) => (m.done ? i : acc), -1);
  if (lastDone < 0) return 0;
  const phaseKey = milestones[Math.min(lastDone + 1, milestones.length - 1)].phase;
  return Math.max(phases.findIndex((p) => p.key === phaseKey), 0);
}

/* ─── Helpers ──────────────────────────────────────────── */
function formatCurrency(val: number): string {
  return "\u20AC" + val.toLocaleString("de-DE", { minimumFractionDigits: 0 });
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── Main Component ─────────────────────────────────── */
export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenRecord, setTokenRecord] = useState<TokenRecord | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [approvalNote, setApprovalNote] = useState("");
  const [approving, setApproving] = useState(false);

  const primaryColor = agency?.primary_color || "#8B5CF6";
  const accentColor = agency?.accent_color || "#06B6D4";

  /* ─── Fetch everything ──────────────────────────────── */
  useEffect(() => {
    if (!token) { setError("Kein Zugangs-Token angegeben."); setLoading(false); return; }

    (async () => {
      try {
        // 1. Fetch token record
        const { data: tokenData, error: tokenErr } = await (supabase
          .from("client_access_tokens" as any)
          .select("*")
          .eq("token", token)
          .single() as any);

        if (tokenErr || !tokenData) {
          setError("Ungueltiger oder abgelaufener Zugangs-Link.");
          setLoading(false);
          return;
        }

        const record = tokenData as unknown as TokenRecord;

        // Check active + not expired
        if (!record.is_active) {
          setError("Dieser Zugangs-Link ist nicht mehr aktiv.");
          setLoading(false);
          return;
        }
        if (record.expires_at && new Date(record.expires_at) < new Date()) {
          setError("Dieser Zugangs-Link ist abgelaufen.");
          setLoading(false);
          return;
        }

        setTokenRecord(record);

        // 2. Fetch agency
        const { data: agencyData } = await (supabase
          .from("agencies" as any)
          .select("id, name, logo_url, primary_color, accent_color, email, phone, website")
          .eq("id", record.agency_id)
          .single() as any);

        if (agencyData) setAgency(agencyData as unknown as Agency);

        // 3. Fetch event
        const { data: eventData } = await supabase
          .from("events")
          .select("id, name, event_type, event_date, slug")
          .eq("id", record.event_id)
          .single();

        if (eventData) setEvent(eventData as unknown as EventData);

        // 4. Fetch budget categories (aggregated only)
        if (record.permissions?.view_budget_summary) {
          const { data: budgetData } = await (supabase
            .from("budget_items" as any)
            .select("category, planned_amount, actual_amount")
            .eq("event_id", record.event_id) as any);

          if (budgetData) {
            const groups: Record<string, { planned: number; actual: number }> = {};
            for (const item of budgetData as any[]) {
              const cat = item.category || "Sonstiges";
              if (!groups[cat]) groups[cat] = { planned: 0, actual: 0 };
              groups[cat].planned += item.planned_amount || 0;
              groups[cat].actual += item.actual_amount || 0;
            }
            setBudgetCategories(
              Object.entries(groups).map(([category, vals]) => ({
                category,
                planned: vals.planned,
                actual: vals.actual,
              }))
            );
          }
        }

        // 5. Fetch shared files (if permitted)
        if (record.permissions?.view_files) {
          const { data: fileData } = await (supabase
            .from("event_files" as any)
            .select("file_name, file_url, file_size, created_at")
            .eq("event_id", record.event_id)
            .eq("shared_with_client", true) as any);

          if (fileData) {
            setSharedFiles(
              (fileData as any[]).map((f) => ({
                name: f.file_name,
                url: f.file_url,
                size: f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : "",
                uploaded_at: new Date(f.created_at).toLocaleDateString("de-DE"),
              }))
            );
          }
        }
      } catch {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es spaeter erneut.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ─── Derived values ─────────────────────────────────── */
  const milestones = useMemo(() => getMilestones(event?.event_date || null), [event?.event_date]);
  const currentPhase = useMemo(() => detectPhase(milestones), [milestones]);
  const nextMilestone = milestones.find((m) => !m.done);

  const totalBudgetPlanned = budgetCategories.reduce((s, c) => s + c.planned, 0);
  const totalBudgetActual = budgetCategories.reduce((s, c) => s + c.actual, 0);
  const budgetPct = totalBudgetPlanned > 0 ? Math.round((totalBudgetActual / totalBudgetPlanned) * 100) : 0;

  const permissions = tokenRecord?.permissions || {};

  /* ─── Approve handler ────────────────────────────────── */
  const handleApproval = async (approved: boolean) => {
    if (!tokenRecord) return;
    setApproving(true);
    try {
      const updatedPermissions = {
        ...tokenRecord.permissions,
        last_approval: {
          approved,
          note: approvalNote,
          at: new Date().toISOString(),
        },
      };
      await (supabase
        .from("client_access_tokens" as any)
        .update({ permissions: updatedPermissions } as any)
        .eq("id", tokenRecord.id) as any);

      setTokenRecord({ ...tokenRecord, permissions: updatedPermissions });
      setApprovalNote("");
    } finally {
      setApproving(false);
    }
  };

  /* ─── Loading state ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-sm text-slate-500">Lade Eventdaten...</p>
        </motion.div>
      </div>
    );
  }

  /* ─── Error state ────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md text-center"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Zugang nicht moeglich</h1>
          <p className="text-slate-500 text-sm">{error}</p>
          <Link to="/" className="inline-block mt-6 text-sm font-medium text-violet-600 hover:underline">
            Zur Startseite
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ─── Main render ────────────────────────────────────── */
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.04)} 0%, #f8fafc 40%, ${hexToRgba(accentColor, 0.03)} 100%)`,
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
        >
          <div className="flex items-start gap-4">
            {agency?.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                {agency?.name?.[0] || "E"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>
                {agency?.name || "Event Agency"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {event?.name || "Event"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                {event?.event_type && (
                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                    {event.event_type}
                  </Badge>
                )}
                {event?.event_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.event_date).toLocaleDateString("de-DE", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {tokenRecord?.client_name && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-sm text-slate-600">
                Zugang fuer <span className="font-medium text-slate-900">{tokenRecord.client_name}</span>
              </span>
            </div>
          )}
        </motion.header>

        {/* ── Timeline / Progress ─────────────────────────── */}
        {permissions.view_timeline !== false && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Zeitplan & Fortschritt</h2>

            {/* Phase indicator */}
            <div className="flex items-center gap-1 mb-6">
              {phases.map((phase, i) => (
                <div key={phase.key} className="flex-1 flex items-center gap-1">
                  <div className="flex-1">
                    <div
                      className="h-2 rounded-full transition-colors"
                      style={{
                        backgroundColor: i <= currentPhase ? primaryColor : "#e2e8f0",
                      }}
                    />
                    <p className={`text-[10px] mt-1 ${i <= currentPhase ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                      {phase.label}
                    </p>
                  </div>
                  {i < phases.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 mb-3" />}
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${
                    m === nextMilestone ? "bg-slate-50 border border-slate-200" : ""
                  }`}
                >
                  {m.done ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${m.done ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-400">{m.date}</p>
                  </div>
                  {m === nextMilestone && (
                    <Badge
                      className="text-[10px] shrink-0"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor, borderColor: hexToRgba(primaryColor, 0.2) }}
                    >
                      Naechster Schritt
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Budget Summary ─────────────────────────────── */}
        {permissions.view_budget_summary && budgetCategories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Budget-Uebersicht</h2>
            <p className="text-xs text-slate-400 mb-5">Aggregierte Budgetkategorien</p>

            {/* Total */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500">Gesamtbudget</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalBudgetPlanned)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Ausgegeben</p>
                <p className="text-xl font-semibold" style={{ color: primaryColor }}>
                  {formatCurrency(totalBudgetActual)}
                </p>
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: primaryColor }}
              />
            </div>

            {/* Per-category */}
            <div className="space-y-4">
              {budgetCategories.map((cat) => {
                const pct = cat.planned > 0 ? Math.round((cat.actual / cat.planned) * 100) : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{cat.category}</span>
                      <span className="text-xs text-slate-500">
                        {formatCurrency(cat.actual)} / {formatCurrency(cat.planned)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct > 100 ? "#ef4444" : accentColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── Shared Files ───────────────────────────────── */}
        {permissions.view_files && sharedFiles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Dateien</h2>
            <div className="space-y-2">
              {sharedFiles.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                  >
                    <FileDown className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {file.size}{file.size && " · "}{file.uploaded_at}
                    </p>
                  </div>
                  <FileDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                </a>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Approval Section ───────────────────────────── */}
        {permissions.approve_milestones && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Freigabe</h2>
            <p className="text-xs text-slate-400 mb-5">
              Bitte pruefen und genehmigen Sie den aktuellen Planungsstand.
            </p>

            {(tokenRecord?.permissions as any)?.last_approval ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {(tokenRecord?.permissions as any).last_approval.approved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">Genehmigt</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700">Aenderungen angefragt</span>
                    </>
                  )}
                </div>
                {(tokenRecord?.permissions as any).last_approval.note && (
                  <p className="text-sm text-slate-600 mt-1">
                    {(tokenRecord?.permissions as any).last_approval.note}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date((tokenRecord?.permissions as any).last_approval.at).toLocaleDateString("de-DE", {
                    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Optionaler Kommentar..."
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 resize-none"
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1 text-white gap-2"
                    style={{ backgroundColor: primaryColor }}
                    disabled={approving}
                    onClick={() => handleApproval(true)}
                  >
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    Genehmigen
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-700 gap-2"
                    disabled={approving}
                    onClick={() => handleApproval(false)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Aenderungen anfragen
                  </Button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center py-8 space-y-3"
        >
          {(agency?.email || agency?.phone) && (
            <div className="text-sm text-slate-500">
              <p className="font-medium text-slate-600 mb-1">Kontakt: {agency.name}</p>
              {agency.email && <p>{agency.email}</p>}
              {agency.phone && <p>{agency.phone}</p>}
              {agency.website && (
                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>
                  {agency.website}
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-slate-400">
            Powered by{" "}
            <Link to="/" className="font-medium hover:underline" style={{ color: primaryColor }}>
              EventBliss
            </Link>
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
