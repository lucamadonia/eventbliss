import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Palette, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamesLibrary } from "@/components/ideas/GamesLibrary";
import { ThemeGallery } from "@/components/ideas/ThemeGallery";
import { LandingHeader } from "@/components/landing/LandingHeader";

const IdeasHub = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("games");

  return (
    <AnimatedBackground>
      <LandingHeader />
      
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {t('ideasHub.title')}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('ideasHub.description')}
            </p>
          </motion.div>

          {/* Tabs */}
          <GlassCard className="p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="games" className="gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t('ideasHub.tabs.games')}
                </TabsTrigger>
                <TabsTrigger value="themes" className="gap-2">
                  <Palette className="w-4 h-4" />
                  {t('ideasHub.tabs.themes')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="games">
                <GamesLibrary />
              </TabsContent>

              <TabsContent value="themes">
                <ThemeGallery />
              </TabsContent>
            </Tabs>
          </GlassCard>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <GlassCard className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">200+</div>
              <div className="text-sm text-muted-foreground">{t('ideasHub.stats.games')}</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">{t('ideasHub.stats.themes')}</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">{t('ideasHub.stats.categories')}</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">10</div>
              <div className="text-sm text-muted-foreground">{t('ideasHub.stats.languages')}</div>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </AnimatedBackground>
  );
};

export default IdeasHub;
