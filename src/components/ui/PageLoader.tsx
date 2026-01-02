import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import loaderIcon from "@/assets/eventbliss-loader-icon.png";
import loadingAnimation from "@/assets/animations/loading.json";

interface PageLoaderProps {
  variant?: "logo" | "lottie";
}

// Default to lottie variant for modern animation

export const PageLoader = ({ variant = "logo" }: PageLoaderProps) => {
  const { t } = useTranslation();

  // Lottie Variant
  if (variant === "lottie") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Subtle Background Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 60%)"
          }}
        />

        {/* Lottie Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10"
        >
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            style={{ width: 180, height: 180 }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          className="mt-6 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.p
            className="text-lg font-medium text-foreground/80"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {t("common.loading", "Loading...")}
          </motion.p>
          
          {/* Animated Underline */}
          <motion.div
            className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ width: "0%", left: "50%" }}
            animate={{ width: ["0%", "100%", "0%"], left: ["50%", "0%", "50%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    );
  }

  // Logo Variant (default)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 400),
            }}
            animate={{
              y: [null, -20, 20, -10, 10, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Logo Container with Rotating Ring */}
      <div className="relative">
        {/* Rotating Gradient Ring */}
        <motion.div
          className="absolute -inset-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="120 230"
            />
          </svg>
        </motion.div>

        {/* Secondary Ring - Counter Rotate */}
        <motion.div
          className="absolute -inset-6"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="66"
              fill="none"
              stroke="hsl(var(--primary) / 0.15)"
              strokeWidth="1"
              strokeDasharray="8 16"
            />
          </svg>
        </motion.div>

        {/* Logo with Pulse & Glow */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
            }}
          />
          <img
            src={loaderIcon}
            alt="Loading"
            className="w-20 h-20 relative z-10 drop-shadow-lg"
          />
        </motion.div>
      </div>

      {/* Loading Text with Shimmer */}
      <motion.div
        className="mt-8 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.p
          className="text-lg font-medium text-foreground/80"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {t("common.loading", "Loading...")}
        </motion.p>
        
        {/* Animated Underline */}
        <motion.div
          className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ width: "0%", left: "50%" }}
          animate={{ width: ["0%", "100%", "0%"], left: ["50%", "0%", "50%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating Dots */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/50"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PageLoader;
