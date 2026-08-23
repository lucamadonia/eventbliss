import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bomb, Users, Zap, Brain, Timer, Hash, Shuffle } from 'lucide-react';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { GameState, GameMode } from './BombGame';

interface SetupScreenProps {
  state: GameState;
  onUpdate: (partial: Partial<GameState>) => void;
  onStart: () => void;
}

export default function BombSetupScreen({ state, onUpdate, onStart }: SetupScreenProps) {
  const { t } = useTranslation();
  const canStart = state.players.length >= 2 && state.players.every((p) => p.name.trim().length > 0);

  const modes: { key: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'kategorie', label: t('gameModes.bomb.kategorie.name'), desc: t('gameModes.bomb.kategorie.desc'), icon: <Brain className="w-4 h-4" /> },
    { key: 'quiz', label: t('gameModes.bomb.quiz.name'), desc: t('gameModes.bomb.quiz.desc'), icon: <Zap className="w-4 h-4" /> },
    { key: 'speed', label: t('gameModes.bomb.speed.name'), desc: t('gameModes.bomb.speed.desc'), icon: <Timer className="w-4 h-4" /> },
    { key: 'alle', label: t('gameModes.bomb.alle.name'), desc: t('gameModes.bomb.alle.desc'), icon: <Users className="w-4 h-4" /> },
  ];

  const addPlayer = () => {
    if (state.players.length >= 20) return;
    onUpdate({ players: [...state.players, { name: '', penalties: 0 }] });
  };

  const removePlayer = (i: number) => {
    if (state.players.length <= 2) return;
    onUpdate({ players: state.players.filter((_, idx) => idx !== i) });
  };

  const setName = (i: number, name: string) => {
    const next = [...state.players];
    next[i] = { ...next[i], name };
    onUpdate({ players: next });
  };

  const importNames = (names: string[]) => {
    // Replace entire roster with imported names; drop all existing (incl. placeholders)
    const fresh: { name: string; penalties: number }[] = [];
    for (const n of names) { if (fresh.length >= 20) break; fresh.push({ name: n, penalties: 0 }); }
    while (fresh.length < 2) fresh.push({ name: '', penalties: 0 });
    onUpdate({ players: fresh });
  };

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d15] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background auras */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ff7350]/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#cf96ff]/[0.05] blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-28 pt-8">
        {/* Hero Header */}
        <motion.div
          className="text-center space-y-3 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#ff7350] to-[#fc3c00] flex items-center justify-center shadow-lg shadow-[#ff7350]/20"
            animate={{ rotate: [0, -4, 4, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            <Bomb className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t('games.bomb.name')}
          </h1>
          <p className="text-white/50 text-sm max-w-[280px] mx-auto">
            {t('games.bomb.subtitle')}
          </p>
        </motion.div>

        {/* Spieler — einheitlicher Block, IMMER ganz oben (1. Sektion) */}
        <motion.div
          className="mb-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <PlayerSetup
            players={state.players.map((p, i) => ({ id: `b-${i}`, name: p.name }))}
            onAdd={addPlayer}
            onRemove={(id) => removePlayer(Number(id.slice(2)))}
            onRename={(id, name) => setName(Number(id.slice(2)), name)}
            onImportNames={importNames}
            min={2}
            max={20}
            accent="#cf96ff"
            maxNameLength={12}
          />
        </motion.div>

        {/* Bento Grid Config */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Spielmodus Card */}
          <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06]">
            <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">{t('games.bomb.labelMode')}</h2>
            <div className="flex gap-2">
              {modes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => onUpdate({ mode: m.key })}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                    state.mode === m.key
                      ? 'bg-[#cf96ff] text-white shadow-lg shadow-[#cf96ff]/20'
                      : 'bg-[#13131b] text-white/50 hover:bg-[#1a1a24] hover:text-white/70'
                  }`}
                >
                  {m.icon}
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Schwierigkeit + Runden row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Rundenanzahl */}
            <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">{t('games.bomb.labelRounds')}</h2>
                <span className="text-[#cf96ff] text-sm font-bold">{state.totalRounds}</span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={state.totalRounds}
                onChange={(e) => onUpdate({ totalRounds: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #cf96ff ${((state.totalRounds - 3) / 7) * 100}%, #13131b ${((state.totalRounds - 3) / 7) * 100}%)`,
                }}
              />
            </div>

            {/* Timer */}
            <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">{t('games.bomb.labelTimer')}</h2>
                {state.randomTimer ? (
                  <span className="text-[#ff7350] text-sm font-bold">{t('games.bomb.timerRandom')}</span>
                ) : (
                  <span className="text-[#00e3fd] text-sm font-bold">{state.timerMin}–{state.timerMax}s</span>
                )}
              </div>
              {/* Random toggle */}
              <button
                onClick={() => onUpdate({ randomTimer: !state.randomTimer })}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold mb-2 transition-all ${
                  state.randomTimer
                    ? 'bg-[#ff7350] text-white shadow-lg shadow-[#ff7350]/20'
                    : 'bg-[#13131b] text-white/40 hover:text-white/60'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                {state.randomTimer ? t('games.bomb.randomActive') : t('games.bomb.randomActivate')}
              </button>
              {/* Sliders only when not random */}
              {!state.randomTimer && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={5}
                    max={state.timerMax - 5}
                    value={state.timerMin}
                    onChange={(e) => onUpdate({ timerMin: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00e3fd ${((state.timerMin - 5) / (state.timerMax - 10)) * 100}%, #13131b ${((state.timerMin - 5) / (state.timerMax - 10)) * 100}%)`,
                    }}
                  />
                  <input
                    type="range"
                    min={state.timerMin + 5}
                    max={60}
                    value={state.timerMax}
                    onChange={(e) => onUpdate({ timerMax: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00e3fd ${((state.timerMax - state.timerMin - 5) / (55 - state.timerMin)) * 100}%, #13131b ${((state.timerMax - state.timerMin - 5) / (55 - state.timerMin)) * 100}%)`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Gleiche Kategorie Toggle — only for kategorie/alle modes */}
          {(state.mode === 'kategorie' || state.mode === 'alle') && (
            <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">{t('games.bomb.labelCategory')}</h2>
              </div>
              <button
                onClick={() => onUpdate({ sameCategory: !state.sameCategory })}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  state.sameCategory
                    ? 'bg-[#cf96ff] text-white shadow-lg shadow-[#cf96ff]/20'
                    : 'bg-[#13131b] text-white/40 hover:text-white/60'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                {state.sameCategory ? t('games.bomb.sameCategoryOn') : t('games.bomb.sameCategoryOff')}
              </button>
              <p className="text-white/20 text-[10px] mt-2 text-center">
                {state.sameCategory ? t('games.bomb.sameCategoryHintOn') : t('games.bomb.sameCategoryHintOff')}
              </p>
            </div>
          )}
        </motion.div>

      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0d0d15] via-[#0d0d15]/95 to-transparent">
        <div className="max-w-md mx-auto">
          <motion.button
            onClick={onStart}
            disabled={!canStart}
            className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #cf96ff 0%, #ff7350 100%)'
                : '#1f1f29',
              boxShadow: canStart
                ? '0 8px 32px rgba(207,150,255,0.25), 0 2px 8px rgba(255,115,80,0.2)'
                : 'none',
            }}
            whileTap={canStart ? { scale: 0.97 } : undefined}
          >
            <Bomb className="w-5 h-5" />
            {t('games.bomb.startGame')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
