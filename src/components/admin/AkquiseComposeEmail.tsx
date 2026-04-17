import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X, Send, Loader2, Globe, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLogActivity } from "@/hooks/useOutreachActivity";
import { detectLanguageFromCountry, getOutreachTemplates, getAvailableTemplateLangs, LANG_LABELS, type OutreachLang } from "@/lib/outreach-templates";
import AkquiseTemplateEditor from "./AkquiseTemplateEditor";

interface AkquiseComposeEmailProps {
  agency: { id: number; name: string; email: string; city: string; contact_person: string | null; country?: string; country_code?: string };
  onClose: () => void;
  onSent: () => void;
}

const SENDERS = ["partner@event-bliss.com", "svitlana@event-bliss.com", "rebecca@event-bliss.com"];

export default function AkquiseComposeEmail({ agency, onClose, onSent }: AkquiseComposeEmailProps) {
  const { t } = useTranslation();
  const logActivity = useLogActivity();
  const detectedLang = useMemo(() => detectLanguageFromCountry(agency.country, agency.country_code), [agency.country, agency.country_code]);

  const [senderEmail, setSenderEmail] = useState(SENDERS[0]);
  const [senderName, setSenderName] = useState("EventBliss Partnerschaften");
  const [templateLang, setTemplateLang] = useState<string>(detectedLang);
  const [subject, setSubject] = useState(() => getOutreachTemplates(detectedLang, "plain").stage1.subject);
  const [body, setBody] = useState(() => getOutreachTemplates(detectedLang, "plain").stage1.body);
  const [sending, setSending] = useState(false);

  const langs = useMemo(() => getAvailableTemplateLangs(), []);

  const loadTemplate = (stage: "stage1" | "stage2" | "stage3", style: "plain" | "html") => {
    const templates = getOutreachTemplates(templateLang, style);
    setSubject(templates[stage].subject);
    setBody(templates[stage].body);
  };

  const handleLangChange = (lang: string) => {
    setTemplateLang(lang);
    const templates = getOutreachTemplates(lang, "plain");
    setSubject(templates.stage1.subject);
    setBody(templates.stage1.body);
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Betreff fehlt"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("agency-outreach", {
        body: { type: "send_single", directory_id: agency.id, sender_email: senderEmail, sender_name: senderName, subject, body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Mail an ${agency.name} gesendet!`);
      logActivity.mutate({ directoryId: agency.id, action: "email_sent", details: { subject, sender: senderEmail, mode: "manual_compose" } });
      onSent();
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0118]">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-[#0a0118]/95 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-black text-white">Mail verfassen</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              an <strong className="text-foreground">{agency.name}</strong> · {agency.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Country + detected language */}
            <Badge variant="outline" className="border-white/20 text-white/80 gap-1.5">
              <Globe className="w-3 h-3" />
              {agency.country || agency.city}
              <span className="text-purple-300 font-bold">{LANG_LABELS[detectedLang] || detectedLang.toUpperCase()}</span>
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Sender + Language row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Von</label>
              <Select value={senderEmail} onValueChange={setSenderEmail}>
                <SelectTrigger className="bg-white/[0.04] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{SENDERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Absendername</label>
              <input value={senderName} onChange={(e) => setSenderName(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-white/[0.04] border border-white/10 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                <Globe className="w-3 h-3 inline mr-1" />Sprache
              </label>
              <Select value={templateLang} onValueChange={handleLangChange}>
                <SelectTrigger className="bg-white/[0.04] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {langs.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template loader */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Vorlage laden:
            </span>
            {(["stage1", "stage2", "stage3"] as const).map((stage, i) => (
              <div key={stage} className="flex gap-1">
                <button type="button" onClick={() => loadTemplate(stage, "plain")}
                  className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 transition-colors">
                  Stage {i + 1} Plain
                </button>
                <button type="button" onClick={() => loadTemplate(stage, "html")}
                  className="text-[10px] px-2 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-200 hover:bg-purple-500/25 transition-colors">
                  Stage {i + 1} HTML
                </button>
              </div>
            ))}
          </div>

          {/* Template Editor */}
          <AkquiseTemplateEditor
            subject={subject}
            body={body}
            senderEmail={senderEmail}
            senderName={senderName}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            mode="individual"
            agencyPreview={{ name: agency.name, city: agency.city, contact_name: agency.contact_person || agency.name }}
          />

          {/* Send */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSend} disabled={sending || !subject.trim()}
              className="gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-0 font-bold h-12 px-8 rounded-xl shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sending ? "Wird gesendet..." : "Mail senden"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
