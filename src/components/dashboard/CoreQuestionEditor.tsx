import { useState } from "react";
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
import { SelectOption, QuestionConfig } from "@/lib/survey-config";
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
}: CoreQuestionEditorProps) => {
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const isEnabled = questionConfig?.enabled ?? true;
  const isMultiSelect = questionConfig?.multiSelect ?? false;

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
        {(showVisibilityToggle || showMultiSelectToggle) && onConfigChange && questionConfig && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Multi-Select Toggle */}
            {showMultiSelectToggle && (
              <div className="flex items-center gap-2">
                <button
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
                      Multi
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5" />
                      Single
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Visibility Toggle */}
            {showVisibilityToggle && (
              <div className="flex items-center gap-2">
                <button
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
                      Sichtbar
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Versteckt
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
                value={option.label}
                onChange={(e) => updateOption(option.value, { label: e.target.value })}
                className="flex-1"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(option.value)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add new option */}
      {options.length < maxOptions && (
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
          <Button onClick={addOption} disabled={!newLabel.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Count badge and info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{options.length} von max. {maxOptions} Optionen</span>
          {isMultiSelect && (
            <Badge variant="secondary" className="text-xs">
              Mehrfachauswahl
            </Badge>
          )}
        </div>
        {showEmoji && (
          <span className="flex items-center gap-1">
            <Smile className="w-3 h-3" />
            Emojis optional
          </span>
        )}
      </div>
    </div>
  );
};
