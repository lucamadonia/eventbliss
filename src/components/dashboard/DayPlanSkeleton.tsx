import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading component for AI Day Plan generation
 * Mirrors the structure of DayPlanCard for visual consistency
 */
export const DayPlanSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Intro Skeleton */}
      <GlassCard className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </GlassCard>

      {/* Day Cards Skeleton - 3 days */}
      {[1, 2, 3].map((dayNum) => (
        <GlassCard key={dayNum} className="p-0 overflow-hidden border-2 border-muted/30">
          {/* Day Header */}
          <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>

          {/* Time Period Sections */}
          <div className="p-4 space-y-4">
            {/* Morning/Evening Sections */}
            {['morning', 'evening'].map((period) => (
              <div
                key={period}
                className="rounded-lg border border-border/50 p-3 bg-muted/10"
              >
                {/* Period Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-20" />
                  <div className="ml-auto">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>

                {/* Time Blocks */}
                <div className="space-y-3">
                  {[1, 2].map((blockNum) => (
                    <div
                      key={blockNum}
                      className="bg-card/50 rounded-lg p-3 border border-border/30"
                    >
                      {/* Block Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-6 w-14 rounded" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </div>

                      {/* Block Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}

      {/* Tips Skeleton */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </GlassCard>
    </div>
  );
};
