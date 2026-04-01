import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import type { Achievement } from './types';
import { RARITY_COLORS, RARITY_LABELS } from './types';

interface AchievementToastProps {
  achievements: Achievement[];
  onDismiss?: () => void;
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    if (achievements.length > 0) {
      setQueue((prev) => [...prev, ...achievements]);
    }
  }, [achievements]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      setCurrent(null);
      if (queue.length === 0) onDismiss?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [current, queue, onDismiss]);

  if (!current) return null;

  const rarityColor = RARITY_COLORS[current.rarity] ?? RARITY_COLORS.common;
  const rarityLabel = RARITY_LABELS[current.rarity] ?? '';

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed top-4 left-1/2 z-[100] w-[90vw] max-w-sm"
          style={{ x: '-50%' }}
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div
            className="relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4"
            style={{
              background: 'rgba(21, 26, 33, 0.92)',
              borderColor: `${rarityColor}40`,
              boxShadow: `0 0 30px ${rarityColor}25, 0 0 60px ${rarityColor}10`,
            }}
          >
            {/* Neon pulse line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />

            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: `${rarityColor}15`,
                  boxShadow: `0 0 20px ${rarityColor}20`,
                }}
              >
                {current.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" style={{ color: rarityColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: rarityColor }}>
                    Achievement freigeschaltet
                  </span>
                </div>
                <p className="text-white font-bold text-sm truncate mt-0.5">
                  {current.name}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {current.description}
                </p>
              </div>

              {/* Rarity badge */}
              <div
                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                style={{
                  color: rarityColor,
                  background: `${rarityColor}15`,
                  border: `1px solid ${rarityColor}30`,
                }}
              >
                {rarityLabel}
              </div>
            </div>

            {/* Points */}
            <div className="mt-2 flex justify-end">
              <span className="text-[10px] font-semibold" style={{ color: rarityColor }}>
                +{current.points} Punkte
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
