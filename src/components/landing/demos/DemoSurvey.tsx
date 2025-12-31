import { useState } from "react";
import { motion } from "framer-motion";
import { Check, User, Calendar, Wallet, Heart, Mountain, PartyPopper, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoSurvey = () => {
  const { t } = useTranslation();
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [attendance, setAttendance] = useState("");
  const [budget, setBudget] = useState("");
  const [activities, setActivities] = useState<string[]>([]);

  const participants = ["Sarah M.", "Michael K.", "Anna L.", "Tom B."];
  
  const attendanceOptions = [
    { value: "yes", label: t("landing.demo.live.survey.yes", "Ja, ich bin dabei! 🎉"), color: "border-success bg-success/10" },
    { value: "maybe", label: t("landing.demo.live.survey.maybe", "Vielleicht 🤔"), color: "border-warning bg-warning/10" },
    { value: "no", label: t("landing.demo.live.survey.no", "Leider nein 😢"), color: "border-destructive bg-destructive/10" },
  ];

  const budgetOptions = [
    { value: "100", label: "€50-100" },
    { value: "200", label: "€100-200" },
    { value: "300", label: "€200-300" },
    { value: "400", label: "€300+" },
  ];

  const activityOptions = [
    { id: "outdoor", icon: Mountain, label: t("landing.demo.live.survey.outdoor", "Outdoor") },
    { id: "wellness", icon: Heart, label: t("landing.demo.live.survey.wellness", "Wellness") },
    { id: "party", icon: PartyPopper, label: t("landing.demo.live.survey.party", "Party") },
    { id: "culture", icon: Palette, label: t("landing.demo.live.survey.culture", "Kultur") },
  ];

  const toggleActivity = (id: string) => {
    setActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full flex flex-col gap-3 p-2 overflow-y-auto">
      {/* Participant Select */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <User className="w-3 h-3" />
          {t("landing.demo.live.survey.selectName", "Wähle deinen Namen")}
        </label>
        <select
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
          className="w-full bg-card/50 border border-border/50 rounded-lg px-2 py-1.5 text-xs focus:border-primary outline-none"
        >
          <option value="">{t("landing.demo.live.survey.chooseName", "Namen wählen...")}</option>
          {participants.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </motion.div>

      {/* Attendance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-1"
      >
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {t("landing.demo.live.survey.attendance", "Bist du dabei?")}
        </label>
        <div className="grid grid-cols-3 gap-1">
          {attendanceOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setAttendance(option.value)}
              className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                attendance === option.value
                  ? option.color
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Budget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-1"
      >
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Wallet className="w-3 h-3" />
          {t("landing.demo.live.survey.budget", "Dein Budget")}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {budgetOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setBudget(option.value)}
              className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                budget === option.value
                  ? "border-primary bg-primary/20"
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-1"
      >
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {t("landing.demo.live.survey.activities", "Bevorzugte Aktivitäten")}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {activityOptions.map(option => (
            <button
              key={option.id}
              onClick={() => toggleActivity(option.id)}
              className={`p-2 rounded-lg border text-center transition-all ${
                activities.includes(option.id)
                  ? "border-accent bg-accent/20"
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              <option.icon className={`w-4 h-4 mx-auto mb-1 ${
                activities.includes(option.id) ? "text-accent" : "text-muted-foreground"
              }`} />
              <span className="text-[10px]">{option.label}</span>
              {activities.includes(option.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center"
                >
                  <Check className="w-2 h-2 text-white" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-xs font-semibold"
      >
        {t("landing.demo.live.survey.submit", "Antwort absenden")}
      </motion.button>
    </div>
  );
};

export { DemoSurvey };
