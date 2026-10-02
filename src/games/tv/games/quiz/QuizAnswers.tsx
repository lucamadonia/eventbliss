import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { partyEase, readableOn } from '@/lib/party-motion';
import { lu } from '../../components/tv-lobby-scale';
import { staggerChildren, riseIn } from '../../cinema/scene';
import { QZ } from './quiz-model';

// Satte, dunkle Kachelfarben: weisse Schrift bleibt ueberall >= 4.5:1 (readableOn waehlt Weiss).
const TILES = [
  { color: '#c81e45', shape: '▲' },
  { color: '#2152d8', shape: '◆' },
  { color: '#047857', shape: '●' },
  { color: '#c2410c', shape: '■' },
];
/** Fakt oder Fake klassisch: Wahr = gruen ✓, Falsch = rot ✗. */
export const TRUE_FALSE_TILES = [
  { color: '#047857', shape: '✓' },
  { color: '#be123c', shape: '✗' },
];

/**
 * Antwortkacheln (Kahoot-Raster). Bis zur Aufloesung neutral; erst wenn die
 * Bruecke `correctAnswer >= 0` liefert (nur in der Aufloesung), leuchtet die
 * richtige Kachel auf und die anderen treten zurueck.
 */
export function AnswerGrid({ answers, correct, tiles = TILES }: { answers: string[]; correct: number; tiles?: { color: string; shape: string }[] }) {
  const reduced = !!useReducedMotion();
  const revealed = correct >= 0;
  return (
    <motion.div className="grid w-full max-w-[78vw] grid-cols-2 gap-[1.6vw]" variants={staggerChildren(90)} initial="initial" animate="animate">
      {answers.map((a, i) => {
        const tile = tiles[i % tiles.length];
        const isCorrect = revealed && i === correct;
        const isWrong = revealed && i !== correct;
        const ink = readableOn(tile.color);
        return (
          <motion.div key={i} variants={riseIn(reduced)} data-testid={`tv-quiz-answer-${i}`} data-correct={String(isCorrect)}
            className="relative flex items-center gap-[1.4vw] overflow-hidden rounded-[28px] px-[2vw]"
            style={{
              minHeight: lu(11),
              background: `linear-gradient(135deg, ${tile.color}, ${tile.color}cc)`,
              boxShadow: isCorrect ? `0 0 0 3px #ffffff, 0 0 60px -6px ${tile.color}` : `0 10px 30px -12px ${tile.color}88, inset 0 1px 0 rgba(255,255,255,0.22)`,
              opacity: isWrong ? 0.3 : 1,
              filter: isWrong ? 'saturate(0.35)' : 'none',
              transform: isCorrect && !reduced ? 'scale(1.03)' : 'scale(1)',
              transition: 'opacity 500ms ease, filter 500ms ease, transform 500ms cubic-bezier(.2,.8,.2,1), box-shadow 500ms ease',
            }}>
            <span aria-hidden className="font-black" style={{ fontSize: lu(4.2), color: ink, opacity: 0.75 }}>{tile.shape}</span>
            <span className="flex-1 font-black leading-tight" style={{ fontSize: lu(3.8), color: ink }}>{a}</span>
            {isCorrect && (
              <motion.span className="grid place-items-center rounded-full" style={{ width: lu(6), height: lu(6), background: '#ffffff', color: tile.color }}
                initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.55, bounce: 0.5, delay: 0.25 }}>
                <Check strokeWidth={4} style={{ width: '60%', height: '60%' }} />
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/** Fakt-oder-Fake „Zwei Luegen“: drei nummerierte Aussagen, die wahre leuchtet erst in der Aufloesung. */
export function StatementList({ statements, correct }: { statements: string[]; correct: number }) {
  const reduced = !!useReducedMotion();
  const revealed = correct >= 0;
  return (
    <motion.div className="flex w-full max-w-[70vw] flex-col gap-[1.6vh]" variants={staggerChildren(120)} initial="initial" animate="animate">
      {statements.map((s, i) => {
        const isTrue = revealed && i === correct;
        const isFalse = revealed && i !== correct;
        return (
          <motion.div key={i} variants={riseIn(reduced)} data-testid={`tv-quiz-statement-${i}`}
            className="flex items-center gap-[1.4vw] rounded-[28px] px-[2vw] py-[2vh]"
            style={{
              background: isTrue ? `linear-gradient(135deg, ${QZ.green}33, #0d0915 80%)` : '#0d0915',
              border: `2px solid ${isTrue ? QZ.green : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isTrue ? `0 0 50px -8px ${QZ.green}` : 'inset 0 1px 0 rgba(255,255,255,0.06)',
              opacity: isFalse ? 0.4 : 1,
              transition: 'opacity 500ms ease, border-color 500ms ease, box-shadow 500ms ease',
            }}>
            <span className="grid shrink-0 place-items-center rounded-full font-black"
              style={{ width: lu(6), height: lu(6), fontSize: lu(3), background: isTrue ? QZ.green : `${QZ.purple}33`, color: isTrue ? readableOn(QZ.green) : QZ.text }}>
              {isTrue ? <Check strokeWidth={4} style={{ width: '55%', height: '55%' }} /> : i + 1}
            </span>
            <span className="font-bold leading-snug" style={{ fontSize: lu(3.4), color: QZ.text }}>{s}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/** Frage als Hauptzeile — kommt pro Frage weich aus der Tiefe. */
export function QuestionHeadline({ text }: { text: string }) {
  const reduced = !!useReducedMotion();
  return (
    <motion.h1 key={text} data-testid="tv-quiz-question" className="max-w-[80vw] text-balance text-center font-black leading-[1.12]"
      style={{ fontSize: lu(5.6), color: QZ.text, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: partyEase.out }}>
      {text}
    </motion.h1>
  );
}
