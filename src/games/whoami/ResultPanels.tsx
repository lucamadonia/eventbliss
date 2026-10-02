import { avatarOrFallback } from '@/games/multiplayer/seat-avatar';
import { SeatAvatar } from '@/components/native/party/PartySheet';
import type { ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Play, RotateCcw, Sparkles, Star, Trophy, X } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { SecretName } from './party-ui';
import { solveBonus, type CharacterView } from './party-seats';

interface Seat { id: string; name: string; avatar: string; color: string; score: number; character: string; questionsAsked: number; guessedCorrectly: boolean }

const NEXT_STYLE = { background: 'linear-gradient(90deg, #ef987e, #d779ff)' };

/** Ergebnis eines Tipps: Jubel bei richtig, knappe Rueckmeldung sonst. */
export function GuessResultPanel({ active, correct, view, revealed, modeLabel, maxQ, canNext, onNext }: {
  active: Seat; correct: boolean; view: CharacterView; revealed: boolean; modeLabel: string; maxQ: number; canNext: boolean; onNext: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="guessResult" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full" data-testid="whoami-result" data-correct={correct}>
      {correct ? (
        <div className="space-y-6">
          <div className="text-center space-y-3 relative">
            <div className="absolute -top-8 inset-x-0 flex justify-between px-4 opacity-60 pointer-events-none">
              <motion.div initial={{ rotate: 45, y: -5 }} animate={{ rotate: 60, y: 5 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}><Sparkles className="w-6 h-6 text-[#ff6b98]" /></motion.div>
              <motion.div initial={{ rotate: -12, y: 0 }} animate={{ rotate: 12, y: -8 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.4 }}><Star className="w-8 h-8 text-[#ef987e]" style={{ filter: 'drop-shadow(0 0 8px #ef987e)' }} /></motion.div>
              <motion.div initial={{ rotate: 180, y: 4 }} animate={{ rotate: 200, y: -4 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2 }}><Sparkles className="w-6 h-6 text-[#e4cec0]" /></motion.div>
            </div>
            <p className="text-[#ff6b98] font-bold text-sm">{t('games.whoami.result.congrats')}</p>
            <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
              className="text-4xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-[0_0_15px_rgba(150,160,165,0.5)]">{t('games.whoami.result.correct')}</motion.h2>
          </div>
          <div className="rounded-2xl p-8 border border-[#ef987e]/15 relative overflow-hidden" style={{ background: 'rgba(32, 38, 47, 0.45)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-15 pointer-events-none"><HelpCircle className="w-24 h-24 text-[#ef987e]" /></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-36 h-36 rounded-full p-1 shadow-[0_0_40px_rgba(150,160,165,0.3)]" style={{ background: `linear-gradient(135deg, ${active.color}, #ff6b98)` }}>
                <div className="w-full h-full rounded-full bg-[#20262f] border-4 border-[#0a0e14] flex items-center justify-center text-5xl font-black text-white">{active.avatar}</div>
              </div>
              <div>
                <h3 className="text-3xl font-black"><SecretName view={view} color={active.color} testId="whoami-result-character" /></h3>
                <p className="text-[#a8abb3] font-medium text-sm mt-1">{t('games.whoami.result.category', { category: modeLabel })}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<HelpCircle className="w-5 h-5 text-[#e4cec0]" />} label={t('games.whoami.result.questionsNeeded')} value={active.questionsAsked + 1} />
            <Stat icon={<Star className="w-5 h-5 text-[#ef987e]" />} label={t('games.whoami.result.points')} value={active.score} />
          </div>
          <div className="rounded-2xl p-5 border border-[#ef987e]/20 flex justify-between items-center" style={{ background: 'linear-gradient(90deg, rgba(187,0,88,0.15), rgba(215,121,255,0.15))' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0a0e14] flex items-center justify-center shadow-lg"><Trophy className="w-6 h-6 text-[#ff6b98]" /></div>
              <div>
                <p className="text-lg font-extrabold text-white">{t('games.whoami.result.pointsEarned', { count: solveBonus(active.questionsAsked, maxQ) })}</p>
                <p className="text-xs text-[#a8abb3]">{t('games.whoami.result.roundReward')}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <motion.button data-testid="whoami-result-next" whileTap={{ scale: 0.97 }} disabled={!canNext} onClick={onNext} style={NEXT_STYLE}
              className="w-full h-14 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 text-[#0a0e14] shadow-[0_12px_24px_-8px_rgba(150,160,165,0.4)]">
              <Play className="w-5 h-5" />{t('games.whoami.result.nextPlayer')}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-[60vh]">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <div className="w-24 h-24 rounded-2xl bg-[#ff6e84]/15 border border-[#ff6e84]/30 flex items-center justify-center"><X className="w-12 h-12 text-[#ff6e84]" /></div>
          </motion.div>
          <h2 className="text-2xl font-extrabold text-[#ff6e84]">{revealed ? t('games.whoami.result.skipped') : t('games.whoami.result.tryAgain', { defaultValue: 'Not quite — try again.' })}</h2>
          {revealed && view.kind !== 'hidden' && <div className="text-[#a8abb3] text-sm text-center">
            <Trans i18nKey="games.whoami.result.wasCharacter" values={{ name: active.name, character: view.text }} components={{ 1: <strong className="font-bold text-white" /> }} />
          </div>}
          <motion.button data-testid="whoami-result-next" whileTap={{ scale: 0.97 }} disabled={!canNext} onClick={onNext} style={NEXT_STYLE}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full h-14 font-extrabold text-[#0a0e14] shadow-[0_0_20px_rgba(150,160,165,0.3)]">
            {t('games.whoami.assign.next')} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-[#0f141a] rounded-2xl p-4 flex items-center gap-3 border border-[#44484f]/20">
      <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[0.8125rem] font-semibold text-[#a8abb3]">{label}</p>
        <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/** Endstand: jetzt (und nur jetzt) sind alle Figuren aufgedeckt. */
export function GameOverPanel({ players, achievements, onDismissAchievements, canAgain, onAgain, onOtherGame }: {
  players: Seat[]; achievements: ComponentProps<typeof GameEndOverlay>['achievements']; onDismissAchievements: () => void;
  canAgain: boolean; onAgain: () => void; onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  if (!top) return null;
  return (
    <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full" data-testid="whoami-game-over">
      <GameEndOverlay achievements={achievements} onDismiss={onDismissAchievements} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20"><Trophy className="w-8 h-8 text-amber-400" /></div>
      </motion.div>
      <h2 className="text-3xl font-extrabold text-[#ef987e] neon-glow">{t('games.whoami.gameOver.title')}</h2>
      <div className="text-lg font-bold text-[#ef987e]">{t('games.whoami.gameOver.winner', { name: players.filter(p => p.score === top.score).map(p => p.name).join(' & ') })}</div>
      <div className="w-full space-y-2 max-h-64 overflow-y-auto">
        {sorted.map((p, i) => (
          <div key={p.id} className={cn('flex items-center gap-3 bg-[#1b2028] border rounded-2xl px-4 py-3', p.guessedCorrectly ? 'border-emerald-500/20' : 'border-[#44484f]/20')}>
            <span className="text-white/60 text-sm font-bold w-5">#{i + 1}</span>
            <SeatAvatar avatar={avatarOrFallback(p.avatar, p.id)} color={p.color} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-white/80 font-semibold truncate">{p.name}</div>
              <div className="text-sm text-white/60">{p.character} {p.guessedCorrectly ? t('games.whoami.gameOver.guessed') : t('games.whoami.gameOver.notGuessed')}</div>
            </div>
            <span className="text-[#ef987e] font-bold tabular-nums">{t('games.whoami.gameOver.pts', { score: p.score })}</span>
          </div>
        ))}
      </div>
      <div className="w-full space-y-3 mt-2">
        <motion.button whileTap={{ scale: 0.97 }} disabled={!canAgain} onClick={onAgain}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ef987e] to-[#d779ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_20px_rgba(150,160,165,0.3)]">
          <RotateCcw className="w-4 h-4" /> {t('games.whoami.gameOver.playAgain')}
        </motion.button>
        {!hasShellBackButton() && (
          <button onClick={onOtherGame} className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
            {t('games.whoami.gameOver.anotherGame')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
