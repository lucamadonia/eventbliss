import { playerGlow, readableOn } from '@/lib/party-motion';
import { lookupRoster, useTVRoster } from './tv-roster';

const FALLBACK_COLOR = '#df8eff';

/**
 * Das eine Spieler-Symbol fuer alle TV-Ansichten: Emoji in einer Kugel aus
 * der Spielerfarbe mit persoenlichem Schein — wie die Karte im Wartebereich.
 * Fehlt das Emoji im Spielzustand, kommt es aus der Teilnehmerliste
 * (TVRosterContext). Die Initiale ist nur der letzte Rueckfall, dann mit
 * lesbarer Schriftfarbe auf der Farbflaeche (readableOn).
 */
export default function TVPlayerAvatar({ id, name, avatar, color, size, active = false, dim = false }: {
  id?: string;
  name: string;
  avatar?: string;
  color?: string;
  /** CSS-Groesse, z. B. 'clamp(3rem,4vw,4rem)' oder lu(8). */
  size: string;
  active?: boolean;
  dim?: boolean;
}) {
  const roster = useTVRoster();
  const known = lookupRoster(roster, id, name);
  const emoji = (avatar && avatar.trim()) || known?.avatar || '';
  const tone = color || known?.color || FALLBACK_COLOR;
  return (
    <span
      aria-hidden
      data-avatar={emoji ? 'emoji' : 'initial'}
      className="relative grid shrink-0 place-items-center rounded-full font-black leading-none"
      style={{
        width: size,
        height: size,
        fontSize: `calc(${size} * ${emoji ? 0.56 : 0.42})`,
        color: emoji ? undefined : readableOn(tone),
        background: emoji
          ? `radial-gradient(circle at 35% 30%, ${tone}66, ${tone}26 62%, rgba(13,9,21,0.92) 80%)`
          : `radial-gradient(circle at 35% 30%, ${tone}, ${tone}cc 72%)`,
        boxShadow: playerGlow(tone, active ? 'active' : 'soft'),
        opacity: dim ? 0.5 : 1,
        filter: dim ? 'grayscale(0.6)' : undefined,
        transition: 'opacity 400ms ease, filter 400ms ease, box-shadow 400ms ease',
      }}
    >
      {emoji || (name || '?').charAt(0).toUpperCase()}
    </span>
  );
}
