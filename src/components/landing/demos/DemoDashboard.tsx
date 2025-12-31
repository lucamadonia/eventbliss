import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Clock, Calendar, Wallet, MessageSquare, Bot, Check, HelpCircle, X, Sparkles, Bell, PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoDashboard = () => {
  const { t } = useTranslation();
  
  // Animated counters
  const [participantCount, setParticipantCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [showNewParticipant, setShowNewParticipant] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Animate numbers on mount
  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    
    // Participants counter
    let pStep = 0;
    const pTimer = setInterval(() => {
      pStep++;
      setParticipantCount(Math.min(8, Math.round((pStep / steps) * 8)));
      if (pStep >= steps) clearInterval(pTimer);
    }, duration / steps);
    
    // Responses counter
    let rStep = 0;
    const rTimer = setInterval(() => {
      rStep++;
      setResponseCount(Math.min(6, Math.round((rStep / steps) * 6)));
      if (rStep >= steps) clearInterval(rTimer);
    }, duration / steps);
    
    // Response rate counter
    let rrStep = 0;
    const rrTimer = setInterval(() => {
      rrStep++;
      setResponseRate(Math.min(75, Math.round((rrStep / steps) * 75)));
      if (rrStep >= steps) clearInterval(rrTimer);
    }, duration / steps);
    
    // Show new participant animation after 2s
    const npTimer = setTimeout(() => {
      setShowNewParticipant(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2500);
    
    return () => {
      clearInterval(pTimer);
      clearInterval(rTimer);
      clearInterval(rrTimer);
      clearTimeout(npTimer);
    };
  }, []);

  const mockStats = [
    { icon: Users, value: participantCount.toString(), label: t("landing.demo.live.dashboard.participants", "Teilnehmer"), color: "text-primary", bgColor: "bg-primary/10" },
    { icon: TrendingUp, value: responseCount.toString(), label: t("landing.demo.live.dashboard.responses", "Antworten"), color: "text-accent", bgColor: "bg-accent/10" },
    { icon: Clock, value: `${responseRate}%`, label: t("landing.demo.live.dashboard.responseRate", "Rücklauf"), color: "text-success", bgColor: "bg-success/10" },
    { icon: Calendar, value: t("landing.demo.live.dashboard.planning", "Planung"), label: t("landing.demo.live.dashboard.status", "Status"), color: "text-warning", bgColor: "bg-warning/10" },
  ];

  const mockParticipants = [
    { name: "Sarah M.", status: "confirmed", avatar: "S", color: "from-pink-500 to-rose-500" },
    { name: "Michael K.", status: "confirmed", avatar: "M", color: "from-blue-500 to-indigo-500" },
    { name: "Anna L.", status: "maybe", avatar: "A", color: "from-purple-500 to-violet-500" },
    { name: "Tom B.", status: "invited", avatar: "T", color: "from-amber-500 to-orange-500" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <Check className="w-3 h-3" />;
      case "maybe": return <HelpCircle className="w-3 h-3" />;
      case "declined": return <X className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/20 text-success border-success/30";
      case "maybe": return "bg-warning/20 text-warning border-warning/30";
      case "declined": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return t("landing.demo.live.dashboard.statusConfirmed", "Bestätigt");
      case "maybe": return t("landing.demo.live.dashboard.statusMaybe", "Vielleicht");
      case "declined": return t("landing.demo.live.dashboard.statusDeclined", "Abgesagt");
      default: return t("landing.demo.live.dashboard.statusInvited", "Eingeladen");
    }
  };

  return (
    <div className="h-full flex flex-col gap-2 p-2 relative">
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1 left-1/2 z-50 bg-success text-white px-3 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 shadow-lg"
          >
            <Bell className="w-3 h-3" />
            {t("landing.demo.live.dashboard.newResponse", "Neue Antwort von Julia!")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-2 border border-primary/20"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
            <PartyPopper className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold truncate">Marios JGA 🎉</h3>
            <p className="text-[9px] text-muted-foreground">15.-17. Aug 2025 · Hamburg</p>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/20 border border-success/30">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-success"
            />
            <span className="text-[8px] text-success font-medium">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {mockStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-lg p-1.5 text-center border border-border/30`}
          >
            <stat.icon className={`w-3 h-3 mx-auto mb-0.5 ${stat.color}`} />
            <motion.div 
              className={`font-bold text-sm ${stat.color}`}
              key={stat.value}
            >
              {stat.value}
            </motion.div>
            <div className="text-[8px] text-muted-foreground truncate">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress Ring for Response Rate */}
      <div className="flex items-center justify-center gap-3 py-1">
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-success"
              initial={{ strokeDasharray: "0 126" }}
              animate={{ strokeDasharray: `${(responseRate / 100) * 126} 126` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-success">{responseRate}%</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          <div className="font-medium text-foreground">{responseCount} von {participantCount}</div>
          {t("landing.demo.live.dashboard.haveResponded", "haben geantwortet")}
        </div>
      </div>

      {/* Participants */}
      <div className="flex-1 bg-card/30 rounded-lg p-2 border border-border/50 overflow-hidden">
        <h4 className="text-[10px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Users className="w-3 h-3" />
          {t("landing.demo.live.dashboard.participantList", "Teilnehmer")}
        </h4>
        <div className="space-y-1.5">
          {mockParticipants.map((participant, index) => (
            <motion.div
              key={participant.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30 transition-colors"
            >
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${participant.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                {participant.avatar}
              </div>
              <span className="text-[11px] flex-1 font-medium">{participant.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border ${getStatusColor(participant.status)}`}>
                {getStatusIcon(participant.status)}
                <span className="hidden sm:inline">{getStatusLabel(participant.status)}</span>
              </span>
            </motion.div>
          ))}
          
          {/* New participant animation */}
          <AnimatePresence>
            {showNewParticipant && (
              <motion.div
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                className="flex items-center gap-2 p-1 rounded-md bg-success/10 border border-success/30"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  J
                </div>
                <span className="text-[11px] flex-1 font-medium">Julia H.</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border bg-success/20 text-success border-success/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Neu!</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: Wallet, label: t("landing.demo.live.dashboard.expenses", "Kosten"), color: "from-accent to-neon-pink", count: "5" },
          { icon: MessageSquare, label: t("landing.demo.live.dashboard.messages", "Nachr."), color: "from-neon-cyan to-primary", count: "3" },
          { icon: Bot, label: t("landing.demo.live.dashboard.askAI", "KI"), color: "from-primary to-accent", count: null },
        ].map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="relative bg-card/50 border border-border/50 rounded-lg p-1.5 flex flex-col items-center gap-0.5 hover:bg-card hover:border-primary/30 transition-all group"
          >
            <div className={`p-1.5 rounded-md bg-gradient-to-br ${action.color} group-hover:shadow-lg transition-shadow`}>
              <action.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            {action.count && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                {action.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export { DemoDashboard };
