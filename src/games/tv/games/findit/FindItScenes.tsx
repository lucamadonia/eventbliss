import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, MapPin } from 'lucide-react';
import { partyEase, readableOn } from '@/lib/party-motion';
import { tvPanel, tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { ObjectBoard, ObjectPicture } from '../../../findit/VisualObjects';
import { parseObjectGrid } from '../../../findit/visual-content';

export const FI = { primary: '#22d3ee', secondary: '#a78bfa', amber: '#fbbf24', good: '#34d399', bad: '#fb7185', text: '#eef6f8', dim: '#9fb4bd', bg: '#07111a' };

// Dunkle, satte Toene: weisse Schrift >= 4.5:1.
const TILE = ['#c81e45', '#2152d8', '#a16207', '#047857', '#7e22ce', '#c2410c'];
const SHAPE = ['▲', '◆', '●', '■', '★', '⬢'];

/** Das Spielbrett im Rahmen — gleiche Bilder wie am Handy. */
export function Board({ grid, maxH = '52vh' }: { grid: string; maxH?: string }) {
  return (
    <div className="rounded-[28px] p-[0.8vw]" style={{ width: `min(${maxH}, 46vw)`, background: 'rgba(255,255,255,0.04)', boxShadow: `0 30px 80px -30px ${FI.primary}66` }}>
      <ObjectBoard grid={parseObjectGrid(grid)} />
    </div>
  );
}

/**
 * Antwortkacheln zum Mitraten. Die richtige Option kennt die Bruecke erst in
 * der Aufloesung (`correctOption` sonst null) — vorher bleiben alle neutral.
 */
export function OptionTiles({ options, objects, correct }: { options: string[]; objects: string[]; correct: number | null }) {
  const reduced = !!useReducedMotion();
  const revealed = correct !== null && correct >= 0;
  return (
    <motion.div className="grid w-full max-w-[72vw] gap-[1.4vw]" style={{ gridTemplateColumns: options.length <= 2 ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}
      variants={staggerChildren(80)} initial="initial" animate="animate">
      {options.map((opt, i) => {
        const color = TILE[i % TILE.length];
        const ink = readableOn(color);
        const isCorrect = revealed && correct === i;
        const isWrong = revealed && correct !== i;
        return (
          <motion.div key={i} variants={riseIn(reduced)} data-testid={`tv-findit-option-${i}`} data-correct={String(isCorrect)}
            className="flex items-center gap-[1.2vw] rounded-[24px] px-[1.4vw] py-[1.2vh]"
            style={{
              minHeight: lu(10), background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              boxShadow: isCorrect ? `0 0 0 3px #ffffff, 0 0 50px -6px ${color}` : `0 10px 30px -14px ${color}`,
              opacity: isWrong ? 0.3 : 1, filter: isWrong ? 'saturate(0.35)' : 'none',
              transform: isCorrect && !reduced ? 'scale(1.03)' : 'scale(1)',
              transition: 'opacity 500ms ease, filter 500ms ease, transform 500ms cubic-bezier(.2,.8,.2,1), box-shadow 500ms ease',
            }}>
            {objects[i]
              ? <span className="shrink-0 overflow-hidden rounded-[14px]" style={{ width: lu(8) }}><ObjectPicture id={objects[i]} label={opt} /></span>
              : <span aria-hidden className="font-black" style={{ fontSize: lu(4), color: ink, opacity: 0.75 }}>{SHAPE[i % SHAPE.length]}</span>}
            <span className="flex-1 font-black" style={{ fontSize: lu(3.6), color: ink }}>{opt}</span>
            {isCorrect && (
              <motion.span className="grid place-items-center rounded-full" style={{ width: lu(5.4), height: lu(5.4), background: '#fff', color }}
                initial={reduced ? { opacity: 0 } : { scale: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.5, delay: 0.2 }}>
                <Check strokeWidth={4} style={{ width: '60%', height: '60%' }} />
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/** Unterschiede: beide Bretter nebeneinander; Zielringe erst in der Aufloesung. */
export function DiffBoards({ gridA, gridB, diffs, found, count }: { gridA: string; gridB: string; diffs: number[]; found: number[]; count: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-center gap-[2.4vh]">
      <h1 className="font-black" style={{ fontSize: lu(5.2), color: FI.text }}>
        {t('tvCinema.findIt.spotDiffs', 'Findet die Unterschiede')}
        <span className="ms-4 tabular-nums" style={{ color: FI.primary }}>{found.length}/{count}</span>
      </h1>
      <div className="grid grid-cols-2 gap-[2vw]" style={{ width: 'min(118vh, 76vw)' }}>
        <ObjectBoard grid={parseObjectGrid(gridA)} label="A" />
        <ObjectBoard grid={parseObjectGrid(gridB)} label="B" found={found} targets={diffs} />
      </div>
    </div>
  );
}

/** Karte / Street View: grosse Ortsfrage; der Ort selbst erst zum Rundenende. */
export function GeoScene({ mode, geoName, showAnswer, ambient }: { mode: string; geoName: string; showAnswer: boolean; ambient: boolean }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <div className={`${tvPanel} relative flex flex-col items-center gap-[3vh] overflow-hidden px-[6vw] py-[6vh] text-center`}>
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 30%, ${showAnswer ? FI.amber : FI.primary}22, transparent 65%)` }} />
      <motion.span className="relative grid place-items-center rounded-full" style={{ width: lu(16), height: lu(16), background: `${showAnswer ? FI.amber : FI.primary}1f` }}
        initial={showAnswer && !reduced ? { y: -80, opacity: 0 } : false}
        animate={ambient && !showAnswer ? { y: [0, -12, 0], opacity: 1 } : { y: 0, opacity: 1 }}
        transition={ambient && !showAnswer ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { type: 'spring', duration: 0.6, bounce: 0.5 }}>
        <MapPin aria-hidden style={{ width: '55%', height: '55%', color: showAnswer ? FI.amber : FI.primary }} />
      </motion.span>
      {showAnswer && geoName ? (
        <motion.div className="relative flex flex-col items-center gap-2" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: partyEase.out, delay: 0.25 }}>
          <span className="font-bold" style={{ fontSize: tvType.label, color: FI.dim }}>{t('tvCinema.findIt.itWas', 'Gesucht war')}</span>
          <h1 className="font-black" style={{ fontSize: tvType.hero, color: '#ffffff', textShadow: `0 0 50px ${FI.amber}99` }}>{geoName}</h1>
        </motion.div>
      ) : (
        <div className="relative flex flex-col items-center gap-[1.4vh]">
          <h1 className="font-black" style={{ fontSize: tvType.display, color: FI.text }}>
            {mode === 'streetview' ? t('tvCinema.findIt.whichCity', 'Welche Stadt ist das?') : t('tvCinema.findIt.whereIsIt', 'Wo liegt das?')}
          </h1>
          <span className="font-semibold" style={{ fontSize: tvType.body, color: FI.dim }}>{t('tvCinema.findIt.tapOnPhone', 'Tippt eure Antwort aufs Handy')}</span>
        </div>
      )}
    </div>
  );
}
