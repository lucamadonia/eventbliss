import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usePlanConfigs } from "@/hooks/usePlanConfigs";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Search, MoreHorizontal, UserPlus, Eye, Trash2, Key, Mail, Shield, 
  CreditCard, Sparkles, Calendar, MapPin, Building2, Ticket, User,
  History, Settings, AlertTriangle, Clock, Users, Globe
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  must_change_password: boolean | null;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  expires_at: string | null;
  is_manual: boolean | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface VoucherRedemption {
  id: string;
  user_id: string;
  voucher_id: string;
  redeemed_at: string | null;
  voucher: { code: string; discount_type: string; discount_value: number | null } | null;
}

interface AffiliateVoucher {
  voucher_id: string;
  affiliate_id: string;
  affiliate: { id: string; contact_name: string; email: string; company_name: string | null } | null;
}

interface AgencyAffiliate {
  affiliate_id: string;
  agency_name: string;
  agency_city: string;
  agency_country: string;
}

interface CreditAdjustment {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  adjusted_by: string;
  created_at: string;
}

interface ExtendedUser extends Profile {
  subscription: Subscription | null;
  roles: UserRole[];
  redemptions: VoucherRedemption[];
  affiliateVouchers: AffiliateVoucher[];
  agencyInfo: AgencyAffiliate | null;
  aiUsageThisMonth: number;
  eventsCreated: number;
  creditAdjustments: CreditAdjustment[];
}

export function UsersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: planConfigs } = usePlanConfigs();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("member");
  const [newUserPlan, setNewUserPlan] = useState("free");
  
  const [newPassword, setNewPassword] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*");
      if (error) throw error;
      return data as Subscription[];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["admin-voucher-redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("voucher_redemptions").select(`id, user_id, voucher_id, redeemed_at, vouchers (code, discount_type, discount_value)`);
      if (error) throw error;
      return (data || []).map(r => ({ ...r, voucher: r.vouchers as VoucherRedemption["voucher"] })) as VoucherRedemption[];
    },
  });

  const { data: affiliateVouchers = [] } = useQuery({
    queryKey: ["admin-affiliate-vouchers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_vouchers").select(`voucher_id, affiliate_id, affiliates (id, contact_name, email, company_name)`);
      if (error) throw error;
      return (data || []).map(av => ({ ...av, affiliate: av.affiliates as AffiliateVoucher["affiliate"] })) as AffiliateVoucher[];
    },
  });

  const { data: agencyAffiliates = [] } = useQuery({
    queryKey: ["admin-agency-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agency_affiliates").select("affiliate_id, agency_name, agency_city, agency_country");
      if (error) throw error;
      return data as AgencyAffiliate[];
    },
  });

  const { data: aiUsage = [] } = useQuery({
    queryKey: ["admin-ai-usage"],
    queryFn: async () => {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("ai_usage").select("user_id").gte("created_at", startOfMonth.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  const { data: eventsData = [] } = useQuery({
    queryKey: ["admin-events-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("created_by");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: creditAdjustments = [] } = useQuery({
    queryKey: ["admin-credit-adjustments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_credit_adjustments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as CreditAdjustment[];
    },
  });

  const extendedUsers = useMemo<ExtendedUser[]>(() => {
    return profiles.map(profile => {
      const subscription = subscriptions.find(s => s.user_id === profile.id) || null;
      const roles = userRoles.filter(r => r.user_id === profile.id);
      const userRedemptions = redemptions.filter(r => r.user_id === profile.id);
      const userAffiliateVouchers = affiliateVouchers.filter(av => userRedemptions.some(r => r.voucher_id === av.voucher_id));
      let agencyInfo: AgencyAffiliate | null = null;
      for (const av of userAffiliateVouchers) {
        const agency = agencyAffiliates.find(a => a.affiliate_id === av.affiliate_id);
        if (agency) { agencyInfo = agency; break; }
      }
      return {
        ...profile,
        subscription,
        roles,
        redemptions: userRedemptions,
        affiliateVouchers: userAffiliateVouchers,
        agencyInfo,
        aiUsageThisMonth: aiUsage.filter(u => u.user_id === profile.id).length,
        eventsCreated: eventsData.filter(e => e.created_by === profile.id).length,
        creditAdjustments: creditAdjustments.filter(c => c.user_id === profile.id),
      };
    });
  }, [profiles, subscriptions, userRoles, redemptions, affiliateVouchers, agencyAffiliates, aiUsage, eventsData, creditAdjustments]);

  const filteredUsers = useMemo(() => {
    return extendedUsers.filter(user => {
      const matchesSearch = searchTerm === "" || user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || (roleFilter === "none" && user.roles.length === 0) || user.roles.some(r => r.role === roleFilter);
      const matchesPlan = planFilter === "all" || (user.subscription?.plan || "free") === planFilter;
      let matchesSource = true;
      if (sourceFilter === "direct") matchesSource = user.redemptions.length === 0;
      else if (sourceFilter === "voucher") matchesSource = user.redemptions.length > 0 && user.affiliateVouchers.length === 0;
      else if (sourceFilter === "affiliate") matchesSource = user.affiliateVouchers.length > 0 && !user.agencyInfo;
      else if (sourceFilter === "agency") matchesSource = user.agencyInfo !== null;
      return matchesSearch && matchesRole && matchesPlan && matchesSource;
    });
  }, [extendedUsers, searchTerm, roleFilter, planFilter, sourceFilter]);

  const getUserSource = (user: ExtendedUser) => {
    if (user.agencyInfo) return { label: "Agentur", variant: "default" as const, details: `${user.agencyInfo.agency_name}, ${user.agencyInfo.agency_city}` };
    if (user.affiliateVouchers.length > 0) return { label: "Affiliate", variant: "secondary" as const, details: user.affiliateVouchers[0].affiliate?.contact_name };
    if (user.redemptions.length > 0) return { label: "Voucher", variant: "outline" as const, details: user.redemptions[0].voucher?.code };
    return { label: "Direkt", variant: "outline" as const };
  };

  const getPrimaryRole = (user: ExtendedUser): string => {
    if (user.roles.some(r => r.role === "admin")) return "admin";
    if (user.roles.some(r => r.role === "moderator")) return "moderator";
    if (user.roles.some(r => r.role === "agency")) return "agency";
    if (user.roles.some(r => r.role === "affiliate")) return "affiliate";
    return "member";
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    if (role === "admin") return "destructive";
    if (role === "moderator") return "default";
    if (role === "agency" || role === "affiliate") return "secondary";
    return "outline";
  };

  const getPlanBadgeVariant = (plan: string): "default" | "secondary" | "outline" | "destructive" => {
    if (plan.includes("lifetime")) return "destructive";
    if (plan.includes("yearly")) return "default";
    if (plan.includes("monthly")) return "secondary";
    return "outline";
  };

  const getUserCredits = (user: ExtendedUser) => {
    const plan = user.subscription?.plan || "free";
    const planConfig = planConfigs?.find(p => p.plan_key === plan);
    const monthlyCredits = planConfig?.ai_credits_monthly || 5;
    const adjustmentsTotal = user.creditAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    return { used: user.aiUsageThisMonth, total: monthlyCredits + adjustmentsTotal };
  };

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("create-user", { body: { email: newUserEmail, password: newUserPassword, fullName: newUserName, role: newUserRole, plan: newUserPlan } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Benutzer erstellt"); queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }); setCreateDialogOpen(false); setNewUserEmail(""); setNewUserName(""); setNewUserPassword(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      if (role !== "member") { const { error } = await supabase.from("user_roles").insert({ user_id: userId, role }); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Rolle aktualisiert"); queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const existing = subscriptions.find(s => s.user_id === userId);
      if (existing) { const { error } = await supabase.from("subscriptions").update({ plan, is_manual: true }).eq("id", existing.id); if (error) throw error; }
      else { const { error } = await supabase.from("subscriptions").insert({ user_id: userId, plan, is_manual: true }); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Plan aktualisiert"); queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("ai_credit_adjustments").insert({ user_id: userId, amount, reason, adjusted_by: userData.user.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Credits angepasst"); queryClient.invalidateQueries({ queryKey: ["admin-credit-adjustments"] }); setCreditAmount(""); setCreditReason(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { error } = await supabase.functions.invoke("update-user", { body: { userId, password } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Passwort zurückgesetzt"); setNewPassword(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, subject, content }: { userId: string; subject: string; content: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("admin_messages").insert({ user_id: userId, admin_id: userData.user.id, subject, content });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Nachricht gesendet"); setMessageSubject(""); setMessageContent(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("update-user", { body: { userId, action: "delete" } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Benutzer gelöscht"); queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }); setDeleteDialogOpen(false); setDetailDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const generatePassword = () => { const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"; let p = ""; for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length)); return p; };

  if (isLoading) return <Card><CardContent className="py-8"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Benutzerverwaltung</CardTitle><CardDescription>Alle Benutzer verwalten, Rollen zuweisen, Herkunft einsehen</CardDescription></div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2"><UserPlus className="h-4 w-4" />Benutzer erstellen</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="E-Mail oder Name suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
          <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[140px]"><Shield className="h-4 w-4 mr-2" /><SelectValue placeholder="Rolle" /></SelectTrigger><SelectContent><SelectItem value="all">Alle Rollen</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="agency">Agentur</SelectItem><SelectItem value="affiliate">Affiliate</SelectItem><SelectItem value="member">Mitglied</SelectItem><SelectItem value="none">Keine Rolle</SelectItem></SelectContent></Select>
          <Select value={planFilter} onValueChange={setPlanFilter}><SelectTrigger className="w-[140px]"><CreditCard className="h-4 w-4 mr-2" /><SelectValue placeholder="Plan" /></SelectTrigger><SelectContent><SelectItem value="all">Alle Pläne</SelectItem><SelectItem value="free">Free</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="lifetime">Lifetime</SelectItem></SelectContent></Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}><SelectTrigger className="w-[140px]"><Globe className="h-4 w-4 mr-2" /><SelectValue placeholder="Quelle" /></SelectTrigger><SelectContent><SelectItem value="all">Alle Quellen</SelectItem><SelectItem value="direct">Direkt</SelectItem><SelectItem value="voucher">Voucher</SelectItem><SelectItem value="affiliate">Affiliate</SelectItem><SelectItem value="agency">Agentur</SelectItem></SelectContent></Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{extendedUsers.length}</p><p className="text-xs text-muted-foreground">Gesamt</p></div>
          <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{extendedUsers.filter(u => u.roles.some(r => r.role === "admin")).length}</p><p className="text-xs text-muted-foreground">Admins</p></div>
          <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{extendedUsers.filter(u => u.subscription && u.subscription.plan !== "free").length}</p><p className="text-xs text-muted-foreground">Premium</p></div>
          <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{extendedUsers.filter(u => u.redemptions.length > 0).length}</p><p className="text-xs text-muted-foreground">Über Voucher</p></div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader><TableRow><TableHead>E-Mail</TableHead><TableHead>Name</TableHead><TableHead>Rolle</TableHead><TableHead>Plan</TableHead><TableHead>Credits</TableHead><TableHead>Quelle</TableHead><TableHead>Erstellt</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Keine Benutzer gefunden</TableCell></TableRow> : filteredUsers.map((user) => {
                const source = getUserSource(user); const role = getPrimaryRole(user); const plan = user.subscription?.plan || "free"; const credits = getUserCredits(user);
                return (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedUser(user); setDetailTab("overview"); setDetailDialogOpen(true); }}>
                    <TableCell className="font-medium">{user.email || "-"}</TableCell>
                    <TableCell>{user.full_name || "-"}</TableCell>
                    <TableCell><Badge variant={getRoleBadgeVariant(role)} className="capitalize">{role}</Badge></TableCell>
                    <TableCell><Badge variant={getPlanBadgeVariant(plan)} className="capitalize">{plan}</Badge></TableCell>
                    <TableCell><span className={credits.used >= credits.total ? "text-destructive" : ""}>{credits.used}/{credits.total}</span></TableCell>
                    <TableCell><div className="flex flex-col gap-1"><Badge variant={source.variant} className="w-fit">{source.label}</Badge>{source.details && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{source.details}</span>}</div></TableCell>
                    <TableCell className="text-muted-foreground">{user.created_at ? format(new Date(user.created_at), "dd.MM.yy", { locale: de }) : "-"}</TableCell>
                    <TableCell><DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setDetailDialogOpen(true); }}><Eye className="h-4 w-4 mr-2" />Details</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Löschen</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground text-center">{filteredUsers.length} von {extendedUsers.length} Benutzern</p>
      </CardContent>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Neuen Benutzer erstellen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>E-Mail *</Label><Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="benutzer@example.com" /></div>
            <div className="space-y-2"><Label>Name</Label><Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Max Mustermann" /></div>
            <div className="space-y-2"><Label>Passwort *</Label><div className="flex gap-2"><Input type="text" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Sicheres Passwort" /><Button type="button" variant="outline" onClick={() => setNewUserPassword(generatePassword())}>Generieren</Button></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Rolle</Label><Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="member">Mitglied</SelectItem><SelectItem value="organizer">Organizer</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="agency">Agentur</SelectItem><SelectItem value="affiliate">Affiliate</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Plan</Label><Select value={newUserPlan} onValueChange={setNewUserPlan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="lifetime">Lifetime</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button><Button onClick={() => createUserMutation.mutate()} disabled={!newUserEmail || !newUserPassword || createUserMutation.isPending}>{createUserMutation.isPending ? "Erstelle..." : "Erstellen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" />Benutzer-Details</DialogTitle><DialogDescription>{selectedUser?.email}</DialogDescription></DialogHeader>
          {selectedUser && (
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview" className="gap-2"><User className="h-4 w-4" /><span className="hidden sm:inline">Übersicht</span></TabsTrigger>
                <TabsTrigger value="source" className="gap-2"><MapPin className="h-4 w-4" /><span className="hidden sm:inline">Herkunft</span></TabsTrigger>
                <TabsTrigger value="actions" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Aktionen</span></TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /><span className="hidden sm:inline">Aktivität</span></TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div><Label className="text-muted-foreground">E-Mail</Label><p className="font-medium">{selectedUser.email || "-"}</p></div>
                      <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{selectedUser.full_name || "-"}</p></div>
                      <div><Label className="text-muted-foreground">Erstellt am</Label><p className="font-medium">{selectedUser.created_at ? format(new Date(selectedUser.created_at), "dd. MMMM yyyy, HH:mm", { locale: de }) : "-"}</p></div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/50 rounded-lg p-4 text-center"><Badge variant={getRoleBadgeVariant(getPrimaryRole(selectedUser))} className="mb-2 capitalize">{getPrimaryRole(selectedUser)}</Badge><p className="text-xs text-muted-foreground">Rolle</p></div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center"><Badge variant={getPlanBadgeVariant(selectedUser.subscription?.plan || "free")} className="mb-2 capitalize">{selectedUser.subscription?.plan || "free"}</Badge><p className="text-xs text-muted-foreground">Plan</p></div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center"><p className="text-lg font-bold">{getUserCredits(selectedUser).used}/{getUserCredits(selectedUser).total}</p><p className="text-xs text-muted-foreground">Credits</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3"><div className="bg-primary/10 rounded-lg p-2"><Calendar className="h-4 w-4 text-primary" /></div><div><p className="text-sm font-medium">{selectedUser.eventsCreated}</p><p className="text-xs text-muted-foreground">Events erstellt</p></div></div>
                        <div className="flex items-center gap-3"><div className="bg-primary/10 rounded-lg p-2"><Sparkles className="h-4 w-4 text-primary" /></div><div><p className="text-sm font-medium">{selectedUser.aiUsageThisMonth}</p><p className="text-xs text-muted-foreground">AI-Anfragen</p></div></div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="source" className="mt-0 space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4" />Registrierungsquelle</h4>
                    {selectedUser.agencyInfo ? (<div className="space-y-3"><Badge variant="default" className="gap-1"><Building2 className="h-3 w-3" />Über Agentur</Badge><div className="grid grid-cols-2 gap-4 mt-3"><div><Label className="text-muted-foreground text-xs">Agentur</Label><p className="font-medium">{selectedUser.agencyInfo.agency_name}</p></div><div><Label className="text-muted-foreground text-xs">Stadt</Label><p className="font-medium">{selectedUser.agencyInfo.agency_city}</p></div><div><Label className="text-muted-foreground text-xs">Land</Label><p className="font-medium">{selectedUser.agencyInfo.agency_country}</p></div></div></div>)
                    : selectedUser.affiliateVouchers.length > 0 ? (<div className="space-y-3"><Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Über Affiliate</Badge>{selectedUser.affiliateVouchers.map((av, idx) => (<div key={idx} className="grid grid-cols-2 gap-4 mt-3"><div><Label className="text-muted-foreground text-xs">Partner</Label><p className="font-medium">{av.affiliate?.contact_name || "-"}</p></div><div><Label className="text-muted-foreground text-xs">E-Mail</Label><p className="font-medium">{av.affiliate?.email || "-"}</p></div></div>))}</div>)
                    : selectedUser.redemptions.length > 0 ? (<div className="space-y-3"><Badge variant="outline" className="gap-1"><Ticket className="h-3 w-3" />Über Voucher</Badge></div>)
                    : (<div className="space-y-3"><Badge variant="outline" className="gap-1"><User className="h-3 w-3" />Direkte Registrierung</Badge><p className="text-sm text-muted-foreground">Dieser Benutzer hat sich direkt registriert.</p></div>)}
                  </div>
                  {selectedUser.redemptions.length > 0 && (<div className="bg-muted/30 rounded-lg p-4 space-y-4"><h4 className="font-semibold flex items-center gap-2"><Ticket className="h-4 w-4" />Eingelöste Voucher</h4>{selectedUser.redemptions.map((r) => (<div key={r.id} className="border rounded-lg p-3"><div className="flex items-center justify-between"><code className="bg-muted px-2 py-1 rounded text-sm font-mono">{r.voucher?.code || r.voucher_id}</code>{r.voucher && <Badge variant="secondary">{r.voucher.discount_type === "percentage" ? `${r.voucher.discount_value}%` : `${r.voucher.discount_value}€`}</Badge>}</div><p className="text-sm text-muted-foreground mt-2">Eingelöst: {r.redeemed_at ? format(new Date(r.redeemed_at), "dd.MM.yyyy", { locale: de }) : "-"}</p></div>))}</div>)}
                </TabsContent>

                <TabsContent value="actions" className="mt-0 space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3"><h4 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" />Rolle ändern</h4><div className="flex flex-wrap gap-2">{(["member", "organizer", "moderator", "agency", "affiliate", "admin"] as AppRole[]).map((role) => (<Button key={role} variant={getPrimaryRole(selectedUser) === role ? "default" : "outline"} size="sm" className="capitalize" onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role })} disabled={updateRoleMutation.isPending}>{role}</Button>))}</div></div>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3"><h4 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" />Plan ändern</h4><div className="flex flex-wrap gap-2">{["free", "monthly", "yearly", "lifetime"].map((plan) => (<Button key={plan} variant={(selectedUser.subscription?.plan || "free") === plan ? "default" : "outline"} size="sm" className="capitalize" onClick={() => updatePlanMutation.mutate({ userId: selectedUser.id, plan })} disabled={updatePlanMutation.isPending}>{plan}</Button>))}</div></div>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3"><h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" />Credits anpassen</h4><div className="flex gap-2"><Input type="number" placeholder="Anzahl" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="w-24" /><Input placeholder="Grund" value={creditReason} onChange={(e) => setCreditReason(e.target.value)} className="flex-1" /><Button onClick={() => adjustCreditsMutation.mutate({ userId: selectedUser.id, amount: parseInt(creditAmount), reason: creditReason })} disabled={!creditAmount || !creditReason || adjustCreditsMutation.isPending}>Anpassen</Button></div></div>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3"><h4 className="font-semibold flex items-center gap-2"><Key className="h-4 w-4" />Passwort zurücksetzen</h4><div className="flex gap-2"><Input type="text" placeholder="Neues Passwort" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><Button variant="outline" onClick={() => setNewPassword(generatePassword())}>Generieren</Button><Button onClick={() => resetPasswordMutation.mutate({ userId: selectedUser.id, password: newPassword })} disabled={!newPassword || resetPasswordMutation.isPending}>Zurücksetzen</Button></div></div>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3"><h4 className="font-semibold flex items-center gap-2"><Mail className="h-4 w-4" />Nachricht senden</h4><Input placeholder="Betreff" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} /><Textarea placeholder="Nachricht..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={3} /><Button onClick={() => sendMessageMutation.mutate({ userId: selectedUser.id, subject: messageSubject, content: messageContent })} disabled={!messageSubject || !messageContent || sendMessageMutation.isPending} className="w-full"><Mail className="h-4 w-4 mr-2" />Senden</Button></div>
                  <Separator />
                  <div className="border border-destructive/50 rounded-lg p-4 space-y-3"><h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Gefahrenbereich</h4><Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Benutzer löschen</Button></div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 space-y-6">
                  <div className="space-y-4"><h4 className="font-semibold flex items-center gap-2"><History className="h-4 w-4" />Aktivitäts-Historie</h4>
                    <div className="space-y-2">
                      {selectedUser.creditAdjustments.map((adj) => (<div key={adj.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"><div className={`p-2 rounded-full ${adj.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}><Sparkles className={`h-4 w-4 ${adj.amount > 0 ? "text-green-500" : "text-red-500"}`} /></div><div className="flex-1"><p className="text-sm font-medium">Credits {adj.amount > 0 ? `+${adj.amount}` : adj.amount}</p><p className="text-xs text-muted-foreground">{adj.reason}</p></div><p className="text-xs text-muted-foreground">{format(new Date(adj.created_at), "dd.MM.yy HH:mm", { locale: de })}</p></div>))}
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"><div className="p-2 rounded-full bg-primary/10"><UserPlus className="h-4 w-4 text-primary" /></div><div className="flex-1"><p className="text-sm font-medium">Account erstellt</p></div><p className="text-xs text-muted-foreground">{selectedUser.created_at ? format(new Date(selectedUser.created_at), "dd.MM.yy HH:mm", { locale: de }) : "-"}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4"><div className="bg-muted/30 rounded-lg p-4"><div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Events erstellt</span></div><p className="text-2xl font-bold">{selectedUser.eventsCreated}</p></div><div className="bg-muted/30 rounded-lg p-4"><div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">AI-Anfragen</span></div><p className="text-2xl font-bold">{selectedUser.aiUsageThisMonth}</p></div></div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Benutzer löschen?</AlertDialogTitle><AlertDialogDescription>Sind Sie sicher, dass Sie <strong>{selectedUser?.email}</strong> löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (selectedUser) deleteUserMutation.mutate(selectedUser.id); }}>{deleteUserMutation.isPending ? "Lösche..." : "Endgültig löschen"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
