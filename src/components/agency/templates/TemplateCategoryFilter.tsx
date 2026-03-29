import { Search, Building2, Heart, PartyPopper, Cake, Presentation, Music, MoreHorizontal, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TemplateCategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<string, number>;
}

const categories = [
  { key: "all", label: "All", icon: LayoutGrid, color: "violet" },
  { key: "corporate", label: "Corporate", icon: Building2, color: "blue" },
  { key: "wedding", label: "Wedding", icon: Heart, color: "pink" },
  { key: "jga", label: "JGA", icon: PartyPopper, color: "violet" },
  { key: "birthday", label: "Birthday", icon: Cake, color: "amber" },
  { key: "conference", label: "Conference", icon: Presentation, color: "cyan" },
  { key: "festival", label: "Festival", icon: Music, color: "green" },
  { key: "other", label: "Other", icon: MoreHorizontal, color: "slate" },
] as const;

export function TemplateCategoryFilter({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  categoryCounts,
}: TemplateCategoryFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {categories.map(({ key, label, icon: Icon }) => {
            const isActive = activeCategory === key;
            const count = key === "all"
              ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
              : categoryCounts[key] ?? 0;

            return (
              <button
                key={key}
                onClick={() => onCategoryChange(key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  whitespace-nowrap transition-all cursor-pointer shrink-0
                  ${isActive
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/[0.06]"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`
                  ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative shrink-0 w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates..."
          className="pl-8 h-8 text-xs bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 rounded-full"
        />
      </div>
    </div>
  );
}
