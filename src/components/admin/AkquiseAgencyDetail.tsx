import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  X, ExternalLink, Copy, Plus, StickyNote, MessageSquare, Sparkles, Link2,
  Mail, Phone, Globe, User, Building2, Target, Tags, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useDirectoryAgency,
  useUpdateDirectoryAgency,
  useAddNote,
  useLogResponse,
  useUpdateTags,
} from "@/hooks/useOutreachAgencyCRM";
import { useOutreachActivity, type OutreachActivityRow } from "@/hooks/useOutreachActivity";

interface Props {
  agencyId: number;
  onClose: () => void;
}

const STATUSES = ["none", "contacted", "follow_up_1", "follow_up_2", "responded", "interested", "onboarded", "rejected"];
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-yellow-500",
  negative: "bg-red-500",
};

const ACTION_ICONS: Record<string, typeof Mail> = {
  email_sent: Mail,
  response_received: MessageSquare,
  note_added: StickyNote,
  status_changed: Target,
  call: Phone,
};

function InlineField({
  label,
  value,
  icon: Icon,
  onSave,
  type = "text",
  link,
}: {
  label: string;
  value: string;
  icon: typeof Mail;
  onSave: (val: string) => void;
  type?: string;
  link?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      {editing ? (
        <Input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className="h-7 text-sm bg-white/[0.04] border-white/10"
        />
      ) : (
        <div
          className="text-sm text-foreground cursor-pointer hover:text-purple-400 truncate"
          onClick={() => setEditing(true)}
        >
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-purple-400" onClick={(e) => e.stopPropagation()}>
              {value || "-"} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            value || "-"
          )}
        </div>
      )}
    </div>
  );
}

export default function AkquiseAgencyDetail({ agencyId, onClose }: Props) {
  const { t } = useTranslation();
  const { data: agency, isLoading } = useDirectoryAgency(agencyId);
  const updateAgency = useUpdateDirectoryAgency();
  const addNote = useAddNote();
  const logResponse = useLogResponse();
  const updateTags = useUpdateTags();
  const { data: activities = [] } = useOutreachActivity(agencyId);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseSentiment, setResponseSentiment] = useState<"positive" | "neutral" | "negative">("neutral");
  const [newTag, setNewTag] = useState("");

  if (isLoading || !agency) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  const save = (field: string, value: unknown) => {
    updateAgency.mutate({ id: agencyId, updates: { [field]: value } as any });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate({ id: agencyId, note: noteText });
    setNoteText("");
    setShowNoteModal(false);
  };

  const handleLogResponse = () => {
    if (!responseText.trim()) return;
    logResponse.mutate({ id: agencyId, response: responseText, sentiment: responseSentiment });
    setResponseText("");
    setShowResponseModal(false);
  };

  const handlePersonalize = async () => {
    try {
      await supabase.functions.invoke("agency-outreach", {
        body: { type: "personalize", directory_id: agencyId, campaign_id: agency.outreach_campaign_id },
      });
      toast.success("KI-Personalisierung gestartet");
    } catch {
      toast.error("Fehler bei KI-Personalisierung");
    }
  };

  const copyInviteLink = () => {
    const link = agency.invite_token ? `https://event-bliss.com/invite/${agency.invite_token}` : "";
    navigator.clipboard.writeText(link);
    toast.success("Link kopiert");
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const current = agency.tags || [];
    updateTags.mutate({ id: agencyId, tags: [...current, newTag.trim()] });
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    const current = agency.tags || [];
    updateTags.mutate({ id: agencyId, tags: current.filter((t) => t !== tag) });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">{agency.name}</h2>
          <p className="text-sm text-muted-foreground">{agency.city}, {agency.country}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">{agency.outreach_status || "none"}</Badge>
            {agency.response_sentiment && (
              <div className={cn("w-3 h-3 rounded-full", SENTIMENT_COLORS[agency.response_sentiment])} title={agency.response_sentiment} />
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Priority */}
      <Select value={agency.priority} onValueChange={(v) => save("priority", v)}>
        <SelectTrigger className="w-40 bg-white/[0.04] border-white/10">
          <SelectValue placeholder="Priorität" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <InlineField icon={Mail} label="Email" value={agency.email} onSave={(v) => save("email", v)} link={`mailto:${agency.email}`} />
        <InlineField icon={Phone} label="Telefon" value={agency.phone || ""} onSave={(v) => save("phone", v)} />
        <InlineField icon={Globe} label="Website" value={agency.website || ""} onSave={(v) => save("website", v)} link={agency.website} />
        <InlineField icon={User} label="Kontakt" value={agency.contact_person || ""} onSave={(v) => save("contact_person", v)} />
        <InlineField icon={User} label="Rolle" value={agency.contact_role || ""} onSave={(v) => save("contact_role", v)} />
        <InlineField icon={Building2} label="Größe" value={agency.agency_size || ""} onSave={(v) => save("agency_size", v)} />
        <InlineField icon={Target} label="Budget" value={agency.estimated_budget || ""} onSave={(v) => save("estimated_budget", v)} />
        <InlineField icon={Target} label="Ziele" value={agency.agency_goals || ""} onSave={(v) => save("agency_goals", v)} />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1"><Tags className="w-3 h-3" /> Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {(agency.tags || []).map((tag) => (
            <Badge key={tag} variant="outline" className="border-white/10 text-xs">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              placeholder="Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="h-6 w-24 text-xs bg-white/[0.04] border-white/10"
            />
            <button onClick={handleAddTag} className="text-purple-400 hover:text-purple-300"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Campaign + Token */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-sm">
          <span className="text-xs text-muted-foreground">Kampagne</span>
          <div className="text-foreground">{agency.outreach_campaign_id || "-"}</div>
        </div>
        <div className="text-sm">
          <span className="text-xs text-muted-foreground">Invite Token</span>
          <div className="flex items-center gap-1 text-foreground">
            <span className="truncate">{agency.invite_token || "-"}</span>
            {agency.invite_token && (
              <button onClick={copyInviteLink}><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowNoteModal(true)}>
          <StickyNote className="w-4 h-4 mr-1" /> {t("admin.akquise.addNote", "Notiz")}
        </Button>
        <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowResponseModal(true)}>
          <MessageSquare className="w-4 h-4 mr-1" /> {t("admin.akquise.logResponse", "Antwort")}
        </Button>
        <Button size="sm" variant="outline" className="border-white/10" onClick={handlePersonalize}>
          <Sparkles className="w-4 h-4 mr-1" /> KI personalisieren
        </Button>
        <Button size="sm" variant="outline" className="border-white/10" onClick={copyInviteLink}>
          <Link2 className="w-4 h-4 mr-1" /> Invite-Link
        </Button>
      </div>

      {/* Note modal */}
      {showNoteModal && (
        <Card className="p-4 border-white/10 bg-white/[0.06] space-y-3">
          <Textarea placeholder="Notiz eingeben..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="bg-white/[0.04] border-white/10 min-h-[80px]" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Speichern</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNoteModal(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      {/* Response modal */}
      {showResponseModal && (
        <Card className="p-4 border-white/10 bg-white/[0.06] space-y-3">
          <Textarea placeholder="Antwort eingeben..." value={responseText} onChange={(e) => setResponseText(e.target.value)} className="bg-white/[0.04] border-white/10 min-h-[80px]" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Stimmung:</span>
            {(["positive", "neutral", "negative"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setResponseSentiment(s)}
                className={cn("w-6 h-6 rounded-full border-2 transition-all", SENTIMENT_COLORS[s], responseSentiment === s ? "border-white scale-110" : "border-transparent opacity-50")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleLogResponse} disabled={logResponse.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Speichern</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowResponseModal(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      {/* Activity timeline */}
      <div>
        <h4 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t("admin.akquise.activity", "Aktivitäten")}
        </h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {activities.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Keine Aktivitäten</p>
          )}
          {activities.map((act) => {
            const IconComp = ACTION_ICONS[act.action] || Clock;
            return (
              <div key={act.id} className="flex items-start gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-sm">{formatAction(act)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(act.created_at).toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatAction(act: OutreachActivityRow): string {
  const details = act.details as Record<string, string> | null;
  switch (act.action) {
    case "email_sent": return `E-Mail gesendet (${act.stage || "?"})`;
    case "response_received": return `Antwort erhalten: ${details?.sentiment || ""}`;
    case "note_added": return `Notiz: ${details?.note?.slice(0, 60) || ""}`;
    case "status_changed": return `Status geändert → ${details?.new_status || ""}`;
    default: return act.action;
  }
}
