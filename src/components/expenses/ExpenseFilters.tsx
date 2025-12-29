import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ListFilter, SortAsc, Calendar, Check, Clock, Users, Layers, User } from "lucide-react";
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
export type GroupType = "none" | "person" | "category" | "date";

interface Participant {
  id: string;
  name: string;
}

interface ExpenseFiltersProps {
  filter: FilterType;
  sort: SortType;
  groupBy: GroupType;
  filterByPerson: string;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onGroupByChange: (group: GroupType) => void;
  onFilterByPersonChange: (personId: string) => void;
  participants: Participant[];
  counts: {
    all: number;
    paid: number;
    planned: number;
  };
}

export const ExpenseFilters = ({
  filter,
  sort,
  groupBy,
  filterByPerson,
  onFilterChange,
  onSortChange,
  onGroupByChange,
  onFilterByPersonChange,
  participants,
  counts,
}: ExpenseFiltersProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-4"
    >
      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterType)} className="w-full">
        <TabsList className="grid grid-cols-3 bg-background/50 w-full">
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

      {/* Second row: Sort, Group by, Filter by Person */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Sort select */}
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortType)}>
          <SelectTrigger className="flex-1 sm:max-w-[180px] bg-background/50">
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

        {/* Group by select */}
        <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupType)}>
          <SelectTrigger className="flex-1 sm:max-w-[180px] bg-background/50">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder={t("expenses.groupBy")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4" />
                {t("expenses.groupNone")}
              </div>
            </SelectItem>
            <SelectItem value="person">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("expenses.groupByPerson")}
              </div>
            </SelectItem>
            <SelectItem value="category">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {t("expenses.groupByCategory")}
              </div>
            </SelectItem>
            <SelectItem value="date">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("expenses.groupByDate")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by person select */}
        <Select value={filterByPerson} onValueChange={onFilterByPersonChange}>
          <SelectTrigger className="flex-1 sm:max-w-[180px] bg-background/50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder={t("expenses.filterByPerson")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("expenses.allPersons")}
              </div>
            </SelectItem>
            {participants.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {p.name.charAt(0)}
                  </div>
                  {p.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
};
