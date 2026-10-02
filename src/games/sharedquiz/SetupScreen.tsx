/**
 * Einstellungen von GETEILT GEQUIZZT — aus SharedQuizGame.tsx ausgelagert
 * (Dateigroesse), Darstellung unveraendert.
 */
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Play, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerSetup } from '../ui/PlayerSetup';
import { hasShellBackButton } from '@/games/ui/shell-back';

type Mode = 'trio' | 'chain' | 'allornothing';
interface Player { id: string; name: string; color: string; score: number }

export function SetupPanel({ players, locked, onAdd, onRemove, onRename, onImportNames, modes, mode, onMode, totalRounds, onRounds, onStart, onBack }: {
  players: Player[]; locked: boolean; onAdd: () => void; onRemove: (id: string) => void; onRename: (id: string, name: string) => void;
  onImportNames?: (names: string[]) => void; modes: { id: Mode; name: string; desc: string; icon: React.ReactNode }[];
  mode: Mode; onMode: (m: Mode) => void; totalRounds: number; onRounds: (n: number) => void; onStart: () => void; onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="flex-1 flex flex-col px-4 py-8 pb-32 max-w-3xl mx-auto w-full">
    {/* Header */}
    <div className="text-left mb-8 border-b border-white/15 pb-7">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1rem] bg-[#1b2028] border border-[#8ff5ff]/20 mb-4">
        <Users className="w-8 h-8 text-[#8ff5ff]" />
      </div>
      <h1 className="text-3xl font-extrabold font-sans bg-gradient-to-r from-[#8ff5ff] to-[#8ff5ff]/60 bg-clip-text text-transparent">
        {t('games.sharedquiz.title')}
      </h1>
      <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
        {t('games.sharedquiz.subtitle')}
      </p>
    </div>

    {/* Players */}
    <div className="mb-6">
      <PlayerSetup locked={locked}
        players={players.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
        onAdd={onAdd}
        onRemove={onRemove}
        onRename={onRename}
        onImportNames={onImportNames}
        min={3}
        max={10}
        accent="#8ff5ff"
        label={t('games.sharedquiz.playerLabel')}
      />
    </div>

    {/* Mode */}
    <section className="space-y-3 mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">{t('games.sharedquiz.modeLabel')}</h2>
      <div className="space-y-2">
        {modes.map(m => (
          <button key={m.id} onClick={() => onMode(m.id)}
            className={cn('w-full flex items-center gap-3 p-4 rounded-[1rem] border-2 transition-colors text-left',
              mode === m.id ? 'border-[#8ff5ff] bg-[#8ff5ff]/10 text-white' : 'border-gray-700 bg-[#1b2028] text-gray-300 hover:border-gray-600')}>
            <span className="text-[#8ff5ff]">{m.icon}</span>
            <div><div className="text-sm font-semibold">{m.name}</div><div className="text-xs text-white/40">{m.desc}</div></div>
          </button>
        ))}
      </div>
    </section>

    {/* Rounds */}
    <section className="mb-6">
      <div className="bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/40">{t('games.setup.rounds')}</span>
          <span className="text-white font-bold">{totalRounds}</span>
        </div>
        <input type="range" min={3} max={20} step={1} value={totalRounds}
          onChange={e => onRounds(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-[#8ff5ff] cursor-pointer" />
      </div>
    </section>

    {/* Start */}
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
      <div className="max-w-lg mx-auto space-y-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onStart}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] text-base font-extrabold font-sans uppercase tracking-wide shadow-[0_0_20px_rgba(143,245,255,0.3)] flex items-center justify-center gap-2">
          <Play className="w-5 h-5" /> {t('games.setup.startGame')}
        </motion.button>
        {/* Nur im Web. In der App macht das der FloatingBackButton. */}
        {!hasShellBackButton() && (
          <button onClick={onBack} className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition">{t('games.sharedquiz.back')}</button>
        )}
      </div>
    </div>
  </motion.div>
  );
}
