import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvType } from '../../tv-tokens';
import { TS, TVTimerRing } from '../turn-stage/kit';

export const TD = { truth: '#df8eff', dare: '#ff6b98' } as const;
export interface TDPlayer { id: string; name: string; color: string; avatar?: string; score: number; truthCount: number; dareCount: number }

/** Drehen: alle im Kreis, ein Lichtkegel wandert ringsum (nur rotate). */
export function SpinScene({ players }: { players: TDPlayer[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const n = Math.max(1, players.length);
  return (
    <div className="relative" style={{ width: '62vh', height: '62vh' }}>
      <motion.div aria-hidden className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(from 0deg, ${TD.truth}00 0deg, ${TD.truth}55 30deg, ${TD.dare}00 70deg, transparent 360deg)` }}
        animate={ambient && !reduced ? { rotate: 360 } : { rotate: 0 }}
        transition={ambient && !reduced ? { repeat: Infinity, duration: 2.6, ease: 'linear' } : { duration: 0.2 }} />
      <div aria-hidden className="absolute inset-[10%] rounded-full" style={{ background: TS.bg, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)` }} />
      {players.map((p, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <div key={p.id} className="absolute flex flex-col items-center gap-1" style={{ left: `${50 + Math.cos(a) * 45}%`, top: `${50 + Math.sin(a) * 45}%`, transform: 'translate(-50%, -50%)' }}>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(8)} />
          </div>
        );
      })}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-[12%] text-center">
        <span style={{ fontSize: lu(9) }} aria-hidden>🎯</span>
        <span className="font-black leading-tight" style={{ fontSize: tvType.title }}>{t('tv.truthdare.whosNext', 'Wer ist als Nächstes dran?')}</span>
      </div>
    </div>
  );
}

/** Wahl: zwei grosse Karten atmen abwechselnd. */
export function ChoiceScene({ name }: { name: string }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const option = (kind: 'truth' | 'dare', delay: number) => {
    const color = TD[kind];
    const Icon = kind === 'truth' ? Heart : Flame;
    return (
      <motion.div variants={riseIn(reduced)}>
        <motion.div className="flex flex-col items-center gap-[2vh] rounded-[28px] px-[3vw] py-[5vh]"
          style={{ background: `linear-gradient(170deg, ${color}33, ${TS.raised} 65%)`, boxShadow: `0 0 0 2px ${color}88, 0 0 60px -12px ${color}` }}
          animate={ambient ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay } : { duration: 0.2 }}>
          <Icon style={{ width: lu(11), height: lu(11), color }} strokeWidth={2.2} />
          <span className="font-black" style={{ fontSize: tvType.display }}>{kind === 'truth' ? t('games.truthdare.truth', 'Wahrheit') : t('games.truthdare.dare', 'Pflicht')}</span>
        </motion.div>
      </motion.div>
    );
  };
  return (
    <motion.div className="flex flex-col items-center gap-[5vh]" variants={staggerChildren(120)} initial="initial" animate="animate">
      <motion.span variants={riseIn(reduced)} className="text-center font-black" style={{ fontSize: tvType.display }}>
        {t('tvCinema.truthdare.chooses', '{{name}} wählt …', { name })}
      </motion.span>
      <div className="flex items-center gap-[3vw]">
        {option('truth', 0)}
        <span className="font-black" style={{ fontSize: tvType.title, color: TS.dim }}>{t('tvCinema.truthdare.or', 'oder')}</span>
        {option('dare', 1.2)}
      </div>
    </motion.div>
  );
}

/** Aufgabe: die Karte als Held, bei Pflicht mit Uhr. */
export function RevealScene({ isTruth, task, timeLeft, maxTime }: { isTruth: boolean; task: string; timeLeft: number; maxTime: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const color = isTruth ? TD.truth : TD.dare;
  const Icon = isTruth ? Heart : Flame;
  const showTimer = !isTruth && maxTime > 0;
  return (
    <motion.div className="flex w-full flex-col items-center gap-[4vh]" variants={staggerChildren(120)} initial="initial" animate="animate">
      <motion.div data-testid="tv-truthdare-task" className="flex max-w-[48vw] flex-col items-center gap-[2vh] rounded-[28px] px-[3vw] py-[5vh] text-center"
        style={{ background: `linear-gradient(170deg, ${color}26, ${TS.raised} 60%)`, boxShadow: `0 0 0 2px ${color}aa, 0 0 70px -14px ${color}` }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -70, y: 30 }} animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.8, bounce: 0.3 }}>
        <span className="flex items-center gap-3" aria-label={isTruth ? t('games.truthdare.truth', 'Wahrheit') : t('games.truthdare.dare', 'Pflicht')}>
          <Icon style={{ width: lu(4.5), height: lu(4.5), color }} />
        </span>
        <p className="font-black leading-tight" style={{ fontSize: task.length > 70 ? tvType.title : tvType.display }}>{task}</p>
      </motion.div>
      {showTimer && <motion.div variants={riseIn(reduced)}><TVTimerRing timeLeft={timeLeft} total={maxTime} size={14} /></motion.div>}
    </motion.div>
  );
}

/** Abstimmung: Aufgabe klein, Summe Ja/Nein gross — nie einzelne Stimmen. */
export function VoteScene({ task, yes, no }: { task: string; yes: number; no: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const total = yes + no;
  const bar = (label: string, count: number, color: string) => (
    <motion.div variants={riseIn(reduced)} className="flex items-center gap-[1.4vw]">
      <span className="font-bold" style={{ fontSize: tvType.title, minWidth: '4ch' }}>{label}</span>
      <div className="h-[5vh] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full w-full origin-left rounded-full" style={{ background: `linear-gradient(to right, ${color}aa, ${color})`, boxShadow: `0 0 30px -6px ${color}` }}
          animate={{ scaleX: total > 0 ? Math.max(0.04, count / total) : 0.04 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }} />
      </div>
      <motion.span key={count} className="text-right font-black tabular-nums" style={{ fontSize: tvType.display, minWidth: '2ch' }}
        initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.45, bounce: 0.4 }}>{count}</motion.span>
    </motion.div>
  );
  return (
    <motion.div className="flex w-full max-w-[52vw] flex-col gap-[3vh]" variants={staggerChildren(110)} initial="initial" animate="animate">
      <motion.h1 variants={riseIn(reduced)} className="text-center font-black" style={{ fontSize: tvType.display }}>{t('tvCinema.truthdare.voteHeadline', 'Geschafft?')}</motion.h1>
      {task && <motion.p variants={riseIn(reduced)} className="text-center font-bold leading-tight" style={{ fontSize: tvType.title, color: TS.dim }}>{task}</motion.p>}
      {bar(t('games.truthdare.yes', 'Ja'), yes, TS.good)}
      {bar(t('games.truthdare.no', 'Nein'), no, TS.bad)}
    </motion.div>
  );
}
