import { motion } from 'framer-motion';
import { Check, Minus, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PartyWaiting, SecretName } from './party-ui';
import type { CharacterView } from './party-seats';

interface Seat { id: string; name: string; avatar: string; color: string }
export type Answer = 'yes' | 'no' | 'maybe';

const ANSWERS: { id: Answer; Icon: typeof Check; tone: string }[] = [
  { id: 'yes', Icon: Check, tone: 'emerald' },
  { id: 'no', Icon: X, tone: 'red' },
  { id: 'maybe', Icon: Minus, tone: 'amber' },
];
const TONES: Record<string, { box: string; text: string }> = {
  emerald: { box: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
  red: { box: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
  amber: { box: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400' },
};

/**
 * Antwortrunde: alle ausser dem Fragenden antworten nacheinander. Online
 * erinnert eine Zeile an die Figur des Fragenden (nie fuer ihn selbst).
 */
export function AnswerVotePanel({ online, asker, voter, voterCount, voterIdx, question, askerView, canVote, onAnswer }: {
  online: boolean; asker: Seat; voter: Seat; voterCount: number; voterIdx: number; question: string;
  askerView: CharacterView; canVote: boolean; onAnswer: (a: Answer) => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="answerVote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="identity-phase relative flex-1 flex flex-col items-center justify-center gap-5 px-4" data-testid="whoami-answer" data-player-id={voter.id}>
      {online && <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${voter.color}2e 0%, transparent 60%)` }} />}
      <div className="relative text-white/40 text-sm">{t('games.whoami.answerVote.asks', { name: asker.name })}</div>
      <div className="relative w-full max-w-sm rounded-2xl bg-[#1b2028] border border-[#44484f]/20 p-5 text-center">
        <p className="text-lg font-bold text-white">"{question}"</p>
        {online && askerView.kind !== 'hidden' && (
          <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[0.8125rem] font-semibold text-white/60">
            {t('games.whoami.party.askerIs', '{{name}} ist', { name: asker.name })}
            <SecretName view={askerView} color={asker.color} className="text-base font-extrabold text-white" testId="whoami-asker-character" />
          </p>
        )}
      </div>
      <div className="relative flex items-center gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: voter.color }}>{voter.avatar}</div>
        <span className="text-white/60">{t('games.whoami.answerVote.answers', { name: voter.name })}</span>
      </div>
      {online && !canVote ? <div className="relative w-full max-w-sm"><PartyWaiting seat={voter} text={t('games.whoami.party.waitingAnswer', '{{name}} antwortet …', { name: voter.name })} /></div> : (
        <div className="relative flex gap-3">
          {ANSWERS.map(({ id, Icon, tone }) => (
            <motion.button key={id} data-testid={`whoami-answer-${id}`} whileTap={{ scale: 0.9 }} disabled={!canVote} onClick={() => onAnswer(id)}
              className={cn('w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1', TONES[tone].box)}>
              <Icon className={cn('w-7 h-7', TONES[tone].text)} />
              <span className={cn('text-xs font-bold', TONES[tone].text)}>{t(`games.whoami.answerVote.${id}`)}</span>
            </motion.button>
          ))}
        </div>
      )}
      <div className="relative flex gap-1" aria-hidden>
        {Array.from({ length: voterCount }, (_, i) => (
          <div key={i} className={cn('w-2 h-2 rounded-full', i < voterIdx ? 'bg-[#ef987e]' : i === voterIdx ? 'bg-white' : 'bg-white/10')} />
        ))}
      </div>
    </motion.div>
  );
}

/** Raten: nur der Fragende tippt seinen Tipp. */
export function GuessingPanel({ online, active, canAct, guess, onGuessText, onGuess }: {
  online: boolean; active: Seat; canAct: boolean; guess: string; onGuessText: (g: string) => void; onGuess: () => void;
}) {
  const { t } = useTranslation();
  const ready = !!guess.trim() && canAct;
  return (
    <motion.div key="guessing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="identity-phase flex-1 flex flex-col items-center justify-center gap-5 px-4" data-testid="whoami-guessing" data-player-id={active.id}>
      <Sparkles className="w-8 h-8 text-amber-400" />
      <h2 className="text-xl font-extrabold">{t('games.whoami.guessing.playerGuesses', { name: active.name })}</h2>
      {online && !canAct ? <div className="w-full max-w-sm"><PartyWaiting seat={active} text={t('games.whoami.party.waitingGuess', '{{name}} rät jetzt …', { name: active.name })} /></div> : <>
        <input data-testid="whoami-guess-input" type="text" maxLength={100} value={guess} onChange={(e) => onGuessText(e.target.value)} placeholder={t('games.whoami.guessing.placeholder')}
          className="w-full max-w-sm bg-[#1b2028] border border-[#ef987e]/20 rounded-2xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#ef987e]/50" />
        <motion.button data-testid="whoami-guess-submit" whileTap={{ scale: 0.97 }} disabled={!ready} onClick={onGuess}
          className={cn('w-full max-w-sm py-4 rounded-2xl h-14 font-extrabold', ready ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0e14] shadow-[0_0_20px_rgba(150,160,165,0.3)]' : 'bg-white/5 text-white/20 cursor-not-allowed')}>
          {t('games.whoami.guessing.guess')}
        </motion.button>
      </>}
    </motion.div>
  );
}
