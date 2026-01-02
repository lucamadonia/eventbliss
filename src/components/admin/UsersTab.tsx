import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, UserPlus, Loader2, Search, Key, MoreVertical, Pencil, Trash2, KeyRound, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  must_change_password: boolean | null;
  created_at: string;
}

interface Subscription {
  user_id: string;
  plan: string;
  expires_at: string | null;
}

export function UsersTab() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for create
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [plan, setPlan] = useState("free");

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: Profile | null }>({ open: false, user: null });
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");

  // Password reset dialog
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [newPassword, setNewPassword] = useState("");

  // Subscription dialog
  const [subDialog, setSubDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [subPlan, setSubPlan] = useState("free");
  const [subExpiry, setSubExpiry] = useState("");

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: Profile | null }>({ open: false, user: null });

  // Fetch profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions-for-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("user_id, plan, expires_at");
      
      if (error) throw error;
      return data as Subscription[];
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; fullName?: string; plan?: string }) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: userData,
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(t("admin.users.createSuccess", "Benutzer erfolgreich erstellt"));
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-for-users"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("admin.users.createError", "Fehler beim Erstellen des Benutzers"));
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { action: string; userId: string; email?: string; password?: string; fullName?: string }) => {
      const { data: result, error } = await supabase.functions.invoke("update-user", {
        body: data,
      });
      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
        update: t("admin.users.updateSuccess", "Benutzer aktualisiert"),
        resetPassword: t("admin.users.passwordResetSuccess", "Passwort zurückgesetzt"),
        delete: t("admin.users.deleteSuccess", "Benutzer gelöscht"),
      };
      toast.success(messages[variables.action] || "Erfolgreich");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-for-users"] });
      setEditDialog({ open: false, user: null });
      setPasswordDialog({ open: false, userId: null });
      setDeleteDialog({ open: false, user: null });
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update subscription mutation
  const updateSubMutation = useMutation({
    mutationFn: async (data: { userId: string; plan: string; expiresAt: string | null }) => {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", data.userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("subscriptions")
          .update({ 
            plan: data.plan, 
            expires_at: data.expiresAt,
            is_manual: true,
          })
          .eq("user_id", data.userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({ 
            user_id: data.userId, 
            plan: data.plan, 
            expires_at: data.expiresAt,
            is_manual: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("admin.users.subscriptionUpdated", "Abonnement aktualisiert"));
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-for-users"] });
      setSubDialog({ open: false, userId: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPlan("free");
  };

  const handleCreateUser = () => {
    if (!email || !password) {
      toast.error(t("admin.users.requiredFields", "E-Mail und Passwort sind erforderlich"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("admin.users.passwordTooShort", "Passwort muss mindestens 6 Zeichen haben"));
      return;
    }
    createUserMutation.mutate({ email, password, fullName, plan });
  };

  const getUserPlan = (userId: string): string => {
    const sub = subscriptions?.find(s => s.user_id === userId);
    return sub?.plan || "free";
  };

  const getUserSubscription = (userId: string): Subscription | undefined => {
    return subscriptions?.find(s => s.user_id === userId);
  };

  const openEditDialog = (user: Profile) => {
    setEditEmail(user.email || "");
    setEditFullName(user.full_name || "");
    setEditDialog({ open: true, user });
  };

  const openSubDialog = (userId: string) => {
    const sub = getUserSubscription(userId);
    setSubPlan(sub?.plan || "free");
    setSubExpiry(sub?.expires_at ? sub.expires_at.split("T")[0] : "");
    setSubDialog({ open: true, userId });
  };

  const filteredProfiles = profiles?.filter(profile => 
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("admin.users.title", "Benutzer-Verwaltung")}
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.users.create", "Benutzer erstellen")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("admin.users.createTitle", "Neuen Benutzer erstellen")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("admin.users.email", "E-Mail")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="benutzer@beispiel.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("admin.users.password", "Passwort")} *</Label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {t("admin.users.mustChangePassword", "Benutzer muss Passwort nach erstem Login ändern")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("admin.users.fullName", "Vollständiger Name")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">{t("admin.users.plan", "Abo-Paket")}</Label>
                  <Select value={plan} onValueChange={setPlan}>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  {t("common.cancel", "Abbrechen")}
                </Button>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.users.create", "Benutzer erstellen")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.users.search", "Benutzer suchen...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {profilesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.email", "E-Mail")}</TableHead>
                    <TableHead>{t("admin.users.name", "Name")}</TableHead>
                    <TableHead>{t("admin.users.plan", "Paket")}</TableHead>
                    <TableHead>{t("admin.users.status", "Status")}</TableHead>
                    <TableHead>{t("admin.users.createdAt", "Erstellt am")}</TableHead>
                    <TableHead className="w-[80px]">{t("admin.users.actions", "Aktionen")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("admin.users.noUsers", "Keine Benutzer gefunden")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles?.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.email || "-"}</TableCell>
                        <TableCell>{profile.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getUserPlan(profile.id) !== "free" ? "default" : "secondary"}>
                            {getUserPlan(profile.id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {profile.must_change_password ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              {t("admin.users.mustChange", "Passwort ändern")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {t("admin.users.active", "Aktiv")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(profile.created_at), "dd.MM.yyyy", { 
                            locale: i18n.language === "de" ? de : undefined 
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(profile)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("admin.users.edit", "Bearbeiten")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPasswordDialog({ open: true, userId: profile.id })}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                {t("admin.users.resetPassword", "Passwort zurücksetzen")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openSubDialog(profile.id)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                {t("admin.users.manageSubscription", "Abo verwalten")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, user: profile })}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("admin.users.delete", "Löschen")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.editTitle", "Benutzer bearbeiten")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.users.email", "E-Mail")}</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.users.fullName", "Vollständiger Name")}</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={() => {
                if (editDialog.user) {
                  updateUserMutation.mutate({
                    action: "update",
                    userId: editDialog.user.id,
                    email: editEmail,
                    fullName: editFullName,
                  });
                }
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.resetPasswordTitle", "Passwort zurücksetzen")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.resetPasswordDesc", "Setze ein neues Passwort für den Benutzer. Er wird aufgefordert, es beim nächsten Login zu ändern.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.users.newPassword", "Neues Passwort")}</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, userId: null })}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={() => {
                if (passwordDialog.userId && newPassword.length >= 6) {
                  updateUserMutation.mutate({
                    action: "resetPassword",
                    userId: passwordDialog.userId,
                    password: newPassword,
                  });
                } else {
                  toast.error(t("admin.users.passwordTooShort", "Passwort muss mindestens 6 Zeichen haben"));
                }
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("admin.users.resetPassword", "Passwort zurücksetzen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subDialog.open} onOpenChange={(open) => setSubDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.manageSubscription", "Abonnement verwalten")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.users.plan", "Plan")}</Label>
              <Select value={subPlan} onValueChange={setSubPlan}>
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
              <Label>{t("admin.users.expiryDate", "Ablaufdatum")}</Label>
              <Input
                type="date"
                value={subExpiry}
                onChange={(e) => setSubExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.users.expiryHint", "Leer lassen für unbegrenzt")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog({ open: false, userId: null })}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={() => {
                if (subDialog.userId) {
                  updateSubMutation.mutate({
                    userId: subDialog.userId,
                    plan: subPlan,
                    expiresAt: subExpiry ? new Date(subExpiry).toISOString() : null,
                  });
                }
              }}
              disabled={updateSubMutation.isPending}
            >
              {updateSubMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.deleteConfirmTitle", "Benutzer löschen?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.deleteConfirmDesc", "Diese Aktion kann nicht rückgängig gemacht werden. Der Benutzer und alle zugehörigen Daten werden dauerhaft gelöscht.")}
              {deleteDialog.user && (
                <span className="block mt-2 font-medium">{deleteDialog.user.email}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialog.user) {
                  updateUserMutation.mutate({
                    action: "delete",
                    userId: deleteDialog.user.id,
                  });
                }
              }}
            >
              {t("admin.users.delete", "Löschen")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
