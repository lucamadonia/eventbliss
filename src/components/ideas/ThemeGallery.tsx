import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Shuffle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeCard } from "./ThemeCard";
import { 
  themeIdeas, 
  themeCategories,
  ThemeCategory,
  EventType,
  getRandomTheme,
  ThemeItem
} from "@/lib/theme-ideas-library";

const eventTypes: { id: EventType; emoji: string }[] = [
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
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = t(theme.nameKey).toLowerCase().includes(query);
        const descMatch = t(theme.descriptionKey).toLowerCase().includes(query);
        const tagMatch = theme.tags.some(tag => tag.includes(query));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && theme.category !== selectedCategory) {
        return false;
      }

      // Event type filter
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

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('gamesLibrary.searchThemesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" onClick={handleRandomTheme} className="gap-2">
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">{t('gamesLibrary.randomTheme')}</span>
        </Button>
      </div>

      {/* Category Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory("all")}
        >
          {t('gamesLibrary.filters.all')} ({themeIdeas.length})
        </Badge>
        {themeCategories.map(cat => {
          const count = themeIdeas.filter(t => t.category === cat.id).length;
          return (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.emoji} {t(cat.labelKey)} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Event Type Filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center mr-2">
          {t('gamesLibrary.filters.eventType')}:
        </span>
        <Badge
          variant={selectedEventType === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedEventType("all")}
        >
          {t('gamesLibrary.filters.all')}
        </Badge>
        {eventTypes.map(et => (
          <Badge
            key={et.id}
            variant={selectedEventType === et.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedEventType(et.id)}
          >
            {et.emoji} {t(`eventTypes.${et.id}`)}
          </Badge>
        ))}
      </div>

      {/* Random Theme Display */}
      {randomTheme && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              {t('gamesLibrary.randomThemePick')}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setRandomTheme(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ThemeCard theme={randomTheme} />
        </motion.div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {t('gamesLibrary.themesCount', { count: filteredThemes.length })}
      </p>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredThemes.map(theme => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>

      {/* Empty State */}
      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('gamesLibrary.noThemesFound')}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              {t('gamesLibrary.filters.clear')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
