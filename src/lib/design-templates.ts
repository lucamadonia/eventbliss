// Design Templates für verschiedene Event-Typen
export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  /** i18n key for the localized template name; `name` is the German fallback. */
  nameKey: string;
  /** i18n key for the localized template description; `description` is the German fallback. */
  descriptionKey: string;
  icon: string;
  eventTypes: string[];
  branding: {
    primary_color: string;
    accent_color: string;
    background_style: 'gradient' | 'solid' | 'image' | 'dark';
    text_color?: string;
  };
  preview: {
    gradient?: string;
    pattern?: string;
  };
  // New fields for enhanced differentiation
  patternId: 'confetti' | 'rings' | 'waves' | 'stars' | 'diamonds' | 'dots' | 'stripes' | 'hearts' | 'bubbles' | 'none';
  backgroundIcons: string[];
  /** Optional cinematic hero image (public/images/form-templates/<id>.webp).
   *  When present, the guest-form hero renders it as a full cover behind a
   *  palette scrim; missing files fall back to the gradient via onError. */
  heroImage?: string;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'jga-classic',
    name: 'JGA Classic',
    description: 'Festlich & Party-ready mit lila-cyan Gradient',
    nameKey: 'designTemplates.jga-classic.name',
    descriptionKey: 'designTemplates.jga-classic.desc',
    icon: '🎉',
    eventTypes: ['bachelor', 'bachelorette'],
    branding: {
      primary_color: '#8B5CF6',
      accent_color: '#06B6D4',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    },
    patternId: 'confetti',
    backgroundIcons: ['🎉', '🥂', '🎊'],
    heroImage: '/images/form-templates/jga-classic.webp',
  },
  {
    id: 'wedding-elegant',
    name: 'Wedding Elegant',
    description: 'Klassisch-elegant mit Rose Gold Akzenten',
    nameKey: 'designTemplates.wedding-elegant.name',
    descriptionKey: 'designTemplates.wedding-elegant.desc',
    icon: '💍',
    eventTypes: ['bachelor', 'bachelorette'],
    branding: {
      primary_color: '#B76E79',
      accent_color: '#F7E7CE',
      background_style: 'solid',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #B76E79 0%, #F7E7CE 100%)',
    },
    patternId: 'rings',
    backgroundIcons: ['💍', '💒', '🤍'],
    heroImage: '/images/form-templates/wedding-elegant.webp',
  },
  {
    id: 'birthday-fun',
    name: 'Birthday Fun',
    description: 'Bunt & fröhlich für Geburtstagspartys',
    nameKey: 'designTemplates.birthday-fun.name',
    descriptionKey: 'designTemplates.birthday-fun.desc',
    icon: '🎂',
    eventTypes: ['birthday'],
    branding: {
      primary_color: '#F97316',
      accent_color: '#EAB308',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #F97316 0%, #EAB308 100%)',
    },
    patternId: 'confetti',
    backgroundIcons: ['🎂', '🎈', '🎁', '🎊'],
    heroImage: '/images/form-templates/birthday-fun.webp',
  },
  {
    id: 'beach-vibes',
    name: 'Beach Vibes',
    description: 'Entspannt & sommerlich für Strand-Trips',
    nameKey: 'designTemplates.beach-vibes.name',
    descriptionKey: 'designTemplates.beach-vibes.desc',
    icon: '🌴',
    eventTypes: ['trip', 'bachelor', 'bachelorette'],
    branding: {
      primary_color: '#14B8A6',
      accent_color: '#D4A574',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #D4A574 100%)',
    },
    patternId: 'waves',
    backgroundIcons: ['🌴', '🏖️', '🍹', '☀️'],
    heroImage: '/images/form-templates/beach-vibes.webp',
  },
  {
    id: 'night-out',
    name: 'Night Out',
    description: 'Dunkel & glamourös für Party-Nächte',
    nameKey: 'designTemplates.night-out.name',
    descriptionKey: 'designTemplates.night-out.desc',
    icon: '🌙',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    branding: {
      primary_color: '#7C3AED',
      accent_color: '#EC4899',
      background_style: 'dark',
      text_color: '#FFFFFF',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    },
    patternId: 'stars',
    backgroundIcons: ['🌙', '✨', '🪩', '🍸'],
    heroImage: '/images/form-templates/night-out.webp',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean & zeitlos für alle Anlässe',
    nameKey: 'designTemplates.modern-minimal.name',
    descriptionKey: 'designTemplates.modern-minimal.desc',
    icon: '⚡',
    eventTypes: ['bachelor', 'bachelorette', 'birthday', 'trip', 'other'],
    branding: {
      primary_color: '#1F2937',
      accent_color: '#6B7280',
      background_style: 'solid',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #1F2937 0%, #6B7280 100%)',
    },
    patternId: 'dots',
    backgroundIcons: ['⚡'],
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Exotisch & farbenfroh für Abenteuer-Trips',
    nameKey: 'designTemplates.tropical-paradise.name',
    descriptionKey: 'designTemplates.tropical-paradise.desc',
    icon: '🦜',
    eventTypes: ['trip', 'bachelor', 'bachelorette'],
    branding: {
      primary_color: '#10B981',
      accent_color: '#F59E0B',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
    },
    patternId: 'bubbles',
    backgroundIcons: ['🦜', '🌺', '🍍', '🌿'],
    heroImage: '/images/form-templates/tropical-paradise.webp',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Königlich & luxuriös für besondere Anlässe',
    nameKey: 'designTemplates.royal-purple.name',
    descriptionKey: 'designTemplates.royal-purple.desc',
    icon: '👑',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    branding: {
      primary_color: '#6D28D9',
      accent_color: '#A78BFA',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)',
    },
    patternId: 'diamonds',
    backgroundIcons: ['👑', '💎', '✨'],
    heroImage: '/images/form-templates/royal-purple.webp',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm & romantisch wie ein Sonnenuntergang',
    nameKey: 'designTemplates.sunset-glow.name',
    descriptionKey: 'designTemplates.sunset-glow.desc',
    icon: '🌅',
    eventTypes: ['bachelor', 'bachelorette', 'trip'],
    branding: {
      primary_color: '#F43F5E',
      accent_color: '#FB923C',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #F43F5E 0%, #FB923C 100%)',
    },
    patternId: 'stripes',
    backgroundIcons: ['🌅', '🧡', '🔥'],
    heroImage: '/images/form-templates/sunset-glow.webp',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Frisch & maritim für Wassersport-Fans',
    nameKey: 'designTemplates.ocean-breeze.name',
    descriptionKey: 'designTemplates.ocean-breeze.desc',
    icon: '🌊',
    eventTypes: ['trip', 'bachelor'],
    branding: {
      primary_color: '#0EA5E9',
      accent_color: '#22D3EE',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)',
    },
    patternId: 'waves',
    backgroundIcons: ['🌊', '⛵', '🐚', '🏄'],
  },
  {
    id: 'ladies-night',
    name: 'Ladies Night',
    description: 'Pink & glamourös für JGA der Braut',
    nameKey: 'designTemplates.ladies-night.name',
    descriptionKey: 'designTemplates.ladies-night.desc',
    icon: '💅',
    eventTypes: ['bachelorette'],
    branding: {
      primary_color: '#EC4899',
      accent_color: '#F9A8D4',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)',
    },
    patternId: 'hearts',
    backgroundIcons: ['💅', '💋', '👠', '🍾'],
    heroImage: '/images/form-templates/ladies-night.webp',
  },
  {
    id: 'vegas-neon',
    name: 'Vegas Neon',
    description: 'Neon-Lichter für unvergessliche Partys',
    nameKey: 'designTemplates.vegas-neon.name',
    descriptionKey: 'designTemplates.vegas-neon.desc',
    icon: '🎰',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    branding: {
      primary_color: '#22C55E',
      accent_color: '#F0ABFC',
      background_style: 'dark',
      text_color: '#FFFFFF',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #22C55E 0%, #F0ABFC 100%)',
    },
    patternId: 'stripes',
    backgroundIcons: ['🎰', '🃏', '💰', '🎲'],
    heroImage: '/images/form-templates/vegas-neon.webp',
  },
  {
    id: 'oktoberfest',
    name: 'Oktoberfest',
    description: 'Bayerisch & zünftig für Volksfest-Fans',
    nameKey: 'designTemplates.oktoberfest.name',
    descriptionKey: 'designTemplates.oktoberfest.desc',
    icon: '🍺',
    eventTypes: ['bachelor', 'birthday'],
    branding: {
      primary_color: '#D97706',
      accent_color: '#92400E',
      background_style: 'dark',
      text_color: '#FFFFFF',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #1C1917 0%, #D97706 50%, #92400E 100%)',
    },
    patternId: 'stripes',
    backgroundIcons: ['🍺', '🥨', '🎡', '🏔️'],
  },
  {
    id: 'ski-snow',
    name: 'Ski & Snow',
    description: 'Winterlich & sportlich für Ski-Trips',
    nameKey: 'designTemplates.ski-snow.name',
    descriptionKey: 'designTemplates.ski-snow.desc',
    icon: '⛷️',
    eventTypes: ['trip', 'bachelor'],
    branding: {
      primary_color: '#0284C7',
      accent_color: '#BAE6FD',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #0284C7 0%, #BAE6FD 100%)',
    },
    patternId: 'diamonds',
    backgroundIcons: ['⛷️', '❄️', '🏔️', '🎿'],
    heroImage: '/images/form-templates/ski-snow.webp',
  },
  {
    id: 'festival-vibes',
    name: 'Festival Vibes',
    description: 'Wild & bunt für Festival-Liebhaber',
    nameKey: 'designTemplates.festival-vibes.name',
    descriptionKey: 'designTemplates.festival-vibes.desc',
    icon: '🎪',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    branding: {
      primary_color: '#E11D48',
      accent_color: '#4ADE80',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #E11D48 0%, #4ADE80 100%)',
    },
    patternId: 'confetti',
    backgroundIcons: ['🎪', '🎸', '🔥', '🎵'],
  },
  {
    id: 'garden-party',
    name: 'Garden Party',
    description: 'Natürlich & romantisch für Gartenpartys',
    nameKey: 'designTemplates.garden-party.name',
    descriptionKey: 'designTemplates.garden-party.desc',
    icon: '🌿',
    eventTypes: ['birthday', 'bachelorette'],
    branding: {
      primary_color: '#15803D',
      accent_color: '#FDE68A',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #15803D 0%, #FDE68A 100%)',
    },
    patternId: 'bubbles',
    backgroundIcons: ['🌿', '🌸', '🦋', '🌻'],
    heroImage: '/images/form-templates/garden-party.webp',
  },
  {
    id: 'road-trip',
    name: 'Road Trip',
    description: 'Abenteuerlich & frei für Roadtrips',
    nameKey: 'designTemplates.road-trip.name',
    descriptionKey: 'designTemplates.road-trip.desc',
    icon: '🚗',
    eventTypes: ['trip', 'bachelor'],
    branding: {
      primary_color: '#EA580C',
      accent_color: '#FCD34D',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #EA580C 0%, #FCD34D 100%)',
    },
    patternId: 'stripes',
    backgroundIcons: ['🚗', '🛣️', '⛽', '🌄'],
  },
  {
    id: 'glamour-night',
    name: 'Glamour Night',
    description: 'Edel & glamourös für besondere Abende',
    nameKey: 'designTemplates.glamour-night.name',
    descriptionKey: 'designTemplates.glamour-night.desc',
    icon: '✨',
    eventTypes: ['bachelorette', 'birthday'],
    branding: {
      primary_color: '#B45309',
      accent_color: '#FDE68A',
      background_style: 'dark',
      text_color: '#FFFFFF',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #1C1917 0%, #B45309 50%, #FDE68A 100%)',
    },
    patternId: 'stars',
    backgroundIcons: ['✨', '🥂', '💫', '🪩'],
  },
  {
    id: 'sporty-adventure',
    name: 'Sporty Adventure',
    description: 'Aktiv & energiegeladen für Sportler',
    nameKey: 'designTemplates.sporty-adventure.name',
    descriptionKey: 'designTemplates.sporty-adventure.desc',
    icon: '🏃',
    eventTypes: ['bachelor', 'trip'],
    branding: {
      primary_color: '#059669',
      accent_color: '#34D399',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)',
    },
    patternId: 'dots',
    backgroundIcons: ['🏃', '⚽', '🏀', '🎯'],
  },
  {
    id: 'retro-vintage',
    name: 'Retro Vintage',
    description: 'Nostalgisch & stilvoll im Vintage-Look',
    nameKey: 'designTemplates.retro-vintage.name',
    descriptionKey: 'designTemplates.retro-vintage.desc',
    icon: '📻',
    eventTypes: ['birthday', 'bachelor', 'bachelorette'],
    branding: {
      primary_color: '#9F1239',
      accent_color: '#FCA5A5',
      background_style: 'gradient',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #9F1239 0%, #FCA5A5 100%)',
    },
    patternId: 'rings',
    backgroundIcons: ['📻', '🎵', '🕹️', '📸'],
  },
];

export function getTemplatesForEventType(eventType: string): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter(t => t.eventTypes.includes(eventType));
}

export function getTemplateById(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find(t => t.id === id);
}

export function getRecommendedTemplate(eventType: string): DesignTemplate {
  const templates = getTemplatesForEventType(eventType);
  return templates[0] || DESIGN_TEMPLATES[0];
}

// SVG Pattern generators for backgrounds
export const PATTERN_SVGS: Record<string, (color: string) => string> = {
  confetti: (color: string) => `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="4" height="4" fill="${color}" opacity="0.3" transform="rotate(45 7 7)"/>
      <rect x="45" y="15" width="3" height="3" fill="${color}" opacity="0.4" transform="rotate(30 46.5 16.5)"/>
      <rect x="25" y="40" width="5" height="5" fill="${color}" opacity="0.25" transform="rotate(60 27.5 42.5)"/>
      <circle cx="15" cy="35" r="2" fill="${color}" opacity="0.35"/>
      <circle cx="50" cy="45" r="3" fill="${color}" opacity="0.3"/>
    </svg>
  `,
  rings: (color: string) => `
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="25" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
      <circle cx="40" cy="40" r="15" fill="none" stroke="${color}" stroke-width="1" opacity="0.15"/>
      <circle cx="10" cy="10" r="8" fill="none" stroke="${color}" stroke-width="1" opacity="0.1"/>
      <circle cx="70" cy="70" r="6" fill="none" stroke="${color}" stroke-width="1" opacity="0.15"/>
    </svg>
  `,
  waves: (color: string) => `
    <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20 Q25 5 50 20 T100 20" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.2"/>
      <path d="M0 30 Q25 15 50 30 T100 30" fill="none" stroke="${color}" stroke-width="1" opacity="0.15"/>
    </svg>
  `,
  stars: (color: string) => `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,5 33,20 48,20 36,28 40,43 30,34 20,43 24,28 12,20 27,20" fill="${color}" opacity="0.15"/>
      <polygon points="10,45 11,50 16,50 12,53 13,58 10,55 7,58 8,53 4,50 9,50" fill="${color}" opacity="0.2"/>
      <polygon points="50,35 51,38 54,38 52,40 52.5,43 50,41 47.5,43 48,40 46,38 49,38" fill="${color}" opacity="0.25"/>
    </svg>
  `,
  diamonds: (color: string) => `
    <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,5 35,25 25,45 15,25" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
      <polygon points="5,15 10,25 5,35 0,25" fill="${color}" opacity="0.1"/>
      <polygon points="45,20 50,30 45,40 40,30" fill="${color}" opacity="0.15"/>
    </svg>
  `,
  dots: (color: string) => `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="2" fill="${color}" opacity="0.15"/>
      <circle cx="25" cy="5" r="1.5" fill="${color}" opacity="0.1"/>
      <circle cx="15" cy="25" r="2" fill="${color}" opacity="0.12"/>
      <circle cx="35" cy="35" r="1.5" fill="${color}" opacity="0.15"/>
    </svg>
  `,
  stripes: (color: string) => `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="0" x2="40" y2="40" stroke="${color}" stroke-width="1" opacity="0.1"/>
      <line x1="10" y1="0" x2="50" y2="40" stroke="${color}" stroke-width="1" opacity="0.08"/>
      <line x1="20" y1="0" x2="60" y2="40" stroke="${color}" stroke-width="1" opacity="0.1"/>
      <line x1="-10" y1="0" x2="30" y2="40" stroke="${color}" stroke-width="1" opacity="0.08"/>
    </svg>
  `,
  hearts: (color: string) => `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,50 C20,40 10,30 10,20 C10,12 18,8 25,12 C28,14 30,18 30,18 C30,18 32,14 35,12 C42,8 50,12 50,20 C50,30 40,40 30,50Z" fill="${color}" opacity="0.12"/>
      <path d="M12,12 C8,8 4,8 4,12 C4,16 8,20 12,24 C16,20 20,16 20,12 C20,8 16,8 12,12Z" fill="${color}" opacity="0.08" transform="scale(0.5) translate(80, 80)"/>
    </svg>
  `,
  bubbles: (color: string) => `
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="12" fill="${color}" opacity="0.1"/>
      <circle cx="60" cy="30" r="8" fill="${color}" opacity="0.15"/>
      <circle cx="35" cy="60" r="15" fill="${color}" opacity="0.08"/>
      <circle cx="70" cy="65" r="6" fill="${color}" opacity="0.12"/>
      <circle cx="10" cy="55" r="5" fill="${color}" opacity="0.1"/>
    </svg>
  `,
  none: () => '',
};
