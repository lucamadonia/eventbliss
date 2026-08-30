import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

type PremiumImageChoiceCardProps = {
  title: string;
  image: string;
  selected: boolean;
  onClick: () => void;
  subtitle?: string;
  badge?: string;
  accent?: string;
  layout?: 'portrait' | 'wide';
  disabled?: boolean;
  className?: string;
  priority?: boolean;
};

/**
 * A cinematic, text-safe selection card shared by the premium game setups.
 * Generated artwork stays decorative; localized labels and selection state
 * remain native UI so every language and accessibility mode keeps working.
 */
export function PremiumImageChoiceCard({
  title,
  image,
  selected,
  onClick,
  subtitle,
  badge,
  accent = '#FBBF24',
  layout = 'portrait',
  disabled = false,
  className = '',
  priority = false,
}: PremiumImageChoiceCardProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`group relative isolate w-full overflow-hidden text-left disabled:opacity-45 ${
        layout === 'wide' ? 'min-h-[168px] rounded-[28px]' : 'aspect-[4/5] rounded-[24px]'
      } ${className}`}
      style={{
        border: `1.5px solid ${selected ? accent : 'rgba(255,255,255,0.13)'}`,
        boxShadow: selected
          ? `0 0 0 1px ${accent}38, 0 20px 48px ${accent}24`
          : '0 18px 42px rgba(0,0,0,0.28)',
        background: '#141020',
      }}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,5,16,0.04) 22%, rgba(7,5,16,0.42) 55%, rgba(7,5,16,0.96) 100%)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: selected ? 1 : 0,
          background: `linear-gradient(145deg, transparent 38%, ${accent}26 100%)`,
        }}
      />

      {badge && (
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/90 backdrop-blur-md">
          {badge}
        </span>
      )}

      <span
        className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border transition-all ${
          selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{ background: accent, borderColor: 'rgba(255,255,255,0.35)', color: '#090711' }}
      >
        <Check className="h-4 w-4 stroke-[3.5]" aria-hidden="true" />
      </span>

      <span className="absolute inset-x-0 bottom-0 block p-4">
        <span className="block text-[15px] font-black leading-tight text-white drop-shadow-lg">
          {title}
        </span>
        {subtitle && (
          <span className="mt-1 block text-[10px] font-semibold leading-snug text-white/68">
            {subtitle}
          </span>
        )}
      </span>
    </motion.button>
  );
}
