import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Phone, Globe, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoAgencies = () => {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cities = [
    { name: "Berlin", x: 62, y: 28, count: 12 },
    { name: "München", x: 55, y: 58, count: 8 },
    { name: "Hamburg", x: 52, y: 18, count: 6 },
    { name: "Köln", x: 35, y: 42, count: 5 },
    { name: "Wien", x: 72, y: 52, count: 4 },
    { name: "Zürich", x: 45, y: 60, count: 3 },
  ];

  const mockAgencies: Record<string, Array<{ name: string; rating: number; specialty: string }>> = {
    Berlin: [
      { name: "PartyProfis Berlin", rating: 4.9, specialty: t("landing.demo.live.agencies.club", "Club & Nachtleben") },
      { name: "EventMaster GmbH", rating: 4.7, specialty: t("landing.demo.live.agencies.outdoor", "Outdoor & Action") },
    ],
    München: [
      { name: "Bavarian Events", rating: 4.8, specialty: t("landing.demo.live.agencies.traditional", "Traditionell & Bier") },
      { name: "AlpenAction", rating: 4.6, specialty: t("landing.demo.live.agencies.adventure", "Abenteuer") },
    ],
    Hamburg: [
      { name: "Hafenparty", rating: 4.8, specialty: t("landing.demo.live.agencies.boat", "Bootstouren") },
    ],
    Köln: [
      { name: "Kölner Feiermeister", rating: 4.7, specialty: t("landing.demo.live.agencies.carnival", "Karneval & Party") },
    ],
    Wien: [
      { name: "Vienna Events", rating: 4.9, specialty: t("landing.demo.live.agencies.luxury", "Luxus & Kultur") },
    ],
    Zürich: [
      { name: "Swiss Experience", rating: 4.8, specialty: t("landing.demo.live.agencies.premium", "Premium Events") },
    ],
  };

  return (
    <div className="h-full flex flex-col p-2">
      {/* Map Container */}
      <div className="flex-1 relative rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 via-muted/30 to-background border border-border/50">
        {/* Decorative map elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[15%] left-[40%] w-32 h-20 rounded-full bg-primary/20 blur-xl" />
          <div className="absolute top-[40%] left-[50%] w-40 h-24 rounded-full bg-accent/20 blur-xl" />
          <div className="absolute top-[55%] left-[55%] w-24 h-16 rounded-full bg-success/20 blur-xl" />
        </div>

        {/* City Markers */}
        {cities.map((city, index) => (
          <motion.button
            key={city.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedCity(selectedCity === city.name ? null : city.name)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${city.x}%`, top: `${city.y}%` }}
          >
            <motion.div
              whileHover={{ scale: 1.2 }}
              className={`relative ${selectedCity === city.name ? "z-20" : "z-10"}`}
            >
              <div className={`p-1.5 rounded-full transition-all ${
                selectedCity === city.name 
                  ? "bg-primary shadow-lg shadow-primary/50" 
                  : "bg-accent/80 group-hover:bg-primary"
              }`}>
                <MapPin className="w-3 h-3 text-white" />
              </div>
              
              {/* City Label */}
              <div className={`absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap transition-all ${
                selectedCity === city.name
                  ? "bg-primary text-white"
                  : "bg-card/80 text-foreground opacity-0 group-hover:opacity-100"
              }`}>
                {city.name}
                <span className="ml-1 opacity-70">({city.count})</span>
              </div>

              {/* Pulse animation for selected */}
              {selectedCity === city.name && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
            </motion.div>
          </motion.button>
        ))}

        {/* Agency Panel */}
        <AnimatePresence>
          {selectedCity && mockAgencies[selectedCity] && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-2 top-2 bottom-2 w-40 bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 p-2 flex flex-col z-30"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold">{selectedCity}</h4>
                <button 
                  onClick={() => setSelectedCity(null)}
                  className="p-0.5 rounded hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex-1 space-y-2 overflow-y-auto">
                {mockAgencies[selectedCity].map((agency, i) => (
                  <motion.div
                    key={agency.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-muted/50 rounded-lg p-2"
                  >
                    <div className="font-medium text-[10px] mb-0.5">{agency.name}</div>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-2.5 h-2.5 text-warning fill-warning" />
                      <span className="text-[9px]">{agency.rating}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">{agency.specialty}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text */}
        {!selectedCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-2 left-2 right-2 text-center"
          >
            <span className="text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded">
              {t("landing.demo.live.agencies.clickCity", "Klicke auf eine Stadt")}
            </span>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[9px] text-muted-foreground">
            {t("landing.demo.live.agencies.available", "Verfügbar")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[9px] text-muted-foreground">
            {t("landing.demo.live.agencies.selected", "Ausgewählt")}
          </span>
        </div>
      </div>
    </div>
  );
};

export { DemoAgencies };
