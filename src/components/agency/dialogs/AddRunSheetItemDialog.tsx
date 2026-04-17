import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RESPONSIBLE_ROLES = [
  { value: "moderator", label: "Moderator" },
  { value: "technician", label: "Technician" },
  { value: "catering", label: "Catering" },
  { value: "crew", label: "Crew" },
  { value: "management", label: "Management" },
  { value: "other", label: "Other" },
] as const;

const STAGES = [
  { value: "main", label: "Main Stage" },
  { value: "breakout1", label: "Breakout Room 1" },
  { value: "breakout2", label: "Breakout Room 2" },
  { value: "outdoor", label: "Outdoor" },
  { value: "other", label: "Other" },
] as const;

export type ResponsibleRole = (typeof RESPONSIBLE_ROLES)[number]["value"];
export type StageType = (typeof STAGES)[number]["value"];

export interface RunSheetItemFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  responsibleName: string;
  responsibleRole: ResponsibleRole;
  stage: StageType;
  cueNotes: string;
}

export interface RunSheetItem extends RunSheetItemFormData {
  id: string;
}

interface AddRunSheetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RunSheetItemFormData) => void;
  editingItem?: RunSheetItem | null;
}

const emptyForm: RunSheetItemFormData = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  durationMinutes: 0,
  responsibleName: "",
  responsibleRole: "crew",
  stage: "main",
  cueNotes: "",
};

export function AddRunSheetItemDialog({ open, onOpenChange, onSave, editingItem }: AddRunSheetItemDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<RunSheetItemFormData>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(editingItem ? {
        title: editingItem.title,
        description: editingItem.description,
        startTime: editingItem.startTime,
        endTime: editingItem.endTime,
        durationMinutes: editingItem.durationMinutes,
        responsibleName: editingItem.responsibleName,
        responsibleRole: editingItem.responsibleRole,
        stage: editingItem.stage,
        cueNotes: editingItem.cueNotes,
      } : emptyForm);
    }
  }, [open, editingItem]);

  const calculatedDuration = useMemo(() => {
    if (!form.startTime || !form.endTime) return 0;
    const start = new Date(form.startTime).getTime();
    const end = new Date(form.endTime).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 0;
    return Math.round((end - start) / 60000);
  }, [form.startTime, form.endTime]);

  useEffect(() => {
    if (calculatedDuration > 0 && calculatedDuration !== form.durationMinutes) {
      setForm((prev) => ({ ...prev, durationMinutes: calculatedDuration }));
    }
  }, [calculatedDuration]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid = form.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Cue Point bearbeiten" : "Neuer Cue Point"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-white/60 text-xs">Titel *</Label>
            <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Cue-Titel"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Beschreibung</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2}
              placeholder="Beschreibung..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Startzeit</Label>
              <Input type="datetime-local" className="bg-white/5 border-white/10 text-white mt-1"
                value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Endzeit</Label>
              <Input type="datetime-local" className="bg-white/5 border-white/10 text-white mt-1"
                value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Dauer (Minuten)</Label>
            <Input type="number" className="bg-white/5 border-white/10 text-white/60 mt-1" readOnly
              value={form.durationMinutes || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Verantwortlich</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Name"
                value={form.responsibleName}
                onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Rolle</Label>
              <Select value={form.responsibleRole} onValueChange={(v) => setForm({ ...form, responsibleRole: v as ResponsibleRole })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Bühne / Bereich</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as StageType })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Cue Notes</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2}
              placeholder="Technische Hinweise, Regieanweisungen..."
              value={form.cueNotes} onChange={(e) => setForm({ ...form, cueNotes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" disabled={!isValid}
            onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
