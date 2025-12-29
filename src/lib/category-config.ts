// Activity category configuration with colors and icons
export type ActivityCategory = 
  | 'activity' 
  | 'food' 
  | 'transport' 
  | 'accommodation' 
  | 'party' 
  | 'sightseeing' 
  | 'relaxation' 
  | 'other';

export interface CategoryConfig {
  key: ActivityCategory;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const CATEGORY_CONFIG: Record<ActivityCategory, CategoryConfig> = {
  activity: {
    key: 'activity',
    emoji: '🎯',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
  },
  food: {
    key: 'food',
    emoji: '🍽️',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
  },
  transport: {
    key: 'transport',
    emoji: '🚗',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
  },
  accommodation: {
    key: 'accommodation',
    emoji: '🏨',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
  },
  party: {
    key: 'party',
    emoji: '🎉',
    colorClass: 'text-pink-500',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/30',
  },
  sightseeing: {
    key: 'sightseeing',
    emoji: '🏛️',
    colorClass: 'text-teal-500',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
  },
  relaxation: {
    key: 'relaxation',
    emoji: '🧘',
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
  },
  other: {
    key: 'other',
    emoji: '📌',
    colorClass: 'text-gray-500',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/30',
  },
};

export const CATEGORY_KEYS: ActivityCategory[] = [
  'activity',
  'food',
  'transport',
  'accommodation',
  'party',
  'sightseeing',
  'relaxation',
  'other',
];
