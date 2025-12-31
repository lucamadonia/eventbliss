import { motion } from "framer-motion";
import { Users, TrendingUp, Clock, Calendar, Wallet, MessageSquare, Bot, Check, HelpCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoDashboard = () => {
  const { t } = useTranslation();

  const mockStats = [
    { icon: Users, value: "8", label: t("landing.demo.live.dashboard.participants", "Teilnehmer"), color: "text-primary" },
    { icon: TrendingUp, value: "6", label: t("landing.demo.live.dashboard.responses", "Antworten"), color: "text-accent" },
    { icon: Clock, value: "75%", label: t("landing.demo.live.dashboard.responseRate", "Rücklaufquote"), color: "text-success" },
    { icon: Calendar, value: t("landing.demo.live.dashboard.planning", "Planung"), label: t("landing.demo.live.dashboard.status", "Status"), color: "text-warning" },
  ];

  const mockParticipants = [
    { name: "Sarah M.", status: "confirmed", avatar: "S" },
    { name: "Michael K.", status: "confirmed", avatar: "M" },
    { name: "Anna L.", status: "maybe", avatar: "A" },
    { name: "Tom B.", status: "invited", avatar: "T" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <Check className="w-3 h-3 text-success" />;
      case "maybe": return <HelpCircle className="w-3 h-3 text-warning" />;
      default: return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/20 text-success";
      case "maybe": return "bg-warning/20 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 p-2">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {mockStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/50 rounded-lg p-2 text-center border border-border/50"
          >
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <div className="font-bold text-sm">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground truncate">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Participants */}
      <div className="flex-1 bg-card/30 rounded-lg p-3 border border-border/50">
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          {t("landing.demo.live.dashboard.participantList", "Teilnehmer")}
        </h4>
        <div className="space-y-2">
          {mockParticipants.map((participant, index) => (
            <motion.div
              key={participant.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">
                {participant.avatar}
              </div>
              <span className="text-xs flex-1">{participant.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(participant.status)}`}>
                {getStatusIcon(participant.status)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Wallet, label: t("landing.demo.live.dashboard.expenses", "Kosten"), color: "from-accent to-neon-pink" },
          { icon: MessageSquare, label: t("landing.demo.live.dashboard.messages", "Nachrichten"), color: "from-neon-cyan to-primary" },
          { icon: Bot, label: t("landing.demo.live.dashboard.askAI", "KI fragen"), color: "from-primary to-accent" },
        ].map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-card/50 border border-border/50 rounded-lg p-2 flex flex-col items-center gap-1 hover:bg-card transition-colors"
          >
            <div className={`p-1.5 rounded-md bg-gradient-to-br ${action.color}`}>
              <action.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] text-muted-foreground">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export { DemoDashboard };
