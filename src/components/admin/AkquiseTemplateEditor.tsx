import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Code2, Eye, Monitor, Smartphone, Save, Variable, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AkquiseTemplateEditorProps {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  onSubjectChange: (s: string) => void;
  onBodyChange: (b: string) => void;
  mode?: "campaign" | "individual";
  agencyPreview?: { name: string; city: string; contact_name: string };
}

const VARIABLES = [
  { key: "agency_name", label: "Agentur" },
  { key: "city", label: "Stadt" },
  { key: "contact_name", label: "Kontakt" },
  { key: "signup_url", label: "Signup-URL" },
  { key: "sender_name", label: "Absender" },
  { key: "website", label: "Website" },
];

const PREVIEW_DEFAULTS: Record<string, string> = {
  agency_name: "Muster Events GmbH",
  city: "Berlin",
  contact_name: "Max Mustermann",
  signup_url: "https://event-bliss.com/agency-apply?invite=demo123",
  sender_name: "EventBliss",
  website: "https://muster-events.de",
};

function interpolatePreview(text: string, preview?: { name: string; city: string; contact_name: string }): string {
  let result = text;
  const vars = { ...PREVIEW_DEFAULTS };
  if (preview) {
    vars.agency_name = preview.name;
    vars.city = preview.city;
    vars.contact_name = preview.contact_name;
  }
  for (const [k, v] of Object.entries(vars)) {
    result = result.replaceAll(`{{${k}}}`, v);
  }
  return result;
}

export default function AkquiseTemplateEditor({
  subject, body, senderEmail, senderName, onSubjectChange, onBodyChange, mode = "campaign", agencyPreview,
}: AkquiseTemplateEditorProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");

  const previewSubject = useMemo(() => interpolatePreview(subject, agencyPreview), [subject, agencyPreview]);
  const previewBody = useMemo(() => interpolatePreview(body, agencyPreview), [body, agencyPreview]);

  const insertVariable = (key: string, target: "subject" | "body") => {
    const tag = `{{${key}}}`;
    if (target === "subject") onSubjectChange(subject + tag);
    else onBodyChange(body + tag);
  };

  const saveAsTemplate = () => {
    const name = prompt(t("admin.akquise.campaigns.saveTemplateName", "Vorlagenname:"));
    if (!name) return;
    const stored = JSON.parse(localStorage.getItem("akquise_templates") || "[]");
    stored.push({ id: crypto.randomUUID(), name, subject, body, style: body.includes("style=") ? "html" : "plain", createdAt: new Date().toISOString() });
    localStorage.setItem("akquise_templates", JSON.stringify(stored));
    toast.success(t("admin.akquise.campaigns.templateSaved", "Vorlage gespeichert"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left — Editor */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t("admin.akquise.campaigns.subject", "Betreff")}
          </label>
          <Input value={subject} onChange={(e) => onSubjectChange(e.target.value)} className="bg-white/[0.04] border-white/10" />
        </div>

        {/* Variable chips */}
        <div className="flex flex-wrap gap-1.5">
          <Variable className="w-3.5 h-3.5 text-muted-foreground mr-1 mt-1" />
          {VARIABLES.map((v) => (
            <button key={v.key} type="button" onClick={() => insertVariable(v.key, "body")}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-200 hover:bg-purple-500/25 transition-colors">
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/10 w-fit">
          <button type="button" onClick={() => setViewMode("code")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", viewMode === "code" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <Code2 className="w-3.5 h-3.5" /> Code
          </button>
          <button type="button" onClick={() => setViewMode("preview")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", viewMode === "preview" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <Eye className="w-3.5 h-3.5" /> Vorschau
          </button>
        </div>

        {viewMode === "code" ? (
          <Textarea value={body} onChange={(e) => onBodyChange(e.target.value)}
            className="bg-white/[0.04] border-white/10 font-mono text-xs min-h-[280px] leading-relaxed" />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 min-h-[280px] prose prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: previewBody }} />
        )}

        <Button variant="outline" size="sm" onClick={saveAsTemplate} className="gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {t("admin.akquise.campaigns.saveTemplate", "Als Vorlage speichern")}
        </Button>
      </div>

      {/* Right — Live Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Live-Preview
          </label>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPreviewWidth("desktop")}
              className={cn("p-1.5 rounded-md transition-colors", previewWidth === "desktop" ? "bg-white/10 text-white" : "text-muted-foreground")}>
              <Monitor className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setPreviewWidth("mobile")}
              className={cn("p-1.5 rounded-md transition-colors", previewWidth === "mobile" ? "bg-white/10 text-white" : "text-muted-foreground")}>
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser chrome */}
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            </div>
            <div className="flex-1 text-[10px] text-muted-foreground font-mono truncate px-2 py-0.5 bg-white/[0.04] rounded">
              inbox — {previewSubject}
            </div>
          </div>
          <div className="p-4 overflow-auto" style={{ maxHeight: 400 }}>
            <div className="mx-auto transition-all" style={{ maxWidth: previewWidth === "mobile" ? 375 : 600 }}>
              <div className="mb-3 pb-3 border-b border-white/10">
                <div className="text-xs text-muted-foreground">Von: {senderName} &lt;{senderEmail}&gt;</div>
                <div className="text-sm font-bold text-foreground mt-1">{previewSubject}</div>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewBody }} />
              {/* Signature preview */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-sm">
                  <strong className="text-foreground">{senderName}</strong><br/>
                  <span className="text-xs text-muted-foreground">EventBliss · MYFAMBLISS GROUP LTD</span><br/>
                  <span className="text-xs text-muted-foreground">📧 {senderEmail}</span><br/>
                  <a href="https://event-bliss.com" className="text-xs text-purple-400">event-bliss.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
