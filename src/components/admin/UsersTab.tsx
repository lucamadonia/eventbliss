import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, UserPlus, Loader2, Search, Key } from "lucide-react";
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
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [plan, setPlan] = useState("free");

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

  const filteredProfiles = profiles?.filter(profile => 
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
                    <SelectItem value="premium">Premium</SelectItem>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("admin.users.noUsers", "Keine Benutzer gefunden")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.email || "-"}</TableCell>
                      <TableCell>{profile.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getUserPlan(profile.id) === "premium" ? "default" : "secondary"}>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
