import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Lock, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PREMIUM_FEATURES } from './gameConfig';

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  gameName?: string;
  freePlaysLeft?: number;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.1 },
  },
  exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.2 } },
};

export default function PremiumPaywall({
  isOpen,
  onClose,
  gameName,
  freePlaysLeft = 0,
}: PremiumPaywallProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/premium');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.5rem] border border-[#484750]/20 bg-[#1a1a24]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(207,150,255,0.15)]"
          >
            {/* Glow effects */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#cf96ff]/20 blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#00e3fd]/15 blur-[60px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-8 pb-4 text-center">
              {/* Crown with glow */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                <Crown className="h-8 w-8 text-white drop-shadow-lg" />
              </div>

              <h2 className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans'] drop-shadow-[0_0_12px_rgba(207,150,255,0.3)]">
                EventBliss Premium
              </h2>
              <p className="mt-2 text-sm text-white/50 font-['Be_Vietnam_Pro']">
                {gameName
                  ? `Schalte "${gameName}" und alle Premium-Spiele frei`
                  : 'Schalte alle Spiele & Features frei'}
              </p>
            </div>

            {/* Features */}
            <div className="px-6 pb-4">
              <div className="space-y-2.5">
                {PREMIUM_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#cf96ff]/20">
                      <Check className="h-3 w-3 text-[#cf96ff]" />
                    </div>
                    <span className="text-sm text-white/70 font-['Be_Vietnam_Pro']">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-center gap-3 text-center">
                <div className="rounded-xl border border-[#cf96ff]/20 bg-[#cf96ff]/5 px-4 py-2.5">
                  <p className="text-lg font-extrabold text-[#cf96ff] font-['Plus_Jakarta_Sans']">
                    3,99&euro;
                  </p>
                  <p className="text-[10px] text-white/40 font-['Be_Vietnam_Pro']">
                    / Monat
                  </p>
                </div>
                <span className="text-xs text-white/30 font-['Be_Vietnam_Pro']">
                  oder
                </span>
                <div className="rounded-xl border border-[#00e3fd]/20 bg-[#00e3fd]/5 px-4 py-2.5">
                  <p className="text-lg font-extrabold text-[#00e3fd] font-['Plus_Jakarta_Sans']">
                    29,99&euro;
                  </p>
                  <p className="text-[10px] text-white/40 font-['Be_Vietnam_Pro']">
                    / Jahr
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleUpgrade}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] py-3.5 text-sm font-bold text-[#0d0d15] font-['Plus_Jakarta_Sans'] shadow-[0_0_20px_rgba(207,150,255,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(207,150,255,0.5)]"
              >
                <Sparkles className="h-4 w-4" />
                Jetzt Premium werden
              </motion.button>
            </div>

            {/* Party Pack option */}
            <div className="px-6 pb-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 py-3 text-sm font-bold text-amber-400 font-['Plus_Jakarta_Sans'] transition-colors hover:bg-amber-400/10"
              >
                <Zap className="h-4 w-4" />
                Party Pack &mdash; einmalig 59,99&euro;
              </motion.button>
            </div>

            {/* Free plays reminder */}
            <div className="px-6 pb-6 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
                <Lock className="h-3 w-3 text-white/30" />
                <span className="text-[11px] text-white/40 font-['Be_Vietnam_Pro']">
                  {freePlaysLeft > 0
                    ? `Noch ${freePlaysLeft} kostenlose Runde${freePlaysLeft !== 1 ? 'n' : ''} heute`
                    : '2 kostenlose Runden pro Tag'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
