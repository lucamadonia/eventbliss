import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Search, Plus, Minus, History, User, Loader2, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanConfigs } from "@/hooks/usePlanConfigs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getStartOfMonth, PlanType } from "@/lib/ai-credits";

interface UserCredits {
  userId: string;
  email: string;
  fullName: string | null;
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
  const { data: planConfigs } = usePlanConfigs();
  
  // User list state
  const [allUsers, setAllUsers] = useState<UserCredits[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserCredits | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  
  // Adjustments history state
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers();
    fetchRecentAdjustments();
  }, []);

  const getAICreditsForPlan = (planKey: string): number => {
    if (planConfigs && planConfigs.length > 0) {
      const config = planConfigs.find(c => c.plan_key === planKey);
      if (config) return config.ai_credits_monthly;
    }
    // Fallback values
    const fallbacks: Record<string, number> = { free: 5, monthly: 50, yearly: 100, lifetime: 75, premium: 50 };
    return fallbacks[planKey] || 0;
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast.error(t("admin.credits.fetchError", "Fehler beim Laden der Benutzer"));
        return;
      }

      if (!profiles || profiles.length === 0) {
        setAllUsers([]);
        return;
      }

      // Fetch all subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, plan");

      const subscriptionMap = new Map(subscriptions?.map(s => [s.user_id, s.plan]) || []);

      // Get start of month for filtering
      const startOfMonth = getStartOfMonth();

      // Fetch all AI usage for this month
      const { data: usageData } = await supabase
        .from("ai_usage")
        .select("user_id")
        .gte("created_at", startOfMonth.toISOString());

      // Count usage per user
      const usageMap = new Map<string, number>();
      usageData?.forEach(u => {
        usageMap.set(u.user_id, (usageMap.get(u.user_id) || 0) + 1);
      });

      // Fetch all adjustments for this month
      const { data: adjustmentsData } = await supabase
        .from("ai_credit_adjustments")
        .select("user_id, amount")
        .gte("created_at", startOfMonth.toISOString());

      // Sum adjustments per user
      const adjustmentsMap = new Map<string, number>();
      adjustmentsData?.forEach(a => {
        adjustmentsMap.set(a.user_id, (adjustmentsMap.get(a.user_id) || 0) + a.amount);
      });

      // Build user credits array
      const usersWithCredits: UserCredits[] = profiles.map(profile => {
        const planType = (subscriptionMap.get(profile.id) as PlanType) || "free";
        const used = usageMap.get(profile.id) || 0;
        const bonusCredits = adjustmentsMap.get(profile.id) || 0;
        const limit = getAICreditsForPlan(planType);

        return {
          userId: profile.id,
          email: profile.email || "N/A",
          fullName: profile.full_name,
          planType,
          used,
          limit,
          bonusCredits,
        };
      });

      setAllUsers(usersWithCredits);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error(t("common.error"));
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRecentAdjustments = async () => {
    setAdjustmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_credit_adjustments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

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

  // Filtered users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    
    const term = searchTerm.toLowerCase();
    return allUsers.filter(u => 
      u.email.toLowerCase().includes(term) || 
      (u.fullName && u.fullName.toLowerCase().includes(term))
    );
  }, [allUsers, searchTerm]);

  const openAdjustDialog = (userCredits: UserCredits) => {
    setSelectedUser(userCredits);
    setAdjustmentType("add");
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setDialogOpen(true);
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
      // Verify admin role
      const { data: adminCheck, error: adminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminError) {
        console.error("Admin check error:", adminError);
        toast.error(t("admin.credits.adminCheckError", "Admin-Status konnte nicht verifiziert werden"));
        return;
      }

      if (!adminCheck) {
        toast.error(t("admin.credits.noPermission", "Keine Admin-Berechtigung vorhanden"));
        return;
      }

      const { error } = await supabase
        .from("ai_credit_adjustments")
        .insert({
          user_id: selectedUser.userId,
          amount: finalAmount,
          reason: adjustmentReason.trim(),
          adjusted_by: user.id,
        });

      if (error) {
        console.error("Credit adjustment error:", error);
        if (error.code === '42501' || error.message.includes('policy') || error.message.includes('RLS')) {
          toast.error(t("admin.credits.rlsError", "Keine Berechtigung. Bitte Admin-Rechte prüfen."));
        } else {
          toast.error(`${t("common.error")}: ${error.message}`);
        }
        return;
      }

      toast.success(t("admin.credits.adjustmentSuccess", "Credits erfolgreich angepasst"));
      setDialogOpen(false);

      // Update local state
      setAllUsers(prev => prev.map(u => 
        u.userId === selectedUser.userId 
          ? { ...u, bonusCredits: u.bonusCredits + finalAmount }
          : u
      ));

      // Refresh adjustments list
      fetchRecentAdjustments();
    } catch (err) {
      console.error("Error adjusting credits:", err);
      toast.error(t("common.error"));
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "lifetime": return "bg-purple-500 text-white";
      case "yearly": return "bg-primary text-primary-foreground";
      case "monthly": return "bg-blue-500 text-white";
      case "premium": return "bg-amber-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTotalCredits = (u: UserCredits) => u.limit + u.bonusCredits;
  const getRemainingCredits = (u: UserCredits) => Math.max(0, getTotalCredits(u) - u.used);

  return (
    <div className="space-y-6">
      {/* User List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t("admin.credits.title", "Credit-Management")}
              </CardTitle>
              <CardDescription>
                {t("admin.credits.description", "Manuelle Credit-Anpassungen für Benutzer")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAllUsers} disabled={usersLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
              {t("common.refresh", "Aktualisieren")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.credits.searchPlaceholder", "Nach E-Mail oder Name suchen...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? (
                <p>{t("admin.credits.noSearchResults", "Keine Benutzer gefunden")}</p>
              ) : (
                <p>{t("admin.credits.noUsers", "Keine Benutzer vorhanden")}</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.credits.user", "Benutzer")}</TableHead>
                    <TableHead>{t("admin.credits.plan", "Plan")}</TableHead>
                    <TableHead className="text-center">{t("admin.credits.used", "Verbraucht")}</TableHead>
                    <TableHead className="text-center">{t("admin.credits.available", "Verfügbar")}</TableHead>
                    <TableHead className="text-center">{t("admin.credits.bonus", "Bonus")}</TableHead>
                    <TableHead className="text-right">{t("common.actions", "Aktionen")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{u.email}</p>
                            {u.fullName && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{u.fullName}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(u.planType)}>
                          {u.planType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {u.used}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-mono ${getRemainingCredits(u) <= 0 ? 'text-destructive' : ''}`}>
                          {getRemainingCredits(u)} / {getTotalCredits(u)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {u.bonusCredits !== 0 && (
                          <Badge variant={u.bonusCredits > 0 ? "default" : "destructive"}>
                            {u.bonusCredits > 0 ? "+" : ""}{u.bonusCredits}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openAdjustDialog(u)}>
                          <Sparkles className="h-4 w-4 mr-1" />
                          {t("admin.credits.adjust", "Anpassen")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!usersLoading && filteredUsers.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t("admin.credits.showingUsers", "{{count}} Benutzer angezeigt", { count: filteredUsers.length })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("admin.credits.adjustCredits", "Credits anpassen")}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.credits.currentCredits", "Aktuelle Credits")}</p>
                  <p className="text-2xl font-bold">
                    {selectedUser.used} / {getTotalCredits(selectedUser)}
                  </p>
                </div>
                <Badge className={getPlanBadgeColor(selectedUser.planType)}>
                  {selectedUser.planType.toUpperCase()}
                </Badge>
              </div>

              {/* Adjustment Form */}
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
                          {t("admin.credits.addCredits", "Hinzufügen")}
                        </div>
                      </SelectItem>
                      <SelectItem value="remove">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-500" />
                          {t("admin.credits.removeCredits", "Entfernen")}
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
                {adjustmentType === "add" ? (
                  <><Plus className="h-4 w-4 mr-2" /> {t("admin.credits.addCreditsBtn", "Credits hinzufügen")}</>
                ) : (
                  <><Minus className="h-4 w-4 mr-2" /> {t("admin.credits.removeCreditsBtn", "Credits entfernen")}</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
