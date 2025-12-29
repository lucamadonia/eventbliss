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
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ActivityCard } from "./ActivityCard";
import { ActivityForm } from "./ActivityForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG, CATEGORY_KEYS, type ActivityCategory } from "@/lib/category-config";

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

export const PlannerTab = ({ event, participants }: PlannerTabProps) => {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');

  const currentLocale = localeMap[i18n.language] || de;

  // Generate dates based on event date or use a default range
  const getEventDates = () => {
    if (event.event_date) {
      const baseDate = parseISO(event.event_date);
      if (isValid(baseDate)) {
        return [
          addDays(baseDate, -1),
          baseDate,
          addDays(baseDate, 1),
        ].map(d => format(d, "yyyy-MM-dd"));
      }
    }
    // Default to today and next 2 days
    const today = new Date();
    return [
      today,
      addDays(today, 1),
      addDays(today, 2),
    ].map(d => format(d, "yyyy-MM-dd"));
  };

  const eventDates = getEventDates();

  useEffect(() => {
    if (!selectedDate && eventDates.length > 0) {
      setSelectedDate(eventDates[1] || eventDates[0]);
    }
  }, [eventDates]);

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
      setActivities(data || []);

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
    try {
      if (editingActivity) {
        const { error } = await supabase
          .from("schedule_activities")
          .update(activityData)
          .eq("id", editingActivity.id);

        if (error) throw error;
        toast({ title: t('common.success'), description: t('planner.activityUpdated') });
      } else {
        const { error } = await supabase
          .from("schedule_activities")
          .insert([{ ...activityData, event_id: event.id } as any]);

        if (error) throw error;
        toast({ title: t('common.success'), description: t('planner.activityCreated') });
      }

      setShowForm(false);
      setEditingActivity(null);
      fetchActivities();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: t('common.error'),
        description: t('planner.saveError'),
        variant: "destructive",
      });
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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
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

      {/* Date Navigation */}
        {eventDates.map((date) => {
          const dateObj = parseISO(date);
          const isSelected = date === selectedDate;
          const activityCount = activities.filter(a => a.day_date === date).length;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-primary/20 border-primary text-foreground"
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-medium">
                {format(dateObj, "EEEE", { locale: currentLocale })}
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

      {/* Activity Form Modal */}
      <ActivityForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        activity={editingActivity}
        participants={participants}
        defaultDate={selectedDate || eventDates[0]}
      />
    </div>
  );
};
