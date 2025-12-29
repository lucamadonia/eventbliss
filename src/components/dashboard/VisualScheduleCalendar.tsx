import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  GripVertical,
  Clock,
  MapPin,
  Euro,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/lib/category-config";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  estimated_cost: number | null;
  currency: string;
  category: ActivityCategory;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface VisualScheduleCalendarProps {
  activities: Activity[];
  eventDates: string[];
  participants: Participant[];
  currency: string;
  onActivityClick: (activity: Activity) => void;
  onTimeSlotClick: (date: string, hour: number) => void;
  onActivityMove: (activityId: string, newDate: string, newStartTime: string, newEndTime: string) => void;
}

const localeMap: Record<string, Locale> = {
  de, en: enUS, es, fr, it, nl, pt, pl, tr, ar,
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 - 23:00
const HOUR_HEIGHT = 60; // pixels per hour
const MIN_SLOT_HEIGHT = 30; // minimum activity block height

export const VisualScheduleCalendar = ({
  activities,
  eventDates,
  participants,
  currency,
  onActivityClick,
  onTimeSlotClick,
  onActivityMove,
}: VisualScheduleCalendarProps) => {
  const { t, i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || de;
  
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingActivity, setResizingActivity] = useState<string | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [originalEndTime, setOriginalEndTime] = useState<string | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Show 3 days at a time on desktop, 1 on mobile
  const visibleDays = 3;
  const visibleDates = eventDates.slice(visibleStartIndex, visibleStartIndex + visibleDays);
  
  const canGoBack = visibleStartIndex > 0;
  const canGoForward = visibleStartIndex + visibleDays < eventDates.length;

  // Parse time string to hour decimal (e.g., "14:30" -> 14.5)
  const timeToDecimal = (time: string | null): number => {
    if (!time) return 9; // default 9:00
    const [hours, minutes] = time.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  };

  // Convert decimal to time string
  const decimalToTime = (decimal: number): string => {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Get activity position and size
  const getActivityStyle = (activity: Activity) => {
    const startDecimal = timeToDecimal(activity.start_time);
    const endDecimal = timeToDecimal(activity.end_time) || startDecimal + 1;
    const duration = Math.max(endDecimal - startDecimal, 0.5);
    
    const top = (startDecimal - 7) * HOUR_HEIGHT;
    const height = Math.max(duration * HOUR_HEIGHT, MIN_SLOT_HEIGHT);
    
    return { top, height };
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: string) => {
    return activities.filter(a => a.day_date === date);
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, activity: Activity) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedActivity(activity);
  };

  // Handle drag end with new position
  const handleDragEnd = useCallback((e: MouseEvent) => {
    if (!draggedActivity || !calendarRef.current) {
      setDraggedActivity(null);
      return;
    }

    const rect = calendarRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Calculate which date column
    const columnWidth = rect.width / visibleDates.length;
    const dateIndex = Math.floor(relativeX / columnWidth);
    const newDate = visibleDates[dateIndex];
    
    // Calculate new time (accounting for header)
    const headerHeight = 60;
    const newStartDecimal = 7 + (relativeY - headerHeight - dragOffset.y) / HOUR_HEIGHT;
    const snappedStart = Math.round(newStartDecimal * 4) / 4; // Snap to 15-min intervals
    const clampedStart = Math.max(7, Math.min(snappedStart, 22));
    
    // Calculate duration
    const originalDuration = timeToDecimal(draggedActivity.end_time) - timeToDecimal(draggedActivity.start_time);
    const newEndDecimal = clampedStart + Math.max(originalDuration, 0.5);
    
    if (newDate && (newDate !== draggedActivity.day_date || decimalToTime(clampedStart) !== draggedActivity.start_time)) {
      onActivityMove(
        draggedActivity.id,
        newDate,
        decimalToTime(clampedStart),
        decimalToTime(Math.min(newEndDecimal, 23))
      );
    }
    
    setDraggedActivity(null);
  }, [draggedActivity, visibleDates, dragOffset, onActivityMove]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingActivity(activity.id);
    setResizeStartY(e.clientY);
    setOriginalEndTime(activity.end_time);
  };

  // Handle resize end
  const handleResizeEnd = useCallback((e: MouseEvent) => {
    if (!resizingActivity || !originalEndTime) {
      setResizingActivity(null);
      return;
    }

    const activity = activities.find(a => a.id === resizingActivity);
    if (!activity) {
      setResizingActivity(null);
      return;
    }

    const deltaY = e.clientY - resizeStartY;
    const deltaHours = deltaY / HOUR_HEIGHT;
    const originalEndDecimal = timeToDecimal(originalEndTime);
    const newEndDecimal = Math.round((originalEndDecimal + deltaHours) * 4) / 4;
    const clampedEnd = Math.max(timeToDecimal(activity.start_time) + 0.25, Math.min(newEndDecimal, 23));

    onActivityMove(
      activity.id,
      activity.day_date,
      activity.start_time || "09:00",
      decimalToTime(clampedEnd)
    );

    setResizingActivity(null);
    setOriginalEndTime(null);
  }, [resizingActivity, resizeStartY, originalEndTime, activities, onActivityMove]);

  // Global mouse event listeners for drag & resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Just update cursor position if dragging
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (draggedActivity) {
      handleDragEnd(e);
    }
    if (resizingActivity) {
      handleResizeEnd(e);
    }
  }, [draggedActivity, resizingActivity, handleDragEnd, handleResizeEnd]);

  // Attach global listeners
  useMemo(() => {
    if (draggedActivity || resizingActivity) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedActivity, resizingActivity, handleMouseMove, handleMouseUp]);

  return (
    <GlassCard className="p-4 overflow-hidden">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVisibleStartIndex(Math.max(0, visibleStartIndex - 1))}
          disabled={!canGoBack}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <h3 className="font-bold text-lg">
          {t('planner.calendar.weekView')}
        </h3>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVisibleStartIndex(Math.min(eventDates.length - visibleDays, visibleStartIndex + 1))}
          disabled={!canGoForward}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={calendarRef}
        className="relative overflow-auto"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        {/* Header Row with Dates */}
        <div className="grid sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50" 
             style={{ gridTemplateColumns: `60px repeat(${visibleDates.length}, 1fr)` }}>
          <div className="p-2 text-center text-xs text-muted-foreground border-r border-border/30">
            {t('planner.calendar.time')}
          </div>
          {visibleDates.map((date) => {
            const dateObj = parseISO(date);
            const dayActivities = getActivitiesForDate(date);
            const totalCost = dayActivities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
            
            return (
              <div key={date} className="p-3 text-center border-r border-border/30 last:border-r-0">
                <div className="text-sm font-medium text-muted-foreground">
                  {format(dateObj, "EEE", { locale: currentLocale })}
                </div>
                <div className="text-lg font-bold">
                  {format(dateObj, "d. MMM", { locale: currentLocale })}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <span>{dayActivities.length} {t('planner.calendar.items')}</span>
                  {totalCost > 0 && (
                    <>
                      <span>•</span>
                      <span>{totalCost.toFixed(0)} {currency}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div 
          className="grid relative"
          style={{ gridTemplateColumns: `60px repeat(${visibleDates.length}, 1fr)` }}
        >
          {/* Time Labels Column */}
          <div className="relative border-r border-border/30">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/20 text-right pr-2 text-xs text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Date Columns with Activities */}
          {visibleDates.map((date) => (
            <div key={date} className="relative border-r border-border/30 last:border-r-0">
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/20 hover:bg-primary/5 cursor-pointer transition-colors"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => onTimeSlotClick(date, hour)}
                />
              ))}
              
              {/* Activity Blocks */}
              {getActivitiesForDate(date).map((activity) => {
                const { top, height } = getActivityStyle(activity);
                const config = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.other;
                const isDragging = draggedActivity?.id === activity.id;
                const isResizing = resizingActivity === activity.id;
                
                return (
                  <motion.div
                    key={activity.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg p-2 cursor-grab active:cursor-grabbing overflow-hidden",
                      "border shadow-sm hover:shadow-md transition-shadow",
                      config.bgClass,
                      config.borderClass,
                      isDragging && "opacity-50 z-50",
                      isResizing && "z-40"
                    )}
                    style={{ top, height: Math.max(height, MIN_SLOT_HEIGHT) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivityClick(activity);
                    }}
                    onMouseDown={(e) => handleDragStart(e, activity)}
                    layoutId={activity.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-1 left-1 opacity-50">
                      <GripVertical className="w-3 h-3" />
                    </div>
                    
                    {/* Content */}
                    <div className="ml-4">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs">{config.emoji}</span>
                        <span className="font-medium text-xs truncate">{activity.title}</span>
                      </div>
                      
                      {height >= 50 && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {activity.start_time && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {activity.start_time}
                            </span>
                          )}
                          {activity.location && height >= 70 && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5" />
                              {activity.location}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {height >= 80 && activity.estimated_cost && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Euro className="w-2.5 h-2.5" />
                          {activity.estimated_cost} {activity.currency}
                        </div>
                      )}
                    </div>
                    
                    {/* Resize Handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 rounded-b-lg"
                      onMouseDown={(e) => handleResizeStart(e, activity)}
                    />
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
        <span className="text-xs text-muted-foreground mr-2">{t('planner.calendar.legend')}:</span>
        {Object.entries(CATEGORY_CONFIG).slice(0, 6).map(([key, config]) => (
          <div
            key={key}
            className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs", config.bgClass)}
          >
            <span>{config.emoji}</span>
            <span>{t(`planner.categories.${key}`)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};