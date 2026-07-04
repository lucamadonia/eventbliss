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

/**
 * A single tappable option tile with a spring press + animated checkmark.
 * The selected state is driven by the event branding via the
 * `--template-primary` CSS var (set on a form wrapper), falling back to the
 * theme's primary token, so the same card themes itself per event.
 */
const SurveyOptionCard = ({
  label,
  selected,
  onSelect,
  icon,
  description,
  multiSelect = false,
}: SurveyOptionCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  // Branded selected-state fills, derived from the inherited CSS var.
  const brand = "var(--template-primary, hsl(var(--primary)))";
  const selectedStyle = selected
    ? {
        borderColor: `color-mix(in srgb, ${brand} 55%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${brand} 12%, transparent)`,
      }
    : undefined;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      style={selectedStyle}
      className={`
        relative flex items-center gap-3 w-full text-left
        bg-white/[0.03] backdrop-blur border rounded-xl p-4
        min-h-[52px] cursor-pointer
        transition-colors duration-200
        ${selected ? "" : "border-white/[0.08] hover:bg-white/[0.06]"}
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
      {/* Icon / emoji */}
      {icon && <span className="flex-shrink-0 text-xl leading-none">{icon}</span>}

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
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={
          selected
            ? { backgroundColor: brand, color: "#fff" }
            : { border: "1px solid hsl(var(--foreground) / 0.18)" }
        }
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
