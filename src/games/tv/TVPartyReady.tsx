import { motion, useReducedMotion } from 'framer-motion';
import { Gamepad2, Sparkles, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { playableGames } from '@/lib/playable-games';
import { tvType } from './tv-tokens';
import type { PartyNightState } from './party-types';

const spring = { type: 'spring' as const, stiffness: 215, damping: 22, mass: 0.86 };

const GAME_ACCENTS: Record<string, [string, string, string]> = {
  brew: ['#df8eff', '#8ff5ff', '#FFD75E'],
  pixeljagd: ['#38BDF8', '#FDE047', '#FB7185'],
  bomb: ['#FB7185', '#F59E0B', '#A78BFA'],
  ohrwurm: ['#22D3EE', '#A78BFA', '#F472B6'],
  taboo: ['#F472B6', '#FBBF24', '#8B5CF6'],
};

function BrewReadyArt({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className="relative aspect-square w-[min(44vw,34rem)] shrink-0"
      initial={{ opacity: 0, scale: reduced ? 1 : 0.82, y: reduced ? 0 : 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...spring, delay: reduced ? 0 : 0.12 }}
    >
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          aria-hidden
          className="absolute left-1/2 top-[58%] rounded-full border"
          style={{
            width: `${64 + ring * 18}%`,
            height: `${20 + ring * 6}%`,
            borderColor: ring === 1 ? 'rgba(143,245,255,.26)' : 'rgba(223,142,255,.22)',
            boxShadow: ring === 0 ? '0 0 42px rgba(223,142,255,.22)' : undefined,
          }}
          initial={{ x: '-50%', y: '-50%', scale: 0.72, opacity: 0 }}
          animate={reduced
            ? { x: '-50%', y: '-50%', scale: 1, opacity: 0.55 }
            : { x: '-50%', y: '-50%', scale: [0.82, 1.08, 0.82], opacity: [0.18, 0.62, 0.18] }}
          transition={{ duration: 3.6 + ring * 0.7, repeat: reduced ? 0 : Infinity, delay: ring * 0.24, ease: 'easeInOut' }}
        />
      ))}

      <div
        aria-hidden
        className="absolute left-1/2 top-[24.5%] z-20 h-[8.5%] w-[51%] -translate-x-1/2"
      >
        <motion.span
          className="block h-full w-full rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at 42% 34%, #fff 0%, #8ff5ff 7%, #b34cff 35%, #5a0b80 72%, #12051d 100%)',
            boxShadow: '0 0 18px #8ff5ff99, 0 0 48px #df8eff70',
          }}
          animate={reduced ? { opacity: 0.9 } : { scaleX: [0.96, 1.035, 0.96], scaleY: [1, 0.88, 1], filter: ['brightness(1)', 'brightness(1.28)', 'brightness(1)'] }}
          transition={{ duration: 2.2, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }}
        />
      </div>

      {!reduced && [0, 1, 2, 3, 4].map((wisp) => (
        <motion.span
          key={wisp}
          aria-hidden
          className="absolute left-1/2 top-[18%] z-30 h-[24%] w-[5%] rounded-full bg-gradient-to-t from-[#df8eff]/65 via-[#8ff5ff]/28 to-transparent blur-[7px]"
          initial={{ x: `${(wisp - 2) * 32 - 50}%`, y: 20, opacity: 0, scaleY: 0.6 }}
          animate={{ x: [`${(wisp - 2) * 32 - 50}%`, `${(wisp - 2) * 24 - 50}%`], y: [20, -90], opacity: [0, 0.76, 0], scaleY: [0.6, 1.35] }}
          transition={{ duration: 2.4 + (wisp % 2) * 0.45, repeat: Infinity, delay: wisp * 0.32, ease: 'easeOut' }}
        />
      ))}

      <img
        src="/images/brew/cauldron-premium-v2.webp"
        alt=""
        className="relative z-10 h-full w-full object-contain drop-shadow-[0_34px_44px_rgba(0,0,0,.65)]"
      />

      {!reduced && [0, 1, 2, 3, 4, 5].map((spark) => (
        <motion.span
          key={`spark-${spark}`}
          aria-hidden
          className="absolute left-1/2 top-[27%] z-30 h-2 w-2 rounded-full"
          style={{ background: spark % 2 ? '#8ff5ff' : '#FFD75E', boxShadow: `0 0 14px ${spark % 2 ? '#8ff5ff' : '#FFD75E'}` }}
          animate={{ x: [0, (spark - 2.5) * 50], y: [0, -100 - spark * 9], opacity: [0, 1, 0], scale: [0.4, 1.3, 0.2] }}
          transition={{ duration: 1.8 + spark * 0.08, repeat: Infinity, delay: 0.18 + spark * 0.28, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

function GenericReadyArt({ art, accent, reduced }: { art: string | null; accent: string; reduced: boolean }) {
  return (
    <motion.div
      className="relative grid aspect-[4/5] w-[min(36vw,28rem)] shrink-0 place-items-center"
      initial={{ opacity: 0, rotateY: reduced ? 0 : -18, scale: reduced ? 1 : 0.86 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      transition={{ ...spring, delay: reduced ? 0 : 0.12 }}
      style={{ perspective: 1200 }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-[5%] rounded-[3.5rem] border"
        style={{ borderColor: `${accent}70`, boxShadow: `0 0 80px ${accent}38, inset 0 0 70px ${accent}1f` }}
        animate={reduced ? undefined : { rotate: [0, 2.5, 0, -2.5, 0], scale: [1, 1.025, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {art ? (
        <img src={art} alt="" className="h-[86%] w-[86%] rounded-[3rem] object-cover shadow-[0_36px_80px_-34px_rgba(0,0,0,.9)]" />
      ) : (
        <Gamepad2 className="h-32 w-32" style={{ color: accent }} aria-hidden />
      )}
      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute inset-x-[10%] h-24 rounded-full bg-gradient-to-b from-transparent via-white/16 to-transparent blur-md"
          animate={{ y: ['-220%', '330%'], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </motion.div>
  );
}

export default function TVPartyReady({ party }: { party: PartyNightState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const game = party.playlist[party.index] ?? party.playlist[0];
  if (!game) return null;

  const registryGame = playableGames.find((entry) => entry.id === game.gameId);
  const art = registryGame?.image ?? null;
  const [accent, secondary, warm] = GAME_ACCENTS[game.gameId] ?? ['#df8eff', '#8ff5ff', '#FFD75E'];
  const isBrew = game.gameId === 'brew';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#05070e] text-white">
      {art && (
        <div
          aria-hidden
          className="absolute inset-[-8%] bg-cover bg-center opacity-[0.13] blur-[42px]"
          style={{ backgroundImage: `url(${art})` }}
        />
      )}
      <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 46%, ${accent}28, transparent 38%), radial-gradient(circle at 78% 28%, ${secondary}18, transparent 34%), linear-gradient(135deg, #05070e, #0c0916 55%, #05070e)` }} />
      <div aria-hidden className="absolute inset-0 opacity-25" style={{ backgroundImage: `linear-gradient(${accent}16 1px,transparent 1px),linear-gradient(90deg,${secondary}12 1px,transparent 1px)`, backgroundSize: '46px 46px', maskImage: 'radial-gradient(circle at 50% 48%,black,transparent 82%)' }} />

      <motion.header
        className="absolute inset-x-[clamp(2rem,4vw,5rem)] top-[clamp(1.4rem,3.8vh,3.5rem)] z-30 flex items-center justify-between gap-8"
        initial={{ opacity: 0, y: reduced ? 0 : -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.5 }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 backdrop-blur-xl">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: secondary, boxShadow: `0 0 18px ${secondary}` }} />
          <span className="font-black uppercase tracking-[0.25em] text-white/70" style={{ fontSize: tvType.micro }}>
            {t('tv.partyNight.gameXofY', { current: party.index + 1, total: party.playlist.length })}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 font-black uppercase tracking-[0.2em]" style={{ color: secondary, fontSize: tvType.micro }}>
          <Users className="h-[1.2em] w-[1.2em]" aria-hidden />
          {t('nativeExtra.partyNight.playersReady', { n: party.standings.length })}
        </div>
      </motion.header>

      <main className="relative z-10 grid h-full grid-cols-[1.05fr_.95fr] items-center gap-[clamp(2rem,5vw,7rem)] px-[clamp(3rem,7vw,9rem)] pb-[clamp(2rem,5vh,5rem)] pt-[clamp(6rem,12vh,9rem)]">
        <div className="flex min-w-0 items-center justify-center">
          {isBrew ? <BrewReadyArt reduced={reduced} /> : <GenericReadyArt art={art} accent={accent} reduced={reduced} />}
        </div>

        <motion.section
          className="relative min-w-0 overflow-hidden rounded-[clamp(2rem,3vw,3.5rem)] border border-white/[0.1] bg-white/[0.055] p-[clamp(2rem,3.6vw,4.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_40px_100px_-55px_rgba(0,0,0,.9)] backdrop-blur-2xl"
          initial={{ opacity: 0, x: reduced ? 0 : 38 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: reduced ? 0 : 0.18 }}
        >
          <div aria-hidden className="absolute inset-x-[12%] top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${secondary},${warm},transparent)` }} />
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-black uppercase tracking-[0.24em]" style={{ borderColor: `${accent}52`, background: `${accent}16`, color: secondary, fontSize: tvType.micro }}>
            <Sparkles className="h-[1.15em] w-[1.15em]" aria-hidden />
            {t('tv.partyNight.title')}
          </div>
          <motion.h1
            className="mt-[clamp(1rem,2vh,1.8rem)] font-black leading-[0.92] tracking-[-0.045em]"
            style={{ fontSize: 'clamp(3.8rem,6.3vw,7.2rem)' }}
            initial={{ opacity: 0, y: reduced ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reduced ? 0 : 0.3 }}
          >
            {game.name}
          </motion.h1>
          <p className="mt-[clamp(1rem,2.4vh,2rem)] max-w-[30ch] font-bold leading-snug text-white/[0.58]" style={{ fontSize: tvType.body }}>
            {t('nativeExtra.partyNight.readyBody')}
          </p>

          <div className="mt-[clamp(1.5rem,3.5vh,3rem)] flex flex-wrap gap-3">
            {party.standings.slice(0, 8).map((player, index) => (
              <motion.span
                key={player.id}
                className="grid h-[clamp(2.5rem,3.8vw,4rem)] w-[clamp(2.5rem,3.8vw,4rem)] place-items-center rounded-full border-2 font-black"
                style={{ background: `linear-gradient(145deg,${player.color},#0b0b16)`, borderColor: `${player.color}cc`, boxShadow: index === 0 ? `0 0 26px ${player.color}66` : undefined, fontSize: tvType.label }}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.4, y: reduced ? 0 : 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...spring, delay: reduced ? 0 : 0.42 + index * 0.055 }}
              >
                {player.avatar || player.name.slice(0, 1).toUpperCase()}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="mt-[clamp(1.7rem,4vh,3.5rem)] flex items-center gap-4 rounded-[1.5rem] border px-5 py-4"
            style={{ borderColor: `${secondary}44`, background: `linear-gradient(100deg,${secondary}14,${accent}18)` }}
            animate={reduced ? undefined : { boxShadow: [`0 0 0 ${secondary}00`, `0 0 34px ${secondary}28`, `0 0 0 ${secondary}00`] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: `linear-gradient(135deg,${secondary},${accent})`, color: '#070812' }}>
              <Zap className="h-6 w-6" strokeWidth={2.8} aria-hidden />
            </span>
            <span className="font-black text-white" style={{ fontSize: tvType.label }}>
              {t('nativeExtra.partyNight.startNow', { game: game.name })}
            </span>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
