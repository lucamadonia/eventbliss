import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorldFinderSetupProps {
  onStart: (settings: { region: string; difficulty: number; rounds: number }) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Region cards data
// ---------------------------------------------------------------------------

const REGIONS = [
  { id: 'welt', label: 'Weltweit', icon: '\u{1F30D}', gradient: 'from-[#df8eff]/30 via-[#0a0e14] to-[#8ff5ff]/20' },
  { id: 'europa', label: 'Europa', icon: '\u{1F3F0}', gradient: 'from-[#ff6b98]/20 to-[#151a21]' },
  { id: 'asien', label: 'Asien', icon: '\u{1F3EF}', gradient: 'from-[#8ff5ff]/20 to-[#151a21]' },
  { id: 'deutschland', label: 'DACH', icon: '\u{1F3DB}\uFE0F', gradient: 'from-[#fbbf24]/20 to-[#151a21]' },
] as const;

const ROUND_OPTIONS = [
  { value: 5, label: 'Kurzer Trip', sub: '5 Runden' },
  { value: 10, label: 'Abenteuer', sub: '10 Runden' },
  { value: 15, label: 'Weltreise', sub: '15 Runden' },
] as const;

const DIFF_LABELS = ['Leicht', 'Normalmodus', 'Schwer'] as const;
const DIFF_SUB = ['Hauptstaedte', 'Bekannte Orte', 'Insider-Tipps'] as const;

// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorldFinderSetup({ onStart, onBack }: WorldFinderSetupProps) {
  const [region, setRegion] = useState('welt');
  const [difficulty, setDifficulty] = useState(1);
  const [rounds, setRounds] = useState(10);

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
          <SectionHeader color="#df8eff" title="REGION WAEHLEN" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {REGIONS.map((r) => {
              const active = region === r.id;
              return (
                <motion.button
                  key={r.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRegion(r.id)}
                  className={cn(
                    'relative aspect-[4/5] rounded-xl overflow-hidden transition-all duration-300',
                    'bg-gradient-to-br', r.gradient,
                    active
                      ? 'ring-2 ring-[#df8eff] shadow-[0_0_24px_rgba(223,142,255,0.35)]'
                      : 'grayscale hover:grayscale-0 opacity-60 hover:opacity-100',
                  )}
                >
                  {/* Icon */}
                  <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80 select-none">
                    {r.icon}
                  </span>
                  {/* Bottom label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/80 to-transparent px-2 pb-3 pt-8">
                    <p className="text-sm font-bold text-white">{r.label}</p>
                    {active && (
                      <span className="mt-1 inline-block rounded-full bg-[#df8eff]/20 px-2 py-0.5 text-[10px] font-semibold text-[#df8eff]">
                        Aktiviert
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ── DIFFICULTY SECTION ──────────────────────────── */}
        <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="mt-8">
          <SectionHeader color="#8ff5ff" title="SCHWIERIGKEIT" />
          <div className="mt-4 rounded-xl bg-[#151a21] p-6">
            {/* Labels */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Stufe 1</span>
              <span>Stufe 3</span>
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
          <SectionHeader color="#ff6b98" title="RUNDENANZAHL" />
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
      </div>

      {/* ── START BUTTON (fixed) ──────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/95 to-transparent px-5 pb-5 pt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStart({ region, difficulty, rounds })}
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
          <span className="relative z-10">SPIEL STARTEN</span>
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
