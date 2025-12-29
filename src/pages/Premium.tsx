import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useEffect, useState } from "react";
import { ChevronLeft, Crown, Check, Sparkles, Zap, Shield, Calculator, MessageSquare, FileQuestion, Loader2, Settings, Star, Infinity, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const { isPremium, loading: premiumLoading, subscriptionEnd, planType, checkSubscription } = usePremium();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "lifetime" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

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

  const handleSubscribe = async (selectedPlanType: "monthly" | "lifetime") => {
    if (!user) {
      toast.error(t("premium.loginRequired"));
      navigate("/auth");
      return;
    }

    setCheckoutLoading(selectedPlanType);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          plan_type: selectedPlanType,
          locale: i18n.language
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(t("premium.checkoutError"));
    } finally {
      setCheckoutLoading(null);
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

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    if (!user) {
      toast.error(t("premium.loginRequired"));
      navigate("/auth");
      return;
    }

    setVoucherLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-voucher", {
        body: { code: voucherCode.trim().toUpperCase() }
      });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || t("premium.voucher.error"));
      }
      
      toast.success(data.message || t("premium.voucher.success"));
      setVoucherCode("");
      checkSubscription();
    } catch (err: any) {
      console.error("Voucher error:", err);
      toast.error(err.message || t("premium.voucher.error"));
    } finally {
      setVoucherLoading(false);
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

  const isMonthlyActive = isPremium && planType === "monthly";
  const isLifetimeActive = isPremium && planType === "lifetime";

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

      <main className="container max-w-4xl py-12">
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

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`relative overflow-hidden h-full ${isMonthlyActive ? 'ring-2 ring-primary' : ''}`}>
              {isMonthlyActive && (
                <div className="absolute top-0 right-0 m-4">
                  <Badge className="bg-green-500 text-white">
                    {t("premium.active")}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{t("premium.monthly")}</CardTitle>
                <CardDescription>{t("premium.planDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">€6,99</span>
                  <span className="text-muted-foreground">/{t("premium.perMonth")}</span>
                </div>

                {isMonthlyActive && subscriptionEnd && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t("premium.validUntil")}: {new Date(subscriptionEnd).toLocaleDateString()}
                  </div>
                )}

                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{t(`premium.features.${feature.key}`)}</span>
                      {isMonthlyActive && (
                        <Check className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>

                {premiumLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </Button>
                ) : isMonthlyActive ? (
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
                ) : isLifetimeActive ? (
                  <Button className="w-full" size="lg" disabled variant="outline">
                    {t("premium.lifetimeActive")}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    onClick={() => handleSubscribe("monthly")}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === "monthly" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4 mr-2" />
                    )}
                    {t("premium.subscribeMonthly")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Lifetime Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`relative overflow-hidden h-full border-primary ${isLifetimeActive ? 'ring-2 ring-primary' : ''}`}>
              {/* Popular Badge */}
              <div className="absolute top-0 left-0 right-0">
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium flex items-center justify-center gap-1">
                  <Star className="h-4 w-4" />
                  {t("premium.popular")}
                </div>
              </div>
              
              {isLifetimeActive && (
                <div className="absolute top-8 right-0 m-4">
                  <Badge className="bg-green-500 text-white">
                    {t("premium.lifetimeActive")}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 pt-10">
                <CardTitle className="text-xl">{t("premium.lifetime")}</CardTitle>
                <CardDescription>{t("premium.lifetimeDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">€19,99</span>
                  <span className="text-muted-foreground ml-2">{t("premium.oneTimePayment")}</span>
                </div>

                {isLifetimeActive && (
                  <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                    <Infinity className="h-4 w-4" />
                    {t("premium.foreverAccess")}
                  </div>
                )}

                <div className="space-y-3">
                  {features.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{t(`premium.features.${feature.key}`)}</span>
                      {isLifetimeActive && (
                        <Check className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  ))}
                  {/* Extra lifetime benefit */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Infinity className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t("premium.foreverAccess")}</span>
                    {isLifetimeActive && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>

                {premiumLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </Button>
                ) : isLifetimeActive ? (
                  <Button className="w-full" size="lg" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    {t("premium.lifetimeActive")}
                  </Button>
                ) : isPremium ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleSubscribe("lifetime")}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === "lifetime" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4 mr-2" />
                    )}
                    {t("premium.upgradeToLifetime")}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleSubscribe("lifetime")}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === "lifetime" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4 mr-2" />
                    )}
                    {t("premium.buyLifetime")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {!isPremium && (
          <>
            <p className="text-xs text-center text-muted-foreground mt-6">
              {t("premium.securePayment")}
            </p>
            
            {/* Voucher Redemption Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="mt-8">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    {t("premium.voucher.title")}
                  </CardTitle>
                  <CardDescription>{t("premium.voucher.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input 
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder={t("premium.voucher.placeholder")}
                      className="font-mono tracking-wider uppercase"
                    />
                    <Button 
                      onClick={handleRedeemVoucher} 
                      disabled={voucherLoading || !voucherCode.trim()}
                    >
                      {voucherLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Gift className="h-4 w-4 mr-2" />
                      )}
                      {t("premium.voucher.redeem")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
