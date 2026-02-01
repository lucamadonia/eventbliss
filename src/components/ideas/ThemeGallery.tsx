import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shuffle, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeCard } from "./ThemeCard";
import { FilterPills } from "./FilterPills";
import { 
  themeIdeas, 
  themeCategories,
  ThemeCategory,
  EventType,
  getRandomTheme,
  ThemeItem
} from "@/lib/theme-ideas-library";

const eventTypes: { id: EventType | "all"; emoji: string }[] = [
  { id: 'all', emoji: '✨' },
  { id: 'bachelor', emoji: '🤵' },
  { id: 'bachelorette', emoji: '👰' },
  { id: 'wedding', emoji: '💒' },
  { id: 'birthday', emoji: '🎂' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'team', emoji: '👥' },
  { id: 'trip', emoji: '✈️' },
];

interface ThemeGalleryProps {
  preFilterEventType?: EventType;
}

export const ThemeGallery = ({ preFilterEventType }: ThemeGalleryProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory | "all">("all");
  const [selectedEventType, setSelectedEventType] = useState<EventType | "all">(
    preFilterEventType || "all"
  );
  const [randomTheme, setRandomTheme] = useState<ThemeItem | null>(null);

  const filteredThemes = useMemo(() => {
    return themeIdeas.filter(theme => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = t(theme.nameKey).toLowerCase().includes(query);
        const descMatch = t(theme.descriptionKey).toLowerCase().includes(query);
        const tagMatch = theme.tags.some(tag => tag.includes(query));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      if (selectedCategory !== "all" && theme.category !== selectedCategory) {
        return false;
      }

      if (selectedEventType !== "all" && !theme.eventTypes.includes(selectedEventType)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedEventType, t]);

  const handleRandomTheme = () => {
    const random = getRandomTheme({
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      eventType: selectedEventType !== "all" ? selectedEventType : undefined,
    });
    setRandomTheme(random || null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedEventType(preFilterEventType || "all");
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategory !== "all" || 
    (selectedEventType !== "all" && selectedEventType !== preFilterEventType);

  const categoryOptions = [
    { id: "all" as const, emoji: "✨", label: t('gamesLibrary.filters.all'), count: themeIdeas.length },
    ...themeCategories.map(cat => ({
      id: cat.id,
      emoji: cat.emoji,
      label: t(cat.labelKey),
      count: themeIdeas.filter(theme => theme.category === cat.id).length
    }))
  ];

  const eventTypeOptions = eventTypes.map(et => ({
    id: et.id,
    emoji: et.emoji,
    label: et.id === "all" 
      ? t('gamesLibrary.filters.all') 
      : t(`eventTypes.${et.id}`)
  }));

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('gamesLibrary.searchThemesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base bg-card/50 border-border/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={handleRandomTheme} 
            className="gap-2 h-12 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('gamesLibrary.randomTheme')}</span>
          </Button>
        </motion.div>
      </div>

      {/* Category Pills */}
      <FilterPills
        options={categoryOptions}
        value={selectedCategory}
        onChange={(v) => setSelectedCategory(v as ThemeCategory | "all")}
      />

      {/* Event Type Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2 font-medium">
          {t('gamesLibrary.filters.eventType')}:
        </span>
        <FilterPills
          options={eventTypeOptions}
          value={selectedEventType}
          onChange={(v) => setSelectedEventType(v as EventType | "all")}
        />
      </div>

      {/* Random Theme Display */}
      <AnimatePresence>
        {randomTheme && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-accent/15 border border-primary/30 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('gamesLibrary.randomThemePick')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setRandomTheme(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-w-md">
                <ThemeCard theme={randomTheme} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <motion.p 
        className="text-sm text-muted-foreground flex items-center gap-2"
        key={filteredThemes.length}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-semibold text-foreground">{filteredThemes.length}</span>
        {t('gamesLibrary.themesCount', { count: filteredThemes.length })}
      </motion.p>

      {/* Themes Grid with Staggered Animation */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredThemes.map((theme, index) => (
            <motion.div
              key={theme.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeCard theme={theme} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredThemes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            🎨
          </motion.div>
          <p className="text-muted-foreground mb-4 text-lg">
            {t('gamesLibrary.noThemesFound')}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              {t('gamesLibrary.filters.clear')}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};
