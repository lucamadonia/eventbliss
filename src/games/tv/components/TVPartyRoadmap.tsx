import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Circle, Play } from 'lucide-react';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import type { PartyPlaylistItem } from '../party-types';

/**
 * TVPartyRoadmap — the evening at a glance: what has been played, what is on
 * now, what is still to come.
 *
 * Only the current entry carries the accent ring (house rule: the ring marks
 * the ACTIVE element, never everything). Played entries dim rather than vanish
 * so the party can see how far into the night they are.
 */
const spring = { type: 'spring' as const, stiffness: 240, damping: 24 };

interface Props {
  playlist: PartyPlaylistItem[];
  /** 0-based position of the game that is current / up next */
  index: number;
  /** stagger the rows in when the parent scene reaches its beat */
  reveal?: boolean;
  className?: string;
}

export default function TVPartyRoadmap({ playlist, index, reveal = true, className }: Props) {
  const { t } = useTranslation();
  if (!playlist.length) return null;

  const played = playlist.filter((item) => item.done).length;

  return (
    <div className={`${tvPanel} flex flex-col min-h-0 p-[clamp(0.9rem,1.6vw,1.75rem)] ${className ?? ''}`}>
      <div className="flex items-baseline justify-between gap-2 mb-[clamp(0.5rem,1vh,1rem)] shrink-0">
        <span
          className="uppercase font-black tracking-[0.24em]"
          style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
        >
          {t('tv.partyNight.roadmapTitle', 'Der Abend')}
        </span>
        <span className="font-black tabular-nums" style={{ fontSize: tvType.micro, color: '#6b6480' }}>
          {played}/{playlist.length}
        </span>
      </div>

      <div className="flex flex-col gap-[clamp(0.3rem,0.6vh,0.6rem)] min-h-0 overflow-y-auto">
        {playlist.map((item, i) => {
          const isCurrent = !item.done && i === index;
          const Icon = item.done ? Check : isCurrent ? Play : Circle;
          const iconColor = item.done ? '#26E0C4' : isCurrent ? '#df8eff' : '#4a4459';

          return (
            <motion.div
              key={`${item.gameId}-${i}`}
              className="flex items-center gap-[clamp(0.5rem,0.9vw,0.9rem)] rounded-2xl px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.4rem,0.8vh,0.75rem)]"
              style={{
                background: isCurrent ? '#16101f' : '#140e24',
                border: `1.5px solid ${isCurrent ? '#df8eff' : 'rgba(255,255,255,0.08)'}`,
                ...(isCurrent ? tvActiveRing('#df8eff') : {}),
                opacity: item.done ? 0.55 : 1,
              }}
              initial={{ opacity: 0, x: -18 }}
              animate={reveal ? { opacity: item.done ? 0.55 : 1, x: 0 } : { opacity: 0, x: -18 }}
              transition={{ ...spring, delay: Math.min(i * 0.05, 0.4) }}
            >
              <Icon
                style={{ width: '1.1em', height: '1.1em', fontSize: tvType.label, color: iconColor }}
                strokeWidth={item.done || isCurrent ? 3 : 2}
              />
              <span
                className={`flex-1 min-w-0 truncate ${isCurrent ? 'font-black text-white' : 'font-bold'}`}
                style={{ fontSize: tvType.label, color: isCurrent ? '#ffffff' : '#b3a8c9' }}
              >
                {item.name}
              </span>
              {isCurrent && (
                <span
                  className="shrink-0 uppercase font-black tracking-[0.18em]"
                  style={{ fontSize: tvType.micro, color: '#df8eff' }}
                >
                  {t('tv.partyNight.nextUp', 'Jetzt')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
