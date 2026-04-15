import React from 'react';
import { motion } from 'framer-motion';
import { Bomb, Plus, Trash2, User, Users, Zap, Brain, Timer, Hash, Wine, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GameState, GameMode } from './BombGame';

interface SetupScreenProps {
  state: GameState;
  onUpdate: (partial: Partial<GameState>) => void;
  onStart: () => void;
}

const modes: { key: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'kategorie', label: 'Kategorie', desc: 'Nenne etwas aus einer Kategorie', icon: <Brain className="w-4 h-4" /> },
  { key: 'quiz', label: 'Quiz', desc: 'Multiple-Choice Fragen', icon: <Zap className="w-4 h-4" /> },
  { key: 'speed', label: 'Speed', desc: 'Timer wird jede Runde kuerzer', icon: <Timer className="w-4 h-4" /> },
  { key: 'alle', label: 'Alle antworten', desc: 'Jeder muss eine Antwort geben!', icon: <Users className="w-4 h-4" /> },
];

const AVATAR_COLORS = [
  'from-[#cf96ff] to-[#8b5cf6]',
  'from-[#00e3fd] to-[#0ea5e9]',
  'from-[#ff7350] to-[#f43f5e]',
  'from-[#fbbf24] to-[#f97316]',
  'from-[#34d399] to-[#10b981]',
  'from-[#f472b6] to-[#ec4899]',
  'from-[#60a5fa] to-[#3b82f6]',
  'from-[#a78bfa] to-[#7c3aed]',
];

export default function BombSetupScreen({ state, onUpdate, onStart }: SetupScreenProps) {
  const canStart = state.players.length >= 2 && state.players.every((p) => p.name.trim().length > 0);

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
            Tickende Bombe
          </h1>
          <p className="text-white/50 text-sm max-w-[280px] mx-auto">
            Schaffst du es, die Bombe rechtzeitig weiterzugeben?
          </p>
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
            <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Spielmodus</h2>
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
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">Runden</h2>
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
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">Timer</h2>
                {state.randomTimer ? (
                  <span className="text-[#ff7350] text-sm font-bold">??? Random</span>
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
                {state.randomTimer ? 'Random aktiv (15–90s)' : 'Random Timer aktivieren'}
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
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">Kategorie</h2>
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
                {state.sameCategory ? 'Gleiche Kategorie pro Runde' : 'Wechselnde Kategorien'}
              </button>
              <p className="text-white/20 text-[10px] mt-2 text-center">
                {state.sameCategory ? 'Alle Spieler beantworten die gleiche Kategorie' : 'Jeder Spieler bekommt eine neue Kategorie'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Spieler Section */}
        <motion.div
          className="mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
            Spieler ({state.players.length})
          </h2>
          <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {state.players.map((p, i) => (
              <motion.div
                key={i}
                className="relative group"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * i }}
              >
                <div className={`p-[2px] rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  <div className="bg-[#1f1f29] rounded-[14px] p-3 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <Input
                      value={p.name}
                      onChange={(e) => setName(i, e.target.value)}
                      placeholder={`Spieler ${i + 1}`}
                      className="bg-[#13131b] border-0 text-white text-center text-base placeholder:text-white/30 h-8 rounded-lg"
                      maxLength={12}
                    />
                  </div>
                </div>
                {state.players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#ff6e84] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add Player Card */}
            {state.players.length < 20 && (
              <motion.button
                onClick={addPlayer}
                className="rounded-2xl border-2 border-dashed border-white/10 hover:border-[#cf96ff]/40 p-3 flex flex-col items-center justify-center gap-2 transition-colors min-h-[120px]"
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white/30" />
                </div>
                <span className="text-white/30 text-xs">Hinzufuegen</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-[#0d0d15] via-[#0d0d15]/95 to-transparent">
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
            SPIEL STARTEN
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
