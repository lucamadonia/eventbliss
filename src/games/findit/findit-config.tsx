/** WO IST WAS — shared types, modes and setup config. */
import { Eye, Zap, GitCompare, MapPin, Camera } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { GameMode, SettingsConfig } from '../ui/GameSetup';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Phase = 'setup' | 'karteSetup' | 'streetviewPlay' | 'study' | 'question' | 'answer' | 'roundEnd' | 'gameOver';
export type Mode = 'memory' | 'speed' | 'unterschiede' | 'karte' | 'streetview';

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  fastestMs: number;
}

// ---------------------------------------------------------------------------
// Scenes Data (16 scenes)
// ---------------------------------------------------------------------------

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

export function getColor(i: number) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }

// ---------------------------------------------------------------------------
// Game Modes Config
// ---------------------------------------------------------------------------

export function getGameModes(t: TFunction): GameMode[] {
  return [
    { id: 'memory', name: t('woIstWas.modes.memory', 'Memory'), desc: t('woIstWas.modes.memoryDesc', 'Merke dir die Szene und beantworte Fragen'), icon: <Eye className="w-6 h-6" /> },
    { id: 'speed', name: t('woIstWas.modes.speed', 'Speed'), desc: t('woIstWas.modes.speedDesc', 'Wer findet es am schnellsten?'), icon: <Zap className="w-6 h-6" /> },
    { id: 'unterschiede', name: t('woIstWas.modes.differences', 'Unterschiede'), desc: t('woIstWas.modes.differencesDesc', 'Finde 3 Unterschiede in zwei Bildern'), icon: <GitCompare className="w-6 h-6" /> },
    { id: 'karte', name: t('woIstWas.modes.map', 'Karte'), desc: t('woIstWas.modes.mapDesc', 'Finde Städte und Länder auf der Weltkarte'), icon: <MapPin className="w-6 h-6" /> },
    { id: 'streetview', name: t('woIstWas.modes.streetview', 'Street View'), desc: t('woIstWas.modes.streetviewDesc', 'Wo bist du? Rate den Standort!'), icon: <Camera className="w-6 h-6" /> },
  ];
}

export function getSetupSettings(t: TFunction): SettingsConfig {
  return {
    timer: { min: 5, max: 60, default: 10, step: 1, label: t('woIstWas.settings.time', 'Zeit (Sek.)') },
    rounds: { min: 3, max: 15, default: 8, step: 1, label: t('woIstWas.settings.rounds', 'Runden') },
  };
}
