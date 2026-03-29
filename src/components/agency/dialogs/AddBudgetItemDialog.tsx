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

const BUDGET_CATEGORIES = [
  "Venue", "Catering", "Technik", "Personal", "Marketing",
  "Decoration", "Transport", "Accommodation", "Entertainment", "Other",
] as const;

export type BudgetCategoryType = (typeof BUDGET_CATEGORIES)[number];

export interface BudgetItemFormData {
  category: BudgetCategoryType;
  subcategory: string;
  description: string;
  plannedAmount: number;
  quotedAmount: number;
  actualAmount: number;
  notes: string;
}

export interface BudgetItem extends BudgetItemFormData {
  id: string;
}

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BudgetItemFormData) => void;
  editingItem?: BudgetItem | null;
}

const emptyForm: BudgetItemFormData = {
  category: "Other",
  subcategory: "",
  description: "",
  plannedAmount: 0,
  quotedAmount: 0,
  actualAmount: 0,
  notes: "",
};

export function AddBudgetItemDialog({ open, onOpenChange, onSave, editingItem }: AddBudgetItemDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<BudgetItemFormData>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(editingItem ? {
        category: editingItem.category,
        subcategory: editingItem.subcategory,
        description: editingItem.description,
        plannedAmount: editingItem.plannedAmount,
        quotedAmount: editingItem.quotedAmount,
        actualAmount: editingItem.actualAmount,
        notes: editingItem.notes,
      } : emptyForm);
    }
  }, [open, editingItem]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid = form.description.trim().length > 0;

  const handleNumberChange = (field: "plannedAmount" | "quotedAmount" | "actualAmount", value: string) => {
    const num = parseFloat(value);
    setForm({ ...form, [field]: isNaN(num) ? 0 : num });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Budgetposten bearbeiten" : "Neuer Budgetposten"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Kategorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as BudgetCategoryType })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Unterkategorie</Label>
              <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="z.B. Raummiete"
                value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Beschreibung *</Label>
            <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Beschreibung des Postens"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-white/60 text-xs">Geplant (EUR)</Label>
              <Input type="number" step="0.01" className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="0.00" value={form.plannedAmount || ""}
                onChange={(e) => handleNumberChange("plannedAmount", e.target.value)} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Angebot (EUR)</Label>
              <Input type="number" step="0.01" className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="0.00" value={form.quotedAmount || ""}
                onChange={(e) => handleNumberChange("quotedAmount", e.target.value)} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Tatsaechlich (EUR)</Label>
              <Input type="number" step="0.01" className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="0.00" value={form.actualAmount || ""}
                onChange={(e) => handleNumberChange("actualAmount", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Notizen</Label>
            <Textarea className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3}
              placeholder="Zusaetzliche Informationen..." value={form.notes}
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
