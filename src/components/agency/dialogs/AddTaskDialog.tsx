import { useState, useEffect } from "react";
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

export interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string;
  dueDate: string;
  category: string;
}

export interface Task extends TaskFormData {
  id: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskFormData) => void;
  editingTask?: Task | null;
}

const emptyForm: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  assignee: "",
  dueDate: "",
  category: "",
};

export function AddTaskDialog({ open, onOpenChange, onSave, editingTask }: AddTaskDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TaskFormData>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(editingTask ? {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assignee: editingTask.assignee,
        dueDate: editingTask.dueDate,
        category: editingTask.category,
      } : emptyForm);
    }
  }, [open, editingTask]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid = form.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTask ? t("tasks.titleEdit", "Aufgabe bearbeiten") : t("tasks.titleNew", "Neue Aufgabe")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-white/60 text-xs">{t("tasks.fieldTitle", "Titel")} *</Label>
            <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder={t("tasks.fieldTitlePlaceholder", "Aufgabentitel")}
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="text-white/60 text-xs">{t("tasks.fieldDescription", "Beschreibung")}</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3}
              placeholder={t("tasks.fieldDescriptionPlaceholder", "Beschreibung...")} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">{t("tasks.priority", "Priorität")}</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskFormData["priority"] })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("tasks.priorityLow", "Niedrig")}</SelectItem>
                  <SelectItem value="medium">{t("tasks.priorityMedium", "Mittel")}</SelectItem>
                  <SelectItem value="high">{t("tasks.priorityHigh", "Hoch")}</SelectItem>
                  <SelectItem value="urgent">{t("tasks.priorityUrgent", "Dringend")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("tasks.category", "Kategorie")}</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder={t("tasks.categoryPlaceholder", "z.B. Logistik")}
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">{t("tasks.assignee", "Zuständig")}</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder={t("tasks.assigneePlaceholder", "Name")}
                value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("tasks.dueDate", "Fälligkeitsdatum")}</Label>
              <Input type="date" className="bg-white/5 border-white/10 text-white mt-1"
                value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            onClick={() => onOpenChange(false)}>{t("tasks.cancel", "Abbrechen")}</Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" disabled={!isValid}
            onClick={handleSave}>{t("tasks.save", "Speichern")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
