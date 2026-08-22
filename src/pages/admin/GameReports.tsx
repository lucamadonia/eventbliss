/**
 * GameReports — Meldungen aus den Spielen.
 *
 * Ohne diese Seite wären die Meldungen zwar gespeichert, aber unsichtbar: Die
 * Tabelle `user_feedback` gibt es seit Januar, eine Oberfläche dafür nie. Was
 * niemand ansieht, wird auch nicht bearbeitet.
 *
 * Der eigentliche Nutzen liegt in der Häufung. Eine einzelne Meldung kann ein
 * Missverständnis sein; zehn Meldungen zur selben Inhalts-ID sind ein Befund.
 * Deshalb steht die Anzahl je Inhalt oben und nicht nur die Liste darunter.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface Report {
  id: string;
  message: string;
  page_url: string | null;
  game_id: string | null;
  content_id: string | null;
  report_type: string | null;
  status: string;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  wrong_answer: "Antwort falsch",
  not_loading: "Lädt nicht",
  inappropriate: "Unpassend",
  other: "Sonstiges",
};

/** Wohin man springt, um den gemeldeten Inhalt zu reparieren. */
const FIX_PAGE: Record<string, string> = {
  closeenough: "/admin/closeenough-questions",
  ohrwurm: "/admin/ohrwurm-songs",
  pixeljagd: "/admin/pixel-images",
};

export default function GameReports() {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(true);

  const load = async () => {
    setLoading(true);
    // Nur Meldungen aus den Spielen: Landingpage-Feedback hat game_id NULL und
    // gehört nicht auf diese Seite.
    const { data } = await supabase
      .from("user_feedback")
      .select("id,message,page_url,game_id,content_id,report_type,status,created_at")
      .not("game_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as unknown as Report[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  /** Wie oft wurde derselbe Inhalt gemeldet? Das ist das eigentliche Signal. */
  const haeufung = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!r.content_id) continue;
      const k = `${r.game_id}::${r.content_id}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const sichtbar = onlyOpen ? rows.filter((r) => r.status === "new") : rows;

  const setStatus = async (id: string, status: string) => {
    // Erst lokal, dann senden: Die Liste soll sofort reagieren.
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await supabase.from("user_feedback").update({ status }).eq("id", id);
  };

  return (
    <div className="min-h-screen bg-[#0d0d15] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Meldungen aus den Spielen</h1>
            <p className="text-sm text-white/40 mt-1">
              {rows.length} gesamt · {rows.filter((r) => r.status === "new").length} offen
            </p>
          </div>
          <button
            onClick={load}
            className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-sm hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" /> Neu laden
          </button>
        </div>

        {haeufung.length > 0 && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-400/30 p-4">
            <div className="flex items-center gap-2 mb-2 text-amber-300 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" /> Mehrfach gemeldet
            </div>
            <div className="space-y-1">
              {haeufung.slice(0, 8).map(([k, n]) => {
                const [game, content] = k.split("::");
                return (
                  <div key={k} className="text-xs text-white/70 flex items-center gap-2">
                    <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{n}×</span>
                    <span>{game}</span>
                    <span className="text-white/30 font-mono truncate">{content}</span>
                    {FIX_PAGE[game] && (
                      <Link to={FIX_PAGE[game]} className="text-violet-300 hover:underline inline-flex items-center gap-1">
                        beheben <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 mb-4 text-sm text-white/60 select-none cursor-pointer">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          Nur offene zeigen
        </label>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : sichtbar.length === 0 ? (
          <p className="text-center text-white/30 py-16 text-sm">
            Keine Meldungen. Das ist die gute Variante.
          </p>
        ) : (
          <div className="space-y-2">
            {sichtbar.map((r) => (
              <div
                key={r.id}
                className={
                  "rounded-xl border p-4 " +
                  (r.status === "new"
                    ? "bg-white/[0.04] border-white/10"
                    : "bg-white/[0.02] border-white/5 opacity-60")
                }
              >
                <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-200">{r.game_id}</span>
                  {r.report_type && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      {TYPE_LABEL[r.report_type] ?? r.report_type}
                    </span>
                  )}
                  <span className="text-white/30">
                    {new Date(r.created_at).toLocaleString("de-DE")}
                  </span>
                  {r.content_id && (
                    <span className="font-mono text-white/25 truncate max-w-[16rem]">{r.content_id}</span>
                  )}
                </div>
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">{r.message}</pre>
                {r.status === "new" && (
                  <button
                    onClick={() => setStatus(r.id, "resolved")}
                    className="mt-3 h-8 px-3 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-1.5 hover:bg-emerald-500/25"
                  >
                    <Check className="w-3.5 h-3.5" /> Erledigt
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
