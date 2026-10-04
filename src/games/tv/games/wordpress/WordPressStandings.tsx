import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { playerGlow } from '@/lib/party-motion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel, tvType } from '../../tv-tokens';
import { WP, accuracyOf, emojiOnly, wpColor, wpPid, type WPPlayer } from './wp-tv';

interface Ranked { p: WPPlayer; i: number; rank: number }

export function rankWordPress(players: WPPlayer[]): Ranked[] {
  const sorted = players.map((p, i) => ({ p, i })).sort((a, b) => (b.p.score ?? 0) - (a.p.score ?? 0));
  return sorted.map((e) => ({ ...e, rank: 1 + sorted.findIndex((x) => (x.p.score ?? 0) === (e.p.score ?? 0)) }));
}

/** Rangliste: Platz, Avatar, Name, beste Combo + Trefferquote, Punkte. */
export function WordPressRanking({ ranked, compact = false }: { ranked: Ranked[]; compact?: boolean }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <motion.ol className="flex w-full flex-col" style={{ gap: compact ? lu(1.1) : lu(1.5) }} variants={staggerChildren(80)} initial="initial" animate="animate">
      {ranked.map(({ p, i, rank }) => {
        const lead = rank === 1;
        const acc = accuracyOf(p);
        return (
          <motion.li key={wpPid(p, i)} variants={riseIn(reduced)} className={`${tvPanel} flex items-center`}
            style={{ gap: lu(2), padding: `${compact ? lu(1.1) : lu(1.4)} ${lu(2.6)}`, boxShadow: lead ? playerGlow(WP.gold, 'active') : undefined }}>
            <span className="text-center font-black tabular-nums" style={{ minWidth: '1.8em', fontSize: tvType.body, color: lead ? WP.gold : WP.dim }}>{lead ? '👑' : rank}</span>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={emojiOnly(p.avatar)} color={wpColor(p, i)} size={compact ? lu(5.4) : lu(6.2)} active={lead} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-bold" style={{ fontSize: tvType.body, color: '#fff' }}>{p.name}</span>
              <span className="font-semibold tabular-nums" style={{ fontSize: tvType.label, color: WP.dim }}>
                {[p.maxCombo > 0 ? t('tvCinema.wordpress.bestCombo', 'beste Combo {{count}}×', { count: p.maxCombo }) : '', acc !== null ? t('tvCinema.wordpress.accuracy', '{{pct}} % Treffer', { pct: acc }) : ''].filter(Boolean).join(' · ')}
              </span>
            </div>
            <span className="font-black tabular-nums" style={{ fontSize: tvType.title, color: '#fff' }}>{p.score ?? 0}</span>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

/** Spielende: Sieger im Rampenlicht (Konfetti dahinter), Rangliste daneben. */
export function WordPressGameOver({ players }: { players: WPPlayer[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ranked = rankWordPress(players);
  const winner = ranked[0];
  if (!winner) return null;
  return (
    <div className="absolute inset-x-[5vw] bottom-[6vh] top-[14vh] grid grid-cols-[1.1fr_1fr] items-center" style={{ gap: lu(6) }}>
      <div className="relative flex h-full items-center justify-center">
        <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[WP.gold, WP.secondary, WP.primary, '#ffffff']} count={60} delay={0.35} /></div>
        <motion.div className="relative z-10 flex flex-col items-center rounded-[50%] px-[5vw] py-[4vh] text-center" style={{ gap: lu(2), background: 'radial-gradient(ellipse closest-side, #0a0e14 62%, rgba(10,14,20,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(140)} initial="initial" animate="animate">
          <motion.div variants={riseIn(reduced)}>
            <TVPlayerAvatar id={winner.p.id} name={winner.p.name} avatar={emojiOnly(winner.p.avatar)} color={wpColor(winner.p, winner.i)} size={lu(18)} active />
          </motion.div>
          <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 60px ${WP.gold}88` }}>
            {t('tvCinema.wordpress.winner', '{{name}} gewinnt!', { name: winner.p.name })}
          </motion.h1>
          <motion.span variants={riseIn(reduced)} className="font-bold tabular-nums" style={{ fontSize: tvType.body, color: WP.gold }}>
            {t('tvCinema.wordpress.points', '{{count}} Punkte', { count: winner.p.score ?? 0 })}
          </motion.span>
        </motion.div>
      </div>
      <div className="flex flex-col" style={{ gap: lu(2) }}>
        <h2 className="font-black" style={{ fontSize: tvType.title, color: WP.text }}>{t('tvCinema.wordpress.final', 'Endstand')}</h2>
        <WordPressRanking ranked={ranked} compact={players.length > 5} />
      </div>
    </div>
  );
}
