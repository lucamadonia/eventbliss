import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, Palette, Ban, Gauge, Target } from 'lucide-react';
import { StageHeader } from '../ui/GameStage';
import { PlayerSetup } from '../ui/PlayerSetup';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { WORDPRESS_MODE_ASSETS } from '../ui/premium-game-assets';
import type { GameMode, PlayerState, Speed } from './wordpress-types';

// ---------------------------------------------------------------------------
// Setup Screen
// ---------------------------------------------------------------------------

interface SetupProps {
  onStart: (players: PlayerState[], mode: GameMode, speed: Speed, rounds: number) => void;
  onlinePlayerNames?: string[];
  locked?: boolean;
}

export function SetupScreen({ onStart, onlinePlayerNames = [], locked = false }: SetupProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<string[]>(
    onlinePlayerNames.length >= 2 ? onlinePlayerNames : [t('games.wordpress.defaultPlayer1'), t('games.wordpress.defaultPlayer2')]
  );
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [rounds, setRounds] = useState(5);

  const modes: { key: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'kategorie', label: t('gameModes.wordpress.kategorie.name'), desc: t('gameModes.wordpress.kategorie.desc'), icon: <Target className="w-5 h-5" /> },
    { key: 'stroop', label: t('gameModes.wordpress.stroop.name'), desc: t('gameModes.wordpress.stroop.desc'), icon: <Palette className="w-5 h-5" /> },
    { key: 'verboten', label: t('gameModes.wordpress.verboten.name'), desc: t('gameModes.wordpress.verboten.desc'), icon: <Ban className="w-5 h-5" /> },
    { key: 'speed-rush', label: t('gameModes.wordpress.speed-rush.name'), desc: t('gameModes.wordpress.speed-rush.desc'), icon: <Gauge className="w-5 h-5" /> },
  ];

  const canStart = players.length >= 1 && players.every(p => p.trim().length > 0);

  const isOnlineOrParty = onlinePlayerNames.length >= 2;
  const handleImportNames = (imported: string[]) => {
    setPlayers(() => {
      const merged = imported.slice(0, 8);
      while (merged.length < 1) merged.push('');
      return merged;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    const ps: PlayerState[] = players.map(name => ({
      name: name.trim(), score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, missed: 0,
    }));
    onStart(ps, mode, speed, rounds);
  };

  return (
    <motion.div className="min-h-0 bg-transparent p-0 flex flex-col items-center relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <motion.div className="w-full max-w-3xl space-y-7 py-3 relative z-10"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>

        {/* Header */}
        <StageHeader title={t('games.wordpress.title')} subtitle={t('games.wordpress.tagline')} />

        {/* Players */}
        <PlayerSetup locked={locked}
          players={players.map((name, i) => ({ id: String(i), name }))}
          onAdd={() => setPlayers([...players, ''])}
          onRemove={(id) => setPlayers(players.filter((_, idx) => idx !== Number(id)))}
          onRename={(id, name) => { const next = [...players]; next[Number(id)] = name; setPlayers(next); }}
          onImportNames={isOnlineOrParty ? undefined : handleImportNames}
          min={1}
          max={8}
          accent="#d5f46a"
          label={t('games.wordpress.playerLabel')}
        />

        {/* Mode */}
        <div className=" bg-white/5 border border-[#d5f46a]/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.modeHeading')}</h2>
          <div className="!grid grid-cols-2 gap-3">
            {modes.map(m => (
              <PremiumImageChoiceCard
                key={m.key}
                title={m.label}
                subtitle={m.desc}
                image={WORDPRESS_MODE_ASSETS[m.key]}
                selected={mode === m.key}
                onClick={() => setMode(m.key)}
                accent="#d5f46a"
              />
            ))}
          </div>
        </div>

        {/* Speed & Rounds */}
        <div className=" bg-white/5 border border-[#d5f46a]/20 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-lg">{t('games.wordpress.settingsHeading')}</h2>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-2">{t('games.wordpress.speedLabel')}</label>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast'] as Speed[]).map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    speed === s
                      ? 'bg-[#d5f46a] text-white'
                      : 'bg-white/10 text-[#a8abb3] hover:bg-white/15'
                  }`}>
                  {s === 'slow' ? t('games.wordpress.speedSlow') : s === 'medium' ? t('games.wordpress.speedMedium') : t('games.wordpress.speedFast')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#f1f3fc]/70 text-sm block mb-1">{t('games.wordpress.roundsLabel', { count: rounds })}</label>
            <input type="range" min={3} max={15} step={1} value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-[#20262f] accent-[#d5f46a] cursor-pointer" />
          </div>
        </div>

        {/* Start */}
        <motion.button onClick={handleStart} disabled={!canStart}
          aria-label={t('games.wordpress.startAriaLabel')}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canStart
              ? 'bg-[#d5f46a] text-white  '
              : 'bg-[#1b2028] text-[#b5bdbe] cursor-not-allowed'
          }`}
          whileHover={canStart ? { scale: 1.02 } : {}}
          whileTap={canStart ? { scale: 0.98 } : {}}>
          <Zap className="w-5 h-5" /> {t('games.setup.startGame')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

