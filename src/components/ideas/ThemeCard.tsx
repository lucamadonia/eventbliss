import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Palette, Music, Shirt, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { ThemeItem } from "@/lib/theme-ideas-library";

interface ThemeCardProps {
  theme: ThemeItem;
}

export const ThemeCard = ({ theme }: ThemeCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="p-4 h-full flex flex-col overflow-hidden">
        {/* Color Palette Preview */}
        <div className="flex gap-1 mb-3 rounded-lg overflow-hidden h-2">
          <div 
            className="flex-1" 
            style={{ backgroundColor: theme.colorPalette.primary }}
          />
          <div 
            className="flex-1" 
            style={{ backgroundColor: theme.colorPalette.secondary }}
          />
          <div 
            className="flex-1" 
            style={{ backgroundColor: theme.colorPalette.accent }}
          />
        </div>

        {/* Header with Emoji and Title */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{theme.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {t(theme.nameKey)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {t(theme.descriptionKey)}
            </p>
          </div>
        </div>

        {/* Category and Event Types */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="secondary" className="text-xs">
            {t(`gamesLibrary.themeCategories.${theme.category}`)}
          </Badge>
          {theme.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mb-3"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t('gamesLibrary.hideDetails')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t('gamesLibrary.showDetails')}
            </>
          )}
        </button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Dress Code */}
            {theme.dressCode && (
              <div className="flex items-start gap-2">
                <Shirt className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-foreground block">
                    {t('gamesLibrary.dressCode')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {theme.dressCode}
                  </span>
                </div>
              </div>
            )}

            {/* Music Style */}
            {theme.musicStyle && (
              <div className="flex items-start gap-2">
                <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-foreground block">
                    {t('gamesLibrary.music')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {theme.musicStyle}
                  </span>
                </div>
              </div>
            )}

            {/* Decoration Tips */}
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground block">
                  {t('gamesLibrary.decorationTips')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {theme.decorationTips.join(', ')}
                </span>
              </div>
            </div>

            {/* Color Palette Details */}
            <div className="flex items-start gap-2">
              <Palette className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground block">
                  {t('gamesLibrary.colorPalette')}
                </span>
                <div className="flex gap-2 mt-1">
                  {Object.entries(theme.colorPalette).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground uppercase">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
};
