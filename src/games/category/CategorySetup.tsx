import { useState, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, Play, Type, Zap } from 'lucide-react';
import { PlayerSetup } from '../ui/PlayerSetup';
import { MODE_TIMERS, seatPlayers, type CategoryPlayer, type GameMode } from './category-rules';

const MODE_ICONS: Record<GameMode, ElementType> = { classic: Clock, rapid: Zap, letter: Type };

export function CategorySetup({
  onStart,
  onlinePlayerNames = [],
  locked = false,
}: {
  onStart: (players: CategoryPlayer[], mode: GameMode, rounds: number, timer: number) => void;
  onlinePlayerNames?: string[];
  locked?: boolean;
}) {
  const { t } = useTranslation();
  const [names, setNames] = useState<string[]>(onlinePlayerNames.length >= 2 ? onlinePlayerNames : ['', '']);
  const [mode, setMode] = useState<GameMode>('classic');
  const [rounds, setRounds] = useState(5);
  const [timerVal, setTimerVal] = useState(MODE_TIMERS.classic);

  const handleModeChange = (next: GameMode) => {
    setMode(next);
    setTimerVal(MODE_TIMERS[next]);
  };
  const addPlayer = () => setNames(prev => [...prev, '']);
  const removePlayer = (i: number) => setNames(prev => prev.filter((_, idx) => idx !== i));
  const updateName = (i: number, v: string) => setNames(prev => prev.map((n, idx) => (idx === i ? v : n)));
  const isOnlineOrParty = onlinePlayerNames.length >= 2;
  const handleImportNames = (imported: string[]) => {
    const next = imported.slice(0, 15);
    while (next.length < 2) next.push('');
    setNames(next);
  };
  const filled = names.map(n => n.trim()).filter(Boolean);
  const canStart = filled.length >= 2;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-4">
      <PlayerSetup locked={locked}
        players={names.map((name, i) => ({ id: String(i), name, avatar: undefined }))}
        onAdd={addPlayer}
        onRemove={id => removePlayer(Number(id))}
        onRename={(id, name) => updateName(Number(id), name)}
        onImportNames={isOnlineOrParty ? undefined : handleImportNames}
        min={2}
        max={15}
        accent="#f2bc66"
        label={t('games.setup.players')}
      />

      <div className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-5 space-y-4">
        <h2 className="text-base font-extrabold font-sans text-white">{t('games.category.gameMode')}</h2>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(MODE_TIMERS) as GameMode[]).map(m => {
            const Icon = MODE_ICONS[m];
            const active = mode === m;
            return (
              <button key={m} onClick={() => handleModeChange(m)} aria-pressed={active}
                className={`flex items-center gap-3 rounded-[1rem] border p-4 text-left transition-all relative overflow-hidden ${
                  active ? 'border-[#f2bc66]/40 bg-[#f2bc66]/[0.08] ' : 'border-[#44484f]/20 bg-[#151a21] hover:border-white/10'
                }`}>
                {active && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2bc66] to-transparent" />}
                <div className={`flex h-10 w-10 items-center justify-center rounded-[0.75rem] ${active ? 'bg-[#f2bc66]/15' : 'bg-white/[0.04]'}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-[#f2bc66]' : 'text-white/60'}`} />
                </div>
                <div>
                  <span className={`font-semibold ${active ? 'text-[#f2bc66]' : 'text-white/70'}`}>{t(`gameModes.category.${m}.name`)}</span>
                  <p className="text-xs text-white/60">{t(`gameModes.category.${m}.desc`)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="!grid grid-cols-2 gap-3">
        <SettingSlider label={t('games.setup.timer')} value={`${timerVal}s`} min={5} max={60} step={5} current={timerVal} onChange={setTimerVal} />
        <SettingSlider label={t('games.setup.rounds')} value={String(rounds)} min={1} max={15} step={1} current={rounds} onChange={setRounds} />
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-[var(--stage-bg)] py-4 z-20">
        <div className="max-w-lg mx-auto">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={!canStart}
            onClick={() => onStart(seatPlayers(filled.map(name => ({ name }))), mode, rounds, timerVal)}
            className="w-full rounded-full bg-[#f2bc66] py-4 text-base font-extrabold font-sans text-[#101513] uppercase tracking-wide  transition-opacity disabled:opacity-30 flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            {t('games.setup.startGame')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function SettingSlider({ label, value, min, max, step, current, onChange }: { label: string; value: string; min: number; max: number; step: number; current: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/65 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-[#f2bc66] tabular-nums">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={current} aria-label={label}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-[#f2bc66] h-1.5" />
    </div>
  );
}
