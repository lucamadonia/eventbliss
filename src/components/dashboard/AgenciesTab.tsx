import { useState, useMemo, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
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
  AGENCIES as STATIC_AGENCIES,
  COUNTRIES as STATIC_COUNTRIES,
  type Agency,
  searchAgencies,
  getAgenciesByCountry,
  getCitiesForCountry,
} from "@/lib/agencies-data";
import { cn } from "@/lib/utils";
import { AgenciesMapView } from "./AgenciesMapView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Event {
  id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  honoree_name: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface AgenciesTabProps {
  event?: Event;
  participants?: Participant[];
}

export const AgenciesTab = ({ event, participants = [] }: AgenciesTabProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [expandedCountries, setExpandedCountries] = useState<string[]>(["DE"]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [dbAgencies, setDbAgencies] = useState<Agency[]>([]);

  // Load agencies from database
  useEffect(() => {
    const loadDbAgencies = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_affiliates')
          .select('*')
          .eq('status', 'active')
          .eq('is_verified', true);

        if (error) throw error;

        if (data) {
          // Convert database agencies to Agency format
          const convertedAgencies: Agency[] = data.map((dbAgency, index) => ({
            id: 1000 + index, // Offset IDs to avoid conflicts with static agencies
            country: dbAgency.agency_country,
            countryCode: getCountryCodeFromName(dbAgency.agency_country),
            city: dbAgency.agency_city,
            name: dbAgency.agency_name,
            website: '',
            phone: '',
            email: dbAgency.contact_email || '',
            description: `${dbAgency.agency_name} - ${dbAgency.agency_city}, ${dbAgency.agency_country}`,
          }));
          setDbAgencies(convertedAgencies);
        }
      } catch (err) {
        console.error('Failed to load database agencies:', err);
      }
    };

    loadDbAgencies();
  }, []);

  // Helper function to get country code from country name
  const getCountryCodeFromName = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'Deutschland': 'DE',
      'Germany': 'DE',
      'Österreich': 'AT',
      'Austria': 'AT',
      'Schweiz': 'CH',
      'Switzerland': 'CH',
      'Niederlande': 'NL',
      'Netherlands': 'NL',
      'Belgien': 'BE',
      'Belgium': 'BE',
      'Frankreich': 'FR',
      'France': 'FR',
      'Spanien': 'ES',
      'Spain': 'ES',
      'Italien': 'IT',
      'Italy': 'IT',
      'Portugal': 'PT',
      'Polen': 'PL',
      'Poland': 'PL',
      'Tschechien': 'CZ',
      'Czech Republic': 'CZ',
      'Ungarn': 'HU',
      'Hungary': 'HU',
      'Kroatien': 'HR',
      'Croatia': 'HR',
      'Griechenland': 'GR',
      'Greece': 'GR',
      'Türkei': 'TR',
      'Turkey': 'TR',
      'Vereinigtes Königreich': 'GB',
      'United Kingdom': 'GB',
      'Irland': 'IE',
      'Ireland': 'IE',
      'Dänemark': 'DK',
      'Denmark': 'DK',
      'Schweden': 'SE',
      'Sweden': 'SE',
      'Norwegen': 'NO',
      'Norway': 'NO',
      'Finnland': 'FI',
      'Finland': 'FI',
    };
    return countryMap[countryName] || 'OTHER';
  };

  // Combine static and database agencies
  const AGENCIES = useMemo(() => {
    return [...STATIC_AGENCIES, ...dbAgencies];
  }, [dbAgencies]);

  // Build dynamic COUNTRIES object including new countries from DB
  const COUNTRIES = useMemo(() => {
    const dynamicCountries: Record<string, { name: string; emoji: string }> = { ...STATIC_COUNTRIES };
    
    dbAgencies.forEach(agency => {
      if (!dynamicCountries[agency.countryCode] && agency.countryCode !== 'OTHER') {
        dynamicCountries[agency.countryCode] = {
          name: agency.country,
          emoji: getCountryEmoji(agency.countryCode),
        };
      }
    });

    return dynamicCountries;
  }, [dbAgencies]);

  // Helper function to get country emoji
  const getCountryEmoji = (countryCode: string): string => {
    const emojiMap: Record<string, string> = {
      DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', NL: '🇳🇱', BE: '🇧🇪',
      FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', PL: '🇵🇱',
      CZ: '🇨🇿', HU: '🇭🇺', HR: '🇭🇷', GR: '🇬🇷', TR: '🇹🇷',
      GB: '🇬🇧', IE: '🇮🇪', DK: '🇩🇰', SE: '🇸🇪', NO: '🇳🇴', FI: '🇫🇮',
    };
    return emojiMap[countryCode] || '🌍';
  };

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    let agencies = AGENCIES;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      agencies = agencies.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    if (selectedCountry !== "all") {
      agencies = agencies.filter(a => a.countryCode === selectedCountry);
    }

    if (selectedCity !== "all") {
      agencies = agencies.filter(a => a.city === selectedCity);
    }

    return agencies;
  }, [AGENCIES, searchQuery, selectedCountry, selectedCity]);

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

  // Track agency interaction
  const trackInteraction = async (agency: Agency, interactionType: 'phone' | 'email' | 'website') => {
    if (!event?.id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use type assertion as the table was just created and types may not be updated yet
      await (supabase.from('agency_interactions' as never) as unknown as ReturnType<typeof supabase.from>).insert({
        event_id: event.id,
        agency_id: agency.id,
        agency_name: agency.name,
        interaction_type: interactionType,
        user_id: user?.id || null,
        metadata: {
          city: agency.city,
          country: agency.countryCode,
          agency_email: agency.email,
          agency_phone: agency.phone,
          agency_website: agency.website,
        },
      } as never);
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  };

  // Handle email click with dynamic template
  const handleEmailClick = (agency: Agency) => {
    // Track the interaction
    trackInteraction(agency, 'email');

    // Fallback template if no event data available
    if (!event || !event.name) {
      const subject = encodeURIComponent(
        t('agencies.email.subjectFallback', 'Anfrage für Junggesellenabschied')
      );
      const body = encodeURIComponent(
`${t('agencies.email.greeting', 'Guten Tag')},

${t('agencies.email.fallbackIntro', 'wir planen ein Event und würden gerne Ihr Angebot anfragen.')}

${t('agencies.email.requestText', 'Bitte senden Sie uns Ihr Angebot mit verfügbaren Aktivitäten, Preisen und möglichen Terminen.')}

${t('agencies.email.closing', 'Mit freundlichen Grüßen')}`
      );
      
      window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`, '_blank');
      toast.success(t('agencies.emailTemplateOpened', 'Email-Vorlage geöffnet'));
      return;
    }

    // Generate reference code
    const refCode = `EB-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Event type labels
    const eventTypeLabels: Record<string, string> = {
      bachelor: t('createEvent.types.bachelor', 'Junggesellenabschied'),
      bachelorette: t('createEvent.types.bachelorette', 'Junggesellinnenabschied'),
      birthday: t('createEvent.types.birthday', 'Geburtstag'),
      trip: t('createEvent.types.trip', 'Gruppenreise'),
      other: t('createEvent.types.other', 'Event'),
    };

    // Participant info
    const participantNames = participants.map(p => p.name).join(', ');
    const participantCount = participants.length;
    const organizer = participants.find(p => p.role === 'organizer');

    // Format date if available
    const formattedDate = event.event_date
      ? format(parseISO(event.event_date), 'dd.MM.yyyy')
      : t('agencies.email.dateNotSet', 'Noch nicht festgelegt');

    // Build email subject
    const subject = encodeURIComponent(
      `${t('agencies.email.subjectPrefix', 'Anfrage für')} ${event.name} - Ref: ${refCode}`
    );

    // Build email body
    const body = encodeURIComponent(
`${t('agencies.email.greeting', 'Guten Tag')},

${t('agencies.email.intro', 'wir planen ein Event und würden gerne Ihr Angebot anfragen.')}

=== ${t('agencies.email.eventDetails', 'EVENT-DETAILS')} ===
${t('agencies.email.eventName', 'Event-Name')}: ${event.name}
${t('agencies.email.eventType', 'Event-Typ')}: ${eventTypeLabels[event.event_type] || 'Event'}
${t('agencies.email.honoree', 'Ehrengast')}: ${event.honoree_name}
${t('agencies.email.date', 'Datum')}: ${formattedDate}
${t('agencies.email.participants', 'Anzahl Teilnehmer')}: ${participantCount}
${participantCount > 0 && participantCount <= 10 ? `${t('agencies.email.participantNames', 'Teilnehmer')}: ${participantNames}` : ''}

=== ${t('agencies.email.request', 'ANFRAGE')} ===
${t('agencies.email.requestText', 'Bitte senden Sie uns Ihr Angebot mit verfügbaren Aktivitäten, Preisen und möglichen Terminen.')}

${t('agencies.email.referenceCode', 'Referenz-Code')}: ${refCode}

${t('agencies.email.closing', 'Mit freundlichen Grüßen')},
${organizer?.name || t('agencies.email.planningTeam', 'Das Planungsteam')}

---
${t('agencies.email.generatedBy', 'Diese Anfrage wurde über EventBliss generiert.')}
`);

    // Open mailto link
    window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success(t('agencies.emailTemplateOpened', 'Email-Vorlage geöffnet'));
  };

  // Handle phone click
  const handlePhoneClick = (agency: Agency) => {
    trackInteraction(agency, 'phone');
  };

  // Handle website click
  const handleWebsiteClick = (agency: Agency) => {
    trackInteraction(agency, 'website');
  };

  // Available cities based on selected country (dynamic)
  const availableCities = useMemo(() => {
    if (selectedCountry === "all") {
      return [...new Set(AGENCIES.map(a => a.city))].sort();
    }
    return [...new Set(AGENCIES.filter(a => a.countryCode === selectedCountry).map(a => a.city))].sort();
  }, [AGENCIES, selectedCountry]);

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
            {t('agencies.title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('agencies.stats', { total: stats.total, countries: stats.countries, cities: stats.cities })}
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
              placeholder={t('agencies.searchPlaceholder')}
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
              <SelectValue placeholder={t('agencies.country')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agencies.allCountries')}</SelectItem>
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
              <SelectValue placeholder={t('agencies.city')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agencies.allCities')}</SelectItem>
              {availableCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {(searchQuery || selectedCountry !== "all" || selectedCity !== "all") && (
            <Button variant="ghost" onClick={resetFilters} className="flex-shrink-0">
              <X className="w-4 h-4 mr-1" />
              {t('common.reset')}
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
            <span>{t('agencies.filteredOf', { filtered: filteredAgencies.length, total: stats.total })}</span>
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
                                  {t('agencies.agenciesInCities', { agencies: countryAgencyCount, cities: Object.keys(cities).length })}
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
                                            onClick={() => handlePhoneClick(agency)}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span className="truncate">{agency.phone}</span>
                                          </a>
                                        )}
                                        {agency.email && (
                                          <button
                                            onClick={() => handleEmailClick(agency)}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                          >
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{agency.email}</span>
                                          </button>
                                        )}
                                      </div>

                                      <a
                                        href={agency.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleWebsiteClick(agency)}
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                      >
                                        <Globe className="w-3 h-3" />
                                        {t('agencies.visitWebsite')}
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
                  {t('agencies.noAgencies')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('agencies.noAgenciesDesc')}
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  {t('agencies.resetFilters')}
                </Button>
              </GlassCard>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
