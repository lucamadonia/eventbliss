import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ActionType = "created" | "updated" | "deleted" | "commented" | "assigned";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  entity?: string;
  type: ActionType;
  time: string;
  fullDate?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
}

const actionColors: Record<ActionType, string> = {
  created: "bg-emerald-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  commented: "bg-violet-500",
  assigned: "bg-cyan-500",
};

export function ActivityFeed({ items, maxItems = 6, onViewAll }: ActivityFeedProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const visible = items.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {visible.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl cursor-default transition-colors duration-200",
            hoveredIdx === i ? "bg-white/[0.06]" : "bg-transparent"
          )}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <div className="relative mt-1.5">
            <div className={cn("w-2 h-2 rounded-full", actionColors[item.type])} />
          </div>
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-300">
              {item.user
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-snug">
              <span className="font-medium text-slate-50">{item.user}</span>{" "}
              {item.action}
              {item.entity && (
                <span className="font-medium text-slate-50"> {item.entity}</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {hoveredIdx === i && item.fullDate ? item.fullDate : item.time}
            </p>
          </div>
        </motion.div>
      ))}

      {onViewAll && items.length > maxItems && (
        <button
          onClick={onViewAll}
          className="w-full text-center text-xs text-violet-400 hover:text-violet-300 py-2 transition-colors cursor-pointer"
        >
          Alle {items.length} Aktivitäten anzeigen
        </button>
      )}
    </div>
  );
}
