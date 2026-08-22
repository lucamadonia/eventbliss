import { useTranslation } from 'react-i18next';
import { tvType } from '../tv-tokens';
import type { PartyPlaylistItem } from '../party-types';

/**
 * TVPartyProgressStrip — "Spiel 4 von 8" as a hairline segmented bar pinned to
 * the very top edge of the screen.
 *
 * Deliberately NOT a floating card: an always-on stats overlay was built here
 * once before and removed because it covered game content and duplicated the
 * per-game scoreboards. This strip is a single text-height row that sits inside
 * the padding every TV view already reserves at the top, so it never occludes
 * anything, and it renders only while a party night is running.
 */
interface Props {
  playlist: PartyPlaylistItem[];
  /** 0-based position of the game that is current / up next */
  index: number;
}

export default function TVPartyProgressStrip({ playlist, index }: Props) {
  const { t } = useTranslation();
  if (!playlist.length) return null;

  const current = Math.min(Math.max(index, 0), playlist.length - 1);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none flex items-center gap-[clamp(0.5rem,1vw,1rem)] px-[clamp(0.75rem,1.6vw,2rem)] pt-[clamp(0.25rem,0.5vh,0.6rem)]">
      <div className="flex-1 flex items-center gap-[clamp(0.15rem,0.35vw,0.4rem)]">
        {playlist.map((item, i) => {
          const isCurrent = !item.done && i === current;
          return (
            <span
              key={`${item.gameId}-${i}`}
              className="flex-1 rounded-full"
              style={{
                height: 'clamp(3px,0.45vh,6px)',
                background: item.done
                  ? '#df8eff'
                  : isCurrent
                    ? 'linear-gradient(90deg, #df8eff, #8ff5ff)'
                    : 'rgba(255,255,255,0.1)',
                boxShadow: isCurrent ? '0 0 14px -2px #df8eff' : undefined,
              }}
            />
          );
        })}
      </div>
      <span
        className="shrink-0 font-black tabular-nums tracking-[0.14em] uppercase leading-none"
        style={{ fontSize: tvType.micro, color: '#6b6480' }}
      >
        {t('tv.partyNight.gameXofY', 'Spiel {{current}} von {{total}}', {
          current: current + 1,
          total: playlist.length,
        })}
      </span>
    </div>
  );
}
