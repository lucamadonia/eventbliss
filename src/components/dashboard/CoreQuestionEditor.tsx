import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Smile,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  SelectOption,
  QuestionConfig,
  QuestionConfigs,
  tEditableOptionLabel,
} from "@/lib/survey-config";
import { cn } from "@/lib/utils";

interface CoreQuestionEditorProps {
  title: string;
  description?: string;
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
  showEmoji?: boolean;
  maxOptions?: number;
  placeholder?: string;
  // New props for question configuration
  questionConfig?: QuestionConfig;
  onConfigChange?: (config: QuestionConfig) => void;
  showVisibilityToggle?: boolean;
  showMultiSelectToggle?: boolean;
  /**
   * Policy props (default true = fully editable). These encode the renderer/DB
   * constraints so the legacy editors stop offering edits that break guests:
   * - allowAddRemove=false locks the option VALUE set (DB CHECK constraints on
   *   attendance/travel/fitness/alcohol). Add row + delete buttons are hidden
   *   and a muted footnote is shown; label/emoji edits stay allowed.
   * - allowMultiToggle=false hides the single/multi toggle (renderer only
   *   honors multiSelect for duration/budget/destination).
   * - allowDisable=false hides the visibility toggle (attendance is mandatory).
   */
  allowAddRemove?: boolean;
  allowMultiToggle?: boolean;
  allowDisable?: boolean;
  /**
   * Which core question these options belong to. Set it and the built-in
   * options are shown in the viewer's language (via tEditableOptionLabel);
   * omit it and labels render exactly as stored, as they always did.
   */
  optionGroup?: keyof QuestionConfigs;
}

export const CoreQuestionEditor = ({
  title,
  description,
  options,
  onChange,
  showEmoji = true,
  maxOptions = 10,
  placeholder = "Neue Option",
  questionConfig,
  onConfigChange,
  showVisibilityToggle = true,
  showMultiSelectToggle = true,
  allowAddRemove = true,
  allowMultiToggle = true,
  allowDisable = true,
  optionGroup,
}: CoreQuestionEditorProps) => {
  const { t } = useTranslation();
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const isEnabled = questionConfig?.enabled ?? true;
  const isMultiSelect = questionConfig?.multiSelect ?? false;

  // Translate labels that are translation keys (start with "templates.")
  const translateLabel = (label: string): string => {
    if (label.startsWith('templates.')) {
      const translated = t(label);
      // If translation returns the key itself, it means no translation found
      return translated === label ? label.split('.').pop() || label : translated;
    }
    return label;
  };

  /**
   * What the editable label <Input> shows. Built-in options are translated
   * while they still carry their German default text; the moment the organizer
   * edits one, tEditableOptionLabel returns their wording verbatim so a later
   * render can never overwrite it.
   */
  const displayLabel = (option: SelectOption): string => {
    if (option.label.startsWith('templates.')) return translateLabel(option.label);
    if (!optionGroup) return option.label;
    return tEditableOptionLabel(
      t as unknown as (key: string, defaultValue?: string) => string,
      optionGroup,
      option,
    );
  };

  const toggleEnabled = () => {
    if (onConfigChange && questionConfig) {
      onConfigChange({ ...questionConfig, enabled: !isEnabled });
    }
  };

  const toggleMultiSelect = () => {
    if (onConfigChange && questionConfig) {
      onConfigChange({ ...questionConfig, multiSelect: !isMultiSelect });
    }
  };

  const addOption = () => {
    if (!newLabel.trim()) return;
    if (options.length >= maxOptions) return;

    const value = newLabel
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[äöüß]/g, (char) => {
        const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return map[char] || char;
      })
      .replace(/[^a-z0-9_]/g, '');

    const newOption: SelectOption = {
      value: `${value}_${Date.now()}`,
      label: newLabel.trim(),
      ...(showEmoji && newEmoji ? { emoji: newEmoji } : {}),
    };

    onChange([...options, newOption]);
    setNewLabel("");
    setNewEmoji("");
  };

  const removeOption = (value: string) => {
    onChange(options.filter(o => o.value !== value));
  };

  const updateOption = (value: string, updates: Partial<SelectOption>) => {
    onChange(options.map(o => 
      o.value === value ? { ...o, ...updates } : o
    ));
  };

  const handleReorder = (newOrder: SelectOption[]) => {
    onChange(newOrder);
  };

  return (
    <div className={cn("space-y-4", !isEnabled && "opacity-50")}>
      {/* Header with toggles */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">{title}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        
        {/* Config Toggles */}
        {((showVisibilityToggle && allowDisable) || (showMultiSelectToggle && allowMultiToggle)) && onConfigChange && questionConfig && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Multi-Select Toggle */}
            {showMultiSelectToggle && allowMultiToggle && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMultiSelect}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    isMultiSelect 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  disabled={!isEnabled}
                >
                  {isMultiSelect ? (
                    <>
                      <ToggleRight className="w-3.5 h-3.5" />
                      {t('dashboard.form.multi')}
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5" />
                      {t('dashboard.form.single')}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Visibility Toggle */}
            {showVisibilityToggle && allowDisable && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleEnabled}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    isEnabled 
                      ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {isEnabled ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      {t('dashboard.form.visible')}
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      {t('dashboard.form.hidden')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options List with Reorder */}
      <Reorder.Group
        axis="y"
        values={options}
        onReorder={handleReorder}
        className="space-y-2"
      >
        <AnimatePresence>
          {options.map((option) => (
            <Reorder.Item
              key={option.value}
              value={option}
              className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border group"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity" />
              
              {showEmoji && (
                <Input
                  value={option.emoji || ""}
                  onChange={(e) => updateOption(option.value, { emoji: e.target.value })}
                  className="w-12 text-center px-1"
                  maxLength={4}
                  placeholder="😀"
                />
              )}
              
              <Input
                value={displayLabel(option)}
                onChange={(e) => updateOption(option.value, { label: e.target.value })}
                className="flex-1"
              />
              
              {allowAddRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.value)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Locked value set (DB CHECK constraints) — labels/emojis stay editable */}
      {!allowAddRemove && (
        <p className="text-xs text-muted-foreground">
          {/* formStudio.valuesLocked, not dashboard.form.valuesLocked — the latter
              was never added to any locale file, so this sentence was German in
              all ten languages. Same sentence, one key. */}
          {t('formStudio.valuesLocked', 'Antwort-Werte sind bei dieser Frage fest — Text & Emoji kannst du frei anpassen')}
        </p>
      )}

      {/* Add new option */}
      {allowAddRemove && options.length < maxOptions && (
        <div className="flex gap-2">
          {showEmoji && (
            <Input
              placeholder="😀"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-12 text-center px-1"
              maxLength={4}
            />
          )}
          <Input
            placeholder={placeholder}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOption()}
            className="flex-1"
          />
          <Button type="button" onClick={addOption} disabled={!newLabel.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Count badge and info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{t('dashboard.form.optionsCount', { count: options.length, max: maxOptions })}</span>
          {isMultiSelect && (
            <Badge variant="secondary" className="text-xs">
              {t('dashboard.form.multiSelect')}
            </Badge>
          )}
        </div>
        {showEmoji && (
          <span className="flex items-center gap-1">
            <Smile className="w-3 h-3" />
            {t('dashboard.form.emojisOptional')}
          </span>
        )}
      </div>
    </div>
  );
};
