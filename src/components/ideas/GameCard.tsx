import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Users, 
  Baby, 
  Wine, 
  Plus, 
  RotateCw, 
  Heart,
  Copy,
  Share2,
  Sparkles,
  Check,
  Timer,
  Volume2
} from "lucide-react";
import { useState, forwardRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GameItem, GameCategory } from "@/lib/games-library";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GameTimer } from "./GameTimer";
import { GameAudioPlayer } from "./GameAudioPlayer";
import { GameInstructionsSection } from "./GameInstructionsSection";

interface GameCardProps {
  game: GameItem;
  onAddToPlanner?: (game: GameItem) => void;
  index?: number;
}

const categoryGradients: Record<GameCategory, string> = {
  jga_games: "from-purple-500/40 via-pink-500/30 to-transparent",
  family_games: "from-blue-500/40 via-cyan-500/30 to-transparent",
  wedding_games: "from-rose-500/40 via-amber-500/30 to-transparent",
  party_games: "from-orange-500/40 via-yellow-500/30 to-transparent",
  outdoor_games: "from-green-500/40 via-emerald-500/30 to-transparent",
  team_games: "from-indigo-500/40 via-blue-500/30 to-transparent",
  icebreaker: "from-cyan-500/40 via-teal-500/30 to-transparent",
  kids_friendly: "from-pink-500/40 via-purple-500/30 to-transparent",
};

const categoryGlows: Record<GameCategory, string> = {
  jga_games: "drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]",
  family_games: "drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]",
  wedding_games: "drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]",
  party_games: "drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]",
  outdoor_games: "drop-shadow-[0_0_25px_rgba(34,197,94,0.5)]",
  team_games: "drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]",
  icebreaker: "drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]",
  kids_friendly: "drop-shadow-[0_0_25px_rgba(236,72,153,0.5)]",
};

const getDifficultyPercent = (difficulty: string): string => {
  switch (difficulty) {
    case "easy": return "33%";
    case "medium": return "66%";
    case "hard": return "100%";
    default: return "50%";
  }
};

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ game, onAddToPlanner, index = 0 }, ref) => {
    const { t, i18n } = useTranslation();
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);

    const primaryCategory = game.categories[0] || "party_games";
    const instructions = t(game.instructionsKey);

    const handleCopyInstructions = async () => {
      const instructions = t(game.instructionsKey);
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      toast.success(t('gamesLibrary.copied'));
      setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
      const gameName = t(game.nameKey);
      const instructions = t(game.instructionsKey);
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: gameName,
            text: instructions,
          });
        } catch {
          // User cancelled
        }
      } else {
        await handleCopyInstructions();
      }
    };

    const handleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFavorite(!isFavorite);
      toast.success(
        isFavorite 
          ? t('gamesLibrary.removedFromFavorites') 
          : t('gamesLibrary.addedToFavorites')
      );
    };

    return (
      <motion.div
        ref={ref}
        className="relative h-[380px] will-change-transform"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            // Front Side
            <motion.div
              key="front"
              className="absolute inset-0 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="h-full overflow-hidden relative group">
                {/* Gradient Header */}
                <div className={cn(
                  "absolute inset-x-0 top-0 h-32 bg-gradient-to-br transition-opacity duration-500",
                  categoryGradients[primaryCategory],
                  "group-hover:opacity-80"
                )} />

                {/* Favorite Button */}
                <motion.button
                  className="absolute top-3 right-3 z-20 p-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50"
                  whileTap={{ scale: 0.8 }}
                  onClick={handleFavorite}
                >
                  <Heart 
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isFavorite 
                        ? "fill-red-500 text-red-500 scale-110" 
                        : "text-muted-foreground hover:text-red-400"
                    )}
                  />
                </motion.button>

                {/* Large Emoji with Glow */}
                <div className="relative z-10 flex justify-center pt-8">
                  <span 
                    className={cn(
                      "text-6xl transition-all duration-300",
                      categoryGlows[primaryCategory]
                    )}
                  >
                    {game.emoji}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 pt-4">
                  <h3 className="font-display font-bold text-lg text-center mb-2 line-clamp-1">
                    {t(game.nameKey)}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground text-center line-clamp-2 mb-3">
                    {t(game.descriptionKey)}
                  </p>

                  {/* Difficulty Meter */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{t('gamesLibrary.difficulty.label')}</span>
                      <span className={cn(
                        "font-medium",
                        game.difficulty === "easy" && "text-green-500",
                        game.difficulty === "medium" && "text-amber-500",
                        game.difficulty === "hard" && "text-red-500"
                      )}>
                        {t(`gamesLibrary.difficulty.${game.difficulty}`)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-400 transition-all duration-500"
                        style={{ width: getDifficultyPercent(game.difficulty) }}
                      />
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-2 mb-3 justify-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Users className="w-3 h-3 mr-1" />
                      {game.groupSize.min}{game.groupSize.max ? `-${game.groupSize.max}` : '+'}
                    </Badge>
                    
                    <Badge variant="outline" className="bg-muted/80">
                      <Clock className="w-3 h-3 mr-1" />
                      {game.duration}
                    </Badge>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {game.isKidsFriendly && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                        <Baby className="w-3 h-3 mr-1" />
                        {t('gamesLibrary.filters.kidsFriendly')}
                      </Badge>
                    )}
                    {game.isAlcoholRelated && (
                      <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 text-xs">
                        <Wine className="w-3 h-3 mr-1" />
                        {t('gamesLibrary.filters.drinking')}
                      </Badge>
                    )}
                    {game.isClassic && (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t('gamesLibrary.filters.classic')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Flip Button */}
                <button 
                  onClick={() => setIsFlipped(true)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium text-sm"
                >
                  <RotateCw className="w-4 h-4" />
                  {t('gamesLibrary.showInstructions')}
                </button>

                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            // Back Side - Instructions
            <motion.div
              key="back"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="h-full p-5 flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{game.emoji}</span>
                    <h4 className="font-display font-semibold text-lg line-clamp-1">
                      {t(game.nameKey)}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                      title={t('gamesLibrary.tts.title')}
                    >
                      <Volume2 className={cn("w-4 h-4", showAudioPlayer && "text-primary")} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setShowTimer(!showTimer)}
                      title={t('gamesLibrary.timer.title')}
                    >
                      <Timer className={cn("w-4 h-4", showTimer && "text-primary")} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCopyInstructions}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Audio Player */}
                <AnimatePresence>
                  {showAudioPlayer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <GameAudioPlayer 
                        text={instructions} 
                        language={i18n.language}
                        compact
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer */}
                <AnimatePresence>
                  {showTimer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <GameTimer 
                        compact 
                        onClose={() => setShowTimer(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Instructions */}
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <GameInstructionsSection instructions={instructions} />
                  
                  {game.materials && game.materials.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                      <span className="font-medium text-sm text-foreground block mb-1">
                        {t('gamesLibrary.materials')}:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {game.materials.join(', ')}
                      </span>
                    </div>
                  )}
                </ScrollArea>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsFlipped(false)}
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    {t('gamesLibrary.back')}
                  </Button>
                  
                  {onAddToPlanner && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                      onClick={() => onAddToPlanner(game)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('gamesLibrary.addToPlanner')}
                    </Button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

GameCard.displayName = "GameCard";
