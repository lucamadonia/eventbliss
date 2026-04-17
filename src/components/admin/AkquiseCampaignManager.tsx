import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pause, Play, Pencil, Trash2, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useOutreachCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  type OutreachCampaign,
} from "@/hooks/useOutreachCampaigns";

const SENDERS = [
  "partner@event-bliss.com",
  "svitlana@event-bliss.com",
  "rebecca@event-bliss.com",
];

const STAGE1_SUBJECT_PH = "{{agency_name}} — kostenlos an 100.000+ Event-Planer empfohlen werden? \uD83D\uDE80";
const STAGE1_BODY_PH = `<p>Hallo {{contact_person}},</p>
<p>EventBliss ist die neue, investorengest\u00FCtzte Plattform, die Event-Agenturen direkt mit \u00FCber 100.000 Event-Planern verbindet. Als eine der ersten 150 Agenturen erhalten Sie einen <strong>kostenlosen Premium-Eintrag</strong>.</p>
<p>Interesse? Antworten Sie einfach auf diese E-Mail oder buchen Sie direkt einen kurzen Call: <a href="https://event-bliss.com/call">event-bliss.com/call</a></p>
<p>Viele Gr\u00FC\u00DFe,<br/>{{sender_name}}</p>`;

interface CampaignFormData {
  name: string;
  sender_email: string;
  sender_name: string;
  drip_rate: number;
  template_stage1_subject: string;
  template_stage1_body: string;
  template_stage2_subject: string;
  template_stage2_body: string;
  template_stage3_subject: string;
  template_stage3_body: string;
}

const EMPTY_FORM: CampaignFormData = {
  name: "",
  sender_email: SENDERS[0],
  sender_name: "EventBliss Partnerschaften",
  drip_rate: 25,
  template_stage1_subject: "",
  template_stage1_body: "",
  template_stage2_subject: "",
  template_stage2_body: "",
  template_stage3_subject: "",
  template_stage3_body: "",
};

export default function AkquiseCampaignManager() {
  const { t } = useTranslation();
  const { data: campaigns = [] } = useOutreachCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignFormData>(EMPTY_FORM);
  const [showStage2, setShowStage2] = useState(false);
  const [showStage3, setShowStage3] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowStage2(false);
    setShowStage3(false);
    setShowForm(true);
  };

  const openEdit = (c: OutreachCampaign) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      sender_email: c.sender_email,
      sender_name: c.sender_name,
      drip_rate: c.drip_rate,
      template_stage1_subject: c.template_stage1_subject,
      template_stage1_body: c.template_stage1_body,
      template_stage2_subject: c.template_stage2_subject || "",
      template_stage2_body: c.template_stage2_body || "",
      template_stage3_subject: c.template_stage3_subject || "",
      template_stage3_body: c.template_stage3_body || "",
    });
    setShowStage2(!!(c.template_stage2_subject || c.template_stage2_body));
    setShowStage3(!!(c.template_stage3_subject || c.template_stage3_body));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateCampaign.mutate({
        id: editingId,
        name: form.name,
        sender_email: form.sender_email,
        sender_name: form.sender_name,
        drip_rate: form.drip_rate,
        templates: {
          template_stage1_subject: form.template_stage1_subject,
          template_stage1_body: form.template_stage1_body,
          template_stage2_subject: form.template_stage2_subject || null,
          template_stage2_body: form.template_stage2_body || null,
          template_stage3_subject: form.template_stage3_subject || null,
          template_stage3_body: form.template_stage3_body || null,
        },
      });
    } else {
      createCampaign.mutate({
        name: form.name,
        status: "draft",
        sender_email: form.sender_email,
        sender_name: form.sender_name,
        drip_rate: form.drip_rate,
        template_stage1_subject: form.template_stage1_subject,
        template_stage1_body: form.template_stage1_body,
        template_stage2_subject: form.template_stage2_subject || null,
        template_stage2_body: form.template_stage2_body || null,
        template_stage3_subject: form.template_stage3_subject || null,
        template_stage3_body: form.template_stage3_body || null,
        target_filter: {},
        created_by: null,
      });
    }
    setShowForm(false);
  };

  const toggleStatus = (c: OutreachCampaign) => {
    updateCampaign.mutate({
      id: c.id,
      status: c.status === "active" ? "paused" : "active",
    });
  };

  const set = (key: keyof CampaignFormData, val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-foreground">
          {t("admin.akquise.campaignsTitle", "Kampagnen")}
        </h3>
        <Button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t("admin.akquise.newCampaign", "Neue Kampagne")}
        </Button>
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.length === 0 && !showForm && (
          <Card className="p-8 border-white/10 bg-white/[0.04] text-center text-muted-foreground">
            {t("admin.akquise.noCampaignsYet", "Noch keine Kampagnen. Erstelle deine erste!")}
          </Card>
        )}
        {campaigns.map((c) => (
          <Card key={c.id} className="p-4 border-white/10 bg-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-foreground">{c.name}</span>
                <Badge variant="outline" className={cn("text-xs", c.status === "active" ? "border-green-500/50 text-green-400" : c.status === "paused" ? "border-yellow-500/50 text-yellow-400" : "border-white/20 text-muted-foreground")}>
                  {c.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(c)} title={c.status === "active" ? "Pausieren" : "Aktivieren"}>
                  {c.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteCampaign.mutate(c.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{c.sender_email}</span>
              <span>Drip: {c.drip_rate}/Tag</span>
              <span>{c.stats_contacted} kontaktiert</span>
              <span>{c.stats_responded} Antworten</span>
              <span>{c.stats_converted} konvertiert</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="p-6 border-white/10 bg-white/[0.04] space-y-4">
              <h4 className="text-md font-black text-foreground">
                {editingId ? t("admin.akquise.editCampaign", "Kampagne bearbeiten") : t("admin.akquise.createCampaign", "Neue Kampagne erstellen")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Kampagnenname" value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-white/[0.04] border-white/10" />
                <Select value={form.sender_email} onValueChange={(v) => set("sender_email", v)}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SENDERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Absendername" value={form.sender_name} onChange={(e) => set("sender_name", e.target.value)} className="bg-white/[0.04] border-white/10" />
                <Input type="number" placeholder="Drip Rate / Tag" value={form.drip_rate} onChange={(e) => set("drip_rate", Number(e.target.value))} className="bg-white/[0.04] border-white/10" />
              </div>

              {/* Stage 1 */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Stage 1</span>
                <Input placeholder={STAGE1_SUBJECT_PH} value={form.template_stage1_subject} onChange={(e) => set("template_stage1_subject", e.target.value)} className="bg-white/[0.04] border-white/10" />
                <Textarea placeholder={STAGE1_BODY_PH} value={form.template_stage1_body} onChange={(e) => set("template_stage1_body", e.target.value)} className="bg-white/[0.04] border-white/10 min-h-[120px]" />
              </div>

              {/* Stage 2 */}
              <div>
                <button onClick={() => setShowStage2(!showStage2)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  {showStage2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Stage 2 (Follow-Up)
                </button>
                {showStage2 && (
                  <div className="space-y-2 mt-2">
                    <Input placeholder="Stage 2 Betreff" value={form.template_stage2_subject} onChange={(e) => set("template_stage2_subject", e.target.value)} className="bg-white/[0.04] border-white/10" />
                    <Textarea placeholder="Stage 2 Body" value={form.template_stage2_body} onChange={(e) => set("template_stage2_body", e.target.value)} className="bg-white/[0.04] border-white/10 min-h-[100px]" />
                  </div>
                )}
              </div>

              {/* Stage 3 */}
              <div>
                <button onClick={() => setShowStage3(!showStage3)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  {showStage3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Stage 3 (Letzter Versuch)
                </button>
                {showStage3 && (
                  <div className="space-y-2 mt-2">
                    <Input placeholder="Stage 3 Betreff" value={form.template_stage3_subject} onChange={(e) => set("template_stage3_subject", e.target.value)} className="bg-white/[0.04] border-white/10" />
                    <Textarea placeholder="Stage 3 Body" value={form.template_stage3_body} onChange={(e) => set("template_stage3_body", e.target.value)} className="bg-white/[0.04] border-white/10 min-h-[100px]" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={createCampaign.isPending || updateCampaign.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  {editingId ? t("admin.akquise.save", "Speichern") : t("admin.akquise.create", "Erstellen")}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  {t("admin.akquise.cancel", "Abbrechen")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
