import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Play, Tv } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { useHaptics } from '@/hooks/useHaptics';
import { planPartyScene, type PartyScene } from '@/games/party/party-scene';
import type { PartyPlayer } from '@/games/party/session-schema';
import type { PlayerProfile } from '@/games/party/controller-session';
import { chipText } from '@/games/party/party-availability';
import { SceneCountdown } from '@/games/ui/SceneCountdown';
import { availabilityChip, playableGames } from '@/lib/playable-games';
import { firePartyHaptic, listStagger, partyCue, partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { EveningSetlistRow } from './EveningSetlistRow';
import { LocalEveningRoster } from './LocalEveningRoster';
import { GameArt } from './NextGameCard';
import { PartyBottomBar, PartyBottomBarSpacer } from './PartyBottomBar';
import { SeatAvatar } from './PartySheet';
import { estimateSetlistMinutes, localGameAvailability } from './setlist';

interface Props {
  open: boolean;
  players: PartyPlayer[];
  /** The planned games from the first one on. */
  gameIds: string[];
  tvActive: boolean;
  onConnectTv: () => void;
  onStartJoysticks: () => void;
  onAddPlayer: (profile: PlayerProfile) => void;
  onUpdatePlayer: (id: string, profile: PlayerProfile) => void;
  onRemovePlayer: (id: string) => void;
  onMovePlayer: (from: number, to: number) => void;
  onRemoveGame: (offset: number) => void;
  onEditSetlist: () => void;
  /** Countdown planned — mirror it to the TV so both count together (T05). */
  onCountdown: (scene: PartyScene) => void;
  /** "Los!" reached: launch the first game. */
  onStart: (gameId: string) => void;
  onBack: () => void;
}

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]';

/**
 * "Euer Abend" — between choosing the games and the first game (one-phone
 * party). Nothing starts on its own: players can still be added, renamed,
 * re-coloured, removed and put in turn order, the evening can be reordered,
 * and only „Erstes Spiel starten“ runs the 3-2-1 into the first game.
 */
export function PartyEveningScreen(props: Props) {
  const { open, players, gameIds, tvActive, onConnectTv, onBack } = props;
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const [countdown, setCountdown] = useState<PartyScene | null>(null);
  const first = playableGames.find(game => game.id === gameIds[0]) ?? null;
  const tr = (key: string, fallback: string, options?: Record<string, unknown>) => t(key, fallback, options);
  const availability = first ? localGameAvailability(first.id, players.length) : null;
  const chipOf = (id: string) => { const a = localGameAvailability(id, players.length); return a.startable ? null : availabilityChip(a); };
  const blocker = players.length < 2 ? t('partyPlay.evening.needTwo', 'Mindestens 2 Spieler')
    : availability && !availability.startable ? chipText(availabilityChip(availability), tr) : null;
  const minutes = estimateSetlistMinutes(gameIds, players.length);
  const start = () => {
    if (!first || blocker || countdown) return;
    firePartyHaptic(haptics, partyCue('T05', 'host').haptic);
    const scene = planPartyScene('game-start', { gameId: first.id });
    setCountdown(scene);
    props.onCountdown(scene);
  };

  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {open && first && (
          <motion.div data-testid="party-evening" variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-[#060810] text-white">
            <motion.div className="mx-auto max-w-2xl space-y-6 px-5 pt-[max(20px,env(safe-area-inset-top))]" variants={listStagger} initial="initial" animate="animate">
              {/* Stage */}
              <motion.header variants={partyMotion('cardEnter', reduced)} className="relative -mx-5 px-5 pb-2">
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(110% 80% at 50% 0%, ${players[0]?.color ?? '#df8eff'}2e, transparent 65%)` }} />
                <div className="relative flex items-center gap-3">
                  <button type="button" onClick={onBack} aria-label={t('common.back')}
                    className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/80 active:bg-white/10', focus)}>
                    <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
                  </button>
                  <div className="min-w-0">
                    <h1 className="font-game text-3xl font-black leading-tight">{t('partyPlay.evening.title', 'Euer Abend')}</h1>
                    <p className="text-sm text-white/60">{t('partyPlay.evening.meta', '{{count}} Spiele · ca. {{minutes}} Min.', { count: gameIds.length, minutes })}</p>
                  </div>
                </div>
                <ul className="relative mt-5 flex items-center justify-center ps-[10px]" aria-label={t('partyControllers.players', { count: players.length })}>
                  {players.slice(0, 8).map(p => (
                    <li key={p.id} className="-ms-[10px] rounded-full" style={{ boxShadow: `0 0 0 2px #060810, ${playerGlow(p.color)}` }} title={p.name}>
                      <SeatAvatar avatar={p.avatar} color={p.color} size={52} />
                    </li>
                  ))}
                </ul>
              </motion.header>

              {/* Hero: the first game */}
              <motion.article data-testid="evening-hero" data-game-id={first.id} variants={partyMotion('cardEnter', reduced)}
                animate={countdown && !reduced ? { scale: 1.04 } : undefined}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1020]"
                style={countdown ? { boxShadow: playerGlow('#df8eff', 'active') } : undefined}>
                <GameArt game={first} className="aspect-video w-full" />
                <div aria-hidden className="absolute inset-x-0 top-0 aspect-video bg-gradient-to-t from-[#0d1020] via-transparent to-transparent" />
                <span className="absolute start-4 top-4 grid h-8 min-w-8 place-items-center rounded-full bg-[#060810]/80 px-2 font-game text-base font-black tabular-nums">1</span>
                <div className="relative -mt-8 space-y-1.5 px-5 pb-5">
                  <h2 className="font-game text-3xl font-black leading-tight">{t(first.nameKey)}</h2>
                  <p className="line-clamp-2 text-sm text-white/70">{t('partyPlay.evening.howTo', "So geht's: {{text}}", { text: t(first.descKey) })}</p>
                  {availability && !availability.startable && <p className="text-xs text-amber-200">{blocker}</p>}
                </div>
              </motion.article>

              {/* TV status (only when it needs something) */}
              {!tvActive && (
                <motion.button variants={partyMotion('cardEnter', reduced)} type="button" data-testid="evening-tv" onClick={onConnectTv}
                  className={cn('flex min-h-14 w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/[.04] px-4 text-start active:bg-white/10', focus)}>
                  <Tv className="h-5 w-5 text-[#8ff5ff]" aria-hidden /><span className="flex-1 font-semibold">{t('partyControllers.tv')}</span>
                </motion.button>
              )}
              {tvActive && <p data-testid="evening-tv" data-connected="true" className="flex items-center gap-2 text-sm text-[#8ff5ff]">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[#8ff5ff] shadow-[0_0_8px_#8ff5ff]" />{t('partyPlay.lobby.tvOn', 'Fernseher verbunden')}</p>}
              <button type="button" data-testid="evening-joystick-mode" onClick={props.onStartJoysticks}
                className={cn('flex min-h-14 w-full items-center gap-3 rounded-3xl border border-[#df8eff]/30 bg-[#df8eff]/10 px-4 text-start font-semibold', focus)}>
                <Gamepad2 className="h-5 w-5 text-[#df8eff]" aria-hidden />
                {t('partyControllers.importLocalAction', 'Joystick-Modus mit diesen Spielern starten')}
              </button>

              <LocalEveningRoster players={players} onAdd={props.onAddPlayer} onUpdate={props.onUpdatePlayer} onRemove={props.onRemovePlayer} onMove={props.onMovePlayer} />
              <EveningSetlistRow gameIds={gameIds.slice(1)} chipFor={chipOf} onRemove={props.onRemoveGame} onEdit={props.onEditSetlist} />
              <PartyBottomBarSpacer />
            </motion.div>

            <PartyBottomBar testId="evening-start-bar" zIndex={130} coversTabBar>
              <motion.button type="button" data-testid="evening-start" disabled={!!blocker || !!countdown} onClick={start}
                data-disabled-reason={blocker ?? undefined} {...(reduced || blocker ? {} : pressable)}
                className={cn('flex min-h-16 w-full items-center justify-center gap-2 rounded-full px-6 text-lg font-black', focus,
                  blocker ? 'border border-[#df8eff]/40 bg-[#17102b] text-white/85' : 'bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#060810] shadow-[0_16px_50px_rgba(223,142,255,.35)]')}>
                <Play className="h-5 w-5" aria-hidden />{t('partyPlay.evening.start', 'Erstes Spiel starten')}
              </motion.button>
              {blocker && <p role="status" className="mt-1 min-h-11 text-center text-sm font-semibold text-[#f3d9ff]/80">{blocker}</p>}
            </PartyBottomBar>

            {/* Synced 3-2-1: the phone counts with the TV, "Los!" launches the first game. */}
            <AnimatePresence>
              {countdown && (
                <motion.div data-testid="party-scene-overlay" data-scene-id={countdown.sceneId} variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
                  className="fixed inset-0 z-[150] bg-[#060810]/90 backdrop-blur-xl">
                  <p className="absolute inset-x-0 top-[max(12%,env(safe-area-inset-top))] text-center text-sm font-semibold uppercase tracking-[.25em] text-[#8ff5ff]">{t(first.nameKey)}</p>
                  <SceneCountdown scene={countdown} onGo={() => props.onStart(first.id)} className="absolute inset-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
