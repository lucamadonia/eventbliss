import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";
import { Gamepad2, Palette, Sparkles, PartyPopper, Users, Globe } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamesLibrary } from "@/components/ideas/GamesLibrary";
import { ThemeGallery } from "@/components/ideas/ThemeGallery";
import { FloatingEmojis } from "@/components/ideas/FloatingEmojis";
import { StatsCounter } from "@/components/ideas/StatsCounter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { gamesLibrary } from "@/lib/games-library";
import { themeIdeas } from "@/lib/theme-ideas-library";

const floatingEmojis = ['🎮', '🎲', '🎯', '🎪', '🎭', '🎨', '🎤', '🎸', '🎺', '🎻', '🎹', '🎵'];

const IdeasHub = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("games");
  const { scrollY } = useScroll();
  
  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  return (
    <AnimatedBackground>
      <LandingHeader />
      
      {/* Floating Emojis Background */}
      <FloatingEmojis emojis={floatingEmojis} count={6} />
      
      <main className="min-h-screen pt-24 pb-16 relative">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Hero Header with Parallax */}
          <motion.div
            style={{ y: headerY, opacity: headerOpacity }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('ideasHub.badge')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            >
              <span className="text-gradient-primary">
                {t('ideasHub.title')}
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              {t('ideasHub.description')}
            </motion.p>
          </motion.div>

          {/* Animated Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <StatsCounter 
              value={gamesLibrary.length} 
              label={t('ideasHub.stats.games')} 
              icon={<Gamepad2 className="w-6 h-6" />}
              delay={0}
            />
            <StatsCounter 
              value={themeIdeas.length} 
              label={t('ideasHub.stats.themes')} 
              icon={<Palette className="w-6 h-6" />}
              delay={100}
            />
            <StatsCounter 
              value={8} 
              label={t('ideasHub.stats.categories')} 
              icon={<PartyPopper className="w-6 h-6" />}
              delay={200}
            />
            <StatsCounter 
              value={10} 
              label={t('ideasHub.stats.languages')} 
              icon={<Globe className="w-6 h-6" />}
              delay={300}
            />
          </motion.div>

          {/* Main Content with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard className="p-4 md:p-6 lg:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                  <TabsList className="inline-flex h-auto p-1.5 bg-muted/50 backdrop-blur-sm">
                    <TabsTrigger 
                      value="games" 
                      className="gap-2 px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-300"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span className="font-medium">{t('ideasHub.tabs.games')}</span>
                      <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/20 text-xs">
                        {gamesLibrary.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="themes" 
                      className="gap-2 px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-300"
                    >
                      <Palette className="w-5 h-5" />
                      <span className="font-medium">{t('ideasHub.tabs.themes')}</span>
                      <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/20 text-xs">
                        {themeIdeas.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content */}
                <TabsContent value="games" className="mt-0">
                  <GamesLibrary />
                </TabsContent>

                <TabsContent value="themes" className="mt-0">
                  <ThemeGallery />
                </TabsContent>
              </Tabs>
            </GlassCard>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <GlassCard className="p-8 md:p-12 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="font-display text-xl md:text-2xl font-bold">
                  {t('ideasHub.cta.title')}
                </h3>
              </div>
              <p className="text-muted-foreground mb-6">
                {t('ideasHub.cta.description')}
              </p>
              <motion.a
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5" />
                {t('ideasHub.cta.button')}
              </motion.a>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </AnimatedBackground>
  );
};

export default IdeasHub;
