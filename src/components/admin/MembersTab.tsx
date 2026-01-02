import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreVertical, Crown, Shield, User, RefreshCw, MessageSquare, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Member {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  plan: string;
  role: string | null;
}

const MESSAGE_TEMPLATES = [
  { key: "welcome", label: "Willkommen", subject: "Willkommen bei EventBliss!", content: "Hallo {name},\n\nwillkommen bei EventBliss! Wir freuen uns, dich an Bord zu haben.\n\nBei Fragen stehen wir dir jederzeit zur Verfügung.\n\nViele Grüße,\nDas EventBliss Team" },
  { key: "upgrade", label: "Upgrade Angebot", subject: "Exklusives Upgrade-Angebot", content: "Hallo {name},\n\nwir möchten dir ein exklusives Angebot für ein Premium-Upgrade machen.\n\nMit Premium erhältst du:\n- Mehr AI Credits\n- Erweiterte Funktionen\n- Priority Support\n\nMelde dich bei uns für mehr Infos!\n\nViele Grüße,\nDas EventBliss Team" },
  { key: "support", label: "Support Anfrage", subject: "Deine Support-Anfrage", content: "Hallo {name},\n\nvielen Dank für deine Anfrage. Wir haben deine Nachricht erhalten und werden uns schnellstmöglich bei dir melden.\n\nViele Grüße,\nDas EventBliss Team" },
];

export function MembersTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuthContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Support message dialog
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Get profiles with their data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");

      if (profilesError) throw profilesError;

      // Get subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("user_id, plan");

      if (subError) throw subError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const membersData: Member[] = (profiles || []).map((profile) => {
        const subscription = subscriptions?.find((s) => s.user_id === profile.id);
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          plan: subscription?.plan || "free",
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
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      } else {
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

  const openMessageDialog = (member: Member) => {
    setMessageDialog({ open: true, member });
    setMessageSubject("");
    setMessageContent("");
    setSelectedTemplate("");
  };

  const applyTemplate = (templateKey: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.key === templateKey);
    if (template && messageDialog.member) {
      const name = messageDialog.member.full_name || messageDialog.member.email?.split("@")[0] || "Nutzer";
      setMessageSubject(template.subject);
      setMessageContent(template.content.replace(/{name}/g, name));
    }
    setSelectedTemplate(templateKey);
  };

  const handleSendMessage = async () => {
    if (!messageDialog.member || !currentUser) return;
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast({
        title: t("common.error"),
        description: t("admin.members.messageRequired", "Betreff und Nachricht sind erforderlich"),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("admin_messages")
        .insert({
          admin_id: currentUser.id,
          user_id: messageDialog.member.user_id,
          subject: messageSubject,
          content: messageContent,
          template_key: selectedTemplate || null,
        });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.members.messageSent", "Nachricht gespeichert"),
      });

      setMessageDialog({ open: false, member: null });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("common.error"),
        description: t("admin.members.messageError", "Fehler beim Speichern der Nachricht"),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string | null) => {
    if (role === "admin") return <Shield className="h-4 w-4 text-red-500" />;
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getPlanBadge = (plan: string) => {
    const planStyles: Record<string, { className: string; label: string }> = {
      lifetime: { className: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Lifetime" },
      yearly: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Yearly" },
      monthly: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Monthly" },
      free: { className: "", label: "Free" },
    };
    const style = planStyles[plan] || planStyles.free;
    
    if (plan === "free") {
      return <Badge variant="secondary">{style.label}</Badge>;
    }
    
    return (
      <Badge className={style.className}>
        <Crown className="h-3 w-3 mr-1" />
        {style.label}
      </Badge>
    );
  };

  return (
    <>
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
                  className="pl-9 w-[250px]"
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
                    <TableHead>{t("admin.members.email", "E-Mail")}</TableHead>
                    <TableHead>{t("admin.members.name", "Name")}</TableHead>
                    <TableHead>{t("admin.members.role", "Rolle")}</TableHead>
                    <TableHead>{t("admin.members.plan", "Plan")}</TableHead>
                    <TableHead>{t("admin.members.joined", "Beigetreten")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("admin.members.noMembers", "Keine Mitglieder gefunden")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {member.email || (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {member.user_id.slice(0, 8)}...
                              </code>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.full_name || <span className="text-muted-foreground">—</span>}
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
                              <DropdownMenuItem onClick={() => openMessageDialog(member)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {t("admin.members.sendMessage", "Nachricht senden")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleAdmin(member.user_id, member.role)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
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

      {/* Support Message Dialog */}
      <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ open, member: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.members.sendMessage", "Nachricht senden")}</DialogTitle>
            <DialogDescription>
              {t("admin.members.sendMessageDesc", "Sende eine Support-Nachricht an")} {messageDialog.member?.email || messageDialog.member?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.members.template", "Vorlage")}</Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.members.selectTemplate", "Vorlage auswählen...")} />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.members.subject", "Betreff")} *</Label>
              <Input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder={t("admin.members.subjectPlaceholder", "Betreff eingeben...")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.members.message", "Nachricht")} *</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={t("admin.members.messagePlaceholder", "Nachricht eingeben...")}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog({ open: false, member: null })}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending}>
              {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("admin.members.send", "Senden")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
