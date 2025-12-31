import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Sparkles, Calendar, Wallet, Bot, Send, RefreshCw, Users, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoAIAssistant = () => {
  const { t } = useTranslation();
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const responseRef = useRef<HTMLDivElement>(null);

  const prompts = [
    { 
      icon: Plane, 
      label: t("landing.demo.live.ai.destinations", "Reiseziele"), 
      color: "from-primary to-accent",
      response: t("landing.demo.live.ai.responseDestinations", `**Top Reiseziele für euren JGA:**

🏙️ **Hamburg** - Hafenstadt mit Reeperbahn & Kultur
• 2h Anreise · €80-150/Nacht · Viel Nachtleben

🍺 **München** - Oktoberfest-Flair & Biergärten
• 4h Anreise · €100-180/Nacht · Bayerische Tradition

🎉 **Köln** - Karnevalsstadt am Rhein
• 3h Anreise · €70-120/Nacht · Party-Atmosphäre

*Empfehlung: Hamburg passt am besten zu eurem Budget!*`)
    },
    { 
      icon: Sparkles, 
      label: t("landing.demo.live.ai.activities", "Aktivitäten"), 
      color: "from-accent to-neon-pink",
      response: t("landing.demo.live.ai.responseActivities", `**Top 5 Aktivitäten für 8 Personen:**

1. 🚤 **Bootstour** - Entspannt über die Alster
   ~€25/Person · 2 Stunden

2. 🎯 **Escape Room** - Teamwork & Spannung
   ~€30/Person · 1 Stunde

3. 🍻 **Brauerei-Tour** - Bierverkostung
   ~€35/Person · 2.5 Stunden

4. 🎳 **Bowling + Dinner** - Klassiker-Kombi
   ~€45/Person · 3 Stunden

5. 🏎️ **Kartfahren** - Action für alle
   ~€40/Person · 1.5 Stunden

*Alle Aktivitäten in eurem Budget von €150-250!*`)
    },
    { 
      icon: Calendar, 
      label: t("landing.demo.live.ai.schedule", "Tagesplan"), 
      color: "from-neon-cyan to-primary",
      response: t("landing.demo.live.ai.responseSchedule", `**Perfekter JGA-Tagesplan:**

🌅 **10:00** - Gemeinsames Frühstück
   Café am Hafen · Alle zusammen starten

🚶 **12:00** - Stadtführung mal anders
   Interaktive Tour mit Aufgaben

🍕 **14:00** - Mittagessen & Überraschung
   Geschenkübergabe für Mario!

🎯 **16:00** - Escape Room Challenge
   Teams gegeneinander

🍺 **19:00** - Brauerei-Besuch
   Mit Verkostung & Abendessen

🎉 **22:00** - Party-Location
   DJ & Dancefloor reserviert

*Zeitpuffer zwischen Aktivitäten eingeplant!*`)
    },
    { 
      icon: Wallet, 
      label: t("landing.demo.live.ai.budget", "Budget"), 
      color: "from-warning to-neon-orange",
      response: t("landing.demo.live.ai.responseBudget", `**Budgetplan für 8 Personen:**

📊 **Gesamtbudget:** €1.600 - €2.000

**Aufschlüsselung pro Person (~€200):**

🏨 Unterkunft: €60-80
   2 Nächte im Hostel/Hotel

🚌 Anreise: €25-35
   Gruppenticket Bahn

🍽️ Essen: €50-60
   3x Mahlzeiten + Snacks

🎯 Aktivitäten: €50-70
   2-3 geplante Events

🍺 Getränke/Spaß: €30-40
   Abendprogramm

💰 **Spartipps:**
• Gruppenrabatte anfragen
• Happy Hour nutzen
• Selbstversorgung Frühstück`)
    },
  ];

  const currentResponse = selectedPrompt !== null ? prompts[selectedPrompt].response : "";

  useEffect(() => {
    if (selectedPrompt !== null && !showResponse) {
      setIsTyping(true);
      setDisplayedText("");
      setCharIndex(0);
      
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setShowResponse(true);
      }, 1200);
      
      return () => clearTimeout(typingTimer);
    }
  }, [selectedPrompt]);

  useEffect(() => {
    if (showResponse && charIndex < currentResponse.length) {
      const speed = currentResponse[charIndex] === '\n' ? 50 : 8;
      const timer = setTimeout(() => {
        setDisplayedText(currentResponse.slice(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [showResponse, charIndex, currentResponse]);

  // Auto-scroll as text appears
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [displayedText]);

  const handlePromptClick = (index: number) => {
    if (selectedPrompt === index) {
      // Regenerate
      setShowResponse(false);
      setDisplayedText("");
      setCharIndex(0);
      setTimeout(() => {
        setSelectedPrompt(null);
        setTimeout(() => setSelectedPrompt(index), 50);
      }, 100);
    } else {
      setSelectedPrompt(index);
      setShowResponse(false);
      setDisplayedText("");
      setCharIndex(0);
    }
  };

  const formatResponse = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-muted-foreground text-[9px]">$1</em>')
      .split('\n')
      .map((line, i) => (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      {/* Context Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground bg-muted/30 rounded-lg py-1 px-2"
      >
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> 8 Teilnehmer
        </span>
        <span className="flex items-center gap-1">
          <Wallet className="w-3 h-3" /> €150-250
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Hamburg
        </span>
      </motion.div>

      {/* Prompt Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => handlePromptClick(index)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              selectedPrompt === index
                ? "bg-primary/20 border-primary shadow-sm"
                : "bg-card/50 border-border/50 hover:border-primary/50"
            }`}
          >
            <div className={`p-1 rounded-md bg-gradient-to-br ${prompt.color}`}>
              <prompt.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-medium">{prompt.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Chat Area */}
      <div 
        ref={responseRef}
        className="flex-1 bg-card/30 rounded-lg border border-border/50 p-2 flex flex-col overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {selectedPrompt === null ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center text-center"
            >
              <div className="text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">{t("landing.demo.live.ai.placeholder", "Wähle eine Option...")}</p>
              </div>
            </motion.div>
          ) : isTyping ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-primary">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px]">{t("landing.demo.live.ai.generating", "Generiere...")}</span>
              </div>
            </motion.div>
          ) : showResponse ? (
            <motion.div
              key="response"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1"
            >
              <div className="flex gap-2 items-start">
                <div className="p-1 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 text-[10px] leading-relaxed">
                  {formatResponse(displayedText)}
                  {charIndex < currentResponse.length && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="inline-block w-0.5 h-3 bg-primary ml-0.5"
                    />
                  )}
                </div>
              </div>
              
              {/* Regenerate button */}
              {charIndex >= currentResponse.length && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handlePromptClick(selectedPrompt)}
                  className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary transition-colors ml-5"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t("landing.demo.live.ai.regenerate", "Neu generieren")}
                </motion.button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Input Field */}
      <div className="flex gap-1.5">
        <div className="flex-1 bg-card/50 border border-border/50 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground flex items-center">
          {t("landing.demo.live.ai.inputPlaceholder", "Frag die KI etwas...")}
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white"
        >
          <Send className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
};

export { DemoAIAssistant };
