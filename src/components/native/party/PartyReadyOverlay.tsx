import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Play, Sparkles, Tv, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { playableGames } from '@/lib/playable-games';
import { spring } from '@/lib/motion';

interface Props {
  open: boolean;
  gameId: string | null;
  gameName: string | null;
  playerCount: number;
  tvActive: boolean;
  onStart: () => void;
  onBack: () => void;
}

/**
 * Der bewusste Atemzug vor Spiel eins.
 *
 * Die Set-Liste ist zu diesem Zeitpunkt bereits gespeichert, das Spiel aber
 * noch nicht geroutet. So kann die ganze Runde erst zum Fernseher schauen und
 * der Host startet genau dann, wenn wirklich alle bereit sind.
 */
export function PartyReadyOverlay({
  open,
  gameId,
  gameName,
  playerCount,
  tvActive,
  onStart,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const art = playableGames.find((game) => game.id === gameId)?.image ?? null;
  const isBrew = gameId === 'brew';

  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {open && gameId && gameName && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-end bg-[#05070d]/88 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="relative mx-auto w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0b17] shadow-[0_30px_90px_rgba(0,0,0,.7)]"
              initial={{ opacity: 0, y: reduced ? 0 : 42, scale: reduced ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.98 }}
              transition={spring.snappy}
              role="dialog"
              aria-modal="true"
              aria-labelledby="party-ready-title"
            >
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(223,142,255,.2),transparent_48%)]" />
              <div aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(143,245,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(223,142,255,.08) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

              <div className="relative h-64 overflow-hidden">
                {art && <div aria-hidden className="absolute inset-[-12%] bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${art})` }} />}

                {isBrew ? (
                  <motion.div
                    className="absolute left-1/2 top-2 h-64 w-64 -translate-x-1/2"
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.78 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.bouncy, delay: reduced ? 0 : 0.08 }}
                  >
                    <div
                      aria-hidden
                      className="absolute left-1/2 top-[24%] z-20 h-[8%] w-[51%] -translate-x-1/2"
                    >
                      <motion.span
                        className="block h-full w-full rounded-[50%] bg-[radial-gradient(ellipse,#fff_0%,#8ff5ff_9%,#b34cff_42%,#180721_100%)] shadow-[0_0_26px_rgba(223,142,255,.7)]"
                        animate={reduced ? undefined : { scaleX: [0.96, 1.04, 0.96], opacity: [0.82, 1, 0.82] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                    <img src="/images/brew/cauldron-premium-v2.webp" alt="" className="relative z-10 h-full w-full object-contain" />
                  </motion.div>
                ) : art ? (
                  <motion.img
                    src={art}
                    alt=""
                    className="absolute left-1/2 top-5 h-52 w-52 -translate-x-1/2 rounded-[34px] border border-white/15 object-cover shadow-2xl"
                    initial={{ opacity: 0, rotate: reduced ? 0 : -5, scale: reduced ? 1 : 0.82 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    transition={spring.bouncy}
                  />
                ) : null}

                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0b17] to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#8ff5ff]/20 bg-[#07151a]/75 px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[#9bf7ff] backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {t('tv.partyNight.title')}
                </div>
              </div>

              <div className="relative px-5 pb-5">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#df8eff]">
                  {t('nativeExtra.partyNight.playersReady', { n: playerCount })}
                </p>
                <h2 id="party-ready-title" className="mt-1 text-3xl font-black leading-tight text-white">
                  {gameName}
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.045] px-3 py-3">
                    <Users className="h-4 w-4 text-[#df8eff]" aria-hidden />
                    <p className="mt-2 text-lg font-black text-white tabular-nums">{playerCount}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">{t('nativeExtra.partyLobby.playersHeading', { count: playerCount, max: 12 })}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.045] px-3 py-3">
                    <Tv className="h-4 w-4 text-[#8ff5ff]" aria-hidden />
                    <p className="mt-2 text-sm font-black text-white">{t(tvActive ? 'nativeExtra.partyNight.tvConnected' : 'nativeExtra.partyNight.phoneOnly')}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">{t(tvActive ? 'tv.connected' : 'tv.ready')}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-white/[0.64]">
                  {t('nativeExtra.partyNight.readyBody')}
                </p>

                <div className="mt-5 grid grid-cols-[.62fr_1.38fr] gap-2">
                  <motion.button
                    type="button"
                    onClick={onBack}
                    whileTap={{ scale: 0.97 }}
                    className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-xs font-black text-white/60"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    {t('nativeExtra.partyNight.notNow')}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={onStart}
                    whileTap={{ scale: 0.97 }}
                    className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8ff5ff] via-[#df8eff] to-[#FFD75E] px-3 text-sm font-black text-[#080914] shadow-[0_18px_48px_-22px_rgba(223,142,255,.9)]"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                    <span className="truncate">{t('nativeExtra.partyNight.startNow', { game: gameName })}</span>
                  </motion.button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
