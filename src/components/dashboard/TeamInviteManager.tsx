import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

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

  const getStatusBadge = (participant: Participant) => {
    if (participant.invite_claimed_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/15 text-success border border-success/30">
          <CheckCircle className="w-3 h-3" />
          Aktiviert
        </span>
      );
    }
    if (participant.invite_sent_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/15 text-warning border border-warning/30">
          <Clock className="w-3 h-3" />
          Eingeladen
        </span>
      );
    }
    if (participant.can_access_dashboard) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
          <Link2 className="w-3 h-3" />
          Bereit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
        <XCircle className="w-3 h-3" />
        Kein Zugang
      </span>
    );
  };

  const permissionLabels: Record<keyof DashboardPermissions, { label: string; icon: typeof Eye }> = {
    can_view_responses: { label: "Antworten ansehen", icon: Eye },
    can_add_expenses: { label: "Ausgaben eintragen", icon: PlusCircle },
    can_view_all_expenses: { label: "Alle Ausgaben sehen", icon: Wallet },
    can_edit_settings: { label: "Einstellungen bearbeiten", icon: Settings },
  };

  return (
    <GlassCard className="p-6">
      <h4 className="font-bold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Dashboard-Zugänge verwalten
      </h4>

      <p className="text-sm text-muted-foreground mb-6">
        Aktiviere Dashboard-Zugang für Teilnehmer und teile den Einladungslink.
        Mit dem Link können sie einen Account erstellen und sich verifizieren.
      </p>

      <div className="space-y-3">
        {participants.map((participant) => {
          const isExpanded = expandedParticipant === participant.id;
          const permissions = participant.dashboard_permissions || defaultPermissions;
          const hasAccess = participant.can_access_dashboard;
          const isLoading = loadingStates[participant.id];

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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{participant.name}</span>
                        {participant.role === "organizer" && (
                          <ShieldCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getStatusBadge(participant)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                            Link kopieren
                          </>
                        )}
                      </Button>
                    )}

                    {/* Expand button for permissions */}
                    {hasAccess && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
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
