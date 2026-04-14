/**
 * GameTitleBar — persistent, unified game title with filigree "?" help button.
 * Rendered by GamesHub for ALL games at the same position.
 */
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const GAME_NAMES: Record<string, string> = {
  bomb: 'Tickende Bombe',
  headup: 'Stirnraten',
  taboo: 'Wortverbot',
  category: 'Zeit-Kategorie',
  hochstapler: 'Hochstapler',
  'drueck-das-wort': 'Drück das Wort',
  'wo-ist-was': 'Wo ist was?',
  'split-quiz': 'Split Quiz',
  'geteilt-gequizzt': 'Geteilt & Gequizzt',
  schnellzeichner: 'Schnellzeichner',
  'wahrheit-pflicht': 'Wahrheit oder Pflicht',
  'this-or-that': 'This or That',
  'wer-bin-ich': 'Wer bin ich?',
  'emoji-raten': 'Emoji-Raten',
  'fake-or-fact': 'Fake or Fact',
  'story-builder': 'Story Builder',
  flaschendrehen: 'Flaschendrehen',
};

const GAME_ICONS: Record<string, string> = {
  bomb: '💣', taboo: '🚫', headup: '🧠', category: '⏱️',
  hochstapler: '🎭', 'drueck-das-wort': '🔤', 'wo-ist-was': '🗺️',
  'split-quiz': '🧩', 'geteilt-gequizzt': '🔗', schnellzeichner: '🎨',
  'wahrheit-pflicht': '❤️', 'this-or-that': '↔️', 'wer-bin-ich': '❓',
  'emoji-raten': '😀', 'fake-or-fact': '🎲', 'story-builder': '📖',
  flaschendrehen: '🍾',
};

interface GameTitleBarProps {
  gameId: string;
  onHelpClick: () => void;
}

export function GameTitleBar({ gameId, onHelpClick }: GameTitleBarProps) {
  const name = GAME_NAMES[gameId] || gameId;
  const icon = GAME_ICONS[gameId] || '🎮';

  return (
    <motion.div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/[0.08]">
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-semibold text-white/70 font-game tracking-tight">
          {name}
        </span>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); onHelpClick(); }}
          className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-colors ml-0.5"
          title="Spielregeln"
        >
          <HelpCircle className="w-3.5 h-3.5 text-white/30" />
        </motion.button>
      </div>
    </motion.div>
  );
}
