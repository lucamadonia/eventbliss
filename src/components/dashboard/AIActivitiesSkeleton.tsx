import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface AIActivitiesSkeletonProps {
  count?: number;
}

export const AIActivitiesSkeleton = ({ count = 5 }: AIActivitiesSkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header Skeleton */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 animate-pulse">
            <Sparkles className="h-5 w-5 text-primary/50" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </GlassCard>

      {/* Intro Skeleton */}
      <GlassCard className="p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </GlassCard>

      {/* Activity Card Skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
        >
          <GlassCard className="p-0 overflow-hidden">
            {/* Activity Header */}
            <div className="p-4 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent">
              <div className="flex items-center gap-4">
                {/* Activity Number Badge */}
                <Skeleton className="h-8 w-24 rounded-lg" />
                
                <div className="flex-1 space-y-2">
                  {/* Title */}
                  <Skeleton className="h-5 w-3/4" />
                  
                  {/* Meta info row */}
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                {/* Emoji placeholder */}
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>

            {/* Expandable content hint */}
            <div className="px-4 py-3 border-t border-border/30">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {/* Footer Actions Skeleton */}
      <GlassCard className="p-4">
        <div className="flex justify-end gap-3">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </GlassCard>
    </motion.div>
  );
};
