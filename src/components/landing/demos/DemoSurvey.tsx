import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, Calendar, Wallet, Heart, Mountain, PartyPopper, Palette, Clock, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoSurvey = () => {
  const { t } = useTranslation();
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [attendance, setAttendance] = useState("");
  const [budget, setBudget] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate progress
  const totalSteps = 4;
  let completedSteps = 0;
  if (selectedParticipant) completedSteps++;
  if (attendance) completedSteps++;
  if (budget) completedSteps++;
  if (activities.length > 0) completedSteps++;
  const progress = (completedSteps / totalSteps) * 100;

  const participants = ["Sarah M.", "Michael K.", "Anna L.", "Tom B.", "Julia H."];
  
  const attendanceOptions = [
    { value: "yes", label: t("landing.demo.live.survey.yes", "Ja! 🎉"), emoji: "🎉", color: "border-success bg-success/10 text-success" },
    { value: "maybe", label: t("landing.demo.live.survey.maybe", "Vielleicht"), emoji: "🤔", color: "border-warning bg-warning/10 text-warning" },
    { value: "no", label: t("landing.demo.live.survey.no", "Nein 😢"), emoji: "😢", color: "border-destructive bg-destructive/10 text-destructive" },
  ];

  const budgetOptions = [
    { value: "100", label: "€50-100", description: t("landing.demo.live.survey.budgetLow", "Sparsam") },
    { value: "200", label: "€100-200", description: t("landing.demo.live.survey.budgetMid", "Mittel") },
    { value: "300", label: "€200-300", description: t("landing.demo.live.survey.budgetHigh", "Großzügig") },
    { value: "400", label: "€300+", description: t("landing.demo.live.survey.budgetMax", "All-in") },
  ];

  const activityOptions = [
    { id: "outdoor", icon: Mountain, label: t("landing.demo.live.survey.outdoor", "Outdoor"), color: "text-success" },
    { id: "wellness", icon: Heart, label: t("landing.demo.live.survey.wellness", "Wellness"), color: "text-pink-500" },
    { id: "party", icon: PartyPopper, label: t("landing.demo.live.survey.party", "Party"), color: "text-accent" },
    { id: "culture", icon: Palette, label: t("landing.demo.live.survey.culture", "Kultur"), color: "text-primary" },
  ];

  const toggleActivity = (id: string) => {
    setActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (completedSteps < totalSteps) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  // Auto-fill demo after 2s for visual effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedParticipant) setSelectedParticipant("Sarah M.");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isSubmitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Check className="w-8 h-8 text-success" />
          </motion.div>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-bold text-center mb-1"
        >
          {t("landing.demo.live.survey.thankYou", "Danke!")}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[10px] text-muted-foreground text-center"
        >
          {t("landing.demo.live.survey.submitted", "Deine Antwort wurde gespeichert")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex gap-1"
        >
          {[0,1,2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, delay: i * 0.2, duration: 1 }}
            >
              <Sparkles className="w-4 h-4 text-warning" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-y-auto">
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-1"
      >
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>{t("landing.demo.live.survey.progress", "Fortschritt")}</span>
          <span className="font-medium">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Deadline Notice */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 text-[9px] text-warning bg-warning/10 rounded-lg px-2 py-1 border border-warning/30"
      >
        <Clock className="w-3 h-3" />
        {t("landing.demo.live.survey.deadline", "Noch 5 Tage bis zur Deadline")}
      </motion.div>

      {/* Participant Select */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <User className="w-3 h-3" />
          {t("landing.demo.live.survey.selectName", "Wer bist du?")}
          {selectedParticipant && <Check className="w-3 h-3 text-success ml-auto" />}
        </label>
        <select
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
          className={`w-full bg-card/50 border rounded-lg px-2 py-1.5 text-[10px] focus:border-primary outline-none transition-colors ${
            selectedParticipant ? "border-success/50" : "border-border/50"
          }`}
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
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {t("landing.demo.live.survey.attendance", "Bist du dabei?")}
          {attendance && <Check className="w-3 h-3 text-success ml-auto" />}
        </label>
        <div className="grid grid-cols-3 gap-1">
          {attendanceOptions.map(option => (
            <motion.button
              key={option.value}
              onClick={() => setAttendance(option.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`p-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                attendance === option.value
                  ? option.color + " border-2"
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              <span className="block text-sm mb-0.5">{option.emoji}</span>
              {option.label.replace(option.emoji, '').trim()}
            </motion.button>
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
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Wallet className="w-3 h-3" />
          {t("landing.demo.live.survey.budget", "Dein Budget")}
          {budget && <Check className="w-3 h-3 text-success ml-auto" />}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {budgetOptions.map(option => (
            <motion.button
              key={option.value}
              onClick={() => setBudget(option.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`p-1.5 rounded-lg border transition-all ${
                budget === option.value
                  ? "border-primary border-2 bg-primary/20"
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              <div className="text-[10px] font-bold">{option.label}</div>
            </motion.button>
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
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {t("landing.demo.live.survey.activities", "Bevorzugte Aktivitäten")}
          {activities.length > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              <span className="text-success">{activities.length}</span>
            </span>
          )}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {activityOptions.map(option => (
            <motion.button
              key={option.id}
              onClick={() => toggleActivity(option.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-2 rounded-lg border text-center transition-all ${
                activities.includes(option.id)
                  ? "border-accent border-2 bg-accent/20"
                  : "border-border/50 bg-card/30 hover:bg-card/50"
              }`}
            >
              <option.icon className={`w-4 h-4 mx-auto mb-0.5 ${
                activities.includes(option.id) ? option.color : "text-muted-foreground"
              }`} />
              <span className={`text-[9px] ${activities.includes(option.id) ? "font-medium" : ""}`}>
                {option.label}
              </span>
              
              {/* Checkmark */}
              <AnimatePresence>
                {activities.includes(option.id) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={handleSubmit}
        disabled={completedSteps < totalSteps || isSubmitting}
        whileHover={completedSteps === totalSteps ? { scale: 1.02 } : {}}
        whileTap={completedSteps === totalSteps ? { scale: 0.98 } : {}}
        className={`w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-2 transition-all ${
          completedSteps === totalSteps
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            {t("landing.demo.live.survey.submitting", "Wird gesendet...")}
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            {t("landing.demo.live.survey.submit", "Antwort absenden")}
          </>
        )}
      </motion.button>
    </div>
  );
};

export { DemoSurvey };
