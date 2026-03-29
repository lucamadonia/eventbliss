import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Mail,
  Shield,
  ShieldCheck,
  UserCog,
  UserMinus,
  Clock,
  Calendar,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
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
import { Progress } from "@/components/ui/progress";
import { useAgency, AgencyRole, AgencyMember } from "@/hooks/useAgency";
import { toast } from "sonner";

const roleLabels: Record<AgencyRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Manager",
  viewer: "Assistant",
};

const roleColors: Record<AgencyRole, string> = {
  owner: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  admin: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  member: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  viewer: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  invited: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  removed: "bg-red-500/20 text-red-300 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  invited: "Eingeladen",
  removed: "Deaktiviert",
};

const roleIcons: Record<AgencyRole, typeof Shield> = {
  owner: ShieldCheck,
  admin: Shield,
  member: UserCog,
  viewer: Users,
};

const ROLE_HIERARCHY: Record<AgencyRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Gerade aktiv";
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `vor ${days} Tagen`;
    return formatDate(dateStr);
  } catch {
    return "—";
  }
}

export function AgencyTeamManager() {
  const { t } = useTranslation();
  const {
    members,
    isLoading,
    inviteMember,
    removeMember,
    updateMemberRole,
  } = useAgency();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AgencyRole>("member");
  const [inviting, setInviting] = useState(false);

  const activeMembers = members.filter((m) => m.status === "active");
  const maxTasks = Math.max(...members.map((m) => m.task_count), 1);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }
    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: AgencyMember, newRole: AgencyRole) => {
    if (member.role === "owner") return;
    await updateMemberRole(member.id, newRole);
  };

  const handleDeactivate = async (member: AgencyMember) => {
    if (member.role === "owner") return;
    await removeMember(member.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Team verwalten</h3>
          <p className="text-sm text-white/40">
            {members.length} Mitglieder
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Mitglied einladen
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Teammitglied einladen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-white/60 text-xs">E-Mail-Adresse</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="email@beispiel.de"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Rolle</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as AgencyRole)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Rolle wahlen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Manager</SelectItem>
                    <SelectItem value="viewer">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-white/30">
                Die eingeladene Person erhalt eine E-Mail mit einem Link zur
                Registrierung.
              </p>
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Einladung senden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Workload Overview */}
      {activeMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="text-sm font-medium text-white/50 mb-4">
            Arbeitsauslastung
          </h4>
          <div className="space-y-3">
            {activeMembers.map((member) => {
              const pct = Math.round((member.task_count / maxTasks) * 100);
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-300">
                      {getInitials(member.name, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white w-28 truncate shrink-0">
                    {member.name || member.email}
                  </span>
                  <div className="flex-1">
                    <Progress value={pct} className="h-2 bg-white/10" />
                  </div>
                  <span className="text-xs text-white/40 w-20 text-right shrink-0 flex items-center gap-1 justify-end">
                    <ClipboardList className="w-3 h-3" />
                    {member.task_count} Aufgaben
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {members.length === 0 && (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-10 text-center">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">
              Noch keine Teammitglieder. Lade jemanden ein!
            </p>
          </div>
        )}

        {members.map((member) => {
          const RoleIcon = roleIcons[member.role];
          const isOwner = member.role === "owner";
          const isInactive = member.status === "removed";

          return (
            <div
              key={member.id}
              className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 ${
                isInactive ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm">
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-white">
                      {member.name || member.email}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${roleColors[member.role]}`}
                    >
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleLabels[member.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[member.status]}`}
                    >
                      {statusLabels[member.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40">{member.email}</p>
                  <div className="flex gap-4 mt-1.5 text-xs text-white/30 flex-wrap">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {member.task_count} Aufgaben
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastActive(member.joined_at)}
                    </span>
                    <span className="hidden sm:inline flex items-center gap-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Beigetreten: {formatDate(member.invited_at)}
                    </span>
                  </div>
                </div>

                {/* Role change dropdown (not for owner) */}
                {!isOwner && member.status === "active" && (
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      handleRoleChange(member, v as AgencyRole)
                    }
                  >
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-xs h-8 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Manager</SelectItem>
                      <SelectItem value="viewer">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Deactivate button (not for owner) */}
                {!isOwner && member.status !== "removed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/20 hover:text-red-400 shrink-0"
                    onClick={() => handleDeactivate(member)}
                    title="Mitglied deaktivieren"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
