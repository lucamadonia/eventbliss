import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import type { CategoryPlayer } from './category-rules';
import { CategoryAvatar, Label, Panel } from './CategoryStage';

export function GameOverScreen({ players, onPlayAgain, onRestart, canControl = true }: { players: CategoryPlayer[]; onPlayAgain: () => void; onRestart: () => void; canControl?: boolean }) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return <div className="flex min-h-[78dvh] flex-col gap-6">
    <section className="flex min-h-[32dvh] flex-col items-center justify-center gap-3 text-center">
      <Label>{t('games.category.finalResults')}</Label>
      {winner && <>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }}>
          <CategoryAvatar player={winner} size={112} active />
        </motion.div>
        <p className="font-game font-black leading-none break-words" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.5rem)' }}>{winner.name}</p>
        <p className="text-base font-semibold text-[#f2bc66] tabular-nums">{t('games.category.scorePoints', { score: winner.score })}</p>
      </>}
    </section>
    <Panel>
      <Label className="mb-2">{t('games.category.scoreboard')}</Label>
      <ol className="divide-y divide-white/[0.06]">{sorted.map((player, index) => <motion.li key={player.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * index }} className="flex items-center gap-3 py-4">
        <span className="w-5 text-sm tabular-nums text-white/50">{index + 1}</span>
        <CategoryAvatar player={player} size={40} active={index === 0} />
        <div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold">{player.name}</p><p className="mt-0.5 text-sm text-white/55">{t('games.category.roundsLost', { count: player.losses })}</p></div>
        <strong className="text-3xl tabular-nums text-[#f2bc66]">{player.score}</strong>
      </motion.li>)}</ol>
    </Panel>
    {canControl ? <div className="mt-auto flex flex-col gap-3">
      <button type="button" onClick={onPlayAgain} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f2bc66] px-6 text-base font-extrabold text-[#101513] transition active:scale-[0.97]"><RotateCcw className="h-5 w-5" />{t('games.category.playAgain')}</button>
      <button type="button" onClick={onRestart} className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/12 bg-[#16101f] px-5 font-semibold text-white/85 transition active:scale-[0.97]">{t('games.category.otherGame')}</button>
    </div> : <p className="mt-auto text-center text-sm text-white/60">{t('games.category.hostDecides', 'Der Host entscheidet, wie es weitergeht.')}</p>}
  </div>;
}
