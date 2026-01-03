import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, X, Undo2, MessageSquare } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TemplateItem {
  value: string;
  label: string;
  emoji?: string;
  category?: string;
}

interface EditableTemplateSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  items: TemplateItem[];
  onItemRemove: (index: number) => void;
  onItemAdd: (item: TemplateItem) => void;
  onItemEdit: (index: number, item: TemplateItem) => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
  categoryLabel?: (category: string) => string;
  showCategories?: boolean;
}

export function EditableTemplateSection({
  title,
  icon,
  iconColor = 'text-primary',
  items,
  onItemRemove,
  onItemAdd,
  onItemEdit,
  onRegenerate,
  isRegenerating,
  categoryLabel,
  showCategories = false,
}: EditableTemplateSectionProps) {
  const { t } = useTranslation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [removedItems, setRemovedItems] = useState<{ index: number; item: TemplateItem }[]>([]);

  const handleRemove = (index: number) => {
    const item = items[index];
    setRemovedItems(prev => [...prev, { index, item }]);
    onItemRemove(index);
  };

  const handleUndo = () => {
    const last = removedItems[removedItems.length - 1];
    if (last) {
      onItemAdd(last.item);
      setRemovedItems(prev => prev.slice(0, -1));
    }
  };

  const handleAdd = () => {
    if (newItemLabel.trim()) {
      onItemAdd({
        value: newItemLabel.toLowerCase().replace(/\s+/g, '_'),
        label: newItemLabel.trim(),
      });
      setNewItemLabel('');
      setShowAddInput(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index].label);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const item = items[editingIndex];
      onItemEdit(editingIndex, { ...item, label: editValue.trim() });
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleRegenerate = () => {
    if (showFeedback) {
      onRegenerate(feedback);
      setFeedback('');
      setShowFeedback(false);
    } else {
      setShowFeedback(true);
    }
  };

  // Group by category if needed
  const groupedItems = React.useMemo(() => {
    if (!showCategories) return { '': items };
    const groups: Record<string, TemplateItem[]> = {};
    items.forEach(item => {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items, showCategories]);

  return (
    <GlassCard className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
            {t('templates.aiPreview.regenerateSection')}
          </Button>
        </div>
      </div>

      {/* Feedback Input */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('templates.aiPreview.feedbackLabel')}
                  </span>
                </div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('templates.aiPreview.feedbackPlaceholder')}
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => {
                    onRegenerate(feedback);
                    setFeedback('');
                    setShowFeedback(false);
                  }}
                  disabled={isRegenerating}
                  className="h-8"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isRegenerating && "animate-spin")} />
                  {t('common.submit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedback(false)}
                  className="h-8"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      <div className="space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            {showCategories && category && (
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                {categoryLabel ? categoryLabel(category) : category}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {categoryItems.map((item, i) => {
                  const globalIndex = items.findIndex(it => it.value === item.value);
                  const isEditing = editingIndex === globalIndex;
                  
                  return (
                    <motion.div
                      key={item.value}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0, x: 50 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 text-sm w-32"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingIndex(null);
                            }}
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveEdit}>
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-sm pr-1 gap-1 cursor-pointer group hover:bg-secondary/80 transition-colors"
                          onDoubleClick={() => handleStartEdit(globalIndex)}
                        >
                          {item.emoji && <span>{item.emoji}</span>}
                          <span>{item.label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(globalIndex);
                            }}
                            className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors opacity-50 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Button */}
              {showAddInput ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1"
                >
                  <Input
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    placeholder={t('templates.aiPreview.addItem')}
                    className="h-7 text-sm w-32"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') {
                        setShowAddInput(false);
                        setNewItemLabel('');
                      }
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleAdd}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <Badge
                  variant="outline"
                  className="text-sm cursor-pointer hover:bg-primary/10 transition-colors border-dashed"
                  onClick={() => setShowAddInput(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('templates.aiPreview.addItem')}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Undo removed */}
      <AnimatePresence>
        {removedItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border/50"
          >
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              {t('templates.aiPreview.undoRemove')} ({removedItems.length})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <p className="text-xs text-muted-foreground mt-3 opacity-70">
        {t('templates.aiPreview.tapToEdit')}
      </p>
    </GlassCard>
  );
}
