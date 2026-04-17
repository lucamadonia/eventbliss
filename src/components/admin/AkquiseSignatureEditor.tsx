import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AkquiseSignatureEditorProps { onClose: () => void }

interface SignatureData {
  name: string; role: string; phone: string; email: string; tagline: string; style: "modern" | "minimal" | "classic";
}

const SENDERS = ["partner@event-bliss.com", "svitlana@event-bliss.com", "rebecca@event-bliss.com"];

const DEFAULTS: Record<string, SignatureData> = {
  "partner@event-bliss.com": { name: "EventBliss Partnerschaften", role: "Partnership Team", phone: "", email: "partner@event-bliss.com", tagline: "MYFAMBLISS GROUP LTD · Investor-Backed", style: "modern" },
  "svitlana@event-bliss.com": { name: "Svitlana", role: "Head of Partnerships", phone: "+49 xxx", email: "svitlana@event-bliss.com", tagline: "EventBliss · MYFAMBLISS GROUP LTD", style: "modern" },
  "rebecca@event-bliss.com": { name: "Rebecca", role: "Partnership Manager", phone: "+49 xxx", email: "rebecca@event-bliss.com", tagline: "EventBliss · MYFAMBLISS GROUP LTD", style: "modern" },
};

function renderSignatureHtml(d: SignatureData): string {
  const base = `<strong style="font-size:14px;">${d.name}</strong><br><span style="font-size:12px;">${d.role} · EventBliss</span><br>`;
  const contact = `${d.phone ? `<span style="font-size:12px;">📞 ${d.phone}</span><br>` : ""}<span style="font-size:12px;">📧 ${d.email}</span><br>`;
  const link = `<a href="https://event-bliss.com" style="color:#7c3aed;font-size:12px;text-decoration:none;">event-bliss.com</a>`;
  const tag = d.tagline ? `<br><span style="font-size:11px;color:#888;">${d.tagline}</span>` : "";

  if (d.style === "minimal") return `<div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:20px;font-family:sans-serif;color:#333;">${base}${link}${tag}</div>`;
  if (d.style === "classic") return `<div style="border-top:2px solid #7c3aed;padding-top:16px;margin-top:24px;font-family:sans-serif;color:#333;">${base}${contact}${link}${tag}</div>`;
  // modern
  return `<div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;font-family:sans-serif;color:#333;">
<table cellpadding="0" cellspacing="0"><tr><td style="padding-right:14px;vertical-align:top;">
<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;align-items:center;justify-content:center;text-align:center;line-height:44px;">
<span style="font-size:18px;font-weight:900;color:#fff;">${d.name.charAt(0)}</span></div></td><td>${base}${contact}${link}${tag}</td></tr></table></div>`;
}

function loadSignatures(): Record<string, SignatureData> {
  try { return JSON.parse(localStorage.getItem("akquise_signatures") || "{}"); } catch { return {}; }
}

export default function AkquiseSignatureEditor({ onClose }: AkquiseSignatureEditorProps) {
  const { t } = useTranslation();
  const [sigs, setSigs] = useState<Record<string, SignatureData>>(() => {
    const stored = loadSignatures();
    const merged: Record<string, SignatureData> = {};
    for (const s of SENDERS) merged[s] = stored[s] ?? DEFAULTS[s];
    return merged;
  });
  const [activeTab, setActiveTab] = useState(SENDERS[0]);
  const [copied, setCopied] = useState(false);

  const current = sigs[activeTab] ?? DEFAULTS[activeTab];
  const update = (field: keyof SignatureData, value: string) => {
    setSigs((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: value } }));
  };

  const previewHtml = useMemo(() => renderSignatureHtml(current), [current]);

  const save = () => {
    localStorage.setItem("akquise_signatures", JSON.stringify(sigs));
    toast.success(t("admin.akquise.detail.save", "Gespeichert"));
  };

  const copyHtml = async () => {
    await navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    toast.success("HTML kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-[#0a0118] border-l border-white/10 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">{t("admin.akquise.detail.signatures", "Signaturen bearbeiten")}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 border border-white/10 w-full">
                {SENDERS.map((s) => <TabsTrigger key={s} value={s} className="text-xs flex-1">{s.split("@")[0]}</TabsTrigger>)}
              </TabsList>

              {SENDERS.map((sender) => (
                <TabsContent key={sender} value={sender} className="space-y-4 mt-4">
                  <Input placeholder="Name" value={sigs[sender]?.name ?? ""} onChange={(e) => update("name", e.target.value)} className="bg-white/[0.04] border-white/10" />
                  <Input placeholder="Rolle / Titel" value={sigs[sender]?.role ?? ""} onChange={(e) => update("role", e.target.value)} className="bg-white/[0.04] border-white/10" />
                  <Input placeholder="Telefon" value={sigs[sender]?.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className="bg-white/[0.04] border-white/10" />
                  <Input value={sender} readOnly className="bg-white/[0.02] border-white/5 text-muted-foreground" />
                  <Input placeholder="Tagline" value={sigs[sender]?.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} className="bg-white/[0.04] border-white/10" />

                  {/* Style presets */}
                  <div className="flex gap-2">
                    {(["modern", "minimal", "classic"] as const).map((style) => (
                      <button key={style} type="button" onClick={() => update("style", style)}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all border", sigs[sender]?.style === style
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                          : "bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white")}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Preview */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Preview</label>
              <div className="rounded-xl border border-white/10 bg-white p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            <div className="flex gap-2">
              <Button onClick={save} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold">Speichern</Button>
              <Button variant="outline" onClick={copyHtml} className="gap-1.5">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                HTML
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
