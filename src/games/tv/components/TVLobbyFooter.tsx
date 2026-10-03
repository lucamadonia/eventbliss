import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Ban, Check, Crown, Hourglass, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import { AVAILABILITY_TONE_HEX, availabilityChip } from '@/lib/playable-games';
import { tvPanel } from '../tv-tokens';
import { nextGameAvailability, type TVLobbyState } from '../tv-lobby-state';
import { LOBBY_ACCENTS, lu } from './tv-lobby-scale';

const AMBER = '#fbbf24';
const CHIP_ICONS: Record<ReturnType<typeof availabilityChip>['icon'], LucideIcon> = { Check, Users, Hourglass, Ban, Crown };

function Pill({ icon: Icon, color, children, testId, variant }: { icon: LucideIcon; color: string; children: React.ReactNode; testId?: string; variant?: string }) {
  return (
    <span
      data-testid={testId}
      data-variant={variant}
      className="inline-flex items-center rounded-full font-bold"
      style={{ fontSize: lu(2), gap: lu(0.7), paddingBlock: lu(0.4), paddingInline: lu(1.3), color, background: `${color}1a`, boxShadow: `inset 0 0 0 1px ${color}38` }}
    >
      <Icon aria-hidden strokeWidth={2.5} style={{ width: '1.05em', height: '1.05em' }} />
      {children}
    </span>
  );
}

/**
 * Fusszeile: was als Naechstes kommt, ob die Gruppe passt, wer noch fehlt.
 * Der Hinweis-Chip kommt aus `availabilityChip` — dieselben Worte wie auf den
 * Handys und im Online-Raum.
 */
export default function TVLobbyFooter({ lobby }: { lobby: TVLobbyState }) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const availability = nextGameAvailability(lobby);
  const showReady = lobby.mode !== 'local-party' && lobby.players.length > 0;
  const override = lobby.nextGame?.unavailableReason;

  // Derselbe Chip wie auf den Handys — inkl. „Max und Gerda setzen aus“ (E03)
  // mit Namensliste in der Sprache des Fernsehers.
  const chip = availability
    ? availabilityChip(availability, { sittingOutNames: availability.sittingOutNames, locale: i18n.language })
    : null;

  if (!lobby.nextGame && !showReady) return null;

  return (
    <footer
      className={`${tvPanel} relative z-10 flex flex-wrap items-center justify-between`}
      style={{ columnGap: lu(3), rowGap: lu(1), paddingBlock: lu(1.6), paddingInline: lu(2.8) }}
    >
      {lobby.nextGame ? (
        <div data-testid="tv-lobby-next-game" data-game-id={lobby.nextGame.id} data-startable={String(!!availability?.startable)} className="flex min-w-0 flex-wrap items-center" style={{ columnGap: lu(1.8), rowGap: lu(0.6) }}>
          <span className="font-bold text-white/65" style={{ fontSize: lu(2.1) }}>
            {t('tvLobby.nextUp', 'Als Nächstes')}
          </span>
          <span
            className="truncate font-black italic"
            style={{ fontSize: lu(3.4), background: 'linear-gradient(100deg,#fff,#df8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {lobby.nextGame.name}
          </span>
          {lobby.nextGame.minPlayers > 0 && lobby.nextGame.maxPlayers > 0 && (
            <span className="font-semibold text-white/70" style={{ fontSize: lu(2.1) }}>
              {t('tvLobby.playerRange', '{{min}}–{{max}} Spieler', { min: lobby.nextGame.minPlayers, max: lobby.nextGame.maxPlayers })}
            </span>
          )}
          {override ? (
            <Pill icon={Hourglass} color={AMBER} testId="tv-lobby-availability">{override}</Pill>
          ) : chip ? (
            <Pill icon={CHIP_ICONS[chip.icon]} color={AVAILABILITY_TONE_HEX[chip.tone]} testId="tv-lobby-availability" variant={chip.variant}>{t(chip.key, chip.params)}</Pill>
          ) : null}
        </div>
      ) : <span />}

      {showReady && (
        <div data-testid="tv-lobby-ready-missing" data-value={lobby.readyMissing} className="flex items-center" style={{ gap: lu(1.2) }}>
          <AnimatePresence mode="wait" initial={false}>
            {availability && chip?.kind === 'waiting' ? (
              // Startet noch nicht — kein „Alle bereit ✓“, das nach „los“ aussaehe.
              <motion.span key="waiting" className="font-semibold text-white/70" style={{ fontSize: lu(2.3) }} variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" exit="exit">
                {t('tvLobby.waitingForPlayers', 'Warte auf Mitspieler …')}
              </motion.span>
            ) : availability && !availability.startable ? null : lobby.readyMissing > 0 ? (
              // Rosa nur hier: genau das blockiert den Start.
              <motion.span key="missing" className="font-bold" style={{ fontSize: lu(2.4), color: LOBBY_ACCENTS.pink }} variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" exit="exit">
                {t('tvLobby.readyMissing', 'Noch {{count}} nicht bereit', { count: lobby.readyMissing })}
              </motion.span>
            ) : (
              <motion.span key="all-ready" className="font-black text-[#8ff5ff]" style={{ fontSize: lu(2.4) }} variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" exit="exit">
                {t('tvLobby.allReady', 'Alle bereit ✓')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
    </footer>
  );
}
