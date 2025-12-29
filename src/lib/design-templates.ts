// Design Templates für verschiedene Event-Typen
export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
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
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'jga-classic',
    name: 'JGA Classic',
    description: 'Festlich & Party-ready mit lila-cyan Gradient',
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
  },
  {
    id: 'wedding-elegant',
    name: 'Wedding Elegant',
    description: 'Klassisch-elegant mit Rose Gold Akzenten',
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
  },
  {
    id: 'birthday-fun',
    name: 'Birthday Fun',
    description: 'Bunt & fröhlich für Geburtstagspartys',
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
  },
  {
    id: 'beach-vibes',
    name: 'Beach Vibes',
    description: 'Entspannt & sommerlich für Strand-Trips',
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
  },
  {
    id: 'night-out',
    name: 'Night Out',
    description: 'Dunkel & glamourös für Party-Nächte',
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
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean & zeitlos für alle Anlässe',
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
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Exotisch & farbenfroh für Abenteuer-Trips',
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
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Königlich & luxuriös für besondere Anlässe',
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
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm & romantisch wie ein Sonnenuntergang',
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
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Frisch & maritim für Wassersport-Fans',
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
