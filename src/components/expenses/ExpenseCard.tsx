import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Car, 
  Home, 
  Target, 
  Utensils, 
  Beer, 
  Gift, 
  Wallet,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  paid_by_participant_id: string | null;
  created_at: string;
  expense_date: string | null;
  is_planned?: boolean;
  deleted_at?: string | null;
  deletion_reason?: string | null;
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onRestore?: (expense: Expense) => void;
  index?: number;
  isDeleted?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Car; color: string; bg: string }> = {
  transport: { icon: Car, color: "text-blue-400", bg: "bg-blue-500/15" },
  accommodation: { icon: Home, color: "text-purple-400", bg: "bg-purple-500/15" },
  activities: { icon: Target, color: "text-pink-400", bg: "bg-pink-500/15" },
  food: { icon: Utensils, color: "text-orange-400", bg: "bg-orange-500/15" },
  drinks: { icon: Beer, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  gifts: { icon: Gift, color: "text-green-400", bg: "bg-green-500/15" },
  other: { icon: Wallet, color: "text-muted-foreground", bg: "bg-muted/50" },
};

export const ExpenseCard = ({ expense, onEdit, onDelete, onRestore, index = 0, isDeleted = false }: ExpenseCardProps) => {
  const { t, i18n } = useTranslation();
  const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
  const IconComponent = config.icon;
  const locale = i18n.language === "de" ? de : enUS;

  const relativeTime = formatDistanceToNow(new Date(expense.created_at), {
    addSuffix: true,
    locale,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-background/40 ${
        expense.is_planned ? "opacity-70" : ""
      } ${isDeleted ? "opacity-50 bg-destructive/5 border border-destructive/20" : ""}`}
    >
      {/* Category Icon */}
      <div className={`shrink-0 p-3 rounded-xl ${config.bg} ${isDeleted ? "grayscale" : ""}`}>
        <IconComponent className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`font-medium truncate ${isDeleted ? "line-through text-muted-foreground" : ""}`}>
            {expense.description}
          </h4>
          {expense.is_planned && (
            <Badge variant="outline" className="shrink-0 text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
              <Calendar className="w-3 h-3 mr-1" />
              {t("expenses.planned")}
            </Badge>
          )}
          {isDeleted && (
            <Badge variant="outline" className="shrink-0 text-xs bg-destructive/10 text-destructive border-destructive/30">
              <Trash2 className="w-3 h-3 mr-1" />
              {t("common.delete")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{expense.paid_by}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {relativeTime}
          </span>
          {isDeleted && expense.deletion_reason && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs italic text-destructive/70">"{expense.deletion_reason}"</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`font-display font-bold text-lg ${expense.is_planned ? "text-orange-400" : isDeleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {expense.currency}{expense.amount.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {t(`expenses.categories.${expense.category}`)}
        </p>
      </div>

      {/* Actions */}
      {isDeleted && onRestore ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(expense)}
          className="shrink-0 border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          {t("expenses.restore")}
        </Button>
      ) : !expense.is_planned && (onEdit || onDelete) ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-background/60 transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="w-4 h-4 mr-2" />
                {t("common.edit")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </motion.div>
  );
};
