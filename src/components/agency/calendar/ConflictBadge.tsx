import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Conflict } from "@/hooks/useBookingConflicts";

interface Props {
  conflicts: Conflict[];
  size?: "sm" | "md";
  className?: string;
}

export function ConflictBadge({ conflicts, size = "sm", className }: Props) {
  if (conflicts.length === 0) return null;
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const wrap = size === "sm" ? "w-5 h-5" : "w-7 h-7";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={`Konflikte: ${conflicts.map((c) => c.message).join("; ")}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-red-500/15 border border-red-500/40 text-red-400 cursor-help",
              wrap,
              className,
            )}
          >
            <AlertTriangle className={cn(dim)} strokeWidth={2.5} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1.5">
            {conflicts.map((c, i) => (
              <div key={i} className="text-xs leading-relaxed">
                <span className="font-semibold text-red-300">⚠ </span>
                {c.message}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
