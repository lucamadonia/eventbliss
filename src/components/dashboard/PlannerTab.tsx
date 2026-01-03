import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, addDays, isValid } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Loader2,
  ClipboardList,
  Filter,
  Download,
  FileText,
  CalendarDays,
  ChevronDown,
  LogIn,
  CalendarPlus,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ActivityCard } from "./ActivityCard";
import { ActivityForm } from "./ActivityForm";
import { VisualScheduleCalendar } from "./VisualScheduleCalendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG, CATEGORY_KEYS, type ActivityCategory } from "@/lib/category-config";
import { downloadICalFile } from "@/lib/ical-generator";
import { openPrintableAgenda } from "@/lib/pdf-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface PrefillTime {
  start: string;
  end: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface Activity {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  location_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  estimated_cost: number | null;
  currency: string;
  cost_per_person: boolean;
  requirements: string[] | null;
  notes: string | null;
  responsible_participant_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category: ActivityCategory;
}

interface Comment {
  id: string;
  activity_id: string;
  participant_id: string;
  content: string;
  created_at: string;
  participant_name?: string;
}

interface PlannerTabProps {
  event: {
    id: string;
    name: string;
    event_date: string | null;
    currency?: string;
  };
  participants: Participant[];
}

const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  es: es,
  fr: fr,
  it: it,
  nl: nl,
  pt: pt,
  pl: pl,
  tr: tr,
  ar: ar,
};

// Map activity category to expense category
const categoryToExpenseCategory: Record<string, string> = {
  activity: 'activities',
  food: 'food',
  transport: 'transport',
  accommodation: 'accommodation',
  party: 'drinks',
  sightseeing: 'activities',
  relaxation: 'activities',
  other: 'other',
};

export const PlannerTab = ({ event, participants }: PlannerTabProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => isMobile ? 'list' : 'calendar');
  const [prefillTime, setPrefillTime] = useState<PrefillTime | null>(null);

  const currentLocale = localeMap[i18n.language] || de;

  // Check authentication and participant status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Find participant linked to this user
        const participant = participants.find(p => p.id && participants.some(part => part.id));
        if (participant) {
          setCurrentParticipant(participant);
        }
      }
    };
    
    checkAuth();
  }, [participants]);

  // Generate dates based on event date, custom dates, or activities
  const getEventDates = () => {
    const allDates = new Set<string>();
    
    // Add event date ± 1 day if available
    if (event.event_date) {
      const baseDate = parseISO(event.event_date);
      if (isValid(baseDate)) {
        allDates.add(format(addDays(baseDate, -1), "yyyy-MM-dd"));
        allDates.add(format(baseDate, "yyyy-MM-dd"));
        allDates.add(format(addDays(baseDate, 1), "yyyy-MM-dd"));
      }
    }
    
    // Add dates from existing activities
    activities.forEach(a => {
      if (a.day_date) {
        allDates.add(a.day_date);
      }
    });
    
    // Add custom dates
    customDates.forEach(d => allDates.add(d));
    
    // If no dates at all, use today
    if (allDates.size === 0) {
      const today = new Date();
      allDates.add(format(today, "yyyy-MM-dd"));
    }
    
    return Array.from(allDates).sort();
  };

  const eventDates = getEventDates();

  useEffect(() => {
    if (!selectedDate && eventDates.length > 0) {
      // Prefer event date, then first date
      if (event.event_date && eventDates.includes(event.event_date)) {
        setSelectedDate(event.event_date);
      } else {
        setSelectedDate(eventDates[0]);
      }
    }
  }, [eventDates, event.event_date]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("schedule_activities")
        .select("*")
        .eq("event_id", event.id)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setActivities((data || []) as Activity[]);

      // Fetch comments for all activities
      if (data && data.length > 0) {
        const activityIds = data.map(a => a.id);
        const { data: commentsData, error: commentsError } = await supabase
          .from("activity_comments")
          .select("*")
          .in("activity_id", activityIds)
          .order("created_at", { ascending: true });

        if (!commentsError && commentsData) {
          const commentsByActivity: Record<string, Comment[]> = {};
          commentsData.forEach(comment => {
            if (!commentsByActivity[comment.activity_id]) {
              commentsByActivity[comment.activity_id] = [];
            }
            const participant = participants.find(p => p.id === comment.participant_id);
            commentsByActivity[comment.activity_id].push({
              ...comment,
              participant_name: participant?.name || t('common.unknown'),
            });
          });
          setComments(commentsByActivity);
        }
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: t('common.error'),
        description: t('planner.loadError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [event.id]);

  const handleSaveActivity = async (activityData: Partial<Activity>) => {
    // Check authentication before saving
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('planner.authRequired'),
        description: t('planner.loginToAdd'),
        variant: "destructive",
      });
      return;
    }

    try {
      let savedActivityId: string | null = null;
      
      if (editingActivity) {
        const { error } = await supabase
          .from("schedule_activities")
          .update(activityData)
          .eq("id", editingActivity.id);

        if (error) throw error;
        savedActivityId = editingActivity.id;
        toast({ title: t('common.success'), description: t('planner.activityUpdated') });
      } else {
        const { data: insertedData, error } = await supabase
          .from("schedule_activities")
          .insert([{ ...activityData, event_id: event.id } as any])
          .select()
          .single();

        if (error) throw error;
        savedActivityId = insertedData?.id;
        toast({ title: t('common.success'), description: t('planner.activityCreated') });
        
        // Sync cost to expenses if cost is set
        if (activityData.estimated_cost && activityData.estimated_cost > 0 && savedActivityId) {
          const expenseCategory = categoryToExpenseCategory[activityData.category || 'other'] || 'other';
          
          await supabase
            .from("expenses")
            .insert([{
              event_id: event.id,
              description: `${t('planner.activity')}: ${activityData.title}`,
              amount: activityData.estimated_cost,
              category: expenseCategory as any,
              currency: activityData.currency || event.currency || 'EUR',
              expense_date: activityData.day_date,
            }]);
        }
      }

      setShowForm(false);
      setEditingActivity(null);
      fetchActivities();
    } catch (error: any) {
      console.error("Error saving activity:", error);
      
      // Check if it's an RLS error
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        toast({
          title: t('planner.authRequired'),
          description: t('planner.loginToAdd'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('planner.saveError'),
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from("schedule_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
      toast({ title: t('common.success'), description: t('planner.activityDeleted') });
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: t('common.error'),
        description: t('planner.deleteError'),
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (activityId: string, content: string, participantId: string) => {
    try {
      const { error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activityId,
          participant_id: participantId,
          content,
        });

      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: t('common.error'),
        description: t('planner.commentError'),
        variant: "destructive",
      });
    }
  };

  const handleAddDate = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      if (!customDates.includes(dateStr) && !eventDates.includes(dateStr)) {
        setCustomDates([...customDates, dateStr]);
        setSelectedDate(dateStr);
      } else {
        setSelectedDate(dateStr);
      }
    }
  };

  const handleExportIcal = () => {
    downloadICalFile(activities, { name: event.name, id: event.id });
    toast({ title: t('common.success'), description: t('planner.export.icalDownloaded') });
  };

  const handleExportPdf = () => {
    openPrintableAgenda(activities, { name: event.name, id: event.id, event_date: event.event_date }, i18n.language);
  };

  const activitiesForDate = selectedDate
    ? activities.filter(a => {
        const dateMatch = a.day_date === selectedDate;
        const categoryMatch = selectedCategory === 'all' || a.category === selectedCategory;
        return dateMatch && categoryMatch;
      })
    : [];

  const allActivitiesForDate = selectedDate
    ? activities.filter(a => a.day_date === selectedDate)
    : [];

  const totalCostForDate = allActivitiesForDate.reduce((sum, a) => {
    return sum + (a.estimated_cost || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show auth warning if not authenticated
  if (isAuthenticated === false) {
    return (
      <GlassCard className="p-8 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-2">{t('planner.authRequired')}</h3>
        <p className="text-muted-foreground mb-4">{t('planner.loginToAdd')}</p>
        <GradientButton onClick={() => navigate('/auth')}>
          {t('auth.login')}
        </GradientButton>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            {t('planner.title')}
          </h2>
          <p className="text-muted-foreground">{t('planner.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm transition-colors",
                viewMode === 'list'
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">{t('planner.viewMode.list')}</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm transition-colors",
                viewMode === 'calendar'
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('planner.viewMode.calendar')}</span>
            </button>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t('planner.export.title')}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="w-4 h-4 mr-2" />
                {t('planner.export.pdf')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportIcal}>
                <CalendarDays className="w-4 h-4 mr-2" />
                {t('planner.export.ical')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <GradientButton
            onClick={() => {
              setEditingActivity(null);
              setShowForm(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            {t('planner.addActivity')}
          </GradientButton>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <VisualScheduleCalendar
          activities={activities}
          eventDates={eventDates}
          participants={participants}
          currency={event.currency || 'EUR'}
          onActivityClick={(activity) => {
            const fullActivity = activities.find(a => a.id === activity.id);
            if (fullActivity) {
              setEditingActivity(fullActivity);
              setShowForm(true);
            }
          }}
          onTimeSlotClick={(date, timeData) => {
            setSelectedDate(date);
            // Parse time data (format: "HH:MM|HH:MM" for start|end)
            if (timeData.includes('|')) {
              const [start, end] = timeData.split('|');
              setPrefillTime({ start, end });
            } else {
              setPrefillTime({ start: timeData, end: "" });
            }
            setEditingActivity(null);
            setShowForm(true);
          }}
          onActivityMove={async (activityId, newDate, newStartTime, newEndTime) => {
            try {
              const { error } = await supabase
                .from("schedule_activities")
                .update({
                  day_date: newDate,
                  start_time: newStartTime,
                  end_time: newEndTime,
                })
                .eq("id", activityId);

              if (error) throw error;
              
              // Update local state
              setActivities(prev => prev.map(a => 
                a.id === activityId 
                  ? { ...a, day_date: newDate, start_time: newStartTime, end_time: newEndTime }
                  : a
              ));
              
              toast({ title: t('common.success'), description: t('planner.activityUpdated') });
            } catch (error) {
              console.error("Error moving activity:", error);
              toast({
                title: t('common.error'),
                description: t('planner.saveError'),
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => setSelectedCategory('all')}
            >
              {t('planner.categories.all')}
            </Badge>
            {CATEGORY_KEYS.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = allActivitiesForDate.filter(a => a.category === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedCategory === cat ? '' : `${config.bgClass} ${config.borderClass}`
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="mr-1">{config.emoji}</span>
                  {t(`planner.categories.${cat}`)}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </Badge>
              );
            })}
          </div>

          {/* Date Navigation with Add Date Button */}
          <div className="flex gap-2 overflow-x-auto pb-2 items-center">
            {eventDates.map((date) => {
              const dateObj = parseISO(date);
              const isSelected = date === selectedDate;
              const activityCount = activities.filter(a => a.day_date === date).length;
              const isEventDate = date === event.event_date;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-primary/20 border-primary text-foreground"
                      : "border-border/50 hover:border-primary/50"
                  } ${isEventDate ? "ring-2 ring-primary/30" : ""}`}
                >
                  <div className="text-sm font-medium flex items-center gap-1">
                    {format(dateObj, "EEEE", { locale: currentLocale })}
                    {isEventDate && <span className="text-primary">★</span>}
                  </div>
                  <div className="text-lg font-bold">
                    {format(dateObj, "d. MMM", { locale: currentLocale })}
                  </div>
                  {activityCount > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {activityCount} {activityCount === 1 ? t('planner.activity') : t('planner.activities')}
                    </div>
                  )}
                </button>
              );
            })}
            
            {/* Add Date Button */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex-shrink-0 px-4 py-3 rounded-xl border border-dashed border-border/50 hover:border-primary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <CalendarPlus className="w-5 h-5" />
                  <span className="text-sm">{t('planner.addDate')}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  onSelect={handleAddDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Activities for Selected Date */}
          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {activitiesForDate.length === 0 ? (
                  <GlassCard className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">{t('planner.noActivities')}</h3>
                    <p className="text-muted-foreground mb-4">{t('planner.noActivitiesHint')}</p>
                    <GradientButton
                      size="sm"
                      onClick={() => {
                        setEditingActivity(null);
                        setShowForm(true);
                      }}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      {t('planner.addFirst')}
                    </GradientButton>
                  </GlassCard>
                ) : (
                  <>
                    {activitiesForDate.map((activity, index) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        participants={participants}
                        comments={comments[activity.id] || []}
                        onEdit={() => {
                          setEditingActivity(activity);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDeleteActivity(activity.id)}
                        onAddComment={(content, participantId) =>
                          handleAddComment(activity.id, content, participantId)
                        }
                        index={index}
                      />
                    ))}

                    {/* Daily Summary */}
                    <GlassCard className="p-4 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {t('planner.totalForDay')}
                        </span>
                        <span className="font-bold text-lg">
                          {totalCostForDate.toFixed(2)} €
                        </span>
                      </div>
                    </GlassCard>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Activity Form Modal - key ensures form resets with new defaults */}
      <ActivityForm
        key={showForm ? `form-${selectedDate}-${prefillTime?.start || 'no-start'}-${prefillTime?.end || 'no-end'}-${editingActivity?.id || 'new'}` : 'closed'}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingActivity(null);
          setPrefillTime(null);
        }}
        onSave={handleSaveActivity}
        activity={editingActivity}
        participants={participants}
        defaultDate={selectedDate || eventDates[0]}
        defaultStartTime={prefillTime?.start}
        defaultEndTime={prefillTime?.end}
      />
    </div>
  );
};
