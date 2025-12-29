import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Palette, Type, Calendar, Image, Sparkles, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BrandingConfig } from '@/lib/survey-config';
import { DesignTemplate } from '@/lib/design-templates';

interface BrandingEditorProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
  eventName: string;
  honoreeName: string;
  selectedTemplate?: DesignTemplate | null;
}

const PRESET_COLORS = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F97316', '#EF4444',
  '#EC4899', '#6366F1', '#14B8A6', '#F59E0B', '#84CC16',
  '#7C3AED', '#0EA5E9', '#22C55E', '#FB923C', '#F43F5E',
];

export function BrandingEditor({
  branding,
  onChange,
  eventName,
  honoreeName,
  selectedTemplate,
}: BrandingEditorProps) {
  const { t, i18n } = useTranslation();
  const [keyDate, setKeyDate] = useState<Date | undefined>(
    branding.key_date ? new Date(branding.key_date) : undefined
  );
  
  const dateLocale = i18n.language === 'de' ? de : enUS;

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    onChange({ ...branding, ...updates });
  };

  const applyTemplateColors = () => {
    if (selectedTemplate) {
      updateBranding({
        primary_color: selectedTemplate.branding.primary_color,
        accent_color: selectedTemplate.branding.accent_color,
        background_style: selectedTemplate.branding.background_style,
      });
    }
  };

  const handleKeyDateChange = (date: Date | undefined) => {
    setKeyDate(date);
    if (date) {
      updateBranding({
        key_date: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Mini-Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden border border-border/50"
      >
        <div
          className="relative p-6 text-center"
          style={{
            background: branding.background_style === 'gradient'
              ? `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.accent_color} 100%)`
              : branding.primary_color,
          }}
        >
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">
              {branding.hero_title || eventName || 'Event Name'}
            </h3>
            <p className="text-sm text-white/80 mt-1">
              {branding.hero_subtitle || t('dashboard.form.branding.heroSubtitlePlaceholder')}
            </p>
            {(branding.key_date_label || branding.key_date) && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">
                  {branding.key_date_label || t('dashboard.form.branding.keyDateLabelPlaceholder')}
                  {keyDate && `: ${format(keyDate, 'EEE, dd.MM.yyyy', { locale: dateLocale })}`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-muted/30 px-4 py-2 text-center">
          <span className="text-xs text-muted-foreground">{t('dashboard.form.branding.livePreview')}</span>
        </div>
      </motion.div>

      {/* Template Reset Button */}
      {selectedTemplate && (
        <Button
          variant="outline"
          size="sm"
          onClick={applyTemplateColors}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('dashboard.form.branding.resetTemplateColors')} ({selectedTemplate.name})
        </Button>
      )}

      {/* Color Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Color */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t('dashboard.form.branding.primaryColor')}
          </Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded-lg border border-border cursor-pointer shadow-sm"
              style={{ backgroundColor: branding.primary_color }}
            />
            <Input
              type="text"
              value={branding.primary_color}
              onChange={(e) => updateBranding({ primary_color: e.target.value })}
              className="flex-1 font-mono text-sm"
              placeholder="#8B5CF6"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.slice(0, 10).map((color) => (
              <button
                key={color}
                onClick={() => updateBranding({ primary_color: color })}
                className={cn(
                  'w-6 h-6 rounded-md border-2 transition-all hover:scale-110',
                  branding.primary_color === color
                    ? 'border-foreground ring-2 ring-foreground/20'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('dashboard.form.branding.accentColor')}
          </Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded-lg border border-border cursor-pointer shadow-sm"
              style={{ backgroundColor: branding.accent_color }}
            />
            <Input
              type="text"
              value={branding.accent_color}
              onChange={(e) => updateBranding({ accent_color: e.target.value })}
              className="flex-1 font-mono text-sm"
              placeholder="#06B6D4"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.slice(5, 15).map((color) => (
              <button
                key={color}
                onClick={() => updateBranding({ accent_color: color })}
                className={cn(
                  'w-6 h-6 rounded-md border-2 transition-all hover:scale-110',
                  branding.accent_color === color
                    ? 'border-foreground ring-2 ring-foreground/20'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero Texts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Type className="w-4 h-4" />
          {t('dashboard.form.branding.heroTexts')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero-title">{t('dashboard.form.branding.heroTitle')}</Label>
            <Input
              id="hero-title"
              value={branding.hero_title || ''}
              onChange={(e) => updateBranding({ hero_title: e.target.value })}
              placeholder={eventName || 'JGA Max'}
            />
            <p className="text-xs text-muted-foreground">
              {t('dashboard.form.branding.heroTitleDefault')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">{t('dashboard.form.branding.heroSubtitle')}</Label>
            <Input
              id="hero-subtitle"
              value={branding.hero_subtitle || ''}
              onChange={(e) => updateBranding({ hero_subtitle: e.target.value })}
              placeholder={t('dashboard.form.branding.heroSubtitlePlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Key Date */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          {t('dashboard.form.branding.keyDate')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="key-date-label">{t('dashboard.form.branding.keyDateLabel')}</Label>
            <Input
              id="key-date-label"
              value={branding.key_date_label || ''}
              onChange={(e) => updateBranding({ key_date_label: e.target.value })}
              placeholder={t('dashboard.form.branding.keyDateLabelPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('dashboard.form.branding.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !keyDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {keyDate ? format(keyDate, 'PPP', { locale: dateLocale }) : t('dashboard.form.branding.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={keyDate}
                  onSelect={handleKeyDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Background Style */}
      <div className="space-y-3">
        <Label>{t('dashboard.form.branding.backgroundStyle')}</Label>
        <div className="flex gap-2 flex-wrap">
          {(['gradient', 'solid', 'dark'] as const).map((style) => (
            <Button
              key={style}
              variant={branding.background_style === style ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateBranding({ background_style: style })}
            >
              {style === 'gradient' && t('dashboard.form.branding.gradient')}
              {style === 'solid' && t('dashboard.form.branding.solid')}
              {style === 'dark' && t('dashboard.form.branding.dark')}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
