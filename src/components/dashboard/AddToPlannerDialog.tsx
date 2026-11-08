import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type ParsedActivity, activityToScheduleData } from "@/lib/ai-response-parser";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/lib/category-config";

interface AddToPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ParsedActivity | null;
  eventId: string;
  defaultDate?: string;
  onSuccess?: () => void;
}

export const AddToPlannerDialog = ({
  open,
  onOpenChange,
  activity,
  eventId,
  defaultDate,
  onSuccess,
}: AddToPlannerDialogProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'de' ? de : enUS;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => defaultDate ? new Date(`${defaultDate.slice(0, 10)}T12:00:00`) : undefined);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    start_time: '',
    end_time: '',
    location: '',
    estimated_cost: '',
  });

  // Initialize form when activity changes
  useEffect(() => {
    if (activity) {
      const scheduleData = activityToScheduleData(activity);
      setFormData({
        title: scheduleData.title,
        description: scheduleData.description,
        category: scheduleData.category,
        start_time: activity.startTime || '',
        end_time: activity.endTime || '',
        location: '',
        estimated_cost: scheduleData.estimated_cost?.toString() || '',
      });
    }
  }, [activity]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error(t('dashboard.ai.selectDate', 'Bitte wähle ein Datum'));
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('schedule_activities')
        .insert({
          event_id: eventId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          day_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.location || null,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
          cost_per_person: true,
          notes: `${t('dashboard.ai.addedFromAI', 'Hinzugefügt von KI-Assistent')}`,
        });

      if (error) throw error;

      toast.success(t('dashboard.ai.activityAdded', 'Aktivität zum Planer hinzugefügt'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1rem)] max-w-[500px] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-h-[min(90dvh,820px)]">
        <DialogHeader className="shrink-0 border-b border-border px-5 pb-4 pt-6 text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{activity.emoji}</span>
            {t('dashboard.ai.addToPlanner', 'Zum Planer hinzufügen')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.ai.addToPlannerDesc', 'Füge diese Aktivität zu deinem Event-Plan hinzu')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('planner.form.title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>{t('dashboard.ai.selectDate', 'Datum wählen')} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale })
                  ) : (
                    <span className="text-muted-foreground">
                      {t('dashboard.ai.pickDate', 'Datum auswählen')}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[70] w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={locale}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="start_time">
                <Clock className="w-3 h-3 inline mr-1" />
                {t('planner.form.startTime')}
              </Label>
              <Input
                id="start_time"
                type="time"
                className="h-12 min-w-0 w-full text-center"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="end_time">{t('planner.form.endTime')} <span className="font-normal text-muted-foreground">({t('common.optional', 'optional')})</span></Label>
              <Input
                id="end_time"
                type="time"
                className="h-12 min-w-0 w-full text-center"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('planner.categories.title')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{t(`planner.categories.${key}`, key)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="w-3 h-3 inline mr-1" />
              {t('planner.form.location')}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={t('planner.form.locationPlaceholder')}
            />
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">
              <DollarSign className="w-3 h-3 inline mr-1" />
              {t('dashboard.ai.costPerPerson', 'Kosten pro Person')}
            </Label>
            <Input
              id="cost"
              type="number"
              value={formData.estimated_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('planner.form.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedDate}>
            {isLoading ? t('common.saving') : t('common.add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
