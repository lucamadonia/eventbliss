import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIRequestCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  imageSrc: string;
  gradient: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  lockedLabel?: string;
  badge?: string;
  index?: number;
}

export function AIRequestCard({
  label, description, icon: Icon, imageSrc, gradient, onClick,
  isLoading = false, disabled = false, lockedLabel, badge, index = 0,
}: AIRequestCardProps) {
  const locked = disabled || isLoading;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
      whileHover={locked ? undefined : { y: -3 }}
      whileTap={locked ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={locked}
      className={cn(
        "group relative h-56 w-[min(76vw,19rem)] shrink-0 snap-center overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br text-left shadow-[0_16px_40px_-24px_rgba(0,0,0,.8)] sm:w-[19rem]",
        gradient,
        locked && "cursor-not-allowed opacity-55",
        !locked && "hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
      )}
    >
      <img src={imageSrc} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      <span className="absolute inset-0 bg-gradient-to-t from-[#090815] via-[#090815]/50 to-[#090815]/10" />

      <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/25 bg-black/30 text-white backdrop-blur-md">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      </span>
      {badge && !disabled && <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-md">{badge}</span>}
      {disabled && lockedLabel && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white"><Lock className="h-3 w-3" />{lockedLabel}</span>}

      <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
        <span className="min-w-0">
          <span className="block text-lg font-semibold leading-tight tracking-tight">{label}</span>
          <span className="mt-1 block text-xs leading-snug text-white/80">{description}</span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md"><ArrowUpRight className="h-4 w-4" /></span>
      </span>
    </motion.button>
  );
}
