/**
 * Bildschirme der lokalen Weitergabe-Variante (ein Handy, Trio ohne Online-Raum).
 * Aus SharedQuizGame.tsx ausgelagert, unveraendert.
 */
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Eye } from 'lucide-react';
import { StagePanel } from '../ui/GameStage';
import { getPlayerInitial } from '../ui/PlayerAvatars';

interface Player { id: string; name: string; color: string; score: number }


export function RoleBadge({ icon, label, player }: { icon: React.ReactNode; label: string; player: Player }) {
  return (
    <div className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] px-4 py-3">
      <span className="text-[#8ff5ff]">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
        <div className="font-bold text-white">{player.name}</div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{ backgroundColor: player.color }}>{getPlayerInitial(player.name)}</div>
    </div>
  );
}

export function PlayerScreen({ name, color, instruction, onNext, children }: {
  name: string; color: string; instruction: string; onNext: () => void; children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}>{getPlayerInitial(name)}</div>
        <span className="text-white font-bold text-lg">{name}</span>
      </div>
      <StagePanel tone="paper" className="knowledge-local-document w-full">{children}</StagePanel>
      <p className="text-[#8ff5ff] text-sm font-semibold">{instruction}</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onNext}
        className="flex items-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-3 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
        {t('games.play.next')} <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

export function HandoffScreen({ from, to, toColor, onContinue }: {
  from: string; to: string; toColor: string; onContinue: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="knowledge-handoff flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
        style={{ backgroundColor: toColor }}>{getPlayerInitial(to)}</motion.div>
      <p className="knowledge-from">{from}<ArrowRight size={18}/></p>
      <h2 className="text-2xl font-extrabold font-sans text-white text-center">
        {t('games.sharedquiz.handoffTo', { name: to })}
      </h2>
      <p className="text-white/40 text-sm">{t('games.sharedquiz.nopeek')}</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onContinue}
        className="mt-4 flex items-center gap-2 bg-[#1b2028] border border-[#44484f]/20 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-white/[0.06] transition-colors">
        <Eye className="w-5 h-5" /> {t('games.sharedquiz.ready')}
      </motion.button>
    </motion.div>
  );
}
