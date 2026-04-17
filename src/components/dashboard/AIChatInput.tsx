import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Send, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Curated quick-prompt ideas that adapt by locale (fallback to German if missing)
const QUICK_PROMPTS: Array<{ key: string; fallback: string; emoji: string }> = [
  { key: "dashboard.ai.quickPrompts.weekend",   fallback: "Plane mir ein episches Wochenende",            emoji: "🎉" },
  { key: "dashboard.ai.quickPrompts.budget",    fallback: "Budgetfreundlich für 8 Personen",              emoji: "💰" },
  { key: "dashboard.ai.quickPrompts.outdoor",   fallback: "Action & Outdoor-Abenteuer",                   emoji: "🏔️" },
  { key: "dashboard.ai.quickPrompts.culinary",  fallback: "Kulinarische Highlights",                      emoji: "🍷" },
  { key: "dashboard.ai.quickPrompts.luxury",    fallback: "Luxuriös mit Wow-Effekt",                      emoji: "✨" },
];

export default function AIChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder,
}: AIChatInputProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !disabled && value.trim() && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    onChange(prompt);
    // Trigger submit after a tick so state is settled
    setTimeout(() => onSubmit(), 40);
  };

  const canSubmit = !disabled && !isLoading && value.trim().length > 0;

  return (
    <div className="relative">
      {/* Quick prompt chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mr-1">
          <Sparkles className="w-3 h-3" />
          {t("dashboard.ai.quickPrompts.label", "Quick-Ideen")}
        </span>
        {QUICK_PROMPTS.map((p, i) => {
          const label = t(p.key, p.fallback);
          return (
            <motion.button
              key={p.key}
              type="button"
              disabled={disabled || isLoading}
              onClick={() => handlePromptClick(label)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
                "bg-white/[0.04] border border-white/10 text-white/70",
                "hover:bg-white/[0.08] hover:border-white/25 hover:text-white transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              <span>{p.emoji}</span>
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Input container with animated gradient rim */}
      <div
        className={cn(
          "relative rounded-2xl transition-all duration-300 overflow-hidden",
          focused && !disabled && "ai-gradient-rim",
        )}
      >
        {/* Inner glass card */}
        <div
          className={cn(
            "relative rounded-2xl border transition-colors",
            focused ? "border-white/20 bg-black/40" : "border-white/10 bg-white/[0.04]",
            "backdrop-blur-xl",
          )}
        >
          {/* Ambient glow behind textarea when focused */}
          {focused && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(500px circle at 50% 50%, rgba(236,72,153,0.08), transparent 60%)",
              }}
            />
          )}

          <div className="relative flex items-end gap-2 p-3 md:p-4">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isLoading}
              placeholder={placeholder || t("dashboard.ai.chatPlaceholder", "Frag mich alles — z. B. „Was soll ich abends machen?“")}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent border-0 outline-none text-sm md:text-base text-white placeholder:text-white/40",
                "max-h-40 overflow-y-auto",
                "disabled:opacity-50",
              )}
              style={{ scrollbarWidth: "thin" }}
            />

            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.05 } : undefined}
              whileTap={canSubmit ? { scale: 0.96 } : undefined}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white",
                "shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
                canSubmit && !isLoading && "liquid-shimmer",
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("dashboard.ai.ask", "Fragen")}</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Footer hint */}
          <div className="relative px-4 pb-2.5 flex items-center justify-between text-[10px] text-white/35">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {t("dashboard.ai.creditsFuel", "Credits treiben deinen Planer an")}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono">
              <Command className="w-2.5 h-2.5" />
              + ↵
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
