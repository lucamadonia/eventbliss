import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useEffect, useState } from "react";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { ChevronLeft, Crown, Check, Sparkles, Zap, Shield, Calculator, MessageSquare, FileQuestion, Loader2, Settings, Star, Infinity, Gift, Calendar, XCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useAICredits } from "@/hooks/useAICredits";
import { toast } from "sonner";
import { AI_CREDIT_LIMITS } from "@/lib/ai-credits";

export default function Premium() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading, subscriptionEnd, planType, cancelAtPeriodEnd, checkSubscription } = usePremium();
  const { remaining: creditsRemaining, limit: creditsLimit, loading: creditsLoading } = useAICredits();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "yearly" | "lifetime" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

  const handleSubscribe = async (selectedPlanType: "monthly" | "yearly" | "lifetime") => {
    if (!user) {
      toast.error(t("premium.loginRequired"));
      navigate("/auth");
      return;
    }

    if (Capacitor.isNativePlatform()) {
      setCheckoutLoading(selectedPlanType);
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            plan_type: selectedPlanType,
            locale: i18n.language
          }
        });

        if (error) throw error;

        if (!data?.url) {
          toast.error(t("premium.checkoutError"));
          return;
        }

        Browser.addListener('browserFinished', () => {
          window.location.reload();
        });
        await Browser.open({ url: data.url });
      } catch (err) {
        console.error("Checkout error:", err);
        toast.error(t("premium.checkoutError"));
      } finally {
        setCheckoutLoading(null);
      }
    } else {
      // Open popup immediately (synchronously) to avoid popup blockers
      const popup = window.open("about:blank", "_blank");

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
          if (popup && !popup.closed) {
            popup.location.href = data.url;
          } else {
            // Fallback: open in same tab if popup was blocked
            window.location.href = data.url;
          }
        } else {
          popup?.close();
        }
      } catch (err) {
        console.error("Checkout error:", err);
        popup?.close();
        toast.error(t("premium.checkoutError"));
      } finally {
        setCheckoutLoading(null);
      }
    }
  };

  const handleManageSubscription = async () => {
    // Open popup immediately (synchronously) to avoid popup blockers
    const popup = window.open("about:blank", "_blank");
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        if (popup && !popup.closed) {
          popup.location.href = data.url;
        } else {
          // Fallback: open in same tab if popup was blocked
          window.location.href = data.url;
        }
      } else {
        popup?.close();
      }
    } catch (err) {
      console.error("Portal error:", err);
      popup?.close();
      toast.error(t("premium.portalError"));
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(t("premium.cancelSuccess"));
        setShowCancelDialog(false);
        checkSubscription();
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast.error(err.message || t("premium.cancelError"));
    } finally {
      setCancelLoading(false);
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
        const errorMessage = data?.error || "";
        
        // Check if it's a discount voucher that should be used in checkout
        if (errorMessage.startsWith("DISCOUNT_VOUCHER:")) {
          toast.info(t("premium.voucher.discountHint"), {
            description: t("premium.voucher.discountHintDesc"),
            duration: 6000,
          });
          return;
        }
        
        throw new Error(errorMessage || t("premium.voucher.error"));
      }
      
      toast.success(data.message || t("premium.voucher.success"));
      setVoucherCode("");
      checkSubscription();
    } catch (err: any) {
      console.error("Voucher error:", err);
      const errorMessage = err.message || "";
      
      // Check if it's a discount voucher that should be used in checkout
      if (errorMessage.includes("DISCOUNT_VOUCHER:")) {
        toast.info(t("premium.voucher.discountHint"), {
          description: t("premium.voucher.discountHintDesc"),
          duration: 6000,
        });
        return;
      }
      
      toast.error(errorMessage || t("premium.voucher.error"));
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
  const isYearlyActive = isPremium && planType === "yearly";
  const isLifetimeActive = isPremium && planType === "lifetime";
  const hasRecurringSubscription = isMonthlyActive || isYearlyActive;

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

      <main className="container max-w-5xl py-12">
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

        {/* Cancellation Alert */}
        {cancelAtPeriodEnd && subscriptionEnd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-600">{t("premium.cancellationScheduled")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("premium.cancelledAt")}: {new Date(subscriptionEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
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
                <CardDescription>{t("premium.monthlyDescription")}</CardDescription>
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
                  {features.slice(0, 4).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{t(`premium.features.${feature.key}`)}</span>
                    </div>
                  ))}
                  {/* AI Credits */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t("premium.credits.monthly", "50 AI-Credits/Monat")}</span>
                  </div>
                </div>

                {/* Show remaining credits for active monthly plan */}
                {isMonthlyActive && !creditsLoading && (
                  <div className="text-center text-sm text-muted-foreground border-t pt-3">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    {t("premium.credits.remaining", "{{remaining}} von {{limit}} Credits verbleibend", { remaining: creditsRemaining, limit: creditsLimit })}
                  </div>
                )}

                {premiumLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </Button>
                ) : isMonthlyActive ? (
                  <div className="space-y-2">
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
                    {!cancelAtPeriodEnd && (
                      <Button 
                        className="w-full" 
                        size="lg" 
                        variant="ghost"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("premium.cancelSubscription")}
                      </Button>
                    )}
                  </div>
                ) : isPremium ? (
                  <Button className="w-full" size="lg" disabled variant="outline">
                    {t("premium.currentPlan")}
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

          {/* Yearly Plan - Popular */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className={`relative overflow-hidden h-full border-primary ${isYearlyActive ? 'ring-2 ring-primary' : ''}`}>
              {/* Popular Badge */}
              <div className="absolute top-0 left-0 right-0">
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium flex items-center justify-center gap-1">
                  <Star className="h-4 w-4" />
                  {t("premium.popular")}
                </div>
              </div>
              
              {isYearlyActive && (
                <div className="absolute top-8 right-0 m-4">
                  <Badge className="bg-green-500 text-white">
                    {t("premium.active")}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 pt-10">
                <CardTitle className="text-xl">{t("premium.yearly")}</CardTitle>
                <CardDescription>{t("premium.yearlyDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">€59,99</span>
                  <span className="text-muted-foreground">/{t("premium.perYear")}</span>
                  <div className="mt-1">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {t("premium.savePercent")}
                    </Badge>
                  </div>
                </div>

                {isYearlyActive && subscriptionEnd && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t("premium.validUntil")}: {new Date(subscriptionEnd).toLocaleDateString()}
                  </div>
                )}

                <div className="space-y-3">
                  {features.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{t(`premium.features.${feature.key}`)}</span>
                    </div>
                  ))}
                  {/* AI Credits */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t("premium.credits.yearly", "100 AI-Credits/Monat")}</span>
                  </div>
                </div>

                {/* Show remaining credits for active yearly plan */}
                {isYearlyActive && !creditsLoading && (
                  <div className="text-center text-sm text-muted-foreground border-t pt-3">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    {t("premium.credits.remaining", "{{remaining}} von {{limit}} Credits verbleibend", { remaining: creditsRemaining, limit: creditsLimit })}
                  </div>
                )}

                {premiumLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </Button>
                ) : isYearlyActive ? (
                  <div className="space-y-2">
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
                    {!cancelAtPeriodEnd && (
                      <Button 
                        className="w-full" 
                        size="lg" 
                        variant="ghost"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("premium.cancelSubscription")}
                      </Button>
                    )}
                  </div>
                ) : isLifetimeActive ? (
                  <Button className="w-full" size="lg" disabled variant="outline">
                    {t("premium.lifetimeActive")}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleSubscribe("yearly")}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === "yearly" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    {t("premium.subscribeYearly")}
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
            <Card className={`relative overflow-hidden h-full ${isLifetimeActive ? 'ring-2 ring-primary' : ''}`}>
              {isLifetimeActive && (
                <div className="absolute top-0 right-0 m-4">
                  <Badge className="bg-green-500 text-white">
                    {t("premium.lifetimeActive")}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
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
                  {features.slice(0, 4).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{t(`premium.features.${feature.key}`)}</span>
                    </div>
                  ))}
                  {/* AI Credits */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t("premium.credits.lifetime", "75 AI-Credits/Monat")}</span>
                  </div>
                  {/* Extra lifetime benefit */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Infinity className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t("premium.foreverAccess")}</span>
                  </div>
                </div>

                {/* Show remaining credits for active lifetime plan */}
                {isLifetimeActive && !creditsLoading && (
                  <div className="text-center text-sm text-muted-foreground border-t pt-3">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    {t("premium.credits.remaining", "{{remaining}} von {{limit}} Credits verbleibend", { remaining: creditsRemaining, limit: creditsLimit })}
                  </div>
                )}

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
                ) : hasRecurringSubscription ? (
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
                    variant="outline"
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

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("premium.cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("premium.cancelConfirmDescription")}
              {subscriptionEnd && (
                <span className="block mt-2 font-medium">
                  {t("premium.cancelledAt")}: {new Date(subscriptionEnd).toLocaleDateString()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {t("premium.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
