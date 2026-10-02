import { Clock, Zap, Crown } from 'lucide-react';
import type { GameMode } from '../ui/GameSetup';

export const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: '30 Sek. pro Runde', icon: <Clock className="w-6 h-6" /> },
  { id: 'speed', name: 'Speed', desc: '10 Sek. pro Runde', icon: <Zap className="w-6 h-6" /> },
  { id: 'team', name: 'Team', desc: 'Teams wechseln sich ab', icon: <Crown className="w-6 h-6" /> },
];
