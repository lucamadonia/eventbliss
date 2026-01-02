import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Search, Plus, Minus, History, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AI_CREDIT_LIMITS, getStartOfMonth, PlanType } from "@/lib/ai-credits";

interface UserCredits {
  userId: string;
  email: string;
  planType: PlanType;
  used: number;
  limit: number;
  bonusCredits: number;
}

interface Adjustment {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  adjusted_by: string;
  created_at: string;
  user_email?: string;
  admin_email?: string;
}

export function CreditsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserCredits | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true);

  useEffect(() => {
    fetchRecentAdjustments();
  }, []);

  const fetchRecentAdjustments = async () => {
    setAdjustmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_credit_adjustments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user emails for each adjustment
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.user_id))];
        const adminIds = [...new Set(data.map(a => a.adjusted_by))];
        const allIds = [...new Set([...userIds, ...adminIds])];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", allIds);

        const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

        const adjustmentsWithEmails = data.map(a => ({
          ...a,
          user_email: emailMap.get(a.user_id) || "Unknown",
          admin_email: emailMap.get(a.adjusted_by) || "Unknown",
        }));

        setAdjustments(adjustmentsWithEmails);
      } else {
        setAdjustments([]);
      }
    } catch (err) {
      console.error("Error fetching adjustments:", err);
    } finally {
      setAdjustmentsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;

    setSearchLoading(true);
    setSelectedUser(null);

    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error(t("admin.credits.noUser", "Benutzer nicht gefunden"));
        return;
      }

      // Get subscription info
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", profile.id)
        .maybeSingle();

      const planType = (subscription?.plan as PlanType) || "free";

      // Get current month usage
      const startOfMonth = getStartOfMonth();
      const { count: usedCredits } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", startOfMonth.toISOString());

      // Get bonus credits from adjustments
      const { data: bonusData } = await supabase
        .from("ai_credit_adjustments")
        .select("amount")
        .eq("user_id", profile.id)
        .gte("created_at", startOfMonth.toISOString());

      const bonusCredits = bonusData?.reduce((sum, adj) => sum + adj.amount, 0) || 0;
      const limit = AI_CREDIT_LIMITS[planType] || 0;

      setSelectedUser({
        userId: profile.id,
        email: profile.email || searchEmail,
        planType,
        used: usedCredits || 0,
        limit,
        bonusCredits,
      });
    } catch (err) {
      console.error("Error searching user:", err);
      toast.error(t("common.error"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason.trim() || !user) return;

    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t("admin.credits.invalidAmount", "Ungültige Anzahl"));
      return;
    }

    const finalAmount = adjustmentType === "remove" ? -amount : amount;

    setAdjustmentLoading(true);
    try {
      const { error } = await supabase
        .from("ai_credit_adjustments")
        .insert({
          user_id: selectedUser.userId,
          amount: finalAmount,
          reason: adjustmentReason.trim(),
          adjusted_by: user.id,
        });

      if (error) throw error;

      toast.success(t("admin.credits.adjustmentSuccess", "Credits erfolgreich angepasst"));
      
      // Reset form
      setAdjustmentAmount("");
      setAdjustmentReason("");
      
      // Refresh user data
      setSelectedUser(prev => prev ? {
        ...prev,
        bonusCredits: prev.bonusCredits + finalAmount,
      } : null);

      // Refresh adjustments list
      fetchRecentAdjustments();
    } catch (err) {
      console.error("Error adjusting credits:", err);
      toast.error(t("common.error"));
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: PlanType) => {
    switch (plan) {
      case "lifetime": return "bg-purple-500";
      case "yearly": return "bg-primary";
      case "monthly": return "bg-blue-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("admin.credits.title", "Credit-Management")}
          </CardTitle>
          <CardDescription>
            {t("admin.credits.description", "Manuelle Credit-Anpassungen für Benutzer")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search User */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email-search">{t("admin.credits.userSearch", "Benutzer suchen (E-Mail)")}</Label>
              <Input
                id="email-search"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searchLoading || !searchEmail.trim()}>
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Selected User Card */}
          {selectedUser && (
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.email}</p>
                      <Badge className={getPlanBadgeColor(selectedUser.planType)}>
                        {selectedUser.planType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {t("admin.credits.currentCredits", "Aktuelle Credits")}
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedUser.used} / {selectedUser.limit + selectedUser.bonusCredits}
                    </p>
                    {selectedUser.bonusCredits !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        (Base: {selectedUser.limit}, Bonus: {selectedUser.bonusCredits > 0 ? "+" : ""}{selectedUser.bonusCredits})
                      </p>
                    )}
                  </div>
                </div>

                {/* Adjustment Form */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">{t("admin.credits.adjustCredits", "Credits anpassen")}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("admin.credits.action", "Aktion")}</Label>
                      <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as "add" | "remove")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-green-500" />
                              {t("admin.credits.addCredits", "Credits hinzufügen")}
                            </div>
                          </SelectItem>
                          <SelectItem value="remove">
                            <div className="flex items-center gap-2">
                              <Minus className="h-4 w-4 text-red-500" />
                              {t("admin.credits.removeCredits", "Credits entfernen")}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("admin.credits.amount", "Anzahl")}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t("admin.credits.reason", "Grund")}</Label>
                    <Textarea
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder={t("admin.credits.reasonPlaceholder", "z.B. Partner-Bonus, Kulanz, etc.")}
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleAdjustCredits}
                    disabled={adjustmentLoading || !adjustmentAmount || !adjustmentReason.trim()}
                    className="w-full"
                  >
                    {adjustmentLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("admin.credits.applyAdjustment", "Anpassung anwenden")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("admin.credits.recentAdjustments", "Letzte Anpassungen")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adjustmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : adjustments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("admin.credits.noAdjustments", "Keine Anpassungen vorhanden")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.credits.user", "Benutzer")}</TableHead>
                  <TableHead>{t("admin.credits.amount", "Anzahl")}</TableHead>
                  <TableHead>{t("admin.credits.reason", "Grund")}</TableHead>
                  <TableHead>{t("admin.credits.adjustedBy", "Von")}</TableHead>
                  <TableHead>{t("admin.credits.date", "Datum")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="font-medium">{adj.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={adj.amount > 0 ? "default" : "destructive"}>
                        {adj.amount > 0 ? "+" : ""}{adj.amount}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{adj.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{adj.admin_email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(adj.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
