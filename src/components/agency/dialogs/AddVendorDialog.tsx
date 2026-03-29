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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VENDOR_TYPES = [
  { value: "veranstalter", label: "Event Host" },
  { value: "dienstleister", label: "Service Provider" },
  { value: "crew", label: "Crew/Staff" },
  { value: "kontaktperson", label: "Contact Person" },
] as const;

const SPECIALIZATIONS = [
  "Catering", "Technik", "Location", "Fotografie", "Musik",
  "Dekoration", "Transport", "Security", "Moderation", "Other",
] as const;

export type VendorType = (typeof VENDOR_TYPES)[number]["value"];

export interface VendorFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  type: VendorType;
  specializations: string[];
  city: string;
  country: string;
  notes: string;
}

export interface Vendor extends VendorFormData {
  id: string;
}

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: VendorFormData) => void;
  editingVendor?: Vendor | null;
}

const emptyForm: VendorFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  type: "dienstleister",
  specializations: [],
  city: "",
  country: "DE",
  notes: "",
};

export function AddVendorDialog({ open, onOpenChange, onSave, editingVendor }: AddVendorDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<VendorFormData>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(editingVendor ? {
        name: editingVendor.name,
        company: editingVendor.company,
        email: editingVendor.email,
        phone: editingVendor.phone,
        website: editingVendor.website,
        type: editingVendor.type,
        specializations: [...editingVendor.specializations],
        city: editingVendor.city,
        country: editingVendor.country,
        notes: editingVendor.notes,
      } : emptyForm);
    }
  }, [open, editingVendor]);

  const toggleSpecialization = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVendor ? "Vendor bearbeiten" : "Neuer Vendor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Name *</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Vor- und Nachname"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Unternehmen</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Firmenname"
                value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Typ</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as VendorType })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_TYPES.map((vt) => (
                  <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">E-Mail</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="email@beispiel.de"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Telefon</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="+49..."
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Website</Label>
            <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="https://..."
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Spezialisierung</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {SPECIALIZATIONS.map((spec) => (
                <Badge key={spec} variant="outline"
                  className={`text-[10px] cursor-pointer transition-colors ${
                    form.specializations.includes(spec)
                      ? "border-violet-500/50 text-violet-300 bg-violet-500/10"
                      : "border-white/10 text-white/50 hover:border-violet-500/30 hover:text-violet-300"
                  }`}
                  onClick={() => toggleSpecialization(spec)}>
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Stadt</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Stadt"
                value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Land</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="DE"
                value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Notizen</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3}
              placeholder="Interne Notizen..." value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
