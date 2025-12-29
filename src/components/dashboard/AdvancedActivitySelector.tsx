import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Check,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ACTIVITIES_LIBRARY, 
  ACTIVITY_CATEGORIES,
  type ActivityItem,
  type ActivityCategory,
  searchActivities,
  getRecommendedActivities,
} from "@/lib/activities-library";
import { cn } from "@/lib/utils";

interface AdvancedActivitySelectorProps {
  selectedActivities: ActivityItem[];
  onSelectionChange: (activities: ActivityItem[]) => void;
  eventType?: string;
}

export const AdvancedActivitySelector = ({
  selectedActivities,
  onSelectionChange,
  eventType = 'bachelor',
}: AdvancedActivitySelectorProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Helper to translate template labels
  const translateLabel = (label: string): string => {
    if (label.startsWith('templates.') && i18n.exists(label)) {
      return t(label);
    }
    return label;
  };
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'all' | 'selected' | 'recommended'>('all');
  const [customActivityName, setCustomActivityName] = useState("");
  const [customActivityEmoji, setCustomActivityEmoji] = useState("🎯");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get recommended activities based on event type
  const recommendedActivities = useMemo(() => 
    getRecommendedActivities(eventType), 
    [eventType]
  );

  // Filter activities based on search and category
  const filteredActivities = useMemo(() => {
    let activities = ACTIVITIES_LIBRARY;
    
    // Apply search
    if (searchQuery.trim()) {
      activities = searchActivities(searchQuery);
    }
    
    // Apply category filter
    if (activeCategory === 'selected') {
      const selectedValues = selectedActivities.map(a => a.value);
      activities = activities.filter(a => selectedValues.includes(a.value));
    } else if (activeCategory === 'recommended') {
      const recommendedValues = recommendedActivities.map(a => a.value);
      activities = activities.filter(a => recommendedValues.includes(a.value));
    } else if (activeCategory !== 'all') {
      activities = activities.filter(a => a.category === activeCategory);
    }
    
    return activities;
  }, [searchQuery, activeCategory, selectedActivities, recommendedActivities]);

  // Check if activity is selected
  const isSelected = (activity: ActivityItem) => 
    selectedActivities.some(a => a.value === activity.value);

  // Toggle activity selection
  const toggleActivity = (activity: ActivityItem) => {
    if (isSelected(activity)) {
      onSelectionChange(selectedActivities.filter(a => a.value !== activity.value));
    } else {
      onSelectionChange([...selectedActivities, activity]);
    }
  };

  // Add custom activity
  const addCustomActivity = () => {
    if (!customActivityName.trim()) return;
    
    const customActivity: ActivityItem = {
      value: `custom_${customActivityName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      label: customActivityName,
      emoji: customActivityEmoji,
      category: 'action',
      tags: ['custom'],
    };
    
    onSelectionChange([...selectedActivities, customActivity]);
    setCustomActivityName("");
    setCustomActivityEmoji("🎯");
    setIsAddDialogOpen(false);
  };

  // Select all recommended
  const selectAllRecommended = () => {
    const newActivities = [...selectedActivities];
    recommendedActivities.forEach(activity => {
      if (!isSelected(activity)) {
        newActivities.push(activity);
      }
    });
    onSelectionChange(newActivities);
  };

  // Categories for tabs
  const categoryTabs = Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => ({
    value: key as ActivityCategory,
    label: config.label,
    emoji: config.emoji,
    count: ACTIVITIES_LIBRARY.filter(a => a.category === key).length,
  }));

  return (
    <div className="space-y-4">
      {/* Header with search and selected count */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('dashboard.form.activitySelector.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Selected count & actions */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            {selectedActivities.length} {t('dashboard.form.activitySelector.selected')}
          </Badge>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Plus className="w-4 h-4 mr-1" />
                {t('dashboard.form.activitySelector.custom')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dashboard.form.activitySelector.addCustom')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('dashboard.form.activitySelector.emoji')}
                    value={customActivityEmoji}
                    onChange={(e) => setCustomActivityEmoji(e.target.value)}
                    className="w-20 text-center text-xl"
                    maxLength={4}
                  />
                  <Input
                    placeholder={t('dashboard.form.activitySelector.activityName')}
                    value={customActivityName}
                    onChange={(e) => setCustomActivityName(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button 
                  onClick={addCustomActivity} 
                  className="w-full"
                  disabled={!customActivityName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.form.activitySelector.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto p-1 w-max min-w-full">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
              Alle ({ACTIVITIES_LIBRARY.length})
            </TabsTrigger>
            <TabsTrigger 
              value="recommended" 
              className="data-[state=active]:bg-primary/20 gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Empfohlen ({recommendedActivities.length})
            </TabsTrigger>
            <TabsTrigger 
              value="selected" 
              className="data-[state=active]:bg-primary/20"
            >
              Ausgewählt ({selectedActivities.length})
            </TabsTrigger>
            {categoryTabs.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="data-[state=active]:bg-primary/20 gap-1"
              >
                <span>{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="text-xs text-muted-foreground">({cat.count})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Quick action for recommended */}
        {activeCategory === 'recommended' && (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAllRecommended}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Alle Empfehlungen auswählen
            </Button>
          </div>
        )}

        {/* Activity Grid */}
        <TabsContent value={activeCategory} className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {filteredActivities.map((activity) => {
                  const selected = isSelected(activity);
                  const isRecommended = recommendedActivities.some(a => a.value === activity.value);
                  
                  return (
                    <motion.label
                      key={activity.value}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-background/50 hover:border-primary/50 hover:bg-background/80"
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleActivity(activity)}
                        className="flex-shrink-0"
                      />
                      <span className="text-xl flex-shrink-0">{activity.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {translateLabel(activity.label)}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {ACTIVITY_CATEGORIES[activity.category]?.label}
                        </span>
                      </div>
                      
                      {/* Recommended badge */}
                      {isRecommended && !selected && (
                        <Sparkles className="w-3.5 h-3.5 text-primary absolute top-2 right-2" />
                      )}
                      
                      {/* Selected checkmark */}
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.label>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Empty state */}
            {filteredActivities.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">{t('dashboard.form.activitySelector.noResults')}</p>
                <p className="text-sm">{t('dashboard.form.activitySelector.noResultsHint')}</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Selected activities summary */}
      {selectedActivities.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('dashboard.form.activitySelector.selectedActivities')}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => onSelectionChange([])}
            >
              {t('dashboard.form.activitySelector.removeAll')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedActivities.map((activity) => (
              <Badge
                key={activity.value}
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-secondary/80"
                onClick={() => toggleActivity(activity)}
              >
                <span>{activity.emoji}</span>
                <span>{translateLabel(activity.label)}</span>
                <X className="w-3 h-3 ml-1 text-muted-foreground" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
