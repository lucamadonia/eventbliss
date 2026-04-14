import { Lock, Crown } from 'lucide-react';

interface PremiumBadgeProps {
  isLocked: boolean;
  freePlaysLeft: number;
  isPremium: boolean;
}

export default function PremiumBadge({
  isLocked,
  freePlaysLeft,
  isPremium,
}: PremiumBadgeProps) {
  if (isPremium) return null;

  if (isLocked) {
    return (
      <span className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-amber-400 font-game border border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
        <Lock className="h-2.5 w-2.5" />
        Premium
      </span>
    );
  }

  if (freePlaysLeft > 0) {
    return (
      <span className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-[#00e3fd] font-game border border-[#00e3fd]/20">
        <Crown className="h-2.5 w-2.5" />
        {freePlaysLeft} kostenlos
      </span>
    );
  }

  return null;
}
