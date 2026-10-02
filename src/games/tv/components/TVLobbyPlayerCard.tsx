import { forwardRef, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Repeat2, Smartphone } from 'lucide-react';
import { partyMotion, playerGlow } from '@/lib/party-motion';
import type { TVLobbyPlayer } from '../tv-lobby-state';
import { LOBBY_ACCENTS, lu } from './tv-lobby-scale';

export type LobbyCardSize = 'lg' | 'md' | 'sm';

/** Alles, was ein Gast aus 3 m lesen muss, bleibt ≥ lu(1.9) (≈ tvType.label). */
const SIZES: Record<LobbyCardSize, { avatar: number; emoji: number; name: number; chip: number; pad: number }> = {
  lg: { avatar: 12, emoji: 6.6, name: 3.4, chip: 2.1, pad: 2.2 },
  md: { avatar: 9.4, emoji: 5.2, name: 2.9, chip: 1.95, pad: 1.7 },
  sm: { avatar: 7, emoji: 3.9, name: 2.5, chip: 1.9, pad: 1.2 },
};

function Chip({ children, color, size, testId }: { children: React.ReactNode; color: string; size: number; testId?: string }) {
  return (
    <span
      data-testid={testId}
      className="inline-flex items-center whitespace-nowrap rounded-full font-bold"
      style={{ fontSize: lu(size), gap: lu(0.6), paddingBlock: lu(0.35), paddingInline: lu(1.1), color, background: `${color}1f`, boxShadow: `inset 0 0 0 1px ${color}40` }}
    >
      {children}
    </span>
  );
}

/** Kartenbewegung: Ankunft aus der Tiefe (T01), taktvolles Ausblenden (T19). */
function cardVariants(reduced: boolean, delay: number): Variants {
  const arrive = partyMotion('avatarArrive', reduced);
  const leave = partyMotion('leaveFade', reduced);
  const animate = arrive.animate as Record<string, unknown>;
  return {
    initial: arrive.initial,
    animate: { ...animate, transition: { ...(animate.transition as object), delay } },
    exit: leave.exit,
  };
}

/**
 * Eine Spielerkarte im Wartebereich. Die Spielerfarbe ist nie Textfarbe
 * (einige Farben haben auf #060810 zu wenig Kontrast) — nur Ring, Schein und
 * eine 14-%-Toenung; Namen stehen immer in Weiss.
 */
const TVLobbyPlayerCard = forwardRef<HTMLDivElement, { player: TVLobbyPlayer; size: LobbyCardSize; index: number; showSeat?: boolean }>(
  function TVLobbyPlayerCard({ player, size, index, showSeat = true }, ref) {
    const { t } = useTranslation();
    const reduced = !!useReducedMotion();
    const s = SIZES[size];
    const sitsOut = player.isHost && player.hostPlays === false;
    const dim = !player.connected || sitsOut;
    const guest = player.seat === 'host-device' && !player.isHost;
    const variants = useMemo(() => cardVariants(reduced, Math.min(index, 8) * 0.05), [reduced, index]);
    const morph = partyMotion('profileMorph', reduced);
    const flip = partyMotion('seatFlip', reduced);
    const pop = partyMotion('checkPop', reduced);
    const profileKey = `${player.name}|${player.avatar}`;

    // Lucide statt Emoji: 📱/🔁 fehlen auf vielen Fernsehern (Tizen/webOS) oder sehen dort fremd aus.
    const iconSize = { width: lu(s.chip * 1.05), height: lu(s.chip * 1.05) };
    const status: { key: string; label: React.ReactNode; color: string } = !player.connected
      ? { key: 'offline', label: t('tvLobby.offline', 'getrennt'), color: LOBBY_ACCENTS.pink }
      : guest
        ? { key: 'guest', label: <><Repeat2 aria-hidden strokeWidth={2.5} style={iconSize} />{t('tvLobby.atHostDevice', 'am Host-Handy')}</>, color: LOBBY_ACCENTS.purple }
        : player.ready
          ? { key: 'ready', label: `✓ ${t('tvLobby.ready', 'bereit')}`, color: LOBBY_ACCENTS.cyan }
          : { key: 'waiting', label: t('tvLobby.notReady', 'noch nicht bereit'), color: '#c3c6cf' };

    return (
      <motion.div
        ref={ref}
        layout={!reduced}
        data-testid={`tv-lobby-player-${player.id}`}
        data-seat={player.seat}
        data-ready={String(player.ready)}
        data-host={String(player.isHost)}
        {...(player.isHost ? { 'data-host-plays': String(player.hostPlays !== false) } : {})}
        className="min-h-0 min-w-0"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
      {/* Eigene Ebene fuers Dimmen: die Varianten oben besitzen `opacity`. */}
      <div
        className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.07] text-center"
        style={{
          padding: lu(s.pad),
          gap: lu(s.pad * 0.5),
          background: `linear-gradient(160deg, ${player.color}24 0%, #0d0915 62%)`,
        }}
      >
        {/* Platz-Symbol oben am Ende: 📱 eigenes Handy, 🔁 am Host-Handy.
            Am lokalen Abend sitzen alle am selben Handy — dann ist es nur Rauschen. */}
        {showSeat && (
          <div className="absolute" style={{ insetBlockStart: lu(1.1), insetInlineEnd: lu(1.2), perspective: 800 }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={player.seat}
                className="block"
                variants={flip}
                initial="initial"
                animate="animate"
                exit="exit"
                aria-label={player.seat === 'phone' ? t('tvLobby.ownPhone', 'eigenes Handy') : t('tvLobby.atHostDevice', 'am Host-Handy')}
              >
                {player.seat === 'phone'
                  ? <Smartphone strokeWidth={2.5} className="text-white/70" style={{ width: lu(2.4), height: lu(2.4) }} />
                  : <Repeat2 strokeWidth={2.5} style={{ width: lu(2.4), height: lu(2.4), color: LOBBY_ACCENTS.purple }} />}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
        {/* Kein doppeltes Krönchen, wenn der Host selbst 👑 als Symbol trägt. */}
        {player.isHost && player.avatar !== '👑' && (
          <span className="absolute" style={{ insetBlockStart: lu(0.9), insetInlineStart: lu(1.2), fontSize: lu(2.8) }} aria-label={t('tvLobby.host', 'Host')}>👑</span>
        )}

        {/* Gedimmt werden nur Symbol und Name — der Status darunter ist die eigentliche Nachricht. */}
        <div className="flex w-full min-w-0 flex-col items-center" style={{ gap: lu(s.pad * 0.5), opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(0.85)' : undefined, transition: 'opacity 400ms ease, filter 400ms ease' }}>
        <div
          className="relative grid shrink-0 place-items-center rounded-full"
          style={{
            width: lu(s.avatar),
            height: lu(s.avatar),
            background: `radial-gradient(circle at 35% 30%, ${player.color}55, ${player.color}24 62%, transparent 75%)`,
            boxShadow: playerGlow(player.color, 'soft'),
            // Gaeste am Host-Handy: feiner gestrichelter Ring.
            outline: guest ? `2px dashed ${player.color}aa` : undefined,
            outlineOffset: guest ? lu(0.5) : undefined,
            transition: 'background 600ms ease, box-shadow 600ms ease',
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={profileKey} className="block leading-none" style={{ fontSize: lu(s.emoji) }} variants={morph} initial="initial" animate="animate" exit="exit">
              {player.avatar}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="relative w-full min-w-0 shrink-0" style={{ height: `calc(${lu(s.name)} * 1.25)` }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={profileKey}
              className="absolute inset-0 truncate font-black leading-tight text-white"
              style={{ fontSize: lu(s.name) }}
              variants={morph}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {player.name}
            </motion.p>
          </AnimatePresence>
        </div>
        </div>

        {showSeat && (
          <div className="flex shrink-0 flex-wrap items-center justify-center" style={{ gap: lu(0.6) }}>
            {player.isHost ? (
              <Chip color={sitsOut ? '#c3c6cf' : '#fbbf24'} size={s.chip}>
                {sitsOut ? t('tvLobby.hostSitsOut', 'spielt nicht mit') : t('tvLobby.hostPlays', 'spielt mit')}
              </Chip>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={status.key} variants={pop} initial="initial" animate="animate" exit="exit" className="inline-flex items-center" style={{ gap: lu(0.8) }}>
                  {status.key === 'waiting' && (
                    // Langsamer Puls statt Spinner: wartet, ist aber nicht kaputt.
                    <motion.span
                      aria-hidden
                      className="rounded-full bg-[#fbbf24]"
                      style={{ width: lu(1), height: lu(1) }}
                      animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <Chip color={status.color} size={s.chip}>{status.label}</Chip>
                </motion.span>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
      </motion.div>
    );
  },
);

export default TVLobbyPlayerCard;
