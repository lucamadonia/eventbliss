import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Pencil, Trash2, Loader2,
  Activity, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StatCard } from "./ui/StatCard";
import {
  useAgencyGuides,
  useCreateGuide,
  useUpdateGuide,
  useDeleteGuide,
  type AgencyGuide,
} from "@/hooks/useAgencyGuides";

/* ─── Constants ─────────────────────────────────────── */
const SPECIALTY_OPTIONS = [
  "Cocktail Workshop",
  "Weinverkostung",
  "Kochkurs",
  "Live-Musik",
  "DJ",
  "Fotografie",
  "Videografie",
  "Moderation",
  "Dekoration",
  "Catering",
  "Team-Building",
  "Outdoor-Aktivitäten",
];

const COLOR_OPTIONS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

interface Props {
  agencyId: string;
}

interface GuideFormData {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  max_daily_bookings: number;
  color: string;
  notes: string;
}

const emptyForm: GuideFormData = {
  name: "",
  email: "",
  phone: "",
  specialties: [],
  max_daily_bookings: 3,
  color: "#8b5cf6",
  notes: "",
};

/* ─── Component ─────────────────────────────────────── */
export default function AgencyGuideManager({ agencyId }: Props) {
  const { t } = useTranslation();
  const { data: guides = [], isLoading } = useAgencyGuides(agencyId);
  const createGuide = useCreateGuide();
  const updateGuide = useUpdateGuide();
  const deleteGuide = useDeleteGuide();

  const [createOpen, setCreateOpen] = useState(false);
  const [editGuide, setEditGuide] = useState<AgencyGuide | null>(null);
  const [form, setForm] = useState<GuideFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeGuides = guides.filter((g) => g.is_active);
  const avgDailyBookings =
    guides.length > 0
      ? Math.round(guides.reduce((s, g) => s + g.max_daily_bookings, 0) / guides.length)
      : 0;

  const kpis = [
    { label: t("guideManager.totalGuides", "Guides gesamt"), value: guides.length, icon: Users, variant: "purple" as const, trend: 0, sparkData: [1, 2, 3, guides.length] },
    { label: t("guideManager.activeGuides", "Aktive Guides"), value: activeGuides.length, icon: Activity, variant: "green" as const, trend: 0, sparkData: [1, 1, 2, activeGuides.length] },
    { label: t("guideManager.avgDaily", "Ø Buchungen/Tag"), value: avgDailyBookings, icon: AlertCircle, variant: "cyan" as const, trend: 0, sparkData: [1, 2, 2, avgDailyBookings] },
  ];

  /* ── Handlers ──────────────────────────────────────── */
  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(guide: AgencyGuide) {
    setForm({
      name: guide.name,
      email: guide.email || "",
      phone: guide.phone || "",
      specialties: guide.specialties || [],
      max_daily_bookings: guide.max_daily_bookings,
      color: guide.color || "#8b5cf6",
      notes: guide.notes || "",
    });
    setEditGuide(guide);
  }

  function handleCreate() {
    createGuide.mutate(
      {
        agency_id: agencyId,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        specialties: form.specialties,
        max_daily_bookings: form.max_daily_bookings,
        color: form.color,
        notes: form.notes || undefined,
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  }

  function handleUpdate() {
    if (!editGuide) return;
    updateGuide.mutate(
      {
        id: editGuide.id,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        specialties: form.specialties,
        max_daily_bookings: form.max_daily_bookings,
        color: form.color,
        notes: form.notes || null,
      },
      { onSuccess: () => setEditGuide(null) }
    );
  }

  function handleDelete(id: string) {
    deleteGuide.mutate(
      { id, agencyId },
      { onSuccess: () => setDeleteConfirm(null) }
    );
  }

  function toggleSpecialty(spec: string) {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  /* ── Form Dialog Content ───────────────────────────── */
  const formContent = (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300 text-xs">{t("guideManager.name", "Name")} *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Max Mustermann"
          className="mt-1 bg-white/[0.04] border-white/[0.08] text-slate-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-300 text-xs">{t("guideManager.email", "E-Mail")}</Label>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="max@example.com"
            className="mt-1 bg-white/[0.04] border-white/[0.08] text-slate-100"
          />
        </div>
        <div>
          <Label className="text-slate-300 text-xs">{t("guideManager.phone", "Telefon")}</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+49 170 ..."
            className="mt-1 bg-white/[0.04] border-white/[0.08] text-slate-100"
          />
        </div>
      </div>
      <div>
        <Label className="text-slate-300 text-xs">{t("guideManager.maxDaily", "Max. Buchungen/Tag")}</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={form.max_daily_bookings}
          onChange={(e) => setForm({ ...form, max_daily_bookings: parseInt(e.target.value) || 1 })}
          className="mt-1 bg-white/[0.04] border-white/[0.08] text-slate-100 w-24"
        />
      </div>
      <div>
        <Label className="text-slate-300 text-xs mb-2 block">{t("guideManager.color", "Farbe")}</Label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setForm({ ...form, color: c })}
              className={cn(
                "w-7 h-7 rounded-lg cursor-pointer transition-all",
                form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1625] scale-110" : "opacity-60 hover:opacity-100"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <Label className="text-slate-300 text-xs mb-2 block">{t("guideManager.specialties", "Spezialisierungen")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALTY_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpecialty(spec)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-all",
                form.specialties.includes(spec)
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                  : "text-slate-500 border-white/[0.08] hover:text-slate-300 hover:bg-white/[0.04]"
              )}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-slate-300 text-xs">{t("guideManager.notes", "Notizen")}</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Interne Notizen..."
          className="mt-1 bg-white/[0.04] border-white/[0.08] text-slate-100"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Guides</h3>
          <p className="text-sm text-slate-500">Team-Mitglieder für Buchungen verwalten</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Neuer Guide
        </Button>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Guide Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        {guides.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{t("guideManager.noGuides", "Noch keine Guides angelegt")}</p>
            <p className="text-slate-600 text-xs mt-1">Erstelle deinen ersten Guide, um Buchungen zuzuweisen</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Guide</th>
                  <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">E-Mail</th>
                  <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Spezialisierungen</th>
                  <th className="text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Max/Tag</th>
                  <th className="text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {guides.map((guide, i) => (
                    <motion.tr
                      key={guide.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: guide.color || "#8b5cf6" }}
                          >
                            {guide.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-100">{guide.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{guide.email || "–"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(guide.specialties || []).slice(0, 3).map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-white/[0.08] text-slate-400"
                            >
                              {s}
                            </Badge>
                          ))}
                          {(guide.specialties || []).length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/[0.08] text-slate-500">
                              +{guide.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-sm text-slate-300">{guide.max_daily_bookings}</td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            guide.is_active
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-white/10 text-white/50 border-white/20"
                          )}
                        >
                          {guide.is_active ? t("guideManager.active", "Aktiv") : t("guideManager.inactive", "Inaktiv")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(guide)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-200 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(guide.id)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#1a1625] border-white/[0.08] text-slate-100 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50">{t("guideManager.createGuide", "Guide erstellen")}</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              className="text-slate-400 cursor-pointer"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || createGuide.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              {createGuide.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editGuide} onOpenChange={(open) => !open && setEditGuide(null)}>
        <DialogContent className="bg-[#1a1625] border-white/[0.08] text-slate-100 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50">{t("guideManager.editGuide", "Guide bearbeiten")}</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditGuide(null)}
              className="text-slate-400 cursor-pointer"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!form.name.trim() || updateGuide.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              {updateGuide.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-[#1a1625] border-white/[0.08] text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-50">{t("guideManager.deleteGuide", "Guide löschen")}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Dieser Guide und alle zugehörigen Zuweisungen werden unwiderruflich gelöscht.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="text-slate-400 cursor-pointer"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteGuide.isPending}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {deleteGuide.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
