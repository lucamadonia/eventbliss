import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Crown, RefreshCw, Plus, Pencil, Trash2, ChevronsUpDown, Check, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  expires_at: string | null;
  created_at: string;
  stripe_subscription_id: string | null;
  notes: string | null;
  is_manual: boolean | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

export function SubscriptionsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  
  // Edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    subscription: Subscription | null;
  }>({ open: false, subscription: null });
  const [newPlan, setNewPlan] = useState("free");
  const [newExpiry, setNewExpiry] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [createPlan, setCreatePlan] = useState("monthly");
  const [createExpiry, setCreateExpiry] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subscriptions
      let query = supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("plan", filter);
      }

      const { data: subData, error: subError } = await query;
      if (subError) throw subError;
      setSubscriptions(subData || []);

      // Fetch profiles for user lookup
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name");
      if (profileError) throw profileError;
      setProfiles(profileData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.fetchError", "Fehler beim Laden der Abos"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const getUserDisplay = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (profile?.email) return profile.email;
    if (profile?.full_name) return profile.full_name;
    return `${userId.slice(0, 8)}...`;
  };

  const handleEdit = (subscription: Subscription) => {
    setEditDialog({ open: true, subscription });
    setNewPlan(subscription.plan);
    setNewExpiry(subscription.expires_at ? subscription.expires_at.split("T")[0] : "");
    setNewNotes(subscription.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editDialog.subscription) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: newPlan,
          expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
          notes: newNotes || null,
        })
        .eq("id", editDialog.subscription.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.subscriptions.updated", "Abo aktualisiert"),
      });

      setEditDialog({ open: false, subscription: null });
      fetchData();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.updateError", "Fehler beim Aktualisieren"),
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (!selectedUserId) {
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.userRequired", "Bitte wähle einen Benutzer aus"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already has subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", selectedUserId)
        .single();

      if (existing) {
        toast({
          title: t("common.error"),
          description: t("admin.subscriptions.alreadyExists", "Benutzer hat bereits ein Abo. Bitte bearbeite das existierende."),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: selectedUserId,
          plan: createPlan,
          expires_at: createExpiry ? new Date(createExpiry).toISOString() : null,
          notes: createNotes || null,
          is_manual: true,
        });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.subscriptions.created", "Abo erstellt"),
      });

      setCreateDialog(false);
      setSelectedUserId("");
      setCreatePlan("monthly");
      setCreateExpiry("");
      setCreateNotes("");
      fetchData();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.createError", "Fehler beim Erstellen"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.subscriptions.confirmDelete", "Abo wirklich löschen?"))) return;

    try {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.subscriptions.deleted", "Abo gelöscht"),
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.deleteError", "Fehler beim Löschen"),
        variant: "destructive",
      });
    }
  };

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      lifetime: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      yearly: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      monthly: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    };
    
    if (plan === "free") {
      return <Badge variant="secondary">Free</Badge>;
    }
    
    return (
      <Badge className={styles[plan] || ""}>
        <Crown className="h-3 w-3 mr-1" />
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  // Get users without subscription for create dialog
  const usersWithoutSub = profiles.filter(
    p => !subscriptions.some(s => s.user_id === p.id)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t("admin.subscriptions.title", "Abonnement-Verwaltung")}</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("common.filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.subscriptions.create", "Neues Abo")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.subscriptions.user", "Benutzer")}</TableHead>
                    <TableHead>{t("admin.subscriptions.plan", "Plan")}</TableHead>
                    <TableHead>{t("admin.subscriptions.type", "Typ")}</TableHead>
                    <TableHead>{t("admin.subscriptions.expires", "Läuft ab")}</TableHead>
                    <TableHead>{t("admin.subscriptions.notes", "Notiz")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("admin.subscriptions.noSubscriptions", "Keine Abos gefunden")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {getUserDisplay(sub.user_id)}
                        </TableCell>
                        <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                        <TableCell>
                          {sub.stripe_subscription_id ? (
                            <Badge variant="outline">Stripe</Badge>
                          ) : sub.is_manual ? (
                            <Badge variant="secondary">Manuell</Badge>
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub.expires_at
                            ? format(new Date(sub.expires_at), "dd.MM.yyyy", { locale: de })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[150px] truncate">
                          {sub.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(sub)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sub.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, subscription: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.subscriptions.editTitle", "Abo bearbeiten")}</DialogTitle>
            <DialogDescription>
              {t("admin.subscriptions.editDescription", "Ändere den Plan, Ablaufdatum oder Notizen")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.plan", "Plan")}</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.expiryDate", "Ablaufdatum")}</Label>
              <Input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.subscriptions.expiryHint", "Leer lassen für unbegrenzt")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.notes", "Notizen")}</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t("admin.subscriptions.notesPlaceholder", "z.B. Partner-Account, Testzugang...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, subscription: null })}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.subscriptions.createTitle", "Neues Abo erstellen")}</DialogTitle>
            <DialogDescription>
              {t("admin.subscriptions.createDescription", "Erstelle ein manuelles Abo für einen Benutzer")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.user", "Benutzer")} *</Label>
              <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedUserId
                      ? getUserDisplay(selectedUserId)
                      : t("admin.subscriptions.selectUser", "Benutzer auswählen...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder={t("admin.subscriptions.searchUser", "Benutzer suchen...")} />
                    <CommandList>
                      <CommandEmpty>{t("admin.subscriptions.noUserFound", "Kein Benutzer gefunden")}</CommandEmpty>
                      <CommandGroup>
                        {usersWithoutSub.map((profile) => (
                          <CommandItem
                            key={profile.id}
                            value={profile.email || profile.id}
                            onSelect={() => {
                              setSelectedUserId(profile.id);
                              setUserSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUserId === profile.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            {profile.email || profile.full_name || profile.id.slice(0, 8)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.plan", "Plan")}</Label>
              <Select value={createPlan} onValueChange={setCreatePlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.expiryDate", "Ablaufdatum")}</Label>
              <Input
                type="date"
                value={createExpiry}
                onChange={(e) => setCreateExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.subscriptions.expiryHint", "Leer lassen für unbegrenzt")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.notes", "Notizen")}</Label>
              <Textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder={t("admin.subscriptions.notesPlaceholder", "z.B. Partner-Account, Testzugang...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate}>{t("admin.subscriptions.create", "Erstellen")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
