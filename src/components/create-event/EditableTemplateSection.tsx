import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw, Plus, X, Undo2, MessageSquare, Trash2, GripVertical, Sparkles } from 'lucide-react';
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
  onReorder: (newItems: TemplateItem[]) => void;
  onRegenerate: (feedback: string) => void;
  onExpand?: (feedback: string) => void;
  isRegenerating?: boolean;
  isExpanding?: boolean;
  categoryLabel?: (category: string) => string;
  showCategories?: boolean;
  hasCredits?: boolean;
}

// Custom hook to detect touch devices
function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  return isTouch;
}

// Swipeable Item Component for mobile
function SwipeableItem({ 
  item, 
  index,
  onRemove, 
  onStartEdit,
  isTouch,
  children 
}: { 
  item: TemplateItem;
  index: number;
  onRemove: () => void;
  onStartEdit: () => void;
  isTouch: boolean;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0], ['hsl(var(--destructive))', 'transparent']);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX < -80) {
      // Trigger delete animation
      onRemove();
    }
    setIsDragging(false);
  };

  if (!isTouch) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      {/* Delete background */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-3 rounded-md"
        style={{ background }}
      >
        <motion.div style={{ opacity: deleteOpacity }}>
          <Trash2 className="w-4 h-4 text-destructive-foreground" />
        </motion.div>
      </motion.div>
      
      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn("relative", isDragging && "z-10")}
        onDoubleClick={onStartEdit}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function EditableTemplateSection({
  title,
  icon,
  iconColor = 'text-primary',
  items,
  onItemRemove,
  onItemAdd,
  onItemEdit,
  onReorder,
  onRegenerate,
  onExpand,
  isRegenerating,
  isExpanding,
  categoryLabel,
  showCategories = false,
  hasCredits = true,
}: EditableTemplateSectionProps) {
  const { t } = useTranslation();
  const isTouch = useTouchDevice();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<'regenerate' | 'expand'>('regenerate');
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
    if (!hasCredits) return;
    if (showFeedback && feedbackMode === 'regenerate') {
      onRegenerate(feedback);
      setFeedback('');
      setShowFeedback(false);
    } else {
      setFeedbackMode('regenerate');
      setShowFeedback(true);
    }
  };

  const handleExpand = () => {
    if (!hasCredits || !onExpand) return;
    if (showFeedback && feedbackMode === 'expand') {
      onExpand(feedback);
      setFeedback('');
      setShowFeedback(false);
    } else {
      setFeedbackMode('expand');
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

  // Render item badge with drag handle for desktop
  const renderItemBadge = (item: TemplateItem, globalIndex: number, isEditing: boolean) => {
    if (isEditing) {
      return (
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
      );
    }

    return (
      <Badge
        variant="secondary"
        className={cn(
          "text-sm pr-1 gap-1 cursor-grab active:cursor-grabbing group hover:bg-secondary/80 transition-colors select-none",
          !isTouch && "pl-1"
        )}
        onDoubleClick={() => handleStartEdit(globalIndex)}
      >
        {!isTouch && (
          <GripVertical className="w-3 h-3 opacity-40 group-hover:opacity-70 mr-0.5" />
        )}
        {item.emoji && <span>{item.emoji}</span>}
        <span>{item.label}</span>
        {!isTouch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(globalIndex);
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors opacity-50 group-hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </Badge>
    );
  };

  return (
    <GlassCard className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand Button */}
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              disabled={isExpanding || isRegenerating || !hasCredits}
              className="h-8 gap-1 text-xs"
              title={!hasCredits ? t('templates.aiPreview.noCredits') : undefined}
            >
              <Sparkles className={cn("w-3.5 h-3.5", isExpanding && "animate-pulse")} />
              {t('templates.aiPreview.expandSection')}
            </Button>
          )}
          {/* Regenerate Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating || isExpanding || !hasCredits}
            className="h-8 gap-1 text-xs"
            title={!hasCredits ? t('templates.aiPreview.noCredits') : undefined}
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
                    {feedbackMode === 'expand' 
                      ? t('templates.aiPreview.expandFeedbackLabel')
                      : t('templates.aiPreview.feedbackLabel')
                    }
                  </span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {t('templates.aiPreview.usesOneCredit')}
                  </Badge>
                </div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={feedbackMode === 'expand'
                    ? t('templates.aiPreview.expandFeedbackPlaceholder')
                    : t('templates.aiPreview.feedbackPlaceholder')
                  }
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => {
                    if (feedbackMode === 'expand' && onExpand) {
                      onExpand(feedback);
                    } else {
                      onRegenerate(feedback);
                    }
                    setFeedback('');
                    setShowFeedback(false);
                  }}
                  disabled={isRegenerating || isExpanding}
                  className="h-8"
                >
                  {feedbackMode === 'expand' ? (
                    <Sparkles className={cn("w-3.5 h-3.5 mr-1", isExpanding && "animate-pulse")} />
                  ) : (
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isRegenerating && "animate-spin")} />
                  )}
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

      {/* Items with Drag & Drop */}
      <div className="space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            {showCategories && category && (
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                {categoryLabel ? categoryLabel(category) : category}
              </p>
            )}
            
            {/* Reorder Group for Drag & Drop */}
            <Reorder.Group
              axis="x"
              values={categoryItems}
              onReorder={(newOrder) => {
                if (showCategories) {
                  // For categorized items, we need to merge back
                  const otherItems = items.filter(item => 
                    (item.category || 'other') !== (category || 'other')
                  );
                  onReorder([...otherItems, ...newOrder]);
                } else {
                  onReorder(newOrder);
                }
              }}
              className="flex flex-wrap gap-2"
              layoutScroll
            >
              <AnimatePresence mode="popLayout">
                {categoryItems.map((item) => {
                  const globalIndex = items.findIndex(it => it.value === item.value);
                  const isEditing = editingIndex === globalIndex;
                  
                  return (
                    <Reorder.Item
                      key={item.value}
                      value={item}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0, x: -50 }}
                      whileDrag={{ 
                        scale: 1.05, 
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        zIndex: 50,
                        cursor: "grabbing"
                      }}
                      transition={{ duration: 0.2 }}
                      className="touch-none"
                    >
                      {isTouch ? (
                        <SwipeableItem
                          item={item}
                          index={globalIndex}
                          onRemove={() => handleRemove(globalIndex)}
                          onStartEdit={() => handleStartEdit(globalIndex)}
                          isTouch={isTouch}
                        >
                          {renderItemBadge(item, globalIndex, isEditing)}
                        </SwipeableItem>
                      ) : (
                        renderItemBadge(item, globalIndex, isEditing)
                      )}
                    </Reorder.Item>
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
            </Reorder.Group>
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

      {/* Hint - different for touch vs desktop */}
      <p className="text-xs text-muted-foreground mt-3 opacity-70">
        {isTouch ? t('templates.aiPreview.swipeHint') : t('templates.aiPreview.dragHint')}
      </p>
    </GlassCard>
  );
}
