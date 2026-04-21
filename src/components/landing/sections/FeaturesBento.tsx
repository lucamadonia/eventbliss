/**
 * FeaturesBento — asymmetric 4-col bento grid replacing the old 3x3 uniform
 * features grid. Each tile: TiltCard wrap + cursor-follow spotlight + hover
 * lift. i18n keys preserved from original `features[]` array in Landing.tsx.
 */
import { type LucideIcon, Users, Wallet, Bot, MessageSquare, Calendar, Zap, Building2, FileEdit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface BentoTile {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
  colSpan: 1 | 2;
}

const TILES: BentoTile[] = [
  { icon: Users, titleKey: "landing.features.multiEvent.title", descriptionKey: "landing.features.multiEvent.description", gradient: "from-primary/25 to-neon-pink/15", colSpan: 2 },
  { icon: Wallet, titleKey: "landing.features.costSplitting.title", descriptionKey: "landing.features.costSplitting.description", gradient: "from-accent/25 to-primary/15", colSpan: 2 },
  { icon: Bot, titleKey: "landing.features.aiSuggestions.title", descriptionKey: "landing.features.aiSuggestions.description", gradient: "from-neon-cyan/25 to-accent/15", colSpan: 1 },
  { icon: MessageSquare, titleKey: "landing.features.messageTemplates.title", descriptionKey: "landing.features.messageTemplates.description", gradient: "from-neon-pink/25 to-neon-orange/15", colSpan: 1 },
  { icon: Calendar, titleKey: "landing.features.planner.title", descriptionKey: "landing.features.planner.description", gradient: "from-neon-pink/25 to-primary/15", colSpan: 1 },
  { icon: Calendar, titleKey: "landing.features.dateCoordination.title", descriptionKey: "landing.features.dateCoordination.description", gradient: "from-success/25 to-accent/15", colSpan: 1 },
  { icon: Zap, titleKey: "landing.features.realtime.title", descriptionKey: "landing.features.realtime.description", gradient: "from-warning/25 to-neon-orange/15", colSpan: 2 },
  { icon: Building2, titleKey: "landing.features.agencyDirectory.title", descriptionKey: "landing.features.agencyDirectory.description", gradient: "from-primary/25 to-accent/15", colSpan: 1 },
  { icon: FileEdit, titleKey: "landing.features.formBuilder.title", descriptionKey: "landing.features.formBuilder.description", gradient: "from-neon-cyan/25 to-primary/15", colSpan: 1 },
];

const ICON_GRADIENT = [
  "from-primary to-neon-pink",
  "from-accent to-primary",
  "from-neon-cyan to-accent",
  "from-neon-pink to-neon-orange",
  "from-neon-pink to-primary",
  "from-success to-accent",
  "from-warning to-neon-orange",
  "from-primary to-accent",
  "from-neon-cyan to-primary",
];

export function FeaturesBento() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="features" className="relative py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        <ScrollReveal variant="slide-up" className="text-center mb-14 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {t("landing.features.subtitle")}
          </p>
        </ScrollReveal>

        <BentoGrid>
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={
                tile.colSpan === 2 ? "col-span-2 md:col-span-2" : "col-span-1"
              }
            >
              <BentoCard
                colSpan={tile.colSpan}
                gradient={tile.gradient}
                className="h-full"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${ICON_GRADIENT[i]} mb-4 w-fit shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]`}>
                  <tile.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg md:text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {t(tile.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {t(tile.descriptionKey)}
                </p>
              </BentoCard>
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
