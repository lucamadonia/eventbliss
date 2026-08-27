import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trophy } from 'lucide-react';

import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import TVPartyPodium from './components/TVPartyPodium';
import { tvType } from './tv-tokens';
import type { PartyStanding } from './party-types';
import type { TVScore } from './useTVConnection';

const spring = { type: 'spring' as const, stiffness: 225, damping: 23, mass: 0.82 };

const THEMES: Record<string, { accent: string; secondary: string; warm: string; background: string }> = {
  brew: { accent: '#df8eff', secondary: '#8ff5ff', warm: '#FFD75E', background: '#070812' },
  pixeljagd: { accent: '#38BDF8', secondary: '#FDE047', warm: '#FB7185', background: '#07101e' },
  closeenough: { accent: '#A78BFA', secondary: '#22D3EE', warm: '#FBBF24', background: '#090b19' },
  bomb: { accent: '#FB7185', secondary: '#F59E0B', warm: '#A78BFA', background: '#12070d' },
};

const DEFAULT_THEME = { accent: '#df8eff', secondary: '#8ff5ff', warm: '#FFD75E', background: '#070812' };

/**
 * Premium-Einzelspiel-Sieg auf dem Fernseher.
 *
 * Party-Spiele werden vorher nach `TVPartyStandings` umgeleitet. Diese Szene
 * bleibt der hochwertige Rueckfall fuer ein einzelnes Spiel: gemeinsame
 * Victory-Circuit-Buehne, kurze Reveal-Takte und eine kompakte Endtabelle statt
 * der frueheren grossen Legacy-Ranglistenkarte.
 */
export default function TVGameOver({ scores, gameId }: { scores: TVScore[]; gameId?: string }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const theme = THEMES[gameId ?? ''] ?? DEFAULT_THEME;
  const sorted = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);
  const winner = sorted[0];

  const podium = useMemo<PartyStanding[]>(
    () => sorted.map((entry, index) => ({
      id: `${entry.name}-${index}`,
      name: entry.name,
      color: entry.color || theme.accent,
      points: entry.score,
      rank: index + 1,
      prevRank: null,
      gamesWon: index === 0 ? 1 : 0,
      streak: 0,
    })),
    [sorted, theme.accent],
  );

  const [beat, setBeat] = useState(reduced ? 3 : 0);
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    if (reduced) {
      setBeat(3);
      setConfetti(false);
      return;
    }
    setBeat(0);
    const timers = [
      window.setTimeout(() => {
        setBeat(1);
        setConfetti(true);
      }, 760),
      window.setTimeout(() => setBeat(2), 1750),
      window.setTimeout(() => setBeat(3), 2350),
      window.setTimeout(() => setConfetti(false), 2250),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  if (!winner) return <div className="h-screen w-screen" style={{ background: theme.background }} />;

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white" style={{ background: theme.background }}>
      <div aria-hidden className="absolute inset-0 opacity-35" style={{ backgroundImage: `linear-gradient(${theme.accent}13 1px,transparent 1px),linear-gradient(90deg,${theme.secondary}10 1px,transparent 1px)`, backgroundSize: '44px 44px', maskImage: 'radial-gradient(circle at 42% 46%,black,transparent 78%)' }} />
      <motion.div
        aria-hidden
        className="absolute left-[37%] top-[42%] h-[42rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: `${winner.color || theme.accent}2f` }}
        initial={{ opacity: 0, scale: reduced ? 1 : 0.68 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0.1 : 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <div aria-hidden className="absolute right-[-10rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full blur-[130px]" style={{ background: `${theme.secondary}17` }} />

      <ConfettiBurst active={confetti} count={46} />

      <motion.header
        className="absolute inset-x-[clamp(2rem,4vw,5rem)] top-[clamp(1.3rem,3vh,3rem)] z-30 flex items-center justify-between gap-6"
        initial={{ opacity: 0, y: reduced ? 0 : -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.45 }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 backdrop-blur-xl">
          <Sparkles className="h-[1.15em] w-[1.15em]" style={{ color: theme.secondary }} aria-hidden />
          <span className="font-black uppercase tracking-[0.27em] text-white/[0.68]" style={{ fontSize: tvType.micro }}>
            {t('games.results.gameOver')}
          </span>
        </div>
        {gameId && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-black uppercase tracking-[.24em] text-white/38" style={{ fontSize: tvType.micro }}>
            {gameId}
          </span>
        )}
      </motion.header>

      <main className="relative z-10 grid h-full grid-cols-[1.35fr_.65fr] gap-[clamp(2rem,4vw,5rem)] px-[clamp(2.5rem,5vw,6rem)] pb-[clamp(2rem,4vh,4rem)] pt-[clamp(5.5rem,10vh,8rem)]">
        <section className="flex min-h-0 flex-col items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <p className="font-black uppercase tracking-[0.34em]" style={{ color: theme.secondary, fontSize: tvType.micro }}>
              {t('tv.andTheWinnerIs')}
            </p>
            <h1 className="mt-2 font-black leading-[.9] tracking-[-.05em]" style={{ fontSize: 'clamp(4rem,7.3vw,8.4rem)' }}>
              {winner.name}
            </h1>
          </motion.div>

          <TVPartyPodium entries={podium} reveal={beat >= 1} variant="finale" className="mt-[-1rem] max-w-[min(58rem,92%)]" />

          <motion.div
            className="-mt-1 inline-flex items-center gap-3 rounded-full border px-6 py-3 font-black"
            style={{ borderColor: `${theme.warm}50`, background: `linear-gradient(90deg,transparent,${theme.warm}16,transparent)`, fontSize: tvType.label }}
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={beat >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 16 }}
            transition={spring}
          >
            <Trophy className="h-[1.1em] w-[1.1em]" style={{ color: theme.warm }} aria-hidden />
            <span>{winner.score.toLocaleString('de-DE')} {t('tv.points')}</span>
          </motion.div>
        </section>

        <motion.aside
          className="relative my-auto flex max-h-[72vh] min-h-0 flex-col overflow-hidden rounded-[clamp(1.8rem,2.6vw,3rem)] border border-white/[0.09] bg-white/[0.048] p-[clamp(1rem,1.7vw,2rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.09),0_34px_90px_-58px_rgba(0,0,0,.95)] backdrop-blur-2xl"
          initial={{ opacity: 0, x: reduced ? 0 : 30 }}
          animate={beat >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: reduced ? 0 : 30 }}
          transition={spring}
        >
          <div aria-hidden className="absolute inset-x-[15%] top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent},${theme.secondary},transparent)` }} />
          <div className="mb-4 flex items-center justify-between gap-4 px-1">
            <h2 className="font-black uppercase tracking-[0.24em] text-white/48" style={{ fontSize: tvType.micro }}>{t('games.results.leaderboard')}</h2>
            <span className="font-black tabular-nums text-white/30" style={{ fontSize: tvType.micro }}>{sorted.length}</span>
          </div>
          <div className="min-h-0 space-y-[clamp(.35rem,.7vh,.65rem)] overflow-y-auto">
            {sorted.map((entry, index) => (
              <motion.div
                key={`${entry.name}-${index}`}
                className="relative flex items-center gap-[clamp(.55rem,1vw,1rem)] overflow-hidden rounded-[clamp(1rem,1.4vw,1.4rem)] border px-[clamp(.65rem,1vw,1rem)] py-[clamp(.55rem,.9vh,.9rem)]"
                style={{ borderColor: index === 0 ? `${entry.color}70` : 'rgba(255,255,255,.07)', background: index === 0 ? `linear-gradient(105deg,${entry.color}24,rgba(255,255,255,.04))` : 'rgba(255,255,255,.025)' }}
                initial={{ opacity: 0, x: reduced ? 0 : 20 }}
                animate={beat >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: reduced ? 0 : 20 }}
                transition={{ ...spring, delay: reduced ? 0 : Math.min(index * 0.055, 0.4) }}
              >
                {index === 0 && <span aria-hidden className="absolute inset-y-[18%] left-0 w-[3px] rounded-full" style={{ background: entry.color, boxShadow: `0 0 16px ${entry.color}` }} />}
                <span className="w-[1.8em] shrink-0 text-center font-black tabular-nums" style={{ color: index < 3 ? [theme.warm, '#D9E1F2', '#E99A67'][index] : 'rgba(255,255,255,.3)', fontSize: tvType.label }}>{String(index + 1).padStart(2, '0')}</span>
                <span className="grid h-[clamp(2.1rem,3vw,3.2rem)] w-[clamp(2.1rem,3vw,3.2rem)] shrink-0 place-items-center rounded-full border font-black" style={{ background: `linear-gradient(145deg,${entry.color},#0b0b16)`, borderColor: `${entry.color}b0`, fontSize: tvType.label }}>{entry.name.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate font-black" style={{ fontSize: tvType.label }}>{entry.name}</span>
                <span className="shrink-0 font-black tabular-nums" style={{ color: index === 0 ? theme.warm : 'rgba(255,255,255,.68)', fontSize: tvType.label }}>{entry.score.toLocaleString('de-DE')}</span>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </main>
    </div>
  );
}
