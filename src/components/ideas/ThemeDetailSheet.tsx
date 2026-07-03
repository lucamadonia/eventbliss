/**
 * ThemeDetailSheet — immersive full-screen detail view for a party theme.
 *
 * The signature: the whole sheet is dipped in the theme's OWN color palette.
 * Hero wash, section accents and swatches all derive from the three palette
 * colors, so each of the 56 themes gets a distinct look from real data while
 * text and surfaces stay on the app's neutral dark tokens.
 *
 * Surfaces the previously invisible theme content: translated tips, event
 * types, decoration ideas, dress code, music style and the matching
 * activities resolved against the games library (with deep links into
 * playable games where available).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X, Lightbulb, Shirt, Music, Gamepad2, Share2, Check, Copy,
  Users, Clock, Play, PartyPopper,
} from "lucide-react";
import type { ThemeItem } from "@/lib/theme-ideas-library";
import { gamesLibrary } from "@/lib/games-library";
import { ideaToPlayable } from "@/lib/playable-games";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";

/** 6-digit hex + alpha (0..1) → 8-digit hex */
const tint = (hex: string, alpha: number) =>
  hex + Math.round(alpha * 255).toString(16).padStart(2, "0");

const CATEGORY_LABEL_KEY: Record<string, string> = {
  retro: "native.ideas.themeCategories.retro",
  elegant: "native.ideas.themeCategories.elegant",
  casual: "native.ideas.themeCategories.casual",
  adventure: "native.ideas.themeCategories.abenteuer",
  cultural: "native.ideas.themeCategories.kultur",
  seasonal: "native.ideas.themeCategories.saison",
  costume: "native.ideas.themeCategories.kostuem",
  relaxation: "native.ideas.themeCategories.wellness",
};

function SectionLabel({ icon: Icon, color, children }: { icon: typeof Lightbulb; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: tint(color, 0.16) }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
    </div>
  );
}

export function ThemeDetailSheet({ theme, onClose }: { theme: ThemeItem | null; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const activities = useMemo(() => {
    if (!theme) return [];
    return theme.suggestedActivities
      .map((id) => gamesLibrary.find((g) => g.id === id))
      .filter((g): g is NonNullable<typeof g> => !!g);
  }, [theme]);

  const copyHex = (hex: string) => {
    haptics.light();
    navigator.clipboard?.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1600);
    });
  };

  const share = () => {
    haptics.medium();
    if (!theme) return;
    const text = t("native.ideas.themeDetail.shareText", {
      name: t(theme.nameKey),
      description: t(theme.descriptionKey),
    });
    if (navigator.share) {
      navigator.share({ title: t(theme.nameKey), text }).catch(() => undefined);
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <AnimatePresence>
      {theme && (
        <motion.div
          key={theme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "12%", opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: spring.soft }}
            exit={{ y: "10%", opacity: 0, transition: { duration: 0.2 } }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 top-[max(env(safe-area-inset-top),12px)] rounded-t-[32px] overflow-hidden bg-background border-t border-x border-border"
          >
            {/* AI-generated cover + palette wash — the theme sets the mood */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] overflow-hidden">
              <img
                src={`/images/themes/${theme.id}.webp`}
                alt=""
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="w-full h-full object-cover opacity-70"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${tint(theme.colorPalette.primary, 0.18)} 0%, rgba(8,8,14,0.35) 45%, hsl(var(--background)) 100%)`,
                }}
              />
            </div>

            {/* Close */}
            <button
              onClick={() => { haptics.light(); onClose(); }}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-background/60 backdrop-blur-md border border-border flex items-center justify-center"
              aria-label={t("common.close", "Schließen")}
            >
              <X className="w-[18px] h-[18px] text-foreground/80" />
            </button>

            <div className="relative h-full overflow-y-auto native-scroll overscroll-contain pb-10">
              {/* Drag-handle affordance */}
              <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-foreground/20" />
              </div>

              {/* Hero */}
              <div className="px-6 pt-4 pb-6 text-center">
                <motion.div
                  className="text-7xl inline-block"
                  style={{ filter: `drop-shadow(0 0 32px ${tint(theme.colorPalette.accent, 0.55)})` }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {theme.emoji}
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-foreground mt-3 leading-tight">
                  {t(theme.nameKey)}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-[300px] mx-auto leading-relaxed">
                  {t(theme.descriptionKey)}
                </p>

                {/* Category + event-type chips */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                    style={{
                      color: theme.colorPalette.primary,
                      borderColor: tint(theme.colorPalette.primary, 0.35),
                      backgroundColor: tint(theme.colorPalette.primary, 0.12),
                    }}
                  >
                    {t(CATEGORY_LABEL_KEY[theme.category] ?? theme.category)}
                  </span>
                  {theme.eventTypes.map((ev) => (
                    <span
                      key={ev}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-foreground/[0.06] border border-border text-muted-foreground"
                    >
                      {t(`native.ideas.eventTypes.${ev}`, ev)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-5 space-y-5">
                {/* Color palette — tap a swatch to copy its hex */}
                <div>
                  <SectionLabel icon={PartyPopper} color={theme.colorPalette.primary}>
                    {t("native.ideas.themeDetail.palette")}
                  </SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {[theme.colorPalette.primary, theme.colorPalette.secondary, theme.colorPalette.accent].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => copyHex(hex)}
                        className="rounded-2xl border border-border overflow-hidden text-left active:scale-[0.97] transition-transform"
                      >
                        <div className="h-14" style={{ backgroundColor: hex }} />
                        <div className="px-2.5 py-1.5 flex items-center justify-between bg-foreground/[0.04]">
                          <span className="text-[11px] font-mono text-foreground/80">{hex.toUpperCase()}</span>
                          {copiedHex === hex
                            ? <Check className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3 text-muted-foreground/60" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {copiedHex && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-emerald-400 mt-1.5 text-center"
                      >
                        {t("native.ideas.themeDetail.copied")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tip — the theme's translated hero advice */}
                <div
                  className="rounded-2xl p-4 border"
                  style={{
                    borderColor: tint(theme.colorPalette.primary, 0.25),
                    backgroundColor: tint(theme.colorPalette.primary, 0.07),
                  }}
                >
                  <SectionLabel icon={Lightbulb} color={theme.colorPalette.primary}>
                    {t("native.ideas.themeDetail.tip")}
                  </SectionLabel>
                  <p className="text-sm text-foreground/85 leading-relaxed">{t(theme.tipsKey)}</p>
                </div>

                {/* Decoration ideas */}
                {theme.decorationTips.length > 0 && (
                  <div>
                    <SectionLabel icon={PartyPopper} color={theme.colorPalette.secondary}>
                      {t("native.ideas.themeDetail.decoration")}
                    </SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {theme.decorationTips.map((tip) => (
                        <span
                          key={tip}
                          className="px-3 py-1.5 rounded-full bg-foreground/[0.05] border border-border text-xs text-foreground/85"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dress code + music */}
                {(theme.dressCode || theme.musicStyle) && (
                  <div className="grid gap-3">
                    {theme.dressCode && (
                      <div className="rounded-2xl p-4 bg-foreground/[0.04] border border-border">
                        <SectionLabel icon={Shirt} color={theme.colorPalette.accent}>
                          {t("native.ideas.themeDetail.dressCode")}
                        </SectionLabel>
                        <p className="text-sm text-foreground/85 leading-relaxed">{theme.dressCode}</p>
                      </div>
                    )}
                    {theme.musicStyle && (
                      <div className="rounded-2xl p-4 bg-foreground/[0.04] border border-border">
                        <SectionLabel icon={Music} color={theme.colorPalette.accent}>
                          {t("native.ideas.themeDetail.music")}
                        </SectionLabel>
                        <p className="text-sm text-foreground/85 leading-relaxed">{theme.musicStyle}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Matching activities from the games library */}
                {activities.length > 0 && (
                  <div>
                    <SectionLabel icon={Gamepad2} color={theme.colorPalette.primary}>
                      {t("native.ideas.themeDetail.activities")}
                    </SectionLabel>
                    <div className="space-y-2">
                      {activities.map((game) => {
                        const playableId = ideaToPlayable[game.id];
                        return (
                          <div
                            key={game.id}
                            className="flex items-center gap-3 rounded-2xl p-3 bg-foreground/[0.04] border border-border"
                          >
                            <span className="w-10 h-10 rounded-xl bg-foreground/[0.06] flex items-center justify-center text-xl flex-shrink-0">
                              {game.emoji}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{t(game.nameKey)}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{game.groupSize.min}–{game.groupSize.max || "∞"}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{game.duration}</span>
                              </p>
                            </div>
                            {playableId && (
                              <button
                                onClick={() => { haptics.medium(); onClose(); navigate(`/games/${playableId}`); }}
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-white text-[11px] font-semibold active:scale-95 transition-transform"
                                style={{
                                  background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.secondary})`,
                                }}
                              >
                                <Play className="w-3 h-3 fill-white" />
                                {t("native.ideas.playableCta", "Spielen")}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Share */}
                <button
                  onClick={share}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.secondary})`,
                    boxShadow: `0 8px 28px -8px ${tint(theme.colorPalette.primary, 0.55)}`,
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  {t("native.ideas.themeDetail.share")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ThemeDetailSheet;
