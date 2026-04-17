import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X, Trash2, FileText, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getOutreachTemplates, type OutreachLang } from "@/lib/outreach-templates";

interface SavedTemplate { id: string; name: string; subject: string; body: string; style: "plain" | "html"; createdAt: string }

interface AkquiseTemplateLibraryProps {
  lang?: OutreachLang;
  onSelect: (t: { subject: string; body: string; name: string }) => void;
  onClose: () => void;
}

function loadSaved(): SavedTemplate[] {
  try { return JSON.parse(localStorage.getItem("akquise_templates") || "[]"); } catch { return []; }
}

function removeSaved(id: string) {
  const stored = loadSaved().filter((t) => t.id !== id);
  localStorage.setItem("akquise_templates", JSON.stringify(stored));
}

export default function AkquiseTemplateLibrary({ lang = "de", onSelect, onClose }: AkquiseTemplateLibraryProps) {
  const { t } = useTranslation();
  const saved = useMemo(() => loadSaved(), []);

  const builtIn = useMemo(() => {
    const plain = getOutreachTemplates(lang, "plain");
    const html = getOutreachTemplates(lang, "html");
    return [
      { name: `Persönlich — Stage 1 (${lang.toUpperCase()})`, ...plain.stage1, style: "plain" as const },
      { name: `Persönlich — Stage 2 (${lang.toUpperCase()})`, ...plain.stage2, style: "plain" as const },
      { name: `Persönlich — Stage 3 (${lang.toUpperCase()})`, ...plain.stage3, style: "plain" as const },
      { name: `Marketing — Stage 1 (${lang.toUpperCase()})`, ...html.stage1, style: "html" as const },
      { name: `Marketing — Stage 2 (${lang.toUpperCase()})`, ...html.stage2, style: "html" as const },
      { name: `Marketing — Stage 3 (${lang.toUpperCase()})`, ...html.stage3, style: "html" as const },
    ];
  }, [lang]);

  const preview = (body: string) => body.replace(/<[^>]+>/g, "").slice(0, 80) + "…";

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0118] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {t("admin.akquise.campaigns.templateLibrary", "Vorlagen-Bibliothek")}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Built-in */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Built-in Templates</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {builtIn.map((tpl, i) => (
              <button key={i} type="button" onClick={() => { onSelect(tpl); onClose(); }}
                className="text-left p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  {tpl.style === "plain" ? <FileText className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5 text-purple-400" />}
                  <span className="text-sm font-bold text-foreground truncate">{tpl.name}</span>
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">{preview(tpl.body)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom saved */}
        {saved.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Eigene Vorlagen</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {saved.map((tpl) => (
                <div key={tpl.id} className="relative group p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all">
                  <button type="button" onClick={() => { onSelect(tpl); onClose(); }} className="text-left w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge className={cn("text-[9px] border-0", tpl.style === "plain" ? "bg-emerald-500/20 text-emerald-200" : "bg-purple-500/20 text-purple-200")}>
                        {tpl.style}
                      </Badge>
                      <span className="text-sm font-bold text-foreground truncate">{tpl.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{preview(tpl.body)}</div>
                  </button>
                  <button type="button" onClick={() => { removeSaved(tpl.id); window.location.reload(); }}
                    className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {saved.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("admin.akquise.campaigns.noCustomTemplates", "Noch keine eigenen Vorlagen gespeichert.")}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
