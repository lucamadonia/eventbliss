import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({ 
  className, 
  lines = 3, 
  showAvatar = false,
  showActions = false 
}: SkeletonCardProps) {
  return (
    <GlassCard className={cn("p-4 space-y-4", className)}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        )}
      </div>
      
      {lines > 0 && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                "h-4",
                i === lines - 1 ? "w-2/3" : "w-full"
              )} 
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export function SkeletonCardGrid({ count = 3, ...props }: SkeletonCardProps & { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...props} />
      ))}
    </div>
  );
}
