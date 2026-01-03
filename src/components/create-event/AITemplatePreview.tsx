import React from 'react';
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
  Pencil,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTemplateById, DesignTemplate } from '@/lib/design-templates';

interface AITemplatePreviewProps {
  template: {
    budget_options?: Array<{ value: string; label: string }>;
    destination_options?: Array<{ value: string; label: string; emoji?: string }>;
    activity_options?: Array<{ value: string; label: string; emoji?: string; category?: string }>;
    duration_options?: Array<{ value: string; label: string }>;
    branding?: {
      template_id?: string;
      primary_color?: string;
      accent_color?: string;
    };
  };
  onApply: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  isGenerating?: boolean;
}

export function AITemplatePreview({
  template,
  onApply,
  onRegenerate,
  onBack,
  isGenerating,
}: AITemplatePreviewProps) {
  const { t } = useTranslation();

  const designTemplate = template.branding?.template_id 
    ? getTemplateById(template.branding.template_id) 
    : null;

  // Group activities by category
  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, Array<{ value: string; label: string; emoji?: string }>> = {};
    template.activity_options?.forEach(activity => {
      const cat = activity.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(activity);
    });
    return groups;
  }, [template.activity_options]);

  const getCategoryLabel = (cat: string) => {
    const key = `templates.aiPreview.category.${cat}`;
    const translated = t(key);
    return translated !== key ? translated : cat.charAt(0).toUpperCase() + cat.slice(1);
  };

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
          {t('templates.aiPreview.subtitle')}
        </p>
      </div>

      {/* Preview Grid */}
      <ScrollArea className="h-[50vh] md:h-auto md:max-h-[60vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {/* Budget Options */}
          {template.budget_options && template.budget_options.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-success" />
                <h3 className="font-semibold">{t('templates.aiPreview.budgetOptions')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.budget_options.map((opt, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Destination Options */}
          {template.destination_options && template.destination_options.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-info" />
                <h3 className="font-semibold">{t('templates.aiPreview.destinationOptions')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.destination_options.map((opt, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Duration Options */}
          {template.duration_options && template.duration_options.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-warning" />
                <h3 className="font-semibold">{t('templates.aiPreview.durationOptions')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.duration_options.map((opt, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </GlassCard>
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
          {Object.keys(groupedActivities).length > 0 && (
            <GlassCard className="p-4 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">{t('templates.aiPreview.activityOptions')}</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(groupedActivities).map(([category, activities]) => (
                  <div key={category}>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                      {getCategoryLabel(category)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activities.map((act, i) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {act.emoji && <span className="mr-1">{act.emoji}</span>}
                          {act.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <GradientButton
          onClick={onApply}
          disabled={isGenerating}
          icon={<Check className="w-4 h-4" />}
          className="min-w-[160px]"
        >
          {t('templates.aiPreview.apply')}
          <ArrowRight className="w-4 h-4 ml-1" />
        </GradientButton>
        
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {t('templates.aiPreview.regenerate')}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isGenerating}
          className="text-muted-foreground"
        >
          {t('common.back')}
        </Button>
      </div>
    </motion.div>
  );
}
