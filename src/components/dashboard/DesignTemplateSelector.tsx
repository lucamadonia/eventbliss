import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN_TEMPLATES, DesignTemplate, getTemplatesForEventType } from '@/lib/design-templates';
import { Badge } from '@/components/ui/badge';

interface DesignTemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (template: DesignTemplate) => void;
  eventType?: string;
}

export function DesignTemplateSelector({
  selectedTemplateId,
  onSelect,
  eventType = 'bachelor',
}: DesignTemplateSelectorProps) {
  const { t } = useTranslation();
  const recommendedTemplates = getTemplatesForEventType(eventType);
  const otherTemplates = DESIGN_TEMPLATES.filter(
    t => !t.eventTypes.includes(eventType)
  );

  return (
    <div className="space-y-6">
      {/* Recommended Templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t('dashboard.form.design.recommendedFor')}
          </span>
          <Badge variant="secondary" className="text-xs">
            {recommendedTemplates.length} {t('dashboard.form.design.templates')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <AnimatePresence mode="popLayout">
            {recommendedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                isRecommended
                onSelect={() => onSelect(template)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Other Templates */}
      {otherTemplates.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm text-muted-foreground">
            {t('dashboard.form.design.moreTemplates')}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {otherTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  isRecommended={false}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: DesignTemplate;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, isRecommended, onSelect }: TemplateCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'relative group rounded-xl overflow-hidden border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border/50 hover:border-primary/50'
      )}
    >
      {/* Preview Gradient */}
      <div
        className="aspect-[4/3] w-full"
        style={{
          background: template.preview.gradient,
        }}
      >
        {/* Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl filter drop-shadow-lg">{template.icon}</span>
        </div>

        {/* Selected Checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}

        {/* Recommended Badge */}
        {isRecommended && !isSelected && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-2 bg-card/95 backdrop-blur-sm">
        <p className="text-xs font-medium text-foreground truncate">
          {template.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {template.description}
        </p>
      </div>
    </motion.button>
  );
}
