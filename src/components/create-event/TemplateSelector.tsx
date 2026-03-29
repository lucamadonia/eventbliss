import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, ArrowRight, Loader2, Check, Palette } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { usePremium } from '@/hooks/usePremium';
import { getTemplatesForEventType, type EventTemplate } from '@/lib/event-templates';
import {
  getTemplatesForEventType as getDesignTemplatesForEventType,
  DESIGN_TEMPLATES,
  PATTERN_SVGS,
  type DesignTemplate,
} from '@/lib/design-templates';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AITemplatePreview } from './AITemplatePreview';
import { AITemplatePreviewSkeleton } from './AITemplatePreviewSkeleton';

interface TemplateSelectorProps {
  eventType: string;
  onSelectTemplate: (template: EventTemplate | null, customConfig?: object) => void;
  onSkip: () => void;
}

export const TemplateSelector = ({ eventType, onSelectTemplate, onSkip }: TemplateSelectorProps) => {
  const { t, i18n } = useTranslation();
  const { isPremium } = usePremium();
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<object | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDesignTemplate, setSelectedDesignTemplate] = useState<DesignTemplate | null>(null);

  const templates = getTemplatesForEventType(eventType);
  const designTemplates = getDesignTemplatesForEventType(eventType);
  const otherDesignTemplates = DESIGN_TEMPLATES.filter(
    dt => !dt.eventTypes.includes(eventType)
  );

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: t('common.error'),
        description: t('templates.aiDescriptionRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-template', {
        body: {
          event_type: eventType,
          description: aiDescription,
          language: i18n.language,
        },
      });

      // Handle specific error cases
      if (error) {
        // Check for authentication or credit errors
        if (error.message?.includes('401') || data?.error?.includes('Authentication required')) {
          toast({
            title: t('common.error'),
            description: t('templates.loginRequired', 'Please log in to use AI features'),
            variant: 'destructive',
          });
          return;
        }
        if (error.message?.includes('402') || data?.error?.includes('No credits')) {
          toast({
            title: t('templates.noCredits', 'No AI credits remaining'),
            description: t('templates.upgradeForCredits', 'Upgrade your plan to get more AI credits'),
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Also check data for error responses
      if (data?.error) {
        if (data.error === 'Authentication required for AI features') {
          toast({
            title: t('common.error'),
            description: t('templates.loginRequired', 'Please log in to use AI features'),
            variant: 'destructive',
          });
          return;
        }
        if (data.error === 'No credits remaining') {
          toast({
            title: t('templates.noCredits', 'No AI credits remaining'),
            description: t('templates.upgradeForCredits', 'Upgrade your plan to get more AI credits'),
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.success && data?.template) {
        // Store template and show preview instead of applying directly
        setGeneratedTemplate(data.template);
        setShowPreview(true);
        toast({
          title: t('templates.aiSuccess'),
          description: t('templates.aiPreview.reviewMessage'),
        });
      } else {
        throw new Error('Failed to generate template');
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: t('common.error'),
        description: t('templates.aiError'),
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = (modifiedTemplate?: object) => {
    const templateToApply = modifiedTemplate || generatedTemplate;
    if (templateToApply) {
      onSelectTemplate(null, templateToApply);
    }
  };

  const handleRegenerate = () => {
    setShowPreview(false);
    setGeneratedTemplate(null);
    handleAiGenerate();
  };

  const handleBackFromPreview = () => {
    setShowPreview(false);
    setGeneratedTemplate(null);
  };

  const getTranslatedName = (template: EventTemplate) => {
    const translated = t(template.nameKey);
    return translated === template.nameKey ? template.id : translated;
  };

  const getTranslatedDescription = (template: EventTemplate) => {
    const translated = t(template.descriptionKey);
    return translated === template.descriptionKey ? '' : translated;
  };

  // Show Skeleton while generating
  if (isGenerating && !generatedTemplate) {
    return <AITemplatePreviewSkeleton />;
  }

  // Show AI Template Preview if we have a generated template
  if (showPreview && generatedTemplate) {
    return (
      <AITemplatePreview
        template={generatedTemplate as any}
        eventContext={{
          eventType,
          description: aiDescription,
        }}
        onApply={handleApplyTemplate}
        onRegenerate={handleRegenerate}
        onBack={handleBackFromPreview}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
          {t('templates.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('templates.subtitle')}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <GlassCard
            key={template.id}
            className="p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:ring-2 hover:ring-primary/50 group"
            onClick={() => {
              // Attach selected design template branding if chosen
              if (selectedDesignTemplate) {
                const branding = {
                  primary_color: selectedDesignTemplate.branding.primary_color,
                  accent_color: selectedDesignTemplate.branding.accent_color,
                  background_style: selectedDesignTemplate.branding.background_style,
                  template_id: selectedDesignTemplate.id,
                };
                onSelectTemplate(template, { branding });
              } else {
                onSelectTemplate(template);
              }
            }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{template.icon}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {getTranslatedName(template)}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 flex-grow">
                {getTranslatedDescription(template)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {t(`templates.tags.${tag}`, tag)}
                  </Badge>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Design Template Picker */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t('templates.designTitle', 'Design & Farben')}
          </span>
          {selectedDesignTemplate && (
            <Badge variant="outline" className="text-xs border-violet-500/50 text-violet-500">
              {selectedDesignTemplate.icon} {selectedDesignTemplate.name}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {designTemplates.map((dt) => (
            <DesignTemplatePreviewCard
              key={dt.id}
              template={dt}
              isSelected={selectedDesignTemplate?.id === dt.id}
              onSelect={() => setSelectedDesignTemplate(
                selectedDesignTemplate?.id === dt.id ? null : dt
              )}
            />
          ))}
        </div>
        {otherDesignTemplates.length > 0 && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              {t('templates.moreDesigns', 'Mehr Designs anzeigen')} ({otherDesignTemplates.length})
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
              {otherDesignTemplates.map((dt) => (
                <DesignTemplatePreviewCard
                  key={dt.id}
                  template={dt}
                  isSelected={selectedDesignTemplate?.id === dt.id}
                  onSelect={() => setSelectedDesignTemplate(
                    selectedDesignTemplate?.id === dt.id ? null : dt
                  )}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* AI Template Generator */}
      <AnimatePresence>
        {showAiInput ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t('templates.aiTitle')}</h3>
              </div>
              <Textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder={t('templates.aiPlaceholder')}
                className="mb-4 min-h-[100px] bg-background/50"
                disabled={isGenerating}
              />
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiDescription.trim()}
                  icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                  {isGenerating ? t('templates.generating') : t('templates.generate')}
                </GradientButton>
                <Button
                  variant="outline"
                  onClick={() => setShowAiInput(false)}
                  disabled={isGenerating}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Button
              variant="outline"
              className="gap-2 border-primary/30 hover:border-primary/50"
              onClick={() => {
                if (isPremium) {
                  setShowAiInput(true);
                } else {
                  toast({
                    title: t('templates.premiumRequired'),
                    description: t('templates.premiumRequiredDescription'),
                  });
                }
              }}
            >
              <Wand2 className="w-4 h-4" />
              {t('templates.aiGenerate')}
              {!isPremium && <PremiumBadge className="ml-1" />}
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              {t('templates.noTemplate')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function DesignTemplatePreviewCard({
  template,
  isSelected,
  onSelect,
}: {
  template: DesignTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const patternSvg = template.patternId !== 'none' && PATTERN_SVGS[template.patternId]
    ? PATTERN_SVGS[template.patternId](template.branding.accent_color)
    : '';
  const patternDataUrl = patternSvg
    ? `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`
    : 'none';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={cn(
        'relative rounded-xl overflow-hidden border-2 transition-all duration-200 min-h-[130px]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isSelected
          ? 'border-violet-500 ring-2 ring-violet-500/30 focus:ring-violet-500'
          : 'border-border/50 hover:border-primary/50 focus:ring-primary'
      )}
    >
      {/* Gradient preview */}
      <div
        className="relative h-16 w-full overflow-hidden"
        style={{ background: template.preview.gradient }}
      >
        {patternSvg && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: patternDataUrl,
              backgroundRepeat: 'repeat',
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
          {template.backgroundIcons.map((icon, i) => (
            <motion.span
              key={i}
              className="text-base select-none"
              style={{ opacity: 0.55 }}
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            >
              {icon}
            </motion.span>
          ))}
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-violet-500/20 flex items-center justify-center"
          >
            <div className="w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </div>
      <div className="p-2 bg-card/95 backdrop-blur-sm text-left">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-sm">{template.icon}</span>
          <p className="text-[11px] font-semibold text-foreground truncate">{template.name}</p>
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
          {template.description}
        </p>
      </div>
    </motion.button>
  );
}
