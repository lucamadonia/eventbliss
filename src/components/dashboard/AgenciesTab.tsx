import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Building2,
  ChevronDown,
  Filter,
  X,
  Map,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENCIES,
  COUNTRIES,
  type Agency,
  searchAgencies,
  getAgenciesByCountry,
  getCitiesForCountry,
} from "@/lib/agencies-data";
import { cn } from "@/lib/utils";
import { AgenciesMapView } from "./AgenciesMapView";

export const AgenciesTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [expandedCountries, setExpandedCountries] = useState<string[]>(["DE"]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    let agencies = AGENCIES;

    if (searchQuery.trim()) {
      agencies = searchAgencies(searchQuery);
    }

    if (selectedCountry !== "all") {
      agencies = agencies.filter(a => a.countryCode === selectedCountry);
    }

    if (selectedCity !== "all") {
      agencies = agencies.filter(a => a.city === selectedCity);
    }

    return agencies;
  }, [searchQuery, selectedCountry, selectedCity]);

  // Group by country and city
  const groupedAgencies = useMemo(() => {
    const groups: Record<string, Record<string, Agency[]>> = {};
    
    filteredAgencies.forEach(agency => {
      if (!groups[agency.countryCode]) {
        groups[agency.countryCode] = {};
      }
      if (!groups[agency.countryCode][agency.city]) {
        groups[agency.countryCode][agency.city] = [];
      }
      groups[agency.countryCode][agency.city].push(agency);
    });

    return groups;
  }, [filteredAgencies]);

  // Available cities based on selected country
  const availableCities = useMemo(() => {
    if (selectedCountry === "all") {
      return [...new Set(AGENCIES.map(a => a.city))].sort();
    }
    return getCitiesForCountry(selectedCountry);
  }, [selectedCountry]);

  // Toggle country expansion
  const toggleCountry = (countryCode: string) => {
    setExpandedCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedCity("all");
  };

  // Stats
  const stats = {
    total: AGENCIES.length,
    countries: Object.keys(COUNTRIES).length,
    cities: [...new Set(AGENCIES.map(a => a.city))].length,
    filtered: filteredAgencies.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            JGA Agenturen Verzeichnis
          </h2>
          <p className="text-muted-foreground text-sm">
            {stats.total} Agenturen in {stats.countries} Ländern und {stats.cities} Städten
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(COUNTRIES).slice(0, 5).map(([code, country]) => (
            <Badge
              key={code}
              variant={selectedCountry === code ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => {
                setSelectedCountry(selectedCountry === code ? "all" : code);
                setSelectedCity("all");
              }}
            >
              {country.emoji} {getAgenciesByCountry(code).length}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Agentur, Stadt oder Land..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Country filter */}
          <Select value={selectedCountry} onValueChange={(v) => {
            setSelectedCountry(v);
            setSelectedCity("all");
          }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Land" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Länder</SelectItem>
              {Object.entries(COUNTRIES).map(([code, country]) => (
                <SelectItem key={code} value={code}>
                  {country.emoji} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City filter */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Stadt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Städte</SelectItem>
              {availableCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {(searchQuery || selectedCountry !== "all" || selectedCity !== "all") && (
            <Button variant="ghost" onClick={resetFilters} className="flex-shrink-0">
              <X className="w-4 h-4 mr-1" />
              Zurücksetzen
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode("map")}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || selectedCountry !== "all" || selectedCity !== "all") && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{filteredAgencies.length} von {stats.total} Agenturen</span>
          </div>
        )}
      </GlassCard>

      {/* Map View */}
      {viewMode === "map" && (
        <AgenciesMapView
          agencies={filteredAgencies}
          selectedCountry={selectedCountry}
          selectedCity={selectedCity !== "all" ? selectedCity : undefined}
          onCityClick={(city) => setSelectedCity(city)}
        />
      )}

      {/* Agency List */}
      {viewMode === "list" && (
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
          <div className="space-y-4 pr-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedAgencies).map(([countryCode, cities]) => {
                const country = COUNTRIES[countryCode];
                const isExpanded = expandedCountries.includes(countryCode);
                const countryAgencyCount = Object.values(cities).flat().length;

                return (
                  <motion.div
                    key={countryCode}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCountry(countryCode)}>
                      <CollapsibleTrigger asChild>
                        <GlassCard className="p-4 cursor-pointer hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{country?.emoji}</span>
                              <div>
                                <h3 className="font-display font-semibold text-lg">
                                  {country?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {countryAgencyCount} Agenturen in {Object.keys(cities).length} Städten
                                </p>
                              </div>
                            </div>
                            <ChevronDown className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                        </GlassCard>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-border space-y-4">
                          {Object.entries(cities).sort().map(([city, agencies]) => (
                            <div key={city}>
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <h4 className="font-medium">{city}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {agencies.length}
                                </Badge>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {agencies.map((agency, index) => (
                                  <motion.div
                                    key={agency.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <GlassCard className="p-4 h-full flex flex-col hover:border-primary/30 transition-colors group">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                          {agency.name}
                                        </h5>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                          {agency.description}
                                        </p>
                                      </div>

                                      <div className="space-y-1 text-xs">
                                        {agency.phone && (
                                          <a
                                            href={`tel:${agency.phone}`}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span className="truncate">{agency.phone}</span>
                                          </a>
                                        )}
                                        {agency.email && (
                                          <a
                                            href={`mailto:${agency.email}`}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{agency.email}</span>
                                          </a>
                                        )}
                                      </div>

                                      <a
                                        href={agency.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                      >
                                        <Globe className="w-3 h-3" />
                                        Website besuchen
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </GlassCard>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredAgencies.length === 0 && (
              <GlassCard className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="font-display font-semibold text-lg mb-2">
                  Keine Agenturen gefunden
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Versuche einen anderen Suchbegriff oder ändere die Filter.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Filter zurücksetzen
                </Button>
              </GlassCard>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
