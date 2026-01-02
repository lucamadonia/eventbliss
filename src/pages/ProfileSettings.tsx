import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { 
  ChevronLeft, Mail, Lock, AlertTriangle, Trash2, Loader2, 
  Crown, FileText, ExternalLink, Download, Calendar, CreditCard, Sparkles,
  Palette, Moon, Sun
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { usePremium } from "@/hooks/usePremium";
import { useAICredits } from "@/hooks/useAICredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string | null;
  date: number;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
  hosted_invoice_url: string | null;
  description: string;
}

export default function ProfileSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, isLoading: authLoading, signOut } = useAuthContext();
  const { isPremium, planType, subscriptionEnd, cancelAtPeriodEnd, loading: premiumLoading } = usePremium();
  const { used: creditsUsed, remaining: creditsRemaining, limit: creditsLimit, resetDate: creditsResetDate, loading: creditsLoading } = useAICredits();

  const themeOptions = [
    { value: "dark", icon: Moon, labelKey: "theme.dark", descKey: "theme.darkDesc" },
    { value: "light", icon: Sun, labelKey: "theme.light", descKey: "theme.lightDesc" },
    { value: "rose", icon: Sparkles, labelKey: "theme.rose", descKey: "theme.roseDesc" },
  ];
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch invoices when user is available
  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-invoices");
      if (error) {
        console.error("Error fetching invoices:", error);
      } else if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("common.error");
      toast.error(errorMessage);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(t("profile.passwordChanged"));
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("common.error");
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error(t("profile.deleteConfirmationRequired"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await signOut();
      toast.success(t("profile.accountDeleteRequested"));
      navigate("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("common.error");
      toast.error(errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanLabel = () => {
    switch (planType) {
      case "lifetime": return t("profile.subscription.planLifetime");
      case "yearly": return t("profile.subscription.planYearly");
      case "monthly": return t("profile.subscription.planMonthly");
      default: return t("profile.subscription.planFree");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">{t("profile.invoices.paid")}</Badge>;
      case "open":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{t("profile.invoices.open")}</Badge>;
      case "void":
        return <Badge variant="secondary">{t("profile.invoices.void")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-2">{t("profile.settings")}</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-8 space-y-6">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t("profile.accountInfo")}
              </CardTitle>
              <CardDescription>{t("profile.accountInfoDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.emailCannotChange")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className={isPremium ? "border-primary/50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className={`h-5 w-5 ${isPremium ? "text-primary" : ""}`} />
                {t("profile.subscription.title")}
              </CardTitle>
              <CardDescription>{t("profile.subscription.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {premiumLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("profile.subscription.status")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-primary">{getPlanLabel()}</Badge>
                        {cancelAtPeriodEnd && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            {t("profile.subscription.cancelScheduled")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {subscriptionEnd && planType !== "lifetime" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {cancelAtPeriodEnd 
                          ? t("profile.subscription.endsOn", { date: new Date(subscriptionEnd).toLocaleDateString() })
                          : t("profile.subscription.renewsOn", { date: new Date(subscriptionEnd).toLocaleDateString() })
                        }
                      </span>
                    </div>
                  )}
                  
                  {planType === "lifetime" && (
                    <p className="text-sm text-muted-foreground">
                      {t("profile.subscription.lifetimeInfo")}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                    >
                      {isManagingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t("profile.subscription.manage")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{t("profile.subscription.noSubscription")}</p>
                  <Button onClick={() => navigate("/premium")}>
                    <Crown className="mr-2 h-4 w-4" />
                    {t("profile.subscription.upgradeNow")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.075 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("profile.aiCredits.title", "AI-Credits")}
              </CardTitle>
              <CardDescription>{t("profile.aiCredits.description", "Deine monatlichen Credits für KI-Funktionen")}</CardDescription>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : creditsLimit === 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{t("profile.aiCredits.noCredits", "Keine Credits - Premium-Abo erforderlich")}</p>
                  <Button variant="outline" onClick={() => navigate("/premium")}>
                    <Crown className="mr-2 h-4 w-4" />
                    {t("profile.subscription.upgradeNow")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>{t("profile.aiCredits.used", "Verwendet")}: {creditsUsed}</span>
                    <span>{t("profile.aiCredits.remaining", "Verbleibend")}: {creditsRemaining}</span>
                  </div>
                  <Progress value={creditsLimit > 0 ? (creditsRemaining / creditsLimit) * 100 : 0} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("profile.aiCredits.limit", "Monatliches Limit")}: {creditsLimit}</span>
                    <span>{t("profile.aiCredits.resetDate", "Nächstes Reset")}: {creditsResetDate.toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance / Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.085 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t("theme.title", "Appearance")}
              </CardTitle>
              <CardDescription>{t("theme.description", "Choose your preferred theme")}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value)}
                className="grid gap-3"
              >
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={opt.value} id={`theme-${opt.value}`} />
                      <Label 
                        htmlFor={`theme-${opt.value}`} 
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{t(opt.labelKey, opt.value)}</span>
                          <span className="text-xs text-muted-foreground">{t(opt.descKey, "")}</span>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("profile.invoices.title")}
              </CardTitle>
              <CardDescription>{t("profile.invoices.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("profile.invoices.noInvoices")}</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(invoice.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.number || invoice.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </span>
                        {getStatusBadge(invoice.status || "paid")}
                        {invoice.pdf_url && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(invoice.pdf_url!, "_blank")}
                            title={t("profile.invoices.downloadPdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.hosted_invoice_url && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                            title={t("profile.invoices.viewOnline")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("profile.changePassword")}
              </CardTitle>
              <CardDescription>{t("profile.changePasswordDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("profile.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t("dashboard.settings.dangerZone.title")}
              </CardTitle>
              <CardDescription>{t("profile.dangerZoneDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("profile.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("profile.deleteAccountTitle")}</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>{t("profile.deleteAccountWarning")}</p>
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm">{t("profile.typeDeleteToConfirm")}</Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                      {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE" || isDeletingAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("profile.deleteAccount")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
