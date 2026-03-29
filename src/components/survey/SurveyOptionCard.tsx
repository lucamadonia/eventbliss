import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

interface SurveyOptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  description?: string;
  multiSelect?: boolean;
}

const SurveyOptionCard = ({
  label,
  selected,
  onSelect,
  icon,
  description,
  multiSelect = false,
}: SurveyOptionCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`
        relative flex items-center gap-3 w-full text-left
        bg-white/[0.03] backdrop-blur border rounded-xl p-4
        min-h-[48px] cursor-pointer
        transition-colors duration-200
        ${
          selected
            ? "border-violet-500/50 bg-violet-500/10"
            : "border-white/[0.08] hover:bg-white/[0.06]"
        }
      `}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      animate={
        shouldReduceMotion
          ? {}
          : {
              scale: selected ? 1.02 : 1,
            }
      }
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-pressed={selected}
      role={multiSelect ? "checkbox" : "radio"}
    >
      {/* Icon */}
      {icon && (
        <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
      )}

      {/* Label & description */}
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm font-medium ${
            selected ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        {description && (
          <span className="block text-xs text-muted-foreground/70 mt-0.5">
            {description}
          </span>
        )}
      </div>

      {/* Checkmark */}
      <motion.span
        className={`
          flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
          ${
            selected
              ? "bg-violet-500 text-white"
              : "border border-white/[0.15]"
          }
        `}
        initial={false}
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: selected ? 1 : 0.8,
                opacity: selected ? 1 : 0.4,
              }
        }
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {selected && <Check className="w-3 h-3" />}
      </motion.span>
    </motion.button>
  );
};

export default SurveyOptionCard;
