import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, MapPin, Utensils, Wine, Ship, Gamepad2, 
  PartyPopper, Music, Plus, Download, FileText, Euro, 
  ChevronLeft, ChevronRight, GripVertical, Check
} from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoPlanner = () => {
  const { t } = useTranslation();
  const [activeDay, setActiveDay] = useState(0);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  
  const days = [
    { date: "15. Aug", label: t("landing.demo.planner.day1", "Tag 1") },
    { date: "16. Aug", label: t("landing.demo.planner.day2", "Tag 2") },
    { date: "17. Aug", label: t("landing.demo.planner.day3", "Tag 3") },
  ];
  
  const activitiesByDay = [
    // Day 1
    [
      { time: "10:00", title: "Frühstück im Hotel", category: "food", icon: Utensils, cost: 15, color: "from-amber-500 to-orange-500" },
      { time: "12:00", title: "Escape Room Challenge", category: "activity", icon: Gamepad2, cost: 35, color: "from-purple-500 to-violet-500" },
      { time: "15:00", title: "Hafentour", category: "activity", icon: Ship, cost: 25, color: "from-blue-500 to-cyan-500" },
      { time: "19:00", title: "Abendessen", category: "food", icon: Utensils, cost: 45, color: "from-amber-500 to-orange-500" },
      { time: "21:00", title: "Bar Hopping", category: "nightlife", icon: Wine, cost: 50, color: "from-pink-500 to-rose-500" },
    ],
    // Day 2
    [
      { time: "11:00", title: "Brunch", category: "food", icon: Utensils, cost: 25, color: "from-amber-500 to-orange-500" },
      { time: "14:00", title: "Go-Kart Rennen", category: "activity", icon: Gamepad2, cost: 40, color: "from-red-500 to-orange-500" },
      { time: "18:00", title: "Cocktail Workshop", category: "activity", icon: Wine, cost: 55, color: "from-purple-500 to-pink-500" },
      { time: "21:00", title: "Club Night", category: "nightlife", icon: Music, cost: 30, color: "from-violet-500 to-purple-500" },
    ],
    // Day 3
    [
      { time: "10:00", title: "Katerfrühstück", category: "food", icon: Utensils, cost: 20, color: "from-amber-500 to-orange-500" },
      { time: "13:00", title: "Stadtführung", category: "activity", icon: MapPin, cost: 15, color: "from-green-500 to-emerald-500" },
      { time: "16:00", title: "Abschied & Heimreise", category: "transport", icon: PartyPopper, cost: 0, color: "from-primary to-accent" },
    ],
  ];
  
  const currentActivities = activitiesByDay[activeDay] || [];
  
  // Animate total cost
  useEffect(() => {
    const dayCost = currentActivities.reduce((sum, a) => sum + a.cost, 0);
    let current = 0;
    const step = dayCost / 20;
    const timer = setInterval(() => {
      current += step;
      if (current >= dayCost) {
        setTotalCost(dayCost);
        clearInterval(timer);
      } else {
        setTotalCost(Math.round(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [activeDay, currentActivities]);
  
  // Show new activity animation
  useEffect(() => {
    if (activeDay === 0) {
      const timer = setTimeout(() => setShowNewActivity(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowNewActivity(false);
    }
  }, [activeDay]);

  return (
    <div className="h-full flex flex-col gap-2 p-2 relative">
      {/* Header with Day Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-2 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold">Marios JGA - Zeitplan</h3>
              <p className="text-[9px] text-muted-foreground">Hamburg, 15.-17. Aug 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/20 border border-success/30">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-success"
            />
            <span className="text-[8px] text-success font-medium">8 Teilnehmer</span>
          </div>
        </div>
        
        {/* Day Tabs */}
        <div className="flex gap-1">
          {days.map((day, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveDay(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-medium transition-all ${
                activeDay === index
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <div>{day.label}</div>
              <div className="text-[8px] opacity-70">{day.date}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden bg-card/30 rounded-lg border border-border/50 p-2">
        <div className="space-y-1.5 relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-accent/50 to-transparent" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5"
            >
              {currentActivities.map((activity, index) => (
                <motion.div
                  key={`${activeDay}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 transition-colors group relative"
                >
                  {/* Time Node */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${activity.color} flex items-center justify-center shadow-sm`}>
                      <activity.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">{activity.time}</span>
                    </div>
                    <h4 className="text-[11px] font-semibold truncate">{activity.title}</h4>
                  </div>
                  
                  {/* Cost & Drag Handle */}
                  <div className="flex items-center gap-1">
                    {activity.cost > 0 && (
                      <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        {activity.cost}€
                      </span>
                    )}
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
              
              {/* New Activity Animation */}
              <AnimatePresence>
                {showNewActivity && activeDay === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-1.5 rounded-md bg-success/10 border border-success/30"
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: 2, duration: 0.5 }}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-success" />
                        <span className="text-[10px] font-medium text-success">23:00</span>
                      </div>
                      <h4 className="text-[11px] font-semibold text-success">Karaoke Bar 🎤</h4>
                    </div>
                    <span className="text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Neu
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with Cost Summary & Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-muted/50 rounded-lg p-2 border border-border/50"
      >
        <div className="flex items-center justify-between">
          {/* Cost Summary */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-accent/20">
              <Euro className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">
                {t("landing.demo.planner.dayCost", "Tageskosten p.P.")}
              </div>
              <motion.div 
                key={totalCost}
                className="text-sm font-bold text-accent"
              >
                {totalCost}€
              </motion.div>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
            >
              <Calendar className="w-3 h-3" />
              iCal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-medium hover:bg-accent/20 transition-colors"
            >
              <FileText className="w-3 h-3" />
              PDF
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { DemoPlanner };
