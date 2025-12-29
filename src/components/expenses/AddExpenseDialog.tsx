import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Home,
  Target,
  Utensils,
  Beer,
  Gift,
  Wallet,
  Plus,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/GradientButton";

interface Participant {
  id: string;
  name: string;
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  currency: string;
  onAdd: (expense: {
    description: string;
    amount: number;
    category: string;
    paid_by_participant_id: string;
  }) => Promise<void>;
}

const CATEGORIES = [
  { value: "transport", label: "Transport", icon: Car, emoji: "🚗", color: "bg-blue-500" },
  { value: "accommodation", label: "Unterkunft", icon: Home, emoji: "🏨", color: "bg-purple-500" },
  { value: "activities", label: "Aktivitäten", icon: Target, emoji: "🎯", color: "bg-pink-500" },
  { value: "food", label: "Essen", icon: Utensils, emoji: "🍔", color: "bg-orange-500" },
  { value: "drinks", label: "Getränke", icon: Beer, emoji: "🍻", color: "bg-yellow-500" },
  { value: "gifts", label: "Geschenke", icon: Gift, emoji: "🎁", color: "bg-green-500" },
  { value: "other", label: "Sonstiges", icon: Wallet, emoji: "💰", color: "bg-muted" },
];

export const AddExpenseDialog = ({
  open,
  onOpenChange,
  participants,
  currency,
  onAdd,
}: AddExpenseDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    paid_by: "",
  });

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.category || !formData.paid_by) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paid_by_participant_id: formData.paid_by,
      });
      setFormData({ description: "", amount: "", category: "", paid_by: "" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("expenses.addExpense")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Category quick select */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">{t("expenses.category")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.slice(0, 4).map(cat => (
                <motion.button
                  key={cat.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    formData.category === cat.value
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-background/50 border-2 border-transparent hover:border-border"
                  }`}
                >
                  <span className="text-2xl block mb-1">{cat.emoji}</span>
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CATEGORIES.slice(4).map(cat => (
                <motion.button
                  key={cat.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    formData.category === cat.value
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-background/50 border-2 border-transparent hover:border-border"
                  }`}
                >
                  <span className="text-2xl block mb-1">{cat.emoji}</span>
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t("expenses.description")}</Label>
            <Input
              id="description"
              placeholder={t("expenses.descriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background/50 mt-1.5"
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">{t("expenses.amount")} ({currency})</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-background/50 pl-8 text-lg font-medium"
              />
            </div>
          </div>

          {/* Paid by */}
          <div>
            <Label>{t("expenses.paidBy")}</Label>
            <Select
              value={formData.paid_by}
              onValueChange={(v) => setFormData(prev => ({ ...prev, paid_by: v }))}
            >
              <SelectTrigger className="bg-background/50 mt-1.5">
                <SelectValue placeholder={t("expenses.selectPerson")} />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {p.name.charAt(0)}
                      </div>
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <GradientButton
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.description || !formData.amount || !formData.category || !formData.paid_by}
            icon={<Plus className="w-4 h-4" />}
          >
            {isSubmitting ? t("common.loading") : t("expenses.addExpense")}
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
