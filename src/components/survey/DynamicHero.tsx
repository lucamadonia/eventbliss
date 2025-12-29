import { motion } from "framer-motion";
import { Heart, Calendar, PartyPopper, Cake, Plane, Star, Sparkles } from "lucide-react";
import { type BrandingConfig } from "@/lib/survey-config";

interface DynamicHeroProps {
  eventName: string;
  eventType?: 'bachelor' | 'bachelorette' | 'birthday' | 'trip' | 'other';
  honoreeName?: string;
  branding?: BrandingConfig;
  keyDateLabel?: string;
  keyDate?: string;
  heroImageUrl?: string;
  logoUrl?: string;
}

const eventTypeConfig = {
  bachelor: { emoji: '🎉', icon: PartyPopper, label: 'JGA' },
  bachelorette: { emoji: '👑', icon: Sparkles, label: 'JGA' },
  birthday: { emoji: '🎂', icon: Cake, label: 'Geburtstag' },
  trip: { emoji: '✈️', icon: Plane, label: 'Reise' },
  other: { emoji: '⭐', icon: Star, label: 'Event' },
};

const DynamicHero = ({
  eventName,
  eventType = 'bachelor',
  honoreeName,
  branding,
  keyDateLabel,
  keyDate,
  heroImageUrl,
  logoUrl,
}: DynamicHeroProps) => {
  const config = eventTypeConfig[eventType] || eventTypeConfig.other;
  const IconComponent = config.icon;
  
  // Custom title from branding or auto-generate
  const title = branding?.hero_title || eventName;
  const subtitle = branding?.hero_subtitle || "Termin finden & Action planen";
  
  // Dynamic styles based on branding
  const primaryColor = branding?.primary_color || "#8B5CF6";
  const accentColor = branding?.accent_color || "#06B6D4";

  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Hero Background Image (optional) */}
      {heroImageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
      )}

      {/* Floating decorations */}
      <motion.div 
        className="absolute top-10 left-10 opacity-20"
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <IconComponent className="w-24 h-24" style={{ color: primaryColor }} strokeWidth={1} />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-10 right-10 opacity-20"
        animate={{ 
          y: [0, 10, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <IconComponent className="w-20 h-20" style={{ color: accentColor }} strokeWidth={1} />
      </motion.div>

      {/* Glowing orbs */}
      <div 
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 -z-10"
        style={{ backgroundColor: primaryColor }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15 -z-10"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="container relative z-10">
        <motion.div 
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo (optional) */}
          {logoUrl && (
            <motion.div 
              className="mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img 
                src={logoUrl} 
                alt="Event Logo" 
                className="h-48 md:h-56 lg:h-64 mx-auto object-contain"
              />
            </motion.div>
          )}

          {/* Event Type Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{ 
              backgroundColor: `${primaryColor}20`,
              borderColor: `${primaryColor}40`,
              color: primaryColor,
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-lg">{config.emoji}</span>
            <span>{config.label}</span>
          </motion.div>
          
          {/* Main title */}
          <motion.h1 
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              }}
            >
              {title}
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground font-medium mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
          
          {/* Key date badge */}
          {keyDate && (
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card"
              style={{
                borderColor: `${primaryColor}30`,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {eventType === 'bachelor' || eventType === 'bachelorette' ? (
                <Heart className="w-4 h-4 fill-current" style={{ color: primaryColor }} />
              ) : (
                <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              )}
              <span className="text-sm font-medium text-foreground">
                {keyDateLabel || (eventType === 'bachelor' || eventType === 'bachelorette' ? 'Hochzeit' : 'Datum')}: {keyDate}
              </span>
              {eventType === 'bachelor' || eventType === 'bachelorette' ? (
                <Heart className="w-4 h-4 fill-current" style={{ color: primaryColor }} />
              ) : (
                <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              )}
            </motion.div>
          )}

          {/* Honoree name highlight */}
          {honoreeName && (
            <motion.p 
              className="mt-4 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              für <span className="font-semibold text-foreground">{honoreeName}</span>
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default DynamicHero;
