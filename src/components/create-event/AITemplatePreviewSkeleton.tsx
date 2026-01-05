import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AITemplatePreviewSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Skeleton */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <Skeleton className="h-9 w-64 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <Skeleton className="h-5 w-24 mx-auto rounded-full" />
      </div>

      {/* Sections Grid Skeleton */}
      <ScrollArea className="h-[65vh] md:h-auto md:max-h-[70vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
          {/* Budget Section */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </GlassCard>

          {/* Destinations Section */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </GlassCard>

          {/* Duration Section */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </GlassCard>

          {/* Design Template Section */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </GlassCard>

          {/* Activities Section - Full Width */}
          <GlassCard className="md:col-span-2 xl:col-span-2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-8 w-32 rounded-full" />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Summary Section Skeleton */}
        <GlassCard className="mt-4 p-4 mr-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-12 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </ScrollArea>

      {/* Action Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-border/50">
        <Skeleton className="h-11 w-48 rounded-lg" />
        <Skeleton className="h-11 w-40 rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
    </motion.div>
  );
};
