import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Crown, Check, Sparkles, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Premium() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: Zap, key: "unlimitedEvents" },
    { icon: Sparkles, key: "aiAssistant" },
    { icon: Shield, key: "prioritySupport" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-2">{t("profile.premium")}</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{t("premium.title")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("premium.description")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 m-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {t("profile.comingSoon")}
              </Badge>
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{t("premium.planName")}</CardTitle>
              <CardDescription>{t("premium.planDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">€9.99</span>
                <span className="text-muted-foreground">/{t("premium.perMonth")}</span>
              </div>

              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>{t(`premium.features.${feature.key}`)}</span>
                  </motion.div>
                ))}
              </div>

              <Button className="w-full" size="lg" disabled>
                <Crown className="h-4 w-4 mr-2" />
                {t("premium.subscribe")}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                {t("premium.comingSoonNote")}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
