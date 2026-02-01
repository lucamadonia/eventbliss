import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Filter, Shuffle, X, Baby, Wine, Star } from "lucide-react";
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
import { 
  gamesLibrary, 
  GameCategory, 
  EventType, 
  Difficulty,
  getRandomGame,
  GameItem
} from "@/lib/games-library";

const categories: { id: GameCategory; emoji: string }[] = [
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
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = t(game.nameKey).toLowerCase().includes(query);
        const descMatch = t(game.descriptionKey).toLowerCase().includes(query);
        const tagMatch = game.tags.some(tag => tag.includes(query));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && !game.categories.includes(selectedCategory)) {
        return false;
      }

      // Event type filter
      if (selectedEventType !== "all" && !game.eventTypes.includes(selectedEventType)) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && game.difficulty !== selectedDifficulty) {
        return false;
      }

      // Kids friendly filter
      if (showKidsFriendlyOnly && !game.isKidsFriendly) {
        return false;
      }

      // Alcohol free filter
      if (showAlcoholFreeOnly && game.isAlcoholRelated) {
        return false;
      }

      // Classics only filter
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('gamesLibrary.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {t('gamesLibrary.filters.title')}
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    !
                  </Badge>
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
                      {categories.map(cat => (
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="kidsFriendly"
                      checked={showKidsFriendlyOnly}
                      onCheckedChange={(c) => setShowKidsFriendlyOnly(c === true)}
                    />
                    <Label htmlFor="kidsFriendly" className="flex items-center gap-1 cursor-pointer">
                      <Baby className="w-4 h-4" />
                      {t('gamesLibrary.filters.kidsFriendly')}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="alcoholFree"
                      checked={showAlcoholFreeOnly}
                      onCheckedChange={(c) => setShowAlcoholFreeOnly(c === true)}
                    />
                    <Label htmlFor="alcoholFree" className="flex items-center gap-1 cursor-pointer">
                      <Wine className="w-4 h-4" />
                      {t('gamesLibrary.filters.alcoholFree')}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="classics"
                      checked={showClassicsOnly}
                      onCheckedChange={(c) => setShowClassicsOnly(c === true)}
                    />
                    <Label htmlFor="classics" className="flex items-center gap-1 cursor-pointer">
                      <Star className="w-4 h-4" />
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

          <Button variant="outline" onClick={handleRandomGame} className="gap-2">
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('gamesLibrary.random')}</span>
          </Button>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory("all")}
        >
          {t('gamesLibrary.filters.all')} ({gamesLibrary.length})
        </Badge>
        {categories.map(cat => {
          const count = gamesLibrary.filter(g => g.categories.includes(cat.id)).length;
          return (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.emoji} {t(`gamesLibrary.categories.${cat.id}`)} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Random Game Display */}
      {randomGame && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              {t('gamesLibrary.randomPick')}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setRandomGame(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <GameCard game={randomGame} onAddToPlanner={onAddToPlanner} />
        </motion.div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {t('gamesLibrary.resultsCount', { count: filteredGames.length })}
      </p>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            onAddToPlanner={onAddToPlanner}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('gamesLibrary.noResults')}
          </p>
          <Button variant="outline" onClick={clearFilters}>
            {t('gamesLibrary.filters.clear')}
          </Button>
        </div>
      )}
    </div>
  );
};
