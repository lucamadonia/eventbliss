import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Shuffle, X, Baby, Wine, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GameCard } from "./GameCard";
import { FilterPills } from "./FilterPills";
import { 
  gamesLibrary, 
  GameCategory, 
  EventType, 
  Difficulty,
  getRandomGame,
  GameItem
} from "@/lib/games-library";
import { cn } from "@/lib/utils";

const categories: { id: GameCategory | "all"; emoji: string }[] = [
  { id: 'all', emoji: '✨' },
  { id: 'jga_games', emoji: '🎉' },
  { id: 'family_games', emoji: '👨‍👩‍👧‍👦' },
  { id: 'wedding_games', emoji: '💒' },
  { id: 'party_games', emoji: '🥳' },
  { id: 'outdoor_games', emoji: '🌳' },
  { id: 'team_games', emoji: '🤝' },
  { id: 'icebreaker', emoji: '🤗' },
  { id: 'kids_friendly', emoji: '👶' },
];

const eventTypes: { id: EventType; emoji: string }[] = [
  { id: 'bachelor', emoji: '🤵' },
  { id: 'bachelorette', emoji: '👰' },
  { id: 'wedding', emoji: '💒' },
  { id: 'birthday', emoji: '🎂' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'team', emoji: '👥' },
  { id: 'trip', emoji: '✈️' },
];

interface GamesLibraryProps {
  onAddToPlanner?: (game: GameItem) => void;
  preFilterEventType?: EventType;
}

export const GamesLibrary = ({ onAddToPlanner, preFilterEventType }: GamesLibraryProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | "all">("all");
  const [selectedEventType, setSelectedEventType] = useState<EventType | "all">(
    preFilterEventType || "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [showKidsFriendlyOnly, setShowKidsFriendlyOnly] = useState(false);
  const [showAlcoholFreeOnly, setShowAlcoholFreeOnly] = useState(false);
  const [showClassicsOnly, setShowClassicsOnly] = useState(false);
  const [randomGame, setRandomGame] = useState<GameItem | null>(null);

  const filteredGames = useMemo(() => {
    return gamesLibrary.filter(game => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = t(game.nameKey).toLowerCase().includes(query);
        const descMatch = t(game.descriptionKey).toLowerCase().includes(query);
        const tagMatch = game.tags.some(tag => tag.includes(query));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      if (selectedCategory !== "all" && !game.categories.includes(selectedCategory)) {
        return false;
      }

      if (selectedEventType !== "all" && !game.eventTypes.includes(selectedEventType)) {
        return false;
      }

      if (selectedDifficulty !== "all" && game.difficulty !== selectedDifficulty) {
        return false;
      }

      if (showKidsFriendlyOnly && !game.isKidsFriendly) {
        return false;
      }

      if (showAlcoholFreeOnly && game.isAlcoholRelated) {
        return false;
      }

      if (showClassicsOnly && !game.isClassic) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedEventType, selectedDifficulty, showKidsFriendlyOnly, showAlcoholFreeOnly, showClassicsOnly, t]);

  const handleRandomGame = () => {
    const random = getRandomGame({
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      eventType: selectedEventType !== "all" ? selectedEventType : undefined,
      kidsFriendly: showKidsFriendlyOnly || undefined,
      alcoholFree: showAlcoholFreeOnly || undefined,
    });
    setRandomGame(random || null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedEventType(preFilterEventType || "all");
    setSelectedDifficulty("all");
    setShowKidsFriendlyOnly(false);
    setShowAlcoholFreeOnly(false);
    setShowClassicsOnly(false);
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategory !== "all" || 
    (selectedEventType !== "all" && selectedEventType !== preFilterEventType) ||
    selectedDifficulty !== "all" ||
    showKidsFriendlyOnly ||
    showAlcoholFreeOnly ||
    showClassicsOnly;

  const categoryOptions = categories.map(cat => ({
    id: cat.id,
    emoji: cat.emoji,
    label: cat.id === "all" 
      ? t('gamesLibrary.filters.all') 
      : t(`gamesLibrary.categories.${cat.id}`),
    count: cat.id === "all" 
      ? gamesLibrary.length 
      : gamesLibrary.filter(g => g.categories.includes(cat.id as GameCategory)).length
  }));

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('gamesLibrary.searchPlaceholder')}
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
        
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 h-12 px-4">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t('gamesLibrary.filters.title')}</span>
                {hasActiveFilters && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                  >
                    !
                  </motion.span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('gamesLibrary.filters.title')}</SheetTitle>
                <SheetDescription>
                  {t('gamesLibrary.filters.description')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label>{t('gamesLibrary.filters.category')}</Label>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as GameCategory | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('gamesLibrary.filters.all')}</SelectItem>
                      {categories.slice(1).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.emoji} {t(`gamesLibrary.categories.${cat.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label>{t('gamesLibrary.filters.eventType')}</Label>
                  <Select value={selectedEventType} onValueChange={(v) => setSelectedEventType(v as EventType | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('gamesLibrary.filters.all')}</SelectItem>
                      {eventTypes.map(et => (
                        <SelectItem key={et.id} value={et.id}>
                          {et.emoji} {t(`eventTypes.${et.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>{t('gamesLibrary.filters.difficulty')}</Label>
                  <Select value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as Difficulty | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('gamesLibrary.filters.all')}</SelectItem>
                      <SelectItem value="easy">🟢 {t('gamesLibrary.difficulty.easy')}</SelectItem>
                      <SelectItem value="medium">🟡 {t('gamesLibrary.difficulty.medium')}</SelectItem>
                      <SelectItem value="hard">🔴 {t('gamesLibrary.difficulty.hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggles */}
                <div className="space-y-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="kidsFriendly"
                      checked={showKidsFriendlyOnly}
                      onCheckedChange={(c) => setShowKidsFriendlyOnly(c === true)}
                    />
                    <Label htmlFor="kidsFriendly" className="flex items-center gap-2 cursor-pointer">
                      <Baby className="w-4 h-4 text-green-500" />
                      {t('gamesLibrary.filters.kidsFriendly')}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="alcoholFree"
                      checked={showAlcoholFreeOnly}
                      onCheckedChange={(c) => setShowAlcoholFreeOnly(c === true)}
                    />
                    <Label htmlFor="alcoholFree" className="flex items-center gap-2 cursor-pointer">
                      <Wine className="w-4 h-4 text-purple-500" />
                      {t('gamesLibrary.filters.alcoholFree')}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="classics"
                      checked={showClassicsOnly}
                      onCheckedChange={(c) => setShowClassicsOnly(c === true)}
                    />
                    <Label htmlFor="classics" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-4 h-4 text-amber-500" />
                      {t('gamesLibrary.filters.classic')}
                    </Label>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    {t('gamesLibrary.filters.clear')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleRandomGame} 
              className="gap-2 h-12 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gamesLibrary.random')}</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Category Pills */}
      <FilterPills
        options={categoryOptions}
        value={selectedCategory}
        onChange={(v) => setSelectedCategory(v as GameCategory | "all")}
      />

      {/* Random Game Display */}
      <AnimatePresence>
        {randomGame && (
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
                  {t('gamesLibrary.randomPick')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setRandomGame(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-w-md">
                <GameCard game={randomGame} onAddToPlanner={onAddToPlanner} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <motion.p 
        className="text-sm text-muted-foreground flex items-center gap-2"
        key={filteredGames.length}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-semibold text-foreground">{filteredGames.length}</span>
        {t('gamesLibrary.resultsCount', { count: filteredGames.length })}
      </motion.p>

      {/* Games Grid with Staggered Animation */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <GameCard 
                game={game} 
                onAddToPlanner={onAddToPlanner}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
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
            🎮
          </motion.div>
          <p className="text-muted-foreground mb-4 text-lg">
            {t('gamesLibrary.noResults')}
          </p>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            {t('gamesLibrary.filters.clear')}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
