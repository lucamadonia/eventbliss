import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { WORLD_FINDER_REGION_ASSETS } from '../ui/premium-game-assets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorldFinderSetupProps {
  onStart: (settings: { region: string; difficulty: number; rounds: number; timer: number }) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Region cards data
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorldFinderSetup({ onStart, onBack }: WorldFinderSetupProps) {
  const { t } = useTranslation();
  const [region, setRegion] = useState('welt');
  const [difficulty, setDifficulty] = useState(1);
  const [rounds, setRounds] = useState(10);
  const [timer, setTimer] = useState(30);

  const REGIONS = [
    { id: 'welt', label: t('games.findit.wfsRegionWelt') },
    { id: 'europa', label: t('games.findit.wfsRegionEuropa') },
    { id: 'asien', label: t('games.findit.wfsRegionAsien') },
    { id: 'deutschland', label: t('games.findit.wfsRegionDach') },
  ];

  const ROUND_OPTIONS = [
    { value: 5, label: t('games.findit.wfsRoundShortTrip'), sub: t('games.findit.wfsRounds5') },
    { value: 10, label: t('games.findit.wfsRoundAdventure'), sub: t('games.findit.wfsRounds10') },
    { value: 15, label: t('games.findit.wfsRoundWorldTrip'), sub: t('games.findit.wfsRounds15') },
  ];

  const DIFF_LABELS = [t('games.findit.wfsDiffEasy'), t('games.findit.wfsDiffNormal'), t('games.findit.wfsDiffHard')];
  const DIFF_SUB = [t('games.findit.wfsDiffSubCapitals'), t('games.findit.wfsDiffSubKnown'), t('games.findit.wfsDiffSubInsider')];

  const TIMER_OPTIONS = [
    { value: 15, label: '15s', desc: t('games.findit.timerBlitz') },
    { value: 30, label: '30s', desc: t('games.findit.timerNormal') },
    { value: 60, label: '60s', desc: t('games.findit.timerRelaxed') },
    { value: 120, label: '120s', desc: t('games.findit.timerExplorer') },
  ];

  return (
    <div
      className="relative min-h-screen overflow-y-auto pb-28"
      style={{ background: '#0a0e14', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Decorative glow blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#df8eff]/15 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[360px] w-[360px] rounded-full bg-[#8ff5ff]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-5 pt-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#151a21] text-gray-400 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-[#df8eff]" />
            <h1 className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 bg-clip-text text-2xl font-black tracking-tight text-transparent">
              World Finder
            </h1>
          </div>
        </motion.div>

        {/* ── REGION SECTION ─────────────────────────────── */}
        <motion.section custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionHeader color="#df8eff" title={t('games.findit.wfsRegionLabel')} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {REGIONS.map((r) => {
              const active = region === r.id;
              return (
                <PremiumImageChoiceCard
                  key={r.id}
                  title={r.label}
                  image={WORLD_FINDER_REGION_ASSETS[r.id]}
                  selected={active}
                  onClick={() => setRegion(r.id)}
                  accent="#df8eff"
                  badge={active ? t('games.findit.wfsActivated') : undefined}
                />
              );
            })}
          </div>
        </motion.section>

        {/* ── DIFFICULTY SECTION ──────────────────────────── */}
        <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="mt-8">
          <SectionHeader color="#8ff5ff" title={t('games.findit.wfsDifficultyLabel')} />
          <div className="mt-4 rounded-xl bg-[#151a21] p-6">
            {/* Labels */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{t('games.findit.wfsDiffLevel1')}</span>
              <span>{t('games.findit.wfsDiffLevel3')}</span>
            </div>
            {/* Slider */}
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="difficulty-slider w-full"
            />
            {/* Center badge */}
            <div className="mt-4 flex flex-col items-center gap-1">
              <span className="inline-block rounded-full bg-[#8ff5ff]/10 px-4 py-1.5 text-sm font-bold text-[#8ff5ff]">
                {DIFF_LABELS[difficulty]}
              </span>
              <span className="text-[11px] text-gray-500">{DIFF_SUB[difficulty]}</span>
            </div>
          </div>
        </motion.section>

        {/* ── ROUNDS SECTION ──────────────────────────────── */}
        <motion.section custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="mt-8">
          <SectionHeader color="#ff6b98" title={t('games.findit.wfsRoundsLabel')} />
          <div className="mt-4 flex flex-col gap-3">
            {ROUND_OPTIONS.map((opt) => {
              const active = rounds === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRounds(opt.value)}
                  className={cn(
                    'flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-200',
                    active
                      ? 'border-2 border-[#ff6b98] bg-[#ff6b98]/10 shadow-[0_0_20px_rgba(255,107,152,0.2)]'
                      : 'border border-[#1e242d] bg-[#151a21] hover:border-[#ff6b98]/40',
                  )}
                >
                  <span className={cn(
                    'text-3xl font-black tabular-nums',
                    active ? 'text-[#ff6b98]' : 'text-gray-500',
                  )}>
                    {String(opt.value).padStart(2, '0')}
                  </span>
                  <div className="text-left">
                    <p className={cn('text-sm font-bold', active ? 'text-white' : 'text-gray-400')}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-gray-600">{opt.sub}</p>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="round-check"
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6b98]"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.section>
        {/* ZEIT PRO RUNDE */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={4} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-[#8ff5ff]" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#a8abb3]">{t('games.findit.wfsTimePerRound')}</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIMER_OPTIONS.map(opt => {
              const active = timer === opt.value;
              return (
                <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                  onClick={() => setTimer(opt.value)}
                  className={cn('flex flex-col items-center gap-1 rounded-xl py-3 transition-all border',
                    active ? 'border-[#8ff5ff]/40 bg-[#8ff5ff]/10' : 'border-transparent bg-[#151a21]')}>
                  <span className={cn('text-xl font-black italic', active ? 'text-[#8ff5ff]' : 'text-gray-400')}>{opt.label}</span>
                  <span className="text-[10px] text-gray-500">{opt.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* ── START BUTTON (fixed) ──────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/95 to-transparent px-5 pb-5 pt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStart({ region, difficulty, rounds, timer })}
          className={cn(
            'relative w-full rounded-2xl py-4 text-xl font-black uppercase tracking-[0.1em] text-white',
            'bg-gradient-to-r from-[#df8eff] to-[#d779ff]',
            'shadow-[0_20px_50px_rgba(223,142,255,0.3)]',
            'transition-transform',
          )}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/10"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">{t('games.findit.wfsStartBtn')}</span>
        </motion.button>
      </div>

      {/* Custom slider styles */}
      <style>{`
        .difficulty-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #1e242d 0%, #8ff5ff40 50%, #1e242d 100%);
          outline: none;
        }
        .difficulty-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #8ff5ff;
          box-shadow: 0 0 16px rgba(143, 245, 255, 0.5), 0 0 4px rgba(143, 245, 255, 0.8);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .difficulty-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 24px rgba(143, 245, 255, 0.7), 0 0 6px rgba(143, 245, 255, 1);
        }
        .difficulty-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #8ff5ff;
          box-shadow: 0 0 16px rgba(143, 245, 255, 0.5);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

function SectionHeader({ color, title }: { color: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-1 rounded-full" style={{ backgroundColor: color }} />
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
    </div>
  );
}
