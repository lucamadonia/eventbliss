import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PartyWaiting, SecretName } from './party-ui';
import type { CharacterView } from './party-seats';

interface Seat { id: string; name: string; avatar: string; color: string; questionsAsked: number }

/**
 * Fragerunde („Heads-up“-Zettel). Lokal haelt der Fragende das Handy an die
 * Stirn; online zeigt jedes Handy die Figur des Fragenden — ausser ihm selbst
 * (`view`), auch am geteilten Host-Handy.
 */
export function AskingPanel({ online, active, view, canAct, round, totalRounds, modeLabel, maxQ, hasVotes, voteSummary, question, onQuestion, onSubmit, onGuess, onSkip, onSolved }: {
  online: boolean; active: Seat; view: CharacterView; canAct: boolean;
  round: number; totalRounds: number; modeLabel: string; maxQ: number;
  hasVotes: boolean; voteSummary: { yes: number; no: number };
  question: string; onQuestion: (q: string) => void;
  onSubmit: () => void; onGuess: () => void; onSkip: () => void; onSolved: () => void;
}) {
  const { t } = useTranslation();
  const own = online && canAct;
  return (
    <motion.div key="asking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-between px-6 py-8 relative" data-testid="whoami-asking" data-player-id={active.id}>
      {online && <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${active.color}2e 0%, transparent 60%)` }} />}
      <div className="relative w-full max-w-sm flex items-center justify-between text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#a8abb3]">{t('games.whoami.round', { round, total: totalRounds })}</span>
          <span className="text-[#ef987e] font-black text-sm mt-0.5">{modeLabel}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#a8abb3]">
            {online && !own ? t('games.whoami.party.isAsking', 'fragt gerade') : t('games.whoami.asking.yourTurn')}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: active.color }}>{active.avatar}</div>
            <span className="text-white font-bold text-sm truncate max-w-[100px]">{active.name}</span>
          </div>
        </div>
      </div>

      <div className="identity-live relative w-full max-w-sm aspect-square" style={{ perspective: '1000px' }}>
        <motion.div initial={{ rotate: -6, opacity: 0, y: 20 }} animate={{ rotate: -2, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="relative h-full w-full">
          <div className="absolute inset-0 bg-[#e4cec0]/20 rounded-2xl blur-2xl" />
          <div className="relative h-full w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ background: 'rgba(32, 38, 47, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(143, 245, 255, 0.3)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-[#e4cec0] rounded-b-full shadow-[0_4px_14px_rgba(143,245,255,0.6)]" />
            <span className="text-[#00deec] font-bold tracking-[0.2em] text-[11px] uppercase mb-4">
              {online && !own ? t('games.whoami.party.theirIdentity', '{{name}} ist …', { name: active.name }) : t('games.whoami.asking.yourIdentity')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white break-words px-2">
              <SecretName view={view} color={active.color} testId="whoami-active-character" />
            </h1>
            <div className="h-1 w-24 mt-6 rounded-full bg-gradient-to-r from-transparent via-[#e4cec0] to-transparent opacity-60" />
          </div>
        </motion.div>
      </div>

      <div className="relative text-center space-y-1 my-2">
        <p className="text-[#a8abb3] font-medium text-sm">{own ? t('games.whoami.party.askAloud', 'Stell eine Ja/Nein-Frage über dich.') : t('games.whoami.asking.visibleToOthers')}</p>
        <p className="text-[#72757d] text-xs">{online ? t('games.whoami.asking.controllerHint', { defaultValue: 'Ask a question or make a guess on your phone.' }) : t('games.whoami.asking.holdPhone')}</p>
      </div>

      <div className="identity-console relative w-full max-w-sm space-y-3">
        <p className="text-center text-purple-200 tabular-nums">{active.questionsAsked} / {maxQ}</p>
        {hasVotes && <p role="status" className="text-center">{t('games.whoami.voteSummary', { yes: voteSummary.yes, no: voteSummary.no })}</p>}
        {online && !canAct ? <PartyWaiting seat={active} text={t('games.whoami.party.waitingQuestion', '{{name}} überlegt sich eine Frage …', { name: active.name })} /> : <>
          <input data-testid="whoami-question" aria-label={t('games.whoami.questionLabel')} maxLength={200} value={question} onChange={e => onQuestion(e.target.value)} placeholder={t('games.whoami.questionLabel')} className="w-full p-4 rounded-xl bg-white/10 border border-white/20" />
          <div className="flex gap-3">
            <button data-testid="whoami-send-question" className="flex-1 p-3 rounded-xl bg-purple-700 disabled:opacity-40" disabled={!question.trim()} onClick={onSubmit}>{t('games.whoami.sendQuestion')}</button>
            <button data-testid="whoami-guess-now" className="flex-1 p-3 rounded-xl bg-cyan-800 disabled:opacity-40" onClick={onGuess}>{t('games.whoami.guessNow')}</button>
          </div>
        </>}
      </div>
      <div className="relative w-full max-w-sm grid grid-cols-2 gap-3">
        <motion.button whileTap={{ scale: 0.95 }} disabled={online && !canAct} onClick={onSkip}
          className="h-14 rounded-full bg-[#0f141a] border border-[#44484f]/60 flex items-center justify-center gap-2 font-black tracking-[0.15em] uppercase text-[#a8abb3] hover:bg-[#20262f] transition-colors">
          <ArrowRight className="w-4 h-4" />{t('games.whoami.asking.skip')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} disabled={online} onClick={onSolved}
          className="h-14 rounded-full flex items-center justify-center gap-2 font-black tracking-[0.15em] uppercase text-[#003f43] shadow-[0_0_25px_rgba(143,245,255,0.4)] transition-all"
          style={{ background: 'linear-gradient(135deg, #e4cec0, #00eefc)' }}>
          <Check className="w-4 h-4" />{t('games.whoami.asking.solved')}
        </motion.button>
      </div>
    </motion.div>
  );
}
