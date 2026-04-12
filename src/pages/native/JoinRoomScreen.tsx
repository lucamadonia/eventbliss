/**
 * JoinRoomScreen — dedicated fullscreen page for entering a room code.
 * Replaces the Dialog/Drawer approach which broke on iOS Capacitor
 * due to keyboard/overlay conflicts.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Wifi } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function JoinRoomScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleJoin = () => {
    const normalized = code.toUpperCase().trim();
    if (normalized.length !== 6) {
      haptics.warning();
      setError("Der Code muss 6 Zeichen lang sein.");
      return;
    }
    haptics.medium();
    navigate(`/games/bomb?lobby=bomb&room=${normalized}`);
  };

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().slice(0, 6);
    setCode(upper);
    setError("");
    // Auto-submit when 6 chars entered
    if (upper.length === 6) {
      haptics.light();
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={spring.snappy}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-foreground/[0.06] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Raum beitreten</h1>
          <p className="text-xs text-muted-foreground">Gib den 6-stelligen Code ein</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-16">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.bouncy}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.4)]"
        >
          <Wifi className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.soft, delay: 0.1 }}
          className="text-2xl font-display font-bold text-foreground text-center mb-2"
        >
          Raum beitreten
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.soft, delay: 0.15 }}
          className="text-muted-foreground text-center mb-8"
        >
          Frag den Host nach dem 6-stelligen Raumcode
        </motion.p>

        {/* Code Input — native input, no overlay, no portal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.soft, delay: 0.2 }}
          className="w-full max-w-xs"
        >
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              "w-full h-20 px-5 rounded-2xl text-center text-4xl font-display font-bold tracking-[0.4em] transition-all",
              "bg-foreground/[0.06] border-2 text-foreground",
              "placeholder:text-muted-foreground/30 placeholder:tracking-[0.3em] placeholder:text-2xl",
              "focus:outline-none focus:ring-0",
              error
                ? "border-red-500/60 focus:border-red-500"
                : code.length === 6
                  ? "border-emerald-500/60 focus:border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  : "border-border focus:border-primary/60 focus:shadow-[0_0_20px_rgba(139,92,246,0.2)]",
            )}
          />

          {/* Character dots indicator */}
          <div className="flex justify-center gap-3 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  i < code.length
                    ? code.length === 6
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "bg-foreground/10",
                )}
                animate={i < code.length ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 text-center mt-3"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Join Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.soft, delay: 0.3 }}
          onClick={handleJoin}
          disabled={code.length < 6}
          whileTap={code.length === 6 ? { scale: 0.96 } : {}}
          className={cn(
            "w-full max-w-xs h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 mt-8 transition-all",
            code.length === 6
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
              : "bg-foreground/[0.08] text-muted-foreground/60",
          )}
        >
          <ArrowRight className="w-5 h-5" />
          Beitreten
        </motion.button>
      </div>
    </div>
  );
}
