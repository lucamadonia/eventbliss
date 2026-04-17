import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X, Send, Loader2, Globe, BookOpen, Sparkles, ExternalLink, Building2 } from "lucide-react";
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

/**
 * Replace all {{...}} placeholders with real agency + EventBliss data.
 * Called immediately when a template is loaded so the admin sees the actual
 * personalized email — not raw placeholder syntax.
 */
function prefillWithRealData(
  text: string,
  ag: AkquiseComposeEmailProps["agency"],
  sender: string,
): string {
  return text
    .replaceAll("{{agency_name}}", ag.name || "")
    .replaceAll("{{contact_name}}", ag.contact_person || ag.name || "")
    .replaceAll("{{city}}", ag.city || "")
    .replaceAll("{{country}}", ag.country || "")
    .replaceAll("{{website}}", (ag as any).website || "")
    .replaceAll("{{sender_name}}", sender)
    .replaceAll("{{signup_url}}", `https://event-bliss.com/agency-apply?invite=${ag.name.toLowerCase().replace(/\s+/g, "-").slice(0, 12)}`);
}

export default function AkquiseComposeEmail({ agency, onClose, onSent }: AkquiseComposeEmailProps) {
  const { t } = useTranslation();
  const logActivity = useLogActivity();
  const detectedLang = useMemo(() => detectLanguageFromCountry(agency.country, agency.country_code), [agency.country, agency.country_code]);

  const [senderEmail, setSenderEmail] = useState(SENDERS[0]);
  const [senderName, setSenderName] = useState("EventBliss Partnerschaften");
  const [templateLang, setTemplateLang] = useState<string>(detectedLang);
  const [aiLoading, setAiLoading] = useState(false);

  // Pre-fill template with REAL agency data on initial load
  const [subject, setSubject] = useState(() => {
    const tpl = getOutreachTemplates(detectedLang, "plain").stage1;
    return prefillWithRealData(tpl.subject, agency, "EventBliss Partnerschaften");
  });
  const [body, setBody] = useState(() => {
    const tpl = getOutreachTemplates(detectedLang, "plain").stage1;
    return prefillWithRealData(tpl.body, agency, "EventBliss Partnerschaften");
  });
  const [sending, setSending] = useState(false);

  const langs = useMemo(() => getAvailableTemplateLangs(), []);

  const loadTemplate = (stage: "stage1" | "stage2" | "stage3", style: "plain" | "html") => {
    const templates = getOutreachTemplates(templateLang, style);
    // Immediately replace placeholders with real data
    setSubject(prefillWithRealData(templates[stage].subject, agency, senderName));
    setBody(prefillWithRealData(templates[stage].body, agency, senderName));
  };

  const handleLangChange = (lang: string) => {
    setTemplateLang(lang);
    const templates = getOutreachTemplates(lang, "plain");
    setSubject(prefillWithRealData(templates.stage1.subject, agency, senderName));
    setBody(prefillWithRealData(templates.stage1.body, agency, senderName));
  };

  // KI-Personalisierung: Claude schreibt basierend auf Agentur-Daten einen individuellen Pitch
  const handleAiPersonalize = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agency-outreach", {
        body: {
          type: "personalize",
          directory_id: agency.id,
          campaign_id: "manual", // Flag for manual compose
          stage: "stage_1",
        },
      });
      if (error) throw error;
      if (data?.subject) setSubject(data.subject);
      if (data?.body) setBody(data.body);
      toast.success("KI-Pitch generiert!");
    } catch (err) {
      toast.error(`KI-Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`);
    } finally {
      setAiLoading(false);
    }
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

          {/* Agency info card — so admin can reference real data */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                {agency.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-foreground text-base">{agency.name}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  <span>📍 {agency.city}{agency.country ? `, ${agency.country}` : ""}</span>
                  {agency.contact_person && <span>👤 {agency.contact_person}</span>}
                  <span>📧 {agency.email}</span>
                  {(agency as any).website && (
                    <a href={(agency as any).website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" /> Website
                    </a>
                  )}
                  {(agency as any).description && <span>📝 {(agency as any).description}</span>}
                </div>
              </div>
              <Button onClick={handleAiPersonalize} disabled={aiLoading} size="sm"
                className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-bold flex-shrink-0">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                KI-Pitch generieren
              </Button>
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground bg-black/20 rounded-lg p-2">
              <Building2 className="w-3 h-3 inline mr-1" />
              <strong>EventBliss — Die All-in-One Event-Planungsplattform:</strong><br/>
              🎯 100.000+ Event-Planer · 170+ Partner-Agenturen · 10 Sprachen<br/>
              🎮 17 Party-Games (Bomb, Taboo, Quiz, HeadUp, StoryBuilder, ...) + TV-Modus für Events<br/>
              📱 iOS App + Android App + PWA + Web — überall nutzbar<br/>
              🤖 KI-Event-Assistent (Claude) — plant Trips, Aktivitäten, Tagespläne, Budget automatisch<br/>
              📊 Integriertes CRM + Booking-Kalender + Stripe-Zahlungen + Rechnungen<br/>
              🌐 Marketplace mit Agentur-Profilen + SEO + Embeddable iFrames für eigene Websites<br/>
              📋 Umfragen-Tool für Gruppen (Budget, Destination, Aktivitäten-Voting)<br/>
              📅 Smart Booking-Kalender (Monat/Woche/Tag/Resource-Views) + Konflikterkennung<br/>
              💼 3-Tier B2B Modell (Starter kostenlos / Professional 49€ / Enterprise 149€)<br/>
              📈 KI-gestützte Werbung — Services werden automatisch bei passenden Events empfohlen<br/>
              🔗 Stripe Connect für automatische Agentur-Auszahlungen<br/>
              📧 Automatische Booking-Bestätigung + 24h-Reminder Mails<br/>
              🏢 Investor-Backed · MYFAMBLISS GROUP LTD · Zypern
            </div>
          </div>

          {/* Template loader */}
          <div className="flex flex-wrap gap-2 items-center">
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
