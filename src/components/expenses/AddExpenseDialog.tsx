import { useState, useEffect } from "react";
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
  Users,
  Percent,
  Equal,
  UserMinus,
  Check,
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Participant {
  id: string;
  name: string;
}

interface SplitShare {
  participantId: string;
  amount: number;
  percentage: number;
  excluded: boolean;
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
    split_type: "equal" | "custom" | "percentage";
    splits?: { participant_id: string; amount: number }[];
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
  const [splitType, setSplitType] = useState<"equal" | "custom" | "percentage">("equal");
  const [splits, setSplits] = useState<SplitShare[]>([]);

  // Initialize splits when participants change or dialog opens
  useEffect(() => {
    if (open && participants.length > 0) {
      const amount = parseFloat(formData.amount) || 0;
      const activeCount = participants.length;
      const equalShare = activeCount > 0 ? amount / activeCount : 0;
      const equalPercentage = activeCount > 0 ? 100 / activeCount : 0;

      setSplits(
        participants.map((p) => ({
          participantId: p.id,
          amount: equalShare,
          percentage: equalPercentage,
          excluded: false,
        }))
      );
    }
  }, [open, participants]);

  // Recalculate splits when amount or split type changes
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const activeSplits = splits.filter((s) => !s.excluded);
    const activeCount = activeSplits.length;

    if (splitType === "equal" && activeCount > 0) {
      const equalShare = amount / activeCount;
      const equalPercentage = 100 / activeCount;
      setSplits((prev) =>
        prev.map((s) => ({
          ...s,
          amount: s.excluded ? 0 : equalShare,
          percentage: s.excluded ? 0 : equalPercentage,
        }))
      );
    }
  }, [formData.amount, splitType, splits.filter((s) => !s.excluded).length]);

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleSplitChange = (participantId: string, field: "amount" | "percentage", value: number) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.participantId === participantId
          ? {
              ...s,
              [field]: value,
              ...(field === "percentage" && {
                amount: ((parseFloat(formData.amount) || 0) * value) / 100,
              }),
              ...(field === "amount" && {
                percentage: formData.amount ? (value / parseFloat(formData.amount)) * 100 : 0,
              }),
            }
          : s
      )
    );
  };

  const handleExcludeToggle = (participantId: string) => {
    setSplits((prev) => {
      const newSplits = prev.map((s) =>
        s.participantId === participantId ? { ...s, excluded: !s.excluded } : s
      );

      // Recalculate for equal split
      if (splitType === "equal") {
        const amount = parseFloat(formData.amount) || 0;
        const activeCount = newSplits.filter((s) => !s.excluded).length;
        const equalShare = activeCount > 0 ? amount / activeCount : 0;
        const equalPercentage = activeCount > 0 ? 100 / activeCount : 0;

        return newSplits.map((s) => ({
          ...s,
          amount: s.excluded ? 0 : equalShare,
          percentage: s.excluded ? 0 : equalPercentage,
        }));
      }

      return newSplits;
    });
  };

  const getTotalPercentage = () => {
    return splits.filter((s) => !s.excluded).reduce((sum, s) => sum + s.percentage, 0);
  };

  const getTotalCustomAmount = () => {
    return splits.filter((s) => !s.excluded).reduce((sum, s) => sum + s.amount, 0);
  };

  const isValidSplit = () => {
    if (splitType === "percentage") {
      const total = getTotalPercentage();
      return Math.abs(total - 100) < 0.01;
    }
    if (splitType === "custom") {
      const total = getTotalCustomAmount();
      const amount = parseFloat(formData.amount) || 0;
      return Math.abs(total - amount) < 0.01;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.category || !formData.paid_by) {
      return;
    }

    if (!isValidSplit()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const activeSplits = splits
        .filter((s) => !s.excluded)
        .map((s) => ({
          participant_id: s.participantId,
          amount: s.amount,
        }));

      await onAdd({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paid_by_participant_id: formData.paid_by,
        split_type: splitType,
        splits: activeSplits,
      });
      setFormData({ description: "", amount: "", category: "", paid_by: "" });
      setSplitType("equal");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSplitCount = splits.filter((s) => !s.excluded).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("expenses.addExpense")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Category quick select */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">{t("expenses.category")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.slice(0, 4).map((cat) => (
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
                  <span className="text-xs text-muted-foreground">{t(`expenses.categories.${cat.value}`)}</span>
                </motion.button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CATEGORIES.slice(4).map((cat) => (
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
                  <span className="text-xs text-muted-foreground">{t(`expenses.categories.${cat.value}`)}</span>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="bg-background/50 mt-1.5"
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">
              {t("expenses.amount")} ({currency})
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="bg-background/50 pl-12 text-lg font-medium"
              />
            </div>
          </div>

          {/* Paid by */}
          <div>
            <Label>{t("expenses.paidBy")}</Label>
            <Select
              value={formData.paid_by}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, paid_by: v }))}
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

          {/* Split Type */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("expenses.splitTitle")}
            </Label>
            <RadioGroup
              value={splitType}
              onValueChange={(v) => setSplitType(v as "equal" | "custom" | "percentage")}
              className="grid grid-cols-3 gap-2"
            >
              <Label
                htmlFor="split-equal"
                className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  splitType === "equal"
                    ? "bg-primary/20 border-primary"
                    : "bg-background/50 border-transparent hover:border-border"
                }`}
              >
                <RadioGroupItem value="equal" id="split-equal" className="sr-only" />
                <Equal className="w-5 h-5" />
                <span className="text-xs font-medium">{t("expenses.splitEqual")}</span>
              </Label>
              <Label
                htmlFor="split-custom"
                className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  splitType === "custom"
                    ? "bg-primary/20 border-primary"
                    : "bg-background/50 border-transparent hover:border-border"
                }`}
              >
                <RadioGroupItem value="custom" id="split-custom" className="sr-only" />
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-medium">{t("expenses.splitCustom")}</span>
              </Label>
              <Label
                htmlFor="split-percentage"
                className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  splitType === "percentage"
                    ? "bg-primary/20 border-primary"
                    : "bg-background/50 border-transparent hover:border-border"
                }`}
              >
                <RadioGroupItem value="percentage" id="split-percentage" className="sr-only" />
                <Percent className="w-5 h-5" />
                <span className="text-xs font-medium">{t("expenses.splitPercentage")}</span>
              </Label>
            </RadioGroup>

            {/* Split Details */}
            <AnimatePresence mode="wait">
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2"
                >
                  {splitType === "equal" && (
                    <div className="text-sm text-muted-foreground text-center p-2 bg-background/50 rounded-lg">
                      {currency} {(parseFloat(formData.amount) / activeSplitCount).toFixed(2)} {t("expenses.amountPerPerson")} ({activeSplitCount} {t("common.people")})
                    </div>
                  )}

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {splits.map((split) => {
                      const participant = participants.find((p) => p.id === split.participantId);
                      if (!participant) return null;

                      return (
                        <motion.div
                          key={split.participantId}
                          layout
                          className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                            split.excluded ? "opacity-50 bg-muted/30" : "bg-background/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleExcludeToggle(split.participantId)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              split.excluded
                                ? "border-muted bg-muted"
                                : "border-primary bg-primary text-primary-foreground"
                            }`}
                          >
                            {!split.excluded && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {participant.name.charAt(0)}
                          </div>
                          <span className="flex-1 text-sm truncate">{participant.name}</span>

                          {!split.excluded && splitType !== "equal" && (
                            <div className="flex items-center gap-2">
                              {splitType === "custom" && (
                                <div className="relative w-24">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    {currency}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={split.amount.toFixed(2)}
                                    onChange={(e) =>
                                      handleSplitChange(split.participantId, "amount", parseFloat(e.target.value) || 0)
                                    }
                                    className="h-8 text-xs pl-10 pr-1"
                                  />
                                </div>
                              )}
                              {splitType === "percentage" && (
                                <div className="relative w-16">
                                  <Input
                                    type="number"
                                    step="1"
                                    value={Math.round(split.percentage)}
                                    onChange={(e) =>
                                      handleSplitChange(
                                        split.participantId,
                                        "percentage",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 text-xs pr-5"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {!split.excluded && splitType === "equal" && (
                            <span className="text-sm text-muted-foreground">
                              {currency}
                              {split.amount.toFixed(2)}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Validation feedback */}
                  {splitType === "percentage" && (
                    <div
                      className={`text-xs text-center p-2 rounded-lg ${
                        Math.abs(getTotalPercentage() - 100) < 0.01
                          ? "bg-green-500/20 text-green-600"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {t("expenses.totalPercentage")}: {getTotalPercentage().toFixed(0)}%
                    </div>
                  )}
                  {splitType === "custom" && (
                    <div
                      className={`text-xs text-center p-2 rounded-lg ${
                        Math.abs(getTotalCustomAmount() - (parseFloat(formData.amount) || 0)) < 0.01
                          ? "bg-green-500/20 text-green-600"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {t("expenses.totalCustom")}: {currency}
                      {getTotalCustomAmount().toFixed(2)} / {currency}
                      {parseFloat(formData.amount).toFixed(2)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <GradientButton
            className="w-full"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.description ||
              !formData.amount ||
              !formData.category ||
              !formData.paid_by ||
              !isValidSplit()
            }
            icon={<Plus className="w-4 h-4" />}
          >
            {isSubmitting ? t("common.loading") : t("expenses.addExpense")}
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
