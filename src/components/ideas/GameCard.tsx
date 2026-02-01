import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, Users, Star, Baby, Wine, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameItem } from "@/lib/games-library";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: GameItem;
  onAddToPlanner?: (game: GameItem) => void;
}

export const GameCard = ({ game, onAddToPlanner }: GameCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-500/20 text-green-500 border-green-500/30",
    medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    hard: "bg-red-500/20 text-red-500 border-red-500/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="p-4 h-full flex flex-col">
        {/* Header with Emoji and Title */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{game.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {t(game.nameKey)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {t(game.descriptionKey)}
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={cn(difficultyColors[game.difficulty])}>
            <Star className="w-3 h-3 mr-1" />
            {t(`gamesLibrary.difficulty.${game.difficulty}`)}
          </Badge>
          
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Users className="w-3 h-3 mr-1" />
            {game.groupSize.min}{game.groupSize.max ? `-${game.groupSize.max}` : '+'}
          </Badge>
          
          <Badge variant="outline" className="bg-muted">
            <Clock className="w-3 h-3 mr-1" />
            {game.duration}
          </Badge>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {game.isKidsFriendly && (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
              <Baby className="w-3 h-3 mr-1" />
              {t('gamesLibrary.filters.kidsFriendly')}
            </Badge>
          )}
          {game.isAlcoholRelated && (
            <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600">
              <Wine className="w-3 h-3 mr-1" />
              {t('gamesLibrary.filters.drinking')}
            </Badge>
          )}
          {game.isClassic && (
            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
              ⭐ {t('gamesLibrary.filters.classic')}
            </Badge>
          )}
        </div>

        {/* Expandable Instructions */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mb-3"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t('gamesLibrary.hideInstructions')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t('gamesLibrary.showInstructions')}
            </>
          )}
        </button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground mb-2">
                {t(game.instructionsKey)}
              </p>
              
              {game.materials && game.materials.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-foreground">
                    {t('gamesLibrary.materials')}:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {game.materials.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-2">
          {onAddToPlanner && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onAddToPlanner(game)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('gamesLibrary.addToPlanner')}
            </Button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
