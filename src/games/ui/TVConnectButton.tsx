/**
 * TVConnectButton — floating pill that shows TV connection code.
 * Collapsed: small 📺 icon. Expanded: shows code + instructions.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Copy, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { haptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { getBaseUrl } from "@/lib/platform";

interface Props {
  tvCode: string;
  isActive: boolean;
  onActivate: () => void;
}

export function TVConnectButton({ tvCode, isActive, onActivate }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTap = () => {
    haptics.light();
    if (!isActive) onActivate();
    setExpanded(!expanded);
  };

  const handleCopy = async () => {
    haptics.success();
    const url = `${getBaseUrl()}/tv/${tvCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-24 left-4 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={spring.snappy}
            className="bg-[#151a21]/95 backdrop-blur-xl border border-[#df8eff]/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(223,142,255,0.2)] max-w-[260px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#df8eff]" />
                <span className="text-sm font-semibold text-white">TV verbinden</span>
              </div>
              <button onClick={() => { haptics.light(); setExpanded(false); }}>
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Code display */}
            <div className="bg-[#0a0e14] rounded-xl p-3 mb-3 text-center">
              <p className="text-3xl font-display font-black text-[#df8eff] tracking-[0.2em]">
                {tvCode}
              </p>
            </div>

            {/* Instructions */}
            <p className="text-[11px] text-white/50 leading-relaxed mb-3">
              Öffne auf deinem TV:
              <br />
              <span className="text-[#8ff5ff] font-medium">
                {getBaseUrl()}/tv/{tvCode}
              </span>
            </p>

            {/* Copy button */}
            <motion.button
              onClick={handleCopy}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-[#df8eff]/20 border border-[#df8eff]/30 text-[#df8eff] text-sm font-semibold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopiert!" : "Link kopieren"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            onClick={handleTap}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={spring.bouncy}
            className="w-12 h-12 rounded-full bg-[#151a21]/90 backdrop-blur-xl border border-[#df8eff]/30 flex items-center justify-center shadow-[0_0_20px_rgba(223,142,255,0.15)]"
          >
            <Tv className="w-5 h-5 text-[#df8eff]" />
            {isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10b981]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
