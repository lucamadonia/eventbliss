import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, ArrowRight, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { usePremium } from '@/hooks/usePremium';
import { getTemplatesForEventType, type EventTemplate } from '@/lib/event-templates';
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

  const templates = getTemplatesForEventType(eventType);

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

      if (error) throw error;

      if (data?.success && data?.template) {
        // Store template and show preview instead of applying directly
        setGeneratedTemplate(data.template);
        setShowPreview(true);
        toast({
          title: t('templates.aiSuccess'),
          description: t('templates.aiPreview.reviewMessage'),
        });
      } else {
        throw new Error(data?.error || 'Failed to generate template');
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
            onClick={() => onSelectTemplate(template)}
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
