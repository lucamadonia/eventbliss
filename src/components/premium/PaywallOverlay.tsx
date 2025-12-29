import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crown, Lock, Sparkles, Zap, Shield, Receipt, MessageSquare, List, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";

interface PaywallOverlayProps {
  feature: "ai_assistant" | "message_ai" | "expenses" | "custom_questions" | "max_options";
  title?: string;
  description?: string;
  compact?: boolean;
}

const FEATURE_ICONS: Record<string, React.ElementType> = {
  ai_assistant: Sparkles,
  message_ai: MessageSquare,
  expenses: Receipt,
  custom_questions: HelpCircle,
  max_options: List,
};

export function PaywallOverlay({ feature, title, description, compact = false }: PaywallOverlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const Icon = FEATURE_ICONS[feature] || Lock;
  const featureTitle = title || t(`premium.features.${feature}`);
  const featureDescription = description || t(`premium.paywall.${feature}`);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <Lock className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">{featureDescription}</span>
        <Button 
          variant="link" 
          size="sm" 
          className="text-primary p-0 h-auto"
          onClick={() => navigate("/premium")}
        >
          {t("premium.paywall.upgradeButton")}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <GlassCard className="p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        <div className="relative z-10">
          {/* Crown badge */}
          <div className="inline-flex items-center justify-center rounded-full bg-primary/20 p-4 mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          
          {/* Feature icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-muted/50">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          
          <h3 className="font-display text-2xl font-bold mb-2">
            {featureTitle}
          </h3>
          
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {featureDescription}
          </p>
          
          {/* Benefits list */}
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 justify-center text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span>{t("premium.benefits.unlimitedAccess")}</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t("premium.benefits.aiFeatures")}</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span>{t("premium.benefits.prioritySupport")}</span>
            </div>
          </div>
          
          <GradientButton
            onClick={() => navigate("/premium")}
            icon={<Crown className="w-4 h-4" />}
            className="px-8"
          >
            {t("premium.paywall.upgradeButton")}
          </GradientButton>
          
          <p className="text-xs text-muted-foreground mt-4">
            {t("premium.paywall.startingAt")}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
