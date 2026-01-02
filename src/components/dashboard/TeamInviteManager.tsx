import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  Users,
  Mail,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Eye,
  PlusCircle,
  Wallet,
  Settings,
  Link2,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Participant, DashboardPermissions } from "@/hooks/useEvent";

interface TeamInviteManagerProps {
  eventSlug: string;
  eventId: string;
  participants: Participant[];
  onUpdate: () => void;
}

const defaultPermissions: DashboardPermissions = {
  can_view_responses: false,
  can_add_expenses: true,
  can_view_all_expenses: false,
  can_edit_settings: false,
};

export function TeamInviteManager({
  eventSlug,
  eventId,
  participants,
  onUpdate,
}: TeamInviteManagerProps) {
  const { t, ready } = useTranslation();
  
  // Ensure i18n is ready before rendering
  if (!ready) {
    return <SkeletonCard className="p-6" showAvatar={false} />;
  }
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  
  // Add participant state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantRole, setNewParticipantRole] = useState<"guest" | "organizer">("guest");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const getInviteLink = (inviteToken: string) => {
    return `${window.location.origin}/e/${eventSlug}/claim/${inviteToken}`;
  };

  const copyInviteLink = async (participant: Participant) => {
    if (!participant.invite_token) return;

    const link = getInviteLink(participant.invite_token);
    await navigator.clipboard.writeText(link);
    setCopiedId(participant.id);
    toast.success(`Einladungslink für ${participant.name} kopiert!`);

    // Update invite_sent_at if not already set
    if (!participant.invite_sent_at) {
      await supabase
        .from("participants")
        .update({ invite_sent_at: new Date().toISOString() })
        .eq("id", participant.id);
      onUpdate();
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDashboardAccess = async (participant: Participant, enabled: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [participant.id]: true }));

    try {
      const permissionsValue = enabled
        ? JSON.parse(JSON.stringify(participant.dashboard_permissions || defaultPermissions))
        : null;

      const { error } = await supabase
        .from("participants")
        .update({
          can_access_dashboard: enabled,
          dashboard_permissions: permissionsValue,
        })
        .eq("id", participant.id);

      if (error) throw error;

      toast.success(
        enabled
          ? `Dashboard-Zugang für ${participant.name} aktiviert`
          : `Dashboard-Zugang für ${participant.name} deaktiviert`
      );
      onUpdate();
    } catch (error) {
      console.error("Error updating access:", error);
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [participant.id]: false }));
    }
  };

  const updatePermission = async (
    participant: Participant,
    permission: keyof DashboardPermissions,
    value: boolean
  ) => {
    setLoadingStates((prev) => ({ ...prev, [`${participant.id}-${permission}`]: true }));

    try {
      const currentPermissions = participant.dashboard_permissions || defaultPermissions;
      const newPermissions = JSON.parse(JSON.stringify({ ...currentPermissions, [permission]: value }));

      const { error } = await supabase
        .from("participants")
        .update({ dashboard_permissions: newPermissions })
        .eq("id", participant.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`${participant.id}-${permission}`]: false }));
    }
  };

  const handleRenameParticipant = async (participantId: string) => {
    if (!editName.trim()) {
      toast.error("Name darf nicht leer sein");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [`rename-${participantId}`]: true }));

    try {
      const { error } = await supabase
        .from("participants")
        .update({ name: editName.trim() })
        .eq("id", participantId);

      if (error) throw error;

      toast.success("Teilnehmer umbenannt");
      setEditingId(null);
      setEditName("");
      onUpdate();
    } catch (error) {
      console.error("Error renaming participant:", error);
      toast.error("Fehler beim Umbenennen");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`rename-${participantId}`]: false }));
    }
  };

  const handleDeleteParticipant = async (participant: Participant) => {
    setLoadingStates((prev) => ({ ...prev, [`delete-${participant.id}`]: true }));

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", participant.id);

      if (error) throw error;

      toast.success(`${participant.name} wurde entfernt`);
      onUpdate();
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast.error("Fehler beim Entfernen");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`delete-${participant.id}`]: false }));
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) {
      toast.error(t("dashboard.team.nameRequired"));
      return;
    }

    setIsAddingParticipant(true);

    try {
      const { error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: newParticipantName.trim(),
          email: newParticipantEmail.trim() || null,
          role: newParticipantRole,
          status: "invited",
        });

      if (error) throw error;

      toast.success(t("dashboard.team.participantAdded", { name: newParticipantName }));
      setAddDialogOpen(false);
      setNewParticipantName("");
      setNewParticipantEmail("");
      setNewParticipantRole("guest");
      onUpdate();
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error(t("dashboard.team.addError"));
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const startEditing = (participant: Participant) => {
    setEditingId(participant.id);
    setEditName(participant.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const getStatusBadge = (participant: Participant) => {
    if (participant.invite_claimed_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/15 text-success border border-success/30">
          <CheckCircle className="w-3 h-3" />
          {t("dashboard.team.status.activated")}
        </span>
      );
    }
    if (participant.invite_sent_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/15 text-warning border border-warning/30">
          <Clock className="w-3 h-3" />
          {t("dashboard.team.status.invited")}
        </span>
      );
    }
    if (participant.can_access_dashboard) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
          <Link2 className="w-3 h-3" />
          {t("dashboard.team.status.ready")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
        <XCircle className="w-3 h-3" />
        {t("dashboard.team.status.noAccess")}
      </span>
    );
  };

  const permissionLabels: Record<keyof DashboardPermissions, { label: string; icon: typeof Eye }> = {
    can_view_responses: { label: t("dashboard.team.permissions.viewResponses"), icon: Eye },
    can_add_expenses: { label: t("dashboard.team.permissions.addExpenses"), icon: PlusCircle },
    can_view_all_expenses: { label: t("dashboard.team.permissions.viewAllExpenses"), icon: Wallet },
    can_edit_settings: { label: t("dashboard.team.permissions.editSettings"), icon: Settings },
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("dashboard.team.title")}
        </h4>
        
        {/* Add Participant Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {t("dashboard.team.addParticipant")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dashboard.team.addParticipant")}</DialogTitle>
              <DialogDescription>{t("dashboard.team.addParticipantDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="participantName">{t("dashboard.team.participantName")} *</Label>
                <Input
                  id="participantName"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder={t("dashboard.team.namePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participantEmail">{t("dashboard.team.participantEmail")}</Label>
                <Input
                  id="participantEmail"
                  type="email"
                  value={newParticipantEmail}
                  onChange={(e) => setNewParticipantEmail(e.target.value)}
                  placeholder={t("dashboard.team.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participantRole">{t("dashboard.team.participantRole")}</Label>
                <Select
                  value={newParticipantRole}
                  onValueChange={(value: "guest" | "organizer") => setNewParticipantRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">{t("dashboard.team.roles.guest")}</SelectItem>
                    <SelectItem value="organizer">{t("dashboard.team.roles.organizer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddParticipant} disabled={isAddingParticipant}>
                {isAddingParticipant ? t("common.loading") : t("dashboard.team.addButton")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {t("dashboard.team.description")}
      </p>

      <div className="space-y-3">
        {participants.map((participant) => {
          const isExpanded = expandedParticipant === participant.id;
          const permissions = participant.dashboard_permissions || defaultPermissions;
          const hasAccess = participant.can_access_dashboard;
          const isLoading = loadingStates[participant.id];
          const isEditing = editingId === participant.id;
          const isRenameLoading = loadingStates[`rename-${participant.id}`];
          const isDeleteLoading = loadingStates[`delete-${participant.id}`];

          return (
            <Collapsible
              key={participant.id}
              open={isExpanded}
              onOpenChange={(open) =>
                setExpandedParticipant(open ? participant.id : null)
              }
            >
              <div className="rounded-lg border border-border/50 bg-background/30 overflow-hidden">
                {/* Main row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameParticipant(participant.id);
                              if (e.key === "Escape") cancelEditing();
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRenameParticipant(participant.id)}
                            disabled={isRenameLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4 text-success" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{participant.name}</span>
                            {participant.role === "organizer" && (
                              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getStatusBadge(participant)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Edit Button */}
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(participant)}
                        className="h-8 w-8 p-0"
                        title="Umbenennen"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete Button - only for non-organizers */}
                    {participant.role !== "organizer" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Entfernen"
                            disabled={isDeleteLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Teilnehmer entfernen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchtest du <strong>{participant.name}</strong> wirklich aus dem Event entfernen? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteParticipant(participant)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Entfernen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Dashboard Access Toggle */}
                    <Switch
                      checked={hasAccess}
                      onCheckedChange={(checked) =>
                        toggleDashboardAccess(participant, checked)
                      }
                      disabled={isLoading}
                    />

                    {/* Copy Link Button */}
                    {hasAccess && participant.invite_token && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(participant)}
                        className="gap-2"
                      >
                        {copiedId === participant.id ? (
                          <>
                            <Check className="w-4 h-4 text-success" />
                            Kopiert
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Link
                          </>
                        )}
                      </Button>
                    )}

                    {/* Expand button for permissions */}
                    {hasAccess && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                </div>

                {/* Expanded permissions */}
                <CollapsibleContent>
                  <AnimatePresence>
                    {isExpanded && hasAccess && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50"
                      >
                        <div className="p-4 bg-muted/30">
                          <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Berechtigungen
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.keys(permissionLabels) as Array<keyof DashboardPermissions>).map(
                              (key) => {
                                const { label, icon: Icon } = permissionLabels[key];
                                const isPermLoading = loadingStates[`${participant.id}-${key}`];

                                return (
                                  <div
                                    key={key}
                                    className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                                  >
                                    <Label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <Icon className="w-4 h-4 text-muted-foreground" />
                                      {label}
                                    </Label>
                                    <Switch
                                      checked={permissions[key]}
                                      onCheckedChange={(checked) =>
                                        updatePermission(participant, key, checked)
                                      }
                                      disabled={isPermLoading}
                                    />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Keine Teilnehmer gefunden</p>
        </div>
      )}
    </GlassCard>
  );
}
