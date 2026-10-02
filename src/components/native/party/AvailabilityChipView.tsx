import { Ban, Check, Crown, Hourglass, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AVAILABILITY_TONE_HEX, type AvailabilityChip } from '@/lib/playable-games';
import { chipText } from '@/games/party/party-availability';
import { cn } from '@/lib/utils';

const ICONS = { Check, Users, Hourglass, Ban, Crown } as const;

/**
 * The shared availability chip as the TV draws it (design §4.1): tone text,
 * tone + 1a fill, 1 px inner ring tone + 38. Never dimmed itself.
 */
export function AvailabilityChipView({ chip, className }: { chip: AvailabilityChip; className?: string }) {
  const { t } = useTranslation();
  const tone = AVAILABILITY_TONE_HEX[chip.tone];
  const Icon = ICONS[chip.icon];
  return (
    <span data-testid="availability-chip" data-variant={chip.variant}
      className={cn('inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}
      style={{ color: tone, background: `${tone}1a`, boxShadow: `inset 0 0 0 1px ${tone}38` }}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{chipText(chip, (key, fallback, options) => t(key, fallback, options))}</span>
    </span>
  );
}
