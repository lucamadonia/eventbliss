import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Sparkles, Calendar, Wallet, Bot, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoAIAssistant = () => {
  const { t } = useTranslation();
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const prompts = [
    { icon: Plane, label: t("landing.demo.live.ai.destinations", "Reiseziele"), color: "from-primary to-accent" },
    { icon: Sparkles, label: t("landing.demo.live.ai.activities", "Aktivitäten"), color: "from-accent to-neon-pink" },
    { icon: Calendar, label: t("landing.demo.live.ai.schedule", "Tagesplan"), color: "from-neon-cyan to-primary" },
    { icon: Wallet, label: t("landing.demo.live.ai.budget", "Budget"), color: "from-warning to-neon-orange" },
  ];

  const responseText = t("landing.demo.live.ai.response", `**Top 3 Aktivitätsvorschläge für euren JGA:**

🚤 **Bootstour** - Entspannt über die Alster

🎯 **Escape Room** - Teamwork und Spannung

🍻 **Brauerei-Tour** - Bierverkostung mit Führung

*Basierend auf: Budget €150-250, 8 Teilnehmer*`);

  useEffect(() => {
    if (selectedPrompt !== null && !showResponse) {
      setIsTyping(true);
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setShowResponse(true);
      }, 1500);
      return () => clearTimeout(typingTimer);
    }
  }, [selectedPrompt]);

  useEffect(() => {
    if (showResponse) {
      let index = 0;
      const typeTimer = setInterval(() => {
        if (index < responseText.length) {
          setDisplayedText(responseText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeTimer);
        }
      }, 15);
      return () => clearInterval(typeTimer);
    }
  }, [showResponse, responseText]);

  const handlePromptClick = (index: number) => {
    setSelectedPrompt(index);
    setShowResponse(false);
    setDisplayedText("");
  };

  const formatResponse = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-muted-foreground">$1</em>')
      .split('\n')
      .map((line, i) => (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div className="h-full flex flex-col gap-3 p-2">
      {/* Prompt Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handlePromptClick(index)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
              selectedPrompt === index
                ? "bg-primary/20 border-primary"
                : "bg-card/50 border-border/50 hover:border-primary/50"
            }`}
          >
            <div className={`p-1.5 rounded-md bg-gradient-to-br ${prompt.color}`}>
              <prompt.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium">{prompt.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-card/30 rounded-lg border border-border/50 p-3 flex flex-col">
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
                <p className="text-xs">{t("landing.demo.live.ai.placeholder", "Wähle eine Option...")}</p>
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
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs">{t("landing.demo.live.ai.generating", "Generiere...")}</span>
              </div>
            </motion.div>
          ) : showResponse ? (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 overflow-y-auto"
            >
              <div className="flex gap-2 items-start">
                <div className="p-1 rounded-full bg-gradient-to-br from-primary to-accent">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 text-xs leading-relaxed">
                  {formatResponse(displayedText)}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-1 h-3 bg-primary ml-0.5"
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <div className="flex-1 bg-card/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center">
          {t("landing.demo.live.ai.inputPlaceholder", "Frag die KI...")}
        </div>
        <button className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export { DemoAIAssistant };
