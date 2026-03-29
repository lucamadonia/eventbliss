import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN_TEMPLATES, DesignTemplate, PATTERN_SVGS, getTemplatesForEventType } from '@/lib/design-templates';
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
  const patternSvg = template.patternId !== 'none' && PATTERN_SVGS[template.patternId]
    ? PATTERN_SVGS[template.patternId](template.branding.accent_color)
    : '';
  const patternDataUrl = patternSvg
    ? `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`
    : 'none';

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'relative group rounded-xl overflow-hidden border-2 transition-all duration-200 min-h-[140px]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isSelected
          ? 'border-violet-500 ring-2 ring-violet-500/30 focus:ring-violet-500'
          : 'border-border/50 hover:border-primary/50 focus:ring-primary'
      )}
    >
      {/* Preview Gradient Area */}
      <div
        className="relative h-20 w-full overflow-hidden"
        style={{
          background: template.preview.gradient,
        }}
      >
        {/* Pattern Overlay */}
        {patternSvg && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: patternDataUrl,
              backgroundRepeat: 'repeat',
            }}
          />
        )}

        {/* Floating Background Icons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
          {template.backgroundIcons.map((icon, i) => (
            <motion.span
              key={i}
              className="text-xl select-none"
              style={{ opacity: 0.5 }}
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            >
              {icon}
            </motion.span>
          ))}
        </div>

        {/* Selected Checkmark Overlay */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-violet-500/20 flex items-center justify-center"
          >
            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        )}

        {/* Recommended dot */}
        {isRecommended && !isSelected && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Label Area */}
      <div className="p-2.5 bg-card/95 backdrop-blur-sm text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">{template.icon}</span>
          <p className="text-xs font-semibold text-foreground truncate">
            {template.name}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
          {template.description}
        </p>
      </div>
    </motion.button>
  );
}
