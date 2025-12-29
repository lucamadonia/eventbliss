import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Crown, Shield, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Member {
  user_id: string;
  email: string;
  created_at: string;
  plan: string;
  role: string | null;
}

export function MembersTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Get subscriptions with user info
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("user_id, plan, created_at");

      if (subError) throw subError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data - we don't have direct access to auth.users emails via client
      // So we'll use the subscription data and match with roles
      const membersData: Member[] = (subscriptions || []).map((sub) => {
        const userRole = roles?.find((r) => r.user_id === sub.user_id);
        return {
          user_id: sub.user_id,
          email: `User ${sub.user_id.slice(0, 8)}...`, // Placeholder - would need edge function
          created_at: sub.created_at,
          plan: sub.plan,
          role: userRole?.role || null,
        };
      });

      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: t("common.error"),
        description: t("admin.members.fetchError", "Fehler beim Laden der Mitglieder"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleToggleAdmin = async (userId: string, currentRole: string | null) => {
    try {
      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
      }

      toast({
        title: t("common.success"),
        description: t("admin.members.roleUpdated", "Rolle aktualisiert"),
      });

      fetchMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: t("common.error"),
        description: t("admin.members.roleError", "Fehler beim Aktualisieren der Rolle"),
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter((m) =>
    m.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string | null) => {
    if (role === "admin") return <Shield className="h-4 w-4 text-red-500" />;
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getPlanBadge = (plan: string) => {
    if (plan === "premium") {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>{t("admin.members.title", "Mitglieder-Verwaltung")}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchMembers}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
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
                  <TableHead>{t("admin.members.user", "Benutzer")}</TableHead>
                  <TableHead>{t("admin.members.role", "Rolle")}</TableHead>
                  <TableHead>{t("admin.members.plan", "Plan")}</TableHead>
                  <TableHead>{t("admin.members.joined", "Beigetreten")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("admin.members.noMembers", "Keine Mitglieder gefunden")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {member.user_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="capitalize">
                            {member.role || t("admin.members.user", "User")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(member.plan)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleAdmin(member.user_id, member.role)}
                            >
                              {member.role === "admin"
                                ? t("admin.members.removeAdmin", "Admin-Rechte entfernen")
                                : t("admin.members.makeAdmin", "Zum Admin machen")}
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
  );
}
