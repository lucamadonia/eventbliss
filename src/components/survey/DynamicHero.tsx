import { motion } from "framer-motion";
import { Heart, Calendar, PartyPopper, Cake, Plane, Star, Sparkles } from "lucide-react";
import { type BrandingConfig } from "@/lib/survey-config";
import { getTemplateById, PATTERN_SVGS } from "@/lib/design-templates";
import { cn } from "@/lib/utils";

interface DynamicHeroProps {
  eventName: string;
  eventType?: 'bachelor' | 'bachelorette' | 'birthday' | 'trip' | 'other';
  honoreeName?: string;
  branding?: BrandingConfig;
  keyDateLabel?: string;
  keyDate?: string;
  heroImageUrl?: string;
  logoUrl?: string;
  templateId?: string;
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
  templateId,
}: DynamicHeroProps) => {
  const config = eventTypeConfig[eventType] || eventTypeConfig.other;
  const IconComponent = config.icon;
  
  // Get template for pattern and background icons
  const template = templateId ? getTemplateById(templateId) : null;
  const patternId = template?.patternId || 'none';
  const backgroundIcons = template?.backgroundIcons || [config.emoji];
  
  // Custom title from branding or auto-generate
  const title = branding?.hero_title || eventName;
  const subtitle = branding?.hero_subtitle || "Termin finden & Action planen";
  
  // Dynamic styles based on branding
  const primaryColor = branding?.primary_color || "#8B5CF6";
  const accentColor = branding?.accent_color || "#06B6D4";
  const backgroundStyle = branding?.background_style || 'gradient';

  // Generate pattern SVG
  const patternSvg = patternId !== 'none' && PATTERN_SVGS[patternId] 
    ? PATTERN_SVGS[patternId](primaryColor) 
    : '';
  const patternDataUrl = patternSvg 
    ? `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")` 
    : 'none';

  // Background style based on branding setting — stronger when template is active
  const getBackgroundStyle = () => {
    const hasTemplate = !!template;
    switch (backgroundStyle) {
      case 'dark':
        return hasTemplate
          ? `linear-gradient(135deg, ${primaryColor}40 0%, ${accentColor}20 100%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)`
          : `linear-gradient(135deg, ${primaryColor}20 0%, ${accentColor}10 100%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)`;
      case 'solid':
        return hasTemplate
          ? `linear-gradient(180deg, ${primaryColor}30 0%, transparent 100%)`
          : `linear-gradient(180deg, ${primaryColor}15 0%, transparent 100%)`;
      case 'gradient':
      default:
        return hasTemplate
          ? `linear-gradient(135deg, ${primaryColor}40 0%, ${accentColor}25 50%, transparent 100%)`
          : `linear-gradient(135deg, ${primaryColor}25 0%, ${accentColor}15 50%, transparent 100%)`;
    }
  };

  return (
    <section
      className="relative overflow-hidden py-12 md:py-20"
      style={{
        '--template-primary': primaryColor,
        '--template-accent': accentColor,
      } as React.CSSProperties}
    >
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: getBackgroundStyle(),
        }}
      />

      {/* Pattern Overlay - more visible when template is active */}
      {patternId !== 'none' && (
        <div
          className={cn("absolute inset-0 z-0", template ? "opacity-70" : "opacity-50")}
          style={{
            backgroundImage: patternDataUrl,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

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

      {/* Floating Background Icons - enhanced visibility with template */}
      {backgroundIcons.map((icon, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl md:text-6xl pointer-events-none select-none"
          style={{
            top: `${15 + index * 20}%`,
            left: index % 2 === 0 ? '5%' : 'auto',
            right: index % 2 === 1 ? '5%' : 'auto',
            opacity: template ? 0.22 : 0.15,
          }}
          animate={{ 
            y: [0, -10 - index * 5, 0],
            rotate: [0, index % 2 === 0 ? 5 : -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 4 + index, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: index * 0.5,
          }}
        >
          {icon}
        </motion.div>
      ))}

      {/* Additional floating decorations */}
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

      {/* Dark mode glow effect for "dark" style */}
      {backgroundStyle === 'dark' && (
        <>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-30"
            style={{ backgroundColor: primaryColor }}
          />
          <div 
            className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-[80px] opacity-20"
            style={{ backgroundColor: accentColor }}
          />
        </>
      )}
      
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

      {/* Template-tinted bottom accent line */}
      {template && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
            opacity: 0.5,
          }}
        />
      )}
    </section>
  );
};

export default DynamicHero;