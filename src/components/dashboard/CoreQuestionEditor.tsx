import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SelectOption } from "@/lib/survey-config";

interface CoreQuestionEditorProps {
  title: string;
  description?: string;
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
  showEmoji?: boolean;
  maxOptions?: number;
  placeholder?: string;
}

export const CoreQuestionEditor = ({
  title,
  description,
  options,
  onChange,
  showEmoji = true,
  maxOptions = 10,
  placeholder = "Neue Option",
}: CoreQuestionEditorProps) => {
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
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

      {/* Count badge */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{options.length} von max. {maxOptions} Optionen</span>
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
