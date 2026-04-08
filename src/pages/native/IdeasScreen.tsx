/**
 * IdeasScreen — native "Ideas" tab. Themes, inspiration, activities.
 * For now a simple grid of inspiration cards linking to deeper content.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Palette,
  MapPin,
  Utensils,
  Music,
  Camera,
  Gift,
  Plane,
  Heart,
  Star,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const IDEAS = [
  { id: "themes", label: "Themen", icon: Palette, gradient: "from-violet-500 to-fuchsia-500", description: "Motto & Decor" },
  { id: "locations", label: "Locations", icon: MapPin, gradient: "from-cyan-500 to-teal-500", description: "Wo feiern?" },
  { id: "food", label: "Essen & Drinks", icon: Utensils, gradient: "from-amber-500 to-orange-500", description: "Kulinarisches" },
  { id: "music", label: "Playlists", icon: Music, gradient: "from-pink-500 to-rose-500", description: "Die richtige Stimmung" },
  { id: "photo", label: "Photo Spots", icon: Camera, gradient: "from-indigo-500 to-purple-500", description: "Memorable Momente" },
  { id: "gifts", label: "Geschenke", icon: Gift, gradient: "from-emerald-500 to-teal-500", description: "Ideen für alle" },
  { id: "trips", label: "JGA Reisen", icon: Plane, gradient: "from-sky-500 to-blue-500", description: "Destinations" },
  { id: "romantic", label: "Romantik", icon: Heart, gradient: "from-rose-500 to-red-500", description: "Zu zweit" },
];

export default function IdeasScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-amber-400 font-semibold uppercase tracking-wide">
            Inspiration
          </p>
        </div>
        <h1 className="text-3xl font-display font-bold text-white mt-1 leading-tight">
          Ideen, die begeistern
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Von Motto bis Location — alles für dein Event.
        </p>
      </div>

      {/* Featured banner */}
      <motion.div
        className="mx-5 mb-5 relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.soft}
      >
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">
            Featured
          </p>
          <p className="text-xl font-display font-bold text-white mt-1">
            Top JGA Ideen 2026
          </p>
          <p className="text-sm text-white/80 mt-1">
            Die besten Trends & unsere Favoriten
          </p>
        </div>
      </motion.div>

      {/* Categories grid */}
      <div className="flex-1 overflow-y-auto native-scroll pb-tabbar">
        <motion.div
          className="px-5 grid grid-cols-2 gap-3"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {IDEAS.map((idea) => {
            const Icon = idea.icon;
            return (
              <motion.button
                key={idea.id}
                variants={staggerItem}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                onClick={() => {
                  haptics.light();
                  navigate("/ideas");
                }}
                className="aspect-square rounded-3xl p-4 flex flex-col justify-between items-start text-left bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 relative overflow-hidden"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                    idea.gradient
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-display font-bold text-white">
                    {idea.label}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {idea.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
