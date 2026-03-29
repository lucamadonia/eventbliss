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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type TeamRole = "owner" | "admin" | "manager" | "assistant";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  activeEvents: number;
  maxEvents: number;
  lastActive: string;
  joinedDate: string;
  status: "active" | "inactive";
}

const roleLabels: Record<TeamRole, string> = {
  owner: "Agency Owner",
  admin: "Agency Admin",
  manager: "Event Manager",
  assistant: "Assistant",
};

const roleColors: Record<TeamRole, string> = {
  owner: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  admin: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  manager: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  assistant: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const roleIcons: Record<TeamRole, typeof Shield> = {
  owner: ShieldCheck,
  admin: Shield,
  manager: UserCog,
  assistant: Users,
};

const mockTeam: TeamMember[] = [
  { id: "1", name: "Lisa M\u00FCller", email: "lisa@eventbliss-agentur.de", role: "owner", activeEvents: 5, maxEvents: 10, lastActive: "Gerade aktiv", joinedDate: "Jan 2024", status: "active" },
  { id: "2", name: "Tom Krause", email: "tom@eventbliss-agentur.de", role: "admin", activeEvents: 4, maxEvents: 8, lastActive: "vor 1 Std.", joinedDate: "M\u00E4r 2024", status: "active" },
  { id: "3", name: "Anna Schmidt", email: "anna@eventbliss-agentur.de", role: "manager", activeEvents: 3, maxEvents: 6, lastActive: "vor 3 Std.", joinedDate: "Jun 2024", status: "active" },
  { id: "4", name: "Max Bauer", email: "max@eventbliss-agentur.de", role: "manager", activeEvents: 2, maxEvents: 6, lastActive: "vor 5 Std.", joinedDate: "Sep 2024", status: "active" },
  { id: "5", name: "Sophie Klein", email: "sophie@eventbliss-agentur.de", role: "assistant", activeEvents: 1, maxEvents: 4, lastActive: "Gestern", joinedDate: "Jan 2025", status: "active" },
  { id: "6", name: "Paul Richter", email: "paul@eventbliss-agentur.de", role: "assistant", activeEvents: 0, maxEvents: 4, lastActive: "vor 3 Tagen", joinedDate: "Feb 2025", status: "inactive" },
];

export function AgencyTeamManager() {
  const { t } = useTranslation();
  const [inviteOpen, setInviteOpen] = useState(false);

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
          <p className="text-sm text-white/40">{mockTeam.length} Mitglieder</p>
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
                <Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="email@beispiel.de" />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Rolle</Label>
                <Select>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Rolle w\u00E4hlen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Agency Admin</SelectItem>
                    <SelectItem value="manager">Event Manager</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-white/30">
                Die eingeladene Person erh\u00E4lt eine E-Mail mit einem Link zur Registrierung.
              </p>
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setInviteOpen(false)}>
                <Mail className="w-4 h-4 mr-2" />
                Einladung senden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Workload Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
      >
        <h4 className="text-sm font-medium text-white/50 mb-4">Arbeitsauslastung</h4>
        <div className="space-y-3">
          {mockTeam.filter(m => m.status === "active").map((member) => {
            const pct = Math.round((member.activeEvents / member.maxEvents) * 100);
            return (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-300">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white w-28 truncate shrink-0">{member.name}</span>
                <div className="flex-1">
                  <Progress value={pct} className="h-2 bg-white/10" />
                </div>
                <span className="text-xs text-white/40 w-16 text-right shrink-0">
                  {member.activeEvents}/{member.maxEvents} Events
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {mockTeam.map((member) => {
          const RoleIcon = roleIcons[member.role];
          return (
            <div
              key={member.id}
              className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 ${member.status === "inactive" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${roleColors[member.role]}`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleLabels[member.role]}
                    </Badge>
                    {member.status === "inactive" && (
                      <Badge variant="outline" className="text-[10px] border-white/10 text-white/30">Inaktiv</Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/40">{member.email}</p>
                  <div className="flex gap-4 mt-1.5 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {member.activeEvents} aktive Events
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {member.lastActive}
                    </span>
                    <span className="hidden sm:inline">Beigetreten: {member.joinedDate}</span>
                  </div>
                </div>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/20 hover:text-red-400 shrink-0"
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
