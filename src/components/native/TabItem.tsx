/**
 * TabItem — single bottom-nav button with active glow, bounce, haptic.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import type { Tab } from "./BottomTabBar";
import { cn } from "@/lib/utils";

interface Props {
  tab: Tab;
  active: boolean;
}

export function TabItem({ tab, active }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const Icon = tab.icon;

  const handleClick = () => {
    if (!active) haptics.select();
    navigate(tab.to);
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex-1 h-full flex items-center justify-center group"
      aria-label={t(tab.labelKey)}
    >
      {/* Active pill backdrop with shared layoutId for smooth morph between tabs */}
      {active && (
        <motion.div
          layoutId="tab-active-pill"
          className="absolute inset-y-1 inset-x-1 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          transition={spring.snappy}
        />
      )}

      <motion.div
        className="relative flex flex-col items-center justify-center gap-0.5"
        animate={{
          scale: active ? 1 : 0.92,
        }}
        transition={spring.bouncy}
      >
        <motion.div
          animate={
            active
              ? { y: -1, rotate: [0, -8, 8, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={{
            rotate: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            y: spring.snappy,
          }}
        >
          <Icon
            className={cn(
              "w-6 h-6 transition-colors duration-200",
              active
                ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                : "text-muted-foreground group-hover:text-foreground/80"
            )}
            strokeWidth={active ? 2.5 : 2}
          />
        </motion.div>
        <motion.span
          className={cn(
            "text-[10px] font-medium tracking-wide",
            active ? "text-primary" : "text-muted-foreground"
          )}
          animate={{ opacity: active ? 1 : 0.7 }}
        >
          {t(tab.labelKey)}
        </motion.span>
      </motion.div>
    </button>
  );
}
