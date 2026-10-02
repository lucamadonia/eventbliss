import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { availabilityChip, type GameAvailability } from '@/lib/playable-games';
import { useHaptics } from '@/hooks/useHaptics';
import { Ban, Check, Crown, Hourglass, Users } from 'lucide-react';
import { AVAILABILITY_TONE_HEX } from '@/lib/playable-games';

const ICONS = { Check, Users, Hourglass, Ban, Crown } as const;

/**
 * One game in the online-room picker. Never-playable games (premium, too many,
 * unknown) stay visible and focusable but locked: a tap explains via haptic +
 * shake and the chip. Games only waiting for players stay plannable.
 */
export default function RoomGameTile({ id, name, icon, chosen, availability, onToggle }: {
  id: string; name: string; icon: string; chosen: boolean; availability: GameAvailability; onToggle: () => void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const haptics = useHaptics();
  const shake = useAnimationControls();
  const chip = availabilityChip(availability);
  const locked = chip.locked && !chosen;
  const tone = AVAILABILITY_TONE_HEX[chip.tone], Icon = ICONS[chip.icon];
  const dim = locked ? 0.45 : 1;
  return (
    <motion.button type="button" animate={shake} whileTap={locked ? undefined : { scale: 0.95 }}
      data-testid={`room-game-${id}`} data-plannable={availability.plannable} data-startable={availability.startable}
      aria-disabled={locked} aria-pressed={chosen}
      onClick={() => {
        if (locked) {
          haptics.warning();
          if (!reduced) void shake.start({ x: [0, -4, 4, -2, 0], transition: { duration: 0.24 } });
          return;
        }
        onToggle();
      }}
      className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-center transition-colors"
      style={{
        backgroundColor: chosen ? 'rgba(223,142,255,0.12)' : '#1b2028',
        border: chosen ? '1px solid #df8eff40' : '1px solid transparent',
        cursor: locked ? 'not-allowed' : undefined,
      }}>
      <span className="text-lg" style={{ opacity: dim }}>{icon}</span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight" style={{ opacity: dim, color: chosen ? '#df8eff' : 'rgba(255,255,255,0.8)' }}>{name}</span>
      {/* Grids show only deviations; "passt" belongs where a single game is shown. Fixed height keeps tiles even. */}
      <span className="flex min-h-[18px] items-center">
        {chip.variant !== 'fits' && (
          <span data-testid="room-game-reason" data-kind={chip.kind} data-variant={chip.variant}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-tight"
            style={{ color: tone, backgroundColor: `${tone}1a`, boxShadow: `inset 0 0 0 1px ${tone}38` }}>
            <Icon aria-hidden className="h-3 w-3 shrink-0" />{String(t(chip.key, chip.params))}
          </span>
        )}
      </span>
    </motion.button>
  );
}
