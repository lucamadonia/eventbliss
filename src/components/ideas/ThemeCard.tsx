import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Music, 
  Shirt, 
  Lightbulb, 
  Copy, 
  Check,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeItem } from "@/lib/theme-ideas-library";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThemeCardProps {
  theme: ThemeItem;
  index?: number;
}

export const ThemeCard = ({ theme, index = 0 }: ThemeCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = async (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast.success(`${color} ${t('gamesLibrary.copied')}`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard className="h-full flex flex-col overflow-hidden group relative">
        {/* Color Palette Preview - Expanded */}
        <div className="relative h-20 overflow-hidden">
          <div className="flex h-full">
            <motion.div 
              className="flex-1 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: theme.colorPalette.primary }}
              whileHover={{ flex: 2 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => handleCopyColor(theme.colorPalette.primary, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                {copiedColor === theme.colorPalette.primary ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
            </motion.div>
            <motion.div 
              className="flex-1 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: theme.colorPalette.secondary }}
              whileHover={{ flex: 2 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => handleCopyColor(theme.colorPalette.secondary, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                {copiedColor === theme.colorPalette.secondary ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
            </motion.div>
            <motion.div 
              className="flex-1 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: theme.colorPalette.accent }}
              whileHover={{ flex: 2 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => handleCopyColor(theme.colorPalette.accent, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                {copiedColor === theme.colorPalette.accent ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
            </motion.div>
          </div>

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* Header with Emoji and Title */}
          <div className="flex items-start gap-3 mb-3">
            <motion.span 
              className="text-4xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
            >
              {theme.emoji}
            </motion.span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-foreground line-clamp-1 text-lg">
                {t(theme.nameKey)}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {t(theme.descriptionKey)}
              </p>
            </div>
          </div>

          {/* Category and Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {t(`gamesLibrary.themeCategories.${theme.category}`)}
            </Badge>
            {theme.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Expandable Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between text-muted-foreground hover:text-foreground mb-2"
          >
            <span className="text-sm">
              {isExpanded ? t('gamesLibrary.hideDetails') : t('gamesLibrary.showDetails')}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Dress Code */}
                {theme.dressCode && (
                  <motion.div 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Shirt className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        {t('gamesLibrary.dressCode')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {theme.dressCode}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Music Style */}
                {theme.musicStyle && (
                  <motion.div 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Music className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        {t('gamesLibrary.music')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {theme.musicStyle}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Decoration Tips */}
                <motion.div 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      {t('gamesLibrary.decorationTips')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {theme.decorationTips.join(', ')}
                    </span>
                  </div>
                </motion.div>

                {/* Color Palette Details */}
                <motion.div 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <Palette className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-foreground block mb-2">
                      {t('gamesLibrary.colorPalette')}
                    </span>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(theme.colorPalette).map(([name, color]) => (
                        <motion.button
                          key={name}
                          className="flex items-center gap-2 group/color"
                          onClick={(e) => handleCopyColor(color, e)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border shadow-sm group-hover/color:ring-2 group-hover/color:ring-primary/30 transition-all"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-muted-foreground uppercase group-hover/color:text-foreground transition-colors">
                            {copiedColor === color ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              color
                            )}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl">
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `0 0 40px ${theme.colorPalette.primary}40`
            }}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
};
