import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Phone, Globe, X, Search, Filter, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoAgencies = () => {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const cities = [
    { name: "Berlin", x: 62, y: 28, count: 12, country: "DE" },
    { name: "München", x: 55, y: 58, count: 8, country: "DE" },
    { name: "Hamburg", x: 52, y: 18, count: 6, country: "DE" },
    { name: "Köln", x: 35, y: 42, count: 5, country: "DE" },
    { name: "Wien", x: 72, y: 52, count: 4, country: "AT" },
    { name: "Zürich", x: 42, y: 58, count: 3, country: "CH" },
  ];

  const filters = [
    { id: "DE", label: "🇩🇪", name: "Deutschland" },
    { id: "AT", label: "🇦🇹", name: "Österreich" },
    { id: "CH", label: "🇨🇭", name: "Schweiz" },
  ];

  const mockAgencies: Record<string, Array<{ name: string; rating: number; specialty: string; priceRange: string; image: string }>> = {
    Berlin: [
      { name: "PartyProfis Berlin", rating: 4.9, specialty: t("landing.demo.live.agencies.club", "Club & Nachtleben"), priceRange: "€€-€€€", image: "🎉" },
      { name: "EventMaster GmbH", rating: 4.7, specialty: t("landing.demo.live.agencies.outdoor", "Outdoor & Action"), priceRange: "€€", image: "🏃" },
    ],
    München: [
      { name: "Bavarian Events", rating: 4.8, specialty: t("landing.demo.live.agencies.traditional", "Tradition & Bier"), priceRange: "€€", image: "🍺" },
      { name: "AlpenAction", rating: 4.6, specialty: t("landing.demo.live.agencies.adventure", "Abenteuer"), priceRange: "€€€", image: "⛷️" },
    ],
    Hamburg: [
      { name: "Hafenparty", rating: 4.8, specialty: t("landing.demo.live.agencies.boat", "Bootstouren"), priceRange: "€€", image: "🚤" },
      { name: "Reeperbahn Tours", rating: 4.5, specialty: t("landing.demo.live.agencies.nightlife", "Nachtleben"), priceRange: "€-€€", image: "🌃" },
    ],
    Köln: [
      { name: "Kölner Feiermeister", rating: 4.7, specialty: t("landing.demo.live.agencies.carnival", "Karneval & Party"), priceRange: "€€", image: "🎭" },
    ],
    Wien: [
      { name: "Vienna Events", rating: 4.9, specialty: t("landing.demo.live.agencies.luxury", "Luxus & Kultur"), priceRange: "€€€", image: "👑" },
    ],
    Zürich: [
      { name: "Swiss Experience", rating: 4.8, specialty: t("landing.demo.live.agencies.premium", "Premium Events"), priceRange: "€€€€", image: "🏔️" },
    ],
  };

  const filteredCities = activeFilter 
    ? cities.filter(c => c.country === activeFilter)
    : cities;

  const handleSearch = () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      // Find matching city
      const match = cities.find(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (match) setSelectedCity(match.name);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {/* Search & Filters */}
      <div className="flex gap-1.5">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t("landing.demo.live.agencies.searchPlaceholder", "Stadt suchen...")}
            className="w-full bg-card/50 border border-border/50 rounded-lg pl-6 pr-2 py-1 text-[10px] focus:border-primary outline-none"
          />
          {isSearching && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Search className="w-3 h-3 text-primary" />
            </motion.div>
          )}
        </div>
        {filters.map(filter => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
            className={`px-2 py-1 rounded-lg border text-[10px] transition-all ${
              activeFilter === filter.id
                ? "bg-primary/20 border-primary"
                : "bg-card/50 border-border/50 hover:border-primary/50"
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-border/50">
        {/* Stylized Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/50">
          {/* Germany/Austria/Switzerland outline */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
            <path
              d="M30,15 L45,10 L55,12 L65,8 L75,15 L78,25 L82,35 L78,45 L72,50 L68,60 L55,65 L45,62 L35,55 L32,45 L28,35 L25,25 Z"
              fill="currentColor"
              className="text-primary/30"
            />
            <path
              d="M68,50 L75,52 L78,58 L75,65 L68,62 L65,55 Z"
              fill="currentColor"
              className="text-accent/30"
            />
            <path
              d="M40,60 L48,58 L52,65 L48,72 L40,70 L38,65 Z"
              fill="currentColor"
              className="text-success/30"
            />
          </svg>
          
          {/* Decorative elements */}
          <div className="absolute top-[20%] left-[50%] w-32 h-20 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute top-[50%] left-[60%] w-24 h-16 rounded-full bg-accent/10 blur-2xl" />
        </div>

        {/* City Markers */}
        {filteredCities.map((city, index) => (
          <motion.button
            key={city.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => setSelectedCity(selectedCity === city.name ? null : city.name)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
            style={{ left: `${city.x}%`, top: `${city.y}%` }}
          >
            <motion.div
              whileHover={{ scale: 1.3 }}
              className={`relative ${selectedCity === city.name ? "z-20" : "z-10"}`}
            >
              {/* Pulse animation */}
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                className={`absolute inset-0 rounded-full ${
                  selectedCity === city.name ? "bg-primary" : "bg-accent"
                }`}
              />
              
              <div className={`relative p-1.5 rounded-full transition-all shadow-lg ${
                selectedCity === city.name 
                  ? "bg-primary shadow-primary/50" 
                  : "bg-accent/90 group-hover:bg-primary shadow-accent/30"
              }`}>
                <MapPin className="w-3 h-3 text-white" />
              </div>
              
              {/* City Label */}
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: selectedCity === city.name ? 1 : 0 }}
                className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-full bg-primary text-white text-[8px] font-medium whitespace-nowrap shadow-lg"
              >
                {city.name}
                <span className="ml-1 opacity-70">({city.count})</span>
              </motion.div>
              
              {/* Hover label */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap bg-card/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {city.name}
              </div>
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
              className="absolute right-1 top-1 bottom-1 w-36 bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 p-1.5 flex flex-col z-30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  {selectedCity}
                </h4>
                <button 
                  onClick={() => setSelectedCity(null)}
                  className="p-0.5 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {mockAgencies[selectedCity].map((agency, i) => (
                  <motion.div
                    key={agency.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-muted/50 rounded-lg p-1.5 cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-primary/30"
                  >
                    <div className="flex items-start gap-1.5">
                      <div className="text-lg">{agency.image}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[9px] truncate">{agency.name}</div>
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <Star className="w-2 h-2 text-warning fill-warning" />
                          <span className="text-[8px] font-medium">{agency.rating}</span>
                          <span className="text-[8px] text-muted-foreground ml-1">{agency.priceRange}</span>
                        </div>
                        <div className="text-[8px] text-muted-foreground truncate">{agency.specialty}</div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full mt-1 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-medium flex items-center justify-center gap-0.5 hover:bg-primary/30 transition-colors"
                    >
                      {t("landing.demo.live.agencies.contact", "Anfragen")}
                      <ExternalLink className="w-2 h-2" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text */}
        <AnimatePresence>
          {!selectedCity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-2 left-2 right-2 text-center"
            >
              <span className="text-[9px] text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
                👆 {t("landing.demo.live.agencies.clickCity", "Klicke auf eine Stadt")}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            {filteredCities.length} {t("landing.demo.live.agencies.cities", "Städte")}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-warning fill-warning" />
            {t("landing.demo.live.agencies.verified", "Verifiziert")}
          </span>
        </div>
        <span>{filteredCities.reduce((acc, c) => acc + c.count, 0)}+ {t("landing.demo.live.agencies.partners", "Partner")}</span>
      </div>
    </div>
  );
};

export { DemoAgencies };
