import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { tvPanel, tvType } from '../../tv-tokens';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { OW } from './OhrwurmHero';

/**
 * Timeline der aktiven Person (neueste Jahre oben). Ab sieben Karten wird sie
 * zweispaltig, damit sie nie aus ihrem Feld laeuft. Nur Jahre bereits
 * gewonnener Karten — der laufende Song steht als „?“ ganz oben.
 */
export default function OhrwurmTimeline({ timeline, activeName }: { timeline: { id: string; year: number }[]; activeName: string }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const sorted = [...timeline].sort((a, b) => b.year - a.year);
  const compact = sorted.length > 6;
  const itemCls = `font-black tabular-nums text-center ${compact ? 'rounded-xl px-2 py-[0.8vh]' : 'rounded-2xl px-4 py-[1.2vh]'}`;
  const fs = compact ? tvType.label : tvType.body;
  return (
    <div className={`${tvPanel} flex min-h-0 flex-col overflow-hidden p-[1.6vw]`}>
      <span className="mb-[1.4vh] shrink-0 truncate font-semibold" style={{ fontSize: tvType.label, color: OW.dim }}>
        {activeName ? t('tvCinema.ohrwurm.timelineOf', 'Timeline von {{name}}', { name: activeName }) : t('tv.ohrwurm.timeline', 'Timeline')}
      </span>
      <div className="min-h-0 flex-1 overflow-hidden">
        <motion.div key={activeName} className={`grid gap-[0.8vh] ${compact ? 'grid-cols-2 gap-x-[0.6vw]' : 'grid-cols-1'}`}
          variants={staggerChildren(50)} initial="initial" animate="animate">
          <motion.div variants={riseIn(reduced)} className={itemCls}
            style={{ fontSize: fs, color: OW.primary, background: `${OW.primary}1a`, border: `2px dashed ${OW.primary}` }}>?</motion.div>
          {sorted.map((s) => (
            <motion.div key={s.id} variants={riseIn(reduced)} className={itemCls}
              style={{ fontSize: fs, color: OW.text, background: '#1b1430', border: '1px solid rgba(255,255,255,0.08)' }}>{s.year}</motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
