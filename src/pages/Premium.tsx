import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ChevronLeft, Crown, Check, Sparkles, Zap, Shield, Calculator, MessageSquare, FileQuestion, Loader2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Premium() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading, subscriptionEnd, checkSubscription } = usePremium();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true") {
      toast.success(t("premium.subscriptionSuccess"));
      checkSubscription();
      // Clean up URL
      window.history.replaceState({}, "", "/premium");
    } else if (canceled === "true") {
      toast.info(t("premium.subscriptionCanceled"));
      window.history.replaceState({}, "", "/premium");
    }
  }, [searchParams, checkSubscription, t]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error(t("premium.loginRequired"));
      navigate("/auth");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(t("premium.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
      toast.error(t("premium.portalError"));
    } finally {
      setPortalLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, key: "aiAssistant" },
    { icon: MessageSquare, key: "messageEnhancement" },
    { icon: Calculator, key: "unlimitedExpenses" },
    { icon: FileQuestion, key: "customQuestions" },
    { icon: Zap, key: "unlimitedOptions" },
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
            {isPremium && (
              <div className="absolute top-0 right-0 m-4">
                <Badge className="bg-green-500 text-white">
                  {t("premium.active")}
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{t("premium.planName")}</CardTitle>
              <CardDescription>{t("premium.planDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">€39</span>
                <span className="text-muted-foreground">/{t("premium.perMonth")}</span>
              </div>

              {isPremium && subscriptionEnd && (
                <div className="text-center text-sm text-muted-foreground">
                  {t("premium.validUntil")}: {new Date(subscriptionEnd).toLocaleDateString()}
                </div>
              )}

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
                    {isPremium && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </motion.div>
                ))}
              </div>

              {premiumLoading ? (
                <Button className="w-full" size="lg" disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </Button>
              ) : isPremium ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  {t("premium.manageSubscription")}
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  {t("premium.subscribe")}
                </Button>
              )}
              
              {!isPremium && (
                <p className="text-xs text-center text-muted-foreground">
                  {t("premium.securePayment")}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
