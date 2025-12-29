import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ListFilter, SortAsc, Calendar, Check, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterType = "all" | "paid" | "planned";
export type SortType = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category";

interface ExpenseFiltersProps {
  filter: FilterType;
  sort: SortType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  counts: {
    all: number;
    paid: number;
    planned: number;
  };
}

export const ExpenseFilters = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  counts,
}: ExpenseFiltersProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
    >
      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterType)} className="w-full sm:w-auto">
        <TabsList className="grid grid-cols-3 bg-background/50 w-full sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
            <ListFilter className="w-3.5 h-3.5" />
            {t("expenses.filterAll")}
            <span className="text-muted-foreground">({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-1.5 text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5" />
            {t("expenses.filterPaid")}
            <span className="text-muted-foreground">({counts.paid})</span>
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5" />
            {t("expenses.filterPlanned")}
            <span className="text-muted-foreground">({counts.planned})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sort select */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortType)}>
        <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-muted-foreground" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("expenses.sortDateDesc")}
            </div>
          </SelectItem>
          <SelectItem value="date-asc">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("expenses.sortDateAsc")}
            </div>
          </SelectItem>
          <SelectItem value="amount-desc">
            <div className="flex items-center gap-2">
              {t("expenses.sortAmountDesc")}
            </div>
          </SelectItem>
          <SelectItem value="amount-asc">
            <div className="flex items-center gap-2">
              {t("expenses.sortAmountAsc")}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </motion.div>
  );
};
