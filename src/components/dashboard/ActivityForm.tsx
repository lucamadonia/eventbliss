import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  location_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  estimated_cost: number | null;
  currency: string;
  cost_per_person: boolean;
  requirements: string[] | null;
  notes: string | null;
  responsible_participant_id: string | null;
}

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Activity>) => void;
  activity: Activity | null;
  participants: Participant[];
  defaultDate: string;
}

export const ActivityForm = ({
  open,
  onClose,
  onSave,
  activity,
  participants,
  defaultDate,
}: ActivityFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Activity>>({
    title: "",
    description: "",
    day_date: defaultDate,
    start_time: "",
    end_time: "",
    location: "",
    location_url: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    estimated_cost: null,
    currency: "EUR",
    cost_per_person: true,
    requirements: [],
    notes: "",
    responsible_participant_id: null,
  });
  const [newRequirement, setNewRequirement] = useState("");

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        description: activity.description || "",
        day_date: activity.day_date,
        start_time: activity.start_time || "",
        end_time: activity.end_time || "",
        location: activity.location || "",
        location_url: activity.location_url || "",
        contact_name: activity.contact_name || "",
        contact_phone: activity.contact_phone || "",
        contact_email: activity.contact_email || "",
        estimated_cost: activity.estimated_cost,
        currency: activity.currency,
        cost_per_person: activity.cost_per_person,
        requirements: activity.requirements || [],
        notes: activity.notes || "",
        responsible_participant_id: activity.responsible_participant_id,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        day_date: defaultDate,
        start_time: "",
        end_time: "",
        location: "",
        location_url: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        estimated_cost: null,
        currency: "EUR",
        cost_per_person: true,
        requirements: [],
        notes: "",
        responsible_participant_id: null,
      });
    }
  }, [activity, defaultDate, open]);

  const handleChange = (field: keyof Activity, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      handleChange("requirements", [
        ...(formData.requirements || []),
        newRequirement.trim(),
      ]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    handleChange(
      "requirements",
      (formData.requirements || []).filter((_, i) => i !== index)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.day_date) return;

    onSave({
      ...formData,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activity ? t('planner.editActivity') : t('planner.newActivity')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('planner.form.title')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t('planner.form.titlePlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">{t('planner.form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder={t('planner.form.descriptionPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="day_date">{t('planner.form.date')} *</Label>
              <Input
                id="day_date"
                type="date"
                value={formData.day_date}
                onChange={(e) => handleChange("day_date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="start_time">{t('planner.form.startTime')}</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time || ""}
                onChange={(e) => handleChange("start_time", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_time">{t('planner.form.endTime')}</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time || ""}
                onChange={(e) => handleChange("end_time", e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">{t('planner.form.location')}</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder={t('planner.form.locationPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="location_url">{t('planner.form.locationUrl')}</Label>
              <Input
                id="location_url"
                type="url"
                value={formData.location_url || ""}
                onChange={(e) => handleChange("location_url", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <Label>{t('planner.form.responsiblePerson')}</Label>
            <select
              value={formData.responsible_participant_id || ""}
              onChange={(e) =>
                handleChange(
                  "responsible_participant_id",
                  e.target.value || null
                )
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm"
            >
              <option value="">{t('planner.form.selectPerson')}</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.role === "organizer" && `(${t('common.organizer')})`}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contact_name">{t('planner.form.contactName')}</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ""}
                onChange={(e) => handleChange("contact_name", e.target.value)}
                placeholder={t('planner.form.contactNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">{t('planner.form.contactPhone')}</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone || ""}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
                placeholder="+49..."
              />
            </div>
            <div>
              <Label htmlFor="contact_email">{t('planner.form.contactEmail')}</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email || ""}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Cost */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="estimated_cost">{t('planner.form.estimatedCost')}</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_cost || ""}
                onChange={(e) =>
                  handleChange(
                    "estimated_cost",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">{t('planner.form.currency')}</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="cost_per_person"
                checked={formData.cost_per_person}
                onCheckedChange={(checked) =>
                  handleChange("cost_per_person", checked)
                }
              />
              <Label htmlFor="cost_per_person" className="text-sm">
                {t('planner.form.perPerson')}
              </Label>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Label>{t('planner.form.requirements')}</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder={t('planner.form.requirementPlaceholder')}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" variant="outline" onClick={addRequirement}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.requirements || []).map((req, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {req}
                  <button
                    type="button"
                    onClick={() => removeRequirement(i)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t('planner.form.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={t('planner.form.notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <GradientButton type="submit">
              {activity ? t('common.save') : t('planner.createActivity')}
            </GradientButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
