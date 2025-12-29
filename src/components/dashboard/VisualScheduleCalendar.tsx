import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
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
  onTimeSlotClick: (date: string, time: string) => void;
  onActivityMove: (activityId: string, newDate: string, newStartTime: string, newEndTime: string) => void;
}

const localeMap: Record<string, Locale> = {
  de, en: enUS, es, fr, it, nl, pt, pl, tr, ar,
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 - 23:00
const HOUR_HEIGHT = 60; // pixels per hour
const MIN_SLOT_HEIGHT = 30; // minimum activity block height
const SNAP_INTERVAL = 15; // snap to 15-minute intervals

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
  
  const [visibleDaysCount, setVisibleDaysCount] = useState(5);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [dragState, setDragState] = useState<{
    activityId: string;
    startY: number;
    startX: number;
    originalDate: string;
    originalStartTime: string;
    originalEndTime: string;
    currentY: number;
    currentX: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    activityId: string;
    startY: number;
    originalEndTime: string;
    currentY: number;
  } | null>(null);
  const [createDragState, setCreateDragState] = useState<{
    date: string;
    startY: number;
    currentY: number;
    columnRect: DOMRect;
  } | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const visibleDates = eventDates.slice(visibleStartIndex, visibleStartIndex + visibleDaysCount);
  const canGoBack = visibleStartIndex > 0;
  const canGoForward = visibleStartIndex + visibleDaysCount < eventDates.length;

  // Parse time string to hour decimal (e.g., "14:30" -> 14.5)
  const timeToDecimal = (time: string | null): number => {
    if (!time) return 9; // default 9:00
    const [hours, minutes] = time.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  };

  // Convert decimal to time string with snapping
  const decimalToTime = (decimal: number, snap = true): string => {
    let hours = Math.floor(decimal);
    let minutes = (decimal - hours) * 60;
    if (snap) {
      minutes = Math.round(minutes / SNAP_INTERVAL) * SNAP_INTERVAL;
      if (minutes >= 60) {
        hours += 1;
        minutes = 0;
      }
    }
    return `${hours.toString().padStart(2, "0")}:${Math.round(minutes).toString().padStart(2, "0")}`;
  };

  // Calculate Y position to time decimal
  const yToTimeDecimal = (y: number): number => {
    return 7 + y / HOUR_HEIGHT;
  };

  // Get activity position and size
  const getActivityStyle = (activity: Activity, isBeingDragged = false, isBeingResized = false) => {
    let startDecimal = timeToDecimal(activity.start_time);
    let endDecimal = timeToDecimal(activity.end_time) || startDecimal + 1;
    
    // Apply drag offset
    if (isBeingDragged && dragState && dragState.activityId === activity.id) {
      const deltaY = dragState.currentY - dragState.startY;
      const deltaHours = deltaY / HOUR_HEIGHT;
      startDecimal = timeToDecimal(dragState.originalStartTime) + deltaHours;
      endDecimal = timeToDecimal(dragState.originalEndTime) + deltaHours;
      // Clamp
      if (startDecimal < 7) {
        const diff = 7 - startDecimal;
        startDecimal = 7;
        endDecimal += diff;
      }
      if (endDecimal > 23) {
        const diff = endDecimal - 23;
        endDecimal = 23;
        startDecimal -= diff;
      }
    }
    
    // Apply resize offset
    if (isBeingResized && resizeState && resizeState.activityId === activity.id) {
      const deltaY = resizeState.currentY - resizeState.startY;
      const deltaHours = deltaY / HOUR_HEIGHT;
      endDecimal = Math.max(
        timeToDecimal(activity.start_time) + 0.25,
        Math.min(timeToDecimal(resizeState.originalEndTime) + deltaHours, 23)
      );
    }
    
    const duration = Math.max(endDecimal - startDecimal, 0.25);
    const top = (startDecimal - 7) * HOUR_HEIGHT;
    const height = Math.max(duration * HOUR_HEIGHT, MIN_SLOT_HEIGHT);
    
    return { top, height, startDecimal, endDecimal };
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: string) => {
    return activities.filter(a => a.day_date === date);
  };

  // Determine which date column the pointer is over
  const getDateFromX = (clientX: number): string | null => {
    for (const [date, ref] of Object.entries(columnRefs.current)) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          return date;
        }
      }
    }
    return null;
  };

  // Handle drag start
  const handleDragStart = (e: React.PointerEvent, activity: Activity) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setDragState({
      activityId: activity.id,
      startY: e.clientY,
      startX: e.clientX,
      originalDate: activity.day_date,
      originalStartTime: activity.start_time || "09:00",
      originalEndTime: activity.end_time || "10:00",
      currentY: e.clientY,
      currentX: e.clientX,
    });
  };

  // Handle resize start
  const handleResizeStart = (e: React.PointerEvent, activity: Activity) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setResizeState({
      activityId: activity.id,
      startY: e.clientY,
      originalEndTime: activity.end_time || "10:00",
      currentY: e.clientY,
    });
  };

  // Handle create-drag start on empty slot
  const handleSlotPointerDown = (e: React.PointerEvent, date: string) => {
    e.preventDefault();
    const column = columnRefs.current[date];
    if (!column) return;
    
    const rect = column.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    
    setCreateDragState({
      date,
      startY: relY,
      currentY: relY,
      columnRect: rect,
    });
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Pointer move handler
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragState) {
      setDragState(prev => prev ? { ...prev, currentY: e.clientY, currentX: e.clientX } : null);
    }
    if (resizeState) {
      setResizeState(prev => prev ? { ...prev, currentY: e.clientY } : null);
    }
    if (createDragState) {
      const relY = e.clientY - createDragState.columnRect.top;
      setCreateDragState(prev => prev ? { ...prev, currentY: relY } : null);
    }
  }, [dragState, resizeState, createDragState]);

  // Pointer up handler
  const handlePointerUp = useCallback((e: PointerEvent) => {
    // Finalize drag
    if (dragState) {
      const activity = activities.find(a => a.id === dragState.activityId);
      if (activity) {
        const deltaY = dragState.currentY - dragState.startY;
        const deltaHours = deltaY / HOUR_HEIGHT;
        
        let newStartDecimal = timeToDecimal(dragState.originalStartTime) + deltaHours;
        let newEndDecimal = timeToDecimal(dragState.originalEndTime) + deltaHours;
        
        // Clamp
        if (newStartDecimal < 7) {
          const diff = 7 - newStartDecimal;
          newStartDecimal = 7;
          newEndDecimal += diff;
        }
        if (newEndDecimal > 23) {
          const diff = newEndDecimal - 23;
          newEndDecimal = 23;
          newStartDecimal -= diff;
        }
        
        // Determine new date based on X position
        let newDate = getDateFromX(dragState.currentX) || dragState.originalDate;
        
        // Snap times
        const snappedStart = decimalToTime(Math.round(newStartDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
        const snappedEnd = decimalToTime(Math.round(newEndDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
        
        if (newDate !== activity.day_date || snappedStart !== activity.start_time || snappedEnd !== activity.end_time) {
          onActivityMove(activity.id, newDate, snappedStart, snappedEnd);
        }
      }
      setDragState(null);
    }
    
    // Finalize resize
    if (resizeState) {
      const activity = activities.find(a => a.id === resizeState.activityId);
      if (activity) {
        const deltaY = resizeState.currentY - resizeState.startY;
        const deltaHours = deltaY / HOUR_HEIGHT;
        let newEndDecimal = timeToDecimal(resizeState.originalEndTime) + deltaHours;
        newEndDecimal = Math.max(timeToDecimal(activity.start_time) + 0.25, Math.min(newEndDecimal, 23));
        
        const snappedEnd = decimalToTime(Math.round(newEndDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
        
        if (snappedEnd !== activity.end_time) {
          onActivityMove(activity.id, activity.day_date, activity.start_time || "09:00", snappedEnd);
        }
      }
      setResizeState(null);
    }
    
    // Finalize create-drag
    if (createDragState) {
      const startY = Math.min(createDragState.startY, createDragState.currentY);
      const endY = Math.max(createDragState.startY, createDragState.currentY);
      
      const startDecimal = yToTimeDecimal(startY);
      const endDecimal = yToTimeDecimal(endY);
      
      const snappedStart = decimalToTime(Math.round(startDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
      const duration = Math.max(0.25, endDecimal - startDecimal);
      const snappedEnd = decimalToTime(Math.round((startDecimal + duration) * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
      
      // Only trigger if dragged a meaningful distance
      if (Math.abs(createDragState.currentY - createDragState.startY) > 10) {
        onTimeSlotClick(createDragState.date, snappedStart + "|" + snappedEnd);
      }
      
      setCreateDragState(null);
    }
  }, [dragState, resizeState, createDragState, activities, onActivityMove, onTimeSlotClick]);

  // Attach global pointer listeners
  useEffect(() => {
    if (dragState || resizeState || createDragState) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [dragState, resizeState, createDragState, handlePointerMove, handlePointerUp]);

  // Handle click on time slot for precise time
  const handleSlotClick = (e: React.MouseEvent, date: string) => {
    // Don't trigger if we just finished a create-drag
    if (createDragState) return;
    
    const column = columnRefs.current[date];
    if (!column) return;
    
    const rect = column.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const clickedDecimal = yToTimeDecimal(relY);
    const snappedTime = decimalToTime(Math.round(clickedDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
    const endTime = decimalToTime(Math.round((clickedDecimal + 1) * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
    
    onTimeSlotClick(date, snappedTime + "|" + endTime);
  };

  // Get currently displayed start/end times for dragging activity
  const getDragPreviewTimes = () => {
    if (!dragState) return null;
    const activity = activities.find(a => a.id === dragState.activityId);
    if (!activity) return null;
    
    const deltaY = dragState.currentY - dragState.startY;
    const deltaHours = deltaY / HOUR_HEIGHT;
    let startDecimal = timeToDecimal(dragState.originalStartTime) + deltaHours;
    let endDecimal = timeToDecimal(dragState.originalEndTime) + deltaHours;
    
    if (startDecimal < 7) {
      const diff = 7 - startDecimal;
      startDecimal = 7;
      endDecimal += diff;
    }
    if (endDecimal > 23) {
      const diff = endDecimal - 23;
      endDecimal = 23;
      startDecimal -= diff;
    }
    
    return {
      start: decimalToTime(Math.round(startDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL)),
      end: decimalToTime(Math.round(endDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL)),
    };
  };

  // Get resize preview time
  const getResizePreviewTime = () => {
    if (!resizeState) return null;
    const activity = activities.find(a => a.id === resizeState.activityId);
    if (!activity) return null;
    
    const deltaY = resizeState.currentY - resizeState.startY;
    const deltaHours = deltaY / HOUR_HEIGHT;
    let endDecimal = timeToDecimal(resizeState.originalEndTime) + deltaHours;
    endDecimal = Math.max(timeToDecimal(activity.start_time) + 0.25, Math.min(endDecimal, 23));
    
    return decimalToTime(Math.round(endDecimal * (60 / SNAP_INTERVAL)) / (60 / SNAP_INTERVAL));
  };

  const dragPreview = getDragPreviewTimes();
  const resizePreview = getResizePreviewTime();

  return (
    <GlassCard className="p-4 overflow-hidden">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
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
            onClick={() => setVisibleStartIndex(Math.min(eventDates.length - visibleDaysCount, visibleStartIndex + 1))}
            disabled={!canGoForward}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Days Count Selector */}
        <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
          {[1, 3, 5, 7].map(count => (
            <button
              key={count}
              onClick={() => {
                setVisibleDaysCount(count);
                setVisibleStartIndex(Math.min(visibleStartIndex, Math.max(0, eventDates.length - count)));
              }}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                visibleDaysCount === count
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {count} {t('planner.calendar.days')}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={calendarRef}
        className="relative overflow-auto select-none"
        style={{ maxHeight: "calc(100vh - 320px)" }}
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
            <div 
              key={date} 
              ref={el => columnRefs.current[date] = el}
              className="relative border-r border-border/30 last:border-r-0"
              onPointerDown={(e) => {
                // Only start create-drag if clicking on empty space
                if ((e.target as HTMLElement).closest('[data-activity]')) return;
                handleSlotPointerDown(e, date);
              }}
              onClick={(e) => {
                // Only handle click if not dragging
                if ((e.target as HTMLElement).closest('[data-activity]')) return;
                if (Math.abs(createDragState?.currentY ?? 0 - (createDragState?.startY ?? 0)) > 10) return;
                handleSlotClick(e, date);
              }}
            >
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/20 hover:bg-primary/5 cursor-crosshair transition-colors"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              
              {/* Create drag preview */}
              {createDragState && createDragState.date === date && (
                <div 
                  className="absolute left-1 right-1 bg-primary/30 border-2 border-dashed border-primary rounded-lg pointer-events-none z-30"
                  style={{
                    top: Math.min(createDragState.startY, createDragState.currentY),
                    height: Math.max(Math.abs(createDragState.currentY - createDragState.startY), 20),
                  }}
                >
                  <div className="absolute -top-5 left-1 text-xs font-medium text-primary bg-background/80 px-1 rounded">
                    {decimalToTime(yToTimeDecimal(Math.min(createDragState.startY, createDragState.currentY)))} - 
                    {decimalToTime(yToTimeDecimal(Math.max(createDragState.startY, createDragState.currentY)))}
                  </div>
                </div>
              )}
              
              {/* Activity Blocks */}
              {getActivitiesForDate(date).map((activity) => {
                const isDragging = dragState?.activityId === activity.id;
                const isResizing = resizeState?.activityId === activity.id;
                const { top, height } = getActivityStyle(activity, isDragging, isResizing);
                const config = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.other;
                
                return (
                  <motion.div
                    key={activity.id}
                    data-activity={activity.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg p-2 cursor-grab overflow-hidden touch-none",
                      "border shadow-sm hover:shadow-md transition-shadow",
                      config.bgClass,
                      config.borderClass,
                      isDragging && "opacity-70 z-50 cursor-grabbing shadow-lg",
                      isResizing && "z-40"
                    )}
                    style={{ top, height: Math.max(height, MIN_SLOT_HEIGHT) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging && !isResizing) {
                        onActivityClick(activity);
                      }
                    }}
                    onPointerDown={(e) => handleDragStart(e, activity)}
                    initial={false}
                    animate={{ 
                      scale: isDragging ? 1.02 : 1,
                      boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"
                    }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-1 left-1 opacity-50 pointer-events-none">
                      <GripVertical className="w-3 h-3" />
                    </div>
                    
                    {/* Time Preview while dragging */}
                    {isDragging && dragPreview && (
                      <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium shadow-lg">
                          {dragPreview.start} - {dragPreview.end}
                        </span>
                      </div>
                    )}
                    
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
                              {activity.start_time}{activity.end_time && ` - ${activity.end_time}`}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {height >= 70 && activity.location && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}
                      
                      {height >= 85 && activity.estimated_cost && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Euro className="w-2.5 h-2.5" />
                          {activity.estimated_cost} {activity.currency}
                        </div>
                      )}
                    </div>
                    
                    {/* Resize Handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/30 rounded-b-lg flex items-center justify-center"
                      onPointerDown={(e) => handleResizeStart(e, activity)}
                    >
                      <div className="w-8 h-1 bg-current opacity-30 rounded-full" />
                    </div>
                    
                    {/* Resize Preview */}
                    {isResizing && resizePreview && (
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium shadow-lg">
                          {t('planner.calendar.endTime')}: {resizePreview}
                        </span>
                      </div>
                    )}
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
      
      {/* Help Text */}
      <div className="text-xs text-muted-foreground mt-2">
        {t('planner.calendar.helpText')}
      </div>
    </GlassCard>
  );
};
