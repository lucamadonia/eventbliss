/**
 * JoinEventFlow — native code-entry + event preview + join.
 *
 * Big code input → lookup → event card preview → join CTA.
 * Reuses same Supabase join-event Edge Function as desktop.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ArrowRight,
  Loader2,
  PartyPopper,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, ease } from "@/lib/motion";
import { MobileHeader } from "@/components/native/MobileHeader";
import { cn } from "@/lib/utils";

const EVENT_EMOJI: Record<string, string> = {
  bachelor: "🎉",
  bachelorette: "💅",
  birthday: "🎂",
  trip: "✈️",
  other: "🎊",
};

export default function JoinEventFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    slug: string;
    name: string;
    honoree_name: string;
    event_type: string;
  } | null>(null);

  const handleLookup = async () => {
    if (!code.trim()) return;
    setError("");
    setIsLoading(true);
    haptics.light();
    try {
      const { data, error: err } = await supabase.functions.invoke("join-event", {
        body: { access_code: code.toUpperCase() },
      });
      if (err) throw err;
      if (data?.success) {
        haptics.success();
        setPreview(data.event);
      } else {
        haptics.warning();
        setError(data?.error || t('native.join.errorNotFound'));
      }
    } catch {
      haptics.error();
      setError(t('native.join.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (!preview) return;
    haptics.medium();
    navigate(`/e/${preview.slug}`);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileHeader title={t('native.join.headerTitle')} showBack />

      <div className="flex-1 overflow-y-auto native-scroll px-5 pb-8">
        {/* Illustration header */}
        <motion.div
          className="flex flex-col items-center pt-8 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-violet-300" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground text-center">
            {t('native.join.title')}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {t('native.join.subtitle')}
          </p>
        </motion.div>

        {/* Code input */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.soft, delay: 0.15 }}
        >
          <div className="relative">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
                setPreview(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder={t('native.join.placeholder')}
              maxLength={20}
              className="w-full h-16 px-5 rounded-2xl bg-foreground/5 border-2 border-border text-foreground text-center text-2xl font-display font-bold tracking-[0.3em] placeholder:text-muted-foreground/60 placeholder:tracking-widest placeholder:text-lg focus:outline-none focus:border-primary/60 transition-colors uppercase"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <motion.p
              className="text-sm text-red-400 text-center mt-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          {!preview && (
            <motion.button
              onClick={handleLookup}
              disabled={!code.trim() || isLoading}
              whileTap={{ scale: code.trim() ? 0.96 : 1 }}
              transition={spring.snappy}
              className={cn(
                "w-full h-14 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 mt-4 transition-all",
                code.trim()
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
                  : "bg-foreground/[0.08] text-muted-foreground/60 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  {t('native.join.searchButton')}
                </>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Event preview card */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={spring.bouncy}
              className="space-y-4"
            >
              <div className="rounded-3xl p-5 bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border backdrop-blur">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">
                    {EVENT_EMOJI[preview.event_type] || "🎊"}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {t('native.join.eventFound')}
                    </p>
                    <h3 className="text-xl font-display font-bold text-foreground">
                      {preview.name}
                    </h3>
                    {preview.honoree_name && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('native.join.forHonoree', { name: preview.honoree_name })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Animated glow ring */}
                <motion.div
                  className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <motion.button
                onClick={handleJoin}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_-6px_rgba(16,185,129,0.5)]"
              >
                <PartyPopper className="w-5 h-5" />
                {t('native.join.joinButton')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
