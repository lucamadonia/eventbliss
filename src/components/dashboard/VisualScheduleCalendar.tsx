import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, parseISO, addDays } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Clock,
  MapPin,
  Euro,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/lib/category-config";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
const HOUR_HEIGHT_MOBILE = 50; // smaller on mobile
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
  const isMobile = useIsMobile();
  
  // Auto-set to 1 day on mobile
  const [visibleDaysCount, setVisibleDaysCount] = useState(() => isMobile ? 1 : 5);
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
  
  // Extend dates to ensure we always have enough days to display
  const extendedDates = useMemo(() => {
    if (eventDates.length === 0) {
      // No dates at all - generate from today
      const today = new Date();
      return Array.from({ length: Math.max(visibleDaysCount, 7) }, (_, i) => 
        format(addDays(today, i), "yyyy-MM-dd")
      );
    }
    
    if (eventDates.length >= visibleDaysCount) {
      return eventDates;
    }
    
    // We have some dates but fewer than visibleDaysCount - extend the range
    const baseDateStr = eventDates[0];
    const baseDate = parseISO(baseDateStr);
    const allDates = new Set(eventDates);
    
    // Add days before and after to have enough
    for (let i = -3; i <= visibleDaysCount + 3; i++) {
      allDates.add(format(addDays(baseDate, i), "yyyy-MM-dd"));
    }
    
    return Array.from(allDates).sort();
  }, [eventDates, visibleDaysCount]);
  
  const visibleDates = extendedDates.slice(visibleStartIndex, visibleStartIndex + visibleDaysCount);
  const canGoBack = visibleStartIndex > 0;
  const canGoForward = visibleStartIndex + visibleDaysCount < extendedDates.length;

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

  // Calculate Y position to time decimal (use mobile height if applicable)
  const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
  
  const yToTimeDecimal = (y: number): number => {
    return 7 + y / hourHeight;
  };

  // Get activity position and size
  const getActivityStyle = (activity: Activity, isBeingDragged = false, isBeingResized = false) => {
    let startDecimal = timeToDecimal(activity.start_time);
    let endDecimal = timeToDecimal(activity.end_time) || startDecimal + 1;
    
    // Apply drag offset
    if (isBeingDragged && dragState && dragState.activityId === activity.id) {
      const deltaY = dragState.currentY - dragState.startY;
      const deltaHours = deltaY / hourHeight;
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
      const deltaHours = deltaY / hourHeight;
      endDecimal = Math.max(
        timeToDecimal(activity.start_time) + 0.25,
        Math.min(timeToDecimal(resizeState.originalEndTime) + deltaHours, 23)
      );
    }
    
    const duration = Math.max(endDecimal - startDecimal, 0.25);
    const top = (startDecimal - 7) * hourHeight;
    const height = Math.max(duration * hourHeight, MIN_SLOT_HEIGHT);
    
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
        const deltaHours = deltaY / hourHeight;
        
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
        const deltaHours = deltaY / hourHeight;
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
    <GlassCard className={cn("p-4 overflow-hidden", isMobile && "p-2")}>
      {/* Navigation Header */}
      <div className={cn(
        "flex items-center justify-between mb-4 gap-2",
        isMobile ? "flex-col items-stretch" : "flex-wrap"
      )}>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleStartIndex(Math.max(0, visibleStartIndex - 1))}
            disabled={!canGoBack}
            className={cn(isMobile && "h-10 w-10")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {isMobile ? (
            <div className="flex-1 text-center">
              <div className="font-bold text-base">
                {visibleDates[0] && format(parseISO(visibleDates[0]), "EEEE", { locale: currentLocale })}
              </div>
              <div className="text-sm text-muted-foreground">
                {visibleDates[0] && format(parseISO(visibleDates[0]), "d. MMMM", { locale: currentLocale })}
              </div>
            </div>
          ) : (
            <h3 className="font-bold text-lg">
              {t('planner.calendar.weekView')}
            </h3>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleStartIndex(Math.min(extendedDates.length - visibleDaysCount, visibleStartIndex + 1))}
            disabled={!canGoForward}
            className={cn(isMobile && "h-10 w-10")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Days Count Selector - Hidden on mobile, we use swipe navigation */}
        {!isMobile && (
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            {[1, 3, 5, 7].map(count => (
              <button
                key={count}
                onClick={() => {
                  setVisibleDaysCount(count);
                  setVisibleStartIndex(Math.min(visibleStartIndex, Math.max(0, extendedDates.length - count)));
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
        )}
        
        {/* Mobile: Activity count for the day */}
        {isMobile && visibleDates[0] && (
          <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 rounded-lg text-sm">
            <span className="text-muted-foreground">
              {getActivitiesForDate(visibleDates[0]).length} {t('planner.calendar.items')}
            </span>
            <span className="font-medium">
              {getActivitiesForDate(visibleDates[0]).reduce((sum, a) => sum + (a.estimated_cost || 0), 0).toFixed(0)} {currency}
            </span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div 
        ref={calendarRef}
        className="relative overflow-x-auto overflow-y-auto select-none"
        style={{ maxHeight: isMobile ? "calc(100vh - 380px)" : "calc(100vh - 320px)" }}
      >
        {/* Scrollable inner container with min-width */}
        <div style={{ minWidth: isMobile ? "100%" : `${60 + (visibleDaysCount * 140)}px` }}>
        {/* Header Row with Dates - Hidden on mobile since we show it in the navigation */}
        {!isMobile && (
          <div className="grid sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50" 
               style={{ gridTemplateColumns: `60px repeat(${visibleDates.length}, minmax(140px, 1fr))` }}>
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
        )}

        {/* Time Grid */}
        <div 
          className="grid relative"
          style={{ gridTemplateColumns: isMobile ? `40px 1fr` : `60px repeat(${visibleDates.length}, minmax(140px, 1fr))` }}
        >
          {/* Time Labels Column */}
          <div className="relative border-r border-border/30">
            {HOURS.map((hour, idx) => (
              <div
                key={hour}
                className="relative border-b border-border/20 text-right pr-1 text-xs text-muted-foreground"
                style={{ height: hourHeight }}
              >
                {/* On mobile, show every other hour to save space */}
                {(!isMobile || idx % 2 === 0) && (
                  <span className={cn("absolute right-1", isMobile ? "-top-1.5 text-[10px]" : "-top-2")}>
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                )}
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
                  className={cn(
                    "border-b border-border/20 transition-colors",
                    isMobile ? "active:bg-primary/10" : "hover:bg-primary/5 cursor-crosshair"
                  )}
                  style={{ height: hourHeight }}
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
                      "absolute left-1 right-1 rounded-lg overflow-hidden touch-none",
                      "border shadow-sm transition-shadow",
                      isMobile ? "p-1.5" : "p-2 cursor-grab hover:shadow-md",
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
                    onPointerDown={(e) => !isMobile && handleDragStart(e, activity)}
                    initial={false}
                    animate={{ 
                      scale: isDragging ? 1.02 : 1,
                      boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"
                    }}
                  >
                    {/* Drag Handle - Hidden on mobile */}
                    {!isMobile && (
                      <div className="absolute top-1 left-1 opacity-50 pointer-events-none">
                        <GripVertical className="w-3 h-3" />
                      </div>
                    )}
                    
                    {/* Time Preview while dragging */}
                    {isDragging && dragPreview && (
                      <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium shadow-lg">
                          {dragPreview.start} - {dragPreview.end}
                        </span>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className={cn(isMobile ? "ml-0" : "ml-4")}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={cn(isMobile ? "text-sm" : "text-xs")}>{config.emoji}</span>
                        <span className={cn("font-medium truncate", isMobile ? "text-sm" : "text-xs")}>{activity.title}</span>
                      </div>
                      
                      {height >= (isMobile ? 40 : 50) && (
                        <div className={cn("flex items-center gap-2 text-muted-foreground", isMobile ? "text-xs" : "text-[10px]")}>
                          {activity.start_time && (
                            <span className="flex items-center gap-0.5">
                              <Clock className={cn(isMobile ? "w-3 h-3" : "w-2.5 h-2.5")} />
                              {activity.start_time?.slice(0, 5)}{activity.end_time && ` - ${activity.end_time.slice(0, 5)}`}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {height >= (isMobile ? 55 : 70) && activity.location && (
                        <div className={cn("flex items-center gap-1 text-muted-foreground mt-0.5", isMobile ? "text-xs" : "text-[10px]")}>
                          <MapPin className={cn(isMobile ? "w-3 h-3" : "w-2.5 h-2.5", "flex-shrink-0")} />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}
                      
                      {height >= (isMobile ? 70 : 85) && activity.estimated_cost && (
                        <div className={cn("flex items-center gap-1 text-muted-foreground mt-0.5", isMobile ? "text-xs" : "text-[10px]")}>
                          <Euro className={cn(isMobile ? "w-3 h-3" : "w-2.5 h-2.5")} />
                          {activity.estimated_cost} {activity.currency}
                        </div>
                      )}
                    </div>
                    
                    {/* Resize Handle - Hidden on mobile */}
                    {!isMobile && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/30 rounded-b-lg flex items-center justify-center"
                        onPointerDown={(e) => handleResizeStart(e, activity)}
                      >
                        <div className="w-8 h-1 bg-current opacity-30 rounded-full" />
                      </div>
                    )}
                    
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
      </div>

      {/* Legend - Scrollable on mobile */}
      {isMobile ? (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border/30 overflow-x-auto pb-2">
          {Object.entries(CATEGORY_CONFIG).slice(0, 6).map(([key, config]) => (
            <div
              key={key}
              className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs flex-shrink-0", config.bgClass)}
            >
              <span>{config.emoji}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
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
          
          {/* Help Text - Hidden on mobile */}
          <div className="text-xs text-muted-foreground mt-2">
            {t('planner.calendar.helpText')}
          </div>
        </>
      )}

      {/* Mobile: Floating Add Button */}
      {isMobile && (
        <motion.button
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const currentDate = visibleDates[0];
            if (currentDate) {
              onTimeSlotClick(currentDate, "10:00|11:00");
            }
          }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </GlassCard>
  );
};
