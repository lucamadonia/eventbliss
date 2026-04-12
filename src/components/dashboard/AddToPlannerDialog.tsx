import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Clock, MapPin, DollarSign, ShoppingBag, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

// Mock marketplace service matches based on activity category
const MARKETPLACE_MATCHES: Record<string, { slug: string; title: string; agency: string; price: number; rating: number; }[]> = {
  activity: [
    { slug: "cocktail-workshop-berlin", title: "Cocktail Workshop Berlin", agency: "Berlin Events GmbH", price: 3900, rating: 4.8 },
    { slug: "escape-room-adventure", title: "Escape Room Adventure", agency: "Fun Factory Munich", price: 2500, rating: 4.6 },
  ],
  food: [
    { slug: "wine-tasting-premium", title: "Wine Tasting Premium", agency: "Gourmet Events", price: 4900, rating: 4.9 },
    { slug: "private-chef-dinner", title: "Private Chef Dinner", agency: "Gourmet Events", price: 8900, rating: 5.0 },
  ],
  party: [
    { slug: "dj-party-paket", title: "DJ & Party Paket", agency: "Berlin Events GmbH", price: 59900, rating: 4.5 },
    { slug: "cocktail-workshop-berlin", title: "Cocktail Workshop Berlin", agency: "Berlin Events GmbH", price: 3900, rating: 4.8 },
  ],
  relaxation: [
    { slug: "yoga-retreat-gruppe", title: "Yoga & Wellness Retreat", agency: "Zen Space Munich", price: 2900, rating: 4.4 },
  ],
  sightseeing: [
    { slug: "graffiti-workshop", title: "Graffiti & Street Art", agency: "Urban Arts Cologne", price: 3500, rating: 4.7 },
  ],
  other: [
    { slug: "go-kart-racing", title: "Go-Kart Racing", agency: "Speed Events", price: 3200, rating: 4.7 },
  ],
};

function getMarketplaceMatches(category: string) {
  return MARKETPLACE_MATCHES[category] || MARKETPLACE_MATCHES["other"] || [];
}

interface AddToPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ParsedActivity | null;
  eventId: string;
  onSuccess?: () => void;
}

export const AddToPlannerDialog = ({
  open,
  onOpenChange,
  activity,
  eventId,
  onSuccess,
}: AddToPlannerDialogProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'de' ? de : enUS;
  const navigate = useNavigate();
  const matches = activity ? getMarketplaceMatches(formData.category) : [];

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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
  useState(() => {
    if (activity) {
      const scheduleData = activityToScheduleData(activity);
      setFormData({
        title: scheduleData.title,
        description: scheduleData.description,
        category: scheduleData.category,
        start_time: '',
        end_time: '',
        location: '',
        estimated_cost: scheduleData.estimated_cost?.toString() || '',
      });
    }
  });

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{activity.emoji}</span>
            {t('dashboard.ai.addToPlanner', 'Zum Planer hinzufügen')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.ai.addToPlannerDesc', 'Füge diese Aktivität zu deinem Event-Plan hinzu')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              <PopoverContent className="w-auto p-0" align="start">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                <Clock className="w-3 h-3 inline mr-1" />
                {t('planner.form.startTime')}
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">{t('planner.form.endTime')}</Label>
              <Input
                id="end_time"
                type="time"
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

        {/* Marketplace Service Matches */}
        {matches.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Passende Services buchen</span>
            </div>
            <div className="space-y-2">
              {matches.slice(0, 2).map((svc) => (
                <button
                  key={svc.slug}
                  type="button"
                  onClick={() => navigate(`/marketplace/service/${svc.slug}`)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-left hover:bg-primary/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{svc.title}</p>
                    <p className="text-xs text-muted-foreground">{svc.agency}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">{(svc.price / 100).toFixed(0)} €</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-muted-foreground">{svc.rating}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate("/marketplace")}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Alle Services im Marketplace ansehen →
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
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
