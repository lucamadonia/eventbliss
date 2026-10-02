import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase, playerGlow } from '@/lib/party-motion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel, tvType } from '../../tv-tokens';
import { BB, bombColor, bombPid, emojiOnly, type BombPlayer } from './bomb-tv';

export interface RankedBombPlayer { p: BombPlayer; i: number; rank: number }

/** Wenigste Strafen vorne; Gleichstand teilt sich den Platz. */
export function rankBombPlayers(players: BombPlayer[]): RankedBombPlayer[] {
  const sorted = players.map((p, i) => ({ p, i })).sort((a, b) => (a.p.penalties ?? 0) - (b.p.penalties ?? 0));
  return sorted.map((e) => ({ ...e, rank: 1 + sorted.findIndex((x) => (x.p.penalties ?? 0) === (e.p.penalties ?? 0)) }));
}

/** Rangliste als Karten: Platz, Avatar, Name, Strafen als Bomben-Zaehler. */
export function BombStandingsList({ ranked, highlightIdx = -1, compact = false }: { ranked: RankedBombPlayer[]; highlightIdx?: number; compact?: boolean }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <motion.ol className="flex w-full flex-col" style={{ gap: compact ? lu(1.2) : lu(1.6) }} variants={staggerChildren(80)} initial="initial" animate="animate">
      {ranked.map(({ p, i, rank }) => {
        const color = bombColor(p, i);
        const pen = p.penalties ?? 0;
        const lead = rank === 1;
        const hit = i === highlightIdx;
        return (
          <motion.li key={bombPid(p, i)} variants={riseIn(reduced)}
            className={`${tvPanel} flex items-center`}
            style={{ gap: lu(2), padding: `${compact ? lu(1.1) : lu(1.5)} ${lu(2.6)}`, boxShadow: lead ? playerGlow(BB.gold, 'active') : hit ? playerGlow(BB.danger, 'soft') : undefined }}>
            <span className="text-center font-black tabular-nums" style={{ minWidth: '1.8em', fontSize: tvType.body, color: lead ? BB.gold : BB.dim }}>{lead ? '👑' : rank}</span>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={emojiOnly(p.avatar)} color={color} size={compact ? lu(5.4) : lu(6.4)} active={lead} />
            <span className="min-w-0 flex-1 truncate font-bold" style={{ fontSize: tvType.body, color: BB.text }}>{p.name}</span>
            {hit && (
              <span className="rounded-full px-4 py-1 font-bold" style={{ fontSize: tvType.label, color: '#fff', background: `${BB.danger}33`, border: `1px solid ${BB.danger}77` }}>
                {t('tvCinema.bomb.plusOne', '+1 Strafe')}
              </span>
            )}
            <span className="flex items-center gap-2 font-black tabular-nums" style={{ fontSize: tvType.title, color: pen === 0 ? BB.cyan : BB.text }}>
              <span aria-hidden style={{ fontSize: '0.7em' }}>💣</span>{pen}
            </span>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

/** Spielende: Sieger (wenigste Strafen) im Rampenlicht, Rangliste daneben. */
export function BombGameOver({ players }: { players: BombPlayer[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ranked = rankBombPlayers(players);
  const winners = ranked.filter((r) => r.rank === 1);
  const names = winners.map((w) => w.p.name).join(' & ');
  return (
    <div className="absolute inset-x-[5vw] bottom-[6vh] top-[14vh] grid grid-cols-[1.1fr_1fr] items-center" style={{ gap: lu(6) }}>
      <div className="relative flex h-full items-center justify-center">
        {winners.length > 0 && <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[BB.gold, BB.cyan, BB.primary, '#ffffff']} count={60} delay={0.35} /></div>}
        <motion.div className="relative z-10 flex flex-col items-center rounded-[50%] px-[5vw] py-[4vh] text-center" style={{ gap: lu(2), background: 'radial-gradient(ellipse closest-side, #060810 62%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(140)} initial="initial" animate="animate">
          <motion.div variants={riseIn(reduced)} className="flex" style={{ gap: lu(1.6) }}>
            {winners.slice(0, 3).map(({ p, i }) => (
              <motion.div key={bombPid(p, i)} initial={reduced ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.7, bounce: 0.45, delay: 0.2 }}>
                <TVPlayerAvatar id={p.id} name={p.name} avatar={emojiOnly(p.avatar)} color={bombColor(p, i)} size={winners.length > 1 ? lu(13) : lu(18)} active />
              </motion.div>
            ))}
          </motion.div>
          <motion.span variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.body, color: BB.gold }}>
            {t('games.bomb.fewestPenalties', 'Wenigste Strafpunkte')}
          </motion.span>
          <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 60px ${BB.gold}88` }}>
            {winners.length > 1
              ? t('tvCinema.bomb.winners', '{{names}} gewinnen!', { names })
              : t('tvCinema.bomb.winner', '{{name}} gewinnt!', { name: names })}
          </motion.h1>
        </motion.div>
      </div>
      <motion.div className="flex flex-col" style={{ gap: lu(2) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5, ease: partyEase.out }}>
        <h2 className="font-black" style={{ fontSize: tvType.title, color: BB.text }}>{t('tvCinema.bomb.final', 'Endstand')}</h2>
        <BombStandingsList ranked={ranked} compact={players.length > 5} />
      </motion.div>
    </div>
  );
}
