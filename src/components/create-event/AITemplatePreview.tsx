import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Dumbbell, 
  Clock, 
  Palette,
  Check,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { getTemplateById } from '@/lib/design-templates';
import { EditableTemplateSection } from './EditableTemplateSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TemplateItem {
  value: string;
  label: string;
  emoji?: string;
  category?: string;
}

interface TemplateData {
  budget_options?: TemplateItem[];
  destination_options?: TemplateItem[];
  activity_options?: TemplateItem[];
  duration_options?: TemplateItem[];
  branding?: {
    template_id?: string;
    primary_color?: string;
    accent_color?: string;
  };
}

interface AITemplatePreviewProps {
  template: TemplateData;
  eventContext?: {
    eventType?: string;
    honoreeName?: string;
    description?: string;
  };
  onApply: (modifiedTemplate: TemplateData) => void;
  onRegenerate: () => void;
  onBack: () => void;
  isGenerating?: boolean;
}

type SectionKey = 'budget' | 'destination' | 'activity' | 'duration';

export function AITemplatePreview({
  template,
  eventContext,
  onApply,
  onRegenerate,
  onBack,
  isGenerating,
}: AITemplatePreviewProps) {
  const { t } = useTranslation();
  
  // Editable state for each section
  const [budgetOptions, setBudgetOptions] = useState<TemplateItem[]>(template.budget_options || []);
  const [destinationOptions, setDestinationOptions] = useState<TemplateItem[]>(template.destination_options || []);
  const [activityOptions, setActivityOptions] = useState<TemplateItem[]>(template.activity_options || []);
  const [durationOptions, setDurationOptions] = useState<TemplateItem[]>(template.duration_options || []);
  const [regeneratingSection, setRegeneratingSection] = useState<SectionKey | null>(null);

  const designTemplate = template.branding?.template_id 
    ? getTemplateById(template.branding.template_id) 
    : null;

  const getCategoryLabel = useCallback((cat: string) => {
    const key = `templates.aiPreview.category.${cat}`;
    const translated = t(key);
    return translated !== key ? translated : cat.charAt(0).toUpperCase() + cat.slice(1);
  }, [t]);

  // Regenerate a specific section
  const handleRegenerateSection = useCallback(async (section: SectionKey, feedback: string) => {
    setRegeneratingSection(section);
    
    try {
      const currentItems = {
        budget: budgetOptions,
        destination: destinationOptions,
        activity: activityOptions,
        duration: durationOptions,
      }[section];

      const { data, error } = await supabase.functions.invoke('regenerate-template-section', {
        body: {
          section,
          currentItems,
          feedback,
          eventContext,
        },
      });

      if (error) throw error;

      const newItems = data?.items || [];
      
      switch (section) {
        case 'budget':
          setBudgetOptions(newItems);
          break;
        case 'destination':
          setDestinationOptions(newItems);
          break;
        case 'activity':
          setActivityOptions(newItems);
          break;
        case 'duration':
          setDurationOptions(newItems);
          break;
      }

      toast.success(t('templates.aiPreview.sectionRegenerated'));
    } catch (error) {
      console.error('Error regenerating section:', error);
      toast.error(t('common.error'));
    } finally {
      setRegeneratingSection(null);
    }
  }, [budgetOptions, destinationOptions, activityOptions, durationOptions, eventContext, t]);

  // Handle apply with modified template
  const handleApply = () => {
    const modifiedTemplate = {
      ...template,
      budget_options: budgetOptions,
      destination_options: destinationOptions,
      activity_options: activityOptions,
      duration_options: durationOptions,
    };
    onApply(modifiedTemplate);
  };

  // Item manipulation helpers
  const createItemHandlers = (
    items: TemplateItem[],
    setItems: React.Dispatch<React.SetStateAction<TemplateItem[]>>
  ) => ({
    onRemove: (index: number) => {
      setItems(prev => prev.filter((_, i) => i !== index));
    },
    onAdd: (item: TemplateItem) => {
      setItems(prev => [...prev, item]);
    },
    onEdit: (index: number, item: TemplateItem) => {
      setItems(prev => prev.map((it, i) => i === index ? item : it));
    },
    onReorder: (newItems: TemplateItem[]) => {
      setItems(newItems);
    },
  });

  const budgetHandlers = createItemHandlers(budgetOptions, setBudgetOptions);
  const destinationHandlers = createItemHandlers(destinationOptions, setDestinationOptions);
  const activityHandlers = createItemHandlers(activityOptions, setActivityOptions);
  const durationHandlers = createItemHandlers(durationOptions, setDurationOptions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('templates.aiPreview.badge')}</span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
          {t('templates.aiPreview.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('templates.aiPreview.interactiveSubtitle')}
        </p>
      </div>

      {/* Editable Sections */}
      <ScrollArea className="h-[50vh] md:h-auto md:max-h-[55vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {/* Budget Options */}
          {budgetOptions.length > 0 && (
            <EditableTemplateSection
              title={t('templates.aiPreview.budgetOptions')}
              icon={<DollarSign className="w-5 h-5" />}
              iconColor="text-success"
              items={budgetOptions}
              onItemRemove={budgetHandlers.onRemove}
              onItemAdd={budgetHandlers.onAdd}
              onItemEdit={budgetHandlers.onEdit}
              onReorder={budgetHandlers.onReorder}
              onRegenerate={(feedback) => handleRegenerateSection('budget', feedback)}
              isRegenerating={regeneratingSection === 'budget'}
            />
          )}

          {/* Destination Options */}
          {destinationOptions.length > 0 && (
            <EditableTemplateSection
              title={t('templates.aiPreview.destinationOptions')}
              icon={<MapPin className="w-5 h-5" />}
              iconColor="text-info"
              items={destinationOptions}
              onItemRemove={destinationHandlers.onRemove}
              onItemAdd={destinationHandlers.onAdd}
              onItemEdit={destinationHandlers.onEdit}
              onReorder={destinationHandlers.onReorder}
              onRegenerate={(feedback) => handleRegenerateSection('destination', feedback)}
              isRegenerating={regeneratingSection === 'destination'}
            />
          )}

          {/* Duration Options */}
          {durationOptions.length > 0 && (
            <EditableTemplateSection
              title={t('templates.aiPreview.durationOptions')}
              icon={<Clock className="w-5 h-5" />}
              iconColor="text-warning"
              items={durationOptions}
              onItemRemove={durationHandlers.onRemove}
              onItemAdd={durationHandlers.onAdd}
              onItemEdit={durationHandlers.onEdit}
              onReorder={durationHandlers.onReorder}
              onRegenerate={(feedback) => handleRegenerateSection('duration', feedback)}
              isRegenerating={regeneratingSection === 'duration'}
            />
          )}

          {/* Design Template */}
          {designTemplate && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t('templates.aiPreview.recommendedDesign')}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${designTemplate.branding.primary_color}, ${designTemplate.branding.accent_color})` 
                  }}
                >
                  {designTemplate.icon}
                </div>
                <div>
                  <p className="font-medium">{designTemplate.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {designTemplate.branding.background_style}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Activities by Category */}
          {activityOptions.length > 0 && (
            <div className="md:col-span-2">
              <EditableTemplateSection
                title={t('templates.aiPreview.activityOptions')}
                icon={<Dumbbell className="w-5 h-5" />}
                iconColor="text-accent"
                items={activityOptions}
                onItemRemove={activityHandlers.onRemove}
                onItemAdd={activityHandlers.onAdd}
                onItemEdit={activityHandlers.onEdit}
                onReorder={activityHandlers.onReorder}
                onRegenerate={(feedback) => handleRegenerateSection('activity', feedback)}
                isRegenerating={regeneratingSection === 'activity'}
                showCategories
                categoryLabel={getCategoryLabel}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Count */}
      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
        <span>💰 {budgetOptions.length}</span>
        <span>📍 {destinationOptions.length}</span>
        <span>🎯 {activityOptions.length}</span>
        <span>⏱️ {durationOptions.length}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <GradientButton
          onClick={handleApply}
          disabled={isGenerating || regeneratingSection !== null}
          icon={<Check className="w-4 h-4" />}
          className="min-w-[160px]"
        >
          {t('templates.aiPreview.apply')}
          <ArrowRight className="w-4 h-4 ml-1" />
        </GradientButton>
        
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isGenerating || regeneratingSection !== null}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {t('templates.aiPreview.regenerateAll')}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isGenerating || regeneratingSection !== null}
          className="text-muted-foreground"
        >
          {t('common.back')}
        </Button>
      </div>
    </motion.div>
  );
}
