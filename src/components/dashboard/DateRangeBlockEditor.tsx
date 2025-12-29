import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  AlertTriangle,
  GripVertical,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeBlock {
  key: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  label?: string;
  warning?: string;
}

interface DateRangeBlockEditorProps {
  blocks: DateRangeBlock[];
  onChange: (blocks: DateRangeBlock[]) => void;
}

// Helper to format date range as label
function formatDateRangeLabel(start: string, end: string): string {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const startFormatted = format(startDate, "EEE dd.MM.", { locale: de });
    const endFormatted = format(endDate, "EEE dd.MM.yyyy", { locale: de });
    return `${startFormatted}–${endFormatted}`;
  } catch {
    return `${start} – ${end}`;
  }
}

// Generate next available key (A, B, C, ...)
function getNextKey(blocks: DateRangeBlock[]): string {
  const usedKeys = blocks.map(b => b.key);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const letter of alphabet) {
    if (!usedKeys.includes(letter)) {
      return letter;
    }
  }
  return `X${blocks.length + 1}`;
}

export const DateRangeBlockEditor = ({ blocks, onChange }: DateRangeBlockEditorProps) => {
  const { t } = useTranslation();
  const [newStartDate, setNewStartDate] = useState<Date | undefined>();
  const [newEndDate, setNewEndDate] = useState<Date | undefined>();
  const [newWarning, setNewWarning] = useState("");

  const addBlock = () => {
    if (!newStartDate || !newEndDate) return;
    
    const newBlock: DateRangeBlock = {
      key: getNextKey(blocks),
      start: format(newStartDate, 'yyyy-MM-dd'),
      end: format(newEndDate, 'yyyy-MM-dd'),
      label: formatDateRangeLabel(
        format(newStartDate, 'yyyy-MM-dd'),
        format(newEndDate, 'yyyy-MM-dd')
      ),
      warning: newWarning || undefined,
    };
    
    onChange([...blocks, newBlock]);
    setNewStartDate(undefined);
    setNewEndDate(undefined);
    setNewWarning("");
  };

  const removeBlock = (key: string) => {
    onChange(blocks.filter(b => b.key !== key));
  };

  const toggleWarning = (key: string) => {
    onChange(blocks.map(b => {
      if (b.key === key) {
        return {
          ...b,
          warning: b.warning ? undefined : t('dashboard.form.dateBlocks.defaultWarning'),
        };
      }
      return b;
    }));
  };

  const updateWarningText = (key: string, warning: string) => {
    onChange(blocks.map(b => {
      if (b.key === key) {
        return { ...b, warning };
      }
      return b;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Existing blocks */}
      <AnimatePresence mode="popLayout">
        {blocks.map((block, index) => (
          <motion.div
            key={block.key}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group relative"
          >
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
              "bg-background/50 hover:bg-background/80",
              block.warning 
                ? "border-warning/30 bg-warning/5" 
                : "border-border hover:border-primary/30"
            )}>
              {/* Drag handle */}
              <div className="flex-shrink-0 pt-1">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Block key badge */}
              <Badge 
                variant="outline" 
                className={cn(
                  "font-mono text-lg px-3 py-1 flex-shrink-0",
                  block.warning && "border-warning text-warning"
                )}
              >
                {block.key}
              </Badge>

              {/* Date info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm truncate">
                    {block.label || formatDateRangeLabel(block.start, block.end)}
                  </span>
                </div>
                
                {/* Warning input (shown when warning is active) */}
                {block.warning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                      <Input
                        value={block.warning}
                        onChange={(e) => updateWarningText(block.key, e.target.value)}
                        className="h-7 text-xs bg-warning/10 border-warning/20"
                        placeholder={t('dashboard.form.dateBlocks.hintInput')}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWarning(block.key)}
                  className={cn(
                    "h-8 w-8 p-0",
                    block.warning 
                      ? "text-warning hover:text-warning" 
                      : "text-muted-foreground hover:text-warning"
                  )}
                  title={block.warning ? t('dashboard.form.dateBlocks.removeWarning') : t('dashboard.form.dateBlocks.addWarning')}
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(block.key)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add new block */}
      <motion.div 
        className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Label className="text-sm font-medium text-muted-foreground mb-3 block">
          {t('dashboard.form.dateBlocks.addNew')}
        </Label>
        
        <div className="flex flex-wrap gap-3 items-end">
          {/* Start Date Picker */}
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t('dashboard.form.dateBlocks.from')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !newStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newStartDate ? (
                    format(newStartDate, "dd.MM.yyyy", { locale: de })
                  ) : (
                    <span>{t('dashboard.form.dateBlocks.startDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newStartDate}
                  onSelect={setNewStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Picker */}
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t('dashboard.form.dateBlocks.to')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !newEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? (
                    format(newEndDate, "dd.MM.yyyy", { locale: de })
                  ) : (
                    <span>{t('dashboard.form.dateBlocks.endDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  disabled={(date) => newStartDate ? date < newStartDate : false}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Optional Warning */}
          <div className="flex-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t('dashboard.form.dateBlocks.hintOptional')}</Label>
            <Input
              placeholder={t('dashboard.form.dateBlocks.hintPlaceholder')}
              value={newWarning}
              onChange={(e) => setNewWarning(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Add button */}
          <Button 
            onClick={addBlock}
            disabled={!newStartDate || !newEndDate}
            className="h-10"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('dashboard.form.dateBlocks.add')}
          </Button>
        </div>

        {/* Preview */}
        {newStartDate && newEndDate && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>
              {t('dashboard.form.dateBlocks.preview')}: <strong className="text-foreground">{getNextKey(blocks)}</strong> – {formatDateRangeLabel(
                format(newStartDate, 'yyyy-MM-dd'),
                format(newEndDate, 'yyyy-MM-dd')
              )}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('dashboard.form.dateBlocks.noBlocks')}</p>
          <p className="text-xs">{t('dashboard.form.dateBlocks.noBlocksHint')}</p>
        </div>
      )}
    </div>
  );
};
