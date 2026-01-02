import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
}

export function SkeletonTable({ 
  columns = 4, 
  rows = 5, 
  className,
  showHeader = true 
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
      {/* Header */}
      {showHeader && (
        <div className="bg-muted/30 border-b border-border/50 p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={cn(
                  "h-4",
                  i === 0 ? "w-32" : "flex-1"
                )} 
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Rows */}
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="p-4 flex items-center gap-4 animate-pulse"
            style={{ 
              animationDelay: `${rowIndex * 100}ms`,
              animationDuration: '1.5s'
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex}
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-24" : "flex-1",
                  colIndex === columns - 1 ? "w-20" : ""
                )} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTableWithActions({ 
  columns = 4, 
  rows = 5,
  className 
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
      {/* Header with action buttons */}
      <div className="bg-muted/30 border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex gap-4 flex-1">
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                "h-4",
                i === 0 ? "w-32" : "flex-1"
              )} 
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="p-4 flex items-center gap-4"
          >
            {/* Avatar */}
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            
            {/* Content columns */}
            <div className="flex-1 flex items-center gap-4">
              {Array.from({ length: columns - 2 }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex}
                  className={cn(
                    "h-4",
                    colIndex === 0 ? "w-32" : "flex-1"
                  )} 
                />
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
