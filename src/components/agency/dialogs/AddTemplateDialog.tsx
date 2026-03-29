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

const TEMPLATE_CATEGORIES = [
  { value: "corporate", label: "Corporate" },
  { value: "wedding", label: "Wedding" },
  { value: "jga", label: "JGA/Bachelor" },
  { value: "birthday", label: "Birthday" },
  { value: "conference", label: "Conference" },
  { value: "festival", label: "Festival" },
  { value: "other", label: "Other" },
] as const;

const EVENT_TYPES = [
  { value: "bachelor", label: "Bachelor" },
  { value: "bachelorette", label: "Bachelorette" },
  { value: "birthday", label: "Birthday" },
  { value: "trip", label: "Trip" },
  { value: "other", label: "Other" },
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]["value"];
export type EventType = (typeof EVENT_TYPES)[number]["value"];

export interface TemplateFormData {
  name: string;
  description: string;
  category: TemplateCategory;
  eventType: EventType;
}

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TemplateFormData) => void;
}

const emptyForm: TemplateFormData = {
  name: "",
  description: "",
  category: "other",
  eventType: "other",
};

export function AddTemplateDialog({ open, onOpenChange, onSave }: AddTemplateDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Vorlage erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-white/60 text-xs">Name *</Label>
            <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Vorlagenname"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Beschreibung</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3}
              placeholder="Was beinhaltet diese Vorlage?" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Kategorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as TemplateCategory })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Event-Typ</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v as EventType })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((et) => (
                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
